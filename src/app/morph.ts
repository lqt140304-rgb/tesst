import { flushSync } from 'react-dom';

/**
 * Trang chủ → Đăng nhập / Đăng ký: a cross-page morph with the View Transitions API. The hero's orbit and three
 * frames are snapshotted, the zone swaps synchronously (no exit fade), and the browser morphs them into the portal's
 * orbit window (elements named lt-orbit / lt-frame-1..3 on both pages). Unsupported browsers, narrow screens and
 * reduced motion keep the normal zone fade.
 */
let morphing = false;

/** Read during render: true while a morph navigation is being committed (zone swap must be instant). */
export const isMorphing = () => morphing;

export function canMorphToPortal(): boolean {
  return typeof document !== 'undefined' && 'startViewTransition' in document && window.innerWidth >= 993 &&
    !matchMedia('(prefers-reduced-motion: reduce)').matches && !!document.querySelector('.ho__frames .frame');
}

/** Name the three largest visible hero frames (left → right) and the orbit, matching the portal's names. */
function tagHero(): () => void {
  const vh = window.innerHeight;
  const frames = [...document.querySelectorAll<HTMLElement>('.ho__frames .frame')]
    .map((el) => ({ el, r: el.getBoundingClientRect(), o: Number(getComputedStyle(el).opacity) }))
    .filter((f) => f.o > 0.4 && f.r.bottom > 80 && f.r.top < vh - 40 && f.r.width > 40)
    .sort((a, b) => b.r.width - a.r.width).slice(0, 3)
    .sort((a, b) => a.r.left - b.r.left);
  const tagged: HTMLElement[] = [];
  frames.forEach((f, i) => { f.el.style.viewTransitionName = `lt-frame-${i + 1}`; tagged.push(f.el); });
  const orbit = document.querySelector<HTMLElement>('.ho__orbits');
  if (orbit) { orbit.style.viewTransitionName = 'lt-orbit'; tagged.push(orbit); }
  return () => tagged.forEach((el) => { el.style.viewTransitionName = ''; });
}

function until(test: () => boolean, ms = 2500): Promise<void> {
  return new Promise((resolve) => {
    const t0 = performance.now();
    const tick = () => (test() || performance.now() - t0 > ms ? resolve() : setTimeout(tick, 16));
    tick();
  });
}

export async function morphToPortal(go: () => void, preload: () => Promise<unknown>): Promise<void> {
  await preload();                       // the auth chunk is ready before the old page is snapshotted
  const untag = tagHero();
  const vt = document.startViewTransition(async () => {
    morphing = true;
    flushSync(go);
    await until(() => !!document.querySelector('[data-auth-card]'));
    window.scrollTo(0, 0);
  });
  vt.finished.finally(() => { morphing = false; untag(); });
  await vt.updateCallbackDone.catch(() => undefined);
  morphing = false;
}
