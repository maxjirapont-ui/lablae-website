import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getShopOrder } from "@/lib/shop-orders";
import { ORDER_STATUS, parsePaymentQr } from "@/lib/shop-order-types";
import type { ShopAddress } from "@/lib/shop";
import ShopStatusRefresh from "@/components/ShopStatusRefresh";
import ShopOrderLink from "@/components/ShopOrderLink";
import ShopSlipUpload from "@/components/ShopSlipUpload";
import { listShopSlips } from "@/lib/shop-slips";

export const dynamic = "force-dynamic";
export const metadata = {title:"สถานะคำสั่งซื้อ",robots:{index:false,follow:false},referrer:"no-referrer" as const};

export default async function OrderPage({params}: {params:Promise<{token:string}>}) {
  const order = await getShopOrder((await params).token);
  if (!order) notFound();
  const slips = await listShopSlips(order.id);
  const paymentQr = parsePaymentQr(order.payment_qr_json);
  const address = JSON.parse(order.address_json) as ShopAddress;
  const total = (order.goods_baht + (order.shipping_baht || 0)).toLocaleString("th-TH");
  const paymentPanel = <section className="rounded-2xl bg-[#fffaf3] text-stone-900 p-5 space-y-3">
    <h2 className="font-bold text-xl">ชำระเงินแล้วแนบสลิป</h2>
    {!slips.length && <a href="#payment-slip" className="block rounded-xl border-2 border-[#653c20] px-4 py-3 text-center font-bold text-[#653c20]">โอนแล้ว กดแนบสลิป</a>}
    <p className="whitespace-pre-wrap break-words">{order.payment_instructions}</p>
    {paymentQr && <div className="space-y-4">
      <p className="font-bold">สแกน QR แล้วใส่ยอด {total} บาท</p>
      <Image src={`/shop/orders/${order.token}/payment-qr`} alt={`QR พร้อมเพย์ของ ${paymentQr.recipient}`} width={480} height={596} unoptimized className="mx-auto h-auto w-full max-w-sm rounded-xl" />
      <a href={`/shop/orders/${order.token}/payment-qr?download=1`} download className="block rounded-xl bg-[#653c20] px-4 py-3 text-center font-bold text-white">บันทึกรูป QR เพื่อโอนเงิน</a>
      <p className="text-sm leading-relaxed">ใช้มือถือเครื่องเดียว: บันทึกรูป แล้วเลือกสแกนจากรูปในแอปธนาคาร ตรวจชื่อผู้รับเงินให้ตรงกับ {paymentQr.recipient} และยอดรวมก่อนยืนยันโอน</p>
    </div>}
    {!slips.length && <a href="#payment-slip" className="block rounded-xl bg-[#653c20] px-4 py-3 text-center font-bold text-white">โอนแล้ว กดแนบสลิป</a>}
  </section>;
  return <div className="max-w-2xl mx-auto p-4 sm:p-8 font-thai space-y-5 text-primary">
    <ShopStatusRefresh />
    <h1 className="text-3xl font-bold">ออเดอร์ LL-{order.id}</h1>
    <p className="text-xl text-accent" role="status">{order.status === "quoted" && slips.length > 0 ? "ได้รับสลิปแล้ว · รอร้านตรวจเงิน" : ORDER_STATUS[order.status]}</p>
    {order.status === "quoted" && slips.length > 0 && <p className="rounded-xl bg-[#f1e6d5] p-4 text-stone-900">ไม่ต้องโอนซ้ำครับ ร้านจะตรวจเงินเข้าบัญชีแล้วโทรติดต่อเรื่องจัดส่ง</p>}
    <ShopOrderLink token={order.token} />
    {order.status === "requested" && <p className="leading-relaxed">ได้รับออเดอร์แล้วครับ ร้านจะโทรแจ้งค่าส่งและรายละเอียดจัดส่งก่อนชำระเงิน กรุณาเก็บลิงก์นี้ไว้ดูความคืบหน้า</p>}
    <section className="rounded-2xl border border-accent/30 p-5 space-y-3">
      <h2 className="text-xl font-bold">{order.product_name}</h2>
      <p>{order.quantity} แพ็ก · แพ็กละ 500 กรัม · {order.unit_price} บาท/แพ็ก</p>
      <p>ค่าสินค้า {order.goods_baht.toLocaleString("th-TH")} บาท · ค่าจัดส่ง {order.shipping_baht === null ? "รอร้านยืนยัน" : `${order.shipping_baht} บาท`}</p>
      {order.shipping_baht !== null && <p className="text-2xl font-bold text-accent">ยอดรวม {total} บาท</p>}
      {order.dispatch_note && <p className="whitespace-pre-wrap">{order.dispatch_note}</p>}
    </section>
    {order.status === "quoted" && (slips.length ? <>
      <section id="payment-slip" className="scroll-mt-24 rounded-2xl border border-accent/30 p-5 space-y-3">
        <h2 className="text-xl font-bold">ได้รับสลิปแล้ว {slips.length} รูป</h2>
        <p className="text-sm text-primary/80">รับล่าสุด {new Intl.DateTimeFormat("th-TH",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Bangkok"}).format(new Date(slips[0].created_at.replace(" ","T")+"Z"))}</p>
        <details><summary className="cursor-pointer py-3 text-accent">ต้องการแนบสลิปเพิ่มเติม</summary><ShopSlipUpload token={order.token} count={slips.length}/></details>
      </section>
      <details className="rounded-2xl border border-accent/30 p-4"><summary className="cursor-pointer py-2 font-medium">ดูยอดและข้อมูลชำระเงินเดิม</summary>{paymentPanel}</details>
    </> : <>{paymentPanel}<ShopSlipUpload token={order.token} count={0}/></>)}
    {order.tracking && <section className="border border-accent/30 rounded-2xl p-5"><h2 className="font-bold text-xl">ข้อมูลจัดส่ง</h2><p className="break-words mt-2">{order.tracking}</p></section>}
    <section className="space-y-2"><h2 className="font-bold text-xl">ส่งถึง</h2><p>{address.name} · {address.phone}</p><p className="whitespace-pre-wrap break-words">{address.address}<br/>{address.subdistrict} · {address.district}<br/>{address.province} {address.postcode}</p>{address.note && <p className="break-words">หมายเหตุ: {address.note}</p>}</section>
    <div className="flex flex-wrap gap-3"><a href={`/shop/orders/${order.token}`} className="border border-accent px-4 py-3 rounded-xl">อัปเดตสถานะ</a><a href="tel:0956283125" className="border border-accent px-4 py-3 rounded-xl">โทรหาร้าน</a><Link href="/shop" className="px-4 py-3 text-accent">กลับหน้าสินค้า</Link></div>
    <p className="text-sm text-primary/65">ลิงก์นี้มีข้อมูลผู้รับ กรุณาเก็บไว้เป็นส่วนตัว</p>
  </div>;
}
