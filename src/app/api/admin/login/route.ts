import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  adminCookieOptions,
  authenticateAdminPassword,
  createAdminSession,
} from "@/lib/admin-auth";

const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const attempts = new Map<string, { count: number; startedAt: number }>();

function getClientKey(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

function isRateLimited(key: string): boolean {
  const attempt = attempts.get(key);
  if (!attempt) return false;
  if (Date.now() - attempt.startedAt >= ATTEMPT_WINDOW_MS) {
    attempts.delete(key);
    return false;
  }
  return attempt.count >= MAX_ATTEMPTS;
}

function recordFailure(key: string): void {
  const attempt = attempts.get(key);
  if (!attempt || Date.now() - attempt.startedAt >= ATTEMPT_WINDOW_MS) {
    attempts.set(key, { count: 1, startedAt: Date.now() });
    return;
  }
  attempt.count += 1;
}

export async function POST(request: NextRequest) {
  try {
    const clientKey = getClientKey(request);
    if (isRateLimited(clientKey)) {
      return NextResponse.json(
        { error: "ลองเข้าสู่ระบบหลายครั้งเกินไป กรุณารอ 15 นาทีแล้วลองใหม่" },
        { status: 429, headers: { "Retry-After": "900" } },
      );
    }

    const body = (await request.json()) as { password?: unknown };
    const password = typeof body.password === "string" ? body.password : "";
    const result = await authenticateAdminPassword(password);

    if (!result.configured) {
      return NextResponse.json(
        { error: "ยังไม่ได้ตั้งค่ารหัสผ่านผู้ดูแลระบบบนเซิร์ฟเวอร์" },
        { status: 503 },
      );
    }

    if (result.valid) {
      attempts.delete(clientKey);
      const response = NextResponse.json({ success: true, message: "เข้าสู่ระบบสำเร็จ" });
      const forwardedProto = request.headers.get("x-forwarded-proto");
      const secure = process.env.NODE_ENV === "production" || forwardedProto === "https";
      response.cookies.set(
        ADMIN_SESSION_COOKIE,
        await createAdminSession(),
        adminCookieOptions(secure),
      );

      return response;
    }

    recordFailure(clientKey);
    return NextResponse.json(
      { error: "รหัสผ่านไม่ถูกต้อง" },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการตรวจสอบรหัสผ่าน" },
      { status: 500 }
    );
  }
}
