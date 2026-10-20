import type { TargetAndTransition, Transition } from 'motion/react';
/** Motion tokens (proposal-visual.md §4.3). */
export const ease = {
  out: [0.2, 0.7, 0.2, 1] as const,
  outExpo: [0.16, 1, 0.3, 1] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
  in: [0.4, 0, 1, 1] as const,
  pop: [0.34, 1.56, 0.64, 1] as const,
};
export const dur = { xs: 0.12, s: 0.18, m: 0.24, l: 0.36, xl: 0.6, draw: 0.9 };
export const spring = {
  glide: { type: 'spring' as const, bounce: 0, visualDuration: 0.3 },
  pop: { type: 'spring' as const, bounce: 0.25, visualDuration: 0.35 },
};
/** Reveal-on-scroll defaults: once, never loops. */
export const inView = { once: true, amount: 0.25, margin: '0px 0px -10% 0px' } as const;

export const riseIn = (distance = 16, delay = 0) => ({
  initial: { opacity: 0, y: distance },
  whileInView: { opacity: 1, y: 0 },
  viewport: inView,
  transition: { duration: dur.xl, ease: ease.out, delay },
});

/** Presets for the redesign (docs/tham-khao/de-xuat-animation-tung-man-2026-10-20.md): short, 8–12 px, no bounce, once. */
export type PresetName = 'enterList' | 'enterPanel' | 'tabSlide' | 'flashOnce' | 'chartRise' | 'fadeSwap';
export type MotionPreset = { initial: false | TargetAndTransition; animate: TargetAndTransition; transition: Transition & { duration?: number; delay?: number } };

const fadeOnly: MotionPreset = { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.1 } };

export function preset(name: PresetName, { reduced = false, index = 0 }: { reduced?: boolean; index?: number } = {}): MotionPreset {
  if (name === 'flashOnce') {
    // Colour, not movement: kept under reduced motion so the update is still noticed.
    return { initial: { backgroundColor: 'rgba(241, 230, 243, 1)' }, animate: { backgroundColor: 'rgba(241, 230, 243, 0)' }, transition: { duration: 0.6, ease: ease.out } }; // --plum-100 → clear
  }
  if (name === 'enterList' && index >= 5) return { initial: false, animate: {}, transition: {} };
  if (reduced) return name === 'tabSlide' ? { initial: false, animate: {}, transition: { duration: 0 } } : fadeOnly;
  switch (name) {
    case 'enterList': return { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.28, ease: ease.out, delay: index * 0.06 } };
    case 'enterPanel': return { initial: { opacity: 0, x: 12 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.22, ease: ease.out } };
    case 'tabSlide': return { initial: false, animate: {}, transition: { duration: 0.18, ease: ease.out } };
    case 'chartRise': return { initial: { scaleY: 0, originY: 1 }, animate: { scaleY: 1 }, transition: { duration: 0.45, ease: ease.out } };
    case 'fadeSwap': return { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.15, ease: ease.out } };
  }
}
