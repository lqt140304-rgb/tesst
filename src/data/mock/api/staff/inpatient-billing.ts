/** The stay's day charge on its invoice (§3.2, §3.5, §3.8). */
import { DAY_ITEM_CODES } from '../../../rules/stay-billing';
import type { Doc, PriceItem } from '../../store/schema';

/** LT01–LT03, in code order. */
export function dayItems(doc: Readonly<Doc>): PriceItem[] {
  return DAY_ITEM_CODES.map((code) => doc.t.price_items.find((p) => p.code === code && p.active)).filter((p): p is PriceItem => !!p);
}
