"use client";

import type { ComponentProps, ReactNode } from "react";
import { usePathname } from "next/navigation";
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

  if (isAdmin) {
    return <main className="min-h-screen flex-grow">{children}</main>;
  }

  return (
    <>
      <Navbar {...navbar} />
      <main className={`flex-grow ${hasAnnouncement ? "pt-32" : "pt-24"} pb-16 md:pb-0`}>
        {children}
      </main>
      {footer}
      <MobileQuickBar phone={phone} googleMapsUrl={googleMapsUrl} />
    </>
  );
}
