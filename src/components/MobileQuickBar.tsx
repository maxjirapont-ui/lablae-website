"use client";

import React from "react";
import Link from "next/link";
import { Phone, MapPin, UtensilsCrossed, ShoppingBag } from "lucide-react";

interface MobileQuickBarProps {
  phone?: string;
  googleMapsUrl?: string;
}

export default function MobileQuickBar({
  phone = "095-628-3125",
  googleMapsUrl = "https://maps.app.goo.gl/8xsKvMFqaAMfE3K87",
}: MobileQuickBarProps) {
  const cleanPhone = phone.replace(/[^0-9]/g, "");

  return (
    <aside aria-label="แถบทางลัดสำหรับมือถือ" className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] bg-[#140c07]/95 backdrop-blur-md border-t border-accent/25 shadow-[0_-8px_25px_rgba(0,0,0,0.6)]">
      <div className="max-w-md mx-auto grid grid-cols-4 gap-1.5 font-thai">
        {/* Call Button */}
        <a
          href={`tel:${cleanPhone}`}
          className="flex flex-col items-center justify-center min-h-16 py-2 px-1 rounded-xl bg-gradient-to-b from-[#2e1d13] to-[#1f120a] border border-accent/25 text-[#f7eee3] hover:border-accent active:scale-95 transition-all text-center shadow-xs"
        >
          <div className="w-7 h-7 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mb-0.5">
            <Phone className="w-5 h-5" />
          </div>
          <span className="text-[14px] font-bold text-accent leading-tight">จองโต๊ะ</span>
        </a>

        {/* Map / Directions Button */}
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center min-h-16 py-2 px-1 rounded-xl bg-gradient-to-b from-[#2e1d13] to-[#1f120a] border border-accent/25 text-[#f7eee3] hover:border-accent active:scale-95 transition-all text-center shadow-xs"
        >
          <div className="w-7 h-7 rounded-full bg-amber-950/80 border border-accent/40 text-accent flex items-center justify-center mb-0.5">
            <MapPin className="w-5 h-5" />
          </div>
          <span className="text-[14px] font-bold text-accent leading-tight">นำทาง</span>
        </a>

        {/* Menu Button (Highlighted) */}
        <Link
          href="/menu"
          className="flex flex-col items-center justify-center min-h-16 py-2 px-1 rounded-xl bg-gradient-to-r from-accent to-[#e6b87d] text-[#1a100a] font-bold active:scale-95 transition-all text-center shadow-md"
        >
          <div className="w-7 h-7 rounded-full bg-[#1a100a]/20 text-[#1a100a] flex items-center justify-center mb-0.5">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <span className="text-[14px] font-bold text-[#1a100a] leading-tight">เมนูอาหาร</span>
        </Link>
        <Link href="/shop" className="flex flex-col items-center justify-center min-h-16 py-2 px-1 rounded-xl bg-[#2e1d13] border border-accent/25 text-accent active:scale-95 transition-all text-center">
          <ShoppingBag className="w-6 h-6 mb-1" />
          <span className="text-[14px] font-bold leading-tight">สั่งไส้อั่ว</span>
        </Link>
      </div>
    </aside>
  );
}
