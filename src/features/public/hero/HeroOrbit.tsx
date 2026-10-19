import { memo, useEffect, useRef, type CSSProperties } from 'react';
import { AppLink } from '@/app/nav';
import { paths } from '@/app/routes';
import './hero-orbit.css';
import './hero-photos.css';
import { mountHeroOrbit } from './hero-orbit.js';

/** Static markup is owned by React and never re-renders (memo, no props/state);
 *  the vanilla simulator owns only .ho__frames children, the orbit <svg>, inline styles and state classes. */
export const HeroOrbit = memo(function HeroOrbit() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const destroy = mountHeroOrbit(ref.current!);
    return destroy;
  }, []);
  return (
<div className="ho-wrap">
<section ref={ref} className="ho" id="hero-main" aria-label="Giới thiệu Bệnh viện Thú y Lê Sơn">
  
  <div className="ho__main">
    <section className="ho__content" aria-labelledby="hero-title">
      <span className="burst" aria-hidden="true"></span>
      <p className="eyebrow reveal" style={{'--i': '0'} as CSSProperties}><span data-measure="">CHÀO MỪNG ĐẾN VỚI LÊ SƠN</span></p>
      <h1 className="ho-title" id="hero-title">
        <span className="line reveal" style={{'--i': '1'} as CSSProperties}><span data-measure="">Không gian lớn</span></span>
        <span className="line reveal" style={{'--i': '2'} as CSSProperties}><span data-measure="">cho những <em>người bạn nhỏ</em></span></span>
      </h1>
      <p className="subtitle reveal" style={{'--i': '3'} as CSSProperties} data-measure="">Chăm sóc bằng chuyên môn, đồng hành bằng sự thấu hiểu.</p>
      <div className="cta reveal" style={{'--i': '4'} as CSSProperties}>
        <AppLink className="btn btn--primary" to={paths.section('dat-lich')} data-measure="">Gửi yêu cầu đặt lịch <span className="arrow" aria-hidden="true">→</span></AppLink>
      </div>
    </section>

    <p className="preview-tag">Ảnh minh họa</p>
    <button className="motion-toggle" type="button" aria-pressed="false">
      <svg className="ico-pause" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><rect x="3.5" y="2.5" width="3" height="11" rx="1"/><rect x="9.5" y="2.5" width="3" height="11" rx="1"/></svg>
      <svg className="ico-play" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4.5 2.8v10.4a.8.8 0 0 0 1.2.7l8.2-5.2a.8.8 0 0 0 0-1.4L5.7 2.1a.8.8 0 0 0-1.2.7z"/></svg>
      <span className="motion-toggle__label">Tạm dừng chuyển động</span>
    </button>
  </div>

  
  
  <div className="ho__bg" aria-hidden="true">
    <span className="blob blob--1"></span>
    <span className="blob blob--2"></span>
    <span className="blob blob--3"></span>
    <span className="blob blob--4"></span>
    <span className="blob blob--5"></span>
    <span className="blob blob--6"></span>
    <span className="ghost" style={{'left': '-3%', 'top': '62%', '--g': '150px', '--r': '-14deg'} as CSSProperties}></span>
    <span className="ghost" style={{'left': '85%', 'top': '76%', '--g': '190px', '--r': '12deg'} as CSSProperties}></span>
    <span className="ghost" style={{'left': '89%', 'top': '8%', '--g': '110px', '--r': '8deg', 'opacity': '.4'} as CSSProperties}></span>
  </div>

  
  <div className="ho__orbits" aria-hidden="true">
    <svg focusable="false"></svg>
    <span className="comet"></span>
  </div>

  
  <div className="ho__decor" aria-hidden="true">
    <svg width="0" height="0" style={{'position': 'absolute'} as CSSProperties}>
      <defs>
        <symbol id="i-paw" viewBox="0 0 24 24">
          <path fill="currentColor" d="M12 11.2c-3.1 0-6.4 3.3-6.4 6.1 0 1.9 1.5 2.9 3.2 2.9 1.3 0 2.1-.6 3.2-.6s1.9.6 3.2.6c1.7 0 3.2-1 3.2-2.9 0-2.8-3.3-6.1-6.4-6.1z"/>
          <ellipse fill="currentColor" cx="5" cy="10.4" rx="2.1" ry="2.7" transform="rotate(-22 5 10.4)"/>
          <ellipse fill="currentColor" cx="9.3" cy="5.9" rx="2.2" ry="2.9" transform="rotate(-8 9.3 5.9)"/>
          <ellipse fill="currentColor" cx="14.7" cy="5.9" rx="2.2" ry="2.9" transform="rotate(8 14.7 5.9)"/>
          <ellipse fill="currentColor" cx="19" cy="10.4" rx="2.1" ry="2.7" transform="rotate(22 19 10.4)"/>
        </symbol>
        <symbol id="i-sparkle" viewBox="0 0 24 24">
          <path fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" d="M12 1.5c.7 6 3.5 9.4 10.5 10.5-7 1.1-9.8 4.5-10.5 10.5-.7-6-3.5-9.4-10.5-10.5 7-1.1 9.8-4.5 10.5-10.5z"/>
        </symbol>
        <symbol id="i-sparkle-solid" viewBox="0 0 24 24">
          <path fill="currentColor" d="M12 1.5c.7 6 3.5 9.4 10.5 10.5-7 1.1-9.8 4.5-10.5 10.5-.7-6-3.5-9.4-10.5-10.5 7-1.1 9.8-4.5 10.5-10.5z"/>
        </symbol>
        <symbol id="i-heart" viewBox="0 0 24 24">
          <path fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" d="M12 20.3c-.3 0-8.6-4.9-8.6-10.9 0-2.8 2-4.9 4.6-4.9 1.8 0 3.2 1 4 2.6.8-1.6 2.2-2.6 4-2.6 2.6 0 4.6 2.1 4.6 4.9 0 2.2-1.1 4.3-2.6 6.1"/>
        </symbol>
        <symbol id="i-flower" viewBox="0 0 24 24">
          <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="12" cy="12" r="4.2"/>
            <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>
          </g>
        </symbol>
      </defs>
    </svg>
    
    <span className="decor-item c-orange hide-sm" style={{'--x': 'calc(var(--tx) - var(--l1) - 84px)', '--y': 'calc(var(--ty) - var(--th) * .5)', '--s': '22px', '--d': '1'} as CSSProperties}><svg><use href="#i-sparkle"/></svg></span>
    <span className="decor-item c-plum-soft hide-sm" style={{'--x': 'calc(var(--tx) + var(--l1) + 44px)', '--y': 'calc(var(--ty) - var(--th) * .55)', '--s': '30px', '--r': '12deg', '--d': '2'} as CSSProperties}><svg><use href="#i-heart"/></svg></span>
    <span className="decor-item c-plum near-far" style={{'--x': 'calc(var(--tx) + var(--tw) + 58px)', '--y': 'calc(var(--ty) + var(--th) * .45)', '--s': '24px', '--r': '18deg', '--d': '3'} as CSSProperties}><svg><use href="#i-paw"/></svg></span>
    <span className="decor-item c-orange near-far" style={{'--x': 'calc(var(--tx) + var(--tw) + 112px)', '--y': 'calc(var(--ty) - var(--th) * .3)', '--s': '20px', '--d': '6'} as CSSProperties}><svg><use href="#i-sparkle"/></svg></span>
    
    <span className="decor-item c-plum hide-sm" style={{'--x': '20%', '--y': '22%', '--s': '26px', '--r': '-18deg', '--d': '0'} as CSSProperties}><svg><use href="#i-paw"/></svg></span>
    <span className="decor-item c-plum-soft hide-sm" style={{'--x': '79%', '--y': '20%', '--s': '22px', '--d': '4'} as CSSProperties}><svg><use href="#i-flower"/></svg></span>
    <span className="decor-item c-peach hide-sm" style={{'--x': '7%', '--y': '60%', '--s': '30px', '--r': '-12deg', '--d': '5'} as CSSProperties}><svg><use href="#i-paw"/></svg></span>
    <span className="decor-item c-plum hide-sm" style={{'--x': '96%', '--y': '53%', '--s': '22px', '--r': '20deg', '--d': '6'} as CSSProperties}><svg><use href="#i-paw"/></svg></span>
    <span className="decor-item c-plum" style={{'--x': '74%', '--y': '80%', '--s': '26px', '--r': '14deg', '--d': '7'} as CSSProperties}><svg><use href="#i-paw"/></svg></span>
    <span className="decor-item c-orange" style={{'--x': '13%', '--y': '80%', '--s': '16px', '--o': '.85', '--d': '8'} as CSSProperties}><svg><use href="#i-sparkle-solid"/></svg></span>
    <span className="decor-item c-peach" style={{'--x': '36%', '--y': '87%', '--s': '20px', '--r': '24deg', '--d': '9'} as CSSProperties}><svg><use href="#i-paw"/></svg></span>
    <span className="decor-item c-orange hide-sm" style={{'--x': '89%', '--y': '30%', '--s': '14px', '--o': '.8', '--d': '10'} as CSSProperties}><svg><use href="#i-sparkle-solid"/></svg></span>
  </div>

  
  <div className="ho__frames" aria-hidden="true"></div>
</section>
</div>
  );
});
