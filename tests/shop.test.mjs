import test from "node:test";
import assert from "node:assert/strict";
import { SHOP_PRODUCT, SHOP_PROMOTION, SHOP_MAX_PACKS, getShopShippingBaht, estimateShopOrder, getShopBundleEstimates, getShopBundleSuggestion, normalizeShopDigits, normalizeShopPhone, validateShopAddress } from "../src/lib/shop.ts";

test("bundle cards derive prices and per-pack averages from the same estimate", () => {
  const bundles = getShopBundleEstimates();
  assert.deepEqual(bundles.map(x => x.quantity), [3, 6, 9]);
  assert.deepEqual(bundles.map(x => x.estimatedSubtotalBaht), [999, 1998, 2997]);
  assert.deepEqual(bundles.map(x => x.averagePerPackBaht), [333, 333, 333]);
  assert.deepEqual(bundles.map(x => x.discountBaht), [18, 36, 54]);
  assert.deepEqual(bundles.filter(x => x.recommended).map(x => x.quantity), [3]);
  assert.ok(bundles.every(x => x.payable === false));
});

test("bundle suggestion deducts the shipping saving from the extra total", () => {
  assert.deepEqual(getShopBundleSuggestion(1), {quantity:3, extraPacks:2, extraGoodsBaht:660, extraTotalBaht:460, shippingSavedBaht:200, shippingBaseBaht:0, estimatedSubtotalBaht:999});
  assert.deepEqual(getShopBundleSuggestion(2), {quantity:3, extraPacks:1, extraGoodsBaht:321, extraTotalBaht:121, shippingSavedBaht:200, shippingBaseBaht:0, estimatedSubtotalBaht:999});
  for (const n of [0, -1, 1.5, 3, 4, 5, 9, 10, 11, NaN, Infinity]) assert.equal(getShopBundleSuggestion(n), null);
});

test("the 999-baht promotion repeats for each three packs and charges 339 for remaining packs", () => {
  assert.equal(SHOP_PRODUCT.priceBaht, 339);
  assert.equal(SHOP_PRODUCT.weightGrams, 500);
  assert.deepEqual(SHOP_PROMOTION, {quantity:3, priceBaht:999, freeShippingMinPacks:3});
  for (const [count, goods, shipping, total, discount, bundleCount] of [
    [1, 339, 200, 539, 0, 0], [2, 678, 200, 878, 0, 0],
    [3, 999, 0, 999, 18, 1], [4, 1338, 0, 1338, 18, 1],
    [5, 1677, 0, 1677, 18, 1], [6, 1998, 0, 1998, 36, 2],
    [9, 2997, 0, 2997, 54, 3], [10, 3336, 0, 3336, 54, 3],
    [20, 6672, 0, 6672, 108, 6], [21, 6993, 0, 6993, 126, 7],
  ]) {
    const estimate = estimateShopOrder(count);
    assert.equal(getShopShippingBaht(count), shipping);
    assert.equal(estimate.goodsBeforeDiscountBaht, count * 339);
    assert.equal(estimate.goodsBaht, goods);
    assert.equal(estimate.discountBaht, discount);
    assert.equal(estimate.bundleCount, bundleCount);
    assert.equal(estimate.productWeightGrams, count * 500);
    assert.equal(estimate.shippingBaseBaht, shipping);
    assert.equal(estimate.estimatedSubtotalBaht, total);
    assert.equal(estimate.payable, false);
  }
  for (const count of [0, -1, 1.5, SHOP_MAX_PACKS + 1, NaN, Infinity, "1", null, undefined]) {
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

test("Thai international phone formats normalize to the domestic number", () => {
  for (const phone of ['+66 81-234-5678','+๖๖๘๑๒๓๔๕๖๗๘','+66 (2) 123-4567']) {
    assert.deepEqual(validateShopAddress({...address,phone}),{});
  }
  assert.equal(normalizeShopPhone('+66 81-234-5678'),'0812345678');
  assert.equal(normalizeShopPhone('+66 (2) 123-4567'),'021234567');
  for (const phone of ['+65 812345678','+66 0812345678','+66 123']) assert.ok(validateShopAddress({...address,phone}).phone);
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


test("bulk orders stay selectable and keep integer totals with free shipping", () => {
  for (const quantity of [21, 100, 1000, SHOP_MAX_PACKS]) {
    const order = estimateShopOrder(quantity);
    const count = BigInt(quantity);
    const goods = (count / 3n) * 999n + (count % 3n) * 339n;
    assert.equal(BigInt(order.goodsBaht), goods);
    assert.equal(BigInt(order.goodsBeforeDiscountBaht), count * 339n);
    assert.equal(BigInt(order.discountBaht), count * 339n - goods);
    assert.equal(order.shippingBaseBaht, 0);
    assert.equal(order.estimatedSubtotalBaht, order.goodsBaht);
    assert.ok(Number.isSafeInteger(order.goodsBaht));
    assert.ok(Number.isSafeInteger(order.productWeightGrams));
    assert.equal(order.payable, false);
  }
});
