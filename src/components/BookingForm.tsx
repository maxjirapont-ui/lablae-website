"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquareText,
  Phone,
  Send,
  User,
  Users,
} from "lucide-react";

type SlotStatus = "available" | "few" | "full";
type AvailabilityDay = {
  date: string;
  status: SlotStatus;
  slots: Array<{ time: string; status: SlotStatus; maxGuests: number }>;
};
type AvailabilityResponse = {
  config: { maxOnlineGuests: number; durationMinutes: number };
  days: AvailabilityDay[];
};
type SubmitResult = {
  message: string;
  bookingCode: string;
  statusUrl: string;
  lineConnectUrl?: string | null;
};

const STATUS_LABEL: Record<SlotStatus, string> = {
  available: "ว่าง",
  few: "เหลือน้อย",
  full: "เต็ม",
};

export default function BookingForm() {
  const [formData, setFormData] = useState({ name: "", phone: "", date: "", time: "", guests: "2", notes: "" });
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [availabilityError, setAvailabilityError] = useState("");
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [minimumDate, setMinimumDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SubmitResult | null>(null);

  const loadAvailability = useCallback(async (startDate?: string) => {
    setLoadingAvailability(true);
    setAvailabilityError("");
    try {
      const query = startDate
        ? `/api/reservations/availability?days=1&date=${encodeURIComponent(startDate)}`
        : "/api/reservations/availability?days=1";
      const response = await fetch(query, { cache: "no-store" });
      const data = await response.json() as AvailabilityResponse & { error?: string };
      if (!response.ok) throw new Error(data.error || "โหลดเวลาว่างไม่สำเร็จ");
      setAvailability(data);
      if (!startDate && data.days[0]?.date) setMinimumDate(data.days[0].date);
      setFormData((previous) => {
        const nextDate = data.days[0]?.date || startDate || "";
        const selectedDay = data.days.find((day) => day.date === nextDate);
        const selectedSlotStillOpen = selectedDay?.slots.some((slot) => slot.time === previous.time && slot.status !== "full");
        return {
          ...previous,
          date: nextDate,
          time: selectedSlotStillOpen ? previous.time : "",
        };
      });
    } catch (loadError) {
      setAvailabilityError(loadError instanceof Error ? loadError.message : "โหลดเวลาว่างไม่สำเร็จ");
    } finally {
      setLoadingAvailability(false);
    }
  }, []);

  useEffect(() => {
    // The state changes happen after the availability request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAvailability();
  }, [loadAvailability]);

  const selectedDay = useMemo(
    () => availability?.days.find((day) => day.date === formData.date),
    [availability, formData.date],
  );
  const guestCount = Number(formData.guests);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json() as SubmitResult & { error?: string };
      if (!response.ok) throw new Error(data.error || "ส่งคำขอจองไม่สำเร็จ กรุณาลองอีกครั้ง");
      setResult(data);
      setFormData((previous) => ({ ...previous, name: "", phone: "", time: "", guests: "2", notes: "" }));
      await loadAvailability(formData.date);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "ส่งคำขอจองไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto wood-card bg-[#241710] border border-accent/30 rounded-3xl shadow-2xl p-5 sm:p-8">
      <div className="text-center mb-6 space-y-1.5">
        <h3 className="font-thai text-xl sm:text-2xl font-bold text-cream">เลือกวันและเวลาที่ต้องการ</h3>
        <p className="font-thai text-sm text-cream/70">
          ร้านรับได้ 20 โต๊ะ รวม 80 ที่นั่ง การจองจะสมบูรณ์เมื่อได้รับข้อความยืนยันจากร้าน
        </p>
      </div>

      {result && (
        <div className="p-5 rounded-2xl mb-6 font-thai bg-emerald-950/70 text-emerald-100 border border-emerald-500/30 space-y-3" role="status">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">ร้านได้รับคำขอจองแล้ว</p>
              <p className="text-sm text-emerald-100/80">ตอนนี้ยังอยู่ระหว่างรอทางร้านยืนยันโต๊ะ</p>
            </div>
          </div>
          <div className="rounded-xl bg-black/20 px-4 py-3">
            <p className="text-xs text-emerald-100/60">เลขที่การจอง</p>
            <p className="font-mono text-base font-bold tracking-wide">{result.bookingCode}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {result.lineConnectUrl && (
              <a href={result.lineConnectUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#06C755] px-4 py-3 text-sm font-bold text-white hover:brightness-105">
                <MessageSquareText className="w-4 h-4" /> รับผลยืนยันทาง LINE
              </a>
            )}
            <a href={result.statusUrl} className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/40 px-4 py-3 text-sm font-bold text-emerald-100 hover:bg-white/5">
              <ExternalLink className="w-4 h-4" /> เช็กสถานะการจอง
            </a>
          </div>
        </div>
      )}

      {(error || availabilityError) && (
        <div className="flex items-start gap-3 p-4 rounded-xl mb-6 font-thai text-sm bg-rose-950/70 text-rose-200 border border-rose-500/30" role="alert">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <span>{error || availabilityError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset disabled={loadingAvailability}>
          <legend className="flex items-center gap-2 font-thai text-sm font-bold text-cream mb-3">
            <CalendarDays className="w-4 h-4 text-accent" /> วันที่จอง
          </legend>
          <input
            type="date"
            min={minimumDate || undefined}
            value={formData.date}
            onChange={(event) => {
              const date = event.target.value;
              setFormData((previous) => ({ ...previous, date, time: "" }));
              if (date) void loadAvailability(date);
            }}
            className="block w-full rounded-xl border border-accent/30 bg-[#1a100a] px-4 py-3 text-sm text-cream focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-60"
          />
        </fieldset>

        <fieldset disabled={!selectedDay}>
          <legend className="flex items-center gap-2 font-thai text-sm font-bold text-cream mb-3">
            <Clock className="w-4 h-4 text-accent" /> เลือกเวลา
          </legend>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {selectedDay?.slots.map((slot) => {
              const disabled = slot.status === "full" || guestCount > slot.maxGuests;
              const selected = formData.time === slot.time;
              return (
                <button
                  key={slot.time}
                  type="button"
                  disabled={disabled}
                  onClick={() => setFormData((previous) => ({ ...previous, time: slot.time }))}
                  aria-pressed={selected}
                  title={disabled && slot.maxGuests > 0 ? `ช่วงนี้รับได้ไม่เกิน ${slot.maxGuests} คน` : undefined}
                  className={`rounded-xl border px-2 py-2.5 text-sm font-bold transition-colors disabled:opacity-35 disabled:cursor-not-allowed ${selected ? "border-accent bg-accent text-[#1a100a]" : "border-white/10 bg-black/15 text-cream hover:border-accent/50"}`}
                >
                  {slot.time} น.
                  <span className="block mt-0.5 text-[10px] font-normal">{disabled ? "เต็ม" : STATUS_LABEL[slot.status]}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block font-thai text-sm font-bold text-cream">
            ชื่อผู้จอง
            <span className="relative block mt-1.5">
              <User className="absolute left-3 top-3 w-4 h-4 text-accent" />
              <input type="text" name="name" required maxLength={120} value={formData.name} onChange={handleChange} placeholder="ชื่อ–นามสกุล" className="block w-full pl-10 pr-3 py-2.5 border border-accent/30 rounded-xl bg-[#1a100a] text-[#f5ece1] focus:outline-none focus:ring-2 focus:ring-accent/40 text-sm placeholder:text-[#f5ece1]/40" />
            </span>
          </label>
          <label className="block font-thai text-sm font-bold text-cream">
            เบอร์โทรศัพท์
            <span className="relative block mt-1.5">
              <Phone className="absolute left-3 top-3 w-4 h-4 text-accent" />
              <input type="tel" name="phone" required inputMode="tel" value={formData.phone} onChange={handleChange} placeholder="095-628-3125" className="block w-full pl-10 pr-3 py-2.5 border border-accent/30 rounded-xl bg-[#1a100a] text-[#f5ece1] focus:outline-none focus:ring-2 focus:ring-accent/40 text-sm placeholder:text-[#f5ece1]/40" />
            </span>
          </label>
        </div>

        <label className="block font-thai text-sm font-bold text-cream">
          จำนวนคน
          <span className="relative block mt-1.5">
            <Users className="absolute left-3 top-3 w-4 h-4 text-accent pointer-events-none" />
            <select name="guests" value={formData.guests} onChange={(event) => setFormData((previous) => ({ ...previous, guests: event.target.value, time: "" }))} className="block w-full pl-10 pr-3 py-2.5 border border-accent/30 rounded-xl bg-[#1a100a] text-[#f5ece1] focus:outline-none focus:ring-2 focus:ring-accent/40 text-sm">
              {Array.from({ length: availability?.config.maxOnlineGuests || 20 }, (_, index) => index + 1).map((number) => <option key={number} value={number}>{number} คน</option>)}
            </select>
          </span>
          <span className="block mt-1.5 text-xs font-normal text-cream/55">มากกว่า 20 คน กรุณาโทรสอบถามร้านเพื่อจัดโต๊ะ</span>
        </label>

        <label className="block font-thai text-sm font-bold text-cream">
          หมายเหตุเพิ่มเติม <span className="font-normal text-cream/50">(ไม่บังคับ)</span>
          <textarea name="notes" rows={3} maxLength={300} value={formData.notes} onChange={handleChange} placeholder="เช่น มีเด็กเล็ก ผู้สูงอายุ ต้องการโต๊ะติดกัน ใช้รถเข็น หรือมีอาหารที่แพ้" className="mt-1.5 block w-full px-3 py-2.5 border border-accent/30 rounded-xl bg-[#1a100a] text-[#f5ece1] focus:outline-none focus:ring-2 focus:ring-accent/40 text-sm placeholder:text-[#f5ece1]/40 resize-y" />
          <span className="block mt-1 text-right text-xs font-normal text-cream/45">{formData.notes.length}/300</span>
        </label>

        <button type="submit" disabled={loading || !formData.date || !formData.time} className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl shadow-md text-sm font-bold text-[#1a100a] bg-gradient-to-r from-accent to-[#e6b87d] hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50 transition-all font-thai cursor-pointer">
          {loading ? <span className="w-5 h-5 border-2 border-[#1a100a] border-t-transparent rounded-full animate-spin" /> : <><Send className="w-4 h-4 mr-2" />ส่งคำขอจองโต๊ะ</>}
        </button>
        <p className="text-center text-xs text-cream/50">ร้านใช้ชื่อและเบอร์โทรเพื่อติดต่อเรื่องการจองนี้เท่านั้น</p>
      </form>
    </div>
  );
}
