import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSetting } from "@/lib/data";

export async function POST(request: NextRequest) {
  try {
    const { name, phone, date, time, guests } = await request.json();

    if (!name || !phone || !date || !time || !guests) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบถ้วน" },
        { status: 400 }
      );
    }

    const db = await getDb();
    
    // Save reservation
    await db.run(
      `INSERT INTO reservations (name, phone, date, time, guests, status) 
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [name, phone, date, time, parseInt(guests, 10)]
    );

    // Send LINE Notify if token is configured
    const lineToken = await getSetting("line_notify_token");
    if (lineToken && lineToken.trim() !== "") {
      const message = `\n🔔 มีการจองโต๊ะใหม่!\n👤 ชื่อผู้จอง: ${name}\n📞 เบอร์โทร: ${phone}\n📅 วันที่: ${date}\n⏰ เวลา: ${time}\n👥 จำนวน: ${guests} ท่าน`;

      try {
        const lineResponse = await fetch("https://notify-api.line.me/api/notify", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Bearer ${lineToken}`,
          },
          body: new URLSearchParams({ message }).toString(),
        });

        if (!lineResponse.ok) {
          console.error("Failed to send LINE Notify:", await lineResponse.text());
        }
      } catch (err) {
        console.error("Error calling LINE Notify API:", err);
      }
    } else {
      console.warn("LINE Notify token is not configured in settings.");
    }

    return NextResponse.json({
      success: true,
      message: "ได้รับข้อมูลการจองแล้ว ทางร้านจะตรวจสอบและติดต่อกลับเพื่อยืนยันโต๊ะ",
    });
  } catch (error: unknown) {
    console.error("Reservation API Error:", error);
    return NextResponse.json(
      { error: "ส่งข้อมูลการจองไม่สำเร็จ กรุณาลองอีกครั้ง" },
      { status: 500 }
    );
  }
}
