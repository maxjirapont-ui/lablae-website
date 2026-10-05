import {createHash,randomBytes} from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import type {Database} from 'sqlite';
import {getDatabasePath} from './storage';
import {connectShopDb,OrderError} from './shop-orders';
import {enqueueShopEvent} from './shop-events';
import {SHOP_SLIP_MAX_BYTES,SHOP_SLIP_FILE_HELP} from './shop-slip-policy';
import {validateShopSlipBytes} from './shop-slip-validation';

export type ShopSlip={id:number;order_id:number;created_at:string;readable:boolean};
type StoredSlip=Omit<ShopSlip,'readable'> & {filename:string;digest:string;validation_state:'unchecked'|'valid'|'invalid'};
function directory(){return path.join(path.dirname(getDatabasePath()),'shop-slips');}
async function checkStoredSlips(db:Database,rows:StoredSlip[]):Promise<ShopSlip[]> {
 const result:ShopSlip[]=[];
 // Validate legacy files once, retaining their original rows/bytes for the shop.
 for(let start=0;start<rows.length;start+=4) {
  const batch=await Promise.all(rows.slice(start,start+4).map(async row=>{
   let state=row.validation_state;
   if(state==='unchecked') {
    const bytes=/^[a-f0-9]{48}\.(png|jpg|webp|pdf)$/.test(row.filename) ? await fs.readFile(path.join(directory(),row.filename)).catch(()=>null) : null;
    if(bytes) {
     state=await validateShopSlipBytes(bytes).then(()=>'valid' as const,()=>'invalid' as const);
     await db.run("UPDATE shop_order_slips SET validation_state=? WHERE id=? AND validation_state='unchecked'",state,row.id);
    }
   }
   return {id:row.id,order_id:row.order_id,created_at:row.created_at,readable:state==='valid'};
  }));
  result.push(...batch);
 }
 return result;
}
export async function listShopSlips(orderId?:number,includeUnreadable=false):Promise<ShopSlip[]> {
 const db=await connectShopDb();try{
  const rows=orderId===undefined ? await db.all<StoredSlip[]>(`SELECT * FROM shop_order_slips WHERE order_id IN (SELECT id FROM shop_orders WHERE status IN ('requested','quoted','paid') OR id IN (SELECT id FROM shop_orders ORDER BY id DESC LIMIT 200)) ORDER BY id DESC`) : await db.all<StoredSlip[]>('SELECT * FROM shop_order_slips WHERE order_id=? ORDER BY id DESC',orderId);
  const checked=await checkStoredSlips(db,rows);
  return includeUnreadable ? checked : checked.filter(slip=>slip.readable);
 }finally{await db.close();}
}
export async function getUnreadableShopSlipCount(orderId:number):Promise<number> {
 return (await listShopSlips(orderId,true)).filter(slip=>!slip.readable).length;
}
export async function uploadShopSlip(token:string,key:string,file:File) {
 if(!/^[a-f0-9]{48}$/.test(token)|| !/^[a-f0-9]{48}$/.test(key))throw new OrderError('กรุณาเปิดลิงก์ออเดอร์ใหม่');
 if(!file.size || file.size>SHOP_SLIP_MAX_BYTES)throw new OrderError(SHOP_SLIP_FILE_HELP);
 const db=await connectShopDb();
 try {
  // Reject an invalid order before reading/decoding a possibly large upload.
  const target=await db.get<{id:number;status:string}>('SELECT id,status FROM shop_orders WHERE token=?',token);
  if(!target)throw new OrderError('ไม่พบออเดอร์',404);
  const bytes=Buffer.from(await file.arrayBuffer());const digest=createHash('sha256').update(bytes).digest('hex');
  const extension=await validateShopSlipBytes(bytes).catch(error=>{throw new OrderError(error instanceof Error ? error.message : SHOP_SLIP_FILE_HELP);});
  await checkStoredSlips(db,await db.all<StoredSlip[]>('SELECT * FROM shop_order_slips WHERE order_id=?',target.id));
  await db.exec('BEGIN IMMEDIATE');
  try {
   const existing=await db.get<StoredSlip>('SELECT * FROM shop_order_slips WHERE order_id=? AND request_key=?',target.id,key);
   if(existing){if(existing.digest!==digest)throw new OrderError('คำขอเดิมถูกใช้กับรูปอื่นแล้ว กรุณาเลือกรูปใหม่',409);if(existing.validation_state!=='valid')throw new OrderError('ไฟล์เดิมเปิดไม่ได้ กรุณาเลือกสลิปใหม่',409);await db.exec('COMMIT');return existing.id;}
   const current=await db.get<{status:string}>('SELECT status FROM shop_orders WHERE id=?',target.id);
   if(current?.status!=='quoted')throw new OrderError('ส่งสลิปได้เมื่อร้านยืนยันยอดและรายการยังรอชำระเงิน',409);
   const duplicate=await db.get<{id:number}>("SELECT id FROM shop_order_slips WHERE order_id=? AND digest=? AND validation_state='valid'",target.id,digest);
   if(duplicate){await db.exec('COMMIT');return duplicate.id;}
   const count=await db.get<{n:number}>("SELECT COUNT(*) AS n FROM shop_order_slips WHERE order_id=? AND validation_state='valid'",target.id);
   if((count?.n||0)>=3)throw new OrderError('แนบสลิปครบ 3 ไฟล์แล้ว หากต้องแก้ไขกรุณาติดต่อร้าน',429);
   const filename=`${randomBytes(24).toString('hex')}.${extension}`;
   await fs.mkdir(directory(),{recursive:true});await fs.writeFile(path.join(directory(),filename),bytes);
   const result=await db.run("INSERT INTO shop_order_slips(order_id,request_key,filename,digest,validation_state) VALUES(?,?,?,?,'valid')",target.id,key,filename,digest);
   await enqueueShopEvent(db,target.id,'slip',`slip:${result.lastID}`);
   await db.exec('COMMIT');return result.lastID;
  } catch(error){await db.exec('ROLLBACK');throw error;}
 } finally {await db.close();}
}
export async function readShopSlip(orderId:number,slipId:number) {
 const db=await connectShopDb();try{
  const slip=await db.get<StoredSlip>('SELECT * FROM shop_order_slips WHERE order_id=? AND id=?',orderId,slipId);
  if(!slip || !/^[a-f0-9]{48}\.(png|jpg|webp|pdf)$/.test(slip.filename))return null;
  const extension=path.extname(slip.filename).slice(1);
  const type={png:'image/png',jpg:'image/jpeg',webp:'image/webp',pdf:'application/pdf'}[extension]!;
  return {bytes:await fs.readFile(path.join(directory(),slip.filename)),type};
 }finally{await db.close();}
}
