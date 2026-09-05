import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { saveAdminSettings } from "@/lib/admin-settings";
import { hasPersistentStorage } from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) {
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

    // 1. If settings were passed in, persist them without accepting secret hashes from the client.
    if (settings && typeof settings === "object") {
      await saveAdminSettings(settings);
    }

    // 2. Record the candidate publish timestamp so it is included in the commit.
    const previousPublishedAt = await db.get<{ value: string }>(
      "SELECT value FROM settings WHERE key = ?",
      ["last_published_at"],
    );
    const nowIso = new Date().toISOString();
    await db.run(
      `INSERT INTO settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      ["last_published_at", nowIso]
    );

    // 3. Revalidate all site paths locally
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

    // 4. Production content must live on an attached persistent volume.
    const persistent = hasPersistentStorage();
    if (process.env.NODE_ENV === "production" && !persistent) {
      if (previousPublishedAt) {
        await db.run(
          "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
          ["last_published_at", previousPublishedAt.value],
        );
      } else {
        await db.run("DELETE FROM settings WHERE key = ?", ["last_published_at"]);
      }
      return NextResponse.json(
        {
          success: false,
          error: "ยังไม่ได้เชื่อมพื้นที่เก็บข้อมูลถาวร จึงหยุดอัปเดตเพื่อป้องกันข้อมูลหายหลังรีสตาร์ต",
          persistent: false,
        },
        { status: 503 },
      );
    }

    return NextResponse.json({
      success: true,
      message: persistent
        ? "บันทึกข้อมูลและอัปเดตเว็บไซต์เรียบร้อยแล้ว"
        : "บันทึกข้อมูลและอัปเดตตัวอย่างเว็บไซต์ในเครื่องเรียบร้อยแล้ว",
      published_at: nowIso,
      persistent,
    });
  } catch (error: unknown) {
    console.error("Publish All API Error:", error);
    return NextResponse.json(
      { error: "อัปเดตเว็บไซต์ไม่สำเร็จ กรุณาลองอีกครั้ง" },
      { status: 500 }
    );
  }
}
