import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getShopFunnel, listShopOrders, shopIsPublic } from "@/lib/shop-orders";
import ShopOrdersBoard from "@/components/ShopOrdersBoard";
import ShopPaymentSettings from "@/components/ShopPaymentSettings";
import { getShopPaymentConfig } from "@/lib/shop-payment";
import ShopStatusRefresh from "@/components/ShopStatusRefresh";
import ShopLineSettings from "@/components/ShopLineSettings";
import { getShopLineStatus } from "@/lib/shop-line";
import { listShopSlips } from "@/lib/shop-slips";

export const dynamic = "force-dynamic";
export default async function AdminShopPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const orders = await listShopOrders();
  const paymentConfig = await getShopPaymentConfig();
  const lineStatus = await getShopLineStatus();
  const slips = await listShopSlips();
  const funnel = await getShopFunnel();
  return <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-6 font-thai text-primary">
    <ShopStatusRefresh />
    <Link href="/admin" className="text-accent">← หลังบ้านร้าน</Link>
    <h1 className="text-3xl font-bold">ออเดอร์ไส้อั่ว</h1>
    <p className="text-sm text-primary/70">แสดงงานค้างทั้งหมดและประวัติล่าสุด 200 รายการ</p>
    {!shopIsPublic() && <p className="rounded-xl border border-accent/30 p-4">ยังไม่เปิดหน้าสั่งซื้อให้บุคคลทั่วไป รายการจากการทดสอบจะถูกบันทึกในระบบนี้</p>}
    <div className="flex gap-4"><a href="/admin/shop" className="text-accent underline">โหลดรายการล่าสุด</a><Link href="/shop" className="text-accent underline">เปิดหน้าสินค้า</Link></div>
    <ShopOrdersBoard orders={orders} paymentConfig={paymentConfig} slips={slips}/>
    <details className="rounded-2xl border border-accent/30 p-5"><summary className="cursor-pointer py-2 font-bold">ผลการสั่งซื้อย้อนหลัง 30 วัน</summary><dl className="mt-4 grid grid-cols-2 gap-4"><div><dt>สร้างออเดอร์</dt><dd className="text-2xl">{funnel.created}</dd></div><div><dt>มีสลิปแล้ว</dt><dd className="text-2xl">{funnel.withSlip}</dd></div><div><dt>ร้านรับเงินแล้ว</dt><dd className="text-2xl">{funnel.paid}</dd></div><div><dt>จัดส่งแล้ว</dt><dd className="text-2xl">{funnel.shipped}</dd></div></dl><p className="mt-4 text-sm text-primary/70">นับออเดอร์ที่สร้างใน 30 วันที่ผ่านมา รายการละหนึ่งครั้ง ยอดรับเงินรวมรายการที่จัดส่งแล้ว</p></details>
    <details className="rounded-2xl border border-accent/30 p-5"><summary className="cursor-pointer py-2 font-bold">ตั้งค่ารับเงินและ LINE · {lineStatus.connected ? "เชื่อมกลุ่มแล้ว" : "ยังไม่เชื่อมกลุ่ม"}{lineStatus.failed || lineStatus.pending ? " · มีคิวแจ้งเตือนรอตรวจ" : ""}</summary><div className="mt-4 space-y-4"><ShopPaymentSettings config={paymentConfig}/><ShopLineSettings status={lineStatus}/></div></details>
  </div>;
}
