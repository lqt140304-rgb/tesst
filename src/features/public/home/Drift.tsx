import { useRef, type ReactNode } from 'react';
import { m, useScroll, useTransform } from 'motion/react';
import { useReducedMotion } from '@/ui/motion';

/** Moves its child up and down by at most `range` px as the page scrolls past; stays put under reduced motion. Decoration for the photos that bridge two sections. */
export function Drift({ children, range = 12, className }: { children: ReactNode; range?: number; className?: string }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [-range, range]);
  return <m.div ref={ref} data-drift className={className} style={{ y: reduced ? 0 : y }}>{children}</m.div>;
}
