"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ShopStatusRefresh() {
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible" && !document.activeElement?.closest("form, input, textarea")) router.refresh();
    }, 30_000);
    return () => clearInterval(timer);
  }, [router]);
  return null;
}
