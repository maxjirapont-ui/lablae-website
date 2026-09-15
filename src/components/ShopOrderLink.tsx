"use client";
import { useRef, useState } from "react";
export default function ShopOrderLink({token}:{token:string}) {
  const [message,setMessage]=useState("");
  const [fallback,setFallback]=useState("");
  const input=useRef<HTMLInputElement>(null);
  async function copy() {
    const url=`${location.origin}/shop/orders/${token}`;
    try { await navigator.clipboard.writeText(url); setMessage("คัดลอกลิงก์แล้ว เก็บไว้กลับมาแนบสลิปและดูสถานะได้ครับ"); }
    catch { setFallback(url); setMessage("แตะช่องลิงก์ค้างไว้เพื่อคัดลอก"); requestAnimationFrame(()=>{input.current?.focus();input.current?.select();}); }
  }
  return <div className="space-y-2">
    <button type="button" onClick={()=>void copy()} className="w-full rounded-xl border border-accent px-4 py-3 font-bold text-accent">เก็บลิงก์ออเดอร์นี้</button>
    {fallback && <input ref={input} aria-label="ลิงก์ออเดอร์ส่วนตัว" value={fallback} readOnly onFocus={event=>event.currentTarget.select()} className="w-full rounded-lg bg-white p-3 text-base text-stone-900"/>}
    {message && <p role="status" className="text-sm text-primary/80">{message}</p>}
  </div>;
}
