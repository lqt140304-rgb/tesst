import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { isMorphing } from '@/app/morph';
import { AppLink } from '@/app/nav';
import { paths } from '@/app/routes';
import { logoUrl, photo, svgArt, type PhotoKey } from '@/assets/media';
import { Icon, type IconName } from '@/ui';
import { dur, ease } from '@/ui/motion';
import s from './Auth.module.css';

export type PortalMode = 'customer' | 'staff' | 'signup';

const COPY: Record<PortalMode, { lead: string; accent: string; tail?: string; bullets?: [IconName, string][]; line?: string }> = {
  customer: {
    lead: 'Rất vui được gặp lại', accent: 'bạn và bé',
    bullets: [['calendar-check', 'Theo dõi yêu cầu và lịch hẹn'], ['video', 'Xem nhật ký, video khi bé nội trú'], ['receipt', 'Xem lại hóa đơn']],
  },
  staff: { lead: 'Khu làm việc của', accent: 'đội ngũ Lê Sơn', line: 'Mỗi người một tài khoản riêng để mọi thao tác được ghi nhận đúng người.' },
  signup: {
    lead: 'Chào mừng', accent: 'bạn và bé', tail: 'đến với Lê Sơn',
    bullets: [['paw-heart', 'Lưu hồ sơ các bé và gửi yêu cầu đặt lịch'], ['calendar-check', 'Theo dõi yêu cầu và lịch hẹn'], ['link-2', 'Nhật ký, video và hóa đơn sau khi liên kết hồ sơ']],
  },
};

/** Orbit geometry in the 400 × 300 viewBox; frames sit on the ellipse at these angles (degrees, clockwise from 3 o'clock). */
const CX = 200, CY = 150, RX = 168, RY = 108;
/** `vt` matches the hero frames named left → right by the homepage → portal morph (app/morph.ts). */
const FRAMES: { angle: number; size: number; photos: Record<'customer' | 'staff', PhotoKey>; pos?: string; vt: string }[] = [
  { angle: 202, size: 27, photos: { customer: 'pet_center', staff: 'kham' }, vt: 'lt-frame-1' },
  { angle: 318, size: 22, photos: { customer: 'pet_right', staff: 'grooming' }, vt: 'lt-frame-3' },
  { angle: 92, size: 24, photos: { customer: 'noitru', staff: 'noitru' }, pos: '70% 40%', vt: 'lt-frame-2' },
];
const onOrbit = (deg: number) => {
  const r = (deg * Math.PI) / 180;
  return { left: `${((CX + RX * Math.cos(r)) / 400) * 100}%`, top: `${((CY + RY * Math.sin(r)) / 300) * 100}%` };
};
const arcPath = (from: number, to: number, grow: number) => {
  const p = (deg: number) => {
    const r = (deg * Math.PI) / 180;
    return `${CX + (RX + grow) * Math.cos(r)} ${CY + (RY + grow) * Math.sin(r)}`;
  };
  return `M ${p(from)} A ${RX + grow} ${RY + grow} 0 0 1 ${p(to)}`;
};

/** "The orbit window" (visual §3.4): draws in once on entry, then stays completely still. */
export function PortalPanel({ mode }: { mode: PortalMode }) {
  // Arriving by the homepage morph: the browser animates the frames in, so they render settled.
  const reduced = useReducedMotion() || isMorphing();
  const c = COPY[mode];
  const scene = mode === 'staff' ? 'staff' : 'customer';
  return (
    <aside className={s.panel} aria-label="Giới thiệu khu tài khoản">
      <div className={s.panelTop}>
        <AppLink to={paths.home} className={s.logoTile} aria-label="Bệnh viện Thú y Lê Sơn – Về trang chủ">
          <img src={logoUrl} alt="" width={44} height={40} />
        </AppLink>
        <AppLink to={paths.home} className={s.homeLinkBand}><Icon name="arrow-left" size={16} /> Về trang chủ</AppLink>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <m.div key={mode} className={s.panelCopy} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <p className={s.panelTitle}>
            {c.lead} <em>{c.accent}</em>{c.tail ? ` ${c.tail}` : ''}
          </p>
          {c.bullets && (
            <ul className={s.panelBullets}>
              {c.bullets.map(([icon, text]) => <li key={text}><Icon name={icon} size={20} />{text}</li>)}
            </ul>
          )}
          {c.line && <p className={s.panelLine}>{c.line}</p>}
        </m.div>
      </AnimatePresence>

      <div className={s.orbit} aria-hidden="true" style={{ viewTransitionName: 'lt-orbit' }}>
        <svg viewBox="0 0 400 300" className={s.orbitSvg}>
          <m.ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="none" stroke="rgba(255, 246, 238, .18)" strokeWidth="1.5" strokeDasharray="1 7" strokeLinecap="round"
            initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: dur.xl, ease: ease.out }} />
          <m.path d={arcPath(300, 20, 10)} fill="none" stroke="var(--orange-500)" strokeWidth="2.5" strokeLinecap="round"
            initial={reduced ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: dur.draw, ease: ease.out, delay: 0.15 }} />
        </svg>
        {FRAMES.map((f, i) => {
          const path = [12, 8, 4, 0].map((d) => onOrbit(f.angle - d));
          return (
            <m.div key={i} className={s.frame} style={{ width: `${f.size}%`, ...path[3], viewTransitionName: f.vt }} data-portal-frame
              initial={reduced ? false : { opacity: 0, left: path[0]!.left, top: path[0]!.top }}
              animate={{ opacity: 1, left: path.map((p) => p.left), top: path.map((p) => p.top) }}
              transition={{ duration: 1.1, ease: ease.outExpo, delay: 0.1 + i * 0.08 }}>
              <div className={s.frameInner}>
                <AnimatePresence initial={false}>
                  <m.img key={f.photos[scene]} src={photo(f.photos[scene])} alt="" style={f.pos ? { objectPosition: f.pos } : undefined}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: dur.l }} />
                </AnimatePresence>
              </div>
            </m.div>
          );
        })}
      </div>
      <img className={s.panelCat} src={svgArt('cat-silhouette')} alt="" aria-hidden="true" />
    </aside>
  );
}
