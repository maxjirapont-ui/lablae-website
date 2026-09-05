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
  } catch (e) {
    console.error("Revalidation error:", e);
  }
}

// 0. Fetch Menu Items (Admin)
export async function GET(request: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const db = await getDb();
    const menus = await db.all("SELECT * FROM menus ORDER BY category, sort_order ASC, id ASC");
    return NextResponse.json({ success: true, menus });
  } catch (error) {
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" }, { status: 500 });
  }
}

// 1. Create Menu Item
export async function POST(request: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, price, category, description, image_url, is_recommended, is_seasonal, is_visible } = await request.json();

    if (!name || price === undefined || !category) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    const db = await getDb();
    await db.run(
      "INSERT INTO menus (name, price, category, description, image_url, available, is_recommended, is_seasonal, is_visible, sort_order) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM menus))",
      [
        name, 
        parseFloat(price), 
        category, 
        description || "", 
        image_url || "", 
        is_recommended ? 1 : 0, 
        is_seasonal ? 1 : 0, 
        is_visible !== undefined ? (is_visible ? 1 : 0) : 1
      ]
    );

    revalidateMenuPages();
    return NextResponse.json({ success: true, message: "เพิ่มเมนูอาหารเรียบร้อยแล้ว" });
  } catch (error) {
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" }, { status: 500 });
  }
}

// 2. Edit Menu Item
export async function PUT(request: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, name, price, category, description, image_url, available, is_recommended, is_seasonal, is_visible } = await request.json();

    if (!id || !name || price === undefined || !category) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    const db = await getDb();
    await db.run(
      "UPDATE menus SET name = ?, price = ?, category = ?, description = ?, image_url = ?, available = ?, is_recommended = ?, is_seasonal = ?, is_visible = ? WHERE id = ?",
      [
        name, 
        parseFloat(price), 
        category, 
        description || "", 
        image_url || "", 
        available !== undefined ? (available ? 1 : 0) : 1, 
        is_recommended ? 1 : 0, 
        is_seasonal ? 1 : 0, 
        is_visible !== undefined ? (is_visible ? 1 : 0) : 1, 
        id
      ]
    );

    revalidateMenuPages();
    return NextResponse.json({ success: true, message: "แก้ไขเมนูอาหารสำเร็จ" });
  } catch (error) {
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการแก้ไขข้อมูล" }, { status: 500 });
  }
}

// 3. Delete Menu Item
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
    await db.run("DELETE FROM menus WHERE id = ?", [id]);

    revalidateMenuPages();
    return NextResponse.json({ success: true, message: "ลบเมนูอาหารเรียบร้อยแล้ว" });
  } catch (error) {
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการลบข้อมูล" }, { status: 500 });
  }
}
