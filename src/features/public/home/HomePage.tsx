import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import { HeroOrbit } from '../hero/HeroOrbit';
import { About } from './sections/About';
import { AccountTeaser } from './sections/AccountTeaser';
import { Contact } from './sections/Contact';
import { Services } from './sections/Services';

/** One page; section routes (/dich-vu, /gioi-thieu, /lien-he) scroll to their section without remounting the hero. */
export default function HomePage() {
  const loc = useLocation();
  const firstLoad = useRef(true);
  useEffect(() => {
    const id = loc.pathname.replace(/^\//, '');
    const el = id ? document.getElementById(id) : null;
    const smooth = !firstLoad.current && !matchMedia('(prefers-reduced-motion: reduce)').matches;
    firstLoad.current = false;
    if (el) {
      const t = setTimeout(() => {
        el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
      }, smooth ? 0 : 60);
      return () => clearTimeout(t);
    }
    if (!id && !smooth) return;
    if (!id) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [loc.pathname, loc.search]);

  return (
    <main id="noi-dung" tabIndex={-1} style={{ overflowX: 'clip' }}>
      <HeroOrbit />
      <About />
      <Services />
      <AccountTeaser />
      <Contact />
    </main>
  );
}
