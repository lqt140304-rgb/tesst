import type { ReactNode } from 'react';
import { m } from 'motion/react';
import { svgArt } from '@/assets/media';
import { Icon } from '@/ui';
import { ease, inView } from '@/ui/motion';
import { cx } from '@/lib/cx';
import { Reveal } from './Decor';
import s from '../Home.module.css';

const STEPS = [
  ['Bạn gửi yêu cầu', 'Cho Lê Sơn biết bé cần gì và ngày bạn mong muốn.'],
  ['Lê Sơn gọi lại', 'Nhân viên gọi vào số bạn để lại để trao đổi và chọn giờ phù hợp.'],
  ['Lịch hẹn được xác nhận', 'Lịch chỉ được xác nhận sau khi hai bên đã thống nhất qua điện thoại.'],
] as const;

export function Booking({ form }: { form: ReactNode }) {
  return (
    <section id="dat-lich" className={cx(s.section, s.lilac)} aria-labelledby="dat-lich-title">
      <div className={cx(s.wrap, s.bookGrid)}>
        <Reveal className={s.bookIntro}>
          <p className={s.eyebrow}>ĐẶT LỊCH</p>
          <h2 id="dat-lich-title" className={s.h2}>Gửi yêu cầu đặt lịch</h2>
          <p className={s.sub}>Bạn không cần tài khoản. Sau khi nhận yêu cầu, nhân viên Lê Sơn sẽ gọi để cùng bạn chốt thời gian.</p>
          <ol className={s.steps}>
            <svg className={s.stepLine} viewBox="0 0 2 100" preserveAspectRatio="none" aria-hidden="true">
              <m.line x1="1" y1="0" x2="1" y2="100" stroke="var(--plum-200)" strokeWidth="2" pathLength={1}
                initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={inView} transition={{ duration: 1, ease: ease.inOut }} />
            </svg>
            {STEPS.map(([title, text], i) => (
              <li key={title} className={s.step}>
                <span className={s.stepDot}>{i + 1}</span>
                <div><p className={s.stepTitle}>{title}</p><p className={s.stepText}>{text}</p></div>
              </li>
            ))}
          </ol>
          <div className={s.emergency} role="note">
            <Icon name="heart-pulse" size={24} />
            <p><strong>Bé cần cấp cứu?</strong> Bạn gọi ngay <a href="tel:+84973555105">097 355 51 05</a> thay vì gửi yêu cầu, Lê Sơn tiếp nhận cấp cứu 24/24.</p>
          </div>
          <img className={s.bookArt} src={svgArt('cat-pose-booking')} alt="" aria-hidden="true" />
        </Reveal>
        <Reveal delay={0.1} className={s.formSlot}>{form}</Reveal>
      </div>
    </section>
  );
}
