"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BookingStatusRefresh({ active }: { active: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;
    const interval = window.setInterval(() => router.refresh(), 15000);
    return () => window.clearInterval(interval);
  }, [active, router]);

  return active ? <p className="mt-2 text-xs opacity-60">หน้านี้จะตรวจสอบสถานะใหม่ให้อัตโนมัติ</p> : null;
}
