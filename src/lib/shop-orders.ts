import { createHash, randomBytes } from "node:crypto";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { ensureRuntimeStorage, getDatabasePath } from "./storage";
import { SHOP_PRODUCT, SHOP_MAX_PACKS, getShopShippingBaht, validateShopAddress, normalizeShopDigits, type ShopAddress } from "./shop";
import { parsePaymentQr, type ShopOrder, type OrderStatus } from "./shop-order-types";

import { SHOP_PAYMENT_SCHEMA, type ShopPaymentConfig } from "./shop-payment";

import { SHOP_EVENTS_SCHEMA, enqueueShopEvent } from "./shop-events";

export class OrderError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export function shopIsPublic() { return process.env.SHOP_ORDERS_ENABLED === "1"; }

// Dedicated connection: order transactions cannot commit/rollback a reservation transaction.
export async function connectShopDb() {
  ensureRuntimeStorage();
  const db = await open({ filename: getDatabasePath(), driver: sqlite3.Database });
  await db.exec(`PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS shop_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT, token TEXT NOT NULL UNIQUE,
      request_key TEXT NOT NULL UNIQUE, fingerprint TEXT NOT NULL,
      quantity INTEGER NOT NULL, product_name TEXT NOT NULL, unit_price INTEGER NOT NULL,
      goods_baht INTEGER NOT NULL, address_json TEXT NOT NULL, phone TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'requested', shipping_baht INTEGER,
      payment_instructions TEXT NOT NULL DEFAULT '', payment_qr_json TEXT NOT NULL DEFAULT '', dispatch_note TEXT NOT NULL DEFAULT '',
      tracking TEXT NOT NULL DEFAULT '', version INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS shop_orders_phone_created ON shop_orders(phone, created_at);
    CREATE TABLE IF NOT EXISTS shop_order_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL,
      status TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    ${SHOP_PAYMENT_SCHEMA};
    ${SHOP_EVENTS_SCHEMA}`);
  const columns = await db.all<{name:string}[]>("PRAGMA table_info(shop_orders)");
  if (!columns.some(column => column.name === "payment_qr_json")) {
    try { await db.exec("ALTER TABLE shop_orders ADD COLUMN payment_qr_json TEXT NOT NULL DEFAULT ''"); }
    catch (error) { if (!(error instanceof Error) || !error.message.includes("duplicate column name")) { await db.close(); throw error; } }
  }
  return db;
}

export async function createShopOrder(input: unknown): Promise<ShopOrder> {
  if (!input || typeof input !== "object") throw new OrderError("ข้อมูลไม่ถูกต้อง");
  const body = input as Record<string, unknown>;
  if (!Number.isSafeInteger(body.quantity) || Number(body.quantity) < 1 || Number(body.quantity) > SHOP_MAX_PACKS) throw new OrderError("กรุณาระบุจำนวนแพ็กเป็นจำนวนเต็มตั้งแต่ 1 ขึ้นไปและไม่มากเกินกว่าระบบจะคำนวณได้");
  if (typeof body.requestKey !== "string" || !/^[a-f0-9]{48}$/.test(body.requestKey)) throw new OrderError("กรุณาโหลดหน้าสั่งซื้อใหม่");
  if (!body.address || typeof body.address !== "object") throw new OrderError("กรุณากรอกที่อยู่");
  const raw = body.address as Record<string, unknown>;
  const address = {} as ShopAddress;
  for (const key of ["name", "phone", "address", "subdistrict", "district", "province", "postcode", "note"] as const) {
    if (typeof raw[key] !== "string") throw new OrderError("กรุณาตรวจข้อมูลผู้รับ");
    address[key] = raw[key].trim();
  }
  address.phone = normalizeShopDigits(address.phone).replace(/[\s()-]/g, "");
  address.postcode = normalizeShopDigits(address.postcode);
  const errors = validateShopAddress(address);
  if (Object.keys(errors).length) throw new OrderError(Object.values(errors)[0]!);
  const quantity = Number(body.quantity);
  const fingerprint = createHash("sha256").update(JSON.stringify({ quantity, address })).digest("hex");
  const db = await connectShopDb();
  try {
    await db.exec("BEGIN IMMEDIATE");
    const existing = await db.get<ShopOrder>("SELECT * FROM shop_orders WHERE request_key = ?", body.requestKey);
    if (existing) {
      if (existing.fingerprint !== fingerprint) throw new OrderError("รายการเดิมถูกส่งแล้ว กรุณาเปิดหน้าสั่งซื้อใหม่หากต้องการสั่งเพิ่ม", 409);
      await db.exec("COMMIT");
      return existing;
    }
    const recent = await db.get<{count: number}>("SELECT COUNT(*) AS count FROM shop_orders WHERE phone = ? AND created_at > datetime('now','-1 hour')", address.phone);
    if ((recent?.count || 0) >= 5) throw new OrderError("มีหลายรายการจากเบอร์นี้แล้ว กรุณาติดต่อร้าน", 429);
    const token = randomBytes(24).toString("hex");
    await db.run(`INSERT INTO shop_orders (token, request_key, fingerprint, quantity, product_name, unit_price, goods_baht, address_json, phone, shipping_baht)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [token, body.requestKey, fingerprint, quantity, SHOP_PRODUCT.name, SHOP_PRODUCT.priceBaht, quantity * SHOP_PRODUCT.priceBaht, JSON.stringify(address), address.phone, getShopShippingBaht(quantity)]);
    const qr = await db.get<ShopPaymentConfig>("SELECT * FROM shop_payment_config WHERE id = 1");
    if (getShopShippingBaht(quantity) !== null && qr) {
      await db.run("UPDATE shop_orders SET status='quoted', payment_qr_json=?, payment_instructions=? WHERE token=?",
        JSON.stringify({filename:qr.filename, recipient:qr.recipient}), `พร้อมเพย์\nชื่อผู้รับเงิน: ${qr.recipient}`, token);
    }
    const order = (await db.get<ShopOrder>("SELECT * FROM shop_orders WHERE token = ?", token))!;
    await db.run("INSERT INTO shop_order_events (order_id, status) VALUES (?, ?)", order.id, order.status);
    await enqueueShopEvent(db, order.id, "order", `order:${order.id}`);
    await db.exec("COMMIT");
    return order;
  } catch (error) { await db.exec("ROLLBACK"); throw error; }
  finally { await db.close(); }
}

export async function getShopOrder(token: string) {
  if (!/^[a-f0-9]{48}$/.test(token)) return undefined;
  const db = await connectShopDb();
  try { return await db.get<ShopOrder>("SELECT * FROM shop_orders WHERE token = ?", token); }
  finally { await db.close(); }
}

export async function listShopOrders(): Promise<ShopOrder[]> {
  const db = await connectShopDb();
  try { return await db.all<ShopOrder[]>("SELECT * FROM shop_orders ORDER BY id DESC LIMIT 200"); }
  finally { await db.close(); }
}

export async function updateShopOrder(input: Record<string, unknown>) {
  if (!Number.isSafeInteger(input.id) || !Number.isSafeInteger(input.version)) throw new OrderError("รายการไม่ถูกต้อง");
  const db = await connectShopDb();
  try {
    await db.exec("BEGIN IMMEDIATE");
    const order = await db.get<ShopOrder>("SELECT * FROM shop_orders WHERE id = ?", input.id);
    if (!order) throw new OrderError("ไม่พบออเดอร์", 404);
    if (order.version !== input.version) throw new OrderError("รายการมีการเปลี่ยนแปลงแล้ว กรุณาโหลดใหม่", 409);
    let paymentQr = order.payment_qr_json;
    let status: OrderStatus = order.status;
    let shipping = order.shipping_baht, payment = order.payment_instructions, dispatch = order.dispatch_note, tracking = order.tracking;
    if (input.action === "quote" && ["requested", "quoted"].includes(status)) {
      if (!Number.isSafeInteger(input.shippingBaht) || Number(input.shippingBaht) < 0 || Number(input.shippingBaht) > 5000) throw new OrderError("กรอกค่าส่งรวมกล่องและค่าบริการทั้งหมด 0–5,000 บาท");
      const flatShipping = getShopShippingBaht(order.quantity);
      if (flatShipping !== null && input.shippingBaht !== flatShipping) throw new OrderError(`ค่าส่งเหมาจ่าย ${flatShipping} บาท สำหรับจำนวน ${order.quantity} แพ็ก`);
      if (input.paymentMethod === "qr") {
        const qr = parsePaymentQr(order.payment_qr_json) || await db.get<ShopPaymentConfig>("SELECT * FROM shop_payment_config WHERE id = 1");
        if (!qr) throw new OrderError("กรุณาตั้งค่า QR รับเงินก่อน");
        if (input.paymentQrFilename !== qr.filename) throw new OrderError("QR รับเงินมีการเปลี่ยนแปลง กรุณาโหลดหน้าใหม่แล้วตรวจอีกครั้ง", 409);
        paymentQr = JSON.stringify({filename:qr.filename, recipient:qr.recipient});
        payment = `พร้อมเพย์\nชื่อผู้รับเงิน: ${qr.recipient}`;
      } else {
        if (typeof input.paymentInstructions !== "string" || input.paymentInstructions.trim().length < 10 || input.paymentInstructions.length > 1000) throw new OrderError("กรอกช่องทางรับเงินและชื่อผู้รับเงินให้ครบ");
        payment = input.paymentInstructions.trim();
        paymentQr = "";
      }
      if (typeof input.dispatchNote !== "string" || !input.dispatchNote.trim() || input.dispatchNote.length > 500) throw new OrderError("กรอกขนส่งและรอบส่งที่ตรวจแล้ว");
      if (input.confirmed !== true) throw new OrderError("ต้องตรวจสินค้าพร้อมส่ง พื้นที่ ค่าส่ง และช่องทางรับเงินก่อน");
      shipping = Number(input.shippingBaht); dispatch = input.dispatchNote.trim(); status = "quoted";
    } else if (input.action === "paid" && status === "quoted" && input.confirmed === true) {
      status = "paid";
    } else if (input.action === "ship" && status === "paid") {
      if (typeof input.tracking !== "string" || input.tracking.trim().length < 4 || input.tracking.length > 200) throw new OrderError("กรอกชื่อขนส่งและเลขพัสดุ");
      tracking = input.tracking.trim(); status = "shipped";
    } else if (input.action === "cancel" && ["requested", "quoted"].includes(status)) {
      status = "cancelled";
    } else throw new OrderError("เปลี่ยนสถานะนี้ไม่ได้ กรุณาตรวจรายการและการรับเงินจริง", 409);
    await db.run(`UPDATE shop_orders SET status=?, shipping_baht=?, payment_instructions=?, payment_qr_json=?, dispatch_note=?, tracking=?, version=version+1, updated_at=CURRENT_TIMESTAMP WHERE id=?`, [status, shipping, payment, paymentQr, dispatch, tracking, order.id]);
    await db.run("INSERT INTO shop_order_events (order_id, status) VALUES (?, ?)", [order.id, status]);
    await db.exec("COMMIT");
  } catch (error) { await db.exec("ROLLBACK"); throw error; }
  finally { await db.close(); }
}
