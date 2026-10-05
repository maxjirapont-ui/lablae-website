import { estimateShopOrder, validateShopAddress, type ShopAddress } from "./shop";

export const SHOP_DRAFT_KEY = "lablae-shop-draft-v1";
export const SHOP_RECENT_KEY = "lablae-shop-recent-v1";
export const SHOP_DRAFT_TTL = 12 * 60 * 60 * 1000;
export const SHOP_RECENT_TTL = 30 * 24 * 60 * 60 * 1000;
export type ShopAttempt = { requestKey: string; quantity: number; address: ShopAddress };
export type ShopDraft = { quantityText: string; address: ShopAddress; pending: ShopAttempt | null; expiresAt: number };
export type RecentShopOrder = { url: string; number: string; expiresAt: number };
export function readShopDraft(raw: string | null, now = Date.now()): ShopDraft | null {
  try {
    if (!raw || raw.length > 15000) return null;
    const value = JSON.parse(raw) as ShopDraft;
    if (!Number.isFinite(value.expiresAt) || value.expiresAt <= now || value.expiresAt > now + SHOP_DRAFT_TTL || typeof value.quantityText !== "string" || value.quantityText.length > 20) return null;
    const limits = { name:100, phone:20, address:300, subdistrict:100, district:100, province:100, postcode:5, note:500 };
    if (!value.address || Object.entries(limits).some(([key,max]) => typeof value.address[key as keyof ShopAddress] !== "string" || value.address[key as keyof ShopAddress].length > max)) return null;
    if (value.pending) {
      const attempt = value.pending;
      if (!/^[a-f0-9]{48}$/.test(attempt.requestKey) || !estimateShopOrder(attempt.quantity) || !attempt.address || Object.entries(limits).some(([key,max]) => typeof attempt.address[key as keyof ShopAddress] !== "string" || attempt.address[key as keyof ShopAddress].length > max) || Object.keys(validateShopAddress(attempt.address)).length) return null;
      // The payload of an uncertain request must remain unchanged across reloads/retries.
      return { ...value, quantityText: String(attempt.quantity), address: attempt.address };
    }
    return { ...value, pending: null };
  } catch { return null; }
}
export function saveShopDraft(value: Omit<ShopDraft,"expiresAt">) {
  try { sessionStorage.setItem(SHOP_DRAFT_KEY, JSON.stringify({...value,expiresAt:Date.now()+SHOP_DRAFT_TTL})); } catch { /* Buying still works when browser storage is unavailable. */ }
}
export function parseRecentShopOrder(raw: string | null, now = Date.now()): RecentShopOrder | null {
  try {
    if (!raw || raw.length > 1000) return null;
    const recent = JSON.parse(raw);
    if (!recent || !Number.isFinite(recent.expiresAt) || recent.expiresAt <= now || recent.expiresAt > now + SHOP_RECENT_TTL || typeof recent.url !== "string" || !/^\/shop\/orders\/[a-f0-9]{48}$/.test(recent.url) || typeof recent.number !== "string" || recent.number.length > 32 || !/^LL-\d+$/.test(recent.number)) return null;
    // Only the private link and order number belong in long-lived storage.
    return { url: recent.url, number: recent.number, expiresAt: recent.expiresAt };
  } catch { /* Optional recovery link. */ }
  return null;
}
function recentStorage(kind: "local" | "session"): Storage | null {
  try { return kind === "local" ? localStorage : sessionStorage; }
  catch { return null; }
}
function readStoredRecent(storage: Storage | null): RecentShopOrder | null {
  if (!storage) return null;
  try {
    const recent = parseRecentShopOrder(storage.getItem(SHOP_RECENT_KEY));
    if (recent) return recent;
    storage.removeItem(SHOP_RECENT_KEY);
  } catch { /* Browser storage may be disabled. */ }
  return null;
}
export function readRecentShopOrder(): RecentShopOrder | null {
  const local = recentStorage("local");
  const recent = readStoredRecent(local);
  if (recent) {
    try { recentStorage("session")?.removeItem(SHOP_RECENT_KEY); } catch { /* The persistent copy is already available. */ }
    return recent;
  }
  // Existing tabs used sessionStorage. Keep their remaining expiry when migrating.
  const legacy = readStoredRecent(recentStorage("session"));
  if (legacy) {
    try {
      if (local) {
        local.setItem(SHOP_RECENT_KEY, JSON.stringify(legacy));
        recentStorage("session")?.removeItem(SHOP_RECENT_KEY);
      }
    } catch { /* The current tab can still recover its link. */ }
    return legacy;
  }
  return null;
}
export function saveRecentShopOrder(url: string, number: string): void {
  const now = Date.now();
  const recent = parseRecentShopOrder(JSON.stringify({ url, number, expiresAt: now + SHOP_RECENT_TTL }), now);
  if (!recent) return;
  const local = recentStorage("local");
  let savedLocally = false;
  try {
    if (local) {
      local.setItem(SHOP_RECENT_KEY, JSON.stringify(recent));
      savedLocally = true;
    }
  } catch { /* Try keeping the link in the current tab instead. */ }
  try {
    if (savedLocally) recentStorage("session")?.removeItem(SHOP_RECENT_KEY);
    else recentStorage("session")?.setItem(SHOP_RECENT_KEY, JSON.stringify(recent));
  } catch { /* A saved order remains valid without browser storage. */ }
}
export function clearRecentShopOrder(): void {
  for (const kind of ["local", "session"] as const) {
    try { recentStorage(kind)?.removeItem(SHOP_RECENT_KEY); }
    catch { /* Clearing one storage must still allow clearing the other. */ }
  }
}
export function finishShopDraft(url:string,number:string) {
  try { sessionStorage.removeItem(SHOP_DRAFT_KEY); } catch { /* The order already exists. */ }
  saveRecentShopOrder(url, number);
}
