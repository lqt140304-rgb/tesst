import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { m, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { svgArt } from '@/assets/media';
import { Icon } from '@/ui';
import { cx } from '@/lib/cx';
import { useMedia } from '@/lib/useMedia';
import { Reveal } from './Decor';
import s from '../Home.module.css';

const STEPS = [
  ['Bạn gửi yêu cầu', 'Cho Lê Sơn biết bé cần gì và ngày bạn mong muốn.'],
  ['Lê Sơn gọi lại', 'Nhân viên gọi vào số bạn để lại để trao đổi và chọn giờ phù hợp.'],
  ['Lịch hẹn được xác nhận', 'Lịch chỉ được xác nhận sau khi hai bên đã thống nhất qua điện thoại.'],
] as const;

/**
 * Dịch vụ → Đặt lịch: the services orbit's orange end continues down into this section as one line (drawn by the scroll)
 * that becomes the rail between the three steps; each step dot lights up when the line reaches it. Static when motion is
 * reduced. On narrow screens only the rail is drawn (the intro stacks above the form).
 */
function useBookingThread() {
  const sectionRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLOListElement>(null);
  const still = useReducedMotion() ?? false;
  const wide = useMedia('(min-width: 993px)');
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'start 0.12'] });
  const [geo, setGeo] = useState<{ w: number; h: number; d: string } | null>(null);
  useLayoutEffect(() => {
    const sec = sectionRef.current, rail = railRef.current;
    if (!sec || !rail || !wide) { setGeo(null); return; }
    const measure = () => {
      const sr = sec.getBoundingClientRect(), dot = rail.querySelector('[data-step-dot]')!.getBoundingClientRect();
      const x = dot.left + dot.width / 2 - sr.left, y = dot.top - sr.top - 6, w = sr.width;
      const lane = Math.max(8, dot.left - sr.left - 30);   // the margin left of the steps, clear of the heading text
      // From the top-right corner (where the services orbit ended, orange) across the empty band above the heading,
      // down the left margin, then into the first step dot — never across the words.
      setGeo({ w, h: y + 8, d: `M ${w - 24} 0 C ${w * 0.55} 54, ${lane + 120} 38, ${lane} 96 L ${lane} ${y - 34} Q ${lane} ${y - 6}, ${x} ${y}` });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(sec);
    return () => ro.disconnect();
  }, [wide]);
  const connector = useTransform(scrollYProgress, [0.05, 0.55], [0, 1]);
  const rail = useTransform(scrollYProgress, wide ? [0.55, 0.95] : [0.25, 0.9], [0, 1]);
  const [lit, setLit] = useState(still ? 3 : 0);
  const litFor = (p: number) => (still ? 3 : [wide ? 0.55 : 0.25, wide ? 0.75 : 0.575, wide ? 0.95 : 0.9].filter((t) => p >= t - 0.001).length);
  useMotionValueEvent(scrollYProgress, 'change', (p) => setLit(litFor(p)));
  return { sectionRef, railRef, still, geo, connector, rail, lit: still ? 3 : lit };
}

export function Booking({ form }: { form: ReactNode }) {
  const { sectionRef, railRef, still, geo, connector, rail, lit } = useBookingThread();
  return (
    <section id="dat-lich" ref={sectionRef} className={cx(s.section, s.lilac)} aria-labelledby="dat-lich-title">
      {geo && (
        <svg className={s.thread} width={geo.w} height={geo.h} viewBox={`0 0 ${geo.w} ${geo.h}`} fill="none" aria-hidden="true" data-booking-connector>
          <defs>
            <linearGradient id="bookThread" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FC9238" stopOpacity="0" />
              <stop offset=".18" stopColor="#EA7A24" />
              <stop offset=".7" stopColor="#C77A9C" />
              <stop offset="1" stopColor="#824787" />
            </linearGradient>
          </defs>
          <m.path d={geo.d} stroke="url(#bookThread)" strokeWidth="1.6" strokeLinecap="round" style={{ pathLength: still ? 1 : connector }} />
          <path d={geo.d} stroke="url(#bookThread)" strokeWidth="1.2" strokeDasharray="1.5 9" strokeLinecap="round" opacity=".35" transform="translate(10 -8)" />
        </svg>
      )}
      <div className={cx(s.wrap, s.bookGrid)}>
        <Reveal className={s.bookIntro}>
          <p className={s.eyebrow}>ĐẶT LỊCH</p>
          <h2 id="dat-lich-title" className={s.h2}>Gửi yêu cầu đặt lịch</h2>
          <p className={s.sub}>Bạn không cần tài khoản. Sau khi nhận yêu cầu, nhân viên Lê Sơn sẽ gọi để cùng bạn chốt thời gian.</p>
          <ol className={s.steps} ref={railRef}>
            <svg className={s.stepLine} viewBox="0 0 2 100" preserveAspectRatio="none" aria-hidden="true">
              <line x1="1" y1="0" x2="1" y2="100" stroke="var(--plum-100)" strokeWidth="2" />
              <m.line x1="1" y1="0" x2="1" y2="100" stroke="var(--plum-500)" strokeWidth="2" style={{ pathLength: still ? 1 : rail }} data-step-line />
            </svg>
            {STEPS.map(([title, text], i) => (
              <li key={title} className={s.step}>
                <m.span className={cx(s.stepDot, i < lit && s.stepLit)} data-step-dot data-lit={i < lit}
                  animate={i < lit ? { scale: [1, 1.14, 1] } : { scale: 1 }} transition={{ duration: 0.4 }}>
                  {i < lit ? <StepIcon i={i} /> : i + 1}
                </m.span>
                <div><p className={s.stepTitle}>{title}</p><p className={s.stepText}>{text}</p></div>
              </li>
            ))}
          </ol>
          <div className={s.emergency} role="note">
            <Icon name="heart-pulse" size={24} />
            <p><strong>Bé cần cấp cứu?</strong> Bạn gọi ngay <a href="tel:+84973555105">097 355 51 05</a> thay vì gửi yêu cầu, Lê Sơn tiếp nhận cấp cứu 24/24.</p>
          </div>
          <img className={s.bookArt} src={svgArt('cat-pose-booking')} alt="" aria-hidden="true" />
        </Reveal>
        <Reveal delay={0.1} className={s.formSlot}>{form}</Reveal>
      </div>
    </section>
  );
}

/** Once a step is lit its number becomes a small line icon that draws itself (send · phone · calendar check). */
function StepIcon({ i }: { i: number }) {
  const paths = [
    ['M4 12 20 4 13 20 11 13 4 12Z', 'M11 13 20 4'],
    ['M5 4h3l2 5-2 1.5a11 11 0 0 0 5.5 5.5L15 14l5 2v3a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z'],
    ['M4 6h16v14H4z', 'M4 10h16', 'M8 3v4', 'M16 3v4', 'm9 15 2 2 4-4'],
  ][i]!;
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths.map((d) => <m.path key={d} d={d} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45, ease: 'easeOut' }} />)}
    </svg>
  );
}
