import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, CheckCircle2, Clock, Phone, Users, XCircle } from "lucide-react";
import { getDb } from "@/lib/db";
import { getSetting } from "@/lib/data";
import type { ReservationRecord } from "@/lib/reservations";
import BookingStatusRefresh from "@/components/BookingStatusRefresh";

export const revalidate = 0;

export const metadata = {
  title: "ตรวจสอบสถานะการจอง",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

function statusDetails(status: string) {
  if (status === "confirmed") return {
    label: "ยืนยันโต๊ะแล้ว",
    description: "ทางร้านเตรียมโต๊ะตามวันและเวลาที่จองไว้แล้วครับ",
    color: "border-emerald-300 bg-emerald-50 text-emerald-900",
    icon: <CheckCircle2 className="w-7 h-7 text-emerald-600" />,
  };
  if (status === "cancelled") return {
    label: "ไม่สามารถรับการจองนี้ได้",
    description: "กรุณาเลือกเวลาใหม่หรือโทรสอบถามทางร้านครับ",
    color: "border-rose-300 bg-rose-50 text-rose-900",
    icon: <XCircle className="w-7 h-7 text-rose-600" />,
  };
  if (status === "completed") return {
    label: "รายการเสร็จสิ้นแล้ว",
    description: "ขอบคุณที่แวะมากินข้าวที่บ้าน 100 ปีครับ",
    color: "border-blue-300 bg-blue-50 text-blue-900",
    icon: <CheckCircle2 className="w-7 h-7 text-blue-600" />,
  };
  return {
    label: "รอทางร้านยืนยัน",
    description: "ร้านได้รับคำขอจองแล้ว เจ้าหน้าที่จะโทรกลับไปยังเบอร์ที่ให้ไว้เพื่อยืนยันโต๊ะครับ",
    color: "border-amber-300 bg-amber-50 text-amber-900",
    icon: <Clock className="w-7 h-7 text-amber-600" />,
  };
}

export default async function BookingStatusPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const db = await getDb();
  const reservation = await db.get<ReservationRecord>(
    "SELECT * FROM reservations WHERE booking_code = ?",
    [code.toUpperCase()],
  );
  if (!reservation) notFound();
  const phone = (await getSetting("phone")) || "095-628-3125";
  const status = statusDetails(reservation.status);
  const dateLabel = new Intl.DateTimeFormat("th-TH-u-nu-latn", {
    day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Bangkok",
  }).format(new Date(`${reservation.date}T12:00:00+07:00`));

  return (
    <main className="max-w-2xl mx-auto px-4 py-12 sm:py-20 font-thai">
      <div className="rounded-3xl border border-stone-300 bg-white text-stone-900 shadow-xl overflow-hidden">
        <div className={`flex items-start gap-4 p-6 sm:p-8 border-b ${status.color}`}>
          {status.icon}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">{status.label}</h1>
            <p className="mt-2 text-base leading-7">{status.description}</p>
            <BookingStatusRefresh active={reservation.status === "pending"} />
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div>
            <p className="text-sm text-stone-600">เลขที่การจอง</p>
            <p className="font-mono text-lg font-bold tracking-wide text-stone-900">{reservation.booking_code}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 rounded-2xl bg-stone-100 p-4">
              <CalendarDays className="w-5 h-5 shrink-0 text-stone-600" aria-hidden="true" />
              <div><p className="text-sm text-stone-600">วันที่</p><p className="font-bold text-stone-900">{dateLabel}</p></div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-stone-100 p-4">
              <Clock className="w-5 h-5 text-stone-600" aria-hidden="true" />
              <div><p className="text-sm text-stone-600">เวลา</p><p className="font-bold text-stone-900">{reservation.time} น.</p></div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-stone-100 p-4">
              <Users className="w-5 h-5 text-stone-600" aria-hidden="true" />
              <div><p className="text-sm text-stone-600">จำนวน</p><p className="font-bold text-stone-900">{reservation.guests} คน</p></div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-stone-100 p-4">
              <Clock className="w-5 h-5 text-stone-600" aria-hidden="true" />
              <div><p className="text-sm text-stone-600">เวลารับประทานโดยประมาณ</p><p className="font-bold text-stone-900">{reservation.duration_minutes} นาที</p></div>
            </div>
          </div>

          {reservation.notes && (
            <div className="rounded-2xl border border-stone-300 p-4">
              <p className="text-sm text-stone-600">หมายเหตุ</p>
              <p className="mt-1 text-base text-stone-900 whitespace-pre-wrap">{reservation.notes}</p>
            </div>
          )}

          {reservation.status === "pending" && (
            <p className="rounded-xl bg-amber-50 p-4 text-base leading-7 text-amber-900">
              ตอนนี้รอรับสายจากร้านได้เลยครับ ไม่ต้องส่งคำขอจองซ้ำ
            </p>
          )}

          <div className="grid sm:grid-cols-2 gap-2">
            <a href={`tel:${phone.replace(/[^0-9+]/g, "")}`} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-stone-400 px-4 py-3 text-base font-bold text-stone-900 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-800">
              <Phone className="w-4 h-4" /> โทรสอบถามร้าน {phone}
            </a>
            <Link href="/menu" className="flex min-h-12 items-center justify-center rounded-xl bg-stone-800 px-4 py-3 text-base font-bold text-white hover:bg-stone-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-800">
              ดูเมนูอาหาร
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
