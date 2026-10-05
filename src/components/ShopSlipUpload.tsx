"use client";
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {useRouter} from 'next/navigation';
import {SHOP_SLIP_ACCEPT,SHOP_SLIP_FILE_HELP,SHOP_SLIP_MAX_BYTES} from '@/lib/shop-slip-policy';

async function prepareSlip(file:File):Promise<File> {
 if(!/\.(heic|heif)$/i.test(file.name) && !/^image\/hei[cf]/i.test(file.type))return file;
 // Safari can read iPhone HEIC photos; convert locally so the shop can open them anywhere.
 const url=URL.createObjectURL(file);
 try {
  const image=new Image();
  await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(new Error('เปิดรูปนี้ไม่ได้ กรุณาใช้รูปสลิปที่บันทึกจากแอปธนาคาร หรือภาพหน้าจอ'));image.src=url;});
  const scale=Math.min(1,2400/Math.max(image.naturalWidth,image.naturalHeight));
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
  const context=canvas.getContext('2d');if(!context)throw new Error('เตรียมรูปไม่ได้ กรุณาใช้ภาพหน้าจอสลิป');
  context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);
  const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(result=>result?resolve(result):reject(new Error('เตรียมรูปไม่ได้ กรุณาใช้ภาพหน้าจอสลิป')),'image/jpeg',0.92));
  return new File([blob],file.name.replace(/\.[^.]+$/,'')+'.jpg',{type:'image/jpeg'});
 }finally{URL.revokeObjectURL(url);}
}

export default function ShopSlipUpload({token,count}:{token:string;count:number}) {
 const router=useRouter();const fileInput=useRef<HTMLInputElement>(null);const [selected,setSelected]=useState<File|null>(null);const prepared=useRef<File|null>(null);const key=useRef('');const sending=useRef(false);const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');const [preview,setPreview]=useState('');
 useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview);},[preview]);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(sending.current)return;
  if(!selected){setMessage('กรุณาเลือกรูปหรือไฟล์สลิปก่อนส่ง');return;}
  sending.current=true;setBusy(true);setMessage('');
  try{
   if(!key.current)key.current=Array.from(crypto.getRandomValues(new Uint8Array(24)),v=>v.toString(16).padStart(2,'0')).join('');
   if(!prepared.current)prepared.current=await prepareSlip(selected);
   const file=prepared.current;if(file.size>SHOP_SLIP_MAX_BYTES)throw new Error('ไฟล์ใหญ่เกิน 10 MB กรุณาใช้รูปสลิปที่บันทึกจากแอปธนาคาร');
   // A disabled native input is omitted by FormData(form), so use the retained File explicitly.
   const data=new FormData();data.set('file',file,file.name);data.set('requestKey',key.current);
   const response=await fetch(`/api/shop/orders/${token}/slip`,{method:'POST',body:data});const result=await response.json().catch(()=>({error:response.status===413?'ไฟล์ใหญ่เกิน 10 MB กรุณาใช้รูปสลิปที่บันทึกจากแอปธนาคาร':'ส่งไม่สำเร็จ กรุณากดส่งอีกครั้ง หรือโทรหาร้าน'}));
   if(!response.ok)throw new Error(result.error||'ส่งสลิปไม่สำเร็จ');
   setMessage('ได้รับสลิปแล้วครับ รอร้านตรวจเงินเข้าบัญชี');if(fileInput.current)fileInput.current.value='';setSelected(null);setPreview('');prepared.current=null;key.current='';router.refresh();
  }catch(error){setMessage(error instanceof TypeError?'เชื่อมต่อไม่สำเร็จ กดส่งสลิปอีกครั้งได้ ไม่ต้องเลือกไฟล์ใหม่':error instanceof Error?error.message:'ส่งสลิปไม่สำเร็จ กรุณากดส่งอีกครั้ง');}finally{sending.current=false;setBusy(false);}
 }
 return <section id={count>0?"payment-slip-more":"payment-slip"} tabIndex={-1} className="scroll-mt-24 outline-none rounded-2xl border border-accent/30 p-5 space-y-3">
  <h2 className="text-xl font-bold">โอนแล้ว แนบสลิปที่นี่</h2>
  <p>ร้านจะตรวจยอดเงินเข้าจริงก่อนเปลี่ยนสถานะเป็นรับเงินแล้ว</p>
  {count>0&&<p className="text-accent">ได้รับสลิปแล้ว {count} ไฟล์ · รอตรวจสอบ</p>}
  {count<3&&<form onSubmit={submit} className="space-y-3" aria-busy={busy}>
   <label className="block space-y-2"><span className="font-bold">รูปหรือไฟล์สลิป</span>
    <input ref={fileInput} name="file" type="file" accept={SHOP_SLIP_ACCEPT} disabled={busy} aria-describedby="slip-file-help" onChange={event=>{
     const file=event.target.files?.[0];if(!file)return;
     key.current='';prepared.current=null;setMessage('');
     if(!file.size||file.size>SHOP_SLIP_MAX_BYTES){event.target.value='';setSelected(null);setPreview('');setMessage(!file.size?'ไฟล์นี้ว่าง กรุณาเลือกไฟล์ใหม่':'ไฟล์ใหญ่เกิน 10 MB กรุณาใช้รูปสลิปที่บันทึกจากแอปธนาคาร');return;}
     setSelected(file);setPreview(/^image\//.test(file.type)||/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)?URL.createObjectURL(file):'');
    }} className="block w-full min-h-14 min-w-0 rounded-xl border-2 border-accent bg-[#fffaf3] text-[#261810] p-3 text-base file:mr-3 file:rounded-lg file:border-0 file:bg-[#653c20] file:px-4 file:py-3 file:font-bold file:text-white disabled:opacity-50"/>
   </label>
   <p id="slip-file-help" className="text-sm break-all" aria-live="polite">{selected?`เลือกแล้ว: ${selected.name}`:SHOP_SLIP_FILE_HELP}</p>
   {preview&&<div className="rounded-xl bg-white p-2"><img src={preview} alt="ตัวอย่างสลิปที่เลือก ยังไม่ได้ส่ง" onError={()=>setPreview('')} className="mx-auto max-h-64 max-w-full object-contain"/></div>}
   <button type="submit" disabled={busy||!selected} className="w-full rounded-xl bg-accent text-[#261810] font-bold px-5 py-4 disabled:opacity-50">{busy?'กำลังส่ง…':'ส่งสลิปให้ร้านตรวจสอบ'}</button>
  </form>}
  {count>=3&&<p>หากต้องแก้ไขสลิปเพิ่มเติม กรุณาโทรหาร้าน</p>}
  {message&&<p role="status">{message}</p>}
 </section>;
}
