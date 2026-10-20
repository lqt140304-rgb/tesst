import { m, useReducedMotion } from 'motion/react';
import { ease, inView, preset } from '@/ui/motion';

/** Thin orange arc that draws itself once when it enters the viewport (echo of the hero orbit). */
export function DrawArc({ className, d = 'M4 92 C 60 20, 180 4, 296 40', viewBox = '0 0 300 100', width = 2 }: { className?: string; d?: string; viewBox?: string; width?: number }) {
  return (
    <svg className={className} viewBox={viewBox} fill="none" aria-hidden="true" preserveAspectRatio="none">
      <m.path d={d} stroke="currentColor" strokeWidth={width} strokeLinecap="round" pathLength={1}
        initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={inView} transition={{ duration: 1.2, ease: ease.inOut }} />
    </svg>
  );
}

/** Appears once when scrolled to (part 2: the 8 px / 280 ms preset; a fade only under reduced motion). */
export function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const p = preset('enterList', { reduced: useReducedMotion() ?? false });
  return (
    <m.div className={className} initial={p.initial} whileInView={p.animate} viewport={inView} transition={{ ...p.transition, delay }}>
      {children}
    </m.div>
  );
}
