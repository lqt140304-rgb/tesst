import type { StockKind } from '../../contracts/enums';
import { addDays } from '../../../lib/dates';
import { nextCode } from '../ids';
import type { StockItem, StockMove } from '../store/schema';
import { STAFF } from './accounts';
import type { SeedCtx } from './ctx';

/** [day offset from today, delta, optional special]: delta > 0 is a delivery, < 0 is use at the clinic. */
type Step = [day: number, delta: number, special?: 'hu_hong' | 'kiem_ke'];
type Row = { name: string; kind: StockKind; unit: string; min: number; expiry?: number; steps: Step[]; inactive?: boolean };

// Sample data ("Dữ liệu mẫu"): generic names, no brands. Final quantities, in order:
// 25, 5, 25, 5, 0, 8, 3, 150, 70, 7, 42, 10, 20, 13 (see the Kho plan, Task 3).
const ROWS: Row[] = [
  { name: 'Nước muối sinh lý 0,9 %', kind: 'thuoc', unit: 'chai', min: 10, expiry: 400, steps: [[-29, 60], [-20, -12], [-10, -15], [-3, -8]] },
  { name: 'Dịch truyền Ringer lactat', kind: 'thuoc', unit: 'túi', min: 10, expiry: 300, steps: [[-28, 30], [-18, -12], [-9, -8], [-2, -5]] },
  { name: 'Thuốc tẩy giun (mẫu)', kind: 'thuoc', unit: 'viên', min: 20, expiry: 20, steps: [[-27, 100], [-17, -30], [-8, -25], [-4, -20]] },
  { name: 'Dung dịch sát khuẩn', kind: 'thuoc', unit: 'chai', min: 4, expiry: -10, steps: [[-26, 12], [-14, -4], [-6, -3, 'hu_hong']] },
  { name: 'Thuốc nhỏ mắt (mẫu)', kind: 'thuoc', unit: 'lọ', min: 5, expiry: 200, steps: [[-25, 20], [-15, -8], [-7, -7], [-1, -5]] },
  { name: 'Thuốc bôi da (mẫu)', kind: 'thuoc', unit: 'tuýp', min: 6, expiry: 120, steps: [[-24, 15], [-12, -4], [-5, -3]] },
  { name: 'Vitamin tổng hợp (mẫu)', kind: 'thuoc', unit: 'hộp', min: 3, expiry: 150, steps: [[-23, 10], [-13, -4], [-6, -3]], inactive: true },
  { name: 'Bơm kim tiêm 3 ml', kind: 'vat_tu', unit: 'cái', min: 100, expiry: 900, steps: [[-29, 500], [-24, -120], [-15, -140], [-6, -90]] },
  { name: 'Bơm kim tiêm 5 ml', kind: 'vat_tu', unit: 'cái', min: 100, expiry: 900, steps: [[-28, 300], [-22, -90], [-11, -80], [-3, -60]] },
  { name: 'Găng tay y tế', kind: 'vat_tu', unit: 'hộp', min: 5, steps: [[-27, 30], [-17, -8], [-8, -9], [-1, -6]] },
  { name: 'Gạc vô trùng', kind: 'vat_tu', unit: 'gói', min: 20, expiry: 500, steps: [[-25, 120], [-16, -40], [-7, -35], [-2, -3, 'kiem_ke']] },
  { name: 'Băng cuộn', kind: 'vat_tu', unit: 'cuộn', min: 15, steps: [[-26, 60], [-19, -20], [-10, -18], [-3, -12]] },
  { name: 'Dây truyền dịch', kind: 'vat_tu', unit: 'bộ', min: 15, steps: [[-24, 50], [-16, -10], [-9, -12], [-2, -8]] },
  { name: 'Khẩu trang y tế', kind: 'vat_tu', unit: 'hộp', min: 5, steps: [[-20, 20], [-11, -4], [-4, -3]] },
];

export function seedStock(c: SeedCtx): void {
  const { t } = c.doc;
  const byName = t.staff_users.find((u) => u.id === STAFF.ha)!.display_name;
  let moveNo = 0;
  ROWS.forEach((r, n) => {
    const id = `stock-${n + 1}`;
    let run = 0;
    const moves: StockMove[] = r.steps.map(([day, delta, special]) => {
      run += delta;
      const adjust = special === 'kiem_ke';
      return {
        id: `stockmv-${++moveNo}`, item_id: id, kind: adjust ? 'adjust' : delta > 0 ? 'in' : 'out', delta, qty_after: run,
        reason: adjust ? 'kiem_ke' : special === 'hu_hong' ? 'hu_hong' : delta > 0 ? 'nhap_hang' : 'dung_tai_phong',
        supplier: delta > 0 ? 'Nhà cung cấp mẫu' : undefined, note: adjust ? 'Kiểm kê cuối tuần' : undefined,
        at: c.d(day, adjust ? '17:00' : delta > 0 ? '09:00' : '10:30'), by: STAFF.ha, by_name: byName,
      };
    });
    const item: StockItem = {
      id, code: nextCode(c.doc, 'KHO'), name: r.name, kind: r.kind, unit: r.unit, qty: run, min_qty: r.min,
      expires_on: r.expiry === undefined ? undefined : addDays(c.base, r.expiry), active: !r.inactive, version: 1,
      created_at: moves[0]!.at, created_by: STAFF.ha,
    };
    t.stock_items.push(item);
    t.stock_moves.push(...moves);
  });
}
