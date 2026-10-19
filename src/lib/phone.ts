/** Vietnamese mobile prefixes after the leading 0 (03x, 05x, 07x, 08x, 09x). */
const MOBILE = /^0[35789]\d{8}$/;

/** Any common way of writing a VN mobile number → E.164 (+84…), or null. */
export function normalizeVnPhone(input: string): string | null {
  let digits = input.replace(/[\s.\-()]/g, '');
  if (digits.startsWith('+84')) digits = `0${digits.slice(3)}`;
  else if (digits.startsWith('84') && digits.length === 11) digits = `0${digits.slice(2)}`;
  if (!MOBILE.test(digits)) return null;
  return `+84${digits.slice(1)}`;
}

/** "+84973555105" → "097 355 51 05" */
export function formatPhoneVi(e164: string): string {
  const n = `0${e164.replace(/^\+84/, '')}`;
  return `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6, 8)} ${n.slice(8, 10)}`;
}
