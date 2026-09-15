"use client";

import type { ComponentProps, ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Navbar from "./Navbar";
import MobileQuickBar from "./MobileQuickBar";

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

  if (isShop) return <>
    <header className="sticky top-0 z-50 border-b border-accent/20 bg-[#1a100a]/95 backdrop-blur-md"><nav aria-label="เมนูสั่งซื้อ" className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4"><Link href="/" className="inline-flex min-h-12 items-center text-sm text-accent">← ลำลำลับแล บ้าน 100 ปี</Link><a href={`tel:${phone}`} className="inline-flex min-h-12 items-center rounded-lg px-3 text-sm text-accent underline">โทรหาร้าน</a></nav></header>
    <main className="flex-grow pb-6">{children}</main>
    <footer className="border-t border-accent/20 px-4 py-6 text-center text-sm text-primary/70">ลำลำลับแล บ้าน 100 ปี · <Link href="/" className="inline-flex min-h-11 items-center text-accent underline">กลับหน้าร้าน</Link></footer>
  </>;
  return (
    <>
      <Navbar {...navbar} />
      <main className={`flex-grow ${hasAnnouncement ? "pt-32" : "pt-24"} pb-16 md:pb-0`}>
        {children}
      </main>
      {footer}
      {!isShop && <MobileQuickBar phone={phone} googleMapsUrl={googleMapsUrl} />}
    </>
  );
}
