import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { notifyCustomerOfStatus } from "@/lib/line-messaging";
import { updateReservationStatus } from "@/lib/reservations";

// Update reservation status
export async function PUT(request: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, status } = await request.json();

    const allowedStatuses = ["pending", "confirmed", "completed", "cancelled"];
    if (!id || !allowedStatuses.includes(status)) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    const reservation = await updateReservationStatus(Number(id), status, "หลังบ้าน");
    if (!reservation) return NextResponse.json({ error: "ไม่พบรายการจอง" }, { status: 404 });
    if (status === "confirmed" || status === "cancelled") {
      try {
        await notifyCustomerOfStatus(reservation);
      } catch (lineError) {
        console.error("Could not notify reservation customer", lineError);
      }
    }
    revalidatePath("/admin");

    return NextResponse.json({ success: true, message: "อัปเดตสถานะการจองสำเร็จ" });
  } catch {
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการอัปเดตข้อมูล" }, { status: 500 });
  }
}

// Delete reservation history
export async function DELETE(request: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    const db = await getDb();
    await db.run("DELETE FROM reservations WHERE id = ?", [id]);
    revalidatePath("/admin");

    return NextResponse.json({ success: true, message: "ลบประวัติการจองสำเร็จ" });
  } catch {
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการลบข้อมูล" }, { status: 500 });
  }
}
