import { useState } from 'react';
import { staff } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { PRICE_CATEGORY_LABEL, type PriceCategory } from '@/data/contracts/enums';
import { formatVnd } from '@/lib/money';
import { Banner, Icon } from '@/ui';
import { cx } from '@/lib/cx';
import { LoadingBlocks, MiniTag, PageHeader, PageProblem } from '../ui';
import s from '../Staff.module.css';

const fold = (x: string) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').toLowerCase();
const TONE: Record<PriceCategory, string> = { exam: s.svc_kham!, spa: s.svc_spa!, inpatient: s.svc_noi_tru!, medicine: '', supply: '' };

/** Bảng giá (staff §6.8): read-only in P0 for everyone; editing is P1 (R13). */
export function PricesPage() {
  const q = useQuery(() => staff.prices.list(), []);
  const [needle, setNeedle] = useState('');
  if (q.error) return <PageProblem error={q.error} onRetry={q.refetch} />;
  if (!q.data) return <LoadingBlocks />;
  const items = q.data.filter((p) => !needle.trim() || fold(`${p.code} ${p.name}`).includes(fold(needle.trim())));
  const cats = (Object.keys(PRICE_CATEGORY_LABEL) as PriceCategory[]).filter((c) => items.some((p) => p.category === c));
  return (
    <>
      <PageHeader title="Bảng giá" sub="Đơn giá dùng khi lập hóa đơn. Giá trên hóa đơn cũ được giữ nguyên." />
      <div className={s.stack}>
        <Banner tone="warm" icon="info">Giá trong bản demo là giá minh họa, chưa phải giá thật của bệnh viện.</Banner>
        <label className={s.search}>
          <Icon name="search" size={18} />
          <input type="search" value={needle} onChange={(e) => setNeedle(e.target.value)} placeholder="Mã hoặc tên dịch vụ" aria-label="Tìm trong bảng giá" />
        </label>
        {cats.map((c) => (
          <section key={c} className={s.stack} style={{ gap: 8 }}>
            <h2 className={s.h2}><span className={cx(s.svc, TONE[c])}>{PRICE_CATEGORY_LABEL[c]}</span></h2>
            <div className={s.tableWrap} tabIndex={0} role="region" aria-label={`Bảng giá ${PRICE_CATEGORY_LABEL[c]}`}>
              <table className={s.table}>
                <thead><tr><th>Mã</th><th>Tên</th><th>Đơn vị</th><th>Giá</th><th>Cách tính giá</th><th>Trạng thái</th></tr></thead>
                <tbody>
                  {items.filter((p) => p.category === c).map((p) => (
                    <tr key={p.id}>
                      <td className={s.code}>{p.code}</td>
                      <td>{p.name}{p.customer_group === 'treatment' && <span className={s.meta}> · khách thấy trong “Thuốc và vật tư điều trị”</span>}</td>
                      <td>{p.unit}</td>
                      <td className={s.num}>{p.price_mode === 'open' ? '—' : formatVnd(p.price)}</td>
                      <td>{p.price_mode === 'open' ? 'Nhập khi lập hóa đơn' : 'Giá cố định'}</td>
                      <td>{p.active ? <MiniTag tone="teal" icon="circle-check">Đang dùng</MiniTag> : <MiniTag>Ngừng dùng</MiniTag>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
