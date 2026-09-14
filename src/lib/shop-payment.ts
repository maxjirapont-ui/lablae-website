import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import sharp from "sharp";
import { ensureRuntimeStorage, getDatabasePath } from "./storage";

import type { ShopPaymentQr } from "./shop-order-types";
export type ShopPaymentConfig = ShopPaymentQr & { version: number };
export const SHOP_PAYMENT_SCHEMA = `CREATE TABLE IF NOT EXISTS shop_payment_config (
  id INTEGER PRIMARY KEY CHECK (id = 1), filename TEXT NOT NULL,
  recipient TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1
)`;

async function connect() {
  ensureRuntimeStorage();
  const db = await open({filename: getDatabasePath(), driver: sqlite3.Database});
  await db.exec(`PRAGMA busy_timeout = 5000; ${SHOP_PAYMENT_SCHEMA}`);
  return db;
}

export async function getShopPaymentConfig() {
  const db = await connect();
  try { return await db.get<ShopPaymentConfig>("SELECT filename, recipient, version FROM shop_payment_config WHERE id = 1"); }
  finally { await db.close(); }
}

function paymentDirectory() { return path.join(path.dirname(getDatabasePath()), "shop-payment"); }

export async function readPaymentQr(filename: string) {
  if (!/^[a-f0-9]{64}\.(jpg|png)$/.test(filename)) throw new Error("Invalid QR filename");
  return fs.readFile(path.join(paymentDirectory(), filename));
}

export async function saveShopPaymentConfig(recipient: string, version: number, file?: File) {
  if (recipient.trim().length < 2 || recipient.length > 150) throw new Error("กรอกชื่อผู้รับเงิน 2–150 ตัวอักษร");
  if (!Number.isSafeInteger(version) || version < 0) throw new Error("กรุณาโหลดหน้าตั้งค่าใหม่");
  let filename: string | undefined;
  if (file?.size) {
    if (file.size > 5 * 1024 * 1024) throw new Error("รูป QR ต้องไม่เกิน 5 MB");
    const bytes = Buffer.from(await file.arrayBuffer());
    const info = await sharp(bytes, {limitInputPixels: 20_000_000}).metadata();
    if (!["jpeg", "png"].includes(info.format || "") || !info.width || !info.height || (info.pages || 1) > 1) throw new Error("ใช้รูป QR แบบ JPG หรือ PNG");
    filename = `${createHash("sha256").update(bytes).digest("hex")}.${info.format === "jpeg" ? "jpg" : "png"}`;
    await fs.mkdir(paymentDirectory(), {recursive: true});
    // Keep the exact source image: never redraw or recompress a payment QR.
    await fs.writeFile(path.join(paymentDirectory(), filename), bytes);
  }
  const db = await connect();
  try {
    await db.exec("BEGIN IMMEDIATE");
    const current = await db.get<ShopPaymentConfig>("SELECT * FROM shop_payment_config WHERE id = 1");
    if ((current?.version || 0) !== version) throw new Error("ข้อมูลรับเงินเปลี่ยนแล้ว กรุณาโหลดหน้าใหม่ก่อนแก้ไข");
    filename ||= current?.filename;
    if (!filename) throw new Error("กรุณาเลือกรูป QR รับเงิน");
    await db.run("INSERT INTO shop_payment_config(id,filename,recipient,version) VALUES(1,?,?,?) ON CONFLICT(id) DO UPDATE SET filename=excluded.filename, recipient=excluded.recipient, version=excluded.version", filename, recipient.trim(), version + 1);
    await db.exec("COMMIT");
  } catch (error) { await db.exec("ROLLBACK"); throw error; }
  finally { await db.close(); }
}
