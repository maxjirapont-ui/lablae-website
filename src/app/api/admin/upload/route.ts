import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";

// Ensure auth check
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

    const formData = await request.formData();
    const file = formData.get("file") as Blob | null;

    if (!file) {
      return NextResponse.json({ error: "ไม่พบไฟล์ที่อัปโหลด" }, { status: 400 });
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());

    const originalName = (file as any).name || "";
    const ext = path.extname(originalName).toLowerCase();
    const isPdf = ext === ".pdf" || file.type === "application/pdf";

    // Generate unique name to prevent collisions
    const uniqueFilename = isPdf
      ? `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.pdf`
      : `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`;

    // Ensure uploads directory exists in public/
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    let finalBuffer: Buffer;
    if (isPdf) {
      finalBuffer = rawBuffer;
    } else {
      // Process and optimize image with sharp:
      // 1. rotate() automatically based on EXIF orientation from smartphones
      // 2. resize() to max 1600px without upscaling
      // 3. jpeg(quality 85) for fast web performance
      try {
        finalBuffer = await sharp(rawBuffer)
          .rotate()
          .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 85, mozjpeg: true })
          .toBuffer();
      } catch {
        // Fallback to raw buffer if format is not supported by sharp
        finalBuffer = rawBuffer;
      }
    }

    // Write file
    const filePath = path.join(uploadDir, uniqueFilename);
    await fs.writeFile(filePath, finalBuffer);

    // Return the public URL
    const publicUrl = `/uploads/${uniqueFilename}`;
    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการอัปโหลดไฟล์" }, { status: 500 });
  }
}
