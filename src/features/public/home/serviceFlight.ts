import type { Service } from '@/data/contracts/enums';

/**
 * Dịch vụ → Đặt lịch, the click: the card's service badge is cloned where it was, and once the page has scrolled to the
 * form it flies (fixed position, Web Animations) onto the matching service choice, which gives a small one-shot sparkle.
 * Skipped when motion is reduced or the browser lacks Element.animate; the selection itself never depends on it.
 */
export function launchServiceFlight(service: Service, badge: HTMLElement | null) {
  if (!badge || typeof badge.animate !== 'function' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const r = badge.getBoundingClientRect();
  const start = { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width };
  const clone = badge.cloneNode(true) as HTMLElement;
  clone.setAttribute('data-service-flight', service);
  clone.setAttribute('aria-hidden', 'true');
  Object.assign(clone.style, { position: 'fixed', left: '0', top: '0', margin: '0', zIndex: '900', pointerEvents: 'none', transformOrigin: '0 0' });
  afterScroll().then(() => fly(service, clone, start));
}

function afterScroll(): Promise<void> {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => { if (!done) { done = true; window.removeEventListener('scrollend', finish); resolve(); } };
    // The homepage starts its smooth scroll on the next tick; wait for it to end (or give up after a second).
    setTimeout(() => { window.addEventListener('scrollend', finish, { once: true }); setTimeout(finish, 1000); }, 60);
  });
}

function fly(service: Service, clone: HTMLElement, start: { x: number; y: number; w: number }) {
  const target = document.querySelector<HTMLElement>(`#form-dat-lich [data-service-choice="${service}"]`);
  if (!target) return;
  const t = target.getBoundingClientRect();
  // Enter from just above the viewport (the card has scrolled away), arc in under the header, settle on the choice.
  const from = { x: start.x - window.scrollX, y: Math.max(start.y - window.scrollY, -70) };
  const scale = t.width / start.w;
  const mid = { x: Math.min(window.innerWidth - 80, t.left + 160), y: Math.max(110, t.top - 180) };
  document.body.append(clone);
  const run = clone.animate([
    { transform: `translate(${from.x}px, ${from.y}px) scale(1) rotate(0deg)`, opacity: 0.95 },
    { transform: `translate(${mid.x}px, ${mid.y}px) scale(${(1 + scale) / 2 + 0.15}) rotate(-12deg)`, opacity: 1, offset: 0.55 },
    { transform: `translate(${t.left}px, ${t.top}px) scale(${scale}) rotate(0deg)`, opacity: 1 },
  ], { duration: 900, easing: 'cubic-bezier(.2,.7,.2,1)' });
  run.finished.then(() => { clone.remove(); sparkle(target); }, () => clone.remove());
}

/** Six tiny dots burst out of the landed choice once. */
function sparkle(target: HTMLElement) {
  const r = target.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  for (let i = 0; i < 6; i++) {
    const dot = document.createElement('span');
    const a = (i / 6) * Math.PI * 2, d = r.width * 0.75;
    Object.assign(dot.style, {
      position: 'fixed', left: `${cx - 3}px`, top: `${cy - 3}px`, width: '6px', height: '6px', borderRadius: '50%', zIndex: '900',
      pointerEvents: 'none', background: i % 2 ? '#EA7A24' : '#824787',
    });
    document.body.append(dot);
    dot.animate([
      { transform: 'translate(0, 0) scale(.6)', opacity: 1 },
      { transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d}px) scale(1)`, opacity: 0 },
    ], { duration: 520, easing: 'cubic-bezier(.2,.7,.2,1)' }).finished.then(() => dot.remove(), () => dot.remove());
  }
  target.closest('[role="radio"]')?.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.04)' }, { transform: 'scale(1)' }], { duration: 360 });
}
