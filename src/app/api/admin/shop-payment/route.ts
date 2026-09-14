import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getShopPaymentConfig, readPaymentQr, saveShopPaymentConfig } from "@/lib/shop-payment";

const headers = {"Cache-Control":"private, no-store", "X-Robots-Tag":"noindex, nofollow", "Referrer-Policy":"no-referrer"};
export async function GET() {
  if (!(await isAdminAuthenticated())) return new NextResponse(null, {status:401, headers});
  const config = await getShopPaymentConfig();
  if (!config) return new NextResponse(null, {status:404, headers});
  try {
    const bytes = await readPaymentQr(config.filename);
    return new NextResponse(new Uint8Array(bytes), {headers:{...headers, "Content-Type":config.filename.endsWith(".png") ? "image/png" : "image/jpeg", "X-Content-Type-Options":"nosniff"}});
  } catch { return new NextResponse(null, {status:404, headers}); }
}
export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({error:"กรุณาเข้าสู่ระบบ"}, {status:401, headers});
  if (request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({error:"คำขอไม่ถูกต้อง"}, {status:403, headers});
  if (Number(request.headers.get("content-length")) > 6 * 1024 * 1024) return NextResponse.json({error:"ไฟล์ใหญ่เกินไป"}, {status:413, headers});
  try {
    const form = await request.formData();
    const file = form.get("file");
    await saveShopPaymentConfig(String(form.get("recipient") || ""), Number(form.get("version")), file instanceof File ? file : undefined);
    return NextResponse.json({ok:true}, {headers});
  } catch (error) { return NextResponse.json({error:error instanceof Error ? error.message : "บันทึกไม่สำเร็จ"}, {status:400, headers}); }
}
