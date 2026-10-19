import { DemoTag, Icon } from '@/ui';
import { ResetDemoLink } from './ResetDemoLink';
import s from './Auth.module.css';

export const DEMO_PASSWORD = 'leson-demo';
const CHIPS: Record<'customer' | 'staff', { label: string; note: string; username: string }[]> = {
  customer: [
    { label: 'Chị Lan', note: 'đã liên kết hồ sơ', username: 'lan_nguyen' },
    { label: 'Anh Khoa', note: 'tài khoản mới, chưa liên kết', username: 'minh_khoa' },
  ],
  staff: [
    { label: 'Chị Hà', note: 'Quản lý', username: 'quanly_ha' },
    { label: 'BS. Đức', note: 'Bác sĩ, nhận yêu cầu đặt lịch', username: 'bacsi_duc' },
    { label: 'BS. Mai', note: 'Bác sĩ', username: 'bacsi_mai' },
    { label: 'Ngọc Anh', note: 'Nhân viên Spa', username: 'spa_ngocanh' },
  ],
};

/** Demo quick-fill (customer §5.4): fills both fields and focuses "Đăng nhập"; never submits. */
export function DemoAccountChips({ tab, onPick }: { tab: 'customer' | 'staff'; onPick: (username: string, password: string) => void }) {
  return (
    <section className={s.demoBox} aria-labelledby="demo-title">
      <div className={s.demoHead}>
        <h2 id="demo-title" className={s.demoTitle}><Icon name="paw-line" size={18} /> Dùng thử nhanh</h2>
        <DemoTag>Tài khoản mẫu</DemoTag>
      </div>
      <p className={s.demoSub}>Chỉ có trong bản demo. Bấm để điền sẵn, rồi bấm Đăng nhập.</p>
      <div className={s.demoChips}>
        {CHIPS[tab].map((c) => (
          <button key={c.username} type="button" className={s.demoChip} onClick={() => onPick(c.username, DEMO_PASSWORD)}>
            <strong>{c.label}</strong> · {c.note}
          </button>
        ))}
      </div>
      <ResetDemoLink />
    </section>
  );
}
