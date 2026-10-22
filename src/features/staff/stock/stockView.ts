import type { ExpiryState, StockKind, StockLevel, StockStatusFilter } from '@/data/contracts/enums';
import type { Cap } from '@/data/rules/capabilities';
import type { StockListFilter, StockMoveRow, StockRow, StockSummary } from '@/data/staff';
import { daysBetween, formatDateVi } from '@/lib/dates';

export type StockFilters = { q: string; kind: StockKind | 'all'; status: StockStatusFilter; showInactive: boolean };
export const DEFAULT_FILTERS: StockFilters = { q: '', kind: 'all', status: 'all', showInactive: false };

// Address words are Vietnamese without accents so a link reads well when pasted.
const KIND_PARAM: Record<StockKind, string> = { thuoc: 'thuoc', vat_tu: 'vat-tu' };
const STATUS_PARAM: Record<Exclude<StockStatusFilter, 'all'>, string> = { low: 'sap-het', out: 'het', expiring: 'han' };

/** Unknown or broken values fall back to the defaults: a pasted address never breaks the page. */
export function readFilters(p: URLSearchParams): StockFilters {
  const loai = p.get('loai');
  const tt = p.get('tt');
  const kind = (Object.keys(KIND_PARAM) as StockKind[]).find((k) => KIND_PARAM[k] === loai);
  const status = (Object.keys(STATUS_PARAM) as Exclude<StockStatusFilter, 'all'>[]).find((s) => STATUS_PARAM[s] === tt);
  return { q: p.get('q') ?? '', kind: kind ?? 'all', status: status ?? 'all', showInactive: p.get('ngung') === '1' };
}

export function writeFilters(f: StockFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.q.trim()) p.set('q', f.q);
  if (f.kind !== 'all') p.set('loai', KIND_PARAM[f.kind]);
  if (f.status !== 'all') p.set('tt', STATUS_PARAM[f.status]);
  if (f.showInactive) p.set('ngung', '1');
  return p;
}

export function toListFilter(f: StockFilters): StockListFilter {
  const out: StockListFilter = {};
  const q = f.q.trim();
  if (q) out.q = q;
  if (f.kind !== 'all') out.kind = f.kind;
  if (f.status !== 'all') out.status = f.status;
  if (f.showInactive) out.includeInactive = true;
  return out;
}

export type TileKey = 'low' | 'out' | 'soon' | 'expired';
export const TILE_KEYS: TileKey[] = ['low', 'out', 'soon', 'expired'];
export const TILE_NAME: Record<TileKey, string> = { low: 'Sắp hết', out: 'Hết hàng', soon: 'Sắp hết hạn', expired: 'Đã hết hạn' };
/** The API has one expiry filter for both "soon" and "expired", so both tiles turn it on. */
export const TILE_STATUS: Record<TileKey, StockStatusFilter> = { low: 'low', out: 'out', soon: 'expiring', expired: 'expiring' };

export const tilePressed = (f: StockFilters, key: TileKey) => f.status === TILE_STATUS[key];

export function tileCount(sum: StockSummary, key: TileKey): number {
  return key === 'low' ? sum.low : key === 'out' ? sum.out : key === 'soon' ? sum.expiringSoon : sum.expired;
}

export const tileLabel = (sum: StockSummary, key: TileKey) => `${TILE_NAME[key]}: ${tileCount(sum, key)} món`;

export const levelLabel = (l: StockLevel) => (l === 'ok' ? 'Ổn' : l === 'low' ? 'Sắp hết' : 'Hết hàng');
export const levelTone = (l: StockLevel): 'teal' | 'orange' | 'rose' => (l === 'ok' ? 'teal' : l === 'low' ? 'orange' : 'rose');
export const expiryLabel = (e: ExpiryState): string | undefined => (e === 'soon' ? 'Sắp hết hạn' : e === 'expired' ? 'Đã hết hạn' : undefined);

/** Quantities are whole numbers up to 1.000.000: group the thousands with dots. */
export const qtyText = (n: number, unit: string) => `${n.toLocaleString('vi-VN')} ${unit}`;

/** One or two plain sentences at the top of an item: what is wrong and by how much. `undefined` when nothing is. */
export function statusSentence(item: StockRow, today: string): string | undefined {
  const parts: string[] = [];
  if (item.level === 'out') parts.push('Đã hết hàng.');
  else if (item.level === 'low') {
    const rel = item.qty < item.minQty ? 'thấp hơn' : 'bằng';
    parts.push(`Còn ${qtyText(item.qty, item.unit)}, ${rel} mức báo hết ${item.minQty.toLocaleString('vi-VN')}.`);
  }
  if (item.expiresOn && item.expiry === 'expired') parts.push(`Hết hạn từ ${formatDateVi(item.expiresOn)}.`);
  else if (item.expiresOn && item.expiry === 'soon') {
    const days = daysBetween(today, item.expiresOn);
    parts.push(days <= 0 ? 'Hết hạn hôm nay.' : `Còn ${days} ngày nữa hết hạn.`);
  }
  return parts.length ? parts.join(' ') : undefined;
}

const MINUS = '−';

export function moveDelta(m: StockMoveRow): { text: string; tone: 'in' | 'out' } {
  return m.delta > 0 ? { text: `+${m.delta.toLocaleString('vi-VN')}`, tone: 'in' } : { text: `${MINUS}${Math.abs(m.delta).toLocaleString('vi-VN')}`, tone: 'out' };
}

export function receivePreview(onHand: number, qty: number | undefined, unit: string): string | undefined {
  return qty !== undefined && qty >= 1 ? `Tồn sau khi nhập: ${qtyText(onHand + qty, unit)}` : undefined;
}

export function issuePreview(onHand: number, qty: number | undefined, unit: string): string | undefined {
  return qty !== undefined && qty >= 1 && qty <= onHand ? `Tồn sau khi xuất: ${qtyText(onHand - qty, unit)}` : undefined;
}

export function adjustDiff(onHand: number, counted: number | undefined, unit: string): { text: string; tone: 'same' | 'up' | 'down' } | undefined {
  if (counted === undefined) return undefined;
  const d = counted - onHand;
  if (d === 0) return { text: 'Khớp sổ.', tone: 'same' };
  return { text: `Lệch ${d > 0 ? '+' : MINUS}${qtyText(Math.abs(d), unit)} so với sổ.`, tone: d > 0 ? 'up' : 'down' };
}

export type StockCaps = { view: boolean; receive: boolean; issue: boolean; adjust: boolean; items: boolean };

/** Each way of writing the stock is its own right, and every one of them needs to see the stock too. */
export function stockCaps(can: (c: Cap | Cap[]) => boolean): StockCaps {
  const view = can('stock.view');
  return { view, receive: view && can('stock.receive'), issue: view && can('stock.issue'), adjust: view && can('stock.adjust'), items: view && can('stock.items') };
}
