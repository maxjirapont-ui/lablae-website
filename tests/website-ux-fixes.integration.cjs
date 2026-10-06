/* eslint-disable @typescript-eslint/no-require-imports -- Isolated Node HTTP integration tests. */
// Run after npm run build. Uses only a temporary seed database and loopback server.
const assert = require('node:assert/strict');
const {spawn} = require('node:child_process');
const fs = require('node:fs/promises');
const path = require('node:path');
const {tmpdir} = require('node:os');
const {randomUUID} = require('node:crypto');
const sqlite3 = require('sqlite3');
const {open} = require('sqlite');

const root = path.resolve(__dirname, '..');
const base = 'http://127.0.0.1:3048';
const passed = [];
let directory, db, server, log = '';
const request = (url, options = {}) => fetch(base + url, {...options, signal: AbortSignal.timeout(20000)});
const post = (body) => request('/api/reservations', {method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify(body)});
const pass = description => { passed.push(description); console.log('PASS: ' + description); };
const htmlText = html => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

async function main() {
  directory = await fs.mkdtemp(path.join(tmpdir(), 'lablae-whole-ux-fix-'));
  const filename = path.join(directory, 'test.db');
  const uploads = path.join(directory, 'uploads');
  await fs.mkdir(uploads);
  await fs.copyFile(path.join(root, 'database/seed.db'), filename);
  db = await open({filename, driver:sqlite3.Database});
  await db.exec('DELETE FROM reservations');
  await db.run("DELETE FROM settings WHERE key IN ('admin_password','admin_password_hash','admin_password_reset_version')");
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p','3048'], {
    cwd:root, env:{...process.env, NODE_ENV:'production', NODE_OPTIONS:'',
      DATA_DIR:directory, DATABASE_PATH:filename, UPLOAD_DIR:uploads, SITE_URL:base,
      WEBSITE_ANALYTICS_ENABLED:'0', SHOP_ORDERS_ENABLED:'1',
      ADMIN_PASSWORD:'1555', ADMIN_PASSWORD_RESET:'1555', ADMIN_PASSWORD_RESET_VERSION:'whole-ux-fix-test-only',
      ADMIN_SESSION_SECRET:'whole-ux-fix-session-test-only',
      LINE_CHANNEL_ACCESS_TOKEN:'', LINE_CHANNEL_SECRET:'', LINE_GROUP_ID:'',
      SHOP_LINE_CHANNEL_ACCESS_TOKEN:'', SHOP_LINE_CHANNEL_SECRET:'', SHOP_LINE_NOTIFICATIONS_ENABLED:'0',
    }, stdio:['ignore','pipe','pipe'],
  });
  server.stdout.on('data', data => { log += data.toString(); });
  server.stderr.on('data', data => { log += data.toString(); });
  let ready = false;
  for (let i=0; i<100; i++) {
    if (server.exitCode !== null) throw new Error(log);
    try { ready = (await request('/robots.txt')).ok; } catch { /* server starting */ }
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve,100));
  }
  assert(ready, 'Isolated server started');
  const tomorrow = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(Date.now()+86400000));
  const input = {name:'ทดสอบ ห้ามจัดโต๊ะ',phone:'๐๘๖๑๑๑๒๒๓๓',date:tomorrow,time:'12:00',guests:2,notes:'ข้อมูลสมมติ ไม่แจ้งเตือน LINE',requestKey:randomUUID()};
  const first = await post(input); assert.equal(first.status,200);
  const receipt = await first.json(); assert.match(receipt.statusUrl,/^\/booking\/\d{6}$/);
  const record = await db.get('SELECT * FROM reservations WHERE booking_code=?',receipt.bookingCode);
  assert.equal(record.phone,'0861112233'); assert.equal(record.status,'pending');
  pass('Thai phone digits create one pending booking with a persistent status URL');
  const repeated = await post(input); assert.equal(repeated.status,200); assert.equal((await repeated.json()).bookingCode,receipt.bookingCode);
  assert.equal((await db.get('SELECT COUNT(*) n FROM reservations')).n,1);
  pass('Retrying the same request recovers the original booking without a second row');
  const changed = await post({...input,name:'ข้อมูลอื่น'}); assert.equal(changed.status,400);
  assert(!(await changed.text()).includes(receipt.bookingCode));
  const duplicate = await post({...input,requestKey:randomUUID()}); assert.equal(duplicate.status,400);
  assert(!(await duplicate.text()).includes(receipt.bookingCode));
  assert.equal((await db.get('SELECT COUNT(*) n FROM reservations')).n,1);
  pass('Changed or unrelated requests cannot recover someone else’s booking code');
  for (let i=0;i<2;i++) {
    const page = await request(receipt.statusUrl); assert.equal(page.status,200);
    const html = await page.text(); assert(html.includes(receipt.bookingCode)); assert.match(htmlText(html),/รอทางร้านยืนยัน/);
  }
  pass('Opening the booking receipt again keeps its code, details, and pending status');
  const redirect = await request('/admin/shop?order=LL-123', {redirect:'manual'});
  assert.equal(redirect.status,307);
  assert.equal(redirect.headers.get('location'),'/admin/login?next=%2Fadmin%2Fshop%3Forder%3DLL-123');
  const bad = await request('/admin/shop?order=https%3A%2F%2Fevil.example', {redirect:'manual'});
  assert.equal(bad.headers.get('location'),'/admin/login?next=%2Fadmin%2Fshop');
  pass('Signed-out order links keep a safe destination through login');
  const {adminReturnPath} = await import('../src/lib/admin-return-path.ts');
  assert.equal(adminReturnPath('/admin/shop?order=LL-123#order-123'),'/admin/shop?order=LL-123#order-123');
  for (const candidate of ['https://evil.example','//evil.example','/admin/../shop','/admin/shop?order=LL-1&next=//evil.example','/admin\\shop','/admin/shop%0a']) assert.equal(adminReturnPath(candidate),'/admin');
  pass('Login return paths reject external URLs, traversal, and appended parameters');
  const denied = await request('/api/admin/reservations',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({id:record.id,status:'confirmed'})});
  assert.equal(denied.status,401);
  const login = await request('/api/admin/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password:'1555',remember:false})});
  assert.equal(login.status,200); const cookie=login.headers.get('set-cookie').split(';')[0];
  const update = await request('/api/admin/reservations',{method:'PUT',headers:{cookie,'content-type':'application/json'},body:JSON.stringify({id:record.id,status:'confirmed'})});
  assert.equal(update.status,200); assert.equal((await db.get('SELECT status FROM reservations WHERE id=?',record.id)).status,'confirmed');
  assert.match(htmlText(await (await request(receipt.statusUrl)).text()),/ยืนยันโต๊ะแล้ว/);
  pass('Admin authorization stays required and a test status update reaches the saved receipt');
  const pdf=Buffer.from('%PDF-1.4\n% TEST ONLY\n%%EOF\n');
  await fs.writeFile(path.join(uploads,'ux-test-only.pdf'),pdf);
  const file=await request('/uploads/ux-test-only.pdf'); assert.equal(file.status,200);
  assert.equal(file.headers.get('content-type'),'application/pdf'); assert.equal(file.headers.get('content-disposition'),'inline');
  assert.deepEqual(Buffer.from(await file.arrayBuffer()),pdf);
  pass('Uploaded PDFs retain their bytes and open with the correct inline content type');
  const menu=await (await request('/menu')).text(); assert(menu.includes('aria-label="ค้นหาเมนูอาหาร"')); assert(menu.includes('เลือกหมวดอาหาร'));
  const travel=await (await request('/travel')).text(); assert.match(travel,/<details class="travel-history"/);
  const directions=await (await request('/directions')).text(); assert(directions.indexOf('เปิด Google Maps เพื่อนำทาง')<directions.indexOf('<iframe'));
  pass('Public SSR includes menu search, collapsed travel histories, and navigation before the map');
  const concurrentInput = {...input,phone:'0861112244',time:'13:00',requestKey:randomUUID()};
  const concurrent = await Promise.all([post(concurrentInput),post(concurrentInput)]);
  for (const response of concurrent) assert.equal(response.status,200);
  const concurrentReceipts = await Promise.all(concurrent.map(response => response.json()));
  assert.equal(concurrentReceipts[0].bookingCode,concurrentReceipts[1].bookingCode);
  const concurrentRecord = await db.get('SELECT * FROM reservations WHERE booking_code=?',concurrentReceipts[0].bookingCode);
  assert.equal((await db.get('SELECT COUNT(*) n FROM reservations')).n,2);
  pass('Two simultaneous copies of a request return one booking without overlapping transactions');
  const removed = await request(`/api/admin/reservations?id=${record.id}`, {method:'DELETE',headers:{cookie}});
  assert.equal(removed.status,200);
  assert.equal((await db.get('SELECT COUNT(*) n FROM reservation_requests WHERE reservation_id=?',record.id)).n,0);
  assert.equal((await request(`/api/admin/reservations?id=${concurrentRecord.id}`, {method:'DELETE',headers:{cookie}})).status,200);
  assert.equal((await db.get('SELECT COUNT(*) n FROM reservation_requests')).n,0);
  assert.equal((await request(receipt.statusUrl)).status,404);
  pass('Removing a simulated reservation also cleans its retry key without blocking the admin action');
  assert(!log.includes('api.line.me'));
  await fs.writeFile(path.join(directory,'results.json'),JSON.stringify({passed,productionMutations:0,lineCredentials:false},null,2));
  console.log(JSON.stringify({groups:passed.length,directory},null,2));
}

main().catch(error => { console.error(error); process.exitCode=1; }).finally(async () => {
  if (server && server.exitCode === null) {
    const exited = new Promise(resolve => server.once('exit',resolve)); server.kill('SIGTERM'); await exited;
  }
  if (db) await db.close();
});
