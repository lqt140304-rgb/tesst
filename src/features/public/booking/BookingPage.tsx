import { useLayoutEffect } from 'react';
import { m, useReducedMotion } from 'motion/react';
import { useLocation } from 'react-router';
import { BookingForm } from '@/features/booking/BookingForm';
import { SERVICES, type Service } from '@/data/contracts/enums';
import { useMedia } from '@/lib/useMedia';
import { Icon, type IconName } from '@/ui';
import { preset } from '@/ui/motion';
import s from './BookingPage.module.css';

const STEPS: [IconName, string, string][] = [
  ['send', 'Gửi yêu cầu', 'Điền thông tin đặt lịch cho thú cưng.'],
  ['phone', 'Lê Sơn liên hệ', 'Lê Sơn sẽ gọi lại để xác nhận lịch hẹn.'],
  ['calendar-check', 'Xác nhận lịch hẹn', 'Hoàn tất và sẵn sàng gặp bác sĩ.'],
];

/** #/dat-lich — the booking page (part 2 §3.2): intro + steps + hotline beside the form; `?dich-vu=` preselects a service. */
export function BookingPage() {
  const { search } = useLocation();
  const reduced = useReducedMotion() ?? false;
  // Phones: the three steps fold under one line so the form comes into view first (review 21/10).
  const wide = useMedia('(min-width: 768px)');
  const raw = new URLSearchParams(search).get('dich-vu');
  const service = (SERVICES as readonly string[]).includes(raw ?? '') ? (raw as Service) : undefined;
  // Same zone as the homepage, so nothing else resets the scroll: arriving from a CTA far down must start at the heading.
  useLayoutEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <main id="noi-dung" tabIndex={-1} className={s.page} data-page>
      <div className={s.intro}>
        <h1 className={s.h1}>Hẹn gặp tại <em>Lê Sơn</em></h1>
        <p className={s.lead}>Đặt lịch khám nhanh chóng, để thú cưng được chăm sóc kịp thời và chu đáo.</p>
        <details className={s.how} open={wide || undefined}>
          <summary className={s.howSummary}>Cách đặt lịch (3 bước)</summary>
        <ol className={s.steps}>
          {STEPS.map(([icon, title, line], i) => {
            const p = preset('enterList', { reduced, index: i });
            return (
              <m.li key={title} className={s.step} data-book-step initial={p.initial} animate={p.animate} transition={p.transition}>
                <span className={s.stepIcon} aria-hidden="true"><Icon name={icon} size={20} /></span>
                <span><h2 className={s.stepTitle}>{title}</h2><span className={s.stepLine}>{line}</span></span>
              </m.li>
            );
          })}
        </ol>
        </details>
      </div>
      <section className={s.card} aria-labelledby="dat-lich-title">
        <h2 id="dat-lich-title" className={s.cardTitle}>Gửi yêu cầu đặt lịch</h2>
        <p className={s.cardSub}>Vui lòng điền thông tin, Lê Sơn sẽ liên hệ xác nhận lịch hẹn.</p>
        <BookingForm initialService={service} bare />
        <p className={s.note}><Icon name="info" size={16} /> Lịch hẹn được xác nhận sau khi Lê Sơn liên hệ.</p>
      </section>
      <aside className={s.hotline} aria-label="Hotline hỗ trợ">
        <span className={s.hotIcon} aria-hidden="true"><Icon name="phone" size={22} /></span>
        <span>
          <span className={s.hotLabel}>Hotline hỗ trợ</span>
          <a className={s.hotNumber} href="tel:+84973555105">097 355 51 05</a>
        </span>
      </aside>
    </main>
  );
}
