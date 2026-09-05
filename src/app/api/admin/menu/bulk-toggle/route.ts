import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  try {
    // Auth check
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { category, available, is_visible } = await request.json();

    if (!category) {
      return NextResponse.json({ error: "Missing category parameter" }, { status: 400 });
    }

    const db = await getDb();

    if (available !== undefined) {
      await db.run(
        "UPDATE menus SET available = ? WHERE category = ?",
        [available ? 1 : 0, category]
      );
    }

    if (is_visible !== undefined) {
      await db.run(
        "UPDATE menus SET is_visible = ? WHERE category = ?",
        [is_visible ? 1 : 0, category]
      );
    }

    try {
      revalidatePath("/", "layout");
      revalidatePath("/");
      revalidatePath("/menu");
      revalidatePath("/admin");
    } catch (e) {
      console.error("Revalidation error:", e);
    }

    return NextResponse.json({ success: true, message: "อัปเดตสถานะหมวดหมู่สำเร็จ" });
  } catch (error) {
    console.error("Bulk toggle error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" }, { status: 500 });
  }
}
