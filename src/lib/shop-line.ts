import { createHash, randomBytes, timingSafeEqual, createHmac } from "node:crypto";
import { connectShopDb, getShopOrder } from "./shop-orders";
import { getLineGroupId } from "./line-messaging";
import type { ShopOrder } from "./shop-order-types";

interface Config {group_id:string; pair_hash:string; pair_expires:number}
interface Job {id:number; order_id:number; kind:string; retry_key:string; recipient:string; payload:string; first_attempt:number; attempts:number}
export type ShopLineStatus = {configured:boolean; connected:boolean; live:boolean; pending:number; failed:number; accepted:number};
function liveMode() { return process.env.NODE_ENV === "production" || process.env.SHOP_LINE_NOTIFICATIONS_ENABLED === "1"; }
function siteBase() {
  try { const url=new URL(process.env.SITE_URL || "https://www.lablae.net");return url.protocol === "https:" ? url.origin : null; } catch {return null;}
}
export async function getShopLineStatus():Promise<ShopLineStatus> {
  const db=await connectShopDb();
  try {
    const cfg=await db.get<Config>("SELECT * FROM shop_line_config WHERE id=1");
    const counts=await db.all<{state:string;count:number}[]>("SELECT state,COUNT(*) AS count FROM shop_line_outbox GROUP BY state");
    const count=(states:string[])=>counts.filter(row=>states.includes(row.state)).reduce((sum,row)=>sum+row.count,0);
    return {configured:isShopLineConfigured(),connected:Boolean(cfg?.group_id),live:liveMode(),pending:count(['pending','retry']),failed:count(['failed','expired']),accepted:count(['accepted'])};
  } finally {await db.close();}
}
export async function makeShopPairingCode() {
  const code=randomBytes(12).toString('hex').toUpperCase();
  const db=await connectShopDb();
  try {await db.run("UPDATE shop_line_config SET pair_hash=?,pair_expires=? WHERE id=1",createHash('sha256').update(code).digest('hex'),Date.now()+15*60_000);}
  finally {await db.close();}
  return `เชื่อมสั่งซื้อ ${code}`;
}
export async function hasShopPairingCode() {
  const db=await connectShopDb();try {const row=await db.get<Config>("SELECT * FROM shop_line_config WHERE id=1");return Boolean(row?.pair_hash && row.pair_expires>Date.now());}finally{await db.close();}
}
export async function disconnectShopGroup() {
  const db=await connectShopDb();try {await db.run("UPDATE shop_line_config SET group_id='',pair_hash='',pair_expires=0 WHERE id=1");}finally{await db.close();}
}

type Event={type:string;replyToken?:string;source:{type:string;groupId?:string;userId?:string};message?:{type:string;text?:string}};
export async function handleShopLineEvent(event:Event):Promise<boolean> {
  const text=event.message?.type==='text' ? event.message.text?.trim() || '' : '';
  if(event.source.type==='user' && /^สั่งซื้อ\s+[a-f0-9]{48}$/i.test(text)) {
    const order=await getShopOrder(text.split(/\s+/)[1].toLowerCase());
    const base=siteBase();
    if(event.replyToken) await replyShopLineMessage(event.replyToken,[{type:'text',text:order&&base ? `ออเดอร์ LL-${order.id}\nดูยอดและส่งสลิปผ่านลิงก์นี้ได้เลยครับ\n${base}/shop/orders/${order.token}\nร้านจะตรวจเงินเข้าจริงก่อนยืนยันรับเงิน` : 'ไม่พบออเดอร์ กรุณาเปิดลิงก์ที่ได้รับหลังสั่งซื้อแล้วลองอีกครั้ง'}]);
    return true;
  }
  if(event.source.type!=='group' || !event.source.groupId) return false;
  const group=event.source.groupId;
  const db=await connectShopDb();
  let response='';let handled=false;
  try {
    if(event.type==='leave') {
      const result=await db.run("UPDATE shop_line_config SET group_id='' WHERE id=1 AND group_id=?",group);
      return Boolean(result.changes);
    }
    const pair=/^เชื่อมสั่งซื้อ\s+([A-Fa-f0-9]{24})$/.exec(text);
    if(pair) {
      handled=true;
      if(group===await getLineGroupId()) response='กลุ่มนี้ใช้จองโต๊ะอยู่ กรุณาใช้กลุ่มสั่งของออนไลน์แยกกันครับ';
      else {
        const hash=createHash('sha256').update(pair[1].toUpperCase()).digest('hex');
        const result=await db.run("UPDATE shop_line_config SET group_id=?,pair_hash='',pair_expires=0 WHERE id=1 AND pair_hash=? AND pair_expires>?",group,hash,Date.now());
        response=result.changes ? 'เชื่อมกลุ่มนี้กับออเดอร์ออนไลน์บ้าน 100 ปีแล้วครับ\nออเดอร์ใหม่และสลิปจะแจ้งในกลุ่มนี้ เปิดหลังบ้านเพื่อตรวจยอดและจัดส่งได้เลย' : 'รหัสไม่ถูกต้อง หมดอายุ หรือใช้แล้ว กรุณาสร้างรหัสใหม่จากหลังบ้าน';
      }
    } else {
      const cfg=await db.get<Config>("SELECT * FROM shop_line_config WHERE id=1");
      if(cfg?.group_id===group) {
        handled=true;
        if(/^(วิธีใช้|คำสั่ง|help)$/i.test(text)) response=`กลุ่มรับออเดอร์ออนไลน์บ้าน 100 ปี\nแจ้งออเดอร์ใหม่และสลิปที่ลูกค้าแนบในเว็บ\nตรวจเงินเข้าจริงแล้วค่อยยืนยันรับเงิน\nหลังบ้าน: ${siteBase() || 'https://www.lablae.net'}/admin/shop`;
      }
    }
  } finally {await db.close();}
  if(response && event.replyToken) await replyShopLineMessage(event.replyToken,[{type:'text',text:response}]);
  return handled;
}

export async function flushShopNotifications() {
  if(!isShopLineConfigured() || !liveMode() || !siteBase()) return;
  // Persistent leases coordinate concurrent order requests and admin retries.
  for(let n=0;n<5;n++) {
    const db=await connectShopDb();let job:Job|undefined;
    try {
      await db.exec('BEGIN IMMEDIATE');
      const cfg=await db.get<Config>('SELECT * FROM shop_line_config WHERE id=1');
      if(!cfg?.group_id) {await db.exec('COMMIT');return;}
      job=await db.get<Job>("SELECT * FROM shop_line_outbox WHERE state IN ('pending','retry') AND next_attempt<=? AND lease_until<=? ORDER BY id LIMIT 1",Date.now(),Date.now());
      if(!job) {await db.exec('COMMIT');return;}
      if(job.first_attempt && Date.now()-job.first_attempt>=23*60*60_000) {
        await db.run("UPDATE shop_line_outbox SET state='expired',error='พ้นช่วงส่งซ้ำอย่างปลอดภัย กรุณาตรวจออเดอร์ในหลังบ้าน' WHERE id=?",job.id);await db.exec('COMMIT');continue;
      }
      // Do not reroute uncertain retries to another group.
      if(job.recipient && job.recipient!==cfg.group_id) {
        await db.run("UPDATE shop_line_outbox SET state='failed',error='กลุ่มรับแจ้งเตือนเปลี่ยน กรุณาตรวจรายการในหลังบ้าน' WHERE id=?",job.id);await db.exec('COMMIT');continue;
      }
      if(!job.payload) {
        const order=await db.get<ShopOrder>('SELECT * FROM shop_orders WHERE id=?',job.order_id);
        if(!order) {await db.run("UPDATE shop_line_outbox SET state='failed',error='ไม่พบออเดอร์' WHERE id=?",job.id);await db.exec('COMMIT');continue;}
        const address=JSON.parse(order.address_json) as {name:string;province:string};
        const text=[job.kind==='slip'?'มีสลิปใหม่ · รอตรวจเงินเข้า':'มีคำสั่งซื้อออนไลน์ใหม่',`LL-${order.id} · ไส้อั่ว ${order.quantity} แพ็ก`, `ค่าสินค้า ${order.goods_baht.toLocaleString('th-TH')} บาท`,order.shipping_baht===null?'ค่าส่งรอร้านยืนยัน':`ค่าส่ง ${order.shipping_baht} บาท · รวม ${(order.goods_baht+order.shipping_baht).toLocaleString('th-TH')} บาท`, `ผู้รับ: ${address.name} · ${address.province}`,job.kind==='slip'?'การแนบสลิปไม่ใช่การยืนยันรับเงิน':'ร้านวางแผนผลิตและแจ้งรอบส่งก่อนรับเงิน',`เปิดหลังบ้าน: ${siteBase()}/admin/shop#order-${order.id}`].join('\n');
        job.recipient=cfg.group_id;
        job.payload=JSON.stringify({to:job.recipient,messages:[{type:'text',text}]});
      }
      await db.run('UPDATE shop_line_outbox SET recipient=?,payload=?,lease_until=?,first_attempt=CASE WHEN first_attempt=0 THEN ? ELSE first_attempt END,attempts=attempts+1 WHERE id=?',job.recipient,job.payload,Date.now()+60_000,Date.now(),job.id);
      await db.exec('COMMIT');
    } catch(error) {await db.exec('ROLLBACK');throw error;} finally {await db.close();}
    if(!job) return;
    let state='retry',error='เชื่อมต่อ LINE ไม่สำเร็จ';
    try {
      const response=await fetch('https://api.line.me/v2/bot/message/push',{method:'POST',headers:{Authorization:`Bearer ${process.env.SHOP_LINE_CHANNEL_ACCESS_TOKEN?.trim()}`,'Content-Type':'application/json','X-Line-Retry-Key':job.retry_key},body:job.payload,signal:AbortSignal.timeout(8000)});
      if(response.ok || (response.status===409 && response.headers.has('x-line-accepted-request-id'))) {state='accepted';error='';}
      else {state=response.status>=500 || response.status===429 ? 'retry':'failed';error=`LINE ตอบกลับ ${response.status}`;}
    } catch {}
    const finish=await connectShopDb();
    try {await finish.run('UPDATE shop_line_outbox SET state=?,error=?,lease_until=0,next_attempt=? WHERE id=?',state,error,Date.now()+Math.min(60_000*2**Math.min(job.attempts,5),30*60_000),job.id);}finally{await finish.close();}
  }
}

export function isShopLineConfigured() {
 return Boolean(process.env.SHOP_LINE_CHANNEL_ACCESS_TOKEN?.trim() && process.env.SHOP_LINE_CHANNEL_SECRET?.trim());
}
export function verifyShopLineSignature(body:string, signature:string|null) {
 const secret=process.env.SHOP_LINE_CHANNEL_SECRET?.trim();
 if(!secret || !signature)return false;
 const expected=Buffer.from(createHmac('sha256',secret).update(body).digest('base64'));
 const actual=Buffer.from(signature);
 return expected.length===actual.length && timingSafeEqual(expected,actual);
}
async function replyShopLineMessage(replyToken:string,messages:{type:string;text:string}[]) {
 if(!isShopLineConfigured())return;
 const response=await fetch('https://api.line.me/v2/bot/message/reply',{method:'POST',headers:{Authorization:`Bearer ${process.env.SHOP_LINE_CHANNEL_ACCESS_TOKEN?.trim()}`,'Content-Type':'application/json'},body:JSON.stringify({replyToken,messages}),signal:AbortSignal.timeout(8000)});
 if(!response.ok)throw new Error(`Shop LINE reply failed: ${response.status}`);
}
