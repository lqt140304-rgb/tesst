import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { m, useReducedMotion } from 'motion/react';
import { AppLink } from '@/app/nav';
import { paths } from '@/app/routes';
import { system } from '@/data/public';
import { staff } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { PAYMENT_METHOD_LABEL, PRICE_CATEGORY_LABEL, type PaymentMethod, type PriceCategory } from '@/data/contracts/enums';
import { previousPeriod, validateRange } from '@/data/rules/calendar';
import { daysBetween, formatDateVi, formatShortDateVi, todayVN } from '@/lib/dates';
import { formatVnd } from '@/lib/money';
import { Button, CountUp, Icon } from '@/ui';
import { LoadingBlocks, PageHeader, PageProblem, Panel } from '../ui';
import { PeriodPicker } from './PeriodPicker';
import { periodRange, readRange, writeRange, type Period } from './revenueView';
import s from '../Staff.module.css';
import r from './Revenue.module.css';

const METHOD_ICON = { cash: 'banknote', transfer: 'landmark', qr: 'qr-code' } as const;

/** Doanh thu (staff §6.9), manager only: cash collected by period; outstanding is not period-bound. No CSV in P0. */
export function RevenuePage() {
  const today = todayVN(system.now());
  const [params, setParams] = useSearchParams();
  const cur = readRange(params.toString(), today);
  // "Chọn ngày" stays selected for the address it was chosen on; any other address (back button, a pasted link) shows what the address says.
  const search = params.toString();
  const [customAt, setCustomAt] = useState<string | null>(cur.period === 'custom' ? search : null);
  const custom = cur.period === 'custom' || customAt === search;
  const [draft, setDraft] = useState({ from: cur.from, to: cur.to });
  const [errors, setErrors] = useState<{ from?: string; to?: string }>({});
  const [asTable, setAsTable] = useState(false);
  const prev = previousPeriod(cur.from, cur.to);
  const q = useQuery(() => staff.reports.revenue({ from: cur.from, to: cur.to }), [cur.from, cur.to]);
  const before = useQuery(() => staff.reports.revenue(prev), [prev.from, prev.to]);
  const open = useQuery(async () => [...await staff.invoices.list({ state: 'unpaid' }), ...await staff.invoices.list({ state: 'partial' })]
    .sort((a, b) => (a.issued_at ?? '').localeCompare(b.issued_at ?? '')), []);
  const reduce = useReducedMotion();
  const shown: Period = custom ? 'custom' : cur.period;

  function pick(p: Period) {
    setErrors({});
    if (p === 'custom') { setCustomAt(search); setDraft({ from: cur.from, to: cur.to }); return; }
    setCustomAt(null);
    const r = periodRange(p, today);
    setParams(new URLSearchParams(writeRange(r.from, r.to)));
  }
  /** The revenue API does not check the range, so it is checked here with the shared calendar rules; a bad range never reaches it. */
  function apply() {
    const e = validateRange(draft);
    if (e.from || e.to) { setErrors(e); return; }
    setErrors({});
    const next = new URLSearchParams(writeRange(draft.from, draft.to));
    setCustomAt(next.toString());
    setParams(next);
  }

  const d = q.data;
  const delta = d && before.data && before.data.collected > 0 ? Math.round(((d.collected - before.data.collected) / before.data.collected) * 100) : null;
  const maxDay = Math.max(1, ...(d?.daily.map((x) => x.amount) ?? []));
  const cats = d ? (Object.keys(PRICE_CATEGORY_LABEL) as PriceCategory[]).map((c) => [c, d.byCategory[c]] as const) : [];
  const maxCat = Math.max(1, ...cats.map(([, v]) => v));

  return (
    <>
      <PageHeader title="Doanh thu" sub={`${formatDateVi(`${cur.from}T12:00:00+07:00`)} – ${formatDateVi(`${cur.to}T12:00:00+07:00`)} · tính theo tiền đã thu`} />
      <PeriodPicker value={shown} onPick={pick} from={draft.from} to={draft.to} onFrom={(v) => setDraft((x) => ({ ...x, from: v }))} onTo={(v) => setDraft((x) => ({ ...x, to: v }))} onApply={apply} errors={errors} />
      <details className={r.how}>
        <summary>Cách tính</summary>
        <p>Tiền đã thu là tiền khách đã trả trong kỳ. Theo nhóm dịch vụ tính trên hóa đơn phát hành trong kỳ, sau giảm giá, nên hai con số có thể khác nhau. Còn phải thu là mọi hóa đơn đang nợ, không theo kỳ.</p>
      </details>
      {q.error && !d ? <PageProblem error={q.error} onRetry={q.refetch} /> : !d ? <LoadingBlocks rows={4} /> : (<>
      <div className={s.tiles}>
        <div className={s.tile} data-kpi="collected">
          <span className={s.tileLabel}><span className={s.tileIcon} style={{ background: 'var(--badge-mint)' }}><Icon name="banknote" size={16} /></span>Tiền đã thu</span>
          <span className={s.tileNum}><CountUp value={d.collected} format={formatVnd} /></span>
          <span className={s.tileSub}>{delta === null ? 'Kỳ trước chưa có số liệu' : `${delta >= 0 ? '↑' : '↓'} ${Math.abs(delta)}% so với kỳ trước`}</span>
        </div>
        <div className={s.tile} data-kpi="issued">
          <span className={s.tileLabel}><span className={s.tileIcon} style={{ background: 'var(--badge-lilac)' }}><Icon name="receipt" size={16} /></span>Hóa đơn phát hành</span>
          <span className={s.tileNum}><CountUp value={d.invoicesIssued} /><small>hóa đơn</small></span>
          <span className={s.tileSub}>Trong kỳ đã chọn</span>
        </div>
        <div className={s.tile} data-kpi="outstanding">
          <span className={s.tileLabel}><span className={s.tileIcon} style={{ background: 'var(--badge-peach)' }}><Icon name="clock" size={16} /></span>Còn phải thu</span>
          <span className={s.tileNum}>{formatVnd(d.outstanding)}</span>
          <span className={s.tileSub}>{d.outstandingCount} hóa đơn đang mở (không theo kỳ)</span>
        </div>
      </div>

      {d.collected === 0 && d.invoicesIssued === 0 && <p className={s.empty} data-empty>Chưa có khoản thu nào trong kỳ này.</p>}
      <div className={s.cols}>
        <div className={s.stack}>
          <Panel title="Tiền thu theo ngày" icon="chart-column" action={<Button size="sm" variant="ghost" icon={asTable ? 'chart-column' : 'list'} onClick={() => setAsTable((x) => !x)}>{asTable ? 'Xem biểu đồ' : 'Xem dạng bảng'}</Button>}>
            {asTable ? (
              <div className={s.tableWrap} tabIndex={0} role="region" aria-label="Bảng tiền thu theo ngày">
                <table className={s.table}>
                  <thead><tr><th>Ngày</th><th>Tiền đã thu</th></tr></thead>
                  <tbody>{d.daily.map((x) => <tr key={x.date}><td>{formatDateVi(`${x.date}T12:00:00+07:00`)}</td><td className={s.num}>{formatVnd(x.amount)}</td></tr>)}</tbody>
                </table>
              </div>
            ) : (
              <figure className={r.chart} aria-label="Biểu đồ tiền thu theo ngày">
                <div className={r.bars} style={{ gridTemplateColumns: `repeat(${d.daily.length}, minmax(0, 1fr))` }}>
                  {d.daily.map((x, i) => (
                    <div key={x.date} className={r.barCol} title={`${formatShortDateVi(`${x.date}T12:00:00+07:00`)}: ${formatVnd(x.amount)}`}>
                      <m.span className={r.bar} style={{ height: `${(x.amount / maxDay) * 100}%` }}
                        initial={reduce ? false : { scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.5, delay: Math.min(i * 0.02, 0.4), ease: [0.2, 0.7, 0.2, 1] }} />
                      {d.daily.length <= 10 && <span className={r.barLabel}>{formatShortDateVi(`${x.date}T12:00:00+07:00`)}</span>}
                    </div>
                  ))}
                </div>
                <figcaption className={s.meta}>Cao nhất {formatVnd(maxDay)} / ngày · rê chuột lên cột để xem số tiền, hoặc chọn “Xem dạng bảng”.</figcaption>
              </figure>
            )}
          </Panel>
          <Panel title="Theo phương thức" icon="banknote">
            <ul className={s.rows}>
              {(Object.keys(PAYMENT_METHOD_LABEL) as PaymentMethod[]).map((k) => (
                <li key={k} className={s.row}>
                  <Icon name={METHOD_ICON[k]} size={18} />
                  <span className={s.rowMain}><span className={s.rowTitle}>{PAYMENT_METHOD_LABEL[k]}</span></span>
                  <span className={s.num}>{formatVnd(d.byMethod[k])}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
        <div className={s.stack}>
          <Panel title="Theo nhóm dịch vụ" icon="tags">
            <p className={s.meta}>(theo hóa đơn phát hành trong kỳ)</p>
            <ul className={r.hbars}>
              {cats.map(([c, v]) => (
                <li key={c}>
                  <span className={r.hLabel}>{PRICE_CATEGORY_LABEL[c]}</span>
                  <span className={r.hTrack}><span className={r.hFill} style={{ width: `${(v / maxCat) * 100}%` }} /></span>
                  <span className={s.num}>{formatVnd(v)}</span>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Hóa đơn còn nợ" icon="clock">
            {(open.data ?? []).length === 0 ? <p className={s.empty}>Không có hóa đơn còn nợ.</p> : (
              <ul className={s.rows}>
                {(open.data ?? []).map((i) => {
                  const age = i.issued_at ? daysBetween(i.issued_at, system.now()) : 0;
                  return (
                    <li key={i.id} className={s.row}>
                      <div className={s.rowMain}>
                        <span className={s.rowTitle}>{i.code} · {i.customerName}</span>
                        <span className={s.meta}>{age > 10 ? `Quá ${age} ngày` : `${age} ngày`} · còn <span className={s.owe}>{formatVnd(i.remaining)}</span></span>
                      </div>
                      <AppLink to={paths.nv.invoice(i.id)} className={s.linkBtn}>Mở</AppLink>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
      </div>
      </>)}
      <p className={s.meta} style={{ marginTop: 16 }}>Số liệu được tính từ dữ liệu mẫu.</p>
    </>
  );
}
