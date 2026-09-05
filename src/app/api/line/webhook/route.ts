import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  getLineGroupMemberName,
  notifyCustomerOfStatus,
  replyLineMessage,
  sendReservationToStaff,
  verifyLineSignature,
  getLineGroupId,
} from "@/lib/line-messaging";
import { buildBookingSlots, createReservation, getBookingConfig, transitionPendingReservation } from "@/lib/reservations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LineSource = { type: "user" | "group" | "room"; userId?: string; groupId?: string; roomId?: string };
type LineEvent = {
  type: string;
  webhookEventId?: string;
  replyToken?: string;
  source: LineSource;
  message?: { type: string; text?: string };
  postback?: { data?: string };
};

const HELP_TEXT = [
  "คำสั่งระบบจองโต๊ะ",
  "ปิด 2026-09-10 18:00",
  "เปิด 2026-09-10 18:00",
  "ปิดวัน 2026-09-10",
  "เปิดวัน 2026-09-10",
  "เพิ่ม 2026-09-10 18:00 4 0812345678 ชื่อลูกค้า | หมายเหตุ",
].join("\n");

async function rememberEvent(eventId?: string): Promise<boolean> {
  if (!eventId) return true;
  const db = await getDb();
  const result = await db.run("INSERT OR IGNORE INTO line_webhook_events (event_id) VALUES (?)", [eventId]);
  return Boolean(result.changes);
}

async function reply(replyToken: string | undefined, text: string): Promise<void> {
  if (replyToken) await replyLineMessage(replyToken, [{ type: "text", text }]);
}

async function handleJoin(event: LineEvent): Promise<void> {
  if (event.source.type !== "group" || !event.source.groupId) return;
  const db = await getDb();
  const configuredGroupId = await getLineGroupId();
  if (configuredGroupId && configuredGroupId !== event.source.groupId) {
    await reply(event.replyToken, "บัญชีร้านเชื่อมกับกลุ่มพนักงานอีกกลุ่มอยู่แล้ว");
    return;
  }
  await db.run(
    `INSERT INTO settings (key, value) VALUES ('line_group_id', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [event.source.groupId],
  );
  await reply(event.replyToken, `เชื่อมกลุ่มนี้กับระบบจองโต๊ะแล้ว\n\n${HELP_TEXT}`);
}

async function handlePostback(event: LineEvent): Promise<void> {
  if (!event.postback?.data) return;
  const params = new URLSearchParams(event.postback.data);
  const action = params.get("action");
  const id = Number(params.get("id"));
  if (!Number.isInteger(id) || !["confirm", "cancel"].includes(action || "")) return;

  const configuredGroupId = await getLineGroupId();
  if (event.source.type !== "group" || !event.source.groupId || event.source.groupId !== configuredGroupId) return;

  const groupId = event.source.groupId || "";
  const userId = event.source.userId || "";
  const staffName = groupId && userId ? await getLineGroupMemberName(groupId, userId) : "พนักงานในกลุ่ม LINE";
  const transition = await transitionPendingReservation(id, action === "confirm" ? "confirmed" : "cancelled", staffName);
  const reservation = transition.reservation;
  if (!transition.changed) {
    if (!reservation) {
      await reply(event.replyToken, "ไม่พบรายการจองนี้");
      return;
    }
    const label = reservation.status === "confirmed" ? "ยืนยันแล้ว" : reservation.status === "cancelled" ? "ไม่รับการจองแล้ว" : reservation.status;
    await reply(event.replyToken, `รายการนี้อัปเดตเป็น “${label}” ไปแล้ว`);
    return;
  }
  if (!reservation) return;
  await reply(
    event.replyToken,
    action === "confirm"
      ? `${staffName} ยืนยันโต๊ะ ${reservation.booking_code} แล้ว`
      : `${staffName} ไม่รับการจอง ${reservation.booking_code}`,
  );
  await notifyCustomerOfStatus(reservation);
}

async function handleCustomerMessage(event: LineEvent, text: string): Promise<void> {
  if (!event.source.userId) return;
  const bookingCode = text.trim().toUpperCase();
  // Accept the current numeric code and both previous formats so reservations
  // created before this change can still be connected.
  if (!/^(?:\d{6}|LL-[A-Z2-9]{6}|LL-\d{8}-[A-Z2-9]{8})$/.test(bookingCode)) {
    await reply(event.replyToken, "ส่งเลขที่การจองจากหน้าเว็บไซต์มาในแชทนี้ เพื่อรับข้อความยืนยันโต๊ะทาง LINE");
    return;
  }
  const db = await getDb();
  const result = await db.run(
    `UPDATE reservations SET customer_line_user_id = ?
     WHERE booking_code = ? AND (customer_line_user_id IS NULL OR customer_line_user_id = ?)`,
    [event.source.userId, bookingCode, event.source.userId],
  );
  if (!result.changes) {
    await reply(event.replyToken, "ไม่พบเลขที่การจองนี้ กรุณาตรวจสอบแล้วส่งอีกครั้ง");
    return;
  }
  const reservation = await db.get<{ date: string; time: string; guests: number; status: string }>(
    "SELECT date, time, guests, status FROM reservations WHERE booking_code = ?",
    [bookingCode],
  );
  const status = reservation?.status === "confirmed" ? "ยืนยันแล้ว" : reservation?.status === "cancelled" ? "ไม่รับการจอง" : "รอทางร้านยืนยัน";
  await reply(event.replyToken, `เชื่อมรายการ ${bookingCode} แล้ว\nวันที่ ${reservation?.date} เวลา ${reservation?.time} น. จำนวน ${reservation?.guests} คน\nสถานะ: ${status}`);
}

async function handleGroupCommand(event: LineEvent, text: string): Promise<void> {
  const db = await getDb();
  const groupId = event.source.groupId || "";
  const savedGroup = await db.get<{ value: string }>("SELECT value FROM settings WHERE key = 'line_group_id'");
  if (!groupId || savedGroup?.value !== groupId) return;
  const command = text.trim();
  if (/^(วิธีใช้|คำสั่ง|help)$/i.test(command)) {
    await reply(event.replyToken, HELP_TEXT);
    return;
  }

  const staffName = event.source.userId ? await getLineGroupMemberName(groupId, event.source.userId) : "พนักงานในกลุ่ม LINE";
  const slotCommand = /^(ปิด|เปิด)\s+(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})$/.exec(command);
  if (slotCommand) {
    const [, action, date, time] = slotCommand;
    if (action === "ปิด") {
      await db.run("INSERT OR IGNORE INTO booking_blocks (date, time, reason, created_by) VALUES (?, ?, 'ปิดจาก LINE', ?)", [date, time, staffName]);
    } else {
      await db.run("DELETE FROM booking_blocks WHERE date = ? AND time = ?", [date, time]);
    }
    await reply(event.replyToken, `${action}รับจองวันที่ ${date} เวลา ${time} น. แล้ว`);
    return;
  }

  const dayCommand = /^(ปิดวัน|เปิดวัน)\s+(\d{4}-\d{2}-\d{2})$/.exec(command);
  if (dayCommand) {
    const [, action, date] = dayCommand;
    if (action === "ปิดวัน") {
      await db.run("INSERT OR IGNORE INTO booking_blocks (date, time, reason, created_by) VALUES (?, '*', 'ปิดทั้งวันจาก LINE', ?)", [date, staffName]);
    } else {
      await db.run("DELETE FROM booking_blocks WHERE date = ?", [date]);
    }
    await reply(event.replyToken, `${action === "ปิดวัน" ? "ปิด" : "เปิด"}รับจองวันที่ ${date} ทั้งวันแล้ว`);
    return;
  }

  const addCommand = /^เพิ่ม\s+(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\s+(\d{1,2})\s+(\+?\d[\d-]{8,17})\s+([^|]+?)(?:\s*\|\s*(.*))?$/.exec(command);
  if (addCommand) {
    const [, date, time, guests, phone, name, notes] = addCommand;
    try {
      const reservation = await createReservation({ date, time, guests: Number(guests), phone, name, notes, source: "line" });
      await reply(event.replyToken, `เพิ่มรายการ ${reservation.booking_code} แล้ว กรุณากดยืนยันจากการ์ดรายการจอง`);
      await sendReservationToStaff(reservation);
    } catch (error) {
      await reply(event.replyToken, error instanceof Error ? error.message : "เพิ่มรายการจองไม่สำเร็จ");
    }
    return;
  }

  if (/^(ตาราง|เวลาจอง)$/.test(command)) {
    const config = await getBookingConfig(db);
    const slots = buildBookingSlots(config);
    await reply(event.replyToken, `เปิดรับจองทุก ${config.slotMinutes} นาที ตั้งแต่ ${slots[0]} ถึง ${slots.at(-1)} น.\n\n${HELP_TEXT}`);
  }
}

async function handleEvent(event: LineEvent): Promise<void> {
  if (!(await rememberEvent(event.webhookEventId))) return;
  if (event.type === "join") return handleJoin(event);
  if (event.type === "postback") return handlePostback(event);
  if (event.type !== "message" || event.message?.type !== "text" || !event.message.text) return;
  if (event.source.type === "user") return handleCustomerMessage(event, event.message.text);
  if (event.source.type === "group") return handleGroupCommand(event, event.message.text);
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  if (!verifyLineSignature(body, request.headers.get("x-line-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  try {
    const payload = JSON.parse(body) as { events?: LineEvent[] };
    for (const event of payload.events || []) await handleEvent(event);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("LINE webhook error", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
