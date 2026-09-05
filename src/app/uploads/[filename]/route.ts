import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { getLegacyUploadsDirectory, getUploadsDirectory } from "@/lib/storage";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    if (!filename) {
      return new NextResponse("File not specified", { status: 400 });
    }

    // Sanitize to avoid directory traversal
    const sanitizedFilename = path.basename(filename);
    const runtimePath = path.join(
      /*turbopackIgnore: true*/ getUploadsDirectory(),
      sanitizedFilename,
    );
    const legacyPath = path.join(
      /*turbopackIgnore: true*/ getLegacyUploadsDirectory(),
      sanitizedFilename,
    );
    let fileBuffer: Buffer;
    try {
      fileBuffer = await fs.readFile(/*turbopackIgnore: true*/ runtimePath);
    } catch {
      fileBuffer = await fs.readFile(/*turbopackIgnore: true*/ legacyPath);
    }

    // Determine content type based on extension
    const ext = path.extname(sanitizedFilename).toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".png") contentType = "image/png";
    else if (ext === ".webp") contentType = "image/webp";
    else if (ext === ".gif") contentType = "image/gif";
    else if (ext === ".svg") contentType = "image/svg+xml";

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    return new NextResponse("File not found", { status: 404 });
  }
}
