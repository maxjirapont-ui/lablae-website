"use client";
import { useState } from "react";
import ShopOrderAdmin from "./ShopOrderAdmin";
import type { ShopOrder } from "@/lib/shop-order-types";
import type { ShopPaymentConfig } from "@/lib/shop-payment";
import type { ShopSlip } from "@/lib/shop-slips";

const filters = { work:"งานค้าง", review:"รอตรวจสลิป", paid:"รอจัดส่ง", requested:"รอยืนยันค่าส่ง", unpaid:"รอลูกค้าจ่าย", shipped:"จัดส่งแล้ว", cancelled:"ยกเลิก", all:"ทั้งหมด" };
type Filter = keyof typeof filters;
export default function ShopOrdersBoard({orders,paymentConfig,slips}:{orders:ShopOrder[];paymentConfig?:ShopPaymentConfig;slips:ShopSlip[]}) {
  const [filter,setFilter]=useState<Filter>("work");
  const [query,setQuery]=useState("");
  const [message,setMessage]=useState("");
  const hasSlip = new Set(slips.map(slip=>slip.order_id));
  const group=(order:ShopOrder):Filter => order.status==="quoted" ? hasSlip.has(order.id)?"review":"unpaid" : order.status;
  const matches=(order:ShopOrder,key:Filter) => key==="all" || (key==="work" ? ["requested","quoted","paid"].includes(order.status) : group(order)===key);
  const priority:Record<string,number>={review:0,paid:1,requested:2,unpaid:3,shipped:4,cancelled:5};
  const term=query.trim().toLocaleLowerCase().replace(/[\s()-]/g,"");
  const visible=orders.filter(order=>matches(order,filter)&&(!term||[`LL-${order.id}`,String(order.id),order.phone,JSON.parse(order.address_json).name].some(value=>String(value).toLocaleLowerCase().replace(/[\s()-]/g,"").includes(term)))).sort((a,b)=>(priority[group(a)]-priority[group(b)])||b.id-a.id);
  return <section aria-label="รายการออเดอร์" className="space-y-5">
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {(Object.entries(filters) as [Filter,string][]).map(([key,label])=><button key={key} type="button" aria-label={label} aria-pressed={filter===key} onClick={()=>setFilter(key)} className={`rounded-xl border px-3 py-3 text-left ${filter===key?"border-accent bg-accent/15":"border-accent/30"}`}><span className="block text-sm">{label}</span><span data-testid={`shop-count-${key}`} className="text-2xl font-bold text-accent">{orders.filter(order=>matches(order,key)).length}</span></button>)}
    </div>
    <label className="block text-sm">ค้นหาเลขออเดอร์ ชื่อ หรือเบอร์ลูกค้า<input type="search" value={query} onChange={event=>setQuery(event.target.value)} className="mt-2 block w-full rounded-xl border border-accent/40 p-3 text-base" placeholder="เช่น LL-12 หรือเบอร์โทร"/></label>
    {message&&<p role="status" className="rounded-xl border border-accent/40 p-3 text-accent">{message}</p>}
    <p className="text-sm text-primary/70">แสดง {visible.length} รายการ · เรียงงานตรวจสลิปและจัดส่งก่อน</p>
    {visible.map(order=><ShopOrderAdmin key={`${order.id}-${order.version}`} order={order} paymentConfig={paymentConfig} slips={slips.filter(slip=>slip.order_id===order.id)} onSaved={setMessage}/>)}
    {!visible.length&&<p className="rounded-xl border border-accent/20 p-6">{query ? "ไม่พบรายการที่ค้นหา ลองตรวจเลขออเดอร์หรือเลือกทั้งหมด" : "ไม่มีออเดอร์ในกลุ่มนี้"}</p>}
  </section>;
}
