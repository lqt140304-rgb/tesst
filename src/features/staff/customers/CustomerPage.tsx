import { useState } from 'react';
import { useParams } from 'react-router';
import { AnimatePresence, m } from 'motion/react';
import { AppLink } from '@/app/nav';
import { paths } from '@/app/routes';
import { useSession } from '@/app/session/SessionProvider';
import { staff, type StaffCustomerDetail, type StaffPet } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { formatDateVi, formatTimeVi } from '@/lib/dates';
import { formatVnd } from '@/lib/money';
import { Button, ButtonLink, EmptyState, Icon, StatusPill, Tabs, statusPill } from '@/ui';
import { dur, ease } from '@/ui/motion';
import { LoadingBlocks, MiniTag, PageHeader, PageProblem, ServiceChip, Tel, dayLabel } from '../ui';
import s from '../Staff.module.css';
import cs from './Customers.module.css';
import { cx } from '@/lib/cx';
import { CustomerForm } from './CustomerForm';
import { PetCard } from './PetCard';
import { PetForm } from './PetForm';

type Tab = 'pets' | 'appointments' | 'invoices' | 'stays' | 'account';

/** Customer record (staff §4.3). */
export function CustomerPage() {
  const { id = '' } = useParams();
  const { can } = useSession();
  const q = useQuery(() => staff.customers.get(id), [id]);
  const [tab, setTab] = useState<Tab>('pets');
  const [editing, setEditing] = useState(false);
  const [addPet, setAddPet] = useState(false);
  const [editPet, setEditPet] = useState<StaffPet | null>(null);
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

      <div className={cs.record}>
        <aside className={cs.info} data-customer-info aria-label="Thông tin khách hàng">
          <div className={cs.infoHead}>
            <h2 className={cs.infoTitle}>Thông tin khách hàng</h2>
            {can('customers.edit') && <Button variant="secondary" icon="pencil" onClick={() => setEditing(true)}>Chỉnh sửa</Button>}
          </div>
          <p className={cs.infoName}>{c.full_name} <span className={s.code}>{c.code}</span></p>
          <dl className={s.kv}>
            <dt>Số điện thoại</dt><dd><Tel e164={c.phone} /></dd>
            <dt>Địa chỉ</dt><dd>{c.address ?? '—'}</dd>
            <dt>Tạo hồ sơ</dt><dd className="num">{formatDateVi(c.created_at)}</dd>
            <dt>Tài khoản web</dt><dd>{c.linkedAccount ? 'Đã liên kết' : 'Chưa liên kết'}</dd>
            {owed > 0 && <><dt>Còn nợ</dt><dd className="num">{formatVnd(owed)}</dd></>}
          </dl>
          <div className={s.internal}>
            <p className={s.meta}><Icon name="lock" size={12} /> Ghi chú nội bộ · khách không thấy</p>
            <p className={cs.infoNote}>{c.note_internal ?? 'Chưa có ghi chú.'}</p>
          </div>
        </aside>
        <div className={cx(s.stack, cs.recordMain)}>
          <Tabs<Tab> label="Thông tin hồ sơ" variant="underline" value={tab} onChange={setTab} items={[
            { value: 'pets', label: 'Thú cưng', count: c.pets.length }, { value: 'appointments', label: 'Lịch hẹn', count: c.appointments.length },
            { value: 'invoices', label: 'Hóa đơn', count: c.invoices.length }, { value: 'stays', label: 'Nội trú', count: c.stays.length },
            { value: 'account', label: 'Tài khoản web' },
          ]} />
          <AnimatePresence mode="wait" initial={false}>
            <m.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: dur.m, ease: ease.out }}>
              <TabBody c={c} tab={tab} onEditPet={setEditPet} />
            </m.div>
          </AnimatePresence>
        </div>
      </div>
      {can('customers.edit') && <CustomerForm key={`edit-${editing}`} customer={c} open={editing} onClose={() => setEditing(false)} />}
      {can('customers.edit') && <PetForm key={`add-${addPet}`} customerId={c.id} open={addPet} onClose={() => setAddPet(false)} />}
      {can('customers.edit') && <PetForm key={editPet?.id ?? 'none'} customerId={c.id} open={!!editPet} pet={editPet ?? undefined} onClose={() => setEditPet(null)} />}
    </>
  );
}

function TabBody({ c, tab, onEditPet }: { c: StaffCustomerDetail; tab: Tab; onEditPet: (p: StaffPet) => void }) {
  const { can } = useSession();
  if (tab === 'pets') {
    if (c.pets.length === 0) return <EmptyState icon="paw-line" title="Hồ sơ chưa có thú cưng." />;
    return <ul className={cs.petGrid}>{c.pets.map((p) => <PetCard key={p.id} pet={p} canEdit={can('customers.edit')} onEdit={() => onEditPet(p)} />)}</ul>;
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
