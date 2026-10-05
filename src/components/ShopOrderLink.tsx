"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export function ShopCopyText({ value, label, success, absoluteUrl = false }: { value: string; label: string; success: string; absoluteUrl?: boolean }) {
  const [message, setMessage] = useState("");
  const [fallback, setFallback] = useState("");
  const input = useRef<HTMLTextAreaElement>(null);
  async function copy() {
    const text = absoluteUrl ? new URL(value, location.origin).href : value;
    try { await navigator.clipboard.writeText(text); setFallback(""); setMessage(success); }
    catch {
      setFallback(text);
      setMessage("แตะช่องด้านล่างค้างไว้เพื่อคัดลอก");
      requestAnimationFrame(() => { input.current?.focus(); input.current?.select(); });
    }
  }
  return <div className="space-y-2">
    <button type="button" onClick={() => void copy()} className="w-full rounded-xl border border-accent px-4 py-3 font-bold text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">{label}</button>
    {fallback && <textarea ref={input} aria-label={`ข้อความสำหรับ${label}`} value={fallback} rows={2} readOnly onFocus={event => event.currentTarget.select()} className="w-full rounded-lg bg-white p-3 text-base text-stone-900" />}
    {message && <p role="status" className="text-sm text-primary/80">{message}</p>}
  </div>;
}

export function ShopPaymentQrImage({ src, recipient }: { src: string; recipient: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);
  function showQr() {
    if (typeof dialog.current?.showModal !== "function") {
      window.open(src, "_blank", "noopener,noreferrer");
      return;
    }
    dialog.current.showModal();
    setOpen(true);
  }
  return <>
    <button ref={trigger} type="button" onClick={showQr} aria-label="เปิดรูป QR เต็มจอ" className="mx-auto block w-full max-w-sm rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#653c20]">
      <Image src={src} alt={`QR พร้อมเพย์ของ ${recipient}`} width={480} height={596} unoptimized className="h-auto w-full rounded-xl" />
      <span className="mt-2 block text-base underline underline-offset-4">แตะเพื่อเปิดรูป QR เต็มจอ</span>
    </button>
    <dialog ref={dialog} aria-label="รูป QR รับเงินเต็มจอ" onClose={() => { setOpen(false); trigger.current?.focus(); }} className="fixed inset-0 m-0 h-[100dvh] max-h-none w-screen max-w-none bg-stone-950 p-4 text-white backdrop:bg-black/80">
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <p className="break-words py-2">ชื่อผู้รับเงิน: {recipient}</p>
          <button type="button" onClick={() => dialog.current?.close()} className="shrink-0 rounded-lg border border-white/70 px-4 py-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">ปิดรูป QR</button>
        </div>
        <div className="min-h-0 flex-1">
          <Image src={src} alt={`QR พร้อมเพย์ของ ${recipient} แบบเต็มจอ`} width={480} height={596} unoptimized className="h-full w-full object-contain" />
        </div>
      </div>
    </dialog>
  </>;
}

export default function ShopOrderLink({ token, beforePayment = false }: { token: string; beforePayment?: boolean }) {
  return <div className="space-y-2">
    <ShopCopyText value={`/shop/orders/${token}`} absoluteUrl label="คัดลอกลิงก์ออเดอร์" success="คัดลอกลิงก์แล้ว นำไปเก็บไว้ในโน้ตหรือแชตส่วนตัวได้" />
    {!beforePayment && <p className="text-base leading-relaxed">เก็บลิงก์ไว้กลับมาดูสถานะออเดอร์</p>}
  </div>;
}
