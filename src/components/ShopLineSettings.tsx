"use client";
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import type {ShopLineStatus} from '@/lib/shop-line';
export default function ShopLineSettings({status}:{status:ShopLineStatus}) {
 const router=useRouter();const [command,setCommand]=useState('');const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
 async function act(action:string){
  setBusy(true);setMessage('');
  try{const response=await fetch('/api/admin/shop-line',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action})});const data=await response.json();if(!response.ok)throw new Error(data.error);if(data.command)setCommand(data.command);else {setCommand('');setMessage(action==='retry'?'ตรวจคิวที่รอส่งแล้ว ดูจำนวนคิวล่าสุดในหน้านี้':'ยกเลิกการเชื่อมกลุ่มแล้ว');}router.refresh();}
  catch(error){setMessage(error instanceof Error?error.message:'เชื่อมต่อไม่สำเร็จ');}finally{setBusy(false);}
 }
 return <section className="rounded-2xl border border-accent/30 p-5 space-y-3">
  <h2 className="text-xl font-bold">แจ้งออเดอร์ใน LINE กลุ่มร้าน</h2>
  <p>{!status.configured?'ยังไม่เชื่อมบัญชี LINE':!status.connected?'ยังไม่เชื่อมกลุ่ม':status.live?'เชื่อมกลุ่มแล้ว · เปิดส่งข้อความ':'เชื่อมกลุ่มแล้ว · โหมดทดลองยังไม่ส่งข้อความ'}</p>
  {!status.configured&&<p>ต้องตั้งค่าบัญชี LINE ของร้านและเปิดรับเหตุการณ์จาก LINE ก่อน จึงจะใช้รหัสเชื่อมกลุ่มได้</p>}
  <p>ออเดอร์ใหม่และสลิปจะแจ้งให้ทีมร้านเปิดหลังบ้านมาตรวจ ไม่ยืนยันรับเงินจากสลิปอัตโนมัติ</p>
  <p className="text-sm">รอส่ง {status.pending} · ส่งไม่สำเร็จหรือหมดช่วงส่งซ้ำ {status.failed} · LINE รับคำขอแล้ว {status.accepted}</p>
  {status.failed > 0 && <div className="rounded-xl border border-accent/40 p-4 space-y-3">
    <h3 className="font-bold">ออเดอร์ที่ต้องตรวจจากหลังบ้าน</h3>
    <p>รายการเหล่านี้ไม่ได้ส่งซ้ำเมื่อกด “ลองส่งคิวที่รอ” ให้เปิดออเดอร์เพื่อตรวจและทำงานต่อ</p>
    {(status.issues || []).map(issue=><div key={issue.id} className="border-t border-accent/20 pt-3 space-y-1">
      <p className="font-bold">LL-{issue.orderId} · {issue.kind === 'slip' ? 'แจ้งสลิป' : 'แจ้งออเดอร์ใหม่'} · {issue.state === 'expired' ? 'หมดช่วงส่งซ้ำ' : 'ส่งไม่สำเร็จ'}</p>
      <p className="break-words">{issue.error || 'กรุณาตรวจสถานะออเดอร์ในหลังบ้าน'}</p>
      <a href={`/admin/shop?order=LL-${issue.orderId}#order-${issue.orderId}`} className="inline-block py-2 text-accent underline">เปิดออเดอร์ LL-{issue.orderId}</a>
    </div>)}
    {status.failed > (status.issues?.length || 0) && <p className="text-sm">แสดงรายการล่าสุด {status.issues?.length || 0} จาก {status.failed} คิว</p>}
  </div>}
  <button disabled={busy||!status.configured} onClick={()=>void act('pair')} className="border border-accent rounded-xl px-4 py-3 disabled:opacity-40">สร้างรหัสเชื่อมกลุ่ม</button>
  {command&&<div className="space-y-2"><p>เชิญบอตเข้ากลุ่มสั่งของ แล้วคัดลอกข้อความนี้ส่งในกลุ่มภายใน 15 นาที ใช้ได้ครั้งเดียว</p><p className="select-all break-all border rounded-xl p-3">{command}</p><p>เก็บรหัสไว้เฉพาะทีมร้าน และใช้คนละกลุ่มกับจองโต๊ะ</p></div>}
  {status.connected&&<div className="flex flex-wrap gap-3"><button disabled={busy||!status.configured||!status.live||!status.pending} onClick={()=>void act('retry')} className="border rounded-xl px-4 py-3 disabled:opacity-40">ลองส่งคิวที่รออีกครั้ง</button><button disabled={busy} onClick={()=>void act('disconnect')} className="underline px-4 py-3">ยกเลิกการเชื่อมกลุ่ม</button></div>}
  <p className="text-sm">คิวที่รอจะลองส่งเมื่อถึงเวลาลองใหม่และมีออเดอร์หรือเหตุการณ์ LINE ใหม่ หรือเมื่อกดปุ่มลองส่งคิวที่รอ</p>
  {message&&<p role="status">{message}</p>}
 </section>;
}
