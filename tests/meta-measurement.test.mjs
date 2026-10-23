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
