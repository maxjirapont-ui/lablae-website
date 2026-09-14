"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUS, parsePaymentQr, type ShopOrder } from "@/lib/shop-order-types";
import type { ShopPaymentConfig } from "@/lib/shop-payment";
import type { ShopSlip } from "@/lib/shop-slips";
import { getShopShippingBaht, type ShopAddress } from "@/lib/shop";

const field = "block w-full bg-white text-stone-900 border border-stone-400 rounded-xl px-3 py-3 mt-2";
const button = "px-4 py-3 rounded-xl border border-accent text-accent disabled:opacity-40";
export default function ShopOrderAdmin({order, paymentConfig, slips=[]}: {order:ShopOrder; paymentConfig?:ShopPaymentConfig; slips?:ShopSlip[]}) {
  const qr = parsePaymentQr(order.payment_qr_json) || paymentConfig;
  const [useQr, setUseQr] = useState(Boolean(qr && (order.payment_qr_json || !order.payment_instructions)));
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmPayment, setConfirmPayment] = useState(false);
  const flatShipping = getShopShippingBaht(order.quantity);
  const address = JSON.parse(order.address_json) as ShopAddress;
  async function send(action:string, values:Record<string,unknown> = {}) {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/shop-orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:order.id,version:order.version,action,...values})});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "บันทึกไม่สำเร็จ");
      router.refresh();
    } catch(error) { setError(error instanceof Error ? error.message : "เชื่อมต่อไม่สำเร็จ"); }
    finally { setBusy(false); }
  }
  function quote(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void send("quote", {paymentMethod:useQr ? "qr" : "manual", paymentQrFilename:qr?.filename, shippingBaht:Number(data.get("shipping")),paymentInstructions:data.get("payment"),dispatchNote:data.get("dispatch"),confirmed:data.get("confirmed")==="on"});
  }
  return <section id={`order-${order.id}`} className="rounded-2xl border border-accent/30 p-5 space-y-4">
    <div className="flex flex-wrap justify-between gap-3"><h2 className="text-xl font-bold">LL-{order.id} · {order.quantity} แพ็ก</h2><span className="text-accent">{ORDER_STATUS[order.status]}</span></div>
    <p>{address.name} · <a href={`tel:${order.phone}`} className="underline">{order.phone}</a></p>
    <p className="whitespace-pre-wrap break-words">{address.address}<br/>{address.subdistrict} {address.district} {address.province} {address.postcode}</p>
    {address.note && <p className="break-words">หมายเหตุ: {address.note}</p>}
    <p>ค่าสินค้า {order.goods_baht} บาท · ค่าส่ง {order.shipping_baht === null ? "ยังไม่ยืนยัน" : `${order.shipping_baht} บาท`}</p>
    {slips.length>0 && <div className="border rounded-xl p-4 space-y-2"><h3 className="font-bold">สลิปจากลูกค้า {slips.length} รูป</h3><p>ตรวจเงินเข้าบัญชีจริงก่อนกดยืนยันรับเงิน</p>{slips.map(slip=><a key={slip.id} href={`/api/admin/shop-orders/${order.id}/slip/${slip.id}`} target="_blank" rel="noreferrer" className="block text-accent underline py-2">เปิดสลิป #{slip.id}</a>)}</div>}
    <a href={`/shop/orders/${order.token}`} target="_blank" rel="noreferrer" className="inline-block text-accent underline py-2">เปิดหน้าติดตามของลูกค้า</a>
    {["requested","quoted"].includes(order.status) && <form onSubmit={quote} className="space-y-4 border-t border-accent/20 pt-4">
      <label className="block">ค่าส่ง (บาท)<input name="shipping" type="number" min="0" max="5000" step="1" required readOnly={flatShipping !== null} defaultValue={flatShipping ?? order.shipping_baht ?? ""} className={field}/></label>
      {flatShipping !== null && <p className="text-sm text-primary/75">ค่าส่งเหมาจ่าย 200 บาท สำหรับ 1–9 แพ็ก ตามราคาหน้าร้าน</p>}
      {flatShipping === null && <p className="text-sm text-primary/75">ออเดอร์มากกว่า 9 แพ็ก: วางแผนผลิต แล้วกรอกค่าส่งและรอบส่งที่ยืนยันได้ก่อนแจ้งลูกค้าชำระเงิน</p>}
      <label className="block">ขนส่งและรอบส่งที่ยืนยัน<textarea name="dispatch" required maxLength={500} defaultValue={order.dispatch_note} className={field} placeholder="เช่น ชื่อขนส่งและวันที่ส่งที่ตกลงกับลูกค้า"/></label>
      {qr && <label className="flex items-start gap-3"><input type="checkbox" checked={useQr} onChange={event=>setUseQr(event.target.checked)} className="mt-1 h-5 w-5 shrink-0"/>ใช้ QR พร้อมเพย์ · {qr.recipient}</label>}
      {!useQr && <label className="block">ช่องทางรับเงินและชื่อบัญชี<textarea name="payment" required minLength={10} maxLength={1000} defaultValue={order.payment_instructions} className={field} placeholder="กรอกบัญชีหรือพร้อมเพย์ของร้านที่ตรวจแล้ว ข้อความนี้จะแสดงให้ลูกค้า"/></label>}
      <label className="flex gap-3 items-start"><input type="checkbox" name="confirmed" required className="mt-1 h-5 w-5 shrink-0"/>ตรวจสินค้าพร้อมส่ง พื้นที่จัดส่ง ค่าส่งรวม และบัญชีรับเงินแล้ว</label>
      <button disabled={busy} className={button}>ยืนยันยอดให้ลูกค้า</button>
    </form>}
    {order.status === "quoted" && <div className="space-y-3 border-t border-accent/20 pt-4">
      <label className="flex gap-3 items-start"><input type="checkbox" checked={confirmPayment} onChange={e=>setConfirmPayment(e.target.checked)} className="mt-1 h-5 w-5 shrink-0"/>ตรวจเงินเข้าบัญชีจริงครบ {order.goods_baht + (order.shipping_baht || 0)} บาทแล้ว</label>
      <button disabled={busy || !confirmPayment} className={button} onClick={()=>void send("paid",{confirmed:confirmPayment})}>ยืนยันรับเงินแล้ว</button>
    </div>}
    {order.status === "paid" && <form className="space-y-3" onSubmit={event=>{event.preventDefault();void send("ship",{tracking:new FormData(event.currentTarget).get("tracking")});}}>
      <label className="block">ชื่อขนส่งและเลขพัสดุ<input name="tracking" required minLength={4} maxLength={200} className={field}/></label>
      <button disabled={busy} className={button}>บันทึกการจัดส่ง</button>
    </form>}
    {order.tracking && <p className="break-words">จัดส่ง: {order.tracking}</p>}
    {["requested","quoted"].includes(order.status) && <details><summary className="cursor-pointer py-3">ยกเลิกรายการที่ยังไม่ชำระ</summary><button disabled={busy} className={button} onClick={()=>void send("cancel")}>ยืนยันยกเลิกออเดอร์ LL-{order.id}</button></details>}
    {busy && <p role="status">กำลังบันทึก…</p>}{error && <p role="alert" className="text-red-300">{error}</p>}
  </section>;
}
