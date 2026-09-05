import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/admin-auth";

function revalidateMenuPages() {
  try {
    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/menu");
    revalidatePath("/admin");
  } catch (err) {
    console.error("Revalidation notice:", err);
  }
}

// GET: Fetch current featured menu IDs
export async function GET() {
  try {
    const db = await getDb();
    const row = await db.get<{ value: string }>(
      "SELECT value FROM settings WHERE key = 'homepage_featured_menu_ids'"
    );
    let ids: number[] = [];
    if (row?.value) {
      try {
        ids = JSON.parse(row.value);
      } catch {}
    }
    return NextResponse.json({ success: true, featuredIds: ids });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการดึงข้อมูล";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST: Save ordered list of featured menu IDs
export async function POST(request: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { featuredIds } = body;

    if (!Array.isArray(featuredIds)) {
      return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง (featuredIds ต้องเป็น Array)" }, { status: 400 });
    }

    const validIds = featuredIds.map(Number).filter(n => Number.isInteger(n) && n > 0);
    const jsonStr = JSON.stringify(validIds);

    const db = await getDb();
    await db.run("BEGIN TRANSACTION");
    try {
      // 1. Save ordered list to settings
      await db.run(
        "INSERT INTO settings (key, value) VALUES ('homepage_featured_menu_ids', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        [jsonStr]
      );

      // 2. Reset all is_recommended to 0
      await db.run("UPDATE menus SET is_recommended = 0");

      // 3. Mark selected IDs as is_recommended = 1 and set sort_order sequentially
      for (let i = 0; i < validIds.length; i++) {
        const id = validIds[i];
        await db.run(
          "UPDATE menus SET is_recommended = 1, sort_order = ? WHERE id = ?",
          [i + 1, id]
        );
      }

      await db.run("COMMIT");
    } catch (err) {
      await db.run("ROLLBACK");
      throw err;
    }

    revalidateMenuPages();

    return NextResponse.json({
      success: true,
      message: "บันทึกลำดับเมนูแนะนำหน้าแรกสำเร็จ",
      featuredIds: validIds,
    });
  } catch (error: unknown) {
    console.error("Featured Order API Error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการบันทึกลำดับเมนูแนะนำ" },
      { status: 500 }
    );
  }
}
