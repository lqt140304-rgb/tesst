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
