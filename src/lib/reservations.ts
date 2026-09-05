import { randomBytes } from "node:crypto";
import type { Database } from "sqlite";
import { getDb } from "./db";

export const BOOKING_TIME_ZONE = "Asia/Bangkok";

export interface BookingConfig {
  openTime: string;
  closeTime: string;
  slotMinutes: number;
  durationMinutes: number;
  guestCapacity: number;
  tableCapacity: number;
  maxOnlineGuests: number;
  advanceDays: number;
  minimumLeadMinutes: number;
}

export interface ReservationRecord {
  id: number;
  booking_code: string | null;
  name: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  notes: string;
  tables_required: number;
  duration_minutes: number;
  status: string;
  source: string;
  customer_line_user_id: string | null;
  line_delivery_status: string;
  status_updated_at: string | null;
  status_updated_by: string;
  created_at: string;
}

export interface AvailabilitySlot {
  time: string;
  status: "available" | "few" | "full";
  maxGuests: number;
}

export interface AvailabilityDay {
  date: string;
  status: "available" | "few" | "full";
  slots: AvailabilitySlot[];
}

const DEFAULT_CONFIG: BookingConfig = {
  openTime: "10:00",
  closeTime: "20:00",
  slotMinutes: 30,
  durationMinutes: 60,
  guestCapacity: 80,
  tableCapacity: 20,
  maxOnlineGuests: 20,
  advanceDays: 30,
  minimumLeadMinutes: 30,
};

const CONFIG_KEYS = [
  "booking_open_time",
  "booking_close_time",
  "booking_slot_minutes",
  "booking_duration_minutes",
  "booking_guest_capacity",
  "booking_table_capacity",
  "booking_max_online_guests",
  "booking_advance_days",
  "booking_minimum_lead_minutes",
] as const;

function parsePositiveInt(value: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

export async function getBookingConfig(dbArg?: Database): Promise<BookingConfig> {
  const db = dbArg || (await getDb());
  const placeholders = CONFIG_KEYS.map(() => "?").join(",");
  const rows = await db.all<Array<{ key: string; value: string }>>(
    `SELECT key, value FROM settings WHERE key IN (${placeholders})`,
    [...CONFIG_KEYS],
  );
  const values = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

  return {
    openTime: timePattern.test(values.booking_open_time || "") ? values.booking_open_time : DEFAULT_CONFIG.openTime,
    closeTime: timePattern.test(values.booking_close_time || "") ? values.booking_close_time : DEFAULT_CONFIG.closeTime,
    slotMinutes: parsePositiveInt(values.booking_slot_minutes, DEFAULT_CONFIG.slotMinutes, 15, 120),
    durationMinutes: parsePositiveInt(values.booking_duration_minutes, DEFAULT_CONFIG.durationMinutes, 30, 240),
    guestCapacity: parsePositiveInt(values.booking_guest_capacity, DEFAULT_CONFIG.guestCapacity, 1, 500),
    tableCapacity: parsePositiveInt(values.booking_table_capacity, DEFAULT_CONFIG.tableCapacity, 1, 100),
    maxOnlineGuests: parsePositiveInt(values.booking_max_online_guests, DEFAULT_CONFIG.maxOnlineGuests, 1, 100),
    advanceDays: parsePositiveInt(values.booking_advance_days, DEFAULT_CONFIG.advanceDays, 1, 180),
    minimumLeadMinutes: parsePositiveInt(values.booking_minimum_lead_minutes, DEFAULT_CONFIG.minimumLeadMinutes, 0, 1440),
  };
}

export function timeToMinutes(time: string): number {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  return match ? Number(match[1]) * 60 + Number(match[2]) : -1;
}

export function minutesToTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

export function buildBookingSlots(config: BookingConfig): string[] {
  const open = timeToMinutes(config.openTime);
  const close = timeToMinutes(config.closeTime);
  if (open < 0 || close <= open) return [];
  const lastStart = close - config.durationMinutes;
  const slots: string[] = [];
  for (let minute = open; minute <= lastStart; minute += config.slotMinutes) {
    slots.push(minutesToTime(minute));
  }
  return slots;
}

function bangkokNow(): { date: string; minute: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: BOOKING_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || "";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minute: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day + days));
  return value.toISOString().slice(0, 10);
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}

function tablesForGuests(guests: number): number {
  return Math.ceil(guests / 4);
}

function slotCapacity(
  slotTime: string,
  config: BookingConfig,
  reservations: ReservationRecord[],
): { guests: number; tables: number } {
  const slotStart = timeToMinutes(slotTime);
  const slotEnd = slotStart + config.durationMinutes;
  let usedGuests = 0;
  let usedTables = 0;

  for (const reservation of reservations) {
    const start = timeToMinutes(reservation.time);
    const end = start + (reservation.duration_minutes || config.durationMinutes);
    if (start < slotEnd && end > slotStart) {
      usedGuests += reservation.guests;
      usedTables += reservation.tables_required || tablesForGuests(reservation.guests);
    }
  }

  return {
    guests: Math.max(0, config.guestCapacity - usedGuests),
    tables: Math.max(0, config.tableCapacity - usedTables),
  };
}

export async function getAvailability(days?: number, requestedStartDate?: string): Promise<{ config: BookingConfig; days: AvailabilityDay[] }> {
  const db = await getDb();
  const config = await getBookingConfig(db);
  const today = bangkokNow().date;
  const startDate = requestedStartDate && isIsoDate(requestedStartDate) && requestedStartDate >= today
    ? requestedStartDate
    : today;
  const dayCount = Math.min(31, Math.max(1, days || 21));
  const lastDate = addDays(startDate, dayCount - 1);
  const reservations = await db.all<ReservationRecord[]>(
    `SELECT * FROM reservations
     WHERE date BETWEEN ? AND ? AND status IN ('pending', 'confirmed')`,
    [startDate, lastDate],
  );
  const blocks = await db.all<Array<{ date: string; time: string }>>(
    "SELECT date, time FROM booking_blocks WHERE date BETWEEN ? AND ?",
    [startDate, lastDate],
  );
  const slots = buildBookingSlots(config);
  const now = bangkokNow();

  const availabilityDays = Array.from({ length: dayCount }, (_, index) => {
    const date = addDays(startDate, index);
    const dayReservations = reservations.filter((reservation) => reservation.date === date);
    const dayBlocks = new Set(blocks.filter((block) => block.date === date).map((block) => block.time));
    const daySlots = slots.map<AvailabilitySlot>((time) => {
      const unavailableByTime = date === now.date && timeToMinutes(time) < now.minute + config.minimumLeadMinutes;
      const blocked = dayBlocks.has("*") || dayBlocks.has(time) || unavailableByTime;
      const remaining = slotCapacity(time, config, dayReservations);
      const maxGuests = blocked ? 0 : Math.min(remaining.guests, remaining.tables * 4, config.maxOnlineGuests);
      const status: AvailabilitySlot["status"] = maxGuests <= 0
        ? "full"
        : maxGuests <= Math.min(8, Math.ceil(config.maxOnlineGuests * 0.4))
          ? "few"
          : "available";
      return { time, status, maxGuests };
    });
    const openSlots = daySlots.filter((slot) => slot.status !== "full");
    const status: AvailabilityDay["status"] = openSlots.length === 0
      ? "full"
      : openSlots.every((slot) => slot.status === "few")
        ? "few"
        : "available";
    return { date, status, slots: daySlots };
  });

  return { config, days: availabilityDays };
}

function generateBookingCode(date: string): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  let suffix = "";
  for (const byte of bytes) suffix += alphabet[byte % alphabet.length];
  return `LL-${date.replaceAll("-", "")}-${suffix}`;
}

export async function createReservation(input: {
  name: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  notes?: string;
  source?: "web" | "line" | "admin";
}): Promise<ReservationRecord> {
  const db = await getDb();
  const config = await getBookingConfig(db);
  const name = input.name.trim().slice(0, 120);
  const phone = input.phone.replace(/[^0-9+]/g, "");
  const notes = (input.notes || "").trim();
  const guests = Number(input.guests);
  const maximumGuests = input.source === "web" ? config.maxOnlineGuests : config.guestCapacity;
  const now = bangkokNow();

  if (name.length < 2) throw new Error("กรุณากรอกชื่อผู้จอง");
  if (!/^\+?\d{9,15}$/.test(phone)) throw new Error("กรุณาตรวจสอบเบอร์โทรศัพท์");
  if (!isIsoDate(input.date) || input.date < now.date) throw new Error("กรุณาเลือกวันที่ตั้งแต่วันนี้เป็นต้นไป");
  if (!Number.isInteger(guests) || guests < 1 || guests > maximumGuests) {
    throw new Error(input.source === "web"
      ? `ระบบออนไลน์รับจองไม่เกิน ${config.maxOnlineGuests} คน กรุณาโทรสอบถามร้านสำหรับกลุ่มใหญ่`
      : `จำนวนคนต้องอยู่ระหว่าง 1–${config.guestCapacity} คน`);
  }
  if (notes.length > 300) throw new Error("หมายเหตุยาวเกิน 300 ตัวอักษร");
  if (!buildBookingSlots(config).includes(input.time)) throw new Error("กรุณาเลือกเวลาที่ร้านเปิดรับจอง");
  if (input.date === now.date && timeToMinutes(input.time) < now.minute + config.minimumLeadMinutes) {
    throw new Error("เวลานี้ใกล้เกินไป กรุณาเลือกเวลาใหม่หรือโทรสอบถามร้าน");
  }

  const tablesRequired = tablesForGuests(guests);
  await db.exec("BEGIN IMMEDIATE");
  try {
    const blocked = await db.get<{ id: number }>(
      "SELECT id FROM booking_blocks WHERE date = ? AND time IN (?, '*') LIMIT 1",
      [input.date, input.time],
    );
    if (blocked) throw new Error("ช่วงเวลานี้ปิดรับจองแล้ว กรุณาเลือกเวลาอื่น");

    const existing = await db.all<ReservationRecord[]>(
      "SELECT * FROM reservations WHERE date = ? AND status IN ('pending', 'confirmed')",
      [input.date],
    );
    const duplicate = existing.find((reservation) => reservation.phone === phone && reservation.time === input.time);
    if (duplicate) throw new Error(`เบอร์นี้มีรายการจองเวลาเดียวกันแล้ว (${duplicate.booking_code || `รายการ ${duplicate.id}`})`);
    const remaining = slotCapacity(input.time, config, existing);
    if (remaining.guests < guests || remaining.tables < tablesRequired) {
      throw new Error("ช่วงเวลานี้มีที่นั่งไม่พอสำหรับจำนวนที่เลือก กรุณาเลือกเวลาอื่น");
    }

    const bookingCode = generateBookingCode(input.date);
    const result = await db.run(
      `INSERT INTO reservations
       (booking_code, name, phone, date, time, guests, notes, tables_required, duration_minutes, status, source, line_delivery_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, 'pending')`,
      [bookingCode, name, phone, input.date, input.time, guests, notes, tablesRequired, config.durationMinutes, input.source || "web"],
    );
    const reservation = await db.get<ReservationRecord>("SELECT * FROM reservations WHERE id = ?", [result.lastID]);
    if (!reservation) throw new Error("ไม่พบรายการจองที่เพิ่งสร้าง");
    await db.exec("COMMIT");
    return reservation;
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  }
}

export async function updateReservationStatus(
  id: number,
  status: "pending" | "confirmed" | "completed" | "cancelled",
  updatedBy: string,
): Promise<ReservationRecord | undefined> {
  const db = await getDb();
  await db.run(
    `UPDATE reservations
     SET status = ?, status_updated_at = CURRENT_TIMESTAMP, status_updated_by = ?
     WHERE id = ?`,
    [status, updatedBy.slice(0, 120), id],
  );
  return db.get<ReservationRecord>("SELECT * FROM reservations WHERE id = ?", [id]);
}

export async function transitionPendingReservation(
  id: number,
  status: "confirmed" | "cancelled",
  updatedBy: string,
): Promise<{ changed: boolean; reservation?: ReservationRecord }> {
  const db = await getDb();
  const result = await db.run(
    `UPDATE reservations
     SET status = ?, status_updated_at = CURRENT_TIMESTAMP, status_updated_by = ?
     WHERE id = ? AND status = 'pending'`,
    [status, updatedBy.slice(0, 120), id],
  );
  const reservation = await db.get<ReservationRecord>("SELECT * FROM reservations WHERE id = ?", [id]);
  return { changed: Boolean(result.changes), reservation };
}
