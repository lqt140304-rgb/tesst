import { useState } from 'react';
import type { StaffPriceItem } from '@/data/staff';
import { PRICE_CATEGORY_LABEL, type PriceCategory } from '@/data/contracts/enums';
import { formatVnd } from '@/lib/money';
import { Button, ChipGroup, Dialog, Icon } from '@/ui';
import s from '../Staff.module.css';
import iv from './Invoices.module.css';

const fold = (x: string) => x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');

/** "Thêm dịch vụ": search the price list (active items only) and add several without closing; lines can only come from here. */
export function AddServiceDialog({ open, onClose, prices, onAdd }: { open: boolean; onClose: () => void; prices: StaffPriceItem[]; onAdd: (item: StaffPriceItem) => void }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<PriceCategory | 'all'>('all');
  const results = prices.filter((p) => p.active && (cat === 'all' || p.category === cat) && (!q.trim() || fold(`${p.code} ${p.name}`).includes(fold(q.trim())))).slice(0, 10);
  return (
    <Dialog open={open} onClose={onClose} wide title="Thêm dịch vụ" intro="Chọn từ bảng giá. Bạn có thể thêm nhiều mục rồi bấm Xong."
      footer={<Button onClick={onClose}>Xong</Button>}>
      <div className={s.form}>
        <label className={s.search} style={{ maxWidth: 'none' }}>
          <Icon name="search" size={18} />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm trong bảng giá…" aria-label="Tìm trong bảng giá" />
        </label>
        <ChipGroup<PriceCategory | 'all'> label="Nhóm" value={cat} onChange={setCat}
          options={[{ value: 'all', label: 'Tất cả' }, ...(Object.keys(PRICE_CATEGORY_LABEL) as PriceCategory[]).map((c) => ({ value: c, label: PRICE_CATEGORY_LABEL[c] }))]} />
        <ul className={iv.results}>
          {results.map((p) => (
            <li key={p.id}>
              <button type="button" className={iv.result} onClick={() => onAdd(p)} aria-label={`Thêm ${p.name}`}>
                <span className={s.code}>{p.code}</span>
                <span className={iv.resultName}>{p.name}<span className={s.meta}> · {p.unit}</span></span>
                <span className="num">{p.price_mode === 'open' ? 'Nhập giá' : formatVnd(p.price)}</span>
                <Icon name="plus" size={16} />
              </button>
            </li>
          ))}
          {results.length === 0 && <li className={s.empty}>Không có mục phù hợp.</li>}
        </ul>
      </div>
    </Dialog>
  );
}
