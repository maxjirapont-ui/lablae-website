// Owner-confirmed: 250 baht / 500 g; flat shipping 200 baht for 1–9 packs.
export const SHOP_PRODUCT = {
  id: "sai-ua-500g",
  name: "ไส้อั่วลำลำลับแล",
  priceBaht: 250,
  weightGrams: 500,
  image: "/images/shop/sai-ua-500g-studio.png",
  imageAlt: "ไส้อั่วลำลำลับแลในแพ็กซีลสูญญากาศ ขนาด 500 กรัม",
} as const;

// Arithmetic safety only; production capacity is confirmed by the shop after ordering.
export const SHOP_MAX_PACKS = Math.floor(Number.MAX_SAFE_INTEGER / SHOP_PRODUCT.weightGrams);
export const SHOP_FLAT_SHIPPING_MAX_PACKS = 9;
export const SHOP_SHIPPING_BAHT = 200;

export function getShopShippingBaht(quantity: number): number | null {
  if (!Number.isSafeInteger(quantity) || quantity < 1) return null;
  if (quantity <= 9) return 200;
  if (quantity <= 20) return 400;
  return null;
}

export function estimateShopOrder(quantity: number) {
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > SHOP_MAX_PACKS) {
    return null;
  }
  const productWeightGrams = quantity * SHOP_PRODUCT.weightGrams;
  const shippingBaseBaht = getShopShippingBaht(quantity);
  const goodsBaht = quantity * SHOP_PRODUCT.priceBaht;
  return {
    quantity,
    goodsBaht,
    productWeightGrams,
    shippingBaseBaht,
    estimatedSubtotalBaht: shippingBaseBaht === null ? null : goodsBaht + shippingBaseBaht,
    payable: false as const,
  };
}

export const SHOP_BUNDLES = [
  { quantity: 3, title: "กินที่บ้าน", recommended: false },
  { quantity: 5, title: "แบ่งกันอร่อย", recommended: true },
  { quantity: 9, title: "รวมสั่งกับเพื่อน", recommended: false },
] as const;

export function getShopBundleEstimates() {
  return SHOP_BUNDLES.map((bundle) => {
    const estimate = estimateShopOrder(bundle.quantity);
    if (!estimate || estimate.estimatedSubtotalBaht === null || estimate.shippingBaseBaht === null) throw new Error("Invalid bundle quantity");
    return {
      ...bundle,
      ...estimate,
      shippingBaseBaht: estimate.shippingBaseBaht,
      estimatedSubtotalBaht: estimate.estimatedSubtotalBaht,
      averagePerPackBaht: estimate.estimatedSubtotalBaht / bundle.quantity,
    };
  });
}

// Suggest only when base shipping stays unchanged; never change selection automatically.
export function getShopBundleSuggestion(quantity: number) {
  if (quantity >= 3) return null;
  const current = estimateShopOrder(quantity);
  const suggested = estimateShopOrder(3);
  if (!current || !suggested || suggested.shippingBaseBaht === null || suggested.estimatedSubtotalBaht === null || current.shippingBaseBaht !== suggested.shippingBaseBaht) return null;
  return {
    quantity: suggested.quantity,
    extraPacks: suggested.quantity - quantity,
    extraGoodsBaht: suggested.goodsBaht - current.goodsBaht,
    shippingBaseBaht: suggested.shippingBaseBaht,
    estimatedSubtotalBaht: suggested.estimatedSubtotalBaht,
  };
}

export type ShopAddress = {
  name: string;
  phone: string;
  address: string;
  subdistrict: string;
  district: string;
  province: string;
  postcode: string;
  note: string;
};

export type ShopAddressErrors = Partial<Record<keyof ShopAddress, string>>;

export function normalizeShopDigits(value: string): string {
  return value.replace(/[๐-๙]/g, (digit) => String(digit.charCodeAt(0) - 0x0e50));
}

export function validateShopAddress(value: ShopAddress): ShopAddressErrors {
  const errors: ShopAddressErrors = {};
  if (value.name.trim().length < 2 || value.name.trim().length > 100) {
    errors.name = "กรุณาใส่ชื่อผู้รับ 2–100 ตัวอักษร";
  }
  const phone = normalizeShopDigits(value.phone).replace(/[\s()-]/g, "");
  if (!/^(?:0[689]\d{8}|0[2-7]\d{7})$/.test(phone)) {
    errors.phone = "กรุณาใส่เบอร์โทรศัพท์ไทยให้ครบ เช่น 0812345678";
  }
  const required: Array<[keyof ShopAddress, string, number]> = [
    ["address", "บ้านเลขที่และถนน / หมู่บ้าน", 300],
    ["subdistrict", "ตำบล / แขวง", 100],
    ["district", "อำเภอ / เขต", 100],
    ["province", "จังหวัด", 100],
  ];
  for (const [key, label, max] of required) {
    if (!value[key].trim()) errors[key] = `กรุณาใส่${label}`;
    else if (value[key].length > max) errors[key] = `${label}ยาวเกิน ${max} ตัวอักษร`;
  }
  if (!/^[1-9]\d{4}$/.test(normalizeShopDigits(value.postcode.trim()))) {
    errors.postcode = "กรุณาใส่รหัสไปรษณีย์ 5 หลัก";
  }
  if (value.note.length > 500) errors.note = "หมายเหตุยาวได้ไม่เกิน 500 ตัวอักษร";
  return errors;
}
