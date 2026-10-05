import Link from "next/link";
import { notFound } from "next/navigation";
import { getShopOrder } from "@/lib/shop-orders";
import { ORDER_STATUS, parsePaymentQr } from "@/lib/shop-order-types";
import type { ShopAddress } from "@/lib/shop";
import ShopStatusRefresh from "@/components/ShopStatusRefresh";
import ShopOrderLink, { ShopCopyText, ShopPaymentQrImage } from "@/components/ShopOrderLink";
import ShopSlipUpload from "@/components/ShopSlipUpload";
import { getUnreadableShopSlipCount, listShopSlips } from "@/lib/shop-slips";

export const dynamic = "force-dynamic";
export const metadata = {title:"สถานะคำสั่งซื้อ",robots:{index:false,follow:false},referrer:"no-referrer" as const};

export default async function OrderPage({params}: {params:Promise<{token:string}>}) {
  const order = await getShopOrder((await params).token);
  if (!order) notFound();
  const slips = await listShopSlips(order.id);
  const unreadableSlipCount = await getUnreadableShopSlipCount(order.id);
  const hasSubmittedSlip = slips.length > 0 || unreadableSlipCount > 0;
  const paymentQr = parsePaymentQr(order.payment_qr_json);
  const address = JSON.parse(order.address_json) as ShopAddress;
  const total = (order.goods_baht + (order.shipping_baht || 0)).toLocaleString("th-TH");
  const showDeliveryInPayment = order.status === "quoted" && !hasSubmittedSlip;
  const paymentDeliveryNote = showDeliveryInPayment && <p className="text-base leading-relaxed whitespace-pre-wrap break-words">{order.dispatch_note || <>วันส่งตกลงทางโทรศัพท์ · <a href="tel:0956283125" className="inline-block min-h-11 py-2 font-medium text-[#653c20] underline underline-offset-4">โทรถามวันส่งก่อนโอน</a></>}</p>;
  const keepOrderLinkNotice = !hasSubmittedSlip && <p className="text-base leading-relaxed">ก่อนออกไปโอน กด “คัดลอกลิงก์ออเดอร์” ด้านบน แล้วเก็บไว้ในโน้ตหรือแชตส่วนตัว จะได้กลับมาแนบสลิปและดูสถานะ</p>;
  const paymentPanel = <section className="rounded-2xl bg-[#fffaf3] text-stone-900 p-5 space-y-4">
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h2 className="font-bold text-xl">ข้อมูลชำระเงิน</h2>
      {!hasSubmittedSlip && <a href="#payment-slip" className="py-2 text-base underline underline-offset-4">โอนแล้ว แนบสลิปที่นี่</a>}
    </div>
    <div className="space-y-2">
      <p>ยอดที่ต้องโอน</p>
      <p className="text-3xl font-bold">{total} บาท</p>
      {paymentQr ? <><p className="pt-1">ชื่อผู้รับเงินพร้อมเพย์</p><p className="break-words text-xl font-bold">{paymentQr.recipient}</p></> : <p className="whitespace-pre-wrap break-words text-lg">{order.payment_instructions}</p>}
    </div>
    {paymentQr && <div className="space-y-4">
      <p>สแกน QR แล้วใส่ยอด {total} บาท</p>
      <ShopPaymentQrImage src={`/shop/orders/${order.token}/payment-qr`} recipient={paymentQr.recipient} />
      {paymentDeliveryNote}
      {keepOrderLinkNotice}
      <a href={`/shop/orders/${order.token}/payment-qr?download=1`} download className="block rounded-xl bg-[#653c20] px-4 py-3 text-center font-bold text-white">บันทึกรูป QR เพื่อโอนเงิน</a>
      <details className="rounded-xl border border-stone-300 px-4 py-2">
        <summary className="cursor-pointer py-2 font-medium">ใช้มือถือเครื่องเดียวโอนอย่างไร</summary>
        <div className="space-y-3 pb-2 text-base leading-relaxed">
          <ol className="list-decimal space-y-2 pl-5">
            <li>บันทึกรูป QR</li>
            <li>เปิดแอปธนาคาร เลือกสแกนจากรูปถ้าแอปรองรับ แล้วใส่ยอด {total} บาท</li>
            <li>ตรวจชื่อผู้รับและยอดก่อนโอน แล้วบันทึกสลิป</li>
            <li>กลับมาหน้านี้ เลือกสลิป แล้วกดส่งให้ร้านตรวจสอบ</li>
          </ol>
          <p>บน iPhone รูปอาจอยู่ในไฟล์ (Files) ถ้าแอปธนาคารหาไม่เจอ ให้เปิด QR เต็มจอแล้วถ่ายภาพหน้าจอให้เห็น QR ครบ</p>
        </div>
      </details>
    </div>}
    {!paymentQr && <>{paymentDeliveryNote}{keepOrderLinkNotice}</>}
    {!hasSubmittedSlip && <a href="#payment-slip" className="block rounded-xl bg-[#653c20] px-4 py-3 text-center font-bold text-white">โอนแล้ว กดแนบสลิป</a>}
  </section>;
  return <div className="max-w-2xl mx-auto p-4 sm:p-8 font-thai space-y-5 text-primary">
    <ShopStatusRefresh />
    <section id="order-status" tabIndex={-1} aria-labelledby="order-heading" className="scroll-mt-24 space-y-5 outline-none">
      <h1 id="order-heading" className="text-3xl font-bold">ออเดอร์ LL-{order.id}</h1>
      <p className="text-xl text-accent" role="status">{order.status === "quoted" && slips.length > 0 ? "ได้รับสลิปแล้ว · รอร้านตรวจเงิน" : order.status === "quoted" && unreadableSlipCount > 0 ? "รอแนบสลิปใหม่ · ร้านยังไม่ยืนยันรับเงิน" : ORDER_STATUS[order.status]}</p>
      {order.status === "quoted" && slips.length > 0 && <p className="rounded-xl bg-[#f1e6d5] p-4 text-stone-900">ไม่ต้องโอนซ้ำครับ ร้านจะตรวจเงินเข้าบัญชีแล้วโทรติดต่อเรื่องจัดส่ง</p>}
      {order.status === "quoted" && unreadableSlipCount > 0 && <p role="alert" className="rounded-xl bg-[#f1e6d5] p-4 leading-relaxed text-stone-900">{slips.length > 0 ? "มีสลิปบางไฟล์ที่เปิดไม่ได้ แต่ได้รับสลิปใหม่แล้ว ร้านจะตรวจเงินเข้าบัญชี ไม่ต้องโอนซ้ำ" : "มีสลิปเดิมที่เปิดไม่ได้ กรุณาแนบรูปสลิปใหม่ ร้านยังต้องตรวจเงินเข้าบัญชี ไม่ต้องโอนซ้ำ"}</p>}
    </section>
    <ShopOrderLink token={order.token} beforePayment={order.status === "quoted" && !hasSubmittedSlip} />
    {order.status === "requested" && <p className="leading-relaxed">ได้รับออเดอร์แล้วครับ ร้านจะโทรแจ้งค่าส่งและรายละเอียดจัดส่งก่อนชำระเงิน กรุณาเก็บลิงก์นี้ไว้ดูความคืบหน้า</p>}
    {order.status !== "cancelled" && !showDeliveryInPayment && <section className="rounded-2xl border border-accent/30 p-4 space-y-2">
      <h2 className="text-lg font-bold">การจัดส่ง</h2>
      {order.dispatch_note ? <p className="whitespace-pre-wrap break-words">{order.dispatch_note}</p> : <>
        <p>วันส่งตกลงกับร้านทางโทรศัพท์</p>
        {order.status === "requested" && <a href="tel:0956283125" className="inline-block min-h-11 py-2 font-medium text-accent underline underline-offset-4">โทรถามวันส่งก่อนชำระเงิน</a>}
      </>}
    </section>}
    {order.status === "quoted" && (hasSubmittedSlip ? <>
      <section id={slips.length > 0 ? "payment-slip" : "payment-slip-status"} className="scroll-mt-24 rounded-2xl border border-accent/30 p-5 space-y-3">
        {slips.length > 0 ? <>
          <h2 className="text-xl font-bold">ได้รับสลิปแล้ว {slips.length} ไฟล์</h2>
          <p className="text-sm text-primary/80">รับล่าสุด {new Intl.DateTimeFormat("th-TH",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Bangkok"}).format(new Date(slips[0].created_at.replace(" ","T")+"Z"))}</p>
          <details><summary className="cursor-pointer py-3 text-accent">ต้องการแนบสลิปเพิ่มเติม</summary><ShopSlipUpload token={order.token} count={slips.length}/></details>
        </> : <><h2 className="text-xl font-bold">แนบรูปสลิปใหม่</h2><ShopSlipUpload token={order.token} count={0}/></>}
      </section>
      <details className="rounded-2xl border border-accent/30 p-4"><summary className="cursor-pointer py-2 font-medium">ดูยอดและข้อมูลชำระเงินเดิม</summary>{paymentPanel}</details>
    </> : <>{paymentPanel}<ShopSlipUpload token={order.token} count={0}/></>)}
    <section className="rounded-2xl border border-accent/30 p-5 space-y-3">
      <h2 className="text-xl font-bold">{order.product_name}</h2>
      <p>{order.quantity} แพ็ก · แพ็กละ 500 กรัม · {order.unit_price} บาท/แพ็ก</p>
      <p>ค่าสินค้า {order.goods_baht.toLocaleString("th-TH")} บาท · ค่าจัดส่ง {order.shipping_baht === null ? "รอร้านยืนยัน" : `${order.shipping_baht} บาท`}</p>
      {order.shipping_baht !== null && <p className="text-2xl font-bold text-accent">ยอดรวม {total} บาท</p>}
    </section>
    {order.tracking && <section className="border border-accent/30 rounded-2xl p-5 space-y-3"><h2 className="font-bold text-xl">ข้อมูลจัดส่ง</h2><p className="break-words whitespace-pre-wrap">{order.tracking}</p><ShopCopyText value={order.tracking} label="คัดลอกข้อมูลพัสดุ" success="คัดลอกข้อมูลพัสดุแล้ว" /></section>}
    <section className="space-y-2"><h2 className="font-bold text-xl">ส่งถึง</h2><p>{address.name} · {address.phone}</p><p className="whitespace-pre-wrap break-words">{address.address}<br/>{address.subdistrict} · {address.district}<br/>{address.province} {address.postcode}</p>{address.note && <p className="break-words">หมายเหตุ: {address.note}</p>}</section>
    <div className="flex flex-wrap gap-3"><a href={`/shop/orders/${order.token}`} className="border border-accent px-4 py-3 rounded-xl">อัปเดตสถานะ</a><a href="tel:0956283125" className="border border-accent px-4 py-3 rounded-xl">โทรหาร้าน</a><Link href="/shop" className="px-4 py-3 text-accent">กลับหน้าสินค้า</Link></div>
    <p className="text-sm text-primary/65">ลิงก์นี้มีข้อมูลผู้รับ กรุณาเก็บไว้เป็นส่วนตัว</p>
  </div>;
}
