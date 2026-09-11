"use client";

import Script from "next/script";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { campaignParameters, isPublicAnalyticsPath, trackWebsiteAction, websiteLinkAction, WEBSITE_MEASUREMENT_ID } from "@/lib/website-analytics";

type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  lablaeAnalyticsInitialized?: boolean;
};

const subscribe = () => () => {};
const isProductionHost = () => ["www.lablae.net", "lablae.net"].includes(window.location.hostname);
const serverSnapshot = () => false;

export default function WebsiteAnalytics() {
  const pathname = usePathname();
  const productionHost = useSyncExternalStore(subscribe, isProductionHost, serverSnapshot);
  const lastPath = useRef<string | null>(null);
  const active = productionHost && isPublicAnalyticsPath(pathname);

  useEffect(() => {
    if (!productionHost) return;
    const analytics = window as AnalyticsWindow;
    const flags = window as unknown as Record<string, unknown>;
    flags[`ga-disable-${WEBSITE_MEASUREMENT_ID}`] = !active;
    if (!active) {
      lastPath.current = null;
      return;
    }

    analytics.dataLayer ??= [];
    analytics.gtag ??= function () {
      // Match Google's queue format; it expects the Arguments object.
      // eslint-disable-next-line prefer-rest-params
      analytics.dataLayer!.push(arguments);
    };

    const page = new URL(pathname, window.location.origin);
    for (const [key, value] of Object.entries(campaignParameters(window.location.search))) {
      page.searchParams.set(key, value);
    }
    let referrer = "";
    if (lastPath.current) referrer = new URL(lastPath.current, window.location.origin).href;
    else if (document.referrer) {
      try { referrer = new URL(document.referrer).origin; } catch { /* No raw referrer fallback. */ }
    }
    const pageFields = {
      page_location: page.href,
      page_referrer: referrer,
      page_title: pathname === "/" ? "ลำลำลับแลบ้าน 100 ปี" : `ลำลำลับแล ${pathname}`,
    };
    if (!analytics.lablaeAnalyticsInitialized) {
      analytics.gtag("js", new Date());
      analytics.lablaeAnalyticsInitialized = true;
    }
    analytics.gtag("config", WEBSITE_MEASUREMENT_ID, {
      ...pageFields,
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
    if (lastPath.current !== pathname) {
      analytics.gtag("event", "page_view", { ...pageFields, send_to: WEBSITE_MEASUREMENT_ID });
      lastPath.current = pathname;
    }

    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a");
      if (!anchor) return;
      const action = websiteLinkAction(anchor.getAttribute("href") || "", window.location.origin);
      if (action) trackWebsiteAction(action);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [active, pathname, productionHost]);

  if (!active) return null;
  return <Script id="lablae-website-analytics" src={`https://www.googletagmanager.com/gtag/js?id=${WEBSITE_MEASUREMENT_ID}`} strategy="afterInteractive" />;
}
