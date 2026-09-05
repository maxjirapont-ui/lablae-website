import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { saveAdminSettings } from "@/lib/admin-settings";

export async function POST(request: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settingsObj = (await request.json()) as unknown;
    if (!settingsObj || typeof settingsObj !== "object" || Array.isArray(settingsObj)) {
      return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }
    const result = await saveAdminSettings(settingsObj as Record<string, unknown>);

    // Bust cache instantly across the entire application
    try {
      revalidatePath("/", "layout");
      revalidatePath("/");
      revalidatePath("/about");
      revalidatePath("/menu");
      revalidatePath("/blog");
      revalidatePath("/blog/[slug]", "page");
      revalidatePath("/admin");
    } catch (revalErr) {
      console.error("Revalidation notice:", revalErr);
    }

    return NextResponse.json({
      success: true,
      message: "บันทึกตั้งค่าสำเร็จ",
      revalidated: true,
      password_changed: result.passwordChanged,
    });
  } catch (error) {
    console.error("Settings POST error:", error);
    const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการบันทึกข้อมูล";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
