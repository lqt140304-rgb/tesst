import { SUPPORT_KINDS, SUPPORT_STATUSES, type SupportKind } from '../contracts/enums';

export const SUPPORT_MSG = {
  shape: 'Phiếu gửi lên chưa đúng.',
  unknown: 'Mục này không có.',
  kind: 'Chọn loại phiếu: hỏi cách dùng, báo lỗi hoặc góp ý.',
  title: 'Tiêu đề cần từ 1 đến 80 ký tự.',
  body: 'Nội dung cần từ 1 đến 1000 ký tự.',
  screen: 'Tên màn hình tối đa 100 ký tự.',
  reply: 'Trả lời cần từ 1 đến 500 ký tự.',
  status: 'Chỉ đặt được Mới hoặc Đang xem; Đã trả lời đi qua nút trả lời.',
  answered: 'Phiếu đã trả lời, không đổi trạng thái được.',
  filter: 'Trạng thái lọc chưa đúng.',
  duplicate: 'Bạn vừa gửi phiếu này rồi, đang chờ trả lời.',
} as const;

const KNOWN = ['kind', 'title', 'body', 'screen'] as const;
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const text = (v: unknown, min: number, max: number) => typeof v === 'string' && v.trim().length >= min && v.trim().length <= max;

export function validateSupportInput(input: unknown): Record<string, string> {
  if (!isObject(input)) return { support: SUPPORT_MSG.shape };
  // A Map, not `{}`: assigning to `errors['__proto__']` on a plain object is silently dropped.
  const errors = new Map<string, string>();
  if (!SUPPORT_KINDS.includes(input.kind as SupportKind)) errors.set('kind', SUPPORT_MSG.kind);
  if (!text(input.title, 1, 80)) errors.set('title', SUPPORT_MSG.title);
  if (!text(input.body, 1, 1000)) errors.set('body', SUPPORT_MSG.body);
  if (Object.hasOwn(input, 'screen') && input.screen !== undefined && !text(input.screen, 0, 100)) errors.set('screen', SUPPORT_MSG.screen);
  for (const k of Object.keys(input)) if (!KNOWN.includes(k as (typeof KNOWN)[number])) errors.set(k, SUPPORT_MSG.unknown);
  return Object.fromEntries(errors);
}

export const validateReply = (t: unknown): string | null => (text(t, 1, 500) ? null : SUPPORT_MSG.reply);
export const validateStatus = (s: unknown): string | null => (s === 'new' || s === 'seen' ? null : SUPPORT_MSG.status);
export const isSupportStatus = (s: unknown) => SUPPORT_STATUSES.includes(s as never);
