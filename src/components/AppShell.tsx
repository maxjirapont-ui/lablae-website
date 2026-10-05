"use client";

import type { ComponentProps, ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Navbar from "./Navbar";
import MobileQuickBar from "./MobileQuickBar";
import ShopContactButtons from "./ShopContactButtons";

interface AppShellProps {
  children: ReactNode;
  footer: ReactNode;
  navbar: ComponentProps<typeof Navbar>;
  phone: string;
  googleMapsUrl: string;
  hasAnnouncement: boolean;
}

export default function AppShell({
  children,
  footer,
  navbar,
  phone,
  googleMapsUrl,
  hasAnnouncement,
}: AppShellProps) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const isShop = pathname === "/shop" || pathname.startsWith("/shop/");

  if (isAdmin) {
    return <main className="min-h-screen flex-grow">{children}</main>;
  }

  if (isShop) return <div className="public-site contents">
    <header className="sticky top-0 z-50 border-b border-accent/20 bg-[#1a100a]/95 backdrop-blur-md">
      <nav aria-label="เมนูสั่งซื้อ" className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-2 sm:min-h-16 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <Link href="/" className="inline-flex min-h-10 items-center text-base text-accent">← ลำลำลับแล บ้าน 100 ปี</Link>
        <ShopContactButtons phoneHref={`tel:${phone.replace(/[^0-9+]/g, "")}`} className="w-full [&>a]:flex-1 [&>a]:px-3 sm:w-auto sm:[&>a]:flex-none" />
      </nav>
    </header>
    <main className="flex-grow pb-6">{children}</main>
    <footer className="border-t border-accent/20 px-4 py-6 text-center text-sm text-primary/70">ลำลำลับแล บ้าน 100 ปี · <Link href="/" className="inline-flex min-h-11 items-center text-accent underline">กลับหน้าร้าน</Link></footer>
  </div>;
  return (
    <div className="public-site restaurant-site contents">
      <Navbar {...navbar} />
      <main className={`flex-grow ${hasAnnouncement ? "pt-32" : "pt-24"} pb-16 md:pb-0`}>
        {children}
      </main>
      {footer}
      {!isShop && <MobileQuickBar phone={phone} googleMapsUrl={googleMapsUrl} />}
    </div>
  );
}
