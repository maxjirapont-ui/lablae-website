"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUS, parsePaymentQr, type ShopOrder } from "@/lib/shop-order-types";
import type { ShopPaymentConfig } from "@/lib/shop-payment";
import type { ShopSlip } from "@/lib/shop-slips";
import { getShopShippingBaht, type ShopAddress } from "@/lib/shop";

const field = "block w-full bg-white text-stone-900 border border-stone-400 rounded-xl px-3 py-3 mt-2";
const button = "px-4 py-3 rounded-xl border border-accent text-accent disabled:opacity-40";

function orderTimestamp(value: string) {
  return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value) ? `${value.replace(" ", "T")}Z` : value;
}

function orderTime(value: string) {
  const date = new Date(orderTimestamp(value));
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(date);
}

export default function ShopOrderAdmin({order, paymentConfig, slips=[], onSaved}: {order:ShopOrder; paymentConfig?:ShopPaymentConfig; slips?:ShopSlip[]; onSaved?:(message:string)=>void}) {
  const savedQr = parsePaymentQr(order.payment_qr_json);
  const qr = savedQr || paymentConfig;
  const [useQr, setUseQr] = useState(Boolean(qr && (order.payment_qr_json || !order.payment_instructions)));
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmPayment, setConfirmPayment] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const flatShipping = getShopShippingBaht(order.quantity);
  const address = JSON.parse(order.address_json) as ShopAddress;
  const total = order.shipping_baht === null ? null : order.goods_baht + order.shipping_baht;
  const money = (value: number) => value.toLocaleString("th-TH");
  const latestSlip = slips.reduce<ShopSlip | undefined>((latest, slip) => !latest || slip.id > latest.id ? slip : latest, undefined);
  const readableSlips = slips.filter(slip=>slip.readable !== false);
  const unreadableCount = slips.length - readableSlips.length;
  async function send(action:string, values:Record<string,unknown> = {}) {
    if (busy) return;
    setBusy(true); setError("");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch("/api/admin/shop-orders",{method:"POST",headers:{"Content-Type":"application/json"},signal:controller.signal,body:JSON.stringify({id:order.id,version:order.version,action,...values})});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "บันทึกไม่สำเร็จ");
      onSaved?.(`ออเดอร์ LL-${order.id} · ${action === "paid" ? "ยืนยันรับเงินแล้ว" : action === "ship" ? "บันทึกการจัดส่งแล้ว" : action === "cancel" ? "ยกเลิกแล้ว" : "แจ้งยอดให้ลูกค้าแล้ว"}`);
      router.refresh();
    } catch(error) { setError(controller.signal.aborted ? "รอนานกว่าปกติ ยังตรวจผลไม่ได้ กรุณาโหลดรายการล่าสุดเพื่อตรวจสถานะก่อนลองอีกครั้ง" : error instanceof TypeError ? "เชื่อมต่อไม่สำเร็จ กรุณาโหลดรายการล่าสุดเพื่อตรวจสถานะก่อนลองอีกครั้ง" : error instanceof Error ? error.message : "เชื่อมต่อไม่สำเร็จ"); }
    finally { clearTimeout(timeout); setBusy(false); }
  }
  function quote(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void send("quote", {paymentMethod:useQr ? "qr" : "manual", paymentQrFilename:qr?.filename, shippingBaht:Number(data.get("shipping")),paymentInstructions:data.get("payment"),dispatchNote:data.get("dispatch"),confirmed:data.get("confirmed")==="on"});
  }
  const quoteForm = (<form onSubmit={quote} className="space-y-4 border-t border-accent/20 pt-4">
      <label className="block">ค่าส่ง (บาท)<input name="shipping" type="number" min="0" max="5000" step="1" required readOnly={flatShipping !== null} defaultValue={flatShipping ?? order.shipping_baht ?? ""} className={field}/></label>
      {flatShipping !== null && <p className="text-sm text-primary/75">ค่าส่งตามจำนวน: 1–9 แพ็ก 200 บาท · 10–20 แพ็ก 400 บาท</p>}
      {flatShipping === null && <p className="text-sm text-primary/75">ออเดอร์มากกว่า 20 แพ็ก: วางแผนผลิต แล้วกรอกค่าส่งและรอบส่งที่ยืนยันได้ก่อนแจ้งลูกค้าชำระเงิน</p>}
      <label className="block">ขนส่งและรอบส่งที่ยืนยัน<textarea name="dispatch" required maxLength={500} defaultValue={order.dispatch_note} className={field} placeholder="เช่น ชื่อขนส่งและวันที่ส่งที่ตกลงกับลูกค้า"/></label>
      {qr && <label className="flex items-start gap-3"><input type="checkbox" checked={useQr} onChange={event=>setUseQr(event.target.checked)} className="mt-1 h-5 w-5 shrink-0"/>ใช้ QR พร้อมเพย์ · {qr.recipient}</label>}
      {!useQr && <label className="block">ช่องทางรับเงินและชื่อบัญชี<textarea name="payment" required minLength={10} maxLength={1000} defaultValue={order.payment_instructions} className={field} placeholder="กรอกบัญชีหรือพร้อมเพย์ของร้านที่ตรวจแล้ว ข้อความนี้จะแสดงให้ลูกค้า"/></label>}
      <label className="flex gap-3 items-start"><input type="checkbox" name="confirmed" required className="mt-1 h-5 w-5 shrink-0"/>ตรวจสินค้าพร้อมส่ง พื้นที่จัดส่ง ค่าส่งรวม และบัญชีรับเงินแล้ว</label>
      <button disabled={busy} className={button}>ยืนยันยอดให้ลูกค้า</button>
    </form>);
  return <section id={`order-${order.id}`} className="rounded-2xl border border-accent/30 p-5 space-y-4">
    <div className="flex flex-wrap justify-between gap-3"><h2 className="text-xl font-bold">LL-{order.id} · {order.quantity} แพ็ก</h2><span className="text-accent">{order.status === "quoted" && slips.length > 0 ? "ได้รับสลิปแล้ว · รอตรวจเงิน" : ORDER_STATUS[order.status]}</span></div>
    <div className="space-y-1 text-base text-primary/75">
      <p>สั่งเมื่อ <time dateTime={orderTimestamp(order.created_at)}>{orderTime(order.created_at)}</time></p>
      {latestSlip && <p>รับสลิปล่าสุด <time dateTime={orderTimestamp(latestSlip.created_at)}>{orderTime(latestSlip.created_at)}</time></p>}
    </div>
    <p>{address.name} · <a href={`tel:${order.phone}`} className="underline">{order.phone}</a></p>
    <p className="whitespace-pre-wrap break-words">{address.address}<br/>{address.subdistrict} {address.district} {address.province} {address.postcode}</p>
    {address.note && <p className="break-words">หมายเหตุ: {address.note}</p>}
    <dl className="rounded-xl border border-accent/30 p-4 space-y-3">
      <div><dt className="text-primary/75">{total === null ? "ค่าสินค้า ยังไม่รวมค่าส่ง" : "ยอดรวม"}</dt><dd className="text-xl font-bold text-accent">{money(total ?? order.goods_baht)} บาท</dd><dd className="text-base text-primary/75">ค่าสินค้า {money(order.goods_baht)} บาท · ค่าส่ง {order.shipping_baht === null ? "รอยืนยัน" : `${money(order.shipping_baht)} บาท`}</dd></div>
      <div><dt className="text-primary/75">{savedQr ? "ชื่อผู้รับเงินตาม QR" : "ช่องทางและชื่อผู้รับเงิน"}</dt><dd className="whitespace-pre-wrap break-words">{savedQr?.recipient || order.payment_instructions || "ยังไม่ยืนยันช่องทางรับเงิน"}</dd></div>
      <div><dt className="text-primary/75">ขนส่งและรอบส่งที่ตกลงไว้</dt><dd className="whitespace-pre-wrap break-words">{order.dispatch_note || "ยังไม่ได้ระบุรอบส่ง"}</dd></div>
    </dl>
    {slips.length>0 && <div className="border rounded-xl p-4 space-y-2"><h3 className="font-bold">สลิปจากลูกค้า {slips.length} ไฟล์</h3><p>ตรวจเงินเข้าบัญชีจริงก่อนกดยืนยันรับเงิน</p>
      {unreadableCount > 0 && <p className="rounded-xl border border-accent/60 p-3">มีสลิปที่เปิดไม่ได้ {unreadableCount} ไฟล์ ลูกค้าอาจโอนเงินมาแล้ว ให้ตรวจเงินเข้าบัญชีจริงและขอให้ลูกค้าส่งสลิปที่เปิดได้อีกครั้ง</p>}
      {readableSlips.map(slip=><a key={slip.id} href={`/api/admin/shop-orders/${order.id}/slip/${slip.id}`} target="_blank" rel="noreferrer" className="block text-accent underline py-2">เปิดสลิป #{slip.id}</a>)}
    </div>}
    <a href={`/shop/orders/${order.token}`} target="_blank" rel="noreferrer" className="inline-block text-accent underline py-2">เปิดหน้าติดตามของลูกค้า</a>

    {order.status === "quoted" && <div className="space-y-3 border-t border-accent/20 pt-4">
      <label className="flex gap-3 items-start"><input type="checkbox" checked={confirmPayment} onChange={e=>setConfirmPayment(e.target.checked)} className="mt-1 h-5 w-5 shrink-0"/>ตรวจเงินเข้าบัญชีจริงครบ {money(total ?? order.goods_baht)} บาทแล้ว</label>
      <button disabled={busy || !confirmPayment} className={button} onClick={()=>void send("paid",{confirmed:confirmPayment})}>ยืนยันรับเงินแล้ว</button>
    </div>}
    {order.status === "paid" && <form className="space-y-3" onSubmit={event=>{event.preventDefault();void send("ship",{tracking:new FormData(event.currentTarget).get("tracking")});}}>
      <label className="block">ชื่อขนส่งและเลขพัสดุ<input name="tracking" required minLength={4} maxLength={200} className={field}/></label>
      <button disabled={busy} className={button}>บันทึกการจัดส่ง</button>
    </form>}
    {order.status === "requested" && quoteForm}
    {order.status === "quoted" && <details className="border-t border-accent/20 pt-3"><summary className="cursor-pointer py-3 text-sm">แก้ไขยอดหรือข้อมูลจัดส่ง</summary>{quoteForm}</details>}
    {order.tracking && <p className="break-words">จัดส่ง: {order.tracking}</p>}
    {["requested","quoted"].includes(order.status) && <details className="border-t border-accent/20 pt-3" onToggle={event=>{if(!event.currentTarget.open)setConfirmCancel(false);}}>
      <summary className="cursor-pointer py-3">ยกเลิกออเดอร์</summary>
      <div className="space-y-3 pt-2">
        <p className="font-bold">ออเดอร์ LL-{order.id} · {total === null ? `ค่าสินค้า ${money(order.goods_baht)} บาท ยังไม่รวมค่าส่ง` : `ยอดรวม ${money(total)} บาท`}</p>
        {slips.length > 0 && <>
          <p className="rounded-xl border border-accent/60 p-3">ออเดอร์นี้มีสลิปแล้ว {slips.length} ไฟล์ ลูกค้าอาจโอนเงินมาแล้ว ตรวจเงินเข้าบัญชีจริงก่อนยกเลิก หากมีเงินเข้า ให้ตกลงและจัดการคืนเงินกับลูกค้าก่อน</p>
          <label className="flex items-start gap-3"><input type="checkbox" checked={confirmCancel} onChange={event=>setConfirmCancel(event.target.checked)} className="mt-1 h-5 w-5 shrink-0"/>ตรวจเงินเข้าบัญชีจริงแล้ว และจัดการคืนเงินกับลูกค้าแล้วหากมีเงินเข้า</label>
        </>}
        <button type="button" disabled={busy || (slips.length > 0 && !confirmCancel)} className={button} onClick={()=>void send("cancel", {acknowledgedPaymentCheck:confirmCancel})}>ยืนยันยกเลิกออเดอร์ LL-{order.id}</button>
      </div>
    </details>}
    {busy && <p role="status">กำลังบันทึก…</p>}{error && <p role="alert" className="text-red-300">{error}</p>}
  </section>;
}
