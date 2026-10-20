import { petPhoto } from '@/assets/media';
import { DemoTag } from '@/ui';
import s from './Auth.module.css';

/** Left column of the login / sign-up shell (part 2 §3.3): a photo in a quiet orbit, one handwritten-style line. Wide screens only. */
export function AuthPhoto() {
  return (
    <aside className={s.photoCol} aria-hidden="true">
      <div className={s.photoWrap}>
        <svg className={s.photoOrbit} viewBox="0 0 520 520" fill="none">
          <ellipse cx="260" cy="270" rx="250" ry="200" stroke="var(--plum-300)" strokeWidth="1.2" transform="rotate(-14 260 270)" />
          <circle cx="40" cy="330" r="4" fill="var(--plum-500)" />
          <circle cx="470" cy="150" r="5" fill="var(--orange-500)" />
        </svg>
        <figure className={s.photoFrame}>
          <img src={petPhoto('cho-pom-trang', 'card')} alt="" width={507} height={619} />
          <DemoTag className={s.photoTag}>Ảnh minh họa</DemoTag>
        </figure>
      </div>
      <p className={s.photoLine}>Luôn đồng hành cùng thú cưng của bạn</p>
    </aside>
  );
}
