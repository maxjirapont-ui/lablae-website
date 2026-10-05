"use client";

import ShopContactButtons from "./ShopContactButtons";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { ArrowRight, Minus, Plus } from "lucide-react";
import { SHOP_DRAFT_KEY, clearRecentShopOrder, finishShopDraft, readRecentShopOrder, readShopDraft, saveShopDraft, type ShopAttempt } from "@/lib/shop-draft";
import { trackWebsiteAction } from "@/lib/website-analytics";
import {
  estimateShopOrder,
  getShopBundleEstimates,
  getShopBundleSuggestion,
  normalizeShopDigits,
  normalizeShopPhone,
  SHOP_MAX_PACKS,
  SHOP_PRODUCT,
  SHOP_PROMOTION,
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
    const attempt = pendingRef.current || {requestKey:Array.from(crypto.getRandomValues(new Uint8Array(24)), value=>value.toString(16).padStart(2,"0")).join(""),quantity,address:{...address,phone:normalizeShopPhone(address.phone)}};
    pendingRef.current = attempt;
    setPendingAttempt(attempt);
    saveShopDraft({quantityText:String(attempt.quantity),address:attempt.address,pending:attempt});
    const controller = new AbortController();
    const timeout = setTimeout(()=>controller.abort(),30_000);
    try {
      const response = await fetch("/api/shop/orders", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(attempt),signal:controller.signal});
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
      setSubmitError(controller.signal.aborted ? "รอนานกว่าปกติ ยังตรวจผลไม่ได้ กดลองส่งรายการเดิมอีกครั้งได้โดยไม่สั่งซ้ำ" : "เชื่อมต่อไม่สำเร็จ กดลองอีกครั้งได้ ระบบจะตรวจรายการเดิมให้โดยไม่สั่งซ้ำ"); setSending(false);
    } finally { clearTimeout(timeout); }
  }
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const [quantityText, setQuantityText] = useState(String(SHOP_PROMOTION.quantity));
  const [address, setAddress] = useState<ShopAddress>(emptyAddress);
  const [errors, setErrors] = useState<ShopAddressErrors>({});
  const locked = sending || Boolean(pendingAttempt);
  const [imageFailed, setImageFailed] = useState(false);
  const quantity = /^\d+$/.test(quantityText) ? Number(quantityText) : NaN;
  const estimate = estimateShopOrder(quantity);
  const bundleSuggestion = getShopBundleSuggestion(quantity);

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
        if (location.hash === "#review" || restored.pending) {
          requestAnimationFrame(() => {
            const summary = document.getElementById("shop-summary");
            summary?.focus({ preventScroll: true });
            summary?.scrollIntoView({ block: "center", behavior: "instant" });
          });
        }
      }
      setDraftReady(true);
    });
    return () => { active=false; };
  }, []);
  useEffect(() => {
    if (draftReady && !completed.current) saveShopDraft({quantityText,address,pending:pendingAttempt});
  }, [quantityText,address,pendingAttempt,draftReady]);
  function updateAddress(key: keyof ShopAddress, value: string) {
    markStarted();
    setAddress((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
  }

  function choosePromotion() {
    if (locked) return;
    markStarted();
    setQuantityText(String(SHOP_PROMOTION.quantity));
    requestAnimationFrame(() => {
      const field = document.getElementById("shop-quantity");
      field?.focus({ preventScroll: true });
      field?.scrollIntoView({ block: "center", behavior: "instant" });
    });
  }

  function order(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    // An uncertain request must be retried with its original saved payload.
    if (pendingAttempt) { void submitOrder(); return; }
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
        const details = field?.closest("details");
        if (details) details.open = true;
        field?.focus({ preventScroll: true });
        field?.scrollIntoView({ block: "center", behavior: "instant" });
      });
      return;
    }
    markStarted();
    trackWebsiteAction("shop_review_order");
    void submitOrder();
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
    if (!estimate) return <p role="status">กรุณาใส่จำนวนแพ็กเป็นจำนวนเต็มตั้งแต่ 1 ขึ้นไป</p>;
    return (
      <div aria-live="polite" aria-atomic="true" className="space-y-3">
        <div className="rounded-xl bg-[#f1e6d5] p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-medium">{quantity} แพ็ก · ยอดรวม</p>
            <p data-testid="shop-total" className="text-2xl font-bold">{money(estimate.estimatedSubtotalBaht ?? estimate.goodsBaht)} บาท</p>
          </div>
          <p className="mt-1 text-sm text-stone-700">{estimate.shippingBaseBaht === 0 ? "ส่งแช่แข็งฟรี" : estimate.shippingBaseBaht === null ? "ยังไม่รวมค่าส่ง · ร้านจะแจ้งก่อนชำระเงิน" : `รวมค่าส่งแช่แข็ง ${money(estimate.shippingBaseBaht)} บาทแล้ว`}</p>
        </div>
        <details className="text-sm text-stone-700">
          <summary className="cursor-pointer min-h-11 py-3 underline underline-offset-4">ดูรายละเอียดราคา</summary>
          <dl className="space-y-2 pb-2">
            <div className="flex justify-between gap-4"><dt>ไส้อั่ว {quantity} แพ็ก</dt><dd className="shrink-0">{money(estimate.goodsBeforeDiscountBaht)} บาท</dd></div>
            {estimate.discountBaht > 0 && <div className="flex justify-between gap-4"><dt>ส่วนลดโปร {SHOP_PROMOTION.quantity} แพ็ก{estimate.bundleCount > 1 && ` × ${estimate.bundleCount} ชุด`}</dt><dd className="shrink-0">−{money(estimate.discountBaht)} บาท</dd></div>}
            <div className="flex justify-between gap-4"><dt>ค่าส่งแช่แข็ง</dt><dd className="shrink-0">{estimate.shippingBaseBaht === 0 ? "ส่งฟรี" : estimate.shippingBaseBaht === null ? "รอร้านยืนยัน" : `${money(estimate.shippingBaseBaht)} บาท`}</dd></div>
          </dl>
        </details>
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
        <h1 className="text-3xl font-bold leading-snug text-primary sm:text-4xl">{SHOP_PRODUCT.name}</h1>
        <p className="mt-2 text-base text-primary/80">แพ็กละ 500 กรัม · ปรุงสุก · ซีลสูญญากาศ</p>
      </div>

      {recentOrder && <div className="mb-5 rounded-xl border border-accent/40 px-4 py-2">
        <a href={recentOrder.url} className="block min-h-11 py-2 font-bold text-accent underline">ดูออเดอร์ล่าสุด {recentOrder.number}</a>
        <details className="text-sm text-primary/80">
          <summary className="cursor-pointer min-h-11 py-3">ลิงก์ที่จำไว้ในเครื่องนี้</summary>
          <p>จำลิงก์ไว้ 30 วัน หากใช้เครื่องร่วมกับคนอื่น ลบลิงก์ได้ครับ</p>
          <button type="button" onClick={()=>{clearRecentShopOrder();setRecentOrder(null);}} className="min-h-11 rounded-lg py-2 text-accent underline focus-visible:outline-2 focus-visible:outline-offset-2">ลบลิงก์ที่จำไว้</button>
        </details>
      </div>}
      <div className="grid items-start gap-6 md:grid-cols-[1fr_1.1fr] lg:gap-10">
        <section aria-label="รายละเอียดไส้อั่ว" className="space-y-4 md:sticky md:top-24">
          <div className="rounded-2xl border border-accent/40 bg-[#f1e6d5] p-5 text-[#482a18] sm:p-6">
            <p className="text-lg font-bold">โปร {SHOP_PROMOTION.quantity} แพ็ก</p>
            <p className="mt-1 text-5xl font-bold leading-tight tracking-tight sm:text-6xl">{money(SHOP_PROMOTION.priceBaht)} <span className="text-2xl font-medium">บาท</span></p>
            <p className="mt-2 inline-flex rounded-full bg-[#653c20] px-4 py-1.5 text-lg font-bold text-white">ส่งฟรี</p>
            <p className="mt-3 text-base">แพ็กละ {money(SHOP_PRODUCT.priceBaht)} บาท</p>
          </div>
          <button type="button" onClick={choosePromotion} disabled={!hydrated || !draftReady || locked} className={`${buttonClass} inline-flex min-h-12 w-full items-center justify-center gap-2 bg-accent px-5 py-3 font-bold text-[#261810] hover:bg-accent/85`}>เลือกชุด {SHOP_PROMOTION.quantity} แพ็ก<ArrowRight size={18} aria-hidden="true" /></button>
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#f1e6d5]">
            {imageFailed ? <div className="flex h-full items-center justify-center text-stone-700">ไส้อั่วลำลำลับแล · 500 กรัม</div> : (
              <Image src={SHOP_PRODUCT.image} alt={SHOP_PRODUCT.imageAlt} fill sizes="(min-width: 1280px) 489px, (min-width: 768px) 45vw, calc(100vw - 32px)" className="object-contain" loading="eager" onError={() => setImageFailed(true)} />
            )}
          </div>
        </section>

        <form onSubmit={order} onChangeCapture={markStarted} noValidate className="space-y-5 rounded-2xl bg-[#fffaf3] p-4 text-stone-900 sm:p-6">
          <fieldset disabled={locked} className={`min-w-0 space-y-5 ${locked ? "opacity-70" : ""}`}>
            <legend className="sr-only">เลือกไส้อั่วและข้อมูลจัดส่ง</legend>
            <section aria-labelledby="shop-quantity-heading">
              <h2 id="shop-quantity-heading" tabIndex={-1} className="scroll-mt-32 text-xl font-bold outline-none sm:scroll-mt-24">เลือกจำนวน</h2>
              <fieldset className="mt-3">
                <legend className="sr-only">เลือกชุดไส้อั่ว</legend>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {bundleEstimates.map((bundle) => {
                    const selected = quantity === bundle.quantity;
                    return (
                      <label key={bundle.quantity} className={`block min-w-0 cursor-pointer rounded-xl border-2 px-2 py-3 text-center focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-amber-800 ${selected ? "border-[#653c20] bg-[#f1e6d5]" : "border-stone-300 bg-white hover:border-stone-500"}`}>
                        <input id={`shop-bundle-${bundle.quantity}`} type="radio" name="shop-bundle" value={bundle.quantity} checked={selected} onChange={() => setQuantityText(String(bundle.quantity))} aria-label={`${bundle.quantity} แพ็ก`} aria-describedby={`shop-bundle-price-${bundle.quantity}`} className="sr-only" />
                        <span className="block text-lg font-bold">{bundle.quantity} แพ็ก</span>
                        <span id={`shop-bundle-price-${bundle.quantity}`} className="mt-1 block text-lg font-bold tracking-tight text-[#653c20] sm:text-xl">{money(bundle.estimatedSubtotalBaht)} <span className="block text-sm font-normal">บาท · ส่งฟรี</span></span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <label htmlFor="shop-quantity" className="text-base">จำนวนแพ็ก</label>
                <div className="inline-flex items-center rounded-xl border border-stone-400 bg-white p-1">
                  <button type="button" aria-label="ลดจำนวน 1 แพ็ก" disabled={Boolean(estimate && quantity <= 1)} onClick={() => { markStarted(); setQuantityText(String(estimate ? Math.max(1, quantity - 1) : 1)); }} className={`${buttonClass} flex h-11 w-11 items-center justify-center hover:bg-stone-100`}><Minus size={20} aria-hidden="true" /></button>
                  <input id="shop-quantity" type="text" inputMode="numeric" value={quantityText}
                    onChange={(event) => { markStarted(); setQuantityText(normalizeShopDigits(event.target.value)); }}
                    className="h-11 w-20 rounded-lg text-center text-xl font-bold focus:outline-2 focus:outline-amber-700"
                    aria-invalid={!estimate} aria-describedby={!estimate ? "shop-quantity-hint" : undefined} />
                  <button type="button" aria-label="เพิ่มจำนวน 1 แพ็ก" disabled={Boolean(estimate && quantity >= SHOP_MAX_PACKS)} onClick={() => { markStarted(); setQuantityText(String(estimate ? Math.min(SHOP_MAX_PACKS, quantity + 1) : 1)); }} className={`${buttonClass} flex h-11 w-11 items-center justify-center hover:bg-stone-100`}><Plus size={20} aria-hidden="true" /></button>
                </div>
              </div>
              {!estimate && <p id="shop-quantity-hint" role="status" className="mt-2 text-sm text-red-800">กรุณาใส่จำนวนเต็มตั้งแต่ 1 ขึ้นไปและไม่มากเกินกว่าระบบจะคำนวณได้</p>}
              {bundleSuggestion && <p className="mt-3 text-sm text-stone-700">เพิ่มอีก {bundleSuggestion.extraPacks} แพ็ก จ่ายเพิ่ม {money(bundleSuggestion.extraTotalBaht)} บาท ส่งฟรี <button type="button" onClick={choosePromotion} className={`${buttonClass} min-h-11 px-2 py-2 font-bold text-[#653c20] underline underline-offset-4`}>เลือก 3 แพ็ก</button></p>}
            </section>

            <section aria-labelledby="shop-address-heading" className="space-y-3 border-t border-stone-200 pt-5">
              <h2 id="shop-address-heading" className="text-xl font-bold">ข้อมูลจัดส่ง</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {renderField("name", "ชื่อผู้รับ", "name", 100)}
                {renderField("phone", "เบอร์โทร", "tel-national", 20)}
              </div>
              {renderField("address", "บ้านเลขที่ ถนน / หมู่บ้าน", "address-line1", 300)}
              <div className="grid grid-cols-2 gap-3">
                {renderField("subdistrict", "ตำบล / แขวง", "address-level3", 100)}
                {renderField("district", "อำเภอ / เขต", "address-level2", 100)}
                {renderField("province", "จังหวัด", "address-level1", 100)}
                {renderField("postcode", "รหัสไปรษณีย์", "postal-code", 5)}
              </div>
              <details>
                <summary className="cursor-pointer min-h-11 py-3 text-sm text-stone-700">เพิ่มหมายเหตุ (ถ้ามี)</summary>
                <label className="sr-only" htmlFor="shop-note">หมายเหตุ</label>
                <textarea id="shop-note" rows={2} maxLength={500} value={address.note} onChange={(event) => updateAddress("note", event.target.value)} className={fieldClass} placeholder="เช่น จุดสังเกตสำหรับส่งของ" />
              </details>
            </section>
          </fieldset>

          <section id="shop-summary" tabIndex={-1} aria-label="สรุปก่อนสั่งซื้อ" className="scroll-mt-32 border-t border-stone-200 pt-5 outline-none sm:scroll-mt-24">{totals()}</section>
          {pendingAttempt && !sending && <p className="text-sm text-stone-700">ยังตรวจผลการสั่งไม่ได้ กดลองรายการเดิมก่อนแก้ข้อมูล</p>}
          {submitError && <p role="alert" className="text-red-800">{submitError}</p>}
          {Object.values(errors).some(Boolean) && <p role="alert" className="text-sm text-red-800">กรุณาตรวจช่องที่มีข้อความสีแดง</p>}
          <button type="submit" disabled={!hydrated || !draftReady || sending} className={`${buttonClass} flex w-full items-center justify-center gap-2 bg-[#653c20] px-4 py-4 text-base font-bold text-white hover:bg-[#4b2c18]`}>{sending ? "กำลังบันทึก…" : pendingAttempt ? "ลองส่งรายการเดิมอีกครั้ง" : "สั่งซื้อ · ไปชำระเงิน"}<ArrowRight size={18} aria-hidden="true" /></button>
          <p className="text-center text-sm leading-relaxed text-stone-600">ชำระผ่าน QR แล้วแนบสลิป ร้านตรวจเงินแล้วโทรนัดวันส่ง</p>
          <details className="text-sm text-stone-700">
            <summary className="cursor-pointer min-h-11 py-3">ถามวันส่ง / ติดต่อร้าน</summary>
            <ShopContactButtons light />
          </details>
          <p className="text-sm text-stone-500">ร้านใช้ชื่อ เบอร์ และที่อยู่เพื่อติดต่อและจัดส่ง</p>
          <noscript><p className="text-red-800">กรุณาเปิด JavaScript เพื่อสั่งซื้อ</p></noscript>
        </form>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <details className="rounded-2xl border border-accent/30 p-5 text-primary"><summary className="cursor-pointer py-1 text-lg font-bold">การจัดส่งและการรับสินค้า</summary><div className="mt-3 space-y-3 text-base leading-relaxed"><p>จัดส่งแบบแช่แข็ง ตั้งแต่ {SHOP_PROMOTION.freeShippingMinPacks} แพ็กส่งฟรี ส่วน 1–2 แพ็ก ค่าส่ง 200 บาท</p><p>ร้านตรวจเงินแล้วจะโทรติดต่อเรื่องจัดส่งตามเบอร์ที่ระบุในออเดอร์ ถามเรื่องพื้นที่จัดส่ง วันรับสินค้า การเก็บรักษา หรือส่วนผสมได้ก่อนสั่งครับ</p><ShopContactButtons /></div></details>
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
      </div>
    </div>
  );
}
