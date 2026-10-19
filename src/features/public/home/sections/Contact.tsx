import { m } from 'motion/react';
import { ButtonAnchor, IconBadge, Icon, type IconName } from '@/ui';
import type { BadgeTone } from '@/ui/kit/Misc';
import { ease, inView } from '@/ui/motion';
import { cx } from '@/lib/cx';
import { Reveal } from './Decor';
import s from '../Home.module.css';

export const MAPS_URL = 'https://maps.app.goo.gl/xFbQ4BjKtGVa3rp86';
export const FACEBOOK_URL = 'https://www.facebook.com/benhvienthuyleson';

type Row = { icon: IconName; tone: BadgeTone; label: string; value: string; sub?: string; action: { label: string; href: string; external?: boolean; icon: IconName } };
const ROWS: Row[] = [
  { icon: 'map-pin', tone: 'peach', label: 'Địa chỉ', value: '101 Khuất Duy Tiến, Nhân Chính, Thanh Xuân, Hà Nội', action: { label: 'Chỉ đường', href: MAPS_URL, external: true, icon: 'navigation' } },
  { icon: 'phone', tone: 'mint', label: 'Hotline', value: '097 355 51 05', sub: 'Tư vấn, đặt lịch và cấp cứu', action: { label: 'Gọi ngay', href: 'tel:+84973555105', icon: 'phone' } },
  { icon: 'heart-pulse', tone: 'rose', label: 'Cấp cứu', value: 'Tiếp nhận 24/24', action: { label: 'Gọi cấp cứu', href: 'tel:+84973555105', icon: 'phone' } },
  { icon: 'facebook', tone: 'lilac', label: 'Facebook', value: 'Bệnh viện Thú y Lê Sơn', action: { label: 'Mở trang Facebook', href: FACEBOOK_URL, external: true, icon: 'arrow-up-right' } },
];

/** Hand-drawn schematic map (no iframe: unreliable in the Artifact host). Generic kennel pin, never logo-shaped (R24). */
function MapArt() {
  const road = { stroke: '#D8C3B3', strokeLinecap: 'round' as const };
  return (
    <svg viewBox="0 0 520 380" role="img" aria-label="Sơ đồ minh họa vị trí Bệnh viện Thú y Lê Sơn trên đường Khuất Duy Tiến">
      <rect width="520" height="380" fill="#F6EEE5" />
      <g fill="#EADCF0" opacity=".7"><rect x="40" y="40" width="110" height="80" rx="14" /><rect x="330" y="230" width="140" height="100" rx="16" /><rect x="60" y="250" width="90" height="70" rx="12" /></g>
      <g fill="#DDEFEA"><circle cx="420" cy="80" r="46" /><circle cx="460" cy="120" r="28" /></g>
      <path d="M-10 300 C 120 280, 300 230, 540 200" {...road} strokeWidth="14" fill="none" />
      <path d="M90 -10 C 120 120, 160 250, 200 400" {...road} strokeWidth="10" fill="none" />
      <m.path d="M250 -10 C 262 120, 268 250, 276 400" stroke="#C9A8CC" strokeWidth="26" strokeLinecap="round" fill="none" pathLength={1}
        initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={inView} transition={{ duration: 1.3, ease: ease.inOut }} />
      <path d="M250 -10 C 262 120, 268 250, 276 400" stroke="#fff" strokeWidth="2" strokeDasharray="10 12" fill="none" opacity=".9" />
      <text x="292" y="64" fill="#76457A" fontFamily="Be Vietnam Pro, sans-serif" fontWeight="700" fontSize="15" transform="rotate(84 292 64)">Khuất Duy Tiến</text>
      <m.g initial={{ y: -18, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={inView} transition={{ type: 'spring', bounce: 0.35, visualDuration: 0.5, delay: 0.6 }}>
        <circle cx="236" cy="168" r="30" fill="#5A1E5E" opacity=".12" />
        <path d="M236 196 C 214 172, 210 160, 210 150 a26 26 0 0 1 52 0 c0 10 -4 22 -26 46z" fill="#5A1E5E" />
        <g transform="translate(224 136) scale(1)" fill="none" stroke="#FBF7F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 9 12 1l11 8v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2z" transform="scale(.9) translate(2 2)" />
        </g>
      </m.g>
    </svg>
  );
}

export function Contact() {
  return (
    <section id="lien-he" className={cx(s.section, s.cream)} aria-labelledby="lien-he-title">
      <div className={s.wrap}>
        <Reveal className={s.head}>
          <p className={s.eyebrow}>LIÊN HỆ</p>
          <h2 id="lien-he-title" className={s.h2}>Ghé thăm Lê Sơn</h2>
          <p className={s.sub}>Bạn nên gọi trước khi đến để được hướng dẫn và sắp xếp thời gian phù hợp.</p>
        </Reveal>
        <div className={s.contactGrid}>
          <ul className={s.rows} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {ROWS.map((r, i) => (
              <m.li key={r.label} className={s.row} initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={inView} transition={{ duration: 0.55, ease: ease.out, delay: i * 0.07 }}>
                <IconBadge icon={r.icon} tone={r.tone} size={40} />
                <div>
                  <p className={s.rowLabel}>{r.label}</p>
                  <p className={s.rowValue}>{r.value}</p>
                  {r.sub && <p className={s.rowSub}>{r.sub}</p>}
                </div>
                <ButtonAnchor href={r.action.href} external={r.action.external} variant={r.icon === 'heart-pulse' ? 'emergency' : 'secondary'} size="sm" icon={r.action.icon}>
                  {r.action.label}
                </ButtonAnchor>
              </m.li>
            ))}
          </ul>
          <Reveal delay={0.1} className={s.map}>
            <MapArt />
            <div className={s.mapFoot}>
              <span className={s.mapCaption}><Icon name="info" size={12} /> Sơ đồ minh họa · không theo tỉ lệ</span>
              <ButtonAnchor href={MAPS_URL} external size="sm" icon="map-pin">Mở Google Maps</ButtonAnchor>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
