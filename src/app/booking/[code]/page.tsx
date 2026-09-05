import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, CheckCircle2, Clock, MessageSquareText, Phone, Users, XCircle } from "lucide-react";
import { getDb } from "@/lib/db";
import { getSetting } from "@/lib/data";
import { makeLineConnectUrl } from "@/lib/line-messaging";
import type { ReservationRecord } from "@/lib/reservations";
import BookingStatusRefresh from "@/components/BookingStatusRefresh";

export const revalidate = 0;

export const metadata = {
  title: "ตรวจสอบสถานะการจอง | ร้านลำลำลับแลบ้าน 100 ปี",
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
    description: "ร้านได้รับคำขอแล้ว แต่ยังไม่ได้ยืนยันโต๊ะครับ",
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

  return (
    <main className="max-w-2xl mx-auto px-4 py-12 sm:py-20 font-thai">
      <div className="rounded-3xl border border-primary/15 bg-white shadow-xl overflow-hidden">
        <div className={`flex items-start gap-4 p-6 sm:p-8 border-b ${status.color}`}>
          {status.icon}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">{status.label}</h1>
            <p className="mt-1 text-sm opacity-80">{status.description}</p>
            <BookingStatusRefresh active={reservation.status === "pending"} />
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div>
            <p className="text-xs text-primary/50">เลขที่การจอง</p>
            <p className="font-mono text-lg font-bold tracking-wide text-primary">{reservation.booking_code}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 rounded-2xl bg-primary/5 p-4">
              <CalendarDays className="w-5 h-5 text-accent-dark" />
              <div><p className="text-xs text-primary/55">วันที่</p><p className="font-bold text-primary">{reservation.date}</p></div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-primary/5 p-4">
              <Clock className="w-5 h-5 text-accent-dark" />
              <div><p className="text-xs text-primary/55">เวลา</p><p className="font-bold text-primary">{reservation.time} น.</p></div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-primary/5 p-4">
              <Users className="w-5 h-5 text-accent-dark" />
              <div><p className="text-xs text-primary/55">จำนวน</p><p className="font-bold text-primary">{reservation.guests} คน</p></div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-primary/5 p-4">
              <Clock className="w-5 h-5 text-accent-dark" />
              <div><p className="text-xs text-primary/55">ระยะเวลาโต๊ะ</p><p className="font-bold text-primary">ประมาณ {reservation.duration_minutes} นาที</p></div>
            </div>
          </div>

          {reservation.notes && (
            <div className="rounded-2xl border border-primary/10 p-4">
              <p className="text-xs text-primary/50">หมายเหตุ</p>
              <p className="mt-1 text-sm text-primary/80 whitespace-pre-wrap">{reservation.notes}</p>
            </div>
          )}

          {!reservation.customer_line_user_id && reservation.status === "pending" && (
            <a href={makeLineConnectUrl(reservation.booking_code || "")} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-[#06C755] px-4 py-3 text-sm font-bold text-white hover:brightness-105">
              <MessageSquareText className="w-4 h-4" /> รับผลยืนยันทาง LINE
            </a>
          )}

          <div className="grid sm:grid-cols-2 gap-2">
            <a href={`tel:${phone.replace(/[^0-9+]/g, "")}`} className="flex items-center justify-center gap-2 rounded-xl border border-primary/15 px-4 py-3 text-sm font-bold text-primary hover:bg-primary/5">
              <Phone className="w-4 h-4" /> โทรสอบถามร้าน {phone}
            </a>
            <Link href="/#booking" className="flex items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary-light">
              กลับไปหน้าจองโต๊ะ
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
