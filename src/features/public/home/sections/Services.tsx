import { useRef, type CSSProperties } from 'react';
import { m, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react';
import { paths } from '@/app/routes';
import { photo } from '@/assets/media';
import { ButtonAnchor, ButtonLink, DemoTag, IconBadge, type IconName } from '@/ui';
import type { BadgeTone } from '@/ui/kit/Misc';
import type { Service } from '@/data/contracts/enums';
import { Icon } from '@/ui';
import { cx } from '@/lib/cx';
import { useMedia } from '@/lib/useMedia';
import { Reveal } from './Decor';
import { launchServiceFlight } from '../serviceFlight';
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

/** Paw prints walking along the curve (points on the cubic at t = .2 / .5 / .8, nudged left/right like footsteps). */
const PAWS = [
  { t: 0.2, x: 191, y: 56, rot: 72 },
  { t: 0.5, x: 600, y: 104, rot: 90 },
  { t: 0.8, x: 1009, y: 56, rot: 108 },
];

/**
 * The hero's orbit comes back (Giới thiệu → Dịch vụ): the curve above the cards is drawn by the scroll, from left to right,
 * paw prints appear as the tip passes them, and it runs backwards when scrolling up. Static when motion is reduced.
 */
function OrbitArc({ draw }: { draw: MotionValue<number> | number }) {
  const d = 'M -40 20 C 300 121, 900 121, 1240 20';
  return (
    <div className={v.orbitBox} aria-hidden="true" data-orbit>
      <svg className={v.orbit} viewBox="0 0 1200 160" preserveAspectRatio="none" fill="none">
        <defs>
          <linearGradient id="svcOrbit" x1="0" y1="0" x2="1200" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#5A1E5E" stopOpacity="0" />
            <stop offset=".18" stopColor="#824787" />
            <stop offset=".55" stopColor="#C77A9C" />
            <stop offset=".85" stopColor="#EA7A24" />
            <stop offset="1" stopColor="#FC9238" stopOpacity="0" />
          </linearGradient>
        </defs>
        <DottedRing draw={draw} />
        <m.path d={d} stroke="url(#svcOrbit)" strokeWidth="1.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity=".75"
          style={{ pathLength: draw }} data-orbit-line />
      </svg>
      {PAWS.map((p) => <Paw key={p.t} {...p} draw={draw} />)}
    </div>
  );
}

function DottedRing({ draw }: { draw: MotionValue<number> | number }) {
  const opacity = useTransform(() => (typeof draw === 'number' ? draw : draw.get()) * 0.55);
  return (
    <m.path d="M -40 0 C 300 92, 900 92, 1240 0" stroke="url(#svcOrbit)" strokeWidth="1.3" strokeDasharray="1.5 9" strokeLinecap="round"
      vectorEffect="non-scaling-stroke" style={{ opacity }} />
  );
}

function Paw({ t, x, y, rot, draw }: { t: number; x: number; y: number; rot: number; draw: MotionValue<number> | number }) {
  const k = useTransform(() => {
    const p = typeof draw === 'number' ? draw : draw.get();
    return Math.min(1, Math.max(0, (p - (t - 0.04)) / 0.08));
  });
  const scale = useTransform(k, [0, 1], [0.4, 1]);
  return (
    <m.span className={v.paw} data-orbit-paw style={{ left: `${(x / 1200) * 100}%`, top: `${(y / 160) * 100}%`, rotate: rot, opacity: k, scale }}>
      <Icon name="paw" size={16} />
    </m.span>
  );
}

/** A card drops onto the curve: on the 4-up desktop row when the orbit tip passes it, otherwise as it scrolls into view. */
function CardShell({ index, stage, still, wide, children, className, style, title }: {
  index: number; stage: MotionValue<number>; still: boolean; wide: boolean; children: React.ReactNode; className?: string; style?: CSSProperties; title: string;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const own = useScroll({ target: ref, offset: ['start end', 'start 0.72'] }).scrollYProgress;
  // All four cards have landed by ~0.47, before the point where the "Dịch vụ" menu link scrolls to (~0.49).
  const a = 0.05 + index * 0.08;
  const k = useTransform(() => (still ? 1 : wide ? Math.min(1, Math.max(0, (stage.get() - a) / 0.18)) : own.get()));
  const y = useTransform(k, [0, 1], [38, 0]);
  const rotate = useTransform(k, [0, 1], [index % 2 ? 2.5 : -2.5, 0]);
  return (
    <m.li ref={ref} className={className} data-service-card={title} style={{ ...style, opacity: k, y, rotate }}>
      {children}
    </m.li>
  );
}

export function Services() {
  const stageRef = useRef<HTMLDivElement>(null);
  const still = useReducedMotion() ?? false;
  const wide = useMedia('(min-width: 1200px)');
  const { scrollYProgress } = useScroll({ target: stageRef, offset: ['start end', 'start 0.2'] });
  const drawLine = useTransform(scrollYProgress, [0.06, 0.5], [0, 1]);
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
        <div className={v.stage} ref={stageRef} data-services-stage>
          <OrbitArc draw={still ? 1 : drawLine} />
          <ul className={v.row}>
            {CARDS.map((c, i) => (
              <CardShell key={c.title} index={i} stage={scrollYProgress} still={still} wide={wide} title={c.title}
                className={cx(v.card, !c.service && v.emergency)} style={{ '--tilt': `${c.tilt}deg`, '--tint': `var(--badge-${c.tone})` } as CSSProperties}>
                <div className={v.lift} data-card="service">
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
                      <ButtonLink to={`${paths.section('dat-lich')}?dich-vu=${c.service}`} variant="secondary" iconRight="arrow-right"
                        onClick={(e) => launchServiceFlight(c.service!, (e.currentTarget as HTMLElement).closest('[data-service-card]')?.querySelector<HTMLElement>(`.${v.badge}`) ?? null)}>
                        Gửi yêu cầu đặt lịch
                      </ButtonLink>
                    ) : (
                      <>
                        <p className={v.note}>Cấp cứu không cần đặt lịch.</p>
                        <ButtonAnchor href="tel:+84973555105" variant="emergency" icon="phone">Gọi 097 355 51 05</ButtonAnchor>
                      </>
                    )}
                  </div>
                </div>
              </CardShell>
            ))}
          </ul>
        </div>
        <div className={s.captions}><DemoTag>Ảnh minh họa</DemoTag><DemoTag>Nội dung mẫu</DemoTag></div>
      </div>
    </section>
  );
}
