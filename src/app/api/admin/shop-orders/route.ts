import { isShopOriginAllowed } from "@/lib/shop-origin";
import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { OrderError, updateShopOrder } from "@/lib/shop-orders";

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({error:"กรุณาเข้าสู่ระบบ"},{status:401});
  if (!isShopOriginAllowed(request)) return NextResponse.json({error:"คำขอไม่ถูกต้อง"},{status:403});
  try {
    const text = await request.text();
    if (text.length > 5000) return NextResponse.json({error:"ข้อมูลยาวเกินไป"},{status:413});
    let body: unknown;
    try { body = JSON.parse(text); } catch { return NextResponse.json({error:"ข้อมูลไม่ถูกต้อง"},{status:400}); }
    if (!body || typeof body !== "object") return NextResponse.json({error:"ข้อมูลไม่ถูกต้อง"},{status:400});
    await updateShopOrder(body as Record<string, unknown>);
    return NextResponse.json({ok:true}, {headers:{"Cache-Control":"no-store"}});
  } catch(error) {
    return NextResponse.json({error:error instanceof OrderError ? error.message : "บันทึกไม่สำเร็จ"},{status:error instanceof OrderError ? error.status : 500});
  }
}
