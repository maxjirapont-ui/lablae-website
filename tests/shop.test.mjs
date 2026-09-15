import test from "node:test";
import assert from "node:assert/strict";
import { SHOP_MAX_PACKS, getShopShippingBaht, estimateShopOrder, getShopBundleEstimates, getShopBundleSuggestion, normalizeShopDigits, validateShopAddress } from "../src/lib/shop.ts";

test("bundle cards derive prices and per-pack averages from the same estimate", () => {
  const bundles = getShopBundleEstimates();
  assert.deepEqual(bundles.map(x => x.quantity), [3, 5, 9]);
  assert.deepEqual(bundles.map(x => x.estimatedSubtotalBaht), [950, 1450, 2450]);
  assert.deepEqual(bundles.map(x => Math.round(x.averagePerPackBaht)), [317, 290, 272]);
  assert.deepEqual(bundles.filter(x => x.recommended).map(x => x.quantity), [5]);
  assert.ok(bundles.every(x => x.payable === false));
});

test("bundle suggestion discloses extra goods and the complete new estimate", () => {
  assert.deepEqual(getShopBundleSuggestion(1), {quantity:3, extraPacks:2, extraGoodsBaht:500, shippingBaseBaht:200, estimatedSubtotalBaht:950});
  assert.equal(getShopBundleSuggestion(2).extraGoodsBaht, 250);
  for (const n of [0, -1, 1.5, 3, 4, 5, 9, 10, 11, NaN, Infinity]) assert.equal(getShopBundleSuggestion(n), null);
});

test("confirmed shipping tiers apply to 1–9 and 10–20 packs", () => {
  for (let count = 1; count <= 9; count++) {
    const estimate = estimateShopOrder(count);
    assert.equal(getShopShippingBaht(count), 200);
    assert.equal(estimate.goodsBaht, count * 250);
    assert.equal(estimate.shippingBaseBaht, 200);
    assert.equal(estimate.estimatedSubtotalBaht, count * 250 + 200);
    assert.equal(estimate.payable, false);
  }
  for (let count = 10; count <= 20; count++) {
    const estimate = estimateShopOrder(count);
    assert.equal(getShopShippingBaht(count), 400);
    assert.equal(estimate.shippingBaseBaht, 400);
    assert.equal(estimate.estimatedSubtotalBaht, count * 250 + 400);
  }
  for (const count of [0, -1, 1.5, 21, NaN, Infinity, "1", null, undefined]) {
    assert.equal(getShopShippingBaht(count), null);
  }
});

test("invalid quantities cannot produce an estimate", () => {
  for (const count of [0, -1, 1.5, SHOP_MAX_PACKS + 1, NaN, Infinity, "1", null, undefined]) {
    assert.equal(estimateShopOrder(count), null);
  }
});

const address = {
  name: "ผู้รับทดสอบ", phone: "081-234-5678", address: "บ้านเลขที่ทดสอบ 1",
  subdistrict: "แขวงทดสอบ", district: "เขตทดสอบ", province: "กรุงเทพมหานคร", postcode: "10110", note: "",
};

test("valid address and Thai digits work without requiring notes", () => {
  assert.deepEqual(validateShopAddress(address), {});
  assert.deepEqual(validateShopAddress({ ...address, phone: "๐๘๑๒๓๔๕๖๗๘", postcode: "๑๐๑๑๐" }), {});
  assert.equal(normalizeShopDigits("๐๑๒๓๔๕๖๗๘๙"), "0123456789");
  assert.deepEqual(validateShopAddress({ ...address, phone: "02-123-4567" }), {});
});

test("missing and oversized fields, invalid phone and postcode are rejected", () => {
  for (const key of ["name", "phone", "address", "subdistrict", "district", "province", "postcode"]) {
    assert.ok(validateShopAddress({ ...address, [key]: " " })[key]);
  }
  for (const phone of ["123", "abcdefghij", "0000000000", "081234567890", "abc0812345678"]) {
    assert.ok(validateShopAddress({ ...address, phone }).phone);
  }
  for (const postcode of ["00000", "1234", "123456", "abcde"]) {
    assert.ok(validateShopAddress({ ...address, postcode }).postcode);
  }
  assert.ok(validateShopAddress({ ...address, note: "x".repeat(501) }).note);
  assert.ok(validateShopAddress({ ...address, address: "x".repeat(301) }).address);
});


test("bulk orders accept more than twenty packs without inventing a shipping total", () => {
  for (const quantity of [21, 100, 1000, SHOP_MAX_PACKS]) {
    const order = estimateShopOrder(quantity);
    assert.equal(order.goodsBaht, quantity * 250);
    assert.equal(order.shippingBaseBaht, null);
    assert.equal(order.estimatedSubtotalBaht, null);
    assert.equal(order.payable, false);
  }
});
