import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";
import { getUploadsDirectory } from "@/lib/storage";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as Blob | null;

    if (!file) {
      return NextResponse.json({ error: "ไม่พบไฟล์ที่อัปโหลด" }, { status: 400 });
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());

    const originalName = file instanceof File ? file.name : "";
    const ext = path.extname(originalName).toLowerCase();
    const isPdf = ext === ".pdf" || file.type === "application/pdf";

    // Generate unique name to prevent collisions
    const uniqueFilename = isPdf
      ? `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.pdf`
      : `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`;

    // Ensure uploads directory exists in public/
    const uploadDir = getUploadsDirectory();
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
