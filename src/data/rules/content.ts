import { FEATURED_CATEGORIES, type FeaturedCategory, type Species } from '../contracts/enums';

/** Featured content on the public intro page (owner, 22/10/2026). */
export const FEATURED_MAX = 30;
export const FEATURED_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
/** Prices are stored and shown to staff only; flip this when the owner sends the price list. */
export const FEATURED_SHOW_PRICE = false;

/** media_key of a picture kept only in this browser: "local:img-<id>". */
export const isImageKey = (key: string) => key.startsWith('local:img-');

export const CONTENT_MSG = {
  shape: 'Nội dung gửi lên chưa đúng.',
  unknown: 'Mục này không có.',
  name: 'Tên cần từ 1 đến 60 ký tự.',
  category: 'Chọn loại: thức ăn, cát vệ sinh hoặc phụ kiện.',
  note: 'Ghi chú tối đa 120 ký tự.',
  price: 'Giá cần là số đồng nguyên từ 0 đến 100.000.000.',
  title: 'Tiêu đề cần từ 1 đến 80 ký tự.',
  story: 'Câu chuyện cần từ 1 đến 600 ký tự.',
  petName: 'Tên bé hiển thị cần từ 1 đến 30 ký tự.',
  species: 'Chọn loài: chó, mèo hoặc khác.',
  consent: 'Bạn cần xác nhận chủ nuôi đã đồng ý trước khi đăng.',
  limit: 'Đã đủ 30 mục. Bạn xóa bớt một mục rồi thêm nhé.',
  notImage: 'Tệp này không phải ảnh. Bạn chọn tệp JPG, PNG hoặc WebP nhé.',
  tooBig: 'Ảnh lớn hơn 5 MB. Bạn chọn ảnh khác nhé.',
  storage: 'Trình duyệt này không lưu được ảnh.',
  phone: 'Có số điện thoại trong chữ này. Bạn bỏ số đi nhé.',
  customerName: 'Có họ tên một khách hàng trong chữ này. Bạn bỏ tên đi nhé.',
  medicine: 'Có tên thuốc hoặc liều dùng trong chữ này. Bạn bỏ phần đó đi nhé.',
} as const;

const SPECIES = ['dog', 'cat', 'other'] as const satisfies readonly Species[];
const PRODUCT_KEYS = ['name', 'category', 'note', 'priceVnd'];
const CASE_KEYS = ['title', 'story', 'petName', 'species', 'consent'];

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const has = (o: Record<string, unknown>, k: string) => Object.hasOwn(o, k) && o[k] !== undefined;
const text = (v: unknown, min: number, max: number) => typeof v === 'string' && v.trim().length >= min && v.trim().length <= max;

function unknownKeys(input: Record<string, unknown>, known: readonly string[], errors: Map<string, string>) {
  for (const k of Object.keys(input)) if (!known.includes(k)) errors.set(k, CONTENT_MSG.unknown);
}

export function validateProductInput(input: unknown): Record<string, string> {
  if (!isObject(input)) return { product: CONTENT_MSG.shape };
  // A Map, not `{}`: assigning to `errors['__proto__']` on a plain object is silently dropped.
  const errors = new Map<string, string>();
  if (!text(input.name, 1, 60)) errors.set('name', CONTENT_MSG.name);
  if (!FEATURED_CATEGORIES.includes(input.category as FeaturedCategory)) errors.set('category', CONTENT_MSG.category);
  if (has(input, 'note') && !text(input.note, 0, 120)) errors.set('note', CONTENT_MSG.note);
  if (has(input, 'priceVnd') && !(Number.isInteger(input.priceVnd) && (input.priceVnd as number) >= 0 && (input.priceVnd as number) <= 100_000_000)) errors.set('priceVnd', CONTENT_MSG.price);
  unknownKeys(input, PRODUCT_KEYS, errors);
  return Object.fromEntries(errors);
}

export function validateCaseInput(input: unknown): Record<string, string> {
  if (!isObject(input)) return { case: CONTENT_MSG.shape };
  const errors = new Map<string, string>();
  if (!text(input.title, 1, 80)) errors.set('title', CONTENT_MSG.title);
  if (!text(input.story, 1, 600)) errors.set('story', CONTENT_MSG.story);
  if (!text(input.petName, 1, 30)) errors.set('petName', CONTENT_MSG.petName);
  if (!SPECIES.includes(input.species as Species)) errors.set('species', CONTENT_MSG.species);
  if (input.consent !== true) errors.set('consent', CONTENT_MSG.consent);
  unknownKeys(input, CASE_KEYS, errors);
  return Object.fromEntries(errors);
}

/** Lower-case text without accents, for comparing names. */
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

/** A phone number (nine digits or more, ignoring spaces, dots, dashes and brackets) and the customer full names found in a text. */
export function sensitiveHits(text: string, customerNames: readonly string[]): { phone: boolean; names: string[] } {
  const phone = /\+?\d{9,}/.test(text.replace(/[\s.\-()]/g, ''));
  const hay = fold(text);
  const names = customerNames.filter((n) => n.trim().length >= 5 && hay.includes(fold(n.trim())));
  return { phone, names };
}

export function imageFileProblem(file: { type: string; size: number }): string | null {
  if (!file.type.startsWith('image/')) return CONTENT_MSG.notImage;
  if (file.size > FEATURED_IMAGE_MAX_BYTES) return CONTENT_MSG.tooBig;
  return null;
}
