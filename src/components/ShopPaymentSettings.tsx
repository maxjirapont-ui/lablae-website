"use client";
import Image from "next/image";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ShopPaymentConfig } from "@/lib/shop-payment";

export default function ShopPaymentSettings({config}: {config?:ShopPaymentConfig}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function save(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/shop-payment", {method:"POST", body:new FormData(form)});
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "บันทึกไม่สำเร็จ");
      setMessage("บันทึก QR รับเงินแล้ว");
      form.reset();
      router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "บันทึกไม่สำเร็จ"); }
    finally { setBusy(false); }
  }
  const field = "mt-2 block w-full rounded-xl border border-stone-400 bg-white p-3 text-stone-900";
  return <details className="rounded-2xl border border-accent/30 p-5">
    <summary className="cursor-pointer font-bold text-lg">ตั้งค่ารับเงิน {config ? "· พร้อมเพย์พร้อมใช้" : "· ยังไม่มี QR"}</summary>
    <div className="mt-5 space-y-4">
      {config && <><p>ชื่อผู้รับเงิน: {config.recipient}</p><Image key={config.version} src={`/api/admin/shop-payment?v=${config.version}`} alt="QR รับเงินปัจจุบัน" width={320} height={398} unoptimized className="h-auto w-full max-w-xs rounded-xl" /></>}
      <form onSubmit={save} className="space-y-4">
        <input type="hidden" name="version" value={config?.version || 0} />
        <label className="block">ชื่อผู้รับเงินตาม QR<input name="recipient" required minLength={2} maxLength={150} defaultValue={config?.recipient || ""} className={field} /></label>
        <label className="block">รูป QR รับเงิน {config && "(เลือกเมื่อเปลี่ยนรูป)"}<input name="file" type="file" accept="image/jpeg,image/png" required={!config} className={field} /></label>
        <p className="text-sm text-primary/75">JPG หรือ PNG ไม่เกิน 5 MB ใช้รูปจากแอปธนาคาร ชื่อผู้รับเงินต้องตรงกับ QR</p>
        <button disabled={busy} className="rounded-xl border border-accent px-4 py-3 font-bold text-accent disabled:opacity-40">{busy ? "กำลังบันทึก…" : "บันทึกช่องทางรับเงิน"}</button>
      </form>
      <p className="text-sm leading-relaxed text-primary/75">ลูกค้าจะเห็น QR หลังร้านยืนยันยอด เปลี่ยน QR ตรงนี้ได้ภายหลัง โดยออเดอร์ที่ยืนยันไปแล้วจะยังใช้ข้อมูลรับเงินเดิม</p>
      {message && <p role="status">{message}</p>}
    </div>
  </details>;
}
