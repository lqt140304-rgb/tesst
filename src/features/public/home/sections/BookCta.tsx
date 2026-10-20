import { m, useReducedMotion } from 'motion/react';
import { paths } from '@/app/routes';
import { ButtonLink } from '@/ui';
import { inView, preset } from '@/ui/motion';
import s from './BookCta.module.css';

/** The band that replaces the old homepage booking section (part 2 §3.1.5): the form lives on #/dat-lich. */
export function BookCta() {
  const reduced = useReducedMotion() ?? false;
  const p = preset('enterList', { reduced });
  return (
    <section id="hen-gap" className={s.band} aria-labelledby="hen-gap-title" data-book-cta>
      <m.div className={s.inner} initial={p.initial} whileInView={p.animate} viewport={inView} transition={p.transition}>
        <div>
          <h2 id="hen-gap-title" className={s.h2}>Hẹn gặp tại <em>Lê Sơn</em></h2>
          <p className={s.line}>Gửi yêu cầu, Lê Sơn sẽ gọi lại để xác nhận lịch hẹn.</p>
        </div>
        <ButtonLink to={paths.book} size="lg" iconRight="arrow-right">Gửi yêu cầu đặt lịch</ButtonLink>
      </m.div>
    </section>
  );
}
