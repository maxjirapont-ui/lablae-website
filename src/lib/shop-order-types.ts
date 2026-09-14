export const ORDER_STATUS = {
  requested: "รอร้านยืนยันสินค้าและรอบส่ง",
  quoted: "รอชำระเงิน",
  paid: "ร้านตรวจรับเงินแล้ว · เตรียมจัดส่ง",
  shipped: "จัดส่งแล้ว",
  cancelled: "ยกเลิกแล้ว",
} as const;
export type OrderStatus = keyof typeof ORDER_STATUS;
export interface ShopOrder {
  id: number;
  token: string;
  request_key: string;
  fingerprint: string;
  quantity: number;
  product_name: string;
  unit_price: number;
  goods_baht: number;
  address_json: string;
  phone: string;
  status: OrderStatus;
  shipping_baht: number | null;
  payment_instructions: string;
  payment_qr_json: string;
  dispatch_note: string;
  tracking: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export type ShopPaymentQr = { filename: string; recipient: string };

export function parsePaymentQr(value: string): ShopPaymentQr | null {
  try {
    const qr = JSON.parse(value);
    return typeof qr.recipient === "string" && qr.recipient.trim() && typeof qr.filename === "string" && /^[a-f0-9]{64}\.(jpg|png)$/.test(qr.filename)
      ? {filename: qr.filename, recipient: qr.recipient} : null;
  } catch { return null; }
}

