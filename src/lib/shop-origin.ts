import type { NextRequest } from "next/server";
import { SITE_URL } from "@/lib/seo";

// The public HTTPS origin differs from Next's internal URL behind Railway.
// Only explicitly configured origins are accepted; forwarded headers are not trusted.
export function isShopOriginAllowed(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const allowed = new Set([request.nextUrl.origin, new URL(SITE_URL).origin]);
  if (process.env.SITE_URL) {
    try { allowed.add(new URL(process.env.SITE_URL).origin); } catch { /* Ignore invalid configuration. */ }
  }
  return allowed.has(origin);
}
