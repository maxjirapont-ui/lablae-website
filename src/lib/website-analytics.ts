export const WEBSITE_MEASUREMENT_ID = "G-8ZCYCYC7JY";

export type WebsiteAction = "menu_click" | "directions_click" | "phone_click" | "booking_click" | "booking_request_submitted";

const publicPaths = new Set(["/", "/menu", "/about", "/directions", "/lablae", "/blog", "/visit"]);

export function isPublicAnalyticsPath(path: string): boolean {
  return publicPaths.has(path) || /^\/(?:blog|visit)\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(path);
}

// Only our named campaign labels are retained. Never send arbitrary query strings.
export function campaignParameters(search: string): Record<string, string> {
  const params = new URLSearchParams(search);
  const allowed: Record<string, readonly string[]> = {
    utm_source: ["facebook", "line", "google", "tiktok", "chatgpt.com", "perplexity.ai", "gemini.google.com"],
    utm_medium: ["organic_social", "social", "organic", "referral"],
    utm_campaign: ["website_launch", "business_profile"],
    utm_content: ["pinned_menu", "menu", "website", "directions", "booking", "house_story", "khao_phan_phak"],
  };
  return Object.fromEntries(Object.entries(allowed).flatMap(([key, values]) => {
    const value = params.get(key);
    return value && values.includes(value) ? [[key, value]] : [];
  }));
}

export function websiteLinkAction(href: string, origin: string): WebsiteAction | null {
  if (href.startsWith("tel:")) return "phone_click";
  try {
    const url = new URL(href, origin);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (url.origin === origin) {
      if (url.pathname === "/menu") return "menu_click";
      if (url.pathname === "/directions") return "directions_click";
      if (url.pathname === "/" && url.hash === "#booking") return "booking_click";
    }
    if ((url.hostname === "maps.app.goo.gl" && url.pathname === "/8xsKvMFqaAMfE3K87") || url.hostname === "maps.google.com" ||
      (["www.google.com", "google.com"].includes(url.hostname) && url.pathname.startsWith("/maps"))) {
      return "directions_click";
    }
  } catch { /* Invalid editable links do not affect navigation or analytics. */ }
  return null;
}

type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

export function trackWebsiteAction(action: WebsiteAction): void {
  if (typeof window === "undefined" || !["www.lablae.net", "lablae.net"].includes(window.location.hostname) ||
    !isPublicAnalyticsPath(window.location.pathname)) return;
  // Event names only: no form values, phone numbers, booking codes, or link URLs.
  (window as AnalyticsWindow).gtag?.("event", action, {
    send_to: WEBSITE_MEASUREMENT_ID,
    page_location: `${window.location.origin}${window.location.pathname}`,
  });
}
