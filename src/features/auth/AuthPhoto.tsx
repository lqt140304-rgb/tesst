import { petPhoto } from '@/assets/media';
import { DemoTag } from '@/ui';
import s from './Auth.module.css';

/** Left column of the login / sign-up shell (part 2 §3.3): a photo in a quiet orbit, one handwritten-style line. Wide screens only. */
export function AuthPhoto() {
  return (
    <aside className={s.photoCol} aria-hidden="true">
      <div className={s.photoWrap}>
        <svg className={s.photoOrbit} viewBox="0 0 100 100" preserveAspectRatio="none" fill="none">
          <ellipse cx="50" cy="50" rx="49" ry="30" stroke="var(--plum-300)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" transform="rotate(-20 50 50)" />
          <ellipse cx="50" cy="50" rx="46" ry="38" stroke="var(--orange-500)" strokeOpacity=".55" strokeWidth="1" strokeDasharray="2 6" vectorEffect="non-scaling-stroke" transform="rotate(12 50 50)" />
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
