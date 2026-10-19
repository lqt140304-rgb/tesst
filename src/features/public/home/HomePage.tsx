import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import { HeroOrbit } from '../hero/HeroOrbit';
import { About } from './sections/About';
import { AccountTeaser } from './sections/AccountTeaser';
import { Booking } from './sections/Booking';
import { Contact } from './sections/Contact';
import { Services } from './sections/Services';
import { BookingSlot } from './BookingSlot';

/**
 * Where "Giới thiệu" should be scrolled to: the end of its pinned beat, where the hero frames have landed in the slots
 * (the simulator sets --gt-top / --pin-len; same formula as its END). In static mode the section is not pinned.
 */
function introLandedY(intro: HTMLElement): number | null {
  const pin = intro.closest<HTMLElement>('.gt-pin');
  if (!pin || pin.classList.contains('is-static')) return null;
  const top = parseFloat(intro.style.getPropertyValue('--gt-top')) || 0;
  const len = parseFloat(pin.style.getPropertyValue('--pin-len')) || 0;
  return Math.max(0, pin.getBoundingClientRect().top + window.scrollY - top + len * 0.75);
}

/** One page; section routes (/dich-vu, /dat-lich, …) scroll to their section without remounting the hero. */
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
        const landed = id === 'gioi-thieu' ? introLandedY(el) : null;
        if (landed !== null) window.scrollTo({ top: landed, behavior: smooth ? 'smooth' : 'auto' });
        else el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
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
      <Booking form={<BookingSlot />} />
      <AccountTeaser />
      <Contact />
    </main>
  );
}
