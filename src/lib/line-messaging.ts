import { createHmac, timingSafeEqual } from "node:crypto";
import { getDb } from "./db";
import { getSetting } from "./data";
import type { ReservationRecord } from "./reservations";

const LINE_API_BASE = "https://api.line.me";

type LineMessage = Record<string, unknown>;

function getAccessToken(): string {
  return process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim() || "";
}

export function isLineConfigured(): boolean {
  return Boolean(getAccessToken() && process.env.LINE_CHANNEL_SECRET?.trim());
}

export function verifyLineSignature(body: string, signature: string | null): boolean {
  const secret = process.env.LINE_CHANNEL_SECRET?.trim();
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(body).digest("base64");
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature);
  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
}

async function callLine(path: string, body: Record<string, unknown>): Promise<boolean> {
  const token = getAccessToken();
  if (!token) return false;
  const response = await fetch(`${LINE_API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    console.error("LINE Messaging API request failed", response.status, await response.text());
    return false;
  }
  return true;
}

export async function replyLineMessage(replyToken: string, messages: LineMessage[]): Promise<boolean> {
  return callLine("/v2/bot/message/reply", { replyToken, messages });
}

export async function pushLineMessage(to: string, messages: LineMessage[]): Promise<boolean> {
  return callLine("/v2/bot/message/push", { to, messages });
}

export async function getLineGroupId(): Promise<string> {
  return process.env.LINE_GROUP_ID?.trim() || (await getSetting("line_group_id"));
}

export function getLineOfficialAccountId(): string {
  return process.env.LINE_OFFICIAL_ACCOUNT_ID?.trim() || "@299pgvbo";
}

export function makeLineConnectUrl(bookingCode: string): string {
  const accountId = getLineOfficialAccountId();
  return `https://line.me/R/oaMessage/${encodeURIComponent(accountId)}/?${encodeURIComponent(bookingCode)}`;
}

function reservationFlexMessage(reservation: ReservationRecord): LineMessage {
  const noteLine = reservation.notes ? reservation.notes : "ไม่มี";
  return {
    type: "flex",
    altText: `มีคำขอจองใหม่ ${reservation.booking_code || ""} ${reservation.date} ${reservation.time} น.`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#2C1A12",
        paddingAll: "18px",
        contents: [
          { type: "text", text: "มีคำขอจองโต๊ะใหม่", color: "#F2D49B", weight: "bold", size: "lg" },
          { type: "text", text: reservation.booking_code || `รายการ ${reservation.id}`, color: "#FFFFFF", size: "sm", margin: "sm" },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          { type: "text", text: `${reservation.date} เวลา ${reservation.time} น.`, weight: "bold", size: "lg", wrap: true },
          { type: "text", text: `${reservation.guests} คน · ${reservation.tables_required} โต๊ะ · ใช้โต๊ะประมาณ ${reservation.duration_minutes} นาที`, wrap: true },
          { type: "separator" },
          { type: "text", text: `ชื่อ: ${reservation.name}`, wrap: true },
          { type: "text", text: `โทร: ${reservation.phone}`, wrap: true },
          { type: "text", text: `หมายเหตุ: ${noteLine}`, wrap: true, color: "#555555" },
        ],
      },
      footer: {
        type: "box",
        layout: "horizontal",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#2E7D32",
            action: { type: "postback", label: "ยืนยันโต๊ะ", data: `action=confirm&id=${reservation.id}`, displayText: `ยืนยัน ${reservation.booking_code || reservation.id}` },
          },
          {
            type: "button",
            style: "secondary",
            action: { type: "postback", label: "ไม่รับการจอง", data: `action=cancel&id=${reservation.id}`, displayText: `ไม่รับ ${reservation.booking_code || reservation.id}` },
          },
        ],
      },
    },
  };
}

export async function sendReservationToStaff(reservation: ReservationRecord): Promise<boolean> {
  const groupId = await getLineGroupId();
  if (!isLineConfigured() || !groupId) return false;
  const sent = await pushLineMessage(groupId, [reservationFlexMessage(reservation)]);
  const db = await getDb();
  await db.run(
    "UPDATE reservations SET line_delivery_status = ? WHERE id = ?",
    [sent ? "sent" : "failed", reservation.id],
  );
  return sent;
}

export async function notifyCustomerOfStatus(reservation: ReservationRecord): Promise<boolean> {
  if (!reservation.customer_line_user_id || !isLineConfigured()) return false;
  const statusText = reservation.status === "confirmed"
    ? "ทางร้านยืนยันโต๊ะเรียบร้อยแล้ว"
    : reservation.status === "cancelled"
      ? "ทางร้านไม่สามารถรับการจองช่วงเวลานี้ได้ กรุณาเลือกเวลาใหม่หรือโทรสอบถามร้าน"
      : reservation.status === "completed"
        ? "รายการนี้เสร็จสิ้นแล้ว"
        : "รายการอยู่ระหว่างรอทางร้านยืนยัน";
  const siteUrl = process.env.SITE_URL?.replace(/\/$/, "") || "https://lablae-website-production.up.railway.app";
  return pushLineMessage(reservation.customer_line_user_id, [{
    type: "text",
    text: `${statusText}\nเลขที่การจอง: ${reservation.booking_code}\nวันที่ ${reservation.date} เวลา ${reservation.time} น.\nจำนวน ${reservation.guests} คน\nดูรายละเอียด: ${siteUrl}/booking/${reservation.booking_code}`,
  }]);
}

export async function getLineGroupMemberName(groupId: string, userId: string): Promise<string> {
  const token = getAccessToken();
  if (!token) return "พนักงานในกลุ่ม LINE";
  try {
    const response = await fetch(`${LINE_API_BASE}/v2/bot/group/${encodeURIComponent(groupId)}/member/${encodeURIComponent(userId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return "พนักงานในกลุ่ม LINE";
    const profile = await response.json() as { displayName?: string };
    return profile.displayName?.trim() || "พนักงานในกลุ่ม LINE";
  } catch {
    return "พนักงานในกลุ่ม LINE";
  }
}
