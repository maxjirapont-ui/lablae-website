import {createHash,randomBytes} from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {getDatabasePath} from './storage';
import {connectShopDb,OrderError} from './shop-orders';
import {enqueueShopEvent} from './shop-events';

export type ShopSlip={id:number;order_id:number;created_at:string};
type StoredSlip=ShopSlip & {filename:string;digest:string};
function directory(){return path.join(path.dirname(getDatabasePath()),'shop-slips');}
export async function listShopSlips(orderId?:number):Promise<ShopSlip[]> {
 const db=await connectShopDb();try{return orderId===undefined ? await db.all<ShopSlip[]>('SELECT id,order_id,created_at FROM shop_order_slips WHERE order_id IN (SELECT id FROM shop_orders ORDER BY id DESC LIMIT 200) ORDER BY id DESC') : await db.all<ShopSlip[]>('SELECT id,order_id,created_at FROM shop_order_slips WHERE order_id=? ORDER BY id DESC',orderId);}finally{await db.close();}
}
export async function uploadShopSlip(token:string,key:string,file:File) {
 if(!/^[a-f0-9]{48}$/.test(token)|| !/^[a-f0-9]{48}$/.test(key))throw new OrderError('กรุณาเปิดลิงก์ออเดอร์ใหม่');
 if(!file.size || file.size>5*1024*1024)throw new OrderError('ใช้รูป JPG หรือ PNG ไม่เกิน 5 MB');
 const db=await connectShopDb();
 try {
  // Reject an invalid order before reading/decoding a possibly large upload.
  const target=await db.get<{id:number;status:string}>('SELECT id,status FROM shop_orders WHERE token=?',token);
  if(!target)throw new OrderError('ไม่พบออเดอร์',404);
  const bytes=Buffer.from(await file.arrayBuffer());const digest=createHash('sha256').update(bytes).digest('hex');
  const image=await sharp(bytes,{limitInputPixels:20_000_000}).metadata().catch(()=>null);
  if(!image || !['jpeg','png'].includes(image.format||'') || (image.pages||1)>1)throw new OrderError('ใช้ไฟล์ภาพ JPG หรือ PNG ที่เปิดอ่านได้');
  await db.exec('BEGIN IMMEDIATE');
  try {
   const existing=await db.get<StoredSlip>('SELECT * FROM shop_order_slips WHERE order_id=? AND request_key=?',target.id,key);
   if(existing){if(existing.digest!==digest)throw new OrderError('คำขอเดิมถูกใช้กับรูปอื่นแล้ว กรุณาเลือกรูปใหม่',409);await db.exec('COMMIT');return existing.id;}
   const current=await db.get<{status:string}>('SELECT status FROM shop_orders WHERE id=?',target.id);
   if(current?.status!=='quoted')throw new OrderError('ส่งสลิปได้เมื่อร้านยืนยันยอดและรายการยังรอชำระเงิน',409);
   const duplicate=await db.get<{id:number}>('SELECT id FROM shop_order_slips WHERE order_id=? AND digest=?',target.id,digest);
   if(duplicate){await db.exec('COMMIT');return duplicate.id;}
   const count=await db.get<{n:number}>('SELECT COUNT(*) AS n FROM shop_order_slips WHERE order_id=?',target.id);
   if((count?.n||0)>=3)throw new OrderError('แนบสลิปครบ 3 รูปแล้ว หากต้องแก้ไขกรุณาติดต่อร้าน',429);
   const filename=`${randomBytes(24).toString('hex')}.${image.format==='png'?'png':'jpg'}`;
   await fs.mkdir(directory(),{recursive:true});await fs.writeFile(path.join(directory(),filename),bytes);
   const result=await db.run('INSERT INTO shop_order_slips(order_id,request_key,filename,digest) VALUES(?,?,?,?)',target.id,key,filename,digest);
   await enqueueShopEvent(db,target.id,'slip',`slip:${result.lastID}`);
   await db.exec('COMMIT');return result.lastID;
  } catch(error){await db.exec('ROLLBACK');throw error;}
 } finally {await db.close();}
}
export async function readShopSlip(orderId:number,slipId:number) {
 const db=await connectShopDb();try{
  const slip=await db.get<StoredSlip>('SELECT * FROM shop_order_slips WHERE order_id=? AND id=?',orderId,slipId);
  if(!slip || !/^[a-f0-9]{48}\.(png|jpg)$/.test(slip.filename))return null;
  return {bytes:await fs.readFile(path.join(directory(),slip.filename)),type:slip.filename.endsWith('.png')?'image/png':'image/jpeg'};
 }finally{await db.close();}
}
