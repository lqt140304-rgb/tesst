import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { paths } from '@/app/routes';
import { useSession } from '@/app/session/SessionProvider';
import { PAYMENT_METHODS, PAYMENT_METHOD_LABEL, type PaymentMethod } from '@/data/contracts/enums';
import { staff, type AppSettings, type AppSettingsValues, type FixedRule } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { formatDateVi } from '@/lib/dates';
import { Button, Checkbox, Field, Icon, Input } from '@/ui';
import { FormError, LoadingBlocks, PageHeader, PageProblem, Panel } from '../ui';
import { HolidaysEditor } from './HolidaysEditor';
import { draftOf, patchOf, type SystemDraft } from './settingsView';
import { useSave } from './useSave';
import s from './Settings.module.css';

const PENDING_NOTE = 'Các thay đổi sẽ áp dụng vào lịch, hóa đơn và yêu cầu ở bước kế tiếp.';

/** Cài đặt hệ thống: everyone sees the values; the manager (`settings.manage`) changes them in one form with one Save. */
export function SystemPage() {
  const { can } = useSession();
  const q = useQuery(() => staff.settings.get(), []);
  const head = <PageHeader title="Cài đặt hệ thống" sub="Giờ lịch, thời lượng, kho, thanh toán và ngày lễ của Lê Sơn." parent={{ label: 'Cài đặt', to: paths.nv.settings }} />;
  if (q.error && !q.data) return <>{head}<PageProblem error={q.error} onRetry={q.refetch} /></>;
  if (!q.data) return <>{head}<LoadingBlocks rows={3} /></>;
  return <>{head}<p className={s.sub}>{PENDING_NOTE}</p>{can('settings.manage') ? <SystemForm first={q.data} /> : <SystemReadOnly values={q.data.values} fixed={q.data.fixedRules} />}</>;
}

function FixedRules({ rules }: { rules: FixedRule[] }) {
  return (
    <Panel title="Quy định cố định" icon="lock">
      <dl className={s.facts}>
        {rules.map((r) => <div key={r.label} className={s.fact}><dt>{r.label}</dt><dd>{r.value}</dd></div>)}
      </dl>
      <p className={s.readonlyNote}><Icon name="info" size={16} />Những quy định này đã chốt, không sửa ở đây.</p>
    </Panel>
  );
}

function SystemForm({ first }: { first: AppSettings }) {
  // The settings the form was opened from: their version goes back with Save, so a second tab that saved first is noticed.
  const [base, setBase] = useState(first);
  const [draft, setDraft] = useState<SystemDraft>(() => draftOf(first.values));
  const reload = async () => { const fresh = await staff.settings.get(); setBase(fresh); setDraft(draftOf(fresh.values)); };
  const { errors, busy, save, clear } = useSave(() => void reload());
  const form = useRef<HTMLFormElement>(null);
  const [refused, setRefused] = useState(0);
  // A refused Save on a long page: land on the first box with a mistake, since the message may be far above the button.
  useEffect(() => { if (refused) form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(); }, [refused]);
  const patch = patchOf(base.values, draft);
  const dirty = Object.keys(patch).length > 0;

  const set = <K extends keyof SystemDraft>(key: K, value: SystemDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    clear(key, 'form', 'settings', ...(key === 'holidays' ? Object.keys(errors).filter((k) => k.startsWith('holidays.')) : []));
  };
  const text = (key: Exclude<keyof SystemDraft, 'payment_methods' | 'holidays'>, label: string, hint: string, extra?: { inputMode?: 'numeric' }) => (
    <Field label={label} hint={hint} error={errors[key]}>
      <Input value={draft[key]} autoComplete="off" inputMode={extra?.inputMode} onChange={(e) => set(key, e.target.value)} />
    </Field>
  );
  const toggleMethod = (m: PaymentMethod) => set('payment_methods', draft.payment_methods.includes(m) ? draft.payment_methods.filter((x) => x !== m) : [...draft.payment_methods, m]);
  const rowErrors = Object.fromEntries(Object.entries(errors).filter(([k]) => k.startsWith('holidays.')).map(([k, v]) => [Number(k.slice(9)), v]));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!dirty) return;
    const ok = await save(async () => { const next = await staff.settings.update(base.version, patch); setBase(next); setDraft(draftOf(next.values)); return 'Đã lưu cài đặt.'; });
    if (!ok) setRefused((n) => n + 1);
  }

  return (
    <form ref={form} className={s.systemForm} onSubmit={submit} noValidate>
      <Panel title="Giờ và lịch" icon="calendar-days">
        <div className={s.fieldGrid}>
          {text('calendar_start', 'Giờ bắt đầu lịch', 'Dạng HH:MM, ví dụ 08:00.')}
          {text('calendar_end', 'Giờ kết thúc lịch', 'Dạng HH:MM, ví dụ 21:00.')}
          {text('default_duration_kham', 'Thời lượng mặc định Khám', 'Số phút, bước 5 phút.', { inputMode: 'numeric' })}
          {text('default_duration_spa', 'Thời lượng mặc định Spa', 'Số phút, bước 5 phút.', { inputMode: 'numeric' })}
        </div>
      </Panel>
      <Panel title="Kho" icon="package">
        <div className={s.fieldGrid}>
          {text('stock_expiry_days', 'Báo sắp hết hạn trước', 'Số ngày, từ 1 đến 365.', { inputMode: 'numeric' })}
          {text('stock_default_min', 'Mức báo hết mặc định', 'Dùng khi thêm món mới; từ 0 đến 1000.', { inputMode: 'numeric' })}
        </div>
      </Panel>
      <Panel title="Thanh toán" icon="banknote">
        <fieldset className={s.pickGroup}>
          <legend className={s.pickLegend}>Cách thanh toán tại quầy</legend>
          <div className={s.pickList}>
            {PAYMENT_METHODS.map((m) => <Checkbox key={m} label={PAYMENT_METHOD_LABEL[m]} checked={draft.payment_methods.includes(m)} onChange={() => toggleMethod(m)} />)}
          </div>
          <FormError>{errors.payment_methods}</FormError>
        </fieldset>
      </Panel>
      <Panel title="Yêu cầu đặt lịch" icon="inbox">
        <div className={s.fieldGrid}>
          {text('request_overdue_hours', 'Báo yêu cầu quá hạn sau', 'Số giờ, từ 1 đến 168.', { inputMode: 'numeric' })}
        </div>
      </Panel>
      <Panel title="Ngày lễ" icon="calendar-check">
        <HolidaysEditor value={draft.holidays} onChange={(next) => set('holidays', next)} rowErrors={rowErrors} error={errors.holidays} />
      </Panel>
      <FixedRules rules={base.fixedRules} />
      <FormError>{errors.form ?? errors.settings}</FormError>
      <div className={s.saveBar}>
        <Button type="submit" icon="check" disabled={!dirty} loading={busy} loadingText="Đang lưu…">Lưu cài đặt</Button>
        {!dirty && <span className={s.sub}>Chưa có thay đổi nào.</span>}
        {Object.keys(errors).length > 0 && <span className={s.saveFail} role="alert">Chưa lưu. Kiểm tra các ô báo lỗi phía trên.</span>}
      </div>
    </form>
  );
}

const methodsText = (list: PaymentMethod[]) => list.map((m) => PAYMENT_METHOD_LABEL[m]).join(', ');

function SystemReadOnly({ values: v, fixed }: { values: AppSettingsValues; fixed: FixedRule[] }) {
  const row = (label: string, value: ReactNode) => <div className={s.fact}><dt>{label}</dt><dd>{value}</dd></div>;
  return (
    <div className={s.systemForm}>
      <Panel title="Giờ và lịch" icon="calendar-days">
        <dl className={s.facts}>
          {row('Giờ lịch', <span className="num">{v.calendar_start} đến {v.calendar_end}</span>)}
          {row('Thời lượng mặc định Khám', <span className="num">{v.default_duration_kham} phút</span>)}
          {row('Thời lượng mặc định Spa', <span className="num">{v.default_duration_spa} phút</span>)}
        </dl>
      </Panel>
      <Panel title="Kho" icon="package">
        <dl className={s.facts}>
          {row('Báo sắp hết hạn trước', <span className="num">{v.stock_expiry_days} ngày</span>)}
          {row('Mức báo hết mặc định', <span className="num">{v.stock_default_min}</span>)}
        </dl>
      </Panel>
      <Panel title="Thanh toán" icon="banknote">
        <dl className={s.facts}>{row('Cách thanh toán tại quầy', methodsText(v.payment_methods))}</dl>
      </Panel>
      <Panel title="Yêu cầu đặt lịch" icon="inbox">
        <dl className={s.facts}>{row('Báo yêu cầu quá hạn sau', <span className="num">{v.request_overdue_hours} giờ</span>)}</dl>
      </Panel>
      <Panel title="Ngày lễ" icon="calendar-check">
        {v.holidays.length === 0 ? <p className={s.sub}>Chưa có ngày lễ nào.</p> : (
          <ul className={s.holidayList}>
            {v.holidays.map((h) => (
              <li key={h.date} className={s.holiday}><span className={`${s.holidayDate} num`}>{formatDateVi(`${h.date}T12:00:00+07:00`)}</span><span className={s.holidayNote}>{h.note}</span></li>
            ))}
          </ul>
        )}
      </Panel>
      <FixedRules rules={fixed} />
      <p className={s.readonlyNote}><Icon name="info" size={16} />Chỉ người có quyền Quản lý cài đặt hệ thống mới sửa được.</p>
    </div>
  );
}
