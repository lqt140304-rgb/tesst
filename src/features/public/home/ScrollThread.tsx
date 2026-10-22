import type { RefObject } from 'react';
import { m, useScroll, useTransform } from 'motion/react';
import { useReducedMotion } from '@/ui/motion';
import p from './Pub.module.css';

/** A thin plum line down the page that is drawn as the person scrolls; already full under reduced motion. Decoration only. */
export function ScrollThread({ target }: { target: RefObject<HTMLElement | null> }) {
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target, offset: ['start 70%', 'end 55%'] });
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);
  return <m.div aria-hidden="true" data-thread className={p.thread} style={{ scaleY: reduced ? 1 : scaleY, transformOrigin: 'top' }} />;
}
