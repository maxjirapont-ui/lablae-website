"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { ArrowRight, Minus, Plus, Snowflake } from "lucide-react";
import { SHOP_DRAFT_KEY, finishShopDraft, readRecentShopOrder, readShopDraft, saveShopDraft, type ShopAttempt } from "@/lib/shop-draft";
import { trackWebsiteAction } from "@/lib/website-analytics";
import {
  estimateShopOrder,
  getShopBundleEstimates,
  normalizeShopDigits,
  SHOP_MAX_PACKS,
  SHOP_PRODUCT,
  validateShopAddress,
  type ShopAddress,
  type ShopAddressErrors,
} from "@/lib/shop";

const money = (value: number) => new Intl.NumberFormat("th-TH-u-nu-latn").format(value);
const bundleEstimates = getShopBundleEstimates();
const fieldClass = "mt-2 w-full rounded-xl border border-stone-400 bg-white px-3 py-3 text-base text-stone-900 placeholder:text-stone-500 focus:border-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-800/25";
const buttonClass = "rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-700 transition-colors disabled:cursor-not-allowed disabled:opacity-40";
const emptyAddress: ShopAddress = {
  name: "", phone: "", address: "", subdistrict: "", district: "", province: "", postcode: "", note: "",
};
const subscribeToHydration = () => () => {};

export default function ShopPreview({testing = true}: {testing?:boolean}) {
  const pendingRef = useRef<ShopAttempt | null>(null);
  const completed = useRef(false);
  const [pendingAttempt, setPendingAttempt] = useState<ShopAttempt | null>(null);
  const [draftReady, setDraftReady] = useState(false);
  const [recentOrder, setRecentOrder] = useState<{url:string;number:string} | null>(null);
  const started = useRef(false);
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState("");
  function markStarted() {
    if (!started.current) { started.current = true; trackWebsiteAction("shop_begin_checkout"); }
  }
  async function submitOrder() {
    if (sending || !estimate) return;
    setSending(true); setSubmitError("");
    const attempt = pendingRef.current || {requestKey:Array.from(crypto.getRandomValues(new Uint8Array(24)), value=>value.toString(16).padStart(2,"0")).join(""),quantity,address};
    pendingRef.current = attempt;
    setPendingAttempt(attempt);
    saveShopDraft({quantityText:String(attempt.quantity),address:attempt.address,pending:attempt});
    try {
      const response = await fetch("/api/shop/orders", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(attempt)});
      const data = await response.json();
      if (!response.ok) {
        if (response.status >= 400 && response.status < 500) { pendingRef.current=null; setPendingAttempt(null); saveShopDraft({quantityText,address,pending:null}); }
        setSubmitError(data.error || "บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง");
        setSending(false); return;
      }
      if (typeof data.url !== "string" || !/^\/shop\/orders\/[a-f0-9]{48}$/.test(data.url)) throw new Error("Invalid response");
      completed.current = true;
      finishShopDraft(data.url,data.orderNumber);
      trackWebsiteAction("shop_order_created");
      // A full navigation keeps the public analytics script out of the private order page.
      window.location.replace(data.url);
    } catch {
      setSubmitError("เชื่อมต่อไม่สำเร็จ กดลองอีกครั้งได้ ระบบจะตรวจรายการเดิมให้โดยไม่สั่งซ้ำ"); setSending(false);
    }
  }
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const [quantityText, setQuantityText] = useState("1");
  const [address, setAddress] = useState<ShopAddress>(emptyAddress);
  const [errors, setErrors] = useState<ShopAddressErrors>({});
  const [reviewStep, setReviewing] = useState(false);
  const reviewing = reviewStep || Boolean(pendingAttempt);
  const [hasNavigated, setHasNavigated] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const quantity = /^\d+$/.test(quantityText) ? Number(quantityText) : NaN;
  const estimate = estimateShopOrder(quantity);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      let restored = null;
      try {
        restored = readShopDraft(sessionStorage.getItem(SHOP_DRAFT_KEY));
        if (!restored) sessionStorage.removeItem(SHOP_DRAFT_KEY);
        setRecentOrder(readRecentShopOrder());
      } catch { /* Storage can be disabled in a private browser. */ }
      if (restored) {
        setQuantityText(restored.quantityText); setAddress(restored.address);
        pendingRef.current=restored.pending; setPendingAttempt(restored.pending);
        setReviewing(Boolean(restored.pending) || (location.hash === "#review" && Boolean(estimateShopOrder(Number(restored.quantityText))) && !Object.keys(validateShopAddress(restored.address)).length));
      }
      setDraftReady(true);
    });
    const onBack = () => { setReviewing(location.hash === "#review"); setHasNavigated(true); };
    window.addEventListener("popstate",onBack);
    return () => { active=false; window.removeEventListener("popstate",onBack); };
  }, []);
  useEffect(() => {
    if (draftReady && !completed.current) saveShopDraft({quantityText,address,pending:pendingAttempt});
  }, [quantityText,address,pendingAttempt,draftReady]);
  function editOrder() {
    if (window.history.state?.shopReview) window.history.back();
    else { window.history.replaceState(null,"",location.pathname); setReviewing(false); }
  }

  useEffect(() => {
    if (!hasNavigated) return;
    const target = reviewing ? headingRef.current : document.getElementById("shop-quantity");
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: reviewing ? "start" : "center", behavior: "instant" });
  }, [reviewing, hasNavigated]);

  function updateAddress(key: keyof ShopAddress, value: string) {
    markStarted();
    setAddress((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
  }

  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!estimate) {
      const field = document.getElementById("shop-quantity");
      field?.focus({ preventScroll: true });
      field?.scrollIntoView({ block: "center", behavior: "instant" });
      return;
    }
    const nextErrors = validateShopAddress(address);
    setErrors(nextErrors);
    const firstError = Object.keys(nextErrors)[0];
    if (firstError) {
      // Wait for inline error messages before moving keyboard/screen-reader focus.
      requestAnimationFrame(() => {
        const field = document.getElementById(`shop-${firstError}`);
        field?.focus({ preventScroll: true });
        field?.scrollIntoView({ block: "center", behavior: "instant" });
      });
      return;
    }
    markStarted();
    trackWebsiteAction("shop_review_order");
    window.history.pushState({shopReview:true},"","#review");
    setHasNavigated(true);
    setReviewing(true);
  }

  function renderField(key: keyof ShopAddress, label: string, autoComplete: string, maxLength: number) {
    const error = errors[key];
    return (
      <div>
        <label htmlFor={`shop-${key}`} className="font-medium">{label}</label>
        <input
          id={`shop-${key}`} value={address[key]} required
          autoComplete={autoComplete} maxLength={maxLength}
          type={key === "phone" ? "tel" : "text"}
          inputMode={key === "postcode" ? "numeric" : undefined}
          onChange={(event) => updateAddress(key, ["phone", "postcode"].includes(key) ? normalizeShopDigits(event.target.value) : event.target.value)}
          className={fieldClass}
          aria-invalid={Boolean(error)} aria-describedby={error ? `shop-${key}-error` : undefined}
        />
        {error && <p id={`shop-${key}-error`} className="mt-2 text-sm text-red-800">{error}</p>}
      </div>
    );
  }

  function totals() {
    if (!estimate) return <p role="status">กรุณาระบุจำนวนแพ็กเป็นจำนวนเต็มตั้งแต่ 1 ขึ้นไปและไม่มากเกินกว่าระบบจะคำนวณได้</p>;
    return (
      <div aria-live="polite" aria-atomic="true" className="space-y-3">
        <div className="rounded-xl bg-[#f1e6d5] p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-medium">{estimate.estimatedSubtotalBaht === null ? "ค่าสินค้า" : "ยอดรวม"} {quantity} แพ็ก</p>
            <p data-testid="shop-total" className="text-2xl font-bold">{money(estimate.estimatedSubtotalBaht ?? estimate.goodsBaht)} บาท</p>
          </div>
          <p className="mt-1 text-sm text-stone-700">{estimate.estimatedSubtotalBaht === null ? "ยังไม่รวมค่าส่ง · ร้านจะแจ้งก่อนชำระเงิน" : "รวมค่าส่งแช่แข็งแล้ว"}</p>
          {quantity > 1 && estimate.estimatedSubtotalBaht !== null && <p className="mt-2 text-sm text-stone-700">เฉลี่ยประมาณ {money(Number((estimate.estimatedSubtotalBaht / quantity).toFixed(2)))} บาท / แพ็ก รวมส่ง</p>}
        </div>
        <dl className="space-y-2 text-sm text-stone-700">
          <div className="flex justify-between gap-4"><dt>ไส้อั่ว {quantity} แพ็ก</dt><dd>{money(estimate.goodsBaht)} บาท</dd></div>
          <div className="flex justify-between gap-4"><dt>ค่าส่งแช่แข็ง</dt><dd className="shrink-0">{estimate.shippingBaseBaht === null ? "รอร้านยืนยัน" : `${money(estimate.shippingBaseBaht)} บาท`}</dd></div>
        </dl>
        <p className="text-sm leading-relaxed text-stone-600">{estimate.shippingBaseBaht === null ? "เกิน 20 แพ็ก ร้านแจ้งค่าส่งก่อนชำระ" : "1–9 แพ็ก ส่ง 200 บาท · 10–20 แพ็ก ส่ง 400 บาท"}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 font-thai sm:px-6 sm:py-8">
      {testing && <div className="mb-6 rounded-xl border border-accent/40 bg-wood-card px-4 py-3 text-sm leading-relaxed text-primary">
        <strong>ทดสอบระบบก่อนเปิดขาย</strong>
        <span className="block sm:inline"> ใช้ข้อมูลสมมติ รายการที่ส่งจะบันทึกในหลังบ้าน ยังไม่ต้องชำระเงิน</span>
      </div>}

      <div className="mb-5">
        <p className="mb-2 text-sm text-accent">จากครัวลำลำลับแล</p>
        <h1 ref={headingRef} tabIndex={-1} className="scroll-mt-24 text-3xl font-bold leading-snug text-primary outline-none sm:text-4xl">
          {reviewing ? "ตรวจสอบรายการของคุณ" : "ไส้อั่ว ส่งถึงบ้าน"}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-primary/80">
          {reviewing ? (estimate?.shippingBaseBaht === null ? "ตรวจรายการ แล้วส่งให้ร้านแจ้งค่าส่ง" : "ตรวจรายการ แล้วไปชำระเงิน") : "อร่อยจากลับแลถึงบ้านคุณ จะกินเองหรือรวมสั่งกับคนที่บ้านก็คุ้ม"}
        </p>
      </div>

      {recentOrder && !reviewing && <a href={recentOrder.url} className="mb-5 block rounded-xl border border-accent/40 px-4 py-3 text-accent">กลับไปดูออเดอร์ล่าสุด {recentOrder.number}</a>}
      {reviewing && estimate ? (
        <section aria-label="สรุปรายการ" className="mx-auto max-w-2xl space-y-6 rounded-2xl bg-[#fffaf3] p-5 text-stone-900 sm:p-8">
          <div className="flex items-center gap-4 border-b border-stone-200 pb-5">
            <Snowflake className="shrink-0 text-sky-800" aria-hidden="true" />
            <div><h2 className="text-xl font-bold">{SHOP_PRODUCT.name} {quantity} แพ็ก</h2><p className="mt-1 text-stone-600">แพ็กละ 500 กรัม · จัดส่งแช่แข็ง</p></div>
          </div>
          {totals()}
          <div className="break-words border-t border-stone-200 pt-5">
            <h2 className="mb-2 font-bold">ข้อมูลผู้รับ</h2>
            <p>{address.name}</p><p className="mt-1">โทร. {address.phone}</p>
            <p className="mt-2 whitespace-pre-wrap leading-relaxed">{address.address}<br />{address.subdistrict} · {address.district}<br />{address.province} {address.postcode}</p>
            {address.note.trim() && <p className="mt-3 whitespace-pre-wrap text-stone-600">หมายเหตุ: {address.note}</p>}
          </div>
          <p className="rounded-xl bg-amber-100 p-4 text-sm leading-relaxed text-amber-950">{estimate.shippingBaseBaht === null ? "ร้านจะโทรแจ้งค่าส่งตามจำนวนและที่อยู่ของคุณก่อนชำระเงิน" : "ชำระผ่าน QR แล้วแนบสลิป ร้านตรวจเงินแล้วโทรติดต่อเรื่องจัดส่ง"}</p>
          {pendingAttempt && !sending && <p className="text-sm text-stone-700">มีรายการที่รอตรวจผลการส่ง กดลองอีกครั้งเพื่อเปิดออเดอร์เดิมก่อนแก้ไขข้อมูล</p>}
          {submitError && <p role="alert" className="text-red-800">{submitError}</p>}
          <button type="button" disabled={sending} onClick={()=>void submitOrder()} className={`${buttonClass} w-full bg-[#653c20] px-4 py-4 font-bold text-white`}>{sending ? "กำลังบันทึก…" : pendingAttempt ? "ลองส่งรายการเดิมอีกครั้ง" : estimate.shippingBaseBaht === null ? "ส่งออเดอร์ให้ร้านแจ้งค่าส่ง" : "สั่งซื้อและดูช่องทางชำระเงิน"}</button>
          <button type="button" disabled={sending || Boolean(pendingAttempt)} onClick={editOrder} className={`${buttonClass} w-full border border-stone-400 px-4 py-3 font-bold hover:bg-stone-100`}>กลับไปแก้ไขจำนวนหรือที่อยู่</button>
          <p className="text-center text-sm text-stone-600">ชื่อ เบอร์โทร และที่อยู่จะส่งให้ร้านเพื่อจัดการออเดอร์และการจัดส่ง</p>
        </section>
      ) : (
        <div className="grid items-start gap-8 md:grid-cols-[1fr_1.1fr] lg:gap-12">
          <section aria-label="รายละเอียดไส้อั่ว" className="space-y-4 md:sticky md:top-24">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div><p className="text-sm text-primary/75">เต็มแพ็ก 500 กรัม</p><p className="mt-1 text-5xl font-bold tracking-tight text-accent">{money(SHOP_PRODUCT.priceBaht)} <span className="text-lg font-normal">บาท / แพ็ก</span></p></div>
              <span className="rounded-full border border-accent/35 px-3 py-2 text-sm text-primary">ปรุงสุก · ซีลสูญญากาศ</span>
            </div>
            <a href="#shop-quantity-heading" onClick={markStarted} className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-accent px-5 py-3 font-bold text-[#261810] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">เลือกจำนวนและดูยอดรวม</a>
            <figure>
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#f1e6d5]">
                {imageFailed ? <div className="flex h-full items-center justify-center text-stone-700">ไส้อั่วลำลำลับแล · 500 กรัม</div> : (
                  <Image src={SHOP_PRODUCT.image} alt={SHOP_PRODUCT.imageAlt} fill sizes="(min-width: 1024px) 480px, 100vw" className="object-contain" loading="eager" onError={() => setImageFailed(true)} />
                )}
              </div>
              <figcaption className="mt-2 text-sm text-primary/70">ไส้อั่วลำลำลับแล · แพ็กละ 500 กรัม</figcaption>
            </figure>
            <p className="text-sm leading-relaxed text-primary/80">ส่งแช่แข็ง · 1–9 แพ็ก ค่าส่ง 200 บาท · 10–20 แพ็ก 400 บาท</p>
          </section>

          <form onSubmit={review} onChangeCapture={markStarted} noValidate className="space-y-7 rounded-2xl bg-[#fffaf3] p-5 text-stone-900 sm:p-8">
            <section aria-labelledby="shop-quantity-heading">
              <h2 id="shop-quantity-heading" tabIndex={-1} className="scroll-mt-24 text-xl font-bold outline-none">1. เลือกจำนวนแพ็ก</h2>
              <p className="mt-2 text-sm text-stone-600">เริ่มได้ตั้งแต่ 1 แพ็ก · 450 บาทรวมส่ง</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <label className="sr-only" htmlFor="shop-quantity">จำนวนแพ็ก</label>
                <div className="inline-flex items-center rounded-xl border border-stone-400 bg-white p-1">
                  <button type="button" aria-label="ลดจำนวน 1 แพ็ก" disabled={Boolean(estimate && quantity <= 1)} onClick={() => { markStarted(); setQuantityText(String(estimate ? Math.max(1, quantity - 1) : 1)); }} className={`${buttonClass} flex h-11 w-11 items-center justify-center hover:bg-stone-100`}><Minus size={20} aria-hidden="true" /></button>
                  <input id="shop-quantity" type="text" inputMode="numeric" value={quantityText}
                    onChange={(event) => { markStarted(); setQuantityText(normalizeShopDigits(event.target.value)); }}
                    className="h-11 w-28 rounded-lg text-center text-xl font-bold focus:outline-2 focus:outline-amber-700"
                    aria-invalid={!estimate} aria-describedby="shop-quantity-hint" />
                  <button type="button" aria-label="เพิ่มจำนวน 1 แพ็ก" disabled={Boolean(estimate && quantity >= SHOP_MAX_PACKS)} onClick={() => { markStarted(); setQuantityText(String(estimate ? Math.min(SHOP_MAX_PACKS, quantity + 1) : 1)); }} className={`${buttonClass} flex h-11 w-11 items-center justify-center hover:bg-stone-100`}><Plus size={20} aria-hidden="true" /></button>
                </div>
                <span>แพ็ก</span>
              </div>
              <p id="shop-quantity-hint" className={`mt-2 text-sm ${estimate ? "text-stone-600" : "text-red-800"}`}>{estimate ? "พิมพ์จำนวนที่ต้องการได้เลย" : "กรุณาใส่จำนวนเต็มตั้งแต่ 1 ขึ้นไปและไม่มากเกินกว่าระบบจะคำนวณได้"}</p>
              <details className="mt-4"><summary className="cursor-pointer py-3 font-medium text-[#653c20]">ชุดรวมสั่ง 3 / 5 / 9 แพ็ก · ดูราคา</summary>
              <fieldset className="mt-5 space-y-3" aria-describedby="shop-bundles-hint">
                <legend className="sr-only">เลือกชุดไส้อั่ว</legend>
                <p id="shop-bundles-hint" className="mb-3 text-sm leading-relaxed text-stone-700">ราคาด้านล่างรวมค่าส่ง 200 บาทแล้ว</p>
                {bundleEstimates.map((bundle) => {
                  const selected = quantity === bundle.quantity;
                  return (
                    <label key={bundle.quantity} className={`block cursor-pointer rounded-xl border-2 p-4 transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-amber-800 ${selected ? "border-[#653c20] bg-[#f1e6d5]" : "border-stone-300 bg-white hover:border-stone-500"}`}>
                      <span className="flex flex-wrap items-center justify-between gap-2">
                        <span className="flex items-center gap-3">
                          <input id={`shop-bundle-${bundle.quantity}`} type="radio" name="shop-bundle" value={bundle.quantity} checked={selected} onChange={() => setQuantityText(String(bundle.quantity))} aria-label={`${bundle.title} ${bundle.quantity} แพ็ก`} aria-describedby={`shop-bundle-price-${bundle.quantity}`} className="h-5 w-5 shrink-0 accent-[#653c20]" />
                          <span className="text-lg font-bold">{bundle.title} · {bundle.quantity} แพ็ก</span>
                        </span>
                        {bundle.recommended && <span className="rounded-full bg-[#653c20] px-2.5 py-1 text-xs font-bold text-white">ชุดแนะนำ</span>}
                      </span>
                      <span id={`shop-bundle-price-${bundle.quantity}`} className="mt-3 block">
                        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1"><span className="text-3xl font-bold tracking-tight text-[#653c20]">{money(bundle.estimatedSubtotalBaht)}</span><span className="text-sm text-stone-700">บาท รวมส่งแล้ว</span></span>
                        <span className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm"><span className="text-stone-600">สินค้า {money(bundle.goodsBaht)} + ส่ง {money(bundle.shippingBaseBaht)}</span><span className="text-stone-600">เฉลี่ย {money(Number(bundle.averagePerPackBaht.toFixed(2)))} บาท / แพ็ก</span></span>

                      </span>
                    </label>
                  );
                })}
              </fieldset>
              </details>
            </section>

            <section aria-label="ยอดรวมก่อนกรอกที่อยู่" className="border-t border-stone-200 pt-6">{totals()}</section>

            <section aria-labelledby="shop-address-heading" className="space-y-4 border-t border-stone-200 pt-6">
              <h2 id="shop-address-heading" className="text-xl font-bold">2. ส่งให้ใคร ที่ไหน</h2>
              <p className="text-sm text-stone-600">ร้านใช้ข้อมูลนี้เพื่อติดต่อเรื่องออเดอร์และจัดส่งสินค้า</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {renderField("name", "ชื่อผู้รับ", "name", 100)}
                {renderField("phone", "เบอร์โทรศัพท์", "tel-national", 20)}
              </div>
              {renderField("address", "บ้านเลขที่ ถนน / หมู่บ้าน", "address-line1", 300)}
              <div className="grid gap-4 sm:grid-cols-2">
                {renderField("subdistrict", "ตำบล / แขวง", "address-level3", 100)}
                {renderField("district", "อำเภอ / เขต", "address-level2", 100)}
                {renderField("province", "จังหวัด", "address-level1", 100)}
                {renderField("postcode", "รหัสไปรษณีย์", "postal-code", 5)}
              </div>
              <div>
                <label htmlFor="shop-note" className="font-medium">หมายเหตุ <span className="font-normal text-stone-600">(ไม่บังคับ)</span></label>
                <textarea id="shop-note" rows={2} maxLength={500} value={address.note} onChange={(event) => updateAddress("note", event.target.value)} className={fieldClass} placeholder="เช่น จุดสังเกตสำหรับส่งของ" />
              </div>
            </section>
            {estimate && <p className="border-t border-stone-200 pt-5 text-center font-bold">{quantity} แพ็ก · {estimate.estimatedSubtotalBaht === null ? "ค่าสินค้า" : "ยอดรวม"} {money(estimate.estimatedSubtotalBaht ?? estimate.goodsBaht)} บาท{estimate.estimatedSubtotalBaht === null && " · ยังไม่รวมค่าส่ง"}</p>}
            {Object.values(errors).some(Boolean) && <p role="alert" className="text-sm text-red-800">กรุณาตรวจข้อมูลในช่องที่มีข้อความสีแดง</p>}
            <button type="submit" disabled={!hydrated || !draftReady} className={`${buttonClass} flex w-full items-center justify-center gap-2 bg-[#653c20] px-4 py-4 text-base font-bold text-white hover:bg-[#4b2c18]`}>ตรวจรายการก่อนส่ง<ArrowRight size={18} aria-hidden="true" /></button>
            <p className="text-center text-sm text-stone-600">ไม่ต้องสมัครสมาชิก · เก็บร่างไว้ในแท็บนี้ชั่วคราว</p>
            <noscript><p className="text-red-800">กรุณาเปิด JavaScript เพื่อเลือกสินค้าและสั่งซื้อและดูช่องทางชำระเงิน</p></noscript>
          </form>
        </div>
      )}
      {!reviewing && <div className="mt-8 grid gap-4 md:grid-cols-2">
        <details className="rounded-2xl border border-accent/30 p-5 text-primary"><summary className="cursor-pointer py-1 text-lg font-bold">การจัดส่งและการรับสินค้า</summary><div className="mt-3 space-y-3 text-sm leading-relaxed"><p>จัดส่งแบบแช่แข็ง ร้านตรวจเงินแล้วจะโทรติดต่อเรื่องจัดส่งตามเบอร์ที่ระบุในออเดอร์</p><p>เกิน 20 แพ็ก ร้านจะแจ้งค่าส่งก่อนชำระเงิน หากต้องการเช็กพื้นที่หรือกำหนดวันรับสินค้า โทร <a className="underline" href="tel:0956283125">095-628-3125</a></p><p>สอบถามเรื่องการเก็บรักษา อายุสินค้า หรือส่วนผสมเพิ่มเติมได้ทางโทรศัพท์ก่อนสั่ง</p></div></details>
            <details className="rounded-2xl border border-accent/30 p-5 text-primary">
              <summary className="cursor-pointer text-lg font-bold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">อุ่นไส้อั่วที่บ้าน</summary>
              <div className="mt-4 space-y-5 text-sm leading-relaxed text-primary/85">
                <div className="rounded-xl bg-[#f1e6d5] p-4 text-stone-900">
                  <p className="font-bold">สำหรับไส้อั่วปรุงสุกที่คลายแข็งแล้ว</p>
                  <p className="mt-1">อุ่นครั้งละประมาณ 125 กรัม หรือ ¼ แพ็ก แบ่งเป็น 2–3 ท่อน วางไม่ซ้อนกัน หากจะทานทั้งแพ็ก ให้แบ่งอุ่นเป็นรอบ</p>
                  <p className="mt-2 text-xs">ตัวเลขด้านล่างเป็นเวลาเริ่มต้นโดยประมาณสำหรับตรวจความร้อน ไม่ใช่เวลารับรองว่าพร้อมทาน และยังไม่ได้ทดสอบกับไส้อั่วของร้าน</p>
                </div>
                <div>
                  <h3 className="font-bold text-primary">เตรียมก่อนอุ่น</h3>
                  <p className="mt-1">ย้ายจากช่องแช่แข็งลงช่องเย็นไม่เกิน 4°C จนคลายแข็งทั่วถึง ไม่วางละลายบนโต๊ะ นำออกจากถุงก่อนอุ่นทุกวิธี เวลานี้ไม่ใช้กับไส้อั่วที่ยังแข็งเป็นน้ำแข็ง</p>
                </div>
                <div className="space-y-3">
                  <article className="rounded-xl border border-accent/30 bg-[#fffaf3] p-4 text-stone-900">
                    <h3 className="text-lg font-bold">หม้อทอดไร้น้ำมัน</h3>
                    <p className="mt-2 text-3xl font-bold text-[#653c20]">175°C <span className="text-base font-medium">· เริ่มตรวจที่ 5 นาที</span></p>
                    <p className="mt-2">อุ่นเครื่องก่อน วางไส้อั่วชั้นเดียว กลับด้านประมาณครึ่งเวลา หากตรงกลางยังไม่ถึง 74°C ให้อุ่นต่อครั้งละ 1 นาทีแล้ววัดซ้ำ ถ้าผิวเข้มเร็วให้ลดความร้อน</p>
                  </article>
                  <article className="rounded-xl border border-accent/30 bg-[#fffaf3] p-4 text-stone-900">
                    <h3 className="text-lg font-bold">ไมโครเวฟ</h3>
                    <p className="mt-2 text-3xl font-bold text-[#653c20]">800 วัตต์ <span className="text-base font-medium">· เริ่มที่ 1 นาที 30 วินาที</span></p>
                    <p className="mt-2">ใส่จานและฝาครอบสำหรับไมโครเวฟที่ระบายไอน้ำได้ อุ่น 45 วินาที กลับด้าน แล้วอุ่นอีก 45 วินาที พักโดยครอบฝา 1 นาทีแล้ววัด หากยังไม่ถึง 74°C ให้อุ่นเพิ่มครั้งละ 30 วินาที พักและวัดซ้ำ</p>
                  </article>
                  <article className="rounded-xl border border-accent/30 bg-[#fffaf3] p-4 text-stone-900">
                    <h3 className="text-lg font-bold">กระทะมีฝา</h3>
                    <p className="mt-2 text-3xl font-bold text-[#653c20]">ไฟกลาง <span className="text-base font-medium">· เริ่มตรวจที่ 6 นาที</span></p>
                    <p className="mt-2">เติมน้ำสูงประมาณ 1 ซม. ตั้งให้เดือดเบา ๆ ใส่ไส้อั่วแล้วปิดฝา ลดไฟให้น้ำเดือดอ่อน กลับด้านช่วงกลาง หากยังไม่ถึง 74°C ให้อุ่นต่อครั้งละ 1 นาทีแล้ววัดซ้ำ อย่าปล่อยให้น้ำแห้ง</p>
                  </article>
                </div>
                <p className="rounded-xl bg-[#f1e6d5] p-4 text-stone-900"><strong>ก่อนทาน: ตรงกลางต้องถึง 74°C</strong><br />ใช้เทอร์โมมิเตอร์อาหารวัดกลางส่วนที่หนาที่สุดและหลายจุดทุกครั้ง รวมถึงหลังพักเมื่อใช้ไมโครเวฟ อุ่นต่อจนถึง 74°C ทั่วถึง แม้ครบเวลาที่ระบุแล้ว สีผิวและไอน้ำอย่างเดียวใช้ยืนยันไม่ได้</p>
                <p className="text-xs text-primary/70">เวลาเริ่มต้นประเมินจากคำแนะนำไส้กรอกปรุงสุกของผู้ผลิตอื่น โดยปรับเวลาไมโครเวฟตามน้ำหนักและกำลังเครื่องอย่างคร่าว ๆ ความหนา สูตรอาหาร และเครื่องต่างกันทำให้เวลาจริงต่างกัน จึงต้องวัดอุณหภูมิอาหารประกอบ</p>
                <p className="text-xs text-primary/70">อ้างอิง: <a href="https://ask.fsis.usda.gov/article/How-do-I-reheat-leftovers-safely" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">USDA: การอุ่นอาหาร</a> · <a href="https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/freezing-and-food-safety" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">การละลายอาหารแช่แข็ง</a> · <a href="https://johnsonville.com/products/smoked-brats/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">คำแนะนำผู้ผลิตไส้กรอกปรุงสุก</a></p>
              </div>
            </details>
      </div>}
    </div>
  );
}
