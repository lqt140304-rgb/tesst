import type { StockRow } from '@/data/staff';
import { MiniTag } from '../ui';
import { expiryLabel, levelLabel, levelTone } from './stockView';
import st from './Stock.module.css';

const LEVEL_ICON = { ok: 'circle-check', low: 'triangle-alert', out: 'circle-x' } as const;

/** Stock level, then the expiry, then "Ngừng dùng": always words, never colour alone. */
export function StockLevelTag({ item }: { item: StockRow }) {
  const expiry = expiryLabel(item.expiry);
  return (
    <span className={st.tags}>
      <MiniTag tone={levelTone(item.level)} icon={LEVEL_ICON[item.level]}>{levelLabel(item.level)}</MiniTag>
      {expiry && <MiniTag tone={item.expiry === 'expired' ? 'rose' : 'orange'} icon={item.expiry === 'expired' ? 'clock' : 'hourglass'}>{expiry}</MiniTag>}
      {!item.active && <MiniTag>Ngừng dùng</MiniTag>}
    </span>
  );
}
