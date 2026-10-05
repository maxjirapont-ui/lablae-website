"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ShopStatusRefresh() {
  const router = useRouter();
  useEffect(() => {
    let lastRefresh = 0;
    function refresh() {
      if (document.visibilityState !== "visible" || document.activeElement?.closest("form, input, textarea, select, [contenteditable='true'], [role='textbox']")) return;
      const now = Date.now();
      // Focus and visibility can fire together when returning from a banking app.
      if (now - lastRefresh < 1_000) return;
      lastRefresh = now;
      router.refresh();
    }
    const restoredPage = (event: PageTransitionEvent) => { if (event.persisted) refresh(); };
    const timer = setInterval(refresh, 30_000);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", restoredPage);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", restoredPage);
    };
  }, [router]);
  return null;
}
