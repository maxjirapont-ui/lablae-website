import { NextRequest, NextResponse } from "next/server";
import { getAvailability } from "@/lib/reservations";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const params = new URL(request.url).searchParams;
    const requestedDays = Number(params.get("days") || 21);
    const availability = await getAvailability(requestedDays, params.get("date") || undefined);
    return NextResponse.json(availability, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Availability API Error:", error);
    return NextResponse.json({ error: "โหลดเวลาว่างไม่สำเร็จ" }, { status: 500 });
  }
}
