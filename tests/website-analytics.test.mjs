import test from 'node:test';
import assert from 'node:assert/strict';
import { campaignParameters, isPublicAnalyticsPath, websiteLinkAction, trackWebsiteAction } from '../src/lib/website-analytics.ts';

test('only public restaurant pages can be measured', () => {
  for (const path of ['/', '/shop', '/menu', '/directions', '/blog/chapter-22-khao-phan-phak', '/visit', '/visit/khantoke-for-two']) assert.equal(isPublicAnalyticsPath(path), true);
  for (const path of ['/admin', '/admin/bookings', '/booking/ABC123', '/shop/orders/'+'a'.repeat(48), '/api/bookings', '/blog/name@example.com']) assert.equal(isPublicAnalyticsPath(path), false);
});

test('campaign attribution drops unknown labels and personal query values', () => {
  assert.deepEqual(campaignParameters('?utm_source=google&utm_medium=organic&utm_campaign=business_profile&utm_content=menu&phone=0950000000&email=customer@example.com'), {
    utm_source: 'google', utm_medium: 'organic', utm_campaign: 'business_profile', utm_content: 'menu',
  });
  assert.deepEqual(campaignParameters('?utm_source=customer@example.com&booking=secret'), {});
});

test('links measure intent without confusing external pages or unrelated hashes', () => {
  const origin = 'https://www.lablae.net';
  assert.equal(websiteLinkAction('https://maps.app.goo.gl/HQpRWVM8qFobGHxL6?g_st=ic', origin), null);
  for (const [href, expected] of [['/menu?category=food','menu_click'], ['/directions','directions_click'], ['/#booking','booking_click'], ['tel:0956283125','phone_click'], ['https://maps.app.goo.gl/8xsKvMFqaAMfE3K87','directions_click'], ['https://example.com/menu',null], ['/#about',null], ['javascript:void(0)',null]]) {
    assert.equal(websiteLinkAction(href, origin), expected);
  }
});

test('events exclude private routes, test hosts, queries and booking details', () => {
  const calls = [];
  const previous = globalThis.window;
  try {
    globalThis.window = {location: new URL('https://www.lablae.net/?phone=0950000000#private'), gtag: (...args) => calls.push(args)};
    trackWebsiteAction('booking_request_submitted');
    assert.equal(calls.length, 1);
    assert.equal(calls[0][2].page_location, 'https://www.lablae.net/');
    assert.equal(JSON.stringify(calls).includes('0950000000'), false);
    globalThis.window.location = new URL('https://www.lablae.net/admin');
    trackWebsiteAction('phone_click');
    globalThis.window.location = new URL('http://localhost:3005/menu');
    trackWebsiteAction('menu_click');
    assert.equal(calls.length, 1);
  } finally {
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  }
});

test('shop events use only public names and a clean public URL', () => {
  const calls=[]; const previous=globalThis.window;
  try {
    globalThis.window={location:new URL('https://www.lablae.net/shop?phone=0812345678#review'),gtag:(...args)=>calls.push(args)};
    for(const name of ['shop_begin_checkout','shop_review_order','shop_order_created']) trackWebsiteAction(name);
    assert.equal(calls.length,3);
    assert(calls.every(call=>call[2].page_location==='https://www.lablae.net/shop'));
    assert(!JSON.stringify(calls).includes('0812345678'));
    globalThis.window.location=new URL('https://www.lablae.net/shop/orders/'+'a'.repeat(48));
    trackWebsiteAction('shop_order_created');
    assert.equal(calls.length,3);
  } finally { if(previous===undefined) delete globalThis.window; else globalThis.window=previous; }
});
