import type { CSSProperties } from 'react';
import { m } from 'motion/react';
import { paths } from '@/app/routes';
import { useSession } from '@/app/session/SessionProvider';
import { photo } from '@/assets/media';
import { ButtonLink, DemoTag, Icon, IconBadge, StatusPill, statusPill, type IconName } from '@/ui';
import type { BadgeTone } from '@/ui/kit/Misc';
import { ease, inView } from '@/ui/motion';
import { cx } from '@/lib/cx';
import { Reveal } from './Decor';
import s from '../Home.module.css';

const TILES: [IconName, BadgeTone, string, string][] = [
  ['paw-line', 'peach', 'Hồ sơ thú cưng', 'Lưu thông tin các bé để lần sau đặt lịch nhanh hơn.'],
  ['calendar-check', 'mint', 'Lịch hẹn & yêu cầu', 'Biết yêu cầu của bạn đang ở bước nào.'],
  ['house-paw', 'lilac', 'Nhật ký & video nội trú', 'Xem nhật ký chăm sóc và video khi bé ở lại Lê Sơn.'],
  ['receipt', 'rose', 'Hóa đơn', 'Xem lại các hóa đơn và tình trạng thanh toán.'],
];

/** Decorative preview cards (static sample data, hidden from assistive tech — the tiles carry the content). */
function Preview() {
  const cards = [
    { style: { left: 0, top: 0, rotate: '-3deg', zIndex: 1 }, body: (
      <>
        <div className={s.stackPhoto}><img src={photo('noitru', 'thumb')} alt="" /></div>
        <p className={s.stackTitle}>Bé Miu · nội trú</p>
        <div className={s.stackRow}><StatusPill pill={statusPill('general', 'recovering')} dense /><span style={{ fontSize: 13, color: 'var(--ink-600)' }}>Sáng nay</span></div>
      </>
    ) },
    { style: { right: 0, top: 170, rotate: '2.5deg', zIndex: 2 }, body: (
      <>
        <p className={s.stackTitle}>Lịch hẹn</p>
        <div className={s.stackRow}><span>Spa & Grooming · bé Bông</span><StatusPill pill={statusPill('request', 'confirmed')} dense /></div>
        <div className={s.stackRow}><span>Khám và điều trị · bé Miu</span><StatusPill pill={statusPill('request', 'pending')} dense /></div>
      </>
    ) },
    { style: { left: 24, top: 318, rotate: '-1deg', zIndex: 3 }, body: (
      <>
        <p className={s.stackTitle}>Hóa đơn</p>
        <div className={s.stackRow}><span>HD-1031 · 230.000 ₫</span><StatusPill pill={statusPill('payment', 'unpaid')} dense /></div>
      </>
    ) },
  ];
  return (
    <div className={s.accArt} aria-hidden="true" inert>
      {cards.map((c, i) => (
        <m.div key={i} className={s.stackCard} style={c.style} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={inView}
          transition={{ duration: 0.7, ease: ease.out, delay: 0.15 + i * 0.12 }}>
          {c.body}
        </m.div>
      ))}
      <DemoTag className={s.aboutTag}>Dữ liệu mẫu</DemoTag>
    </div>
  );
}

export function AccountTeaser() {
  const { session } = useSession();
  return (
    <section id="tai-khoan-khach-hang" className={cx(s.section, s.white)} aria-labelledby="tai-khoan-title">
      <div className={cx(s.wrap, s.accGrid)}>
        <Reveal className={s.accText}>
          <p className={s.eyebrow}>TÀI KHOẢN KHÁCH HÀNG</p>
          <h2 id="tai-khoan-title" className={s.h2}>Mọi thông tin của bé, gọn trong một tài khoản</h2>
          <p className={s.sub}>Tạo tài khoản để lưu hồ sơ của bé, theo dõi yêu cầu đặt lịch và xem lại các cập nhật từ Lê Sơn.</p>
          <ul className={s.tiles} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {TILES.map(([icon, tone, title, text]) => (
              <li key={title} className={s.tile} data-card="tile" style={{ '--tint': `var(--badge-${tone})` } as CSSProperties}>
                <IconBadge icon={icon} tone={tone} size={40} />
                <div><p className={s.tileTitle}>{title}</p><p className={s.tileText}>{text}</p></div>
              </li>
            ))}
          </ul>
          <p className={s.footnote}><Icon name="link-2" size={18} /> Hóa đơn, nhật ký và video nội trú sẽ hiện sau khi nhân viên liên kết tài khoản với hồ sơ của bạn tại bệnh viện.</p>
          <div className={s.ctaRow}>
            {session?.kind === 'customer' ? (
              <ButtonLink to={paths.kh.home} iconRight="arrow-right">Vào khu khách hàng</ButtonLink>
            ) : (
              <>
                <ButtonLink to={paths.signup}>Tạo tài khoản</ButtonLink>
                <ButtonLink to={paths.login} variant="secondary">Tôi đã có tài khoản</ButtonLink>
              </>
            )}
          </div>
        </Reveal>
        <Preview />
      </div>
    </section>
  );
}
