import Link from "next/link";
import { notFound } from "next/navigation";
import { getShopOrder } from "@/lib/shop-orders";
import { ORDER_STATUS, parsePaymentQr } from "@/lib/shop-order-types";
import type { ShopAddress } from "@/lib/shop";
import ShopStatusRefresh from "@/components/ShopStatusRefresh";
import ShopOrderLink, { ShopCopyText, ShopPaymentQrImage } from "@/components/ShopOrderLink";
import ShopSlipUpload from "@/components/ShopSlipUpload";
import ShopContactButtons from "@/components/ShopContactButtons";
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
  const discountBaht = Math.max(0, order.quantity * order.unit_price - order.goods_baht);
  const paymentPanel = <section className="rounded-2xl bg-[#fffaf3] text-stone-900 p-5 space-y-4">
    <h2 className="font-bold text-xl">ชำระเงิน</h2>
    <div className="space-y-2">
      <p>ยอดที่ต้องโอน</p>
      <p className="text-4xl font-bold">{total} บาท</p>
      {paymentQr ? <p className="break-words">ผู้รับเงิน: <span className="font-bold">{paymentQr.recipient}</span></p> : <p className="whitespace-pre-wrap break-words text-lg">{order.payment_instructions}</p>}
    </div>
    {paymentQr && <>
      <div className="mx-auto w-full max-w-[17rem]">
        <ShopPaymentQrImage src={`/shop/orders/${order.token}/payment-qr`} recipient={paymentQr.recipient} />
      </div>
      <p className="text-center">สแกนแล้วใส่ยอด {total} บาท</p>
      <a href={`/shop/orders/${order.token}/payment-qr?download=1`} download className="block rounded-xl border border-[#653c20] px-4 py-3 text-center font-bold">บันทึกรูป QR</a>
    </>}
    {!hasSubmittedSlip && <a href="#payment-slip" className="block rounded-xl bg-[#653c20] px-4 py-3 text-center font-bold text-white">โอนแล้ว แนบสลิป</a>}
  </section>;
  return <div className="max-w-2xl mx-auto p-4 sm:p-8 font-thai space-y-5 text-primary">
    <ShopStatusRefresh />
    <section id="order-status" tabIndex={-1} aria-labelledby="order-heading" className="scroll-mt-32 space-y-3 outline-none sm:scroll-mt-24">
      <h1 id="order-heading" className="text-2xl font-bold">ออเดอร์ LL-{order.id}</h1>
      <p className="text-xl text-accent" role="status">{order.status === "quoted" && slips.length > 0 ? "ได้รับสลิปแล้ว · รอร้านตรวจเงิน" : order.status === "quoted" && unreadableSlipCount > 0 ? "รอแนบสลิปใหม่ · ร้านยังไม่ยืนยันรับเงิน" : ORDER_STATUS[order.status]}</p>
      {order.status === "quoted" && slips.length > 0 && <p className="rounded-xl bg-[#f1e6d5] p-4 text-stone-900">ไม่ต้องโอนซ้ำ ร้านตรวจเงินแล้วจะโทรตกลงวันส่งครับ</p>}
      {order.status === "quoted" && unreadableSlipCount > 0 && <p role="alert" className="rounded-xl bg-[#f1e6d5] p-4 leading-relaxed text-stone-900">{slips.length > 0 ? "สลิปเดิมบางไฟล์เปิดไม่ได้ แต่ได้รับสลิปใหม่แล้ว รอร้านตรวจเงิน ไม่ต้องโอนซ้ำ" : "สลิปเดิมเปิดไม่ได้ กรุณาแนบรูปใหม่ ไม่ต้องโอนซ้ำ ร้านยังไม่ยืนยันรับเงิน"}</p>}
    </section>
    {order.status === "requested" && <p className="leading-relaxed">ร้านจะโทรแจ้งยอดและวันส่งก่อนชำระเงินครับ</p>}
    {order.status === "quoted" && (hasSubmittedSlip ? <>
      <section id={slips.length > 0 ? "payment-slip" : "payment-slip-status"} className="scroll-mt-32 rounded-2xl border border-accent/30 p-5 space-y-3 sm:scroll-mt-24">
        {slips.length > 0 ? <>
          <h2 className="text-xl font-bold">ได้รับสลิปแล้ว {slips.length} ไฟล์</h2>
          <details><summary className="cursor-pointer py-3 text-accent">ต้องการแนบสลิปเพิ่มเติม</summary><p className="pb-3 text-base text-primary/80">รับล่าสุด {new Intl.DateTimeFormat("th-TH",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Bangkok"}).format(new Date(slips[0].created_at.replace(" ","T")+"Z"))}</p><ShopSlipUpload token={order.token} count={slips.length}/></details>
        </> : <><h2 className="text-xl font-bold">แนบรูปสลิปใหม่</h2><ShopSlipUpload token={order.token} count={0}/></>}
      </section>
      <details className="rounded-2xl border border-accent/30 p-4"><summary className="cursor-pointer py-2 font-medium">ดูยอดและข้อมูลชำระเงินเดิม</summary>{paymentPanel}</details>
    </> : <>{paymentPanel}<ShopSlipUpload token={order.token} count={0}/></>)}
    {order.status === "quoted" && !hasSubmittedSlip && <p className="leading-relaxed">ร้านตรวจเงินแล้วจะโทรตกลงวันส่งครับ</p>}
    <ShopOrderLink token={order.token} beforePayment={order.status === "quoted" && !hasSubmittedSlip} />
    {order.status === "quoted" && !hasSubmittedSlip && paymentQr && <details className="rounded-2xl border border-accent/30 px-4 py-2">
      <summary className="cursor-pointer py-3 font-medium">ใช้มือถือเครื่องเดียวโอนอย่างไร</summary>
      <div className="space-y-3 pb-3 text-base leading-relaxed">
        <ol className="list-decimal space-y-2 pl-5">
          <li>คัดลอกลิงก์ออเดอร์ด้านบน เก็บไว้กลับมาแนบสลิป</li>
          <li>บันทึกรูป QR แล้วเปิดแอปธนาคาร สแกนจากรูปถ้าแอปรองรับ</li>
          <li>ใส่ยอด {total} บาท ตรวจชื่อผู้รับ แล้วโอนและบันทึกสลิป</li>
          <li>กลับมาหน้านี้ เลือกสลิป แล้วกดส่งให้ร้านตรวจสอบ</li>
        </ol>
        <p>บน iPhone รูปอาจอยู่ในไฟล์ (Files) ถ้าแอปธนาคารหาไม่เจอ ให้เปิด QR เต็มจอแล้วถ่ายภาพหน้าจอให้เห็น QR ครบ</p>
      </div>
    </details>}
    {order.tracking && <section className="border border-accent/30 rounded-2xl p-5 space-y-3"><h2 className="font-bold text-xl">ข้อมูลจัดส่ง</h2><p className="break-words whitespace-pre-wrap">{order.tracking}</p><ShopCopyText value={order.tracking} label="คัดลอกข้อมูลพัสดุ" success="คัดลอกข้อมูลพัสดุแล้ว" /></section>}
    {order.status !== "cancelled" && <details className="rounded-2xl border border-accent/30 p-4">
      <summary className="cursor-pointer py-2 font-medium">วันส่งและรายละเอียดจัดส่ง</summary>
      <p className="pt-2 whitespace-pre-wrap break-words leading-relaxed">{order.dispatch_note || "วันส่งตกลงกับร้าน"}</p>
    </details>}
    <details className="rounded-2xl border border-accent/30 p-4">
      <summary className="cursor-pointer py-2 font-medium">สินค้าและที่อยู่จัดส่ง</summary>
      <div className="pt-3 space-y-4">
      <section className="space-y-2">
      <h2 className="text-xl font-bold">{order.product_name}</h2>
      <p>{order.quantity} แพ็ก · แพ็กละ 500 กรัม · ราคาแยกแพ็ก {order.unit_price} บาท/แพ็ก</p>
      {discountBaht > 0 && <p>ส่วนลดชุด {discountBaht.toLocaleString("th-TH")} บาท</p>}
      <p>ค่าสินค้า {order.goods_baht.toLocaleString("th-TH")} บาท · {order.shipping_baht === 0 ? "ส่งฟรี" : `ค่าจัดส่ง ${order.shipping_baht === null ? "รอร้านยืนยัน" : `${order.shipping_baht} บาท`}`}</p>
      {order.shipping_baht !== null && <p className="text-2xl font-bold text-accent">ยอดรวม {total} บาท</p>}
      </section>
      <section className="space-y-2"><h2 className="font-bold text-xl">ส่งถึง</h2><p>{address.name} · {address.phone}</p><p className="whitespace-pre-wrap break-words">{address.address}<br/>{address.subdistrict} · {address.district}<br/>{address.province} {address.postcode}</p>{address.note && <p className="break-words">หมายเหตุ: {address.note}</p>}</section>
      </div>
    </details>
    <div className="space-y-3">
      <ShopContactButtons />
      <div className="flex flex-wrap gap-3"><a href={`/shop/orders/${order.token}`} className="border border-accent px-4 py-3 rounded-xl">อัปเดตสถานะ</a><Link href="/shop" className="px-4 py-3 text-accent">กลับหน้าสินค้า</Link></div>
    </div>
    <p className="text-sm text-primary/65">ลิงก์นี้มีข้อมูลผู้รับ กรุณาเก็บไว้เป็นส่วนตัว</p>
  </div>;
}
