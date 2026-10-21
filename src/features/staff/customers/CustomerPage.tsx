import { useState } from 'react';
import { useParams } from 'react-router';
import { AnimatePresence, m } from 'motion/react';
import { AppLink } from '@/app/nav';
import { paths } from '@/app/routes';
import { useSession } from '@/app/session/SessionProvider';
import { staff, type StaffCustomerDetail } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { SEX_LABEL, SPECIES_LABEL, type Species } from '@/data/contracts/enums';
import { ValidationError } from '@/data/contracts/errors';
import { formatDateVi, formatTimeVi } from '@/lib/dates';
import { formatVnd } from '@/lib/money';
import { Button, ButtonLink, Dialog, EmptyState, Field, Icon, IconBadge, Input, Select, StatusPill, Tabs, statusPill, useToast } from '@/ui';
import { dur, ease } from '@/ui/motion';
import { FormError, LoadingBlocks, MiniTag, PageHeader, PageProblem, SPECIES_ICON, ServiceChip, Tel, dayLabel, saveError } from '../ui';
import s from '../Staff.module.css';

type Tab = 'pets' | 'appointments' | 'invoices' | 'stays' | 'account';
const ALERTS = ['Dễ hoảng sợ', 'Có thể cắn — cần rọ mõm', 'Dị ứng thuốc', 'Bệnh mãn tính'];

/** Customer record (staff §4.3). */
export function CustomerPage() {
  const { id = '' } = useParams();
  const { can } = useSession();
  const q = useQuery(() => staff.customers.get(id), [id]);
  const [tab, setTab] = useState<Tab>('pets');
  const [addPet, setAddPet] = useState(false);
  if (q.error) return <PageProblem error={q.error} onRetry={q.refetch} />;
  if (!q.data) return <LoadingBlocks />;
  const c = q.data;
  const owed = c.invoices.reduce((n, i) => n + i.remaining, 0);

  return (
    <>
      <PageHeader title={c.full_name} parent={{ label: 'Khách hàng', to: paths.nv.customers }}
        sub={<span className={s.recordHead}><span className={s.code}>{c.code}</span><Tel e164={c.phone} />{c.linkedAccount ? <MiniTag icon="link-2" tone="teal">Đã liên kết tài khoản web</MiniTag> : null}{owed > 0 && <MiniTag tone="orange">Còn nợ {formatVnd(owed)}</MiniTag>}</span>}
        actions={<>
          {can('customers.edit') && <Button variant="secondary" icon="plus" onClick={() => setAddPet(true)}>Thêm thú cưng</Button>}
          {can('invoices.create') && <ButtonLink to={`${paths.nv.invoiceNew}?khach=${c.id}`} icon="receipt">Tạo hóa đơn</ButtonLink>}
        </>} />

      <div className={s.stack}>
        {(c.address || c.note_internal) && (
          <div className={s.internal}>
            <p className={s.meta}><Icon name="lock" size={12} /> Nội bộ · khách không thấy</p>
            <dl className={s.kv}>
              {c.address && <><dt>Địa chỉ</dt><dd>{c.address}</dd></>}
              {c.note_internal && <><dt>Ghi chú</dt><dd>{c.note_internal}</dd></>}
              <dt>Tạo hồ sơ</dt><dd>{formatDateVi(c.created_at)}</dd>
            </dl>
          </div>
        )}
        <Tabs<Tab> label="Thông tin hồ sơ" variant="underline" value={tab} onChange={setTab} items={[
          { value: 'pets', label: 'Thú cưng', count: c.pets.length }, { value: 'appointments', label: 'Lịch hẹn', count: c.appointments.length },
          { value: 'invoices', label: 'Hóa đơn', count: c.invoices.length }, { value: 'stays', label: 'Nội trú', count: c.stays.length },
          { value: 'account', label: 'Tài khoản web' },
        ]} />
        <AnimatePresence mode="wait" initial={false}>
          <m.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: dur.m, ease: ease.out }}>
            <TabBody c={c} tab={tab} />
          </m.div>
        </AnimatePresence>
      </div>
      {can('customers.edit') && <PetDialog key={String(addPet)} customerId={c.id} open={addPet} onClose={() => setAddPet(false)} />}
    </>
  );
}

function TabBody({ c, tab }: { c: StaffCustomerDetail; tab: Tab }) {
  const { can } = useSession();
  if (tab === 'pets') {
    if (c.pets.length === 0) return <EmptyState icon="paw-line" title="Hồ sơ chưa có thú cưng." />;
    return (
      <ul className={s.petGrid}>
        {c.pets.map((p) => (
          <li key={p.id} className={s.petCard}>
            <span className={s.petTop}>
              <IconBadge icon={SPECIES_ICON[p.species]} tone={p.species === 'cat' ? 'lilac' : 'peach'} size={40} />
              <span><span className={s.petName}>{p.name}</span><br /><span className={s.meta}>{p.code}</span></span>
            </span>
            <p className={s.small}>{[SPECIES_LABEL[p.species], p.breed, p.sex && SEX_LABEL[p.sex], p.birth_year && `sinh khoảng ${p.birth_year}`, p.neutered === true ? 'đã triệt sản' : undefined].filter(Boolean).join(' · ')}</p>
            {p.alerts.length > 0 && <span className={s.chipsWrap}>{p.alerts.map((a) => <span key={a} className={s.alert}><Icon name="triangle-alert" size={13} />{a}</span>)}</span>}
            {p.note_internal && <p className={s.meta}><Icon name="lock" size={12} /> {p.note_internal}</p>}
          </li>
        ))}
      </ul>
    );
  }
  if (tab === 'appointments') {
    if (c.appointments.length === 0) return <EmptyState icon="calendar-days" title="Chưa có lịch hẹn." />;
    return (
      <ul className={s.rows}>
        {c.appointments.map((a) => (
          <li key={a.id} className={s.row}>
            <span className={s.rowTime}>{formatTimeVi(a.start_at)}</span>
            <div className={s.rowMain}>
              <span className={s.rowTitle}>{dayLabel(a.start_at)} · {a.petName}</span>
              <span className={s.meta}>{a.assigneeName ?? 'Chưa phân công'}{a.requestCode ? ` · ${a.requestCode}` : ''}</span>
            </div>
            <ServiceChip service={a.service} short />
            <StatusPill pill={statusPill('appointment', a.status)} dense />
            {can('appointments.view') && <AppLink to={`${paths.nv.calendar}?view=ngay&date=${a.start_at.slice(0, 10)}&lich=${a.id}`} className={s.linkBtn}>Mở</AppLink>}
          </li>
        ))}
      </ul>
    );
  }
  if (tab === 'invoices') {
    if (c.invoices.length === 0) return <EmptyState icon="receipt" title="Chưa có hóa đơn." />;
    return (
      <ul className={s.rows}>
        {c.invoices.map((i) => (
          <li key={i.id} className={s.row}>
            <div className={s.rowMain}>
              <span className={s.rowTitle}>{i.code}</span>
              <span className={s.meta}>{i.issued_at ? `Phát hành ${formatDateVi(i.issued_at)}` : 'Chưa phát hành'}{i.remaining > 0 ? ` · còn ${formatVnd(i.remaining)}` : ''}</span>
            </div>
            <span className={s.num}>{formatVnd(i.total)}</span>
            <StatusPill pill={i.status === 'issued' && i.state ? statusPill('payment', i.state) : statusPill('invoice', i.status === 'voided' ? 'voided' : 'draft')} dense />
            {can(['invoices.create', 'payments.record']) && <AppLink to={paths.nv.invoice(i.id)} className={s.linkBtn}>Mở</AppLink>}
          </li>
        ))}
      </ul>
    );
  }
  if (tab === 'stays') {
    if (c.stays.length === 0) return <EmptyState icon="house-paw" title="Chưa có lần nội trú nào." />;
    return (
      <ul className={s.rows}>
        {c.stays.map((x) => (
          <li key={x.id} className={s.row}>
            <div className={s.rowMain}>
              <span className={s.rowTitle}>{x.petName} · {x.code}</span>
              <span className={s.meta}>{formatDateVi(x.admitted_at)} – {x.discharged_at ? formatDateVi(x.discharged_at) : 'đang nội trú'}</span>
            </div>
            {can('inpatient.view') && <AppLink to={paths.nv.stay(x.id)} className={s.linkBtn}>Mở</AppLink>}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <div className={s.panel}>
      {c.linkedAccount ? (
        <>
          <p><StatusPill pill={statusPill('link', 'linked')} dense /></p>
          <dl className={s.kv}>
            <dt>Tên đăng nhập</dt><dd>{c.linkedAccount.username}</dd>
            <dt>Liên kết từ</dt><dd>{formatDateVi(c.linkedAccount.linked_at)}</dd>
          </dl>
          <p className={s.small}>Khách xem được hóa đơn, nhật ký nội trú và video của các bé trong hồ sơ này.</p>
        </>
      ) : (
        <>
          <p><StatusPill pill={statusPill('link', 'unlinked')} dense /></p>
          <p className={s.small}>Khi khách đến quầy, nhờ khách mở trang Tài khoản trên điện thoại và đọc <strong>mã kết nối hồ sơ</strong> để liên kết.</p>
          {can('accounts.link') && <div><ButtonLink to={paths.nv.accounts} variant="secondary" icon="link-2">Liên kết bằng mã…</ButtonLink></div>}
        </>
      )}
    </div>
  );
}

function PetDialog({ customerId, open, onClose }: { customerId: string; open: boolean; onClose: () => void }) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<Species>('dog');
  const [breed, setBreed] = useState('');
  const [sex, setSex] = useState<'' | 'male' | 'female'>('');
  const [year, setYear] = useState('');
  const [alerts, setAlerts] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    setErrors({});
    try {
      await staff.customers.createPet(customerId, { name, species, breed: breed || undefined, sex: sex || undefined, birth_year: year ? Number(year) : undefined, alerts });
      toast({ message: `Đã thêm bé ${name.trim()}.` });
      onClose();
    } catch (e) {
      setErrors(e instanceof ValidationError ? e.fields : { form: saveError(e) });
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog open={open} onClose={onClose} title="Thêm thú cưng"
      footer={<><Button variant="ghost" onClick={onClose}>Để sau</Button><Button icon="check" loading={busy} onClick={() => void save()}>Lưu thú cưng</Button></>}>
      <div className={s.form}>
        <FormError>{errors.form}</FormError>
        <div className={s.two}>
          <Field label="Tên" error={errors.name}><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Loài"><Select value={species} onChange={(e) => setSpecies(e.target.value as Species)}>{(Object.keys(SPECIES_LABEL) as Species[]).map((sp) => <option key={sp} value={sp}>{SPECIES_LABEL[sp]}</option>)}</Select></Field>
        </div>
        <div className={s.two}>
          <Field label="Giống" optional><Input value={breed} onChange={(e) => setBreed(e.target.value)} /></Field>
          <Field label="Giới tính" optional><Select value={sex} onChange={(e) => setSex(e.target.value as '' | 'male' | 'female')}><option value="">Chưa rõ</option><option value="male">Đực</option><option value="female">Cái</option></Select></Field>
        </div>
        <Field label="Năm sinh (ước tính)" optional><Input inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))} /></Field>
        <fieldset className={s.radioList}>
          <legend>Lưu ý quan trọng (nội bộ)</legend>
          <div className={s.chipsWrap}>
            {ALERTS.map((a) => (
              <label key={a} className={s.radio}>
                <input type="checkbox" checked={alerts.includes(a)} onChange={(e) => setAlerts((xs) => (e.target.checked ? [...xs, a] : xs.filter((x) => x !== a)))} />
                <span>{a}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </Dialog>
  );
}
