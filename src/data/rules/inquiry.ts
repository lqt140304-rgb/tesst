import { normalizeVnPhone } from '../../lib/phone';

/** Visitor messages from the public intro page (owner, 22/10/2026). */
export const INQUIRY_TEXT_MAX = 500;
export const INQUIRY_NAME_MAX = 60;
export const INQUIRY_ABOUT_MAX = 60;
/** Per phone number per day (Vietnam time). */
export const INQUIRY_DAILY_MAX = 3;

export const INQUIRY_MSG = {
  shape: 'Lời nhắn gửi lên chưa đúng.',
  unknown: 'Mục này không có.',
  name: 'Bạn nhập tên (tối đa 60 ký tự) để nhân viên biết gọi ai nhé.',
  phoneEmpty: 'Bạn nhập số điện thoại để nhân viên gọi lại.',
  phone: 'Số điện thoại chưa đúng. Bạn kiểm tra lại giúp nhé (ví dụ: 0912 345 678).',
  text: 'Lời nhắn cần từ 1 đến 500 ký tự.',
  about: 'Tên sản phẩm tối đa 60 ký tự.',
  daily: 'Bạn đã gửi nhiều lời nhắn hôm nay. Bạn gọi hotline 097 355 51 05 giúp Lê Sơn nhé.',
} as const;

const KNOWN = ['name', 'phone', 'text', 'about'];
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const text = (v: unknown, min: number, max: number) => typeof v === 'string' && v.trim().length >= min && v.trim().length <= max;

export function validateInquiry(input: unknown): Record<string, string> {
  if (!isObject(input)) return { inquiry: INQUIRY_MSG.shape };
  // A Map, not `{}`: assigning to `errors['__proto__']` on a plain object is silently dropped.
  const errors = new Map<string, string>();
  if (!text(input.name, 1, INQUIRY_NAME_MAX)) errors.set('name', INQUIRY_MSG.name);
  if (typeof input.phone !== 'string' || !input.phone.trim()) errors.set('phone', INQUIRY_MSG.phoneEmpty);
  else if (!normalizeVnPhone(input.phone)) errors.set('phone', INQUIRY_MSG.phone);
  if (!text(input.text, 1, INQUIRY_TEXT_MAX)) errors.set('text', INQUIRY_MSG.text);
  if (Object.hasOwn(input, 'about') && input.about !== undefined && !text(input.about, 0, INQUIRY_ABOUT_MAX)) errors.set('about', INQUIRY_MSG.about);
  for (const k of Object.keys(input)) if (!KNOWN.includes(k)) errors.set(k, INQUIRY_MSG.unknown);
  return Object.fromEntries(errors);
}

/** The same message written again: spaces and letter case do not matter. */
export const inquiryKey = (t: string) => t.trim().replace(/\s+/g, ' ').toLowerCase();
