"use client";
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import type {ShopLineStatus} from '@/lib/shop-line';
export default function ShopLineSettings({status}:{status:ShopLineStatus}) {
 const router=useRouter();const [command,setCommand]=useState('');const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
 async function act(action:string){
  setBusy(true);setMessage('');
  try{const response=await fetch('/api/admin/shop-line',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action})});const data=await response.json();if(!response.ok)throw new Error(data.error);if(data.command)setCommand(data.command);else {setCommand('');setMessage(action==='retry'?'ตรวจคิวแจ้งเตือนแล้ว':'ยกเลิกการเชื่อมกลุ่มแล้ว');}router.refresh();}
  catch(error){setMessage(error instanceof Error?error.message:'เชื่อมต่อไม่สำเร็จ');}finally{setBusy(false);}
 }
 return <section className="rounded-2xl border border-accent/30 p-5 space-y-3">
  <h2 className="text-xl font-bold">แจ้งออเดอร์ใน LINE กลุ่มร้าน</h2>
  <p>{!status.configured?'ยังไม่ได้เชื่อมบัญชีบอต LINE':!status.connected?'เชื่อมบัญชีบอตแล้ว · รอผูกกลุ่ม':status.live?'เชื่อมกลุ่มแล้ว':'ผูกกลุ่มแล้ว · โหมดทดลองยังไม่ส่งข้อความ'}</p>
  {!status.configured&&<p>ต้องตั้งค่าบัญชี LINE ของร้านและเปิดรับเหตุการณ์จาก LINE ก่อน จึงจะใช้รหัสเชื่อมกลุ่มได้</p>}
  <p>ออเดอร์ใหม่และสลิปจะแจ้งให้ทีมร้านเปิดหลังบ้านมาตรวจ ไม่ยืนยันรับเงินจากสลิปอัตโนมัติ</p>
  <p className="text-sm">รอส่ง {status.pending} · ส่งไม่สำเร็จ {status.failed} · LINE รับคำขอแล้ว {status.accepted}</p>
  <button disabled={busy||!status.configured} onClick={()=>void act('pair')} className="border border-accent rounded-xl px-4 py-3 disabled:opacity-40">สร้างรหัสเชื่อมกลุ่ม</button>
  {command&&<div className="space-y-2"><p>เชิญบอตเข้ากลุ่มสั่งของ แล้วคัดลอกข้อความนี้ส่งในกลุ่มภายใน 15 นาที ใช้ได้ครั้งเดียว</p><p className="select-all break-all border rounded-xl p-3">{command}</p><p>เก็บรหัสไว้เฉพาะทีมร้าน และใช้คนละกลุ่มกับจองโต๊ะ</p></div>}
  {status.connected&&<div className="flex flex-wrap gap-3"><button disabled={busy||!status.live} onClick={()=>void act('retry')} className="border rounded-xl px-4 py-3">ลองส่งคิวที่รออีกครั้ง</button><button disabled={busy} onClick={()=>void act('disconnect')} className="underline px-4 py-3">ยกเลิกการเชื่อมกลุ่ม</button></div>}
  <p className="text-sm">คิวที่รอจะลองส่งเมื่อมีออเดอร์หรือเหตุการณ์ LINE ใหม่ หรือเมื่อกดปุ่มลองส่งอีกครั้ง</p>
  {message&&<p role="status">{message}</p>}
 </section>;
}
