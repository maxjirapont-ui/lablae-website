import { NextRequest, NextResponse } from "next/server";
import { createReservation } from "@/lib/reservations";
import { makeLineConnectUrl, sendReservationToStaff } from "@/lib/line-messaging";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const reservation = await createReservation({
      name: String(body.name || ""),
      phone: String(body.phone || ""),
      date: String(body.date || ""),
      time: String(body.time || ""),
      guests: Number(body.guests),
      notes: String(body.notes || ""),
      source: "web",
    });

    // The reservation is already safe in the database. A temporary LINE outage
    // must never make the customer submit the same reservation twice.
    try {
      await sendReservationToStaff(reservation);
    } catch (lineError) {
      console.error("Could not deliver reservation to LINE", lineError);
    }

    return NextResponse.json({
      success: true,
      message: "ร้านได้รับคำขอจองแล้ว กรุณารอข้อความยืนยันโต๊ะจากทางร้าน",
      bookingCode: reservation.booking_code,
      statusUrl: `/booking/${reservation.booking_code}`,
      lineConnectUrl: reservation.booking_code ? makeLineConnectUrl(reservation.booking_code) : null,
    });
  } catch (error: unknown) {
    console.error("Reservation API Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ส่งคำขอจองไม่สำเร็จ กรุณาลองอีกครั้ง" },
      { status: 400 }
    );
  }
}
