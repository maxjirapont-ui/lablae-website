import { isShopOriginAllowed } from "@/lib/shop-origin";
import { after, NextRequest, NextResponse } from "next/server";
import { flushShopNotifications } from "@/lib/shop-line";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createShopOrder, OrderError, shopIsPublic } from "@/lib/shop-orders";

export async function POST(request: NextRequest) {
  if (!isShopOriginAllowed(request)) return NextResponse.json({error:"คำขอไม่ถูกต้อง"}, {status:403});
  if (!request.headers.get("content-type")?.startsWith("application/json")) return NextResponse.json({error:"ข้อมูลไม่ถูกต้อง"}, {status:415});
  if (process.env.NODE_ENV === "production" && !shopIsPublic() && !(await isAdminAuthenticated())) return NextResponse.json({error:"ร้านยังไม่เปิดรับออเดอร์ออนไลน์"}, {status:403});
  try {
    const text = await request.text();
    if (text.length > 10_000) return NextResponse.json({error:"ข้อมูลยาวเกินไป"}, {status:413});
    let input: unknown;
    try { input = JSON.parse(text); } catch { return NextResponse.json({error:"ข้อมูลไม่ถูกต้อง"}, {status:400}); }
    const order = await createShopOrder(input);
    after(async () => { try { await flushShopNotifications(); } catch { console.error("Shop LINE dispatch deferred"); } });
    return NextResponse.json({url:`/shop/orders/${order.token}`, orderNumber:`LL-${order.id}`, status:order.status}, {status:201, headers:{"Cache-Control":"no-store"}});
  } catch (error) {
    return NextResponse.json({error:error instanceof OrderError ? error.message : "บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง"}, {status:error instanceof OrderError ? error.status : 500});
  }
}
