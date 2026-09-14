import { NextRequest, NextResponse } from "next/server";
import { parsePaymentQr } from "@/lib/shop-order-types";
import { getShopOrder } from "@/lib/shop-orders";
import { readPaymentQr } from "@/lib/shop-payment";

export async function GET(request: NextRequest, {params}: {params:Promise<{token:string}>}) {
  const headers = {"Cache-Control":"private, no-store", "X-Robots-Tag":"noindex, nofollow", "Referrer-Policy":"no-referrer"};
  const order = await getShopOrder((await params).token);
  const qr = order && order.status === "quoted" ? parsePaymentQr(order.payment_qr_json) : null;
  if (!qr) return new NextResponse(null, {status:404, headers});
  try {
    const bytes = await readPaymentQr(qr.filename);
    const ext = qr.filename.endsWith(".png") ? "png" : "jpg";
    return new NextResponse(new Uint8Array(bytes), {headers:{...headers,
      "Content-Type":ext === "png" ? "image/png" : "image/jpeg",
      "X-Content-Type-Options":"nosniff",
      "Content-Disposition":`${request.nextUrl.searchParams.get("download") === "1" ? "attachment" : "inline"}; filename="payment-qr.${ext}"`,
    }});
  } catch { return new NextResponse(null, {status:404, headers}); }
}
