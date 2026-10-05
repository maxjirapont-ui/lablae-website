import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getShopFunnel, getShopOrderById, listShopOrders, shopIsPublic } from "@/lib/shop-orders";
import ShopOrdersBoard from "@/components/ShopOrdersBoard";
import ShopPaymentSettings from "@/components/ShopPaymentSettings";
import { getShopPaymentConfig } from "@/lib/shop-payment";
import ShopStatusRefresh from "@/components/ShopStatusRefresh";
import ShopLineSettings from "@/components/ShopLineSettings";
import { getShopLineStatus } from "@/lib/shop-line";
import { listShopSlips } from "@/lib/shop-slips";

export const dynamic = "force-dynamic";
export default async function AdminShopPage({searchParams}: {searchParams:Promise<{order?:string|string[]}>}) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const requestedOrder = (await searchParams).order;
  const initialQuery = typeof requestedOrder === "string" && /^LL-\d+$/i.test(requestedOrder) ? requestedOrder.toUpperCase() : "";
  const orders = await listShopOrders();
  const paymentConfig = await getShopPaymentConfig();
  const lineStatus = await getShopLineStatus();
  const slips = await listShopSlips(undefined, true);
  const requestedId = Number(initialQuery.slice(3));
  if (initialQuery && Number.isSafeInteger(requestedId) && requestedId > 0 && !orders.some(order=>order.id === requestedId)) {
    const requested = await getShopOrderById(requestedId);
    if (requested) {
      orders.push(requested);
      const extraSlips = await listShopSlips(requestedId, true);
      const knownIds = new Set(slips.map(slip=>slip.id));
      slips.push(...extraSlips.filter(slip=>!knownIds.has(slip.id)));
    }
  }
  const funnel = await getShopFunnel();
  const lineSummary = !lineStatus.configured ? "ยังไม่เชื่อมบัญชี LINE" : !lineStatus.connected ? "ยังไม่เชื่อมกลุ่ม" : lineStatus.live ? "เชื่อมกลุ่มแล้ว · เปิดส่งข้อความ" : "เชื่อมกลุ่มแล้ว · โหมดทดลองยังไม่ส่งข้อความ";
  return <div className="shop-admin-page max-w-4xl mx-auto p-4 sm:p-8 space-y-6 font-thai text-primary">
    <ShopStatusRefresh />
    <Link href="/admin" className="text-accent">← หลังบ้านร้าน</Link>
    <h1 className="text-3xl font-bold">ออเดอร์ไส้อั่ว</h1>
    <p className="text-sm text-primary/70">แสดงงานค้างทั้งหมดและประวัติล่าสุด 200 รายการ</p>
    {!shopIsPublic() && <p className="rounded-xl border border-accent/30 p-4">ยังไม่เปิดหน้าสั่งซื้อให้บุคคลทั่วไป รายการจากการทดสอบจะถูกบันทึกในระบบนี้</p>}
    <div className="flex gap-4"><a href="/admin/shop" className="text-accent underline">โหลดรายการล่าสุด</a><Link href="/shop" className="text-accent underline">เปิดหน้าสินค้า</Link></div>
    <ShopOrdersBoard orders={orders} paymentConfig={paymentConfig} slips={slips} initialQuery={initialQuery}/>
    <details className="rounded-2xl border border-accent/30 p-5"><summary className="cursor-pointer py-2 font-bold">ผลการสั่งซื้อย้อนหลัง 30 วัน</summary><dl className="mt-4 grid grid-cols-2 gap-4"><div><dt>สร้างออเดอร์</dt><dd className="text-2xl">{funnel.created}</dd></div><div><dt>มีสลิปแล้ว</dt><dd className="text-2xl">{funnel.withSlip}</dd></div><div><dt>ร้านรับเงินแล้ว</dt><dd className="text-2xl">{funnel.paid}</dd></div><div><dt>จัดส่งแล้ว</dt><dd className="text-2xl">{funnel.shipped}</dd></div></dl><p className="mt-4 text-sm text-primary/70">นับออเดอร์ที่สร้างใน 30 วันที่ผ่านมา รายการละหนึ่งครั้ง ยอดรับเงินรวมรายการที่จัดส่งแล้ว</p></details>
    <details className="rounded-2xl border border-accent/30 p-5"><summary className="cursor-pointer py-2 font-bold">ตั้งค่ารับเงินและ LINE · {lineSummary}{lineStatus.failed || lineStatus.pending ? " · มีคิวแจ้งเตือนรอตรวจ" : ""}</summary><div className="mt-4 space-y-4"><ShopPaymentSettings config={paymentConfig}/><ShopLineSettings status={lineStatus}/></div></details>
  </div>;
}
