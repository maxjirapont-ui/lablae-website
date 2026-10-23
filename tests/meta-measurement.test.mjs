import test from 'node:test';
import assert from 'node:assert/strict';
import { validMetaPixelId, metaActionName } from '../src/lib/meta-measurement.ts';

test('configuration and event names cannot inject arbitrary tracking data', () => {
  assert.equal(validMetaPixelId('123456789012345'), '123456789012345');
  for (const value of [undefined, '', '<script>', '12', 'token-secret']) assert.equal(validMetaPixelId(value), '');
  assert.equal(metaActionName('phone_click'), 'PhoneClick');
  assert.equal(metaActionName('directions_click'), 'DirectionsClick');
  for (const action of ['booking_request_submitted', 'shop_order_created', 'Purchase', '0812345678']) assert.equal(metaActionName(action), null);
});

const { metaUrlParametersAreSafe, emitBookingLead } = await import('../src/lib/meta-measurement.ts');
test('ad click IDs and approved campaign links can be measured; personal URL values cannot', () => {
  for (const suffix of ['', '#booking', '?utm_source=facebook&utm_medium=paid_social&utm_campaign=booking_test&utm_content=menu', '?fbclid=IwZXh0bgNhZW0CMTEA123456789&utm_campaign=123456789012345&utm_content=987654321098765#booking']) {
    assert.equal(metaUrlParametersAreSafe(new URL('https://www.lablae.net/'+suffix)),true,suffix);
  }
  for (const suffix of ['?phone=0812345678', '?utm_content=customer@example.com', '?fbclid=abc@private', '?utm_source=facebook&utm_source=line', '?category=customer', '#customer-name', '?booking=123456']) {
    assert.equal(metaUrlParametersAreSafe(new URL('https://www.lablae.net/'+suffix)),false,suffix);
  }
  assert.equal(metaUrlParametersAreSafe(new URL('https://user:password@www.lablae.net/')),false);
});
test('only a valid successful booking ID emits Lead, and retries are suppressed', () => {
  const seen=new Set(); const calls=[]; const send=(...args)=>calls.push(args); const pixel='2173890399880386'; const id='a'.repeat(64);
  for (const value of [undefined,'failed','123456',null]) assert.equal(emitBookingLead(send,pixel,value,seen),false);
  assert.equal(emitBookingLead(send,pixel,id,seen),true);
  assert.equal(emitBookingLead(send,pixel,id,seen),false);
  assert.equal(calls.length,1); assert.equal(calls[0][2],'Lead'); assert.deepEqual(calls[0][4],{eventID:id});
  assert(!JSON.stringify(calls).includes('Purchase'));
});
