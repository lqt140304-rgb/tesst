import { useState } from 'react';
import { paths } from '@/app/routes';
import { useSession } from '@/app/session/SessionProvider';
import { staff, type StaffInvoiceDetail, type StaffPriceItem } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { SPECIES_LABEL } from '@/data/contracts/enums';
import { invoiceTotals } from '@/data/rules/invoice-math';
import { formatVnd } from '@/lib/money';
import { useMedia } from '@/lib/useMedia';
import { Button, Dialog, Field, Icon, PetAvatar, SaveState, Textarea, useSaveStatus, useToast } from '@/ui';
import { DoseWarning, FormError, PageHeader, Panel, Tel, saveError, useDoseLint } from '../ui';
import { ConflictError } from '@/data/contracts/errors';
import s from '../Staff.module.css';
import iv from './Invoices.module.css';
import { AddServiceDialog } from './AddServiceDialog';
import { InvoiceLinesTable } from './InvoiceLinesTable';
import { InvoicePreview } from './InvoicePreview';
import { draftInput, linesOf, type Line } from './draft-lines';

let seq = 0;

/** Invoice editor (staff §6.3): lines only from the price list (open-price items take a price), the invoice as the customer will read it beside, then issue. */
export function DraftEditor({ d }: { d: StaffInvoiceDetail }) {
  const toast = useToast();
  const { can } = useSession();
  const wide = useMedia('(min-width: 1100px)');
  const prices = useQuery(() => staff.prices.list(), []);
  const record = useQuery(() => (can('customers.view') ? staff.customers.get(d.customerId) : Promise.resolve(null)), [d.customerId]);
  const [lines, setLines] = useState<Line[]>(() => linesOf(d));
  /** The version this editor last read or wrote: saves are checked against it, so another tab's save is never overwritten. */
  const [version, setVersion] = useState(d.version);
  const [note, setNote] = useState(d.note_customer ?? '');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState<'save' | 'issue' | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [picking, setPicking] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [dirty, setDirty] = useState(false);
  const saved = useSaveStatus();

  const priced = lines.map((l) => ({ unit_price: l.item.price_mode === 'open' ? l.unit_price ?? 0 : l.unit_price ?? l.item.price, qty: l.qty }));
  const totals = invoiceTotals(priced);
  const noteHits = useDoseLint(note);
  const pets = (record.data?.pets ?? []).filter((p) => d.petNames.includes(p.name));

  function change(fn: (ls: Line[]) => Line[]) { setLines(fn); setDirty(true); saved.edit(); }
  function add(p: StaffPriceItem) {
    change((ls) => {
      const same = ls.find((l) => l.item.id === p.id && p.price_mode === 'fixed');
      if (same) return ls.map((l) => (l === same ? { ...l, qty: l.qty + 1 } : l));
      return [...ls, { key: `n${++seq}`, item: p, qty: 1, unit_price: p.price_mode === 'open' ? p.reference_price : p.price }];
    });
  }

  async function save(): Promise<number> {
    const next = await saved.run(() => staff.invoices.updateDraft(d.id, version, { lines: draftInput(lines), note_customer: note }));
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
      saved.reset();
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

  const preview = <InvoicePreview d={d} lines={lines} note={note} />;
  return (
    <>
      <PageHeader title="Lập hóa đơn" parent={{ label: 'Hóa đơn', to: paths.nv.invoices }} current={d.code}
        sub={<span className={s.recordHead}><span className={s.code}>{d.code}</span><span className={s.meta}>Chỉ nhân viên thấy bản nháp</span></span>}
        actions={<SaveState status={saved.status} />} />
      <div className={iv.editor}>
        <div className={s.stack}>
          <Panel title="Thông tin khách hàng" icon="users-round">
            <div className={s.recordHead}><strong>{d.customerName}</strong><Tel e164={d.customerPhone} /></div>
            <ul className={iv.petCards}>
              {pets.length > 0 ? pets.map((p) => (
                <li key={p.id} className={iv.petCard}>
                  <PetAvatar name={p.name} species={p.species} photoKey={p.photoKey} size={40} decorative />
                  <span><strong>{p.name}</strong><span className={s.meta}> · {SPECIES_LABEL[p.species]}{p.breed ? ` ${p.breed}` : ''}</span></span>
                </li>
              )) : d.petNames.map((n) => <li key={n} className={iv.petCard}><strong>{n}</strong></li>)}
            </ul>
          </Panel>
          <Panel title="Dịch vụ" icon="receipt" action={<Button size="sm" variant="secondary" icon="plus" onClick={() => setPicking(true)}>Thêm dịch vụ</Button>}>
            <InvoiceLinesTable lines={lines} onChange={change} />
          </Panel>
          <Panel>
            <Field label="Ghi chú trên hóa đơn" optional hint="Khách sẽ thấy ghi chú này.">
              <Textarea rows={2} value={note} onChange={(e) => { setNote(e.target.value); setDirty(true); saved.edit(); }} />
            </Field>
            <DoseWarning hits={noteHits} />
          </Panel>
          <Panel>
            <dl className={iv.totals}>
              <div><dt>Tạm tính</dt><dd>{formatVnd(totals.subtotal)}</dd></div>
              <div className={iv.grand}><dt>Tổng cộng</dt><dd className={iv.bigTotal} data-total>{formatVnd(totals.total)}</dd></div>
            </dl>
            <FormError>{err}</FormError>
            <div className={s.pageActions}>
              <Button variant="secondary" icon="file-pen" loading={busy === 'save'} onClick={() => void onSave()}>Lưu nháp</Button>
              <Button icon="send" disabled={lines.length === 0} onClick={() => setConfirm(true)}>Phát hành hóa đơn</Button>
            </div>
            <p className={s.meta}>Sau khi phát hành, hóa đơn không sửa được.</p>
          </Panel>
        </div>
        {wide ? (
          <aside className={iv.previewCol}><Panel title="Xem trước hóa đơn" icon="eye">{preview}</Panel></aside>
        ) : (
          <section className={iv.fold}>
            <button type="button" className={iv.foldBtn} aria-expanded={showPreview} aria-controls="invoice-preview" onClick={() => setShowPreview((x) => !x)}>
              Xem trước hóa đơn <Icon name={showPreview ? 'chevron-up' : 'chevron-down'} size={18} />
            </button>
            {showPreview && <div id="invoice-preview">{preview}</div>}
          </section>
        )}
      </div>
      <AddServiceDialog open={picking} onClose={() => setPicking(false)} prices={prices.data ?? []} onAdd={add} />
      <Dialog open={confirm} onClose={() => setConfirm(false)} title="Phát hành hóa đơn?"
        intro="Sau khi phát hành, hóa đơn không sửa được và khách sẽ xem được trong tài khoản (nếu đã liên kết)."
        footer={<><Button variant="ghost" onClick={() => setConfirm(false)}>Xem lại</Button><Button icon="send" loading={busy === 'issue'} onClick={() => void onIssue()}>Phát hành</Button></>} />
    </>
  );
}
