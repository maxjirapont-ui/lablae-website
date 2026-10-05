/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node HTTP integration runner. */
// Run after `npm run build`: node tests/shop-ux-fixes.integration.cjs
// Uses the original checkout, a seed-only temporary database, and a local server.
// No browser automation, real orders, LINE credentials, or payment requests.
const assert = require('node:assert/strict');
const {spawn} = require('node:child_process');
const {createHash, randomBytes, randomUUID} = require('node:crypto');
const fs = require('node:fs/promises');
const net = require('node:net');
const {tmpdir} = require('node:os');
const path = require('node:path');
const sqlite3 = require('sqlite3');
const {open} = require('sqlite');
const sharp = require('sharp');

const repository = path.resolve(__dirname, '..');
const port = Number(process.env.SHOP_UX_TEST_PORT || 3038);
const base = `http://127.0.0.1:${port}`;
const password = '1555';
const key = () => randomBytes(24).toString('hex');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
const passed = [];
let directory, db, server, serverLog = '', cookie;
let phoneSequence = 0;

function pass(description) {
  passed.push(description);
  console.log(`PASS: ${description}`);
}

// Exact object offsets make this an actual one-page PDF, rather than a header fixture.
function pdfFromObjects(objects) {
  const chunks = [Buffer.from('%PDF-1.4\n')];
  let length = chunks[0].length;
  const offsets = [0];
  for (let index = 0; index < objects.length; index++) {
    offsets.push(length);
    const object = Buffer.isBuffer(objects[index]) ? objects[index] : Buffer.from(objects[index]);
    const chunk = Buffer.concat([Buffer.from(`${index + 1} 0 obj\n`), object, Buffer.from('\nendobj\n')]);
    chunks.push(chunk);
    length += chunk.length;
  }
  let trailer = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  trailer += offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  trailer += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${length}\n%%EOF\n`;
  return Buffer.concat([...chunks, Buffer.from(trailer)]);
}

async function fixtures() {
  const png = await sharp({create: {width: 64, height: 64, channels: 3, background: 'white'}}).png().toBuffer();
  const secondPng = await sharp({create: {width: 64, height: 64, channels: 3, background: 'black'}}).png().toBuffer();
  const thirdPng = await sharp({create: {width: 64, height: 64, channels: 3, background: 'red'}}).png().toBuffer();
  const fourthPng = await sharp({create: {width: 64, height: 64, channels: 3, background: 'blue'}}).png().toBuffer();
  const brokenPng = png.subarray(0, 80);
  const secondBrokenPng = secondPng.subarray(0, 80);
  assert.equal(brokenPng.length, 80);
  assert.equal((await sharp(brokenPng).metadata()).format, 'png', 'Regression fixture must pass the old metadata-only check');
  await assert.rejects(sharp(brokenPng).raw().toBuffer(), undefined, 'Regression fixture must fail full pixel decoding');
  await assert.rejects(sharp(secondBrokenPng).raw().toBuffer());
  const content = '0 0 0 rg\n10 10 30 30 re\nf\n';
  const pdf = pdfFromObjects([
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 100 100] /Resources << >> /Contents 4 0 R >>',
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}endstream`,
  ]);
  const noPagesPdf = pdfFromObjects([
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [] /Count 0 >>',
  ]);
  const headerOnlyPdf = Buffer.from('%PDF-1.4\n%%EOF\n');
  assert.equal(headerOnlyPdf.length, 15);
  const malformedPdf = Buffer.from('%PDF-1.4\nThis is not a PDF object body.\n%%EOF\n');
  // Small compressed files can expand into images much larger than the PDF byte limit.
  const largeJpg = await sharp({create: {width: 5000, height: 5000, channels: 3, background: 'white'}}).jpeg().toBuffer();
  const largeImageContent = 'q\n100 0 0 100 0 0 cm\n/Im1 Do\nQ\n';
  const oversizedImagePdf = pdfFromObjects([
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 100 100] /Resources << /XObject << /Im1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${Buffer.byteLength(largeImageContent)} >>\nstream\n${largeImageContent}endstream`,
    Buffer.concat([
      Buffer.from(`<< /Type /XObject /Subtype /Image /Width 5000 /Height 5000 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${largeJpg.length} >>\nstream\n`),
      largeJpg, Buffer.from('\nendstream'),
    ]),
  ]);
  assert(oversizedImagePdf.length < 10 * 1024 * 1024, 'Oversized image PDF must remain under the file byte limit');
  assert.equal((await sharp(largeJpg).metadata()).width * (await sharp(largeJpg).metadata()).height, 25_000_000);
  // Standard-font text and a bitmap exercise both PDF asset loading and rendering.
  const bankJpg = await sharp(thirdPng).jpeg().toBuffer();
  const bankContent = 'BT\n/F1 14 Tf\n10 190 Td\n(LOCAL TEST RECEIPT) Tj\nET\nBT\n/F1 10 Tf\n10 170 Td\n(No real payment. Do not ship.) Tj\nET\nq\n100 0 0 100 10 50 cm\n/Im1 Do\nQ\n';
  const banklikePdf = pdfFromObjects([
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 240 220] /Resources << /Font << /F1 6 0 R >> /XObject << /Im1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${Buffer.byteLength(bankContent)} >>\nstream\n${bankContent}endstream`,
    Buffer.concat([
      Buffer.from(`<< /Type /XObject /Subtype /Image /Width 64 /Height 64 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bankJpg.length} >>\nstream\n`),
      bankJpg, Buffer.from('\nendstream'),
    ]),
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]);
  return {
    png, secondPng, thirdPng, fourthPng, brokenPng, secondBrokenPng,
    jpg: await sharp(png).jpeg().toBuffer(),
    webp: await sharp(secondPng).webp().toBuffer(),
    gif: await sharp(png).gif().toBuffer(),
    pdf, banklikePdf, noPagesPdf, headerOnlyPdf, malformedPdf, oversizedImagePdf,
  };
}

async function request(url, options = {}) {
  return fetch(url, {...options, signal: AbortSignal.timeout(20_000)});
}

async function expectStatus(response, expected, description) {
  assert.equal(response.status, expected, `${description}: ${await response.clone().text()}`);
  return response;
}

function address(phone = `0860000${String(++phoneSequence).padStart(3, '0')}`) {
  return {
    name: 'ผู้รับทดสอบ ห้ามจัดส่ง', phone, address: 'ข้อมูลสมมติสำหรับทดสอบในเครื่อง',
    subdistrict: 'ทดสอบ', district: 'ทดสอบ', province: 'อุตรดิตถ์', postcode: '53130',
    note: 'ออเดอร์สมมติ ห้ามโอนเงินจริงและห้ามจัดส่ง',
  };
}

function postOrder(body) {
  return request(`${base}/api/shop/orders`, {
    method: 'POST', headers: {origin: base, 'content-type': 'application/json'}, body: JSON.stringify(body),
  });
}

async function createOrder(overrides = {}) {
  const input = {requestKey: key(), quantity: 1, address: address(), ...overrides};
  const response = await expectStatus(await postOrder(input), 201, 'Create an isolated test order');
  const result = await response.json();
  const order = await db.get('SELECT * FROM shop_orders WHERE token=?', result.url.split('/').pop());
  assert(order);
  return {...order, url: result.url};
}

function updateOrder(order, changes, headers = {}) {
  return request(`${base}/api/admin/shop-orders`, {
    method: 'POST', headers: {origin: base, cookie, 'content-type': 'application/json', ...headers},
    body: JSON.stringify({id: order.id, version: order.version, ...changes}),
  });
}

async function quoteOrder(order) {
  await expectStatus(await updateOrder(order, {
    action: 'quote', shippingBaht: order.shipping_baht,
    paymentInstructions: 'บัญชีทดสอบในเครื่องเท่านั้น ห้ามโอนเงินจริง',
    dispatchNote: 'รอบทดสอบในเครื่องเท่านั้น ห้ามจัดส่ง', confirmed: true,
  }), 200, 'Quote an isolated test order');
  return {...await db.get('SELECT * FROM shop_orders WHERE id=?', order.id), url: order.url};
}

function upload(order, bytes, options = {}) {
  const form = new FormData();
  form.set('requestKey', options.requestKey || key());
  form.set('file', new File([bytes], options.name || 'test-only.png', {type: options.type === undefined ? 'image/png' : options.type}));
  return request(`${base}/api/shop/orders/${order.token}/slip`, {
    method: 'POST', headers: {origin: options.origin || base}, body: form,
  });
}

async function slipSnapshot(order) {
  const files = await fs.readdir(path.join(directory, 'shop-slips')).catch(error => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  return {
    slips: (await db.get('SELECT COUNT(*) AS n FROM shop_order_slips WHERE order_id=?', order.id)).n,
    notifications: (await db.get("SELECT COUNT(*) AS n FROM shop_line_outbox WHERE order_id=? AND kind='slip'", order.id)).n,
    files: files.sort(),
  };
}

async function rejectWithoutMutation(order, bytes, options, status = 400) {
  const before = await slipSnapshot(order);
  await expectStatus(await upload(order, bytes, options), status, `Reject ${options.name}`);
  assert.deepEqual(await slipSnapshot(order), before, `Rejected ${options.name} must not consume storage, quota, or notification jobs`);
}

async function assertPrivateDownload(order, id, bytes, type) {
  const url = `${base}/api/admin/shop-orders/${order.id}/slip/${id}`;
  await expectStatus(await request(url), 401, 'Slip requires administrator authentication');
  const response = await expectStatus(await request(url, {headers: {cookie}}), 200, 'Read a private test slip');
  assert.equal(response.headers.get('content-type'), type);
  assert.match(response.headers.get('cache-control'), /no-store/);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes, 'Private download preserves the original bytes');
  if (type === 'application/pdf') {
    assert.match(response.headers.get('content-disposition'), /^attachment;/);
    assert.match(response.headers.get('content-security-policy'), /sandbox/);
  }
}

async function assertPortAvailable() {
  assert(Number.isInteger(port) && port > 1024 && port <= 65535, 'Use an unprivileged local test port');
  const probe = net.createServer();
  await new Promise((resolve, reject) => {
    probe.once('error', reject);
    probe.listen(port, '127.0.0.1', resolve);
  });
  await new Promise(resolve => probe.close(resolve));
}

async function startServer(databasePath) {
  await assertPortAvailable();
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', String(port)], {
    cwd: repository,
    env: {
      ...process.env, NODE_ENV: 'production', NODE_OPTIONS: '',
      DATA_DIR: directory, DATABASE_PATH: databasePath, UPLOAD_DIR: path.join(directory, 'uploads'),
      ADMIN_PASSWORD: password, ADMIN_PASSWORD_RESET: password, ADMIN_PASSWORD_RESET_VERSION: 'shop-ux-regression-only',
      ADMIN_SESSION_SECRET: 'shop-ux-regression-session-only', SITE_URL: base, SHOP_ORDERS_ENABLED: '1', WEBSITE_ANALYTICS_ENABLED: '0',
      LINE_CHANNEL_ACCESS_TOKEN: '', LINE_CHANNEL_SECRET: '', LINE_GROUP_ID: '',
      SHOP_LINE_CHANNEL_ACCESS_TOKEN: '', SHOP_LINE_CHANNEL_SECRET: '', SHOP_LINE_NOTIFICATIONS_ENABLED: '0',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', chunk => {serverLog += chunk.toString();});
  server.stderr.on('data', chunk => {serverLog += chunk.toString();});
  let startupError;
  server.once('error', error => {startupError = error;});
  for (let attempt = 0; attempt < 80; attempt++) {
    if (startupError) throw startupError;
    if (server.exitCode !== null) throw new Error(`Local server exited during startup:\n${serverLog}`);
    try {
      const response = await request(`${base}/robots.txt`);
      if (response.ok) return;
    } catch {}
    await delay(200);
  }
  throw new Error(`Local server did not start:\n${serverLog}`);
}

async function main() {
  await fs.access(path.join(repository, '.next', 'BUILD_ID'));
  directory = await fs.mkdtemp(path.join(tmpdir(), 'lablae-shop-ux-'));
  const databasePath = path.join(directory, 'test.db');
  await fs.copyFile(path.join(repository, 'database', 'seed.db'), databasePath);
  db = await open({filename: databasePath, driver: sqlite3.Database});
  await db.exec('PRAGMA busy_timeout=5000');
  await db.run("DELETE FROM settings WHERE key IN ('admin_password','admin_password_hash','admin_password_reset_version')");
  const shopTables = await db.all("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'shop_%'");
  for (const table of shopTables) {
    assert.match(table.name, /^shop_[a-z_]+$/);
    await db.exec(`DROP TABLE ${table.name}`);
  }
  // Simulate a database created before file validation was added.
  await db.exec(`CREATE TABLE shop_order_slips (
    id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL, request_key TEXT NOT NULL,
    filename TEXT NOT NULL, digest TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(order_id,request_key)
  )`);
  const reservationsBefore = (await db.get('SELECT COUNT(*) AS n FROM reservations')).n;
  const fixture = await fixtures();
  await startServer(databasePath);
  const login = await expectStatus(await request(`${base}/api/admin/login`, {
    method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({password}),
  }), 200, 'Sign into the isolated server');
  cookie = login.headers.get('set-cookie').split(';')[0];

  const concurrentInput = {requestKey: key(), quantity: 3, address: address(), goodsBaht: 1, status: 'paid'};
  const concurrentResponses = await Promise.all([postOrder(concurrentInput), postOrder(concurrentInput), postOrder(concurrentInput)]);
  for (const response of concurrentResponses) await expectStatus(response, 201, 'Concurrent order retry');
  const concurrentResults = await Promise.all(concurrentResponses.map(response => response.json()));
  assert(concurrentResults.every(result => result.url === concurrentResults[0].url));
  const concurrentOrder = await db.get('SELECT * FROM shop_orders WHERE request_key=?', concurrentInput.requestKey);
  assert.equal((await db.get('SELECT COUNT(*) AS n FROM shop_orders WHERE request_key=?', concurrentInput.requestKey)).n, 1);
  assert.equal(concurrentOrder.goods_baht, 750);
  assert.equal(concurrentOrder.shipping_baht, 200);
  assert.equal(concurrentOrder.status, 'requested');
  assert.equal((await db.get('SELECT COUNT(*) AS n FROM shop_line_outbox WHERE order_id=?', concurrentOrder.id)).n, 1);
  assert((await db.all('PRAGMA table_info(shop_order_slips)')).some(column => column.name === 'validation_state'));
  pass('Schema migration, concurrent order retry, server prices, and unpaid state');

  const validationOrder = await quoteOrder(await createOrder());
  for (const [bytes, name, type] of [
    [fixture.brokenPng, 'truncated-80-byte.png', 'image/png'],
    [fixture.headerOnlyPdf, 'header-only-15-byte.pdf', 'application/pdf'],
    [fixture.noPagesPdf, 'no-pages.pdf', 'application/pdf'],
    [fixture.malformedPdf, 'malformed-body.pdf', 'application/pdf'],
    [fixture.oversizedImagePdf, '25-million-pixel-image.pdf', 'application/pdf'],
    [fixture.gif, 'unsupported.gif', 'image/gif'],
    [Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>'), 'unsupported.svg', 'image/svg+xml'],
    [Buffer.alloc(0), 'empty.png', 'image/png'],
  ]) await rejectWithoutMutation(validationOrder, bytes, {name, type});
  const afterInvalid = await expectStatus(await upload(validationOrder, fixture.png), 200, 'A good PNG remains uploadable after invalid files');
  const pngId = (await afterInvalid.json()).id;
  await assertPrivateDownload(validationOrder, pngId, fixture.png, 'image/png');
  assert.equal((await db.get('SELECT validation_state FROM shop_order_slips WHERE id=?', pngId)).validation_state, 'valid');
  pass('Corrupt and unsupported uploads do not consume files, slip quota, or LINE jobs');

  for (const [bytes, name, uploadType, downloadType] of [
    [fixture.jpg, 'bank-slip.jpg', 'image/jpeg', 'image/jpeg'],
    [fixture.webp, 'bank-slip.webp', 'image/webp', 'image/webp'],
    [fixture.pdf, 'bank-slip.pdf', 'application/pdf', 'application/pdf'],
    [fixture.banklikePdf, 'text-and-bitmap-test-receipt.pdf', 'application/pdf', 'application/pdf'],
    [fixture.png, 'bank-slip.png', '', 'image/png'],
  ]) {
    const order = await quoteOrder(await createOrder());
    const response = await expectStatus(await upload(order, bytes, {name, type: uploadType}), 200, `Valid ${name}`);
    const id = (await response.json()).id;
    await assertPrivateDownload(order, id, bytes, downloadType);
    assert.equal((await db.get('SELECT status FROM shop_orders WHERE id=?', order.id)).status, 'quoted');
    assert.equal((await db.get('SELECT validation_state FROM shop_order_slips WHERE id=?', id)).validation_state, 'valid');
  }
  pass('Valid JPG, PNG, WebP, vector/text/bitmap PDF, and missing MIME retain private original downloads');

  const dedupOrder = await quoteOrder(await createOrder());
  const uploadKey = key();
  const duplicateResponses = await Promise.all([
    upload(dedupOrder, fixture.png, {requestKey: uploadKey}),
    upload(dedupOrder, fixture.png, {requestKey: uploadKey}),
  ]);
  for (const response of duplicateResponses) await expectStatus(response, 200, 'Concurrent upload retry');
  const duplicateResults = await Promise.all(duplicateResponses.map(response => response.json()));
  assert.equal(duplicateResults[0].id, duplicateResults[1].id);
  await rejectWithoutMutation(dedupOrder, fixture.secondPng, {name: 'request-key-reused.png', requestKey: uploadKey}, 409);
  const contentDuplicate = await expectStatus(await upload(dedupOrder, fixture.png), 200, 'New request key with the same file');
  assert.equal((await contentDuplicate.json()).id, duplicateResults[0].id);
  const twoDistinct = await Promise.all([upload(dedupOrder, fixture.secondPng), upload(dedupOrder, fixture.thirdPng)]);
  for (const response of twoDistinct) await expectStatus(response, 200, 'Distinct concurrent upload');
  const dedupSnapshot = await slipSnapshot(dedupOrder);
  assert.equal(dedupSnapshot.slips, 3);
  assert.equal(dedupSnapshot.notifications, 3);
  await rejectWithoutMutation(dedupOrder, fixture.fourthPng, {name: 'fourth-valid.png'}, 429);
  const unchangedOrder = await db.get('SELECT * FROM shop_orders WHERE id=?', dedupOrder.id);
  assert.equal(unchangedOrder.status, 'quoted');
  assert.equal(unchangedOrder.version, dedupOrder.version);
  pass('Concurrent uploads, request-key/content deduplication, quota, and no automatic paid state');

  const legacyOrder = await quoteOrder(await createOrder());
  const legacyFiles = [];
  await fs.mkdir(path.join(directory, 'shop-slips'), {recursive: true});
  for (const [bytes, extension] of [[fixture.brokenPng, 'png'], [fixture.headerOnlyPdf, 'pdf'], [fixture.secondBrokenPng, 'png']]) {
    const filename = `${key()}.${extension}`;
    await fs.writeFile(path.join(directory, 'shop-slips', filename), bytes);
    const result = await db.run('INSERT INTO shop_order_slips(order_id,request_key,filename,digest) VALUES(?,?,?,?)', legacyOrder.id, key(), filename, digest(bytes));
    await db.run("INSERT INTO shop_line_outbox(event_key,order_id,kind,retry_key) VALUES(?,?,'slip',?)", `slip:${result.lastID}`, legacyOrder.id, randomUUID());
    legacyFiles.push({filename, bytes});
  }
  assert.equal((await db.get("SELECT COUNT(*) AS n FROM shop_order_slips WHERE order_id=? AND validation_state='unchecked'", legacyOrder.id)).n, 3);
  const legacyPage = await expectStatus(await request(base + legacyOrder.url), 200, 'Read a legacy order over HTTP');
  const legacyHtml = await legacyPage.text();
  assert.match(legacyHtml, /<input\b[^>]*type="file"/, 'Legacy corrupt slips must restore the upload input in server-rendered HTML');
  assert.equal((await db.get("SELECT COUNT(*) AS n FROM shop_order_slips WHERE order_id=? AND validation_state='invalid'", legacyOrder.id)).n, 3);
  assert.equal((await slipSnapshot(legacyOrder)).slips, 3, 'Keep the historical rows');
  assert.equal((await slipSnapshot(legacyOrder)).notifications, 3, 'Keep the historical notification rows');
  for (const file of legacyFiles) assert.deepEqual(await fs.readFile(path.join(directory, 'shop-slips', file.filename)), file.bytes, 'Keep original corrupt files for review');
  for (const bytes of [fixture.png, fixture.secondPng, fixture.thirdPng]) await expectStatus(await upload(legacyOrder, bytes), 200, 'Valid upload after three corrupt legacy files');
  assert.equal((await db.get('SELECT COUNT(*) AS n FROM shop_order_slips WHERE order_id=?', legacyOrder.id)).n, 6);
  assert.equal((await db.get("SELECT COUNT(*) AS n FROM shop_order_slips WHERE order_id=? AND validation_state='valid'", legacyOrder.id)).n, 3);
  await rejectWithoutMutation(legacyOrder, fixture.fourthPng, {name: 'legacy-fourth-valid.png'}, 429);
  pass('Legacy corrupt slips are retained, excluded from quota, and allow three good replacements');

  const phoneKey = key();
  const internationalInput = {requestKey: phoneKey, quantity: 1, address: address('+66 81-234-5678')};
  const phoneResponses = await Promise.all([
    postOrder(internationalInput),
    postOrder({...internationalInput, address: {...internationalInput.address, phone: '0812345678'}}),
  ]);
  for (const response of phoneResponses) await expectStatus(response, 201, 'Thai international/local phone normalization');
  const phoneResults = await Promise.all(phoneResponses.map(response => response.json()));
  assert.equal(phoneResults[0].url, phoneResults[1].url);
  const phoneOrder = await db.get('SELECT * FROM shop_orders WHERE request_key=?', phoneKey);
  assert.equal(phoneOrder.phone, '0812345678');
  assert.equal(JSON.parse(phoneOrder.address_json).phone, '0812345678');
  const thaiPhoneOrder = await createOrder({address: address('+๖๖ ๘๙-๑๒๓-๔๕๖๗')});
  assert.equal(thaiPhoneOrder.phone, '0891234567');
  pass('+66, local numbers, and Thai digits use the same stored phone format');

  const cancellationOrder = await quoteOrder(await createOrder());
  await expectStatus(await upload(cancellationOrder, fixture.png), 200, 'Attach a slip before cancellation');
  const eventCount = (await db.get('SELECT COUNT(*) AS n FROM shop_order_events WHERE order_id=?', cancellationOrder.id)).n;
  await expectStatus(await updateOrder(cancellationOrder, {action: 'cancel'}), 409, 'Cancellation needs a payment check acknowledgement');
  await expectStatus(await updateOrder(cancellationOrder, {action: 'cancel', acknowledgedPaymentCheck: false}), 409, 'False acknowledgement is rejected');
  const afterRejectedCancellation = await db.get('SELECT * FROM shop_orders WHERE id=?', cancellationOrder.id);
  assert.equal(afterRejectedCancellation.status, 'quoted');
  assert.equal(afterRejectedCancellation.version, cancellationOrder.version);
  assert.equal((await db.get('SELECT COUNT(*) AS n FROM shop_order_events WHERE order_id=?', cancellationOrder.id)).n, eventCount);
  await expectStatus(await updateOrder(cancellationOrder, {action: 'cancel', acknowledgedPaymentCheck: true}), 200, 'Acknowledged cancellation');
  assert.equal((await db.get('SELECT status FROM shop_orders WHERE id=?', cancellationOrder.id)).status, 'cancelled');
  const noSlipOrder = await createOrder();
  await expectStatus(await updateOrder(noSlipOrder, {action: 'cancel'}), 200, 'An order without a slip can be cancelled');
  assert.equal((await db.get('SELECT status FROM shop_orders WHERE id=?', noSlipOrder.id)).status, 'cancelled');
  pass('Cancellation with a slip requires acknowledgement and rejected changes leave the order intact');

  const failedJob = await db.get("SELECT * FROM shop_line_outbox WHERE order_id=? AND kind='order'", validationOrder.id);
  const expiredJob = await db.get("SELECT * FROM shop_line_outbox WHERE order_id=? AND kind='order'", legacyOrder.id);
  await db.run("UPDATE shop_line_outbox SET state='failed',error='LINE ตอบกลับ 400' WHERE id=?", failedJob.id);
  await db.run("UPDATE shop_line_outbox SET state='expired',error='พ้นช่วงส่งซ้ำอย่างปลอดภัย กรุณาตรวจออเดอร์ในหลังบ้าน' WHERE id=?", expiredJob.id);
  const jobsBefore = await db.all('SELECT id,state,attempts,first_attempt,retry_key,payload FROM shop_line_outbox ORDER BY id');
  const lineStatusResponse = await expectStatus(await request(`${base}/api/admin/shop-line`, {
    method: 'POST', headers: {origin: base, cookie, 'content-type': 'application/json'}, body: JSON.stringify({action: 'retry'}),
  }), 200, 'Read notification status with LINE disabled');
  const lineStatus = (await lineStatusResponse.json()).status;
  assert.equal(lineStatus.configured, false);
  assert.equal(lineStatus.failed, 2);
  assert.deepEqual(lineStatus.issues.map(issue => [issue.orderId, issue.state]), [[legacyOrder.id, 'expired'], [validationOrder.id, 'failed']]);
  assert(lineStatus.issues.every(issue => issue.error.length > 0));
  assert.deepEqual(await db.all('SELECT id,state,attempts,first_attempt,retry_key,payload FROM shop_line_outbox ORDER BY id'), jobsBefore, 'Disabled LINE must not dispatch or change queued jobs');
  const adminPage = await expectStatus(await request(`${base}/admin/shop`, {headers: {cookie}}), 200, 'Read administrator page with failed notifications');
  const adminHtml = await adminPage.text();
  assert(adminHtml.includes(`/admin/shop?order=LL-${validationOrder.id}#order-${validationOrder.id}`), 'Failed notification identifies its order link');
  assert(adminHtml.includes(`/admin/shop?order=LL-${legacyOrder.id}#order-${legacyOrder.id}`), 'Expired notification identifies its order link');
  assert.equal((await db.get('SELECT COUNT(*) AS n FROM reservations')).n, reservationsBefore);
  pass('Failed/expired LINE jobs return order links without sending messages or changing reservations');

  const summary = {base, databasePath, directory, buildId: (await fs.readFile(path.join(repository, '.next', 'BUILD_ID'), 'utf8')).trim(), passed};
  await fs.writeFile(path.join(directory, 'result.json'), JSON.stringify(summary, null, 2));
  console.log(`Evidence: ${directory}`);
  console.log(`PASS: ${passed.length} HTTP integration groups; LINE credentials were empty throughout.`);
}

async function cleanup() {
  if (server && server.exitCode === null) {
    const stopped = new Promise(resolve => server.once('exit', resolve));
    server.kill('SIGTERM');
    await Promise.race([stopped, delay(2500)]);
    if (server.exitCode === null) {
      server.kill('SIGKILL');
      await Promise.race([stopped, delay(1000)]);
    }
  }
  if (db) await db.close();
  if (directory) await fs.writeFile(path.join(directory, 'server.log'), serverLog);
}

main().catch(error => {
  console.error(error);
  if (directory) console.error(`Test files and server log: ${directory}`);
  process.exitCode = 1;
}).finally(cleanup);
