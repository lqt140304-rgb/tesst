import { useState } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { paths } from '@/app/routes';
import { staff, type StaffInvoiceDetail, type StaffPriceItem } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { PRICE_CATEGORY_LABEL, type PriceCategory } from '@/data/contracts/enums';
import { invoiceTotals } from '@/data/rules/invoice-math';
import { formatVnd } from '@/lib/money';
import { Button, ButtonLink, ChipGroup, Dialog, Field, Icon, Input, Textarea, useToast } from '@/ui';
import { DoseWarning, FormError, PageHeader, Panel, Tel, saveError, useDoseLint } from '../ui';
import { ConflictError } from '@/data/contracts/errors';
import s from '../Staff.module.css';
import iv from './Invoices.module.css';

type Line = { key: string; item: Pick<StaffPriceItem, 'id' | 'name' | 'unit' | 'price' | 'price_mode'>; qty: number; unit_price?: number };
const fold = (x: string) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').toLowerCase();
let seq = 0;
const linesOf = (x: StaffInvoiceDetail): Line[] => x.lines.map((l) => ({
  key: l.id, qty: l.qty, unit_price: l.unit_price, item: { id: l.price_item_id, name: l.name, unit: l.unit, price: l.unit_price, price_mode: 'fixed' },
}));

/** Invoice editor (staff §6.3): lines only from the price list (open-price items take a price), then issue. */
export function DraftEditor({ d }: { d: StaffInvoiceDetail }) {
  const toast = useToast();
  const prices = useQuery(() => staff.prices.list(), []);
  const [lines, setLines] = useState<Line[]>(() => linesOf(d));
  /** The version this editor last read or wrote: saves are checked against it, so another tab's save is never overwritten. */
  const [version, setVersion] = useState(d.version);
  const [note, setNote] = useState(d.note_customer ?? '');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<PriceCategory | 'all'>('all');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState<'save' | 'issue' | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [dirty, setDirty] = useState(false);

  const results = (prices.data ?? []).filter((p) => p.active && (cat === 'all' || p.category === cat) && (!q.trim() || fold(`${p.code} ${p.name}`).includes(fold(q.trim())))).slice(0, 8);
  const priced = lines.map((l) => ({ unit_price: l.item.price_mode === 'open' ? l.unit_price ?? 0 : l.unit_price ?? l.item.price, qty: l.qty }));
  const totals = invoiceTotals(priced);
  const noteHits = useDoseLint(note);

  function change(fn: (ls: Line[]) => Line[]) { setLines(fn); setDirty(true); }
  function add(p: StaffPriceItem) {
    change((ls) => {
      const same = ls.find((l) => l.item.id === p.id && p.price_mode === 'fixed');
      if (same) return ls.map((l) => (l === same ? { ...l, qty: l.qty + 1 } : l));
      return [...ls, { key: `n${++seq}`, item: p, qty: 1, unit_price: p.price_mode === 'open' ? undefined : p.price }];
    });
  }

  async function save(): Promise<number> {
    const next = await staff.invoices.updateDraft(d.id, version, {
      lines: lines.map((l) => ({ price_item_id: l.item.id, qty: l.qty, unit_price: l.unit_price })),
      note_customer: note,
    });
    setVersion(next);
    setDirty(false);
    return next;
  }
  /** On a conflict, show the other tab's saved draft instead of keeping edits that would overwrite it. */
  function fail(e: unknown) {
    if (e instanceof ConflictError) {
      setLines(linesOf(d));
      setNote(d.note_customer ?? '');
      setVersion(d.version);
      setDirty(false);
    }
    setErr(saveError(e));
  }
  async function onSave() {
    setBusy('save');
    setErr('');
    try { await save(); toast({ message: 'Đã lưu hóa đơn nháp.' }); } catch (e) { fail(e); } finally { setBusy(null); }
  }
  async function onIssue() {
    setBusy('issue');
    setErr('');
    try {
      await staff.invoices.issue(d.id, dirty ? await save() : version);
      toast({ message: `Đã phát hành hóa đơn ${d.code}.` });
      setConfirm(false);
    } catch (e) {
      fail(e);
      setConfirm(false);
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <PageHeader title={`Hóa đơn nháp ${d.code}`}
        eyebrow={<ButtonLink to={paths.nv.invoices} variant="ghost" size="sm" icon="arrow-left">Hóa đơn</ButtonLink>}
        sub={<span className={s.recordHead}><strong>{d.customerName}</strong><Tel e164={d.customerPhone} /><span>{d.petNames.join(', ')}</span><span className={s.meta}>Chỉ nhân viên thấy bản nháp</span></span>} />
      <div className={iv.editor}>
        <div className={s.stack}>
          <Panel title="Dịch vụ & hàng hóa" icon="tags">
            <label className={s.search} style={{ maxWidth: 'none' }}>
              <Icon name="search" size={18} />
              <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm trong bảng giá…" aria-label="Tìm trong bảng giá" />
            </label>
            <ChipGroup<PriceCategory | 'all'> label="Nhóm" value={cat} onChange={setCat}
              options={[{ value: 'all', label: 'Tất cả' }, ...(Object.keys(PRICE_CATEGORY_LABEL) as PriceCategory[]).map((c) => ({ value: c, label: PRICE_CATEGORY_LABEL[c] }))]} />
            <ul className={iv.results}>
              {results.map((p) => (
                <li key={p.id}>
                  <button type="button" className={iv.result} onClick={() => add(p)} aria-label={`Thêm ${p.name}`}>
                    <span className={s.code}>{p.code}</span>
                    <span className={iv.resultName}>{p.name}<span className={s.meta}> · {p.unit}</span></span>
                    <span className={s.num}>{p.price_mode === 'open' ? 'Nhập giá' : formatVnd(p.price)}</span>
                    <Icon name="plus" size={16} />
                  </button>
                </li>
              ))}
              {prices.data && results.length === 0 && <li className={s.empty}>Không có mục phù hợp.</li>}
            </ul>
          </Panel>
          <Panel title="Các dòng trên hóa đơn" icon="receipt">
            {lines.length === 0 ? <p className={s.empty}>Chưa có dòng nào. Thêm từ bảng giá ở trên.</p> : (
              <ul className={iv.lines}>
                <AnimatePresence initial={false}>
                  {lines.map((l) => {
                    const unit = l.item.price_mode === 'open' ? l.unit_price ?? 0 : l.unit_price ?? l.item.price;
                    return (
                      <m.li key={l.key} className={iv.line} data-line layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 12 }}>
                        <span className={iv.lineName}>{l.item.name}<span className={s.meta}> · {l.item.unit}</span></span>
                        {l.item.price_mode === 'open'
                          ? <Input aria-label={`Đơn giá ${l.item.name}`} inputMode="numeric" className={iv.price} value={l.unit_price ?? ''} placeholder="Đơn giá"
                              onChange={(e) => { const n = Number(e.target.value.replace(/\D/g, '')); change((ls) => ls.map((x) => (x === l ? { ...x, unit_price: e.target.value ? n : undefined } : x))); }} />
                          : <span className={s.num}>{formatVnd(unit)}</span>}
                        <span className={iv.stepper}>
                          <button type="button" aria-label={`Giảm số lượng ${l.item.name}`} onClick={() => change((ls) => ls.map((x) => (x === l ? { ...x, qty: Math.max(1, x.qty - 1) } : x)))}>−</button>
                          <span aria-live="polite">{l.qty}</span>
                          <button type="button" aria-label={`Tăng số lượng ${l.item.name}`} onClick={() => change((ls) => ls.map((x) => (x === l ? { ...x, qty: x.qty + 1 } : x)))}>+</button>
                        </span>
                        <span className={iv.lineTotal}>{formatVnd(unit * l.qty)}</span>
                        <button type="button" className={iv.remove} aria-label={`Bỏ ${l.item.name}`} onClick={() => change((ls) => ls.filter((x) => x !== l))}><Icon name="x" size={16} /></button>
                      </m.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            )}
            <Field label="Ghi chú trên hóa đơn" optional hint="Khách sẽ thấy ghi chú này.">
              <Textarea rows={2} value={note} onChange={(e) => { setNote(e.target.value); setDirty(true); }} />
            </Field>
            <DoseWarning hits={noteHits} />
          </Panel>
        </div>
        <aside className={iv.summaryCard}>
          <dl className={iv.totals}>
            <div><dt>Tạm tính</dt><dd>{formatVnd(totals.subtotal)}</dd></div>
            <div className={iv.grand}><dt>Tổng cộng</dt><dd className={iv.bigTotal} data-total>{formatVnd(totals.total)}</dd></div>
          </dl>
          <FormError>{err}</FormError>
          <Button variant="secondary" icon="file-pen" full loading={busy === 'save'} onClick={() => void onSave()}>Lưu nháp</Button>
          <Button icon="send" full disabled={lines.length === 0} onClick={() => setConfirm(true)}>Phát hành hóa đơn</Button>
          <p className={s.meta}>Sau khi phát hành, hóa đơn không sửa được.</p>
        </aside>
      </div>
      <Dialog open={confirm} onClose={() => setConfirm(false)} title="Phát hành hóa đơn?"
        intro="Sau khi phát hành, hóa đơn không sửa được và khách sẽ xem được trong tài khoản (nếu đã liên kết)."
        footer={<><Button variant="ghost" onClick={() => setConfirm(false)}>Xem lại</Button><Button icon="send" loading={busy === 'issue'} onClick={() => void onIssue()}>Phát hành</Button></>} />
    </>
  );
}
