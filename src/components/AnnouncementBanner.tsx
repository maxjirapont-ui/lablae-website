"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Megaphone, X, ArrowRight } from "lucide-react";

export interface AnnouncementBannerProps {
  enabled: boolean;
  text: string;
  link?: string;
  linkText?: string;
  badge?: string;
}

export default function AnnouncementBanner({
  enabled,
  text,
  link,
  linkText = "อ่านเพิ่มเติม",
  badge = "ประกาศจากทางร้าน",
}: AnnouncementBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!enabled || !text || dismissed) return null;

  const isExternal = link?.startsWith("http") || link?.startsWith("tel:") || link?.startsWith("mailto:");

  return (
    <div className="relative z-50 bg-gradient-to-r from-[#381f12] via-[#542d17] to-[#381f12] text-cream border-b border-accent/30 py-2.5 px-4 font-thai text-xs sm:text-sm shadow-md transition-all">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-center sm:justify-start">
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent text-[#1a100a] text-[10px] font-bold shrink-0">
            <Megaphone className="w-3 h-3" />
            {badge}
          </span>
          <span className="font-medium text-[#f7eee3] line-clamp-1 sm:line-clamp-none text-center sm:text-left">
            {text}
          </span>
          {link && (
            isExternal ? (
              <a
                href={link}
                target={link.startsWith("http") ? "_blank" : undefined}
                rel={link.startsWith("http") ? "noopener noreferrer" : undefined}
                className="inline-flex items-center gap-1 font-bold text-accent hover:text-white transition-colors shrink-0 ml-1 text-xs underline"
              >
                <span>{linkText}</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            ) : (
              <Link
                href={link}
                className="inline-flex items-center gap-1 font-bold text-accent hover:text-white transition-colors shrink-0 ml-1 text-xs underline"
              >
                <span>{linkText}</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            )
          )}
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-1 rounded-full text-cream/60 hover:text-cream hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
          title="ปิดประกาศนี้"
          aria-label="ปิดประกาศ"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
