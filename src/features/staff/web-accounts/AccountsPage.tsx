import { useState } from 'react';
import { staff } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { formatDateVi } from '@/lib/dates';
import { formatPhoneVi } from '@/lib/phone';
import { Button, ChipGroup, EmptyState } from '@/ui';
import { cx } from '@/lib/cx';
import { LoadingBlocks, MiniTag, PageHeader, PageProblem } from '../ui';
import { LinkDialog } from './LinkDialog';
import s from '../Staff.module.css';

type Filter = 'all' | 'unlinked';

/** Tài khoản web (staff §4.4, R1): linking only by the code the customer shows at the counter. */
export function AccountsPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const [linking, setLinking] = useState(false);
  const list = useQuery(() => staff.accounts.list(filter === 'unlinked' ? { linked: false } : undefined), [filter]);

  return (
    <>
      <PageHeader title="Tài khoản web" sub="Tài khoản khách tự đăng ký. Liên kết với hồ sơ tại quầy, bằng mã kết nối khách đưa cho bạn."
        actions={<Button icon="link-2" onClick={() => setLinking(true)}>Liên kết bằng mã…</Button>} />
      <div className={s.toolbar}>
        <ChipGroup<Filter> label="Lọc tài khoản" value={filter} onChange={setFilter} options={[{ value: 'all', label: 'Tất cả' }, { value: 'unlinked', label: 'Chưa liên kết' }]} />
      </div>
      {list.error ? <PageProblem error={list.error} onRetry={list.refetch} /> : !list.data ? <LoadingBlocks /> : list.data.length === 0 ? (
        <EmptyState icon="link-2" title="Không có tài khoản nào ở mục này." />
      ) : (
        <>
          <div className={cx(s.tableWrap, s.hideOnPhone)}>
            <table className={s.table}>
              <thead><tr><th>Tên đăng nhập</th><th>Tên khách</th><th>Số điện thoại tài khoản</th><th>Ngày đăng ký</th><th>Trạng thái</th></tr></thead>
              <tbody>
                {list.data.map((a) => (
                  <tr key={a.id}>
                    <td className={s.code}>{a.username}</td>
                    <td>{a.display_name}</td>
                    <td className={s.num}>{formatPhoneVi(a.phone)}</td>
                    <td className={s.num}>{formatDateVi(a.created_at)}</td>
                    <td>{a.linked ? <MiniTag icon="link-2" tone="teal">Đã liên kết với {a.customerCode}</MiniTag> : <MiniTag icon="unlink">Chưa liên kết</MiniTag>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className={s.cards}>
            {list.data.map((a) => (
              <li key={a.id} className={s.mCard}>
                <span className={s.mCardTop}><strong className={s.rowTitle}>{a.display_name}</strong><span className={s.code}>{a.username}</span></span>
                <span className={s.meta}>{formatPhoneVi(a.phone)} · đăng ký {formatDateVi(a.created_at)}</span>
                <span>{a.linked ? <MiniTag icon="link-2" tone="teal">Đã liên kết với {a.customerCode}</MiniTag> : <MiniTag icon="unlink">Chưa liên kết</MiniTag>}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      <LinkDialog key={String(linking)} open={linking} onClose={() => setLinking(false)} />
    </>
  );
}
