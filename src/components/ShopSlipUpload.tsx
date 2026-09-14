"use client";
import {useRef,useState,type FormEvent} from 'react';
import {useRouter} from 'next/navigation';
export default function ShopSlipUpload({token,count}:{token:string;count:number}) {
 const router=useRouter();const fileInput=useRef<HTMLInputElement>(null);const [filename,setFilename]=useState('');const key=useRef('');const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy)return;setBusy(true);setMessage('');
  const form=event.currentTarget;
  try{
   if(!key.current)key.current=Array.from(crypto.getRandomValues(new Uint8Array(24)),v=>v.toString(16).padStart(2,'0')).join('');
   const data=new FormData(form);data.set('requestKey',key.current);
   const file=data.get('file');if(!(file instanceof File)||!file.size)throw new Error('กรุณากดเลือกรูปสลิปก่อนส่ง');if(file.size>5*1024*1024)throw new Error('รูปใหญ่เกิน 5 MB กรุณาใช้ภาพสลิปที่บันทึกจากแอปธนาคาร');
   const response=await fetch(`/api/shop/orders/${token}/slip`,{method:'POST',body:data});const result=await response.json().catch(()=>({error:response.status===413?'รูปใหญ่เกินไป กรุณาใช้ภาพสลิปที่บันทึกจากแอปธนาคาร':'ส่งไม่สำเร็จ กรุณาลองอีกครั้ง หรือโทรหาร้าน'}));
   if(!response.ok)throw new Error(result.error||'ส่งสลิปไม่สำเร็จ');
   setMessage('ได้รับสลิปแล้วครับ รอร้านตรวจเงินเข้าบัญชี');form.reset();setFilename('');key.current='';router.refresh();
  }catch(error){setMessage(error instanceof Error?error.message:'เชื่อมต่อไม่สำเร็จ กรุณาลองอีกครั้ง');}finally{setBusy(false);}
 }
 return <section className="rounded-2xl border border-accent/30 p-5 space-y-3">
  <h2 className="text-xl font-bold">โอนแล้ว แนบสลิปที่นี่</h2>
  <p>ร้านจะตรวจยอดเงินเข้าจริงก่อนเปลี่ยนสถานะเป็นรับเงินแล้ว</p>
  {count>0&&<p className="text-accent">ได้รับสลิปแล้ว {count} รูป · รอตรวจสอบ</p>}
  {count<3&&<form onSubmit={submit} className="space-y-3">
   <input ref={fileInput} aria-label="รูปสลิป" name="file" type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" disabled={busy} onChange={event=>{key.current='';setMessage('');setFilename(event.target.files?.[0]?.name||'');}} className="sr-only"/>
   <button type="button" disabled={busy} onClick={()=>fileInput.current?.click()} className="block w-full rounded-xl border-2 border-accent bg-[#fffaf3] text-[#261810] px-5 py-4 font-bold disabled:opacity-50">{filename?'เปลี่ยนรูปสลิป':'เลือกรูปสลิปจากมือถือ'}</button>
   <p className="text-sm break-all" aria-live="polite">{filename?`เลือกแล้ว: ${filename}`:'ใช้รูป JPG หรือ PNG ไม่เกิน 5 MB'}</p>
   <button type="submit" disabled={busy||!filename} className="w-full rounded-xl bg-accent text-[#261810] font-bold px-5 py-4 disabled:opacity-50">{busy?'กำลังส่ง…':'ส่งสลิปให้ร้านตรวจสอบ'}</button>
  </form>}
  {count>=3&&<p>หากต้องแก้ไขสลิปเพิ่มเติม กรุณาโทรหาร้าน</p>}
  {message&&<p role="status">{message}</p>}
 </section>;
}
