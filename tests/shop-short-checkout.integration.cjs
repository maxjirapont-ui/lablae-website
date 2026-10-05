/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node HTTP/SSR integration runner. */
// Run after the final production build: node tests/shop-short-checkout.integration.cjs
// Uses a seed-only temporary database and loopback server. No browser automation,
// real orders, bank transfers, LINE credentials, or production database access.
const assert = require('node:assert/strict');
const {spawn} = require('node:child_process');
const {randomBytes} = require('node:crypto');
const fs = require('node:fs/promises');
const net = require('node:net');
const {tmpdir} = require('node:os');
const path = require('node:path');
const sqlite3 = require('sqlite3');
const {open} = require('sqlite');
const sharp = require('sharp');

const repository = path.resolve(__dirname, '..');
const port = Number(process.env.SHOP_SHORT_TEST_PORT || 3046);
const base = `http://127.0.0.1:${port}`;
const password = '1555';
const key = () => randomBytes(24).toString('hex');
const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
const passed = [];
let directory, db, server, serverLog = '', cookie;
let sequence = 0;

const address = () => ({
  name: 'ผู้รับทดสอบ ห้ามจัดส่ง', phone: `0861000${String(++sequence).padStart(3, '0')}`,
  address: 'ข้อมูลสมมติสำหรับทดสอบในเครื่อง', subdistrict: 'ทดสอบ', district: 'ทดสอบ',
  province: 'อุตรดิตถ์', postcode: '53130', note: 'ออเดอร์สมมติ ห้ามโอนเงินจริงและห้ามจัดส่ง',
});
const documentHtml = html => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const textContent = html => documentHtml(html).replace(/<!--.*?-->/gs, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

function pass(description) { passed.push(description); console.log(`PASS: ${description}`); }
async function request(url, options = {}) { return fetch(url, {...options, signal: AbortSignal.timeout(20_000)}); }
async function expectStatus(response, expected, description) {
  assert.equal(response.status, expected, `${description}: ${await response.clone().text()}`);
  return response;
}
async function page(url) {
  const response = await expectStatus(await request(`${base}${url}`), 200, 'Read isolated customer page');
  return {response, html: documentHtml(await response.text())};
}
async function createOrder(quantity = 3, overrides = {}) {
  const input = {requestKey: key(), quantity, address: address(), ...overrides};
  const response = await expectStatus(await request(`${base}/api/shop/orders`, {
    method: 'POST', headers: {origin: base, 'content-type': 'application/json'}, body: JSON.stringify(input),
  }), 201, 'Create an isolated order');
  const result = await response.json();
  return {...await db.get('SELECT * FROM shop_orders WHERE token=?', result.url.split('/').pop()), url: result.url, input};
}
async function change(order, changes) {
  await expectStatus(await request(`${base}/api/admin/shop-orders`, {
    method: 'POST', headers: {origin: base, cookie, 'content-type': 'application/json'},
    body: JSON.stringify({id: order.id, version: order.version, ...changes}),
  }), 200, 'Change a simulated order status');
  return {...await db.get('SELECT * FROM shop_orders WHERE id=?', order.id), url: order.url};
}
function assertInsideClosedDetails(html, needle) {
  const position = html.indexOf(needle);
  assert(position >= 0, `Expected ${needle}`);
  const details = [];
  for (const match of html.slice(0, position).matchAll(/<\/?details\b[^>]*>/g)) {
    if (match[0].startsWith('</')) details.pop();
    else details.push(!/\sopen(?:[\s=>])/.test(match[0]));
  }
  assert(details.some(Boolean), `${needle} must be inside a closed details element`);
}
async function startServer(databasePath) {
  assert(Number.isInteger(port) && port > 1024 && port <= 65535);
  const probe = net.createServer();
  await new Promise((resolve, reject) => { probe.once('error', reject); probe.listen(port, '127.0.0.1', resolve); });
  await new Promise(resolve => probe.close(resolve));
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', String(port)], {
    cwd: repository,
    env: {
      ...process.env, NODE_ENV: 'production', NODE_OPTIONS: '',
      DATA_DIR: directory, DATABASE_PATH: databasePath, UPLOAD_DIR: path.join(directory, 'uploads'),
      SITE_URL: base, SHOP_ORDERS_ENABLED: '1', WEBSITE_ANALYTICS_ENABLED: '0',
      ADMIN_PASSWORD: password, ADMIN_PASSWORD_RESET: password, ADMIN_PASSWORD_RESET_VERSION: 'short-checkout-test-only',
      ADMIN_SESSION_SECRET: 'short-checkout-session-test-only',
      LINE_CHANNEL_ACCESS_TOKEN: '', LINE_CHANNEL_SECRET: '', LINE_GROUP_ID: '',
      SHOP_LINE_CHANNEL_ACCESS_TOKEN: '', SHOP_LINE_CHANNEL_SECRET: '', SHOP_LINE_NOTIFICATIONS_ENABLED: '0',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', chunk => { serverLog += chunk.toString(); });
  server.stderr.on('data', chunk => { serverLog += chunk.toString(); });
  let startupError;
  server.once('error', error => { startupError = error; });
  for (let attempt = 0; attempt < 80; attempt++) {
    if (startupError) throw startupError;
    if (server.exitCode !== null) throw new Error(`Local server exited:\n${serverLog}`);
    try { if ((await request(`${base}/robots.txt`)).ok) return; } catch {}
    await delay(200);
  }
  throw new Error(`Local server did not start:\n${serverLog}`);
}
async function main() {
  await fs.access(path.join(repository, '.next', 'BUILD_ID'));
  directory = await fs.mkdtemp(path.join(tmpdir(), 'lablae-shop-short-'));
  const databasePath = path.join(directory, 'test.db');
  await fs.copyFile(path.join(repository, 'database', 'seed.db'), databasePath);
  db = await open({filename: databasePath, driver: sqlite3.Database});
  await db.exec('PRAGMA busy_timeout=5000');
  await db.run("DELETE FROM settings WHERE key IN ('admin_password','admin_password_hash','admin_password_reset_version')");
  for (const table of await db.all("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'shop_%'")) {
    assert.match(table.name, /^shop_[a-z_]+$/);
    await db.exec(`DROP TABLE ${table.name}`);
  }
  const reservationsBefore = (await db.get('SELECT COUNT(*) n FROM reservations')).n;
  await startServer(databasePath);
  const shop = await page('/shop');
  const form = shop.html.match(/<form\b[^>]*>[\s\S]*?<\/form>/g) || [];
  assert.equal(form.length, 1, 'Checkout has one form');
  assert.equal((form[0].match(/<button\b[^>]*type="submit"/g) || []).length, 1, 'Checkout has one final submit button');
  assert(form[0].includes('id="shop-summary"'), 'The final total is in the same form');
  assert(form[0].indexOf('id="shop-summary"') < form[0].indexOf('type="submit"'), 'Total precedes the final submit button');
  assert.equal((form[0].match(/data-testid="shop-total"/g) || []).length, 1, 'The checkout does not repeat its full total');
  assert.match(textContent(form[0]), /999\s*บาท/);
  for (const field of ['quantity', 'name', 'phone', 'address', 'subdistrict', 'district', 'province', 'postcode']) {
    assert(form[0].includes(`id="shop-${field}"`), `Shipping field ${field} remains available`);
  }
  assertInsideClosedDetails(form[0], 'id="shop-note"');
  assert(!textContent(shop.html).includes('ตรวจรายการก่อนส่ง'), 'The separate review step is no longer advertised');
  pass('The initial SSR checkout has one form, one total above one submit, complete shipping fields, and an optional collapsed note');

  const requested = await createOrder();
  assert.equal(requested.status, 'requested', 'No payment configuration must keep payment pending');
  assert.equal(requested.goods_baht, 999); assert.equal(requested.shipping_baht, 0);
  assert(!(await page(requested.url)).html.includes(`${requested.url}/payment-qr`));
  pass('An unconfigured payment method does not expose a QR or mark the order paid');

  const login = await expectStatus(await request(`${base}/api/admin/login`, {
    method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({password}),
  }), 200, 'Log into the isolated administrator');
  cookie = login.headers.get('set-cookie').split(';')[0];
  // A plain solid-colour image cannot encode bank details and is never a payment QR.
  const fixture = await sharp({create: {width: 64, height: 64, channels: 3, background: '#4e7c62'}}).png().toBuffer();
  const payment = new FormData();
  payment.set('recipient', 'TEST ONLY — ห้ามโอนเงินจริง'); payment.set('version', '0');
  payment.set('file', new File([fixture], 'not-a-payment-qr.png', {type: 'image/png'}));
  await expectStatus(await request(`${base}/api/admin/shop-payment`, {method: 'POST', headers: {origin: base, cookie}, body: payment}), 200, 'Set a non-payment fixture');
  let order = await createOrder();
  assert.equal(order.status, 'quoted'); assert.equal(order.goods_baht, 999); assert.equal(order.shipping_baht, 0);
  const beforeSlip = await page(order.url);
  assert.match(beforeSlip.response.headers.get('cache-control'), /no-store/);
  assert.equal(beforeSlip.response.headers.get('referrer-policy'), 'no-referrer');
  assert(beforeSlip.html.includes(`${order.url}/payment-qr`));
  assert(beforeSlip.html.indexOf(`${order.url}/payment-qr`) < beforeSlip.html.indexOf('id="payment-slip"'), 'Payment appears before slip upload');
  assert(!beforeSlip.html.includes('googletagmanager'));
  const qr = await expectStatus(await request(`${base}${order.url}/payment-qr`), 200, 'Read the private non-payment fixture');
  assert.deepEqual(Buffer.from(await qr.arrayBuffer()), fixture);
  pass('An order with configured payment opens its private QR and slip upload immediately at the saved 999 baht total');

  const formData = new FormData(); formData.set('requestKey', key());
  formData.set('file', new File([fixture], 'test-only-slip.png', {type: 'image/png'}));
  await expectStatus(await request(`${base}/api${order.url}/slip`, {method: 'POST', headers: {origin: base}, body: formData}), 200, 'Attach an isolated simulated slip');
  order = {...await db.get('SELECT * FROM shop_orders WHERE id=?', order.id), url: order.url};
  assert.equal(order.status, 'quoted', 'Receiving a slip must never mean receiving money');
  const received = await page(order.url);
  assert.match(textContent(received.html), /ได้รับสลิปแล้ว/);
  assert.match(textContent(received.html), /รอร้านตรวจเงิน/);
  assertInsideClosedDetails(received.html, `${order.url}/payment-qr`);
  pass('An accepted slip preserves unpaid status, shows receipt confirmation, and collapses the old payment panel');

  order = await change(order, {action: 'paid', confirmed: true});
  assert(!(await page(order.url)).html.includes(`${order.url}/payment-qr`));
  await expectStatus(await request(`${base}${order.url}/payment-qr`), 404, 'A simulated paid order no longer serves payment QR');
  let cancelled = await createOrder(); cancelled = await change(cancelled, {action: 'cancel'});
  assert(!(await page(cancelled.url)).html.includes(`${cancelled.url}/payment-qr`));
  pass('Paid and cancelled statuses hide the payment QR');

  const legacy = await createOrder();
  await db.run('UPDATE shop_orders SET unit_price=250, goods_baht=750, shipping_baht=200 WHERE id=?', legacy.id);
  const legacyHtml = (await page(legacy.url)).html;
  assert.match(textContent(legacyHtml), /950\s*บาท/);
  assert(!textContent(legacyHtml).includes('999 บาท'), 'An old order does not use today’s promotion');
  assert.equal((await db.get('SELECT COUNT(*) n FROM reservations')).n, reservationsBefore);
  assert.equal((await db.get("SELECT COUNT(*) n FROM shop_line_outbox WHERE state NOT IN ('pending')")).n, 0, 'No notification is dispatched');
  pass('Simplified order details retain the saved legacy total and leave reservations and LINE dispatch untouched');
  const result = {base, directory, databasePath, buildId: (await fs.readFile(path.join(repository, '.next', 'BUILD_ID'), 'utf8')).trim(), passed};
  await fs.writeFile(path.join(directory, 'result.json'), JSON.stringify(result, null, 2));
  console.log(`Evidence: ${directory}`);
}
async function cleanup() {
  if (server && server.exitCode === null) {
    const stopped = new Promise(resolve => server.once('exit', resolve)); server.kill('SIGTERM');
    await Promise.race([stopped, delay(2500)]);
    if (server.exitCode === null) { server.kill('SIGKILL'); await Promise.race([stopped, delay(1000)]); }
  }
  if (db) await db.close();
  if (directory) await fs.writeFile(path.join(directory, 'server.log'), serverLog);
}
main().catch(error => { console.error(error); if (directory) console.error(`Evidence: ${directory}`); process.exitCode = 1; }).finally(cleanup);
