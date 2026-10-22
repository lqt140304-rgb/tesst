import { m } from 'motion/react';
import { paths } from '@/app/routes';
import { useSession } from '@/app/session/SessionProvider';
import { ButtonAnchor, ButtonLink, Icon, type IconName } from '@/ui';
import { ease, inView } from '@/ui/motion';
import { PubSection } from '../PubSection';
import { holidayNote } from '../homeView';
import { useHospitalHours } from '../useHospitalHours';
import { Reveal } from './Decor';
import p from '../Pub.module.css';

export const MAPS_URL = 'https://maps.app.goo.gl/xFbQ4BjKtGVa3rp86';
export const FACEBOOK_URL = 'https://www.facebook.com/benhvienthuyleson';

type Row = { icon: IconName; label: string; value: string; sub?: string; action: { label: string; href: string; external?: boolean; icon: IconName; emergency?: boolean } };
const ROWS: Row[] = [
  { icon: 'map-pin', label: 'Địa chỉ', value: '101 Khuất Duy Tiến, Nhân Chính, Thanh Xuân, Hà Nội', action: { label: 'Chỉ đường', href: MAPS_URL, external: true, icon: 'navigation' } },
  { icon: 'phone', label: 'Hotline', value: '097 355 51 05', sub: 'Tư vấn và đặt lịch', action: { label: 'Gọi ngay', href: 'tel:+84973555105', icon: 'phone' } },
  { icon: 'clock', label: 'Giờ khám', value: '08:00–21:00', sub: 'Mỗi ngày, kể cả Chủ nhật', action: { label: 'Gọi hỏi giờ', href: 'tel:+84973555105', icon: 'phone' } },
  { icon: 'heart-pulse', label: 'Cấp cứu', value: 'Tiếp nhận 24/24', action: { label: 'Gọi cấp cứu', href: 'tel:+84973555105', icon: 'phone', emergency: true } },
  { icon: 'facebook', label: 'Facebook', value: 'Bệnh viện Thú y Lê Sơn', action: { label: 'Mở trang Facebook', href: FACEBOOK_URL, external: true, icon: 'arrow-up-right' } },
];

/** Hand-drawn schematic map (no iframe). Generic kennel pin, never logo-shaped (R24). */
function MapArt() {
  const road = { stroke: '#D9D1DD', strokeLinecap: 'round' as const };
  return (
    <svg viewBox="0 0 520 380" role="img" aria-label="Sơ đồ minh họa vị trí Bệnh viện Thú y Lê Sơn trên đường Khuất Duy Tiến">
      <rect width="520" height="380" fill="#FAF8FB" />
      <g fill="#EDE6EF" opacity=".9"><rect x="40" y="40" width="110" height="80" rx="6" /><rect x="330" y="230" width="140" height="100" rx="6" /><rect x="60" y="250" width="90" height="70" rx="6" /></g>
      <g fill="#E4EFEC"><circle cx="420" cy="80" r="46" /><circle cx="460" cy="120" r="28" /></g>
      <path d="M-10 300 C 120 280, 300 230, 540 200" {...road} strokeWidth="14" fill="none" />
      <path d="M90 -10 C 120 120, 160 250, 200 400" {...road} strokeWidth="10" fill="none" />
      <m.path d="M250 -10 C 262 120, 268 250, 276 400" stroke="#C9A8CC" strokeWidth="26" strokeLinecap="round" fill="none" pathLength={1}
        initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={inView} transition={{ duration: 1.3, ease: ease.inOut }} />
      <path d="M250 -10 C 262 120, 268 250, 276 400" stroke="#fff" strokeWidth="2" strokeDasharray="10 12" fill="none" opacity=".9" />
      <text x="292" y="64" fill="#53165C" fontFamily="Be Vietnam Pro, sans-serif" fontWeight="700" fontSize="15" transform="rotate(84 292 64)">Khuất Duy Tiến</text>
      <m.g initial={{ y: -18, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={inView} transition={{ duration: 0.3, ease: ease.out, delay: 0.3 }}>
        <circle cx="236" cy="168" r="30" fill="#53165C" opacity=".12" />
        <path d="M236 196 C 214 172, 210 160, 210 150 a26 26 0 0 1 52 0 c0 10 -4 22 -26 46z" fill="#53165C" />
        <g transform="translate(224 136)" fill="none" stroke="#FAF8FB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 9 12 1l11 8v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2z" transform="scale(.9) translate(2 2)" />
        </g>
      </m.g>
    </svg>
  );
}

/** "Đặt lịch & liên hệ" (part 6A §6.9): contact facts, the booking (or call) button by the clock, and the way into the customer account. */
export function Contact() {
  const { session } = useSession();
  const { state } = useHospitalHours();
  const note = holidayNote(state);
  return (
    <PubSection id="lien-he" label="LIÊN HỆ" title={<>Sẵn sàng đón <em>bé</em></>}>
      <div className={p.contactGrid}>
        <div className={p.contactMain}>
          <ul className={p.contactRows}>
            {ROWS.map((r, i) => (
              <m.li key={r.label} className={p.contactRow} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={inView} transition={{ duration: 0.28, ease: ease.out, delay: i * 0.05 }}>
                <span className={p.contactIcon} aria-hidden="true"><Icon name={r.icon} size={20} /></span>
                <div className={p.contactText}>
                  <p className={p.contactLabel}>{r.label}</p>
                  <p className={p.contactValue}>{r.value}</p>
                  {r.sub && <p className={p.contactSub}>{r.sub}</p>}
                </div>
                <ButtonAnchor href={r.action.href} external={r.action.external} variant={r.action.emergency ? 'emergency' : 'ghost'} size="sm" icon={r.action.icon} className={p.btn}>{r.action.label}</ButtonAnchor>
              </m.li>
            ))}
          </ul>
          <div data-contact-cta className={p.contactCta}>
            {note && <p className={p.holiday}>{note}</p>}
            <div className={p.ctaRow}>
              {state.open
                ? <ButtonLink to={paths.book} iconRight="arrow-right" size="lg" className={p.btn}>Đặt lịch khám</ButtonLink>
                : <ButtonAnchor href="tel:+84973555105" icon="phone" size="lg" className={p.btn}>Gọi 097 355 51 05</ButtonAnchor>}
              {session?.kind === 'customer'
                ? <ButtonLink to={paths.kh.home} variant="secondary" size="lg" iconRight="arrow-right" className={p.btn}>Vào tài khoản của bạn</ButtonLink>
                : <ButtonLink to={paths.login} variant="secondary" size="lg" className={p.btn}>Đăng nhập theo dõi bé</ButtonLink>}
            </div>
          </div>
        </div>
        <Reveal delay={0.1} className={p.contactMap}>
          <MapArt />
          <p className={p.mapCaption}><Icon name="info" size={12} /> Sơ đồ minh họa · không theo tỉ lệ</p>
        </Reveal>
      </div>
    </PubSection>
  );
}
