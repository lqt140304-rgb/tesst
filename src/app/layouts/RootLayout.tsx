import { useEffect, useRef } from 'react';
import { AnimatePresence, domMax, LazyMotion, m, MotionConfig } from 'motion/react';
import { ToastProvider } from '@/ui';
import { useHandle } from '../handle';
import { SessionProvider } from '../session/SessionProvider';
import { DemoChip, StorageBanner } from '../system/System';
import { FrozenOutlet, TransitionScope, useStableLocation } from '../transition';
import { ease } from '@/ui/motion';

/** Level 1: zone transitions. Opacity + translate only (never scale): the hero measures positions. */
function ZoneSwitch() {
  const { zone, pageKey, title } = useHandle();
  const loc = useStableLocation();
  const first = useRef(true);

  useEffect(() => {
    document.title = title ? `${title} · Lê Sơn` : 'Bệnh viện Thú y Lê Sơn';
  }, [title]);

  // After client-side navigation (not first load): move focus to the new page's h1 for screen readers.
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => {
      const h1 = document.querySelector<HTMLElement>('main h1, [data-page] h1');
      if (h1) { if (!h1.hasAttribute('tabindex')) h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
    }, 420);
    return () => clearTimeout(t);
  }, [pageKey]);

  return (
    <AnimatePresence mode="wait" initial={false} onExitComplete={() => { if (!/^\/(dich-vu|dat-lich|gioi-thieu|lien-he)$/.test(loc.pathname)) window.scrollTo(0, 0); }}>
      <m.div key={zone} data-zone={zone}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.32, ease: ease.out } }}
        exit={{ opacity: 0, y: -8, transition: { duration: 0.2, ease: ease.in } }}>
        <TransitionScope><FrozenOutlet /></TransitionScope>
      </m.div>
    </AnimatePresence>
  );
}

export function RootLayout() {
  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user">
        <SessionProvider>
          <ToastProvider>
            <a className="skip-link" href="#noi-dung" onClick={(e) => { e.preventDefault(); document.getElementById('noi-dung')?.focus(); document.getElementById('noi-dung')?.scrollIntoView(); }}>
              Chuyển đến nội dung chính
            </a>
            {/* Every zone, not only the public site: storage fallback and the day-rollover offer (tech §8.2). */}
            <StorageBanner />
            <ZoneSwitch />
            <DemoChip />
          </ToastProvider>
        </SessionProvider>
      </MotionConfig>
    </LazyMotion>
  );
}
