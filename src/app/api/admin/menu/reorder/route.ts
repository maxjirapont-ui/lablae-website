import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";

async function checkAuth() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  return session === "authenticated";
}

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

// POST: Reorder menus
// Accepts either:
// 1. { items: { id: number, sort_order: number }[] }
// 2. { id: number, action: 'top' | 'up' | 'down', category?: string }
export async function POST(request: NextRequest) {
  try {
    if (!(await checkAuth())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const db = await getDb();

    // 1. Batch items update
    if (Array.isArray(body.items)) {
      await db.run("BEGIN TRANSACTION");
      try {
        for (const item of body.items) {
          if (item.id && typeof item.sort_order === "number") {
            await db.run("UPDATE menus SET sort_order = ? WHERE id = ?", [item.sort_order, item.id]);
          }
        }
        await db.run("COMMIT");
      } catch (err) {
        await db.run("ROLLBACK");
        throw err;
      }
      revalidateMenuPages();
      return NextResponse.json({ success: true, message: "อัปเดตลำดับเมนูเรียบร้อยแล้ว" });
    }

    // 2. Single item action (top, up, down)
    const { id, action, category } = body;
    if (!id || !action) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    // Fetch items in the same category (or all if no category)
    let categoryMenus: { id: number; sort_order: number }[] = [];
    if (category && category !== "ทั้งหมด") {
      categoryMenus = await db.all(
        "SELECT id, sort_order FROM menus WHERE category = ? ORDER BY sort_order ASC, id ASC",
        [category]
      );
    } else {
      const current = await db.get<{ category: string }>("SELECT category FROM menus WHERE id = ?", [id]);
      if (current?.category) {
        categoryMenus = await db.all(
          "SELECT id, sort_order FROM menus WHERE category = ? ORDER BY sort_order ASC, id ASC",
          [current.category]
        );
      } else {
        categoryMenus = await db.all("SELECT id, sort_order FROM menus ORDER BY sort_order ASC, id ASC");
      }
    }

    const currentIndex = categoryMenus.findIndex(m => m.id === id);
    if (currentIndex === -1) {
      return NextResponse.json({ error: "ไม่พบเมนูที่ต้องการย้าย" }, { status: 404 });
    }

    const targetItem = categoryMenus[currentIndex];

    if (action === "top") {
      // Move to top: remove from current index, put at beginning
      categoryMenus.splice(currentIndex, 1);
      categoryMenus.unshift(targetItem);
    } else if (action === "up" && currentIndex > 0) {
      // Swap with previous
      const prev = categoryMenus[currentIndex - 1];
      categoryMenus[currentIndex - 1] = targetItem;
      categoryMenus[currentIndex] = prev;
    } else if (action === "down" && currentIndex < categoryMenus.length - 1) {
      // Swap with next
      const next = categoryMenus[currentIndex + 1];
      categoryMenus[currentIndex + 1] = targetItem;
      categoryMenus[currentIndex] = next;
    }

    // Persist new sequential sort_order for this group
    await db.run("BEGIN TRANSACTION");
    try {
      for (let i = 0; i < categoryMenus.length; i++) {
        await db.run("UPDATE menus SET sort_order = ? WHERE id = ?", [i + 1, categoryMenus[i].id]);
      }
      await db.run("COMMIT");
    } catch (err) {
      await db.run("ROLLBACK");
      throw err;
    }

    revalidateMenuPages();
    return NextResponse.json({ success: true, message: "ปรับลำดับเมนูสำเร็จ" });
  } catch (error: any) {
    console.error("Reorder Menu API Error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการจัดลำดับเมนู" },
      { status: 500 }
    );
  }
}
