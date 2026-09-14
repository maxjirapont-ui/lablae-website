"use client";
import {useRef,useState,type FormEvent} from 'react';
import {useRouter} from 'next/navigation';
export default function ShopSlipUpload({token,count}:{token:string;count:number}) {
 const router=useRouter();const key=useRef('');const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy)return;setBusy(true);setMessage('');
  const form=event.currentTarget;
  try{
   if(!key.current)key.current=Array.from(crypto.getRandomValues(new Uint8Array(24)),v=>v.toString(16).padStart(2,'0')).join('');
   const data=new FormData(form);data.set('requestKey',key.current);
   const response=await fetch(`/api/shop/orders/${token}/slip`,{method:'POST',body:data});const result=await response.json();
   if(!response.ok)throw new Error(result.error||'ส่งสลิปไม่สำเร็จ');
   setMessage('ได้รับสลิปแล้วครับ รอร้านตรวจเงินเข้าบัญชี');form.reset();key.current='';router.refresh();
  }catch(error){setMessage(error instanceof Error?error.message:'เชื่อมต่อไม่สำเร็จ กรุณาลองอีกครั้ง');}finally{setBusy(false);}
 }
 return <section className="rounded-2xl border border-accent/30 p-5 space-y-3">
  <h2 className="text-xl font-bold">โอนแล้ว แนบสลิปที่นี่</h2>
  <p>ร้านจะตรวจยอดเงินเข้าจริงก่อนเปลี่ยนสถานะเป็นรับเงินแล้ว</p>
  {count>0&&<p className="text-accent">ได้รับสลิปแล้ว {count} รูป · รอตรวจสอบ</p>}
  {count<3&&<form onSubmit={submit} className="space-y-3">
   <label className="block">รูปสลิป JPG หรือ PNG ไม่เกิน 5 MB<input aria-label="รูปสลิป" name="file" type="file" accept="image/jpeg,image/png" required disabled={busy} onChange={()=>{key.current='';setMessage('');}} className="block w-full my-3"/></label>
   <button disabled={busy} className="rounded-xl bg-accent text-white px-5 py-3 disabled:opacity-50">{busy?'กำลังส่ง…':'ส่งสลิปให้ร้านตรวจสอบ'}</button>
  </form>}
  {count>=3&&<p>หากต้องแก้ไขสลิปเพิ่มเติม กรุณาโทรหาร้าน</p>}
  {message&&<p role="status">{message}</p>}
 </section>;
}
