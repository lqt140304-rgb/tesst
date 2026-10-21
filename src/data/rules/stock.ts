import { STOCK_ISSUE_REASONS, STOCK_KINDS, type ExpiryState, type StockLevel } from '../contracts/enums';
import type { StockAdjustInput, StockInput, StockIssueInput, StockReceiveInput } from '../contracts/staff';
import { addDays } from '../../lib/dates';

/** The "sắp hết hạn" window; phase 5 turns it into a system setting. */
export const STOCK_EXPIRY_SOON_DAYS = 30;
export const STOCK_MAX_QTY = 1_000_000;

export const STOCK_MSG = {
  name: 'Vui lòng nhập tên món.',
  nameLong: 'Tên món tối đa 80 ký tự.',
  duplicate: 'Món này đã có trong kho.',
  unit: 'Vui lòng nhập đơn vị, ví dụ: viên, ống, hộp.',
  unitLong: 'Đơn vị tối đa 20 ký tự.',
  kind: 'Vui lòng chọn loại: Thuốc hoặc Vật tư.',
  kindLocked: 'Không đổi được loại của món này.',
  qty: 'Số tồn cần là số nguyên từ 0 đến 1.000.000.',
  qtyLocked: 'Số tồn đổi bằng Nhập thêm, Xuất kho hoặc Kiểm kê.',
  minQty: 'Ngưỡng sắp hết cần là số nguyên từ 0 đến 1.000.000.',
  expires: 'Hạn dùng cần đúng dạng năm-tháng-ngày, ví dụ 2027-03-31.',
  moveQty: 'Số lượng cần là số nguyên từ 1 đến 1.000.000.',
  tooMany: 'Số tồn sau khi nhập vượt 1.000.000.',
  issueReason: 'Vui lòng chọn lý do xuất kho.',
  supplierLong: 'Tên nhà cung cấp tối đa 80 ký tự.',
  noteLong: 'Ghi chú tối đa 200 ký tự.',
  counted: 'Số đếm cần là số nguyên từ 0 đến 1.000.000.',
  countedSame: 'Số đếm trùng số tồn, chưa có gì để điều chỉnh.',
  inactive: 'Món đã ngừng dùng. Bật lại trước khi nhập hoặc xuất.',
  over: (qty: number, unit: string) => `Kho chỉ còn ${qty} ${unit}.`,
} as const;

type Errors = Record<string, string>;

/** Whole number in [min, STOCK_MAX_QTY]; NaN, Infinity and strings fail. */
const whole = (n: unknown, min: number): n is number => typeof n === 'number' && Number.isInteger(n) && n >= min && n <= STOCK_MAX_QTY;

export function stockLevel(i: { qty: number; min_qty: number }): StockLevel {
  if (i.qty === 0) return 'out';
  return i.min_qty > 0 && i.qty <= i.min_qty ? 'low' : 'ok';
}

/** "YYYY-MM-DD" that is a real calendar day. */
export function isRealDate(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = new Date(Date.UTC(y, mo - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d;
}

/** Past the date = expired; today through today + soonDays = soon. Dates are Vietnam days, compared as text. */
export function expiryState(expiresOn: string | undefined, today: string, soonDays: number): ExpiryState {
  if (!expiresOn) return 'none';
  if (expiresOn < today) return 'expired';
  return expiresOn <= addDays(today, soonDays) ? 'soon' : 'none';
}

/** The item keeps its nearest expiry: a new batch only replaces an expiry that is missing or already past, or one that is later. */
export function mergeExpiry(old: string | undefined, incoming: string | undefined, today: string): string | undefined {
  if (!incoming) return old;
  if (!old || old < today) return incoming;
  return old <= incoming ? old : incoming;
}

/** A cleared date box sends "": that means no expiry, not a mistake. */
const validExpiry = (d: string | undefined) => d === undefined || d === '' || isRealDate(d);

export const normalizeExpiry = (d: string | undefined) => d || undefined;

function checkText(e: Errors, key: string, value: string | undefined, max: number, msg: string) {
  if (value !== undefined && value.length > max) e[key] = msg;
}

export function validateStockInput(input: StockInput, mode: 'create' | 'update'): Errors {
  const e: Errors = {};
  const name = input.name?.trim() ?? '';
  const unit = input.unit?.trim() ?? '';
  if (!name) e.name = STOCK_MSG.name;
  else if (name.length > 80) e.name = STOCK_MSG.nameLong;
  if (!unit) e.unit = STOCK_MSG.unit;
  else if (unit.length > 20) e.unit = STOCK_MSG.unitLong;
  if (!(STOCK_KINDS as readonly string[]).includes(input.kind)) e.kind = STOCK_MSG.kind;
  if (mode === 'update') {
    if (input.qty !== undefined) e.qty = STOCK_MSG.qtyLocked;
  } else if (input.qty !== undefined && !whole(input.qty, 0)) e.qty = STOCK_MSG.qty;
  if (!whole(input.min_qty, 0)) e.min_qty = STOCK_MSG.minQty;
  if (!validExpiry(input.expires_on)) e.expires_on = STOCK_MSG.expires;
  return e;
}

export function validateReceive(input: StockReceiveInput, onHand: { qty: number }): Errors {
  const e: Errors = {};
  if (!whole(input.qty, 1)) e.qty = STOCK_MSG.moveQty;
  else if (onHand.qty + input.qty > STOCK_MAX_QTY) e.qty = STOCK_MSG.tooMany;
  checkText(e, 'supplier', input.supplier, 80, STOCK_MSG.supplierLong);
  checkText(e, 'note', input.note, 200, STOCK_MSG.noteLong);
  if (!validExpiry(input.expires_on)) e.expires_on = STOCK_MSG.expires;
  return e;
}

export function validateIssue(input: StockIssueInput, onHand: { qty: number; unit: string }): Errors {
  const e: Errors = {};
  if (!whole(input.qty, 1)) e.qty = STOCK_MSG.moveQty;
  else if (input.qty > onHand.qty) e.qty = STOCK_MSG.over(onHand.qty, onHand.unit);
  if (!(STOCK_ISSUE_REASONS as readonly string[]).includes(input.reason)) e.reason = STOCK_MSG.issueReason;
  checkText(e, 'note', input.note, 200, STOCK_MSG.noteLong);
  return e;
}

export function validateAdjust(input: StockAdjustInput, onHand: { qty: number }): Errors {
  const e: Errors = {};
  if (!whole(input.counted_qty, 0)) e.counted_qty = STOCK_MSG.counted;
  else if (input.counted_qty === onHand.qty) e.counted_qty = STOCK_MSG.countedSame;
  checkText(e, 'note', input.note, 200, STOCK_MSG.noteLong);
  return e;
}
