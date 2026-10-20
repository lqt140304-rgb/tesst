import { m, useReducedMotion } from 'motion/react';
import { teamPhoto } from '@/assets/media';
import { inView, preset } from '@/ui/motion';
import s from './Team.module.css';

/** "Đội ngũ" (part 2 §3.1.4): the head doctor only — name and one line, no credentials. A real photo, so no sample tag. */
export function Team() {
  const reduced = useReducedMotion() ?? false;
  const p = preset('enterList', { reduced });
  return (
    <section id="doi-ngu" className={s.section} aria-labelledby="doi-ngu-title">
      <m.div className={s.inner} initial={p.initial} whileInView={p.animate} viewport={inView} transition={p.transition}>
        <figure className={s.photo}>
          <img src={teamPhoto()} alt="Bác sĩ trưởng Lê Thái Sơn" width={720} height={1636} loading="lazy" decoding="async" />
        </figure>
        <div className={s.text}>
          <h2 id="doi-ngu-title" className={s.h2}>Đội ngũ</h2>
          <p className={s.role}>Bác sĩ trưởng</p>
          <p className={s.name}>Lê Thái Sơn</p>
          <p className={s.line}>Đồng hành cùng thú cưng mỗi ngày.</p>
        </div>
      </m.div>
    </section>
  );
}
