/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node integration runner. */
// Run against a built, isolated copy: NODE_PATH=<runtime packages> node tests/shop-orders.integration.cjs
// Creates only temporary databases and local test servers. Never sends LINE messages or payments.
const {chromium} = require('playwright');
const {spawn} = require('node:child_process');
const {mkdtempSync, copyFileSync, writeFileSync, readFileSync} = require('node:fs');
const {tmpdir} = require('node:os');
const path = require('node:path');
const {randomBytes,createHmac} = require('node:crypto');
const sqlite3 = require('sqlite3');
const {open} = require('sqlite');
const assert = require('node:assert/strict');
const children = [];
let browser;
const password = '1555';
async function main() {
  const directory=mkdtempSync(path.join(tmpdir(),'lablae-orders-'));
  const databasePath=path.join(directory,'test.db');
  copyFileSync('database/seed.db',databasePath);
  const db=await open({filename:databasePath,driver:sqlite3.Database});
  await db.run("DELETE FROM settings WHERE key IN ('admin_password','admin_password_hash')");
  const reservationsBefore=(await db.get('SELECT COUNT(*) AS count FROM reservations')).count;
  function start(port,enabled,extra={}) {
    const proc=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p',String(port)],{env:{...process.env,DATABASE_PATH:databasePath,UPLOAD_DIR:path.join(directory,'uploads'),ADMIN_PASSWORD:password,ADMIN_PASSWORD_RESET:password,ADMIN_PASSWORD_RESET_VERSION:'test-reset-1',ADMIN_SESSION_SECRET:password,SHOP_ORDERS_ENABLED:enabled,WEBSITE_ANALYTICS_ENABLED:'0',LINE_CHANNEL_ACCESS_TOKEN:'',LINE_CHANNEL_SECRET:'booking-only-secret',SHOP_LINE_CHANNEL_SECRET:'test-line-secret',SHOP_LINE_CHANNEL_ACCESS_TOKEN:'',LINE_GROUP_ID:'booking-group',...extra},stdio:'ignore'});
    children.push(proc);return proc;
  }
  async function ready(base) {
    for(let i=0;i<60;i++){try{await fetch(base+'/robots.txt');return;}catch{await new Promise(r=>setTimeout(r,200));}}
    throw Error('Local server did not start');
  }
  start(3031,'0'); start(3032,'1');
  const closed='http://localhost:3031', base='http://localhost:3032';
  await Promise.all([ready(closed),ready(base)]);
  assert.equal((await fetch(closed+'/shop')).status,404);
  assert.equal((await fetch(closed+'/api/shop/orders',{method:'POST',headers:{origin:closed,'content-type':'application/json'},body:'{}'})).status,403);
  const login=await fetch(base+'/api/admin/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password,remember:true})});
  assert.equal(login.status,200);
  assert(login.headers.get('set-cookie').includes('Max-Age=2592000'));
  assert.equal((await db.get("SELECT value FROM settings WHERE key='admin_password_reset_version'")).value,require('node:crypto').createHash('sha256').update('test-reset-1\0'+password).digest('hex'));
  const cookie=login.headers.get('set-cookie').split(';')[0];
  const requestKey=randomBytes(24).toString('hex');
  const address={name:'ผู้รับทดสอบ',phone:'0812345678',address:'ข้อมูลสมมติ 1',subdistrict:'ทดสอบ',district:'ทดสอบ',province:'อุตรดิตถ์',postcode:'53130',note:'ออเดอร์ทดสอบ ห้ามจัดส่ง'};
  const input={requestKey,quantity:3,address,goodsBaht:1,shippingBaht:0,status:'paid'};
  const post=(body,origin=base)=>fetch(base+'/api/shop/orders',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)});
  assert.equal((await post(input,'https://example.com')).status,403);
  assert.equal((await post({...input,quantity:0},'https://www.lablae.net')).status,400);
  assert.equal((await post(input,'https://www.lablae.net.evil.example')).status,403);
  assert.equal((await post({...input,quantity:1.5})).status,400);
  assert.equal((await post({...input,quantity:0})).status,400);
  const responses=await Promise.all([post(input),post(input),post(input)]);
  assert(responses.every(r=>r.status===201));
  const created=await Promise.all(responses.map(r=>r.json()));
  assert(created.every(r=>r.url===created[0].url));
  assert.equal((await post({...input,quantity:4})).status,409);
  let order=await db.get('SELECT * FROM shop_orders');
  assert.equal((await db.get('SELECT COUNT(*) AS count FROM shop_orders')).count,1);
  assert.equal(order.goods_baht,750);assert.equal(order.shipping_baht,200);assert.equal(order.status,'requested');
  const update=(body,authenticated=true,origin=base)=>fetch(base+'/api/admin/shop-orders',{method:'POST',headers:{origin,'content-type':'application/json',...(authenticated?{cookie}:{})},body:JSON.stringify({id:order.id,version:order.version,...body})});
  assert.equal((await update({action:'paid',confirmed:true},false)).status,401);
  assert.equal((await update({action:'paid',confirmed:true},true,'https://example.com')).status,403);
  assert.equal((await update({action:'paid',confirmed:true})).status,409);
  assert.equal((await update({action:'quote',shippingBaht:210})).status,400);
  browser=await chromium.launch({channel:'chrome',headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844}});
  await context.addCookies([{name:'admin_session',value:cookie.slice('admin_session='.length),domain:'localhost',path:'/',httpOnly:true,sameSite:'Strict'}]);
  const page=await context.newPage();
  await page.goto(base+'/admin/shop');
  assert.equal(await page.getByLabel('ค่าส่ง (บาท)',{exact:true}).inputValue(),'200');
  assert.equal(await page.getByLabel('ค่าส่ง (บาท)',{exact:true}).getAttribute('readonly'),'');
  await page.getByLabel('ขนส่งและรอบส่งที่ยืนยัน',{exact:true}).fill('นิ่ม — รอบทดสอบ ห้ามส่งจริง');
  await page.getByLabel('ช่องทางรับเงินและชื่อบัญชี',{exact:true}).fill('ช่องทางทดสอบเท่านั้น ไม่ใช่บัญชีรับเงินจริง');
  await page.getByRole('checkbox',{name:'ตรวจสินค้าพร้อมส่ง'}).check();
  await page.getByRole('button',{name:'ยืนยันยอดให้ลูกค้า',exact:true}).click();
  await page.getByRole('button',{name:'ยืนยันรับเงินแล้ว',exact:true}).waitFor();
  assert.equal((await update({action:'cancel'})).status,409); // stale version
  order=await db.get('SELECT * FROM shop_orders');assert.equal(order.status,'quoted');assert.equal(order.shipping_baht,200);
  const customer=await browser.newPage({viewport:{width:390,height:844}});
  const response=await customer.goto(base+created[0].url);
  assert(response.headers()['cache-control'].includes('no-store'));
  assert.equal(response.headers()['referrer-policy'],'no-referrer');
  assert.equal(await customer.getByText('ยอดรวม 950 บาท',{exact:true}).count(),1);
  assert.equal(await customer.locator('script[src*="googletagmanager"]').count(),0);
  await page.getByRole('checkbox',{name:'ตรวจเงินเข้าบัญชีจริงครบ'}).check();
  await page.getByRole('button',{name:'ยืนยันรับเงินแล้ว',exact:true}).click();
  await page.getByLabel('ชื่อขนส่งและเลขพัสดุ',{exact:true}).fill('นิ่ม TEST-ONLY-0001');
  await page.getByRole('button',{name:'บันทึกการจัดส่ง',exact:true}).click();
  await page.getByText('จัดส่ง: นิ่ม TEST-ONLY-0001',{exact:true}).waitFor();
  await customer.reload();
  assert.equal(await customer.getByText('นิ่ม TEST-ONLY-0001',{exact:true}).count(),1);
  assert(await customer.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  // Mobile and desktop prices show the final total and the max quantity.
  await customer.goto(base+'/shop');
  for (const [quantity, title, total] of [[3,'กินที่บ้าน',950],[5,'แบ่งกันอร่อย',1450],[9,'รวมสั่งกับเพื่อน',2450]]) {
    await customer.getByRole('radio',{name:`${title} ${quantity} แพ็ก`,exact:true}).check();
    assert.equal(await customer.getByTestId('shop-total').innerText(),`${total.toLocaleString('th-TH')} บาท`);
  }
  assert.equal(await customer.getByRole('button',{name:'เพิ่มจำนวน 1 แพ็ก',exact:true}).isDisabled(),false);
  assert(await customer.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await customer.locator('#shop-quantity-heading').scrollIntoViewIfNeeded();
  await customer.screenshot({path:path.join(directory,'shop-mobile.png')});
  await customer.setViewportSize({width:1440,height:1000});
  await customer.evaluate(()=>scrollTo(0,0));
  await customer.screenshot({path:path.join(directory,'shop-desktop.png')});
  console.log('Screenshots: '+directory);
  assert(await customer.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await customer.setViewportSize({width:390,height:844});
  // A customer's click flow creates a separate request and a reload preserves it.
  await customer.goto(base+'/shop');
  await customer.getByRole('radio',{name:'กินที่บ้าน 3 แพ็ก',exact:true}).check();
  await customer.getByRole('radio',{name:'รวมสั่งกับเพื่อน 9 แพ็ก',exact:true}).check();
  await customer.getByRole('button',{name:'เพิ่มจำนวน 1 แพ็ก',exact:true}).click();
  assert.equal(await customer.locator('#shop-quantity').inputValue(),'10');
  await customer.locator('#shop-quantity').fill('20');
  assert.equal(await customer.getByTestId('shop-total').innerText(),'5,400 บาท');
  assert.equal(await customer.getByText('รอร้านยืนยัน',{exact:true}).count(),0);
  for(const [id,value] of Object.entries({...address,phone:'0891234567'})) await customer.locator('#shop-'+id).fill(value);
  await customer.getByRole('button',{name:'ตรวจรายการก่อนส่ง',exact:true}).click();
  await customer.getByRole('button',{name:'สั่งซื้อและดูช่องทางชำระเงิน',exact:true}).click();
  await customer.waitForURL('**/shop/orders/*');
  const savedUrl=customer.url();await customer.reload();assert.equal(customer.url(),savedUrl);
  assert.equal(await customer.getByRole('status').innerText(),'รอร้านยืนยันสินค้าและรอบส่ง');
  assert.equal((await db.get('SELECT COUNT(*) AS count FROM shop_orders')).count,2);
  assert.equal((await db.get('SELECT COUNT(*) AS count FROM reservations')).count,reservationsBefore);
  assert.equal((await customer.goto(base+'/shop/orders/'+randomBytes(24).toString('hex'))).status(),404);
  const bulkOrder=await db.get('SELECT * FROM shop_orders WHERE phone=?','0891234567');
  assert.equal(bulkOrder.quantity,20);assert.equal(bulkOrder.goods_baht,5000);assert.equal(bulkOrder.shipping_baht,400);
  assert.equal((await update({id:bulkOrder.id,version:bulkOrder.version,action:'quote',shippingBaht:400,paymentInstructions:'บัญชีทดสอบเท่านั้น ห้ามโอนเงินจริง',dispatchNote:'วางแผนผลิตสำหรับรอบทดสอบ',confirmed:true})).status,200);
  await customer.goto(savedUrl);
  assert.equal(await customer.getByText('ยอดรวม 5,400 บาท',{exact:true}).count(),1);
  // Rate limit is persistent; attempts cannot create arbitrarily many requests for one phone.
  for(let i=0;i<4;i++) assert.equal((await post({...input,requestKey:randomBytes(24).toString('hex')})).status,201);
  assert.equal((await post({...input,requestKey:randomBytes(24).toString('hex')})).status,429);
  assert.equal((await db.get('SELECT COUNT(*) AS count FROM shop_order_events WHERE order_id=?',order.id)).count,4);
  // Payment QR: only quoted private orders receive the original image.
  const sharp=require('sharp');
  const firstQr=await sharp({create:{width:120,height:120,channels:3,background:'white'}}).png().toBuffer();
  const nextQr=await sharp({create:{width:120,height:120,channels:3,background:'black'}}).png().toBuffer();
  const uploadQr=async(bytes,version,authenticated=true,origin=base)=>{
    const form=new FormData();form.set('recipient','ชื่อผู้รับทดสอบเท่านั้น');form.set('version',String(version));
    form.set('file',new File([bytes],'test-only.png',{type:'image/png'}));
    return fetch(base+'/api/admin/shop-payment',{method:'POST',headers:{origin,...(authenticated?{cookie}:{})},body:form});
  };
  assert.equal((await fetch(base+'/api/admin/shop-payment')).status,401);
  assert.equal((await uploadQr(firstQr,0,false)).status,401);
  assert.equal((await uploadQr(firstQr,0,true,'https://example.com')).status,403);
  assert.equal((await uploadQr(Buffer.from('invalid image'),0)).status,400);
  assert.equal((await uploadQr(firstQr,0)).status,200);
  for (const [quantity, shipping] of [[1,200],[9,200],[10,400],[20,400],[21,null]]) {
    const res = await post({...input,quantity,requestKey:randomBytes(24).toString('hex'),address:{...address,phone:'08700000'+String(quantity).padStart(2,'0')}});
    assert.equal(res.status,201);
    const data=await res.json();
    const fresh=await db.get('SELECT * FROM shop_orders WHERE token=?',data.url.split('/').pop());
    assert.equal(fresh.shipping_baht,shipping);
    assert.equal(fresh.status,shipping===null?'requested':'quoted');
    assert.equal((await fetch(base+data.url+'/payment-qr')).status,shipping===null?404:200);
    if(shipping!==null) assert(JSON.parse(fresh.payment_qr_json).recipient);
  }

  const paymentConfig=await db.get('SELECT * FROM shop_payment_config WHERE id=1');
  assert.equal((await fetch(savedUrl+'/payment-qr')).status,404); // manual quote
  let bulk=await db.get('SELECT * FROM shop_orders WHERE id=?',bulkOrder.id);
  const qrQuote={id:bulk.id,version:bulk.version,action:'quote',shippingBaht:400,paymentMethod:'qr',paymentQrFilename:paymentConfig.filename,dispatchNote:'รอบส่งทดสอบ',confirmed:true};
  assert.equal((await update({...qrQuote,paymentQrFilename:'wrong'})).status,409);
  assert.equal((await update(qrQuote)).status,200);
  await customer.goto(savedUrl);
  const qrImage=customer.getByRole('img',{name:'QR พร้อมเพย์ของ ชื่อผู้รับทดสอบเท่านั้น',exact:true});
  await qrImage.waitFor();
  assert.equal(await qrImage.evaluate(async img=>{await img.decode();return img.naturalWidth>0;}),true);
  assert.equal(await customer.getByRole('link',{name:'บันทึกรูป QR เพื่อโอนเงิน',exact:true}).count(),1);
  let qrResponse=await fetch(savedUrl+'/payment-qr?download=1');
  assert(qrResponse.headers.get('cache-control').includes('no-store'));
  assert(qrResponse.headers.get('content-disposition').includes('attachment'));
  assert.deepEqual(Buffer.from(await qrResponse.arrayBuffer()),firstQr);
  assert.equal((await uploadQr(nextQr,1)).status,200);
  assert.equal((await uploadQr(firstQr,1)).status,400); // stale settings version
  // Updating the default cannot change the recipient/image of an existing quote.
  qrResponse=await fetch(savedUrl+'/payment-qr');
  assert.deepEqual(Buffer.from(await qrResponse.arrayBuffer()),firstQr);
  // Slips stay private, idempotent, and never mark an order paid.
  const slipKey=randomBytes(24).toString('hex');
  const uploadSlip=(bytes,key=slipKey,token=bulk.token,origin=base)=>{
    const form=new FormData();form.set('requestKey',key);form.set('file',new File([bytes],'slip.png',{type:'image/png'}));
    return fetch(base+'/api/shop/orders/'+token+'/slip',{method:'POST',headers:{origin},body:form});
  };
  assert.equal((await uploadSlip(firstQr,slipKey,bulk.token,'https://example.com')).status,403);
  assert.equal((await uploadSlip(Buffer.from('bad'))).status,400);
  assert.equal((await uploadSlip(firstQr,slipKey,randomBytes(24).toString('hex'))).status,404);
  const slipResponses=await Promise.all([uploadSlip(firstQr),uploadSlip(firstQr)]);
  assert(slipResponses.every(r=>r.status===200));
  const slipResults=await Promise.all(slipResponses.map(r=>r.json()));assert.equal(slipResults[0].id,slipResults[1].id);
  assert.equal((await uploadSlip(nextQr)).status,409);
  const slipUrl=base+'/api/admin/shop-orders/'+bulk.id+'/slip/'+slipResults[0].id;
  assert.equal((await fetch(slipUrl)).status,401);
  const privateSlip=await fetch(slipUrl,{headers:{cookie}});assert.equal(privateSlip.status,200);
  assert(privateSlip.headers.get('cache-control').includes('no-store'));assert.deepEqual(Buffer.from(await privateSlip.arrayBuffer()),firstQr);
  assert.equal((await db.get('SELECT status FROM shop_orders WHERE id=?',bulk.id)).status,'quoted');
  assert.equal((await db.get("SELECT COUNT(*) n FROM shop_line_outbox WHERE event_key=?",'slip:'+slipResults[0].id)).n,1);
  await customer.reload();assert.equal(await customer.getByLabel('รูปสลิป',{exact:true}).count(),1);
  await customer.goto(savedUrl);
  const pick=customer.waitForEvent('filechooser');
  await customer.getByRole('button',{name:'เลือกรูปสลิปจากมือถือ',exact:true}).click();
  await (await pick).setFiles({name:'test-slip.png',mimeType:'image/png',buffer:firstQr});
  assert(await customer.getByText('เลือกแล้ว: test-slip.png',{exact:true}).isVisible());
  await customer.getByRole('button',{name:'ส่งสลิปให้ร้านตรวจสอบ',exact:true}).click();
  await customer.getByText('ได้รับสลิปแล้วครับ รอร้านตรวจเงินเข้าบัญชี',{exact:true}).waitFor();
  // Signed pairing is one-time and cannot overwrite the booking group.
  const lineAction=(action,authenticated=true)=>fetch(base+'/api/admin/shop-line',{method:'POST',headers:{origin:base,'content-type':'application/json',...(authenticated?{cookie}:{})},body:JSON.stringify({action})});
  assert.equal((await lineAction('pair',false)).status,401);
  const pair=await (await lineAction('pair')).json();
  const webhook=async(group,text,signed=true)=>{
    const body=JSON.stringify({events:[{type:'message',webhookEventId:randomBytes(12).toString('hex'),source:{type:'group',groupId:group},message:{type:'text',text}}]});
    return fetch(base+'/api/shop/line/webhook',{method:'POST',headers:{'content-type':'application/json','x-line-signature':signed?createHmac('sha256','test-line-secret').update(body).digest('base64'):'invalid'},body});
  };
  assert.equal((await webhook('shop-group',pair.command,false)).status,401);
  assert.equal((await webhook('booking-group',pair.command)).status,200);
  assert.equal((await db.get('SELECT group_id FROM shop_line_config')).group_id,'');
  assert.equal((await webhook('shop-group',pair.command)).status,200);
  assert.equal((await db.get('SELECT group_id FROM shop_line_config')).group_id,'shop-group');
  await webhook('wrong-group',pair.command);
  assert.equal((await db.get('SELECT group_id FROM shop_line_config')).group_id,'shop-group');
  assert.equal((await db.get("SELECT COUNT(*) n FROM shop_line_outbox WHERE state!='pending'")).n,0);
  // A separate process intercepts every LINE request; no external messages can be sent.
  const mockPath=path.join(directory,'mock-line.cjs'), logPath=path.join(directory,'line-requests.jsonl'), modePath=path.join(directory,'line-mode');
  writeFileSync(modePath,'500');
  writeFileSync(mockPath,`const fs=require('node:fs');const original=global.fetch;global.fetch=async(input,init)=>{const url=String(input);if(url.startsWith('https://api.line.me/')){fs.appendFileSync(${JSON.stringify(logPath)},JSON.stringify({body:init.body,key:init.headers['X-Line-Retry-Key']})+'\\n');const status=Number(fs.readFileSync(${JSON.stringify(modePath)},'utf8'));return new Response('{}',{status,headers:status===409?{'x-line-accepted-request-id':'test-accepted'}:{}});}return original(input,init);};`);
  start(3033,'1',{SHOP_LINE_CHANNEL_ACCESS_TOKEN:'FAKE-NONFUNCTIONAL-TOKEN',NODE_OPTIONS:'--require='+mockPath});
  const mockBase='http://localhost:3033';await ready(mockBase);
  const retryMock=()=>fetch(mockBase+'/api/admin/shop-line',{method:'POST',headers:{origin:mockBase,cookie,'content-type':'application/json'},body:JSON.stringify({action:'retry'})});
  assert.equal((await retryMock()).status,200);
  assert((await db.get("SELECT COUNT(*) n FROM shop_line_outbox WHERE state='retry'")).n>0);
  const beforeRetry=(await db.get('SELECT retry_key FROM shop_line_outbox ORDER BY id LIMIT 1')).retry_key;
  writeFileSync(modePath,'409');await db.run("UPDATE shop_line_outbox SET next_attempt=0 WHERE state='retry'");
  assert.equal((await retryMock()).status,200);
  const accepted=await db.get('SELECT * FROM shop_line_outbox ORDER BY id LIMIT 1');assert.equal(accepted.state,'accepted');assert.equal(accepted.retry_key,beforeRetry);
  const calls=readFileSync(logPath,'utf8').trim().split('\n').map(line=>JSON.parse(line));
  const same=calls.filter(call=>call.key===beforeRetry);assert.equal(same.length,2);assert.equal(same[0].body,same[1].body);
  assert(!same[0].body.includes(order.token));assert(!same[0].body.includes(address.phone));
  await retryMock();assert.equal(readFileSync(logPath,'utf8').trim().split('\n').map(line=>JSON.parse(line)).filter(call=>call.key===beforeRetry).length,2);
  console.log('PASS: mocked LINE failure retry, immutable retry key/payload, accepted duplicate handling, no resending accepted jobs.');
  console.log('PASS: private slip uploads, concurrent deduplication, unpaid status preserved, durable outbox, signed one-time group pairing and booking isolation.');
  bulk=await db.get('SELECT * FROM shop_orders WHERE id=?',bulkOrder.id);
  assert.equal((await update({id:bulk.id,version:bulk.version,action:'paid',confirmed:true})).status,200);
  assert.equal((await fetch(savedUrl+'/payment-qr')).status,404);
  console.log('PASS: private QR setup, upload validation, original bytes, download, quoted-only access, immutable order payment details, stale settings and paid-order QR hiding.');
  await db.close();
  console.log('PASS: closed production gate, validation, concurrent retries, server prices, authorization, stale edits, quote/payment/shipping workflow, private customer status, browser checkout, persistence, rate limiting and reservation isolation.');
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();for(const child of children)child.kill('SIGTERM');});
