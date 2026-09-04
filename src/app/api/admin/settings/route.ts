import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";

// Auth helper
async function checkAuth() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  return session === "authenticated";
}

export async function POST(request: NextRequest) {
  try {
    if (!(await checkAuth())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settingsObj = await request.json(); // format: { key: value, ... }
    const db = await getDb();

    for (const [key, value] of Object.entries(settingsObj)) {
      if (typeof value === "string") {
        await db.run(
          "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
          [key, value]
        );
      }
    }

    return NextResponse.json({ success: true, message: "บันทึกตั้งค่าสำเร็จ" });
  } catch (error) {
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" }, { status: 500 });
  }
}
