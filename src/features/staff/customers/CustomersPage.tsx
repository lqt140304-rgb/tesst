import { useState } from 'react';
import { AppLink, useAppNavigate } from '@/app/nav';
import { paths } from '@/app/routes';
import { useSession } from '@/app/session/SessionProvider';
import { staff, type StaffCustomerRow } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { ValidationError } from '@/data/contracts/errors';
import { formatShortDateVi } from '@/lib/dates';
import { formatPhoneVi, normalizeVnPhone } from '@/lib/phone';
import { formatVnd } from '@/lib/money';
import { Button, ChipGroup, Dialog, EmptyState, Field, Icon, Input, Textarea, useToast } from '@/ui';
import { cx } from '@/lib/cx';
import { FormError, LoadingBlocks, MiniTag, PageHeader, PageProblem, saveError } from '../ui';
import s from '../Staff.module.css';

type Filter = 'all' | 'inpatient' | 'owe' | 'linked';

/** Khách hàng (staff §4.3): table on desktop, cards on phones. */
export function CustomersPage() {
  const { can } = useSession();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [adding, setAdding] = useState(false);
  const list = useQuery(() => staff.customers.list(q.trim() || undefined), [q]);
  const rows = (list.data ?? []).filter((c) => filter === 'all' || (filter === 'inpatient' ? c.inpatient : filter === 'owe' ? c.outstanding > 0 : !!c.linkedUsername));

  return (
    <>
      <PageHeader title="Khách hàng" sub="Hồ sơ khách hàng và thú cưng tại Lê Sơn."
        actions={can('customers.edit') && <Button icon="plus" onClick={() => setAdding(true)}>Thêm khách hàng</Button>} />
      <div className={s.toolbar}>
        <label className={s.search}>
          <Icon name="search" size={18} />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tên, số điện thoại, tên thú cưng" aria-label="Tìm khách hàng" />
        </label>
        <ChipGroup<Filter> label="Lọc khách hàng" value={filter} onChange={setFilter} options={[
          { value: 'all', label: 'Tất cả' }, { value: 'inpatient', label: 'Đang có bé nội trú' }, { value: 'owe', label: 'Còn nợ' }, { value: 'linked', label: 'Đã liên kết tài khoản web' },
        ]} />
      </div>
      {list.error ? <PageProblem error={list.error} onRetry={list.refetch} /> : !list.data ? <LoadingBlocks /> : rows.length === 0 ? (
        <EmptyState icon="users-round" title={q ? 'Không tìm thấy khách hàng phù hợp.' : 'Chưa có khách hàng ở mục này.'} />
      ) : (
        <>
          <div className={cx(s.tableWrap, s.hideOnPhone)}>
            <table className={s.table}>
              <thead><tr><th>Mã</th><th>Họ tên</th><th>Số điện thoại</th><th>Thú cưng</th><th>Tài khoản web</th><th>Lịch hẹn gần nhất</th><th>Còn nợ</th></tr></thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td className={s.code}>{c.code}</td>
                    <td><AppLink to={paths.nv.customer(c.id)} className={s.cellLink}>{c.full_name}</AppLink>{c.inpatient && <> <MiniTag icon="house-paw" tone="plum">Nội trú</MiniTag></>}</td>
                    <td className={s.num}>{formatPhoneVi(c.phone)}</td>
                    <td>{c.petNames.join(', ') || '—'}</td>
                    <td>{c.linkedUsername ? <MiniTag icon="link-2" tone="teal">Đã liên kết</MiniTag> : '—'}</td>
                    <td className={s.num}>{nearest(c)}</td>
                    <td>{c.outstanding > 0 ? <span className={s.owe}>{formatVnd(c.outstanding)}</span> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className={s.cards}>
            {rows.map((c) => (
              <li key={c.id}>
                <AppLink to={paths.nv.customer(c.id)} className={s.mCard}>
                  <span className={s.mCardTop}><strong className={s.rowTitle}>{c.full_name}</strong><span className={s.code}>{c.code}</span></span>
                  <span className={s.meta}>{formatPhoneVi(c.phone)} · {c.petNames.join(', ') || 'Chưa có thú cưng'}</span>
                  <span className={s.chipsWrap}>
                    {c.inpatient && <MiniTag icon="house-paw" tone="plum">Nội trú</MiniTag>}
                    {c.linkedUsername && <MiniTag icon="link-2" tone="teal">Đã liên kết</MiniTag>}
                    {c.outstanding > 0 && <MiniTag tone="orange">Còn nợ {formatVnd(c.outstanding)}</MiniTag>}
                  </span>
                </AppLink>
              </li>
            ))}
          </ul>
        </>
      )}
      {can('customers.edit') && <NewCustomerDialog key={String(adding)} open={adding} onClose={() => setAdding(false)} />}
    </>
  );
}

const nearest = (c: StaffCustomerRow) => (c.nearestAppointment ? `${formatShortDateVi(c.nearestAppointment.start_at)}${c.nearestAppointment.upcoming ? ' (sắp tới)' : ''}` : '—');

/** "Thêm khách hàng": a shared phone is a soft warning, never a block (families share numbers). */
export function NewCustomerDialog({ open, onClose, initial, onCreated }: {
  open: boolean; onClose: () => void; initial?: { full_name: string; phone: string }; onCreated?: (id: string) => void;
}) {
  const toast = useToast();
  const navigate = useAppNavigate();
  const [name, setName] = useState(initial?.full_name ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const e164 = normalizeVnPhone(phone);
  const dupes = useQuery(() => (e164 ? staff.customers.list(phone) : Promise.resolve([])), [e164]);

  async function save() {
    setBusy(true);
    setErrors({});
    try {
      const id = await staff.customers.create({ full_name: name, phone, address: address || undefined, note_internal: note || undefined });
      toast({ message: `Đã tạo hồ sơ ${name.trim()}.` });
      onClose();
      if (onCreated) onCreated(id); else navigate(paths.nv.customer(id));
    } catch (e) {
      setErrors(e instanceof ValidationError ? e.fields : { form: saveError(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Thêm khách hàng"
      footer={<><Button variant="ghost" onClick={onClose}>Để sau</Button><Button icon="check" loading={busy} onClick={() => void save()}>Lưu hồ sơ</Button></>}>
      <div className={s.form}>
        <FormError>{errors.form}</FormError>
        <Field label="Họ tên" error={errors.full_name}><Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" /></Field>
        <Field label="Số điện thoại" error={errors.phone}><Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="off" /></Field>
        {(dupes.data ?? []).length > 0 && (
          <p className={s.hint}><Icon name="info" size={16} />
            <span>Đã có hồ sơ dùng số này: {(dupes.data ?? []).map((c, i) => <span key={c.id}>{i > 0 && ', '}<AppLink to={paths.nv.customer(c.id)} onClick={onClose} className={s.cellLink}>{c.full_name} ({c.code})</AppLink></span>)}. Bạn vẫn có thể tạo hồ sơ mới.</span>
          </p>
        )}
        <Field label="Địa chỉ" optional><Input value={address} onChange={(e) => setAddress(e.target.value)} /></Field>
        <Field label="Ghi chú nội bộ" optional hint="Chỉ nhân viên thấy."><Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      </div>
    </Dialog>
  );
}
