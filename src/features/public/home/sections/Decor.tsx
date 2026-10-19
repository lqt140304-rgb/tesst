import { m } from 'motion/react';
import { ease, inView } from '@/ui/motion';

/** Thin orange arc that draws itself once when it enters the viewport (echo of the hero orbit). */
export function DrawArc({ className, d = 'M4 92 C 60 20, 180 4, 296 40', viewBox = '0 0 300 100', width = 2 }: { className?: string; d?: string; viewBox?: string; width?: number }) {
  return (
    <svg className={className} viewBox={viewBox} fill="none" aria-hidden="true" preserveAspectRatio="none">
      <m.path d={d} stroke="currentColor" strokeWidth={width} strokeLinecap="round" pathLength={1}
        initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={inView} transition={{ duration: 1.2, ease: ease.inOut }} />
    </svg>
  );
}

export function Reveal({ children, delay = 0, distance = 24, className }: { children: React.ReactNode; delay?: number; distance?: number; className?: string }) {
  return (
    <m.div className={className} initial={{ opacity: 0, y: distance }} whileInView={{ opacity: 1, y: 0 }} viewport={inView} transition={{ duration: 0.65, ease: ease.out, delay }}>
      {children}
    </m.div>
  );
}
