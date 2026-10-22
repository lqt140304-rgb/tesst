import type { StockSummary } from '@/data/staff';
import { CountUp, Icon, type IconName } from '@/ui';
import { cx } from '@/lib/cx';
import s from '../Staff.module.css';
import { TILE_KEYS, TILE_NAME, tileCount, tileLabel, tilePressed, type StockFilters, type TileKey } from './stockView';
import st from './Stock.module.css';

const ICON: Record<TileKey, IconName> = { low: 'triangle-alert', out: 'circle-x', soon: 'hourglass', expired: 'clock' };
const WARM: Record<TileKey, string> = { low: st.tileLow!, out: st.tileBad!, soon: st.tileLow!, expired: st.tileBad! };
const HINT: Record<TileKey, string> = {
  low: 'Còn ít, cần nhập thêm', out: 'Không còn món nào', soon: 'Dùng trước kẻo hết hạn', expired: 'Không nên dùng nữa',
};

/** Four numbers that are also buttons: press one to list only those items, press it again to see everything. */
export function StockSummaryTiles({ summary, filters, onPick }: { summary: StockSummary; filters: StockFilters; onPick: (key: TileKey) => void }) {
  return (
    <div className={s.tiles}>
      {TILE_KEYS.map((key) => {
        const n = tileCount(summary, key);
        return (
          <button key={key} type="button" className={cx(s.tile, st.tileBtn)} aria-pressed={tilePressed(filters, key)} aria-label={tileLabel(summary, key)}
            data-kpi={`stock-${key}`} onClick={() => onPick(key)}>
            <span className={s.tileLabel} aria-hidden="true"><Icon name={ICON[key]} size={18} />{TILE_NAME[key]}</span>
            <span className={cx(s.tileNum, n === 0 ? st.tileZero : WARM[key])} aria-hidden="true"><CountUp value={n} /><small>món</small></span>
            <span className={st.tileHint} aria-hidden="true">{HINT[key]}</span>
          </button>
        );
      })}
    </div>
  );
}
