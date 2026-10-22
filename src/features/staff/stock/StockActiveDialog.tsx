import { useState } from 'react';
import { staff, type StockRow } from '@/data/staff';
import { Button, Dialog } from '@/ui';
import { FormError } from '../ui';
import { toStockInput, valuesOf } from './stockForm';
import { useStockSave } from './useStockSave';

/** Switching an item off (never a delete): it leaves the default list and cannot move, but its history and quantity stay. */
export function StockActiveDialog({ open, onClose, item }: { open: boolean; onClose: () => void; item: StockRow }) {
  const [version] = useState(item.version);
  const { errors, busy, save } = useStockSave(onClose);

  const submit = () => save({}, async () => {
    await staff.stock.update(item.id, version, toStockInput(valuesOf(item), 'update', false));
    return `Đã ngừng dùng ${item.name}.`;
  });

  return (
    <Dialog open={open} onClose={onClose} title="Ngừng dùng món này?"
      footer={<><Button variant="ghost" onClick={onClose}>Để sau</Button><Button icon="eye-off" loading={busy} onClick={() => void submit()}>Ngừng dùng món này</Button></>}>
      <FormError>{errors.form ?? errors.item}</FormError>
      <p>{item.name}</p>
      <p>Món sẽ ẩn khỏi danh sách mặc định và không nhập hay xuất được. Lịch sử và số tồn được giữ.</p>
    </Dialog>
  );
}
