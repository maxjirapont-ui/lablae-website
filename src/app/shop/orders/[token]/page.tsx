import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getShopOrder } from "@/lib/shop-orders";
import { ORDER_STATUS, parsePaymentQr } from "@/lib/shop-order-types";
import type { ShopAddress } from "@/lib/shop";
import ShopStatusRefresh from "@/components/ShopStatusRefresh";
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
  return <div className="max-w-2xl mx-auto p-4 sm:p-8 font-thai space-y-6 text-primary">
    <ShopStatusRefresh />
    <h1 className="text-3xl font-bold">ออเดอร์ LL-{order.id}</h1>
    <p className="text-xl text-accent" role="status">{ORDER_STATUS[order.status]}</p>
    {order.status === "requested" && <p className="leading-relaxed">ได้รับคำขอสั่งซื้อแล้วครับ ร้านจะตรวจสินค้าพร้อมส่ง พื้นที่จัดส่ง และยอดรวมก่อน ยังไม่ต้องโอนเงิน กรุณาเก็บลิงก์หน้านี้ไว้ดูความคืบหน้าหรือแจ้งเลขออเดอร์เมื่อติดต่อร้าน</p>}
    <section className="rounded-2xl border border-accent/30 p-5 space-y-3">
      <h2 className="text-xl font-bold">{order.product_name}</h2>
      <p>{order.quantity} แพ็ก · แพ็กละ 500 กรัม · {order.unit_price} บาท/แพ็ก</p>
      <p>ค่าสินค้า {order.goods_baht.toLocaleString("th-TH")} บาท</p>
      <p>ค่าจัดส่ง: {order.shipping_baht === null ? "รอร้านยืนยัน" : `${order.shipping_baht} บาท`}</p>
      {order.shipping_baht !== null && <p className="text-2xl font-bold text-accent">ยอดรวม {(order.goods_baht + order.shipping_baht).toLocaleString("th-TH")} บาท</p>}
      {order.dispatch_note && <p className="whitespace-pre-wrap">{order.dispatch_note}</p>}
    </section>
    {order.status === "quoted" && <section className="rounded-2xl bg-[#fffaf3] text-stone-900 p-5 space-y-3">
      <h2 className="font-bold text-xl">ช่องทางชำระเงินที่ร้านยืนยัน</h2>
      <p className="whitespace-pre-wrap break-words">{order.payment_instructions}</p>
      {paymentQr && <div className="space-y-4">
        <p className="font-bold">สแกน QR แล้วใส่ยอด {(order.goods_baht + (order.shipping_baht || 0)).toLocaleString("th-TH")} บาท</p>
        <Image src={`/shop/orders/${order.token}/payment-qr`} alt={`QR พร้อมเพย์ของ ${paymentQr.recipient}`} width={480} height={596} unoptimized className="mx-auto h-auto w-full max-w-sm rounded-xl" />
        <a href={`/shop/orders/${order.token}/payment-qr?download=1`} download className="block rounded-xl bg-[#653c20] px-4 py-3 text-center font-bold text-white">บันทึกรูป QR เพื่อโอนเงิน</a>
        <p className="text-sm leading-relaxed">ใช้มือถือเครื่องเดียว: บันทึกรูป แล้วเลือกสแกนจากรูปในแอปธนาคาร ตรวจชื่อผู้รับเงินให้ตรงกับ {paymentQr.recipient} และยอดรวมก่อนยืนยันโอน</p>
      </div>}
      <p>หลังโอน แนบสลิปด้านล่างได้เลย สถานะจะเปลี่ยนเมื่อร้านตรวจเงินเข้าจริงแล้ว</p>
    </section>}
    {order.status === "quoted" && <ShopSlipUpload token={order.token} count={slips.length} />}
    {order.tracking && <section className="border border-accent/30 rounded-2xl p-5"><h2 className="font-bold text-xl">ข้อมูลจัดส่ง</h2><p className="break-words mt-2">{order.tracking}</p></section>}
    <section className="space-y-2"><h2 className="font-bold text-xl">ส่งถึง</h2><p>{address.name} · {address.phone}</p><p className="whitespace-pre-wrap break-words">{address.address}<br/>{address.subdistrict} · {address.district}<br/>{address.province} {address.postcode}</p>{address.note && <p className="break-words">หมายเหตุ: {address.note}</p>}</section>
    <div className="flex flex-wrap gap-3"><a href={`/shop/orders/${order.token}`} className="border border-accent px-4 py-3 rounded-xl">อัปเดตสถานะ</a><a href="tel:0956283125" className="border border-accent px-4 py-3 rounded-xl">โทรหาร้าน</a><Link href="/shop" className="px-4 py-3 text-accent">กลับหน้าสินค้า</Link></div>
    <p className="text-sm text-primary/65">ลิงก์นี้มีข้อมูลผู้รับ กรุณาเก็บไว้เป็นส่วนตัว</p>
  </div>;
}
