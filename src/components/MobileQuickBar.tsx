"use client";

import React from "react";
import Link from "next/link";
import { Phone, MapPin, UtensilsCrossed } from "lucide-react";

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
    <aside aria-label="แถบทางลัดสำหรับมือถือ" className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-3 py-2 bg-[#140c07]/95 backdrop-blur-md border-t border-accent/25 shadow-[0_-8px_25px_rgba(0,0,0,0.6)]">
      <div className="max-w-md mx-auto grid grid-cols-3 gap-2 font-thai">
        {/* Call Button */}
        <a
          href={`tel:${cleanPhone}`}
          className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-gradient-to-b from-[#2e1d13] to-[#1f120a] border border-accent/25 text-[#f7eee3] hover:border-accent active:scale-95 transition-all text-center shadow-xs"
        >
          <div className="w-6 h-6 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mb-0.5">
            <Phone className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-bold text-accent leading-tight">โทรจองโต๊ะ</span>
          <span className="text-[9px] text-[#f7eee3]/60 leading-tight">โทรออกทันที</span>
        </a>

        {/* Map / Directions Button */}
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-gradient-to-b from-[#2e1d13] to-[#1f120a] border border-accent/25 text-[#f7eee3] hover:border-accent active:scale-95 transition-all text-center shadow-xs"
        >
          <div className="w-6 h-6 rounded-full bg-amber-950/80 border border-accent/40 text-accent flex items-center justify-center mb-0.5">
            <MapPin className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-bold text-accent leading-tight">นำทางร้าน</span>
          <span className="text-[9px] text-[#f7eee3]/60 leading-tight">Google Maps</span>
        </a>

        {/* Menu Button (Highlighted) */}
        <Link
          href="/menu"
          className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-gradient-to-r from-accent to-[#e6b87d] text-[#1a100a] font-bold active:scale-95 transition-all text-center shadow-md"
        >
          <div className="w-6 h-6 rounded-full bg-[#1a100a]/20 text-[#1a100a] flex items-center justify-center mb-0.5">
            <UtensilsCrossed className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-bold text-[#1a100a] leading-tight">ดูเมนูอาหาร</span>
          <span className="text-[9px] text-[#1a100a]/75 leading-tight">ราคา & รูปภาพ</span>
        </Link>
      </div>
    </aside>
  );
}
