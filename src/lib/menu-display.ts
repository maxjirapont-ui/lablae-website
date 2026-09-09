// Keep customer-facing quantities readable without overwriting editable menu data.
export function menuDescription(description: string): string {
  return description.replace(/ข้าวเหนียว\s+(\d+)(?=\s*(?:,|$))/g, "ข้าวเหนียว $1 ที่");
}

export function menuPriceLabel(category: string): string {
  return category.includes("ขันโตก") ? "ราคาต่อชุด" : "ราคาต่อรายการ";
}

export function menuPrice(price: number): string {
  return price > 0 ? `${price.toLocaleString("th-TH-u-nu-latn")} บาท` : "สอบถามราคาจากร้าน";
}

export function menuPriceRange(items: Array<{ price: number }>): string | undefined {
  const prices = items.map((item) => item.price).filter((price) => Number.isFinite(price) && price > 0);
  if (!prices.length) return undefined;
  const minimum = Math.min(...prices);
  const maximum = Math.max(...prices);
  return `${minimum === maximum ? minimum : `${minimum}–${maximum}`} บาทต่อรายการ รวมเมนูแบบชุด ไม่ใช่ราคาต่อคน`;
}
