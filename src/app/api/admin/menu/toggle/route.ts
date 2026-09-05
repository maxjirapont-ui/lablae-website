import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const cookieStore = await cookies();
    const session = cookieStore.get("admin_session")?.value;
    if (session !== "authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, available, is_recommended, is_seasonal, is_visible, image_url } = await request.json();

    if (id === undefined) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const db = await getDb();

    if (available !== undefined) {
      await db.run("UPDATE menus SET available = ? WHERE id = ?", [available ? 1 : 0, id]);
    }
    if (is_recommended !== undefined) {
      await db.run("UPDATE menus SET is_recommended = ? WHERE id = ?", [is_recommended ? 1 : 0, id]);
    }
    if (is_seasonal !== undefined) {
      await db.run("UPDATE menus SET is_seasonal = ? WHERE id = ?", [is_seasonal ? 1 : 0, id]);
    }
    if (is_visible !== undefined) {
      await db.run("UPDATE menus SET is_visible = ? WHERE id = ?", [is_visible ? 1 : 0, id]);
    }
    if (image_url !== undefined) {
      await db.run("UPDATE menus SET image_url = ? WHERE id = ?", [image_url || "", id]);
    }

    try {
      revalidatePath("/", "layout");
      revalidatePath("/");
      revalidatePath("/menu");
      revalidatePath("/admin");
    } catch (e) {
      console.error("Revalidation error:", e);
    }

    return NextResponse.json({ success: true, message: "อัปเดตสถานะเมนูสำเร็จ" });
  } catch (error) {
    return NextResponse.json({ error: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" }, { status: 500 });
  }
}

