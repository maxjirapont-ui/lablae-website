import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
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

    let settings: Record<string, string> | null = null;
    try {
      const body = await request.json();
      if (body && body.settings) {
        settings = body.settings;
      }
    } catch {
      // Body is optional
    }

    const db = await getDb();

    // 1. If settings were passed in, persist them
    if (settings && typeof settings === "object") {
      for (const [key, value] of Object.entries(settings)) {
        if (typeof value === "string") {
          await db.run(
            `INSERT INTO settings (key, value) VALUES (?, ?)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
            [key, value]
          );
        }
      }
    }

    // 2. Record publish timestamp
    const nowIso = new Date().toISOString();
    await db.run(
      `INSERT INTO settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      ["last_published_at", nowIso]
    );

    // 3. Revalidate all site paths
    try {
      revalidatePath("/", "layout");
      revalidatePath("/");
      revalidatePath("/about");
      revalidatePath("/menu");
      revalidatePath("/blog");
      revalidatePath("/admin");
    } catch (revalErr) {
      console.error("Revalidation notice:", revalErr);
    }

    return NextResponse.json({
      success: true,
      message: "เผยแพร่ข้อมูลทั้งหมดขึ้นสู่หน้าเว็บจริงเรียบร้อยแล้ว ทุกหน้าอัปเดตเป็นเวอร์ชันล่าสุด",
      published_at: nowIso,
    });
  } catch (error: any) {
    console.error("Publish All API Error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการเผยแพร่ข้อมูล กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  }
}
