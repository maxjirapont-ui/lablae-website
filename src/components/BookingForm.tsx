"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  Phone,
  RotateCcw,
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
type BookingDetails = {
  name: string;
  phone: string;
  date: string;
  time: string;
  guests: string;
  notes: string;
};

const initialFormData: BookingDetails = {
  name: "",
  phone: "",
  date: "",
  time: "",
  guests: "2",
  notes: "",
};

function formatBookingDate(date: string) {
  if (!date) return "";
  return new Intl.DateTimeFormat("th-TH-u-nu-latn", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  }).format(new Date(`${date}T12:00:00+07:00`));
}

export default function BookingForm() {
  const [formData, setFormData] = useState<BookingDetails>(initialFormData);
  const [submittedDetails, setSubmittedDetails] = useState<BookingDetails | null>(null);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [availabilityError, setAvailabilityError] = useState("");
  const [selectionNotice, setSelectionNotice] = useState("");
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [minimumDate, setMinimumDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SubmitResult | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

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
        const selectedSlotStillOpen = selectedDay?.slots.some(
          (slot) =>
            slot.time === previous.time &&
            slot.status !== "full" &&
            Number(previous.guests) <= slot.maxGuests,
        );
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

  useEffect(() => {
    if (!result) return;
    window.requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      resultRef.current?.focus({ preventScroll: true });
    });
  }, [result]);

  useEffect(() => {
    if (!error) return;
    window.requestAnimationFrame(() => {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      errorRef.current?.focus({ preventScroll: true });
    });
  }, [error]);

  const selectedDay = useMemo(
    () => availability?.days.find((day) => day.date === formData.date),
    [availability, formData.date],
  );
  const guestCount = Number(formData.guests);
  const availableSlots = useMemo(
    () => selectedDay?.slots.filter(
      (slot) => slot.status !== "full" && guestCount <= slot.maxGuests,
    ) || [],
    [guestCount, selectedDay],
  );

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleGuestChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const guests = event.target.value;
    const selectedSlot = selectedDay?.slots.find((slot) => slot.time === formData.time);
    const timeStillWorks = !formData.time || Boolean(
      selectedSlot && selectedSlot.status !== "full" && Number(guests) <= selectedSlot.maxGuests,
    );
    setSelectionNotice(
      timeStillWorks ? "" : "ช่วงเวลาที่เลือกมีที่ไม่พอสำหรับจำนวนนี้ กรุณาเลือกเวลาใหม่ครับ",
    );
    setFormData((previous) => ({
      ...previous,
      guests,
      time: timeStillWorks ? previous.time : "",
    }));
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
      setSubmittedDetails({ ...formData });
      setResult(data);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "ส่งคำขอจองไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  const handleNewBooking = () => {
    const date = formData.date;
    setResult(null);
    setSubmittedDetails(null);
    setError("");
    setSelectionNotice("");
    setFormData({ ...initialFormData, date });
    void loadAvailability(date || undefined);
    window.requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  if (result && submittedDetails) {
    return (
      <div
        ref={resultRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className="w-full max-w-2xl mx-auto rounded-3xl border border-emerald-500/35 bg-[#18251d] p-6 shadow-2xl outline-none sm:p-9"
      >
        <div className="text-center font-thai">
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-400" aria-hidden="true" />
          <h3 className="mt-4 text-2xl font-bold text-cream sm:text-3xl">ได้รับคำขอจองแล้ว</h3>
          <p className="mx-auto mt-3 max-w-lg text-base leading-7 text-cream/80">
            เจ้าหน้าที่ร้านจะโทรกลับที่ <strong className="text-cream">{submittedDetails.phone}</strong> เพื่อยืนยันโต๊ะครับ
          </p>
        </div>

        <div className="mt-7 rounded-2xl border border-white/10 bg-black/20 p-5 font-thai">
          <p className="text-sm font-bold text-emerald-300">รายละเอียดที่ส่งให้ร้าน</p>
          <dl className="mt-4 grid gap-4 text-base sm:grid-cols-2">
            <div>
              <dt className="text-sm text-cream/55">วันที่</dt>
              <dd className="mt-1 font-semibold text-cream">{formatBookingDate(submittedDetails.date)}</dd>
            </div>
            <div>
              <dt className="text-sm text-cream/55">เวลา</dt>
              <dd className="mt-1 font-semibold text-cream">{submittedDetails.time} น.</dd>
            </div>
            <div>
              <dt className="text-sm text-cream/55">จำนวน</dt>
              <dd className="mt-1 font-semibold text-cream">{submittedDetails.guests} คน</dd>
            </div>
            <div>
              <dt className="text-sm text-cream/55">ชื่อผู้จอง</dt>
              <dd className="mt-1 font-semibold text-cream">{submittedDetails.name}</dd>
            </div>
          </dl>
          <p className="mt-5 border-t border-white/10 pt-4 text-xs text-cream/50">
            เลขที่การจอง {result.bookingCode}
          </p>
        </div>

        <div className="mt-6 rounded-2xl bg-emerald-500/12 px-4 py-4 text-center font-thai text-base font-bold text-emerald-200">
          เรียบร้อยครับ ตอนนี้รอรับสายจากเจ้าหน้าที่ร้านได้เลย
        </div>
        <p className="mt-5 text-center font-thai text-sm text-cream/55">ตัวเลือกเพิ่มเติม</p>
        <div className="mt-2 flex flex-wrap justify-center gap-x-6 gap-y-3 font-thai">
          <a
            href={result.statusUrl}
            className="inline-flex min-h-11 items-center justify-center gap-2 text-sm font-semibold text-cream/75 underline decoration-white/25 underline-offset-4 hover:text-cream"
          >
            <ExternalLink className="h-5 w-5" aria-hidden="true" /> เช็กสถานะการจอง
          </a>
          <button
            type="button"
            onClick={handleNewBooking}
            className="inline-flex min-h-11 items-center justify-center gap-2 text-sm font-semibold text-cream/75 underline decoration-white/25 underline-offset-4 hover:text-cream"
          >
            <RotateCcw className="h-5 w-5" aria-hidden="true" /> จองโต๊ะเพิ่ม
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto wood-card bg-[#241710] border border-accent/30 rounded-3xl shadow-2xl p-5 sm:p-8">
      {availabilityError && (
        <div className="flex items-start gap-3 p-4 rounded-xl mb-6 font-thai text-base bg-rose-950/70 text-rose-100 border border-rose-500/30" role="alert">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{availabilityError}</span>
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block font-thai text-base font-bold text-cream">
            วันที่จะมา
            <span className="relative block mt-2">
              <CalendarDays className="absolute left-4 top-4 w-5 h-5 text-accent pointer-events-none" aria-hidden="true" />
              <input
                type="date"
                required
                min={minimumDate || undefined}
                disabled={loadingAvailability}
                value={formData.date}
                onChange={(event) => {
                  const date = event.target.value;
                  setSelectionNotice("");
                  setFormData((previous) => ({ ...previous, date, time: "" }));
                  if (date) void loadAvailability(date);
                }}
                className="block min-h-14 w-full rounded-xl border border-accent/40 bg-[#1a100a] py-3 pl-12 pr-3 text-base text-cream focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </span>
          </label>

          <label className="block font-thai text-base font-bold text-cream">
            จำนวนคน
            <span className="relative block mt-2">
              <Users className="absolute left-4 top-4 w-5 h-5 text-accent pointer-events-none" aria-hidden="true" />
              <select
                name="guests"
                value={formData.guests}
                onChange={handleGuestChange}
                className="block min-h-14 w-full rounded-xl border border-accent/40 bg-[#1a100a] py-3 pl-12 pr-3 text-base text-cream focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {Array.from({ length: availability?.config.maxOnlineGuests || 20 }, (_, index) => index + 1).map((number) => (
                  <option key={number} value={number}>{number} คน</option>
                ))}
              </select>
            </span>
          </label>
        </div>

        <label className="block font-thai text-base font-bold text-cream">
          เวลาที่สะดวก
          <span className="relative block mt-2">
            <Clock className="absolute left-4 top-4 w-5 h-5 text-accent pointer-events-none" aria-hidden="true" />
            <select
              required
              value={formData.time}
              disabled={loadingAvailability || !selectedDay || availableSlots.length === 0}
              onChange={(event) => {
                setSelectionNotice("");
                setFormData((previous) => ({ ...previous, time: event.target.value }));
              }}
              className="block min-h-14 w-full rounded-xl border border-accent/40 bg-[#1a100a] py-3 pl-12 pr-3 text-base text-cream focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-55"
            >
              <option value="">
                {loadingAvailability
                  ? "กำลังดูเวลาว่าง..."
                  : availableSlots.length > 0
                    ? "กดเพื่อเลือกเวลา"
                    : "ไม่มีเวลาว่างสำหรับจำนวนนี้"}
              </option>
              {availableSlots.map((slot) => (
                <option key={slot.time} value={slot.time}>{slot.time} น.</option>
              ))}
            </select>
          </span>
          {selectionNotice && (
            <span className="mt-2 block text-sm font-normal leading-6 text-amber-300" role="alert">{selectionNotice}</span>
          )}
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block font-thai text-base font-bold text-cream">
            ชื่อผู้จอง
            <span className="relative block mt-2">
              <User className="absolute left-4 top-4 w-5 h-5 text-accent" aria-hidden="true" />
              <input
                type="text"
                name="name"
                required
                maxLength={120}
                autoComplete="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="เช่น สมชาย"
                className="block min-h-14 w-full rounded-xl border border-accent/40 bg-[#1a100a] py-3 pl-12 pr-3 text-base text-[#f5ece1] placeholder:text-[#f5ece1]/40 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </span>
          </label>
          <label className="block font-thai text-base font-bold text-cream">
            เบอร์โทรศัพท์
            <span className="relative block mt-2">
              <Phone className="absolute left-4 top-4 w-5 h-5 text-accent" aria-hidden="true" />
              <input
                type="tel"
                name="phone"
                required
                inputMode="tel"
                autoComplete="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="095-628-3125"
                className="block min-h-14 w-full rounded-xl border border-accent/40 bg-[#1a100a] py-3 pl-12 pr-3 text-base text-[#f5ece1] placeholder:text-[#f5ece1]/40 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </span>
          </label>
        </div>

        <label className="block font-thai text-base font-bold text-cream">
          หมายเหตุ <span className="font-normal text-cream/55">(ไม่ต้องกรอกก็ได้)</span>
          <textarea
            name="notes"
            rows={2}
            maxLength={300}
            value={formData.notes}
            onChange={handleChange}
            placeholder="เช่น มีผู้สูงอายุ ใช้รถเข็น หรือมีอาหารที่แพ้"
            className="mt-2 block w-full resize-y rounded-xl border border-accent/40 bg-[#1a100a] px-4 py-3 text-base text-[#f5ece1] placeholder:text-[#f5ece1]/40 focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>

        {formData.date && formData.time && (
          <div className="rounded-xl border border-accent/25 bg-accent/10 px-4 py-3 font-thai text-base leading-7 text-cream">
            <span className="text-cream/65">ข้อมูลที่เลือก: </span>
            <strong>{formatBookingDate(formData.date)} เวลา {formData.time} น. จำนวน {formData.guests} คน</strong>
          </div>
        )}

        {error && (
          <div
            ref={errorRef}
            tabIndex={-1}
            className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-950/70 p-4 font-thai text-base text-rose-100 outline-none"
            role="alert"
          >
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !formData.date || !formData.time}
          className="flex min-h-14 w-full items-center justify-center rounded-xl bg-gradient-to-r from-accent to-[#e6b87d] px-5 py-3.5 font-thai text-base font-bold text-[#1a100a] shadow-md transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <><span className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-[#1a100a] border-t-transparent" />กำลังส่งข้อมูล...</>
          ) : (
            <><Send className="mr-2 h-5 w-5" aria-hidden="true" />ส่งคำขอจองโต๊ะ</>
          )}
        </button>
        <p className="text-center font-thai text-sm leading-6 text-cream/60">
          กดส่งเพียงครั้งเดียว แล้วรอเจ้าหน้าที่โทรกลับเพื่อยืนยันโต๊ะครับ
        </p>
      </form>
    </div>
  );
}
