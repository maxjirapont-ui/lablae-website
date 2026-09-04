import { NextRequest, NextResponse } from "next/server";
import { getSetting } from "@/lib/data";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const storedPassword = await getSetting("admin_password");

    // Default password fallback if setting is somehow missing
    const correctPassword = storedPassword || "admin1234";

    if (password === correctPassword) {
      const response = NextResponse.json({ success: true, message: "เข้าสู่ระบบสำเร็จ" });
      
      // Set session cookie (compatible with localhost HTTP and local IP)
      response.cookies.set("admin_session", "authenticated", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });

      return response;
    }

    return NextResponse.json(
      { error: "รหัสผ่านไม่ถูกต้อง" },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการตรวจสอบรหัสผ่าน" },
      { status: 500 }
    );
  }
}
