import { MessageCircle, Phone } from "lucide-react";
import { SHOP_MESSENGER_URL, SHOP_PHONE_HREF } from "@/lib/shop-contact";

interface ShopContactButtonsProps {
  light?: boolean;
  phoneHref?: string;
  className?: string;
}

export default function ShopContactButtons({
  light = false,
  phoneHref = SHOP_PHONE_HREF,
  className = "",
}: ShopContactButtonsProps) {
  const buttonClass = "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border px-4 py-2 text-base font-medium focus-visible:outline-2 focus-visible:outline-offset-4";
  const phoneClass = light
    ? "border-stone-400 text-stone-900 hover:bg-stone-100 focus-visible:outline-stone-800"
    : "border-accent/50 text-accent hover:bg-accent/10 focus-visible:outline-accent";
  const messageClass = light
    ? "border-[#653c20] bg-[#653c20] text-white hover:bg-[#4b2c18] focus-visible:outline-stone-800"
    : "border-accent bg-accent text-[#261810] hover:bg-accent/90 focus-visible:outline-accent";

  return <div className={`flex flex-wrap gap-2 ${className}`}>
    <a href={phoneHref} className={`${buttonClass} ${phoneClass}`}>
      <Phone size={18} aria-hidden="true" />โทรหาร้าน
    </a>
    <a href={SHOP_MESSENGER_URL} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className={`${buttonClass} ${messageClass}`} aria-label="ทักเพจร้านลำลำลับแลใน Messenger (เปิดแยกจากหน้าสั่งซื้อ)">
      <MessageCircle size={18} aria-hidden="true" />ทักเพจร้าน
    </a>
  </div>;
}
