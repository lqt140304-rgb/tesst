import { useState } from 'react';
import { staff, type StaffStayView } from '@/data/staff';
import { formatTimeVi } from '@/lib/dates';
import { Button, ChipGroup, Dialog, Field, Icon, Input, Select, Textarea, useToast, type IconName } from '@/ui';
import { cx } from '@/lib/cx';
import { FormError, saveError, whenShort } from '../ui';
import s from './Inpatient.module.css';
import st from '../Staff.module.css';

type Internal = NonNullable<StaffStayView['internal']>;
type NoteType = Internal['notes'][number]['type'];
const KIND: Record<Internal['orders'][number]['kind'], [string, IconName]> = { drug: ['Thuốc', 'pet-bowl'], fluid: ['Dịch truyền', 'iv-bag'], care: ['Chăm sóc', 'heart'] };
const NOTE: Record<NoteType, string> = { observation: 'Theo dõi', feeding: 'Ăn uống', hygiene: 'Vệ sinh', note: 'Ghi chú' };

/**
 * "Hồ sơ nội bộ" (staff §5.2.1), presented as a care log (R13): today's times show what was done and by whom,
 * with "Ghi đã thực hiện" — no overdue alarms.
 */
export function InternalTab({ v }: { v: StaffStayView }) {
  const x = v.internal!;
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const active = x.orders.filter((o) => o.status === 'active');
  const stopped = x.orders.filter((o) => o.status === 'stopped');

  async function record(o: Internal['orders'][number]) {
    setBusy(o.id);
    try {
      const slot = o.todaySlots.find((t) => !t.done)?.time;
      await staff.inpatient.administrations.record(v.id, { order_id: o.id, slot_time: slot });
      toast({ message: `Đã ghi nhận ${o.item_name}${slot ? ` (giờ ${slot})` : ''}.` });
    } catch (e) {
      toast({ tone: 'error', message: saveError(e) });
    } finally {
      setBusy(null);
    }
  }
  async function stop(o: Internal['orders'][number]) {
    try {
      await staff.inpatient.orders.stop(o.id);
      toast({ message: `Đã ngừng y lệnh ${o.item_name}.` });
    } catch (e) {
      toast({ tone: 'error', message: saveError(e) });
    }
  }

  return (
    <div className={s.internal}>
      <p className={s.internalBanner}><span className={s.lockChip}><Icon name="lock" size={13} /> Nội bộ · khách không thấy</span>Thông tin nội bộ — không bao giờ hiển thị cho khách hàng.</p>
      <div className={s.reason}><span className={st.meta}>Lý do nhập viện</span><p>{x.reason}</p></div>

      <section className={s.block}>
        <div className={st.panelHead}>
          <h2 className={st.h2}><Icon name="clipboard-list" size={18} />Y lệnh đang thực hiện</h2>
          {!v.discharged_at && <Button variant="secondary" size="sm" icon="plus" onClick={() => setAdding(true)}>Thêm y lệnh</Button>}
        </div>
        {active.length === 0 ? <p className={st.empty}>Chưa có y lệnh đang thực hiện.</p> : (
          <ul className={s.orders}>
            {active.map((o) => (
              <li key={o.id} className={s.order}>
                <span className={s.orderIcon} aria-hidden="true"><Icon name={KIND[o.kind][1]} size={18} /></span>
                <div className={s.orderMain}>
                  <p className={s.orderName}>{o.item_name}</p>
                  <p className={st.meta}>{KIND[o.kind][0]}{o.dose ? ` · ${o.dose}` : ''}{o.route ? ` · ${o.route}` : ''}{o.orderedByName ? ` · ${o.orderedByName}` : ''}</p>
                  <span className={s.slots} aria-label="Giờ thực hiện hôm nay">
                    {o.todaySlots.map((t) => (
                      <span key={t.time} className={cx(s.slot, t.done && s.slotDone)}>{t.done && <Icon name="check" size={12} />}{t.time}</span>
                    ))}
                  </span>
                </div>
                {!v.discharged_at && (
                  <div className={s.orderActions}>
                    <Button size="sm" variant="secondary" icon="check" loading={busy === o.id} onClick={() => void record(o)}>Ghi đã thực hiện</Button>
                    <Button size="sm" variant="ghost" onClick={() => void stop(o)}>Ngừng</Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {stopped.length > 0 && <p className={st.meta}>Đã ngừng: {stopped.map((o) => o.item_name).join(', ')}</p>}
      </section>

      <section className={s.block}>
        <h2 className={st.h2}><Icon name="activity" size={18} />Đã thực hiện gần đây</h2>
        {x.administrations.length === 0 ? <p className={st.empty}>Chưa có ghi nhận.</p> : (
          <ul className={st.rows}>
            {x.administrations.slice(0, 8).map((a) => (
              <li key={a.id} className={st.row}>
                <span className={st.rowTime}>{formatTimeVi(a.performed_at)}</span>
                <div className={st.rowMain}>
                  <span className={st.rowTitle}>{a.item_name}{a.dose ? ` · ${a.dose}` : ''}</span>
                  <span className={st.meta}>{a.performedByName ?? 'Nhân viên'} · {whenShort(a.performed_at)}{a.slot_time ? ` · giờ ${a.slot_time}` : ''}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={s.block}>
        <h2 className={st.h2}><Icon name="notebook-pen" size={18} />Ghi chú chăm sóc</h2>
        {!v.discharged_at && <NoteComposer stayId={v.id} />}
        <ul className={st.rows}>
          {x.notes.map((n) => (
            <li key={n.id} className={st.row}>
              <div className={st.rowMain}>
                <span className={s.noteText}><strong>{NOTE[n.type]}</strong> · {n.text}{n.temp_c ? ` · ${n.temp_c}°C` : ''}{n.weight_kg ? ` · ${n.weight_kg} kg` : ''}</span>
                <span className={st.meta}>{n.authorName ?? 'Nhân viên'} · {whenShort(n.at)}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <OrderDialog stayId={v.id} key={String(adding)} open={adding} onClose={() => setAdding(false)} />
    </div>
  );
}

function NoteComposer({ stayId }: { stayId: string }) {
  const toast = useToast();
  const [type, setType] = useState<NoteType>('observation');
  const [text, setText] = useState('');
  const [temp, setTemp] = useState('');
  const [weight, setWeight] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const num = (x: string) => (x.trim() ? Number(x.replace(',', '.')) : undefined);
  async function save() {
    setBusy(true);
    setErr('');
    try {
      await staff.inpatient.careNotes.create(stayId, { type, text, temp_c: type === 'observation' ? num(temp) : undefined, weight_kg: type === 'observation' ? num(weight) : undefined });
      toast({ message: 'Đã lưu ghi chú chăm sóc.' });
      setText(''); setTemp(''); setWeight('');
    } catch (e) {
      setErr(saveError(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={s.noteComposer}>
      <ChipGroup<NoteType> label="Loại ghi chú" value={type} onChange={setType} options={(Object.keys(NOTE) as NoteType[]).map((k) => ({ value: k, label: NOTE[k] }))} />
      {type === 'observation' && (
        <div className={st.two}>
          <Field label="Nhiệt độ (°C)" optional><Input inputMode="decimal" value={temp} onChange={(e) => setTemp(e.target.value)} /></Field>
          <Field label="Cân nặng (kg)" optional><Input inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} /></Field>
        </div>
      )}
      <Field label="Ghi chú"><Textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} /></Field>
      <FormError>{err}</FormError>
      <div><Button variant="secondary" icon="check" loading={busy} onClick={() => void save()}>Lưu ghi chú</Button></div>
    </div>
  );
}

function OrderDialog({ stayId, open, onClose }: { stayId: string; open: boolean; onClose: () => void }) {
  const toast = useToast();
  const [kind, setKind] = useState<'drug' | 'fluid' | 'care'>('drug');
  const [item, setItem] = useState('');
  const [dose, setDose] = useState('');
  const [route, setRoute] = useState('');
  const [times, setTimes] = useState('08:00, 20:00');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  async function save() {
    const list = times.split(/[,\s]+/).filter((t) => /^\d{1,2}:\d{2}$/.test(t)).map((t) => t.padStart(5, '0'));
    setBusy(true);
    setErr('');
    try {
      await staff.inpatient.orders.create(stayId, { kind, item_name: item, dose, route, schedule_times: list });
      toast({ message: `Đã thêm y lệnh ${item.trim()}.` });
      onClose();
    } catch (e) {
      setErr(saveError(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog open={open} onClose={onClose} title="Thêm y lệnh" intro="Y lệnh là thông tin nội bộ, khách không thấy."
      footer={<><Button variant="ghost" onClick={onClose}>Để sau</Button><Button icon="check" loading={busy} onClick={() => void save()}>Lưu y lệnh</Button></>}>
      <div className={st.form}>
        <FormError>{err}</FormError>
        <Field label="Loại"><Select value={kind} onChange={(e) => setKind(e.target.value as 'drug' | 'fluid' | 'care')}>{(Object.keys(KIND) as (keyof typeof KIND)[]).map((k) => <option key={k} value={k}>{KIND[k][0]}</option>)}</Select></Field>
        <Field label="Thuốc / chỉ định"><Input value={item} onChange={(e) => setItem(e.target.value)} /></Field>
        <div className={st.two}>
          <Field label="Liều" optional><Input value={dose} onChange={(e) => setDose(e.target.value)} /></Field>
          <Field label="Đường dùng" optional><Input value={route} onChange={(e) => setRoute(e.target.value)} /></Field>
        </div>
        <Field label="Giờ thực hiện" hint="Cách nhau bằng dấu phẩy, ví dụ 08:00, 14:00, 20:00."><Input value={times} onChange={(e) => setTimes(e.target.value)} /></Field>
      </div>
    </Dialog>
  );
}
