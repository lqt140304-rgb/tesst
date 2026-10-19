import type { CSSProperties } from 'react';
import { m } from 'motion/react';
import { paths } from '@/app/routes';
import { photo } from '@/assets/media';
import { ButtonAnchor, ButtonLink, DemoTag, IconBadge, type IconName } from '@/ui';
import type { BadgeTone } from '@/ui/kit/Misc';
import type { Service } from '@/data/contracts/enums';
import { ease, inView } from '@/ui/motion';
import { cx } from '@/lib/cx';
import { Reveal } from './Decor';
import s from '../Home.module.css';
import v from './Services.module.css';

type Card = {
  title: string; icon: IconName; tone: BadgeTone; img: string; alt: string; desc: string; service?: Service;
  /** Frame tilt (deg), alternating like the hero frames; `focus` re-crops photos the hero already shows. */
  tilt: number; focus?: { pos: string; zoom: number };
};
/** Locked names and order (R15): Khám và điều trị · Spa & Grooming · Nội trú · Cấp cứu 24/24. */
const CARDS: Card[] = [
  { title: 'Khám và điều trị', icon: 'stethoscope', tone: 'peach', img: photo('kham'), alt: 'Bàn tay nhẹ nhàng vuốt ve một bé mèo mướp', service: 'kham', tilt: -3,
    desc: 'Khi bé mệt, bỏ ăn hay có biểu hiện lạ, hãy để bác sĩ thăm khám và cùng bạn tìm hướng chăm sóc phù hợp.' },
  { title: 'Spa & Grooming', icon: 'scissors', tone: 'mint', img: photo('grooming'), alt: 'Chú chó Golden Retriever đang được chải lông', service: 'spa', tilt: 2.5,
    desc: 'Tắm, chải lông và cắt tỉa nhẹ nhàng để bé sạch sẽ, thơm tho và dễ chịu hơn.' },
  { title: 'Nội trú', icon: 'house-paw', tone: 'lilac', img: photo('noitru'), alt: 'Bé mèo cam ngủ ngon trong chăn ấm', service: 'noi_tru', tilt: -2,
    focus: { pos: '38% 62%', zoom: 1.14 },
    desc: 'Khi bé cần ở lại để theo dõi và chăm sóc, bạn vẫn xem được nhật ký và video của bé trong tài khoản Lê Sơn.' },
  { title: 'Cấp cứu 24/24', icon: 'heart-pulse', tone: 'rose', img: photo('capcuu'), alt: 'Chú cún Golden Retriever ngậm bông hoa', tilt: 3,
    focus: { pos: '50% 34%', zoom: 1.16 },
    desc: 'Bé gặp tình huống khẩn cấp? Đừng chờ, hãy gọi ngay để được hướng dẫn và tiếp nhận.' },
];

/** The hero's dotted orbit, continued: one gentle curve behind the cards that draws itself once, then stays still. */
function OrbitArc() {
  // Points on the solid curve (t = .35 and .78) carry the small beads the hero orbit has.
  const d = 'M -40 20 C 300 121, 900 121, 1240 20';
  return (
    <svg className={v.orbit} viewBox="0 0 1200 160" preserveAspectRatio="none" fill="none" aria-hidden="true" data-orbit>
      <defs>
        <linearGradient id="svcOrbit" x1="0" y1="0" x2="1200" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#5A1E5E" stopOpacity="0" />
          <stop offset=".18" stopColor="#824787" />
          <stop offset=".55" stopColor="#C77A9C" />
          <stop offset=".85" stopColor="#EA7A24" />
          <stop offset="1" stopColor="#FC9238" stopOpacity="0" />
        </linearGradient>
      </defs>
      <m.path d="M -40 0 C 300 92, 900 92, 1240 0" stroke="url(#svcOrbit)" strokeWidth="1.3" strokeDasharray="1.5 9" strokeLinecap="round"
        vectorEffect="non-scaling-stroke" initial={{ opacity: 0 }} whileInView={{ opacity: 0.55 }} viewport={inView} transition={{ duration: 1, delay: 0.3 }} />
      <m.path d={d} stroke="url(#svcOrbit)" strokeWidth="1.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity=".7"
        initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={inView} transition={{ duration: 1.4, ease: ease.inOut }} />
      <m.g initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={inView} transition={{ duration: 0.4, delay: 1.2 }}>
        <ellipse cx="390" cy="89" rx="4" ry="4" fill="#9A5596" />
        <ellipse cx="983" cy="72" rx="4.5" ry="4.5" fill="#FC9238" />
      </m.g>
    </svg>
  );
}

export function Services() {
  return (
    <section id="dich-vu" className={cx(s.section, v.section)} aria-labelledby="dich-vu-title">
      <span className={v.glowA} aria-hidden="true" />
      <span className={v.glowB} aria-hidden="true" />
      <div className={s.wrap}>
        <Reveal className={s.head}>
          <p className={v.eyebrow}>DỊCH VỤ</p>
          <h2 id="dich-vu-title" className={s.h2}>Lê Sơn có thể giúp gì cho <em>bé</em>?</h2>
          <p className={v.pill}>Chọn điều bé cần và gửi yêu cầu, nhân viên sẽ gọi lại để hẹn thời gian phù hợp. Nếu bé cần cấp cứu, xin gọi ngay cho Lê Sơn.</p>
        </Reveal>
        <div className={v.stage}>
          <OrbitArc />
          <ul className={v.row}>
            {CARDS.map((c, i) => (
              <m.li key={c.title} className={cx(v.card, !c.service && v.emergency)} data-service-card={c.title}
                style={{ '--tilt': `${c.tilt}deg` } as CSSProperties}
                initial={{ opacity: 0, x: -28, y: 22, rotate: -1.5 }} whileInView={{ opacity: 1, x: 0, y: 0, rotate: 0 }} viewport={inView}
                transition={{ duration: 0.75, ease: ease.outExpo, delay: 0.12 + i * 0.08 }}>
                <div className={v.lift}>
                  <div className={v.frame} data-frame>
                    <div className={v.frameInner}>
                      <img src={c.img} alt={c.alt} loading="lazy" width={600} height={440}
                        style={c.focus ? { objectPosition: c.focus.pos, transform: `scale(${c.focus.zoom})` } : undefined} />
                    </div>
                    {!c.service && <span className={v.chip}>Tiếp nhận 24/24</span>}
                  </div>
                  <IconBadge icon={c.icon} tone={c.tone} size={52} className={v.badge} />
                  <div className={v.body}>
                    <h3 className={v.title}>{c.title}</h3>
                    <p className={v.desc}>{c.desc}</p>
                    {c.service ? (
                      <ButtonLink to={`${paths.section('dat-lich')}?dich-vu=${c.service}`} variant="secondary" iconRight="arrow-right">Gửi yêu cầu đặt lịch</ButtonLink>
                    ) : (
                      <>
                        <p className={v.note}>Cấp cứu không cần đặt lịch.</p>
                        <ButtonAnchor href="tel:+84973555105" variant="emergency" icon="phone">Gọi 097 355 51 05</ButtonAnchor>
                      </>
                    )}
                  </div>
                </div>
              </m.li>
            ))}
          </ul>
        </div>
        <div className={s.captions}><DemoTag>Ảnh minh họa</DemoTag><DemoTag>Nội dung mẫu</DemoTag></div>
      </div>
    </section>
  );
}
