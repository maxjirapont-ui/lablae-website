import { estimateShopOrder, validateShopAddress, type ShopAddress } from "./shop";

export const SHOP_DRAFT_KEY = "lablae-shop-draft-v1";
export const SHOP_RECENT_KEY = "lablae-shop-recent-v1";
export const SHOP_DRAFT_TTL = 12 * 60 * 60 * 1000;
export type ShopAttempt = { requestKey: string; quantity: number; address: ShopAddress };
export type ShopDraft = { quantityText: string; address: ShopAddress; pending: ShopAttempt | null; expiresAt: number };
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
export function readRecentShopOrder(): {url:string;number:string} | null {
  try {
    const recent=JSON.parse(sessionStorage.getItem(SHOP_RECENT_KEY)||"null");
    if (recent?.expiresAt > Date.now() && /^\/shop\/orders\/[a-f0-9]{48}$/.test(recent.url) && /^LL-\d+$/.test(recent.number)) return recent;
    sessionStorage.removeItem(SHOP_RECENT_KEY);
  } catch { /* Optional recovery link. */ }
  return null;
}
export function finishShopDraft(url:string,number:string) {
  try {
    sessionStorage.removeItem(SHOP_DRAFT_KEY);
    sessionStorage.setItem(SHOP_RECENT_KEY,JSON.stringify({url,number,expiresAt:Date.now()+SHOP_DRAFT_TTL}));
  } catch { /* A saved order remains valid without browser storage. */ }
}
