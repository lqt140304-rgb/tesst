import { Icon, IconBadge, type IconName } from '@/ui';
import { APPROVED_ICONS, CUSTOM_ICONS, LUCIDE_ICONS } from '@/ui/icons/names';
import s from './IconSheetPage.module.css';

function Group({ title, names }: { title: string; names: readonly IconName[] }) {
  return (
    <>
      <h2 className={s.h2}>{title} ({names.length})</h2>
      <div className={s.grid}>
        {names.map((n) => (
          <div key={n} className={s.cell} data-icon-cell={n}>
            <div className={s.sizes}>
              <Icon name={n} size={16} />
              <Icon name={n} size={24} />
              <Icon name={n} size={28} />
            </div>
            <span className={s.name}>{n}</span>
          </div>
        ))}
      </div>
    </>
  );
}

/** Owner review sheet for the whole icon set (R22: not in navigation; reachable from the demo chip). */
export default function IconSheetPage() {
  return (
    <main className={s.page} id="noi-dung">
      <h1 className={s.h1} tabIndex={-1}>Bộ icon Lê Sơn</h1>
      <p className={s.lead}>Trang dành cho việc duyệt icon: mỗi icon ở cỡ 16, 24 và 28 px. Nét 2 đơn vị, bo tròn; 4 icon dịch vụ giữ nguyên bản đã duyệt.</p>
      <h2 className={s.h2}>Huy hiệu dịch vụ đã duyệt</h2>
      <div className={s.badges}>
        <div className={s.badgeCell}><IconBadge icon="stethoscope" tone="peach" size={52} />Khám và điều trị</div>
        <div className={s.badgeCell}><IconBadge icon="scissors" tone="mint" size={52} />Spa & Grooming</div>
        <div className={s.badgeCell}><IconBadge icon="house-paw" tone="lilac" size={52} />Nội trú</div>
        <div className={s.badgeCell}><IconBadge icon="heart-pulse" tone="rose" size={52} />Cấp cứu 24/24</div>
      </div>
      <Group title="Icon dịch vụ đã duyệt" names={APPROVED_ICONS} />
      <Group title="Icon thú y vẽ riêng" names={CUSTOM_ICONS} />
      <Group title="Icon giao diện (Lucide)" names={LUCIDE_ICONS} />
    </main>
  );
}
