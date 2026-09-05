import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { toArabicDigits } from "@/lib/text";

function revalidateArticlePages() {
  try {
    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/about");
    revalidatePath("/blog");
    revalidatePath("/blog/[slug]", "page");
    revalidatePath("/admin");
  } catch (e) {
    console.error("Revalidation error:", e);
  }
}

// 0. Fetch Articles (Admin)
export async function GET() {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const db = await getDb();
    const articles = await db.all("SELECT * FROM articles ORDER BY part_number ASC, chapter_number ASC, id ASC");
    return NextResponse.json({ success: true, articles });
  } catch {
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" }, { status: 500 });
  }
}

// 1. Create Article
export async function POST(request: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, slug, content, image_url, part_title, excerpt } = await request.json();

    if (!title || !slug || !content) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    // Basic slug format validation
    const cleanSlug = slug.trim().toLowerCase().replace(/\s+/g, "-");

    const db = await getDb();
    
    try {
      await db.run(
        "INSERT INTO articles (title, slug, content, image_url, part_title, excerpt) VALUES (?, ?, ?, ?, ?, ?)",
        [
          toArabicDigits(String(title)),
          cleanSlug,
          toArabicDigits(String(content)),
          image_url || "",
          toArabicDigits(String(part_title || "")),
          toArabicDigits(String(excerpt || "")),
        ]
      );
    } catch (dbErr: unknown) {
      if (dbErr instanceof Error && dbErr.message.includes("UNIQUE")) {
        return NextResponse.json({ error: "ลิงก์บทความ (Slug) ซ้ำกับบทความอื่น" }, { status: 400 });
      }
      throw dbErr;
    }

    revalidateArticlePages();
    return NextResponse.json({ success: true, message: "สร้างบทความใหม่สำเร็จ" });
  } catch {
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" }, { status: 500 });
  }
}

// 2. Edit Article
export async function PUT(request: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, title, slug, content, image_url, part_title, excerpt } = await request.json();

    if (!id || !title || !slug || !content) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    const cleanSlug = slug.trim().toLowerCase().replace(/\s+/g, "-");
    const db = await getDb();

    try {
      await db.run(
        "UPDATE articles SET title = ?, slug = ?, content = ?, image_url = ?, part_title = COALESCE(?, part_title), excerpt = COALESCE(?, excerpt) WHERE id = ?",
        [
          toArabicDigits(String(title)),
          cleanSlug,
          toArabicDigits(String(content)),
          image_url || "",
          part_title == null ? null : toArabicDigits(String(part_title)),
          excerpt == null ? null : toArabicDigits(String(excerpt)),
          id,
        ]
      );
    } catch (dbErr: unknown) {
      if (dbErr instanceof Error && dbErr.message.includes("UNIQUE")) {
        return NextResponse.json({ error: "ลิงก์บทความ (Slug) ซ้ำกับบทความอื่น" }, { status: 400 });
      }
      throw dbErr;
    }

    revalidateArticlePages();
    return NextResponse.json({ success: true, message: "แก้ไขบทความสำเร็จ" });
  } catch {
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการแก้ไขข้อมูล" }, { status: 500 });
  }
}

// 3. Delete Article
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
    await db.run("DELETE FROM articles WHERE id = ?", [id]);

    revalidateArticlePages();
    return NextResponse.json({ success: true, message: "ลบบทความเรียบร้อยแล้ว" });
  } catch {
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการลบข้อมูล" }, { status: 500 });
  }
}
