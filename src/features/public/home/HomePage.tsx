import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import { HeroOrbit } from '../hero/HeroOrbit';
import { ScrollThread } from './ScrollThread';
import p from './Pub.module.css';
import { About } from './sections/About';
import { Contact } from './sections/Contact';
import { Faq } from './sections/Faq';
import { Process } from './sections/Process';
import { Products } from './sections/Products';
import { Services } from './sections/Services';
import { Space } from './sections/Space';
import { Stories } from './sections/Stories';
import { Team } from './sections/Team';

/** One page; section routes (/dich-vu, /gioi-thieu, /lien-he) scroll to their section without remounting the hero. */
export default function HomePage() {
  const loc = useLocation();
  const firstLoad = useRef(true);
  const flow = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const id = loc.pathname.replace(/^\//, '');
    const el = id ? document.getElementById(id) : null;
    const smooth = !firstLoad.current && !matchMedia('(prefers-reduced-motion: reduce)').matches;
    firstLoad.current = false;
    if (el) {
      const t = setTimeout(() => {
        el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
      }, smooth ? 0 : 60);
      // Sections that arrive late (featured stories and products) change the height above the target; keep it in place until the person scrolls or two seconds pass.
      let touched = false;
      const stop = () => { touched = true; };
      const events = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;
      events.forEach((e) => window.addEventListener(e, stop, { passive: true }));
      const ro = typeof ResizeObserver === 'undefined' || !flow.current ? null : new ResizeObserver(() => { if (!touched) el.scrollIntoView({ behavior: 'auto', block: 'start' }); });
      ro?.observe(flow.current!);
      const end = setTimeout(() => ro?.disconnect(), 2000);
      return () => { clearTimeout(t); clearTimeout(end); ro?.disconnect(); events.forEach((e) => window.removeEventListener(e, stop)); };
    }
    // Mounting at / (e.g. from the booking page) starts at the top; already on the page, glide back up.
    if (!id) window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
  }, [loc.pathname, loc.search]);

  return (
    <main id="noi-dung" tabIndex={-1} style={{ overflowX: 'clip' }}>
      <HeroOrbit />
      <div ref={flow} data-pub className={p.flow}>
        <ScrollThread target={flow} />
        <About />
        <Services />
        <Team />
        <Stories />
        <Space />
        <Products />
        <Process />
        <Faq />
        <Contact />
      </div>
    </main>
  );
}
