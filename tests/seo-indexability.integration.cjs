/* eslint-disable @typescript-eslint/no-require-imports -- Isolated production HTTP checks. */
// Run after npm run build. Seed-only data, no orders, payments, or notifications.
const assert = require('node:assert/strict');
const {spawn} = require('node:child_process');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

async function check(enabled, port) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'lablae-seo-'));
  await fs.copyFile(path.join(process.cwd(), 'database/seed.db'), path.join(directory, 'test.db'));
  const base = `http://127.0.0.1:${port}`;
  let log = '';
  const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', String(port)], {
    env: {...process.env, NODE_ENV: 'production', NODE_OPTIONS: '',
      DATABASE_PATH: path.join(directory, 'test.db'), UPLOAD_DIR: path.join(directory, 'uploads'),
      SHOP_ORDERS_ENABLED: enabled ? '1' : '0', WEBSITE_ANALYTICS_ENABLED: '0',
      LINE_CHANNEL_ACCESS_TOKEN: '', LINE_CHANNEL_SECRET: '', LINE_GROUP_ID: '',
      SHOP_LINE_CHANNEL_ACCESS_TOKEN: '', SHOP_LINE_CHANNEL_SECRET: '', SHOP_LINE_NOTIFICATIONS_ENABLED: '0'},
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', data => { log += data; });
  server.stderr.on('data', data => { log += data; });
  const request = url => fetch(base + url, {signal: AbortSignal.timeout(15000)});
  try {
    let ready = false;
    for (let i = 0; i < 80; i++) {
      if (server.exitCode !== null) throw new Error(log);
      try { ready = (await request('/robots.txt')).ok; } catch { /* Starting. */ }
      if (ready) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert(ready, log);
    const sitemapResponse = await request('/sitemap.xml');
    assert.equal(sitemapResponse.status, 200);
    const sitemap = await sitemapResponse.text();
    const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
    assert.equal(urls.includes('https://www.lablae.net/shop'), enabled);
    assert.equal(new Set(urls).size, urls.length);
    assert(!urls.some(url => /\/admin|\/shop\/orders|\/booking\//.test(url)));
    assert(urls.includes('https://www.lablae.net/directions'));
    console.log(`PASS: ${enabled ? 'public' : 'closed'} shop sitemap follows runtime flag and contains only public canonical pages`);
    const response = await request('/shop');
    const html = await response.text();
    assert.equal(response.status, enabled ? 200 : 404);
    const directives = html.match(/<meta\b[^>]*name="(?:robots|googlebot)"[^>]*>/g) || [];
    assert(directives.length > 0);
    if (enabled) {
      assert(directives.every(tag => !tag.includes('noindex') && !tag.includes('nofollow')));
      assert(html.includes('<link rel="canonical" href="https://www.lablae.net/shop"'));
      const schemas = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map(match => JSON.parse(match[1]));
      const products = schemas.flatMap(schema => schema['@graph'] || []).filter(item => item['@type'] === 'Product');
      assert.deepEqual(products.map(product => product.offers.price), [339, 999]);
      assert(products.every(product => product.offers.url === 'https://www.lablae.net/shop'));
      console.log('PASS: public product is indexable, self-canonical, and keeps both verified prices');
    } else {
      assert(directives.some(tag => tag.includes('noindex')));
      console.log('PASS: closed shop stays unavailable and noindex');
    }
  } finally {
    const stopped = new Promise(resolve => server.once('exit', resolve));
    server.kill('SIGTERM');
    await stopped;
    await fs.rm(directory, {recursive: true, force: true});
  }
}

(async () => { await check(true, 3051); await check(false, 3052); })().catch(error => { console.error(error); process.exitCode = 1; });
