"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Minus, Plus, Snowflake, Truck } from "lucide-react";
import {
  estimateShopOrder,
  getShopBundleEstimates,
  getShopBundleSuggestion,
  normalizeShopDigits,
  SHOP_MAX_PACKS,
  SHOP_SHIPPING_BAHT,
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
  const router = useRouter();
  const requestKey = useRef("");
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState("");
  async function submitOrder() {
    if (sending || !estimate) return;
    setSending(true); setSubmitError("");
    if (!requestKey.current) requestKey.current = Array.from(crypto.getRandomValues(new Uint8Array(24)), value=>value.toString(16).padStart(2,"0")).join("");
    try {
      const response = await fetch("/api/shop/orders", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({requestKey:requestKey.current,quantity,address})});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "บันทึกไม่สำเร็จ");
      router.push(data.url);
    } catch (error) { setSubmitError(error instanceof Error ? error.message : "เชื่อมต่อไม่สำเร็จ กรุณาลองอีกครั้ง"); setSending(false); }
  }
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const [quantityText, setQuantityText] = useState("1");
  const [address, setAddress] = useState<ShopAddress>(emptyAddress);
  const [errors, setErrors] = useState<ShopAddressErrors>({});
  const [reviewing, setReviewing] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const quantity = /^\d+$/.test(quantityText) ? Number(quantityText) : NaN;
  const estimate = estimateShopOrder(quantity);
  const suggestion = getShopBundleSuggestion(quantity);

  useEffect(() => {
    if (!hasNavigated) return;
    const target = reviewing ? headingRef.current : document.getElementById("shop-quantity");
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: reviewing ? "start" : "center", behavior: "instant" });
  }, [reviewing, hasNavigated]);

  function updateAddress(key: keyof ShopAddress, value: string) {
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
        <p className="text-sm leading-relaxed text-stone-600">{estimate.shippingBaseBaht === null ? "สั่งเกิน 9 แพ็กได้ ร้านจะวางแผนผลิตและยืนยันค่าส่งกับรอบส่งก่อนชำระเงิน" : "ค่าส่งเหมาจ่าย 200 บาท สำหรับ 1–9 แพ็ก รอร้านยืนยันรอบส่งก่อนชำระเงิน"}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 font-thai sm:px-6 sm:py-12">
      {testing && <div className="mb-6 rounded-xl border border-accent/40 bg-wood-card px-4 py-3 text-sm leading-relaxed text-primary">
        <strong>ทดสอบระบบก่อนเปิดขาย</strong>
        <span className="block sm:inline"> ใช้ข้อมูลสมมติ รายการที่ส่งจะบันทึกในหลังบ้าน ยังไม่ต้องชำระเงิน</span>
      </div>}

      <div className="mb-8">
        <Link href="/" className="mb-5 inline-flex min-h-11 items-center gap-2 text-sm text-accent underline-offset-4 hover:underline"><ArrowLeft size={16} aria-hidden="true" /> กลับหน้าร้าน</Link>
        <p className="mb-2 text-sm text-accent">จากครัวลำลำลับแล</p>
        <h1 ref={headingRef} tabIndex={-1} className="scroll-mt-56 text-3xl font-bold leading-snug text-primary outline-none sm:text-4xl">
          {reviewing ? "ตรวจสอบรายการของคุณ" : "ไส้อั่ว ส่งถึงบ้าน"}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-primary/80">
          {reviewing ? "ตรวจรายการแล้วส่งให้ร้านยืนยันสินค้าพร้อมส่ง ยังไม่ต้องชำระเงิน" : "อร่อยจากลับแลถึงบ้านคุณ จะกินเองหรือรวมสั่งกับคนที่บ้านก็คุ้ม"}
        </p>
      </div>

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
          <p className="rounded-xl bg-amber-100 p-4 text-sm leading-relaxed text-amber-950">ร้านจะตรวจยอดสั่ง วางแผนผลิต และยืนยันรอบส่งก่อนรับเงิน เมื่อส่งคำขอแล้วจะได้เลขออเดอร์และลิงก์ติดตาม</p>
          {submitError && <p role="alert" className="text-red-800">{submitError}</p>}
          <button type="button" disabled={sending} onClick={()=>void submitOrder()} className={`${buttonClass} w-full bg-[#653c20] px-4 py-4 font-bold text-white`}>{sending ? "กำลังบันทึก…" : "ส่งคำขอสั่งซื้อ"}</button>
          <button type="button" disabled={sending} onClick={() => setReviewing(false)} className={`${buttonClass} w-full border border-stone-400 px-4 py-3 font-bold hover:bg-stone-100`}>กลับไปแก้ไขจำนวนหรือที่อยู่</button>
          <p className="text-center text-sm text-stone-600">ชื่อ เบอร์โทร และที่อยู่จะส่งให้ร้านเพื่อจัดการออเดอร์และการจัดส่ง</p>
        </section>
      ) : (
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
          <section aria-label="รายละเอียดไส้อั่ว" className="space-y-5 lg:sticky lg:top-28">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div><p className="text-sm text-primary/75">เต็มแพ็ก 500 กรัม</p><p className="mt-1 text-5xl font-bold tracking-tight text-accent">{money(SHOP_PRODUCT.priceBaht)} <span className="text-lg font-normal">บาท / แพ็ก</span></p></div>
              <span className="rounded-full border border-accent/35 px-3 py-2 text-sm text-primary">ปรุงสุก · ซีลสูญญากาศ</span>
            </div>
            <figure>
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#f1e6d5]">
                {imageFailed ? <div className="flex h-full items-center justify-center text-primary/80">ไส้อั่วลำลำลับแล · 500 กรัม</div> : (
                  <Image src={SHOP_PRODUCT.image} alt={SHOP_PRODUCT.imageAlt} fill sizes="(min-width: 1024px) 480px, 100vw" className="object-contain" loading="eager" onError={() => setImageFailed(true)} />
                )}
              </div>
              <figcaption className="mt-2 text-sm text-primary/70">ไส้อั่วลำลำลับแล · แพ็กละ 500 กรัม</figcaption>
            </figure>
            <div>
              <h2 className="text-2xl font-bold text-primary">{SHOP_PRODUCT.name}</h2>
              <p className="mt-2 leading-relaxed text-primary/85">ปรุงสุก ซีลสูญญากาศ แช่แข็งก่อนจัดส่ง</p>
            </div>
            <div className="rounded-2xl bg-[#f1e6d5] p-5 text-stone-900">
              <div className="flex items-center gap-2 text-sm font-medium text-[#653c20]"><Truck size={20} aria-hidden="true" /> รวมสั่ง ค่าส่งเท่าเดิม</div>
              <p className="mt-2 text-2xl font-bold">1–9 แพ็ก ส่ง {money(SHOP_SHIPPING_BAHT)} บาท</p>
              <p className="mt-2 leading-relaxed text-stone-700">ชวนคนที่บ้านหรือเพื่อนสั่งด้วยกัน จ่ายค่าส่งครั้งเดียวต่อออเดอร์ ส่งไปที่อยู่เดียวกัน</p>
              <p className="mt-3 flex items-center gap-2 text-sm text-stone-600"><Snowflake size={16} aria-hidden="true" /> จัดส่งแบบแช่แข็ง</p>
            </div>
            <p className="text-sm leading-relaxed text-primary/75">สั่งมากกว่า 9 แพ็กได้ เลือกจำนวนด้านล่างได้เลย ร้านจะยืนยันค่าส่งและรอบส่งให้ก่อนชำระเงิน</p>
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
          </section>

          <form onSubmit={review} noValidate className="space-y-7 rounded-2xl bg-[#fffaf3] p-5 text-stone-900 sm:p-8">
            <section aria-labelledby="shop-quantity-heading">
              <h2 id="shop-quantity-heading" className="text-xl font-bold">1. เลือกชุดที่เหมาะกับคุณ</h2>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">แพ็กละ 250 บาทเท่ากันทุกชุด ยิ่งรวมสั่ง ค่าส่งเฉลี่ยต่อแพ็กยิ่งน้อยลง</p>
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
                        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1"><span className="text-3xl font-bold tracking-tight text-[#653c20]">{money(Number(bundle.averagePerPackBaht.toFixed(2)))}</span><span className="text-sm text-stone-700">บาท / แพ็ก รวมส่ง{Number.isInteger(bundle.averagePerPackBaht) ? "" : " (เฉลี่ย)"}</span></span>
                        <span className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm"><span className="text-stone-600">สินค้า {money(bundle.goodsBaht)} + ส่ง {money(bundle.shippingBaseBaht)}</span><span className="font-bold">รวม {money(bundle.estimatedSubtotalBaht)} บาท</span></span>

                      </span>
                    </label>
                  );
                })}
              </fieldset>
              <p className="mt-5 text-sm font-medium">หรือปรับจำนวนเอง</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <label className="sr-only" htmlFor="shop-quantity">จำนวนแพ็ก</label>
                <div className="inline-flex items-center rounded-xl border border-stone-400 bg-white p-1">
                  <button type="button" aria-label="ลดจำนวน 1 แพ็ก" disabled={Boolean(estimate && quantity <= 1)} onClick={() => setQuantityText(String(estimate ? Math.max(1, quantity - 1) : 1))} className={`${buttonClass} flex h-11 w-11 items-center justify-center hover:bg-stone-100`}><Minus size={20} aria-hidden="true" /></button>
                  <input id="shop-quantity" type="text" inputMode="numeric" value={quantityText}
                    onChange={(event) => setQuantityText(normalizeShopDigits(event.target.value))}
                    className="h-11 w-28 rounded-lg text-center text-xl font-bold focus:outline-2 focus:outline-amber-700"
                    aria-invalid={!estimate} aria-describedby="shop-quantity-hint" />
                  <button type="button" aria-label="เพิ่มจำนวน 1 แพ็ก" disabled={Boolean(estimate && quantity >= SHOP_MAX_PACKS)} onClick={() => setQuantityText(String(estimate ? Math.min(SHOP_MAX_PACKS, quantity + 1) : 1))} className={`${buttonClass} flex h-11 w-11 items-center justify-center hover:bg-stone-100`}><Plus size={20} aria-hidden="true" /></button>
                </div>
                <span>แพ็ก</span>
              </div>
              <p id="shop-quantity-hint" className={`mt-2 text-sm ${estimate ? "text-stone-600" : "text-red-800"}`}>{estimate ? "พิมพ์จำนวนที่ต้องการได้เลย สั่งเกิน 9 แพ็กได้" : "กรุณาใส่จำนวนเต็มตั้งแต่ 1 ขึ้นไปและไม่มากเกินกว่าระบบจะคำนวณได้"}</p>
            </section>

            {suggestion && (
              <aside aria-label="ตัวเลือกซื้อรวม" className="rounded-xl border border-stone-300 p-4 text-sm leading-relaxed">
                <p className="font-bold">สั่งรวมกัน ค่าส่งต่อแพ็กน้อยลง</p>
                <p className="mt-1 text-stone-700">เพิ่มอีก {suggestion.extraPacks} แพ็ก ค่าสินค้าเพิ่ม {money(suggestion.extraGoodsBaht)} บาท ค่าส่งยัง {money(suggestion.shippingBaseBaht)} บาทเท่าเดิม</p>
                <p className="mt-1 text-stone-600">ยอดรวมใหม่ {money(suggestion.estimatedSubtotalBaht)} บาท รวมส่งแล้ว</p>
                <button type="button" onClick={() => {
                  setQuantityText(String(suggestion.quantity));
                  requestAnimationFrame(() => {
                    const selected = document.getElementById(`shop-bundle-${suggestion.quantity}`);
                    selected?.focus({ preventScroll: true });
                    selected?.scrollIntoView({ block: "center", behavior: "instant" });
                  });
                }} className={`${buttonClass} mt-3 min-h-11 border border-[#653c20] px-4 py-2 font-bold text-[#653c20] hover:bg-[#f1e6d5]`}>เลือก {suggestion.quantity} แพ็ก</button>
              </aside>
            )}

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
            <button type="submit" disabled={!hydrated} className={`${buttonClass} flex w-full items-center justify-center gap-2 bg-[#653c20] px-4 py-4 text-base font-bold text-white hover:bg-[#4b2c18]`}>ตรวจรายการก่อนส่ง<ArrowRight size={18} aria-hidden="true" /></button>
            <p className="text-center text-sm text-stone-600">ไม่ต้องสมัครสมาชิก · ร้านยืนยันยอดก่อนชำระ</p>
            <noscript><p className="text-red-800">กรุณาเปิด JavaScript เพื่อเลือกสินค้าและส่งคำขอสั่งซื้อ</p></noscript>
          </form>
        </div>
      )}
    </div>
  );
}
