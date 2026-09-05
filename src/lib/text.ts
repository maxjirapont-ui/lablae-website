const THAI_DIGITS = "๐๑๒๓๔๕๖๗๘๙";

export function toArabicDigits(value: string): string {
  return value.replace(/[๐-๙]/g, (digit) => String(THAI_DIGITS.indexOf(digit)));
}
