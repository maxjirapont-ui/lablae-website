import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import ShopPreview from "@/components/ShopPreview";
import { pageMetadata } from "@/lib/seo";
import { SHOP_PRODUCT } from "@/lib/shop";
import { shopIsPublic } from "@/lib/shop-orders";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  ...pageMetadata(
    "สั่งไส้อั่วลำลำลับแล 500 กรัม",
    "ส่งคำขอสั่งไส้อั่ว 500 กรัม แพ็กละ 250 บาท ค่าส่งเหมาจ่าย 200 บาท สำหรับ 1–9 แพ็ก ร้านยืนยันสินค้าก่อนชำระเงิน",
    "/shop",
    SHOP_PRODUCT.image,
    SHOP_PRODUCT.imageAlt,
  ),
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default async function ShopPage() {
  // Keep the unfinished checkout private even if a later deployment includes it.
  // Development preview needs no login; production preview is admin-only.
  if (process.env.NODE_ENV === "production" && !shopIsPublic() && !(await isAdminAuthenticated())) {
    notFound();
  }
  return <ShopPreview testing={!shopIsPublic()} />;
}
