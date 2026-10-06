// Only return to known admin pages; never follow an arbitrary URL from a query.
export function adminReturnPath(value: string | null): string {
  if (value === "/admin") return value;
  if (value === "/admin/shop") return value;
  if (value && /^\/admin\/shop\?order=LL-[1-9]\d*(?:#order-[1-9]\d*)?$/.test(value)) return value;
  return "/admin";
}
