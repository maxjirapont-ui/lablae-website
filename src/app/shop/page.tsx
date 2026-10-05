import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import ShopPreview from "@/components/ShopPreview";
import { pageMetadata, serializeJsonLd, SITE_URL } from "@/lib/seo";
import { SHOP_PRODUCT, SHOP_PROMOTION, SHOP_SHIPPING_BAHT } from "@/lib/shop";
import { shopIsPublic } from "@/lib/shop-orders";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  ...pageMetadata(
    `ไส้อั่วลำลำลับแล ${SHOP_PROMOTION.quantity} แพ็ก ${SHOP_PROMOTION.priceBaht} บาท ส่งฟรี`,
    `ไส้อั่วลำลำลับแล แพ็กละ ${SHOP_PRODUCT.weightGrams} กรัม ${SHOP_PRODUCT.priceBaht} บาท โปร ${SHOP_PROMOTION.quantity} แพ็ก ${SHOP_PROMOTION.priceBaht} บาท ส่งฟรีเมื่อสั่งตั้งแต่ ${SHOP_PROMOTION.freeShippingMinPacks} แพ็ก สั่ง 1–2 แพ็ก ค่าส่ง ${SHOP_SHIPPING_BAHT} บาท จัดส่งแช่แข็ง`,
    "/shop",
    SHOP_PRODUCT.image,
    SHOP_PRODUCT.imageAlt,
  ),
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

const shopUrl = `${SITE_URL}/shop`;
const shippingDetails = (price: number) => ({
  "@type": "OfferShippingDetails",
  shippingRate: { "@type": "MonetaryAmount", value: price, currency: "THB" },
  shippingDestination: { "@type": "DefinedRegion", addressCountry: "TH" },
});
const productSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Product",
      "@id": `${shopUrl}#${SHOP_PRODUCT.id}`,
      name: `${SHOP_PRODUCT.name} ${SHOP_PRODUCT.weightGrams} กรัม`,
      image: `${SITE_URL}${SHOP_PRODUCT.image}`,
      description: `ไส้อั่วปรุงสุก ซีลสูญญากาศ แพ็กละ ${SHOP_PRODUCT.weightGrams} กรัม จัดส่งแช่แข็ง`,
      offers: {
        "@type": "Offer",
        name: "1 แพ็ก",
        url: shopUrl,
        price: SHOP_PRODUCT.priceBaht,
        priceCurrency: "THB",
        shippingDetails: shippingDetails(SHOP_SHIPPING_BAHT),
      },
    },
    {
      "@type": "Product",
      "@id": `${shopUrl}#bundle-${SHOP_PROMOTION.quantity}`,
      name: `${SHOP_PRODUCT.name} ${SHOP_PROMOTION.quantity} แพ็ก`,
      image: `${SITE_URL}${SHOP_PRODUCT.image}`,
      description: `${SHOP_PROMOTION.quantity} แพ็ก แพ็กละ ${SHOP_PRODUCT.weightGrams} กรัม ${SHOP_PROMOTION.priceBaht} บาท ส่งฟรี`,
      offers: {
        "@type": "Offer",
        url: shopUrl,
        price: SHOP_PROMOTION.priceBaht,
        priceCurrency: "THB",
        shippingDetails: shippingDetails(0),
      },
    },
  ],
};

export default async function ShopPage() {
  // Keep the unfinished checkout private even if a later deployment includes it.
  // Development preview needs no login; production preview is admin-only.
  if (process.env.NODE_ENV === "production" && !shopIsPublic() && !(await isAdminAuthenticated())) {
    notFound();
  }
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(productSchema) }} />
    <ShopPreview testing={!shopIsPublic()} />
  </>;
}
