import { randomUUID } from "node:crypto";
import type { Database } from "sqlite";

export const SHOP_EVENTS_SCHEMA = `
 CREATE TABLE IF NOT EXISTS shop_line_config (
   id INTEGER PRIMARY KEY CHECK(id=1), group_id TEXT NOT NULL DEFAULT '',
   pair_hash TEXT NOT NULL DEFAULT '', pair_expires INTEGER NOT NULL DEFAULT 0
 );
 INSERT OR IGNORE INTO shop_line_config(id) VALUES(1);
 CREATE TABLE IF NOT EXISTS shop_line_outbox (
   id INTEGER PRIMARY KEY AUTOINCREMENT, event_key TEXT NOT NULL UNIQUE,
   order_id INTEGER NOT NULL, kind TEXT NOT NULL, retry_key TEXT NOT NULL,
   state TEXT NOT NULL DEFAULT 'pending', recipient TEXT NOT NULL DEFAULT '',
   payload TEXT NOT NULL DEFAULT '', first_attempt INTEGER NOT NULL DEFAULT 0,
   next_attempt INTEGER NOT NULL DEFAULT 0, lease_until INTEGER NOT NULL DEFAULT 0,
   attempts INTEGER NOT NULL DEFAULT 0, error TEXT NOT NULL DEFAULT ''
 );
 CREATE TABLE IF NOT EXISTS shop_order_slips (
   id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL, request_key TEXT NOT NULL,
   filename TEXT NOT NULL, digest TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
   UNIQUE(order_id,request_key)
 );`;

export async function enqueueShopEvent(db:Database, orderId:number, kind:"order"|"slip", eventKey:string) {
  await db.run("INSERT OR IGNORE INTO shop_line_outbox(event_key,order_id,kind,retry_key) VALUES(?,?,?,?)", eventKey, orderId, kind, randomUUID());
}
