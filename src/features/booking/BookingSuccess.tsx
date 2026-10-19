import { useEffect, useRef } from 'react';
import { m } from 'motion/react';
import { paths } from '@/app/routes';
import { ButtonAnchor, ButtonLink, Button } from '@/ui';
import { dur, ease } from '@/ui/motion';
import s from './BookingForm.module.css';

function useFocusOnMount() {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return ref;
}

/** Same screen for a new request, a duplicate and a call-back flag (customer §3d): nothing about the backend leaks. */
export function BookingSuccess({ variant, phone, onAgain }: { variant: 'guest' | 'customer'; phone: string; onAgain: () => void }) {
  const title = useFocusOnMount();
  return (
    <div className={s.result}>
      <svg className={s.resultMark} viewBox="0 0 64 64" aria-hidden="true">
        <m.circle cx="32" cy="32" r="29" fill="var(--teal-50)" stroke="var(--teal-500)" strokeWidth="3"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: dur.draw, ease: ease.out }} />
        <m.path d="M20 33.5 28.5 42 45 24" fill="none" stroke="var(--teal-700)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: dur.l, ease: ease.out, delay: dur.draw * 0.6 }} />
      </svg>
      <h3 ref={title} tabIndex={-1} className={s.resultTitle}>Lê Sơn đã nhận yêu cầu của bạn</h3>
      <p className={s.resultBody}>
        Nhân viên sẽ gọi đến số <strong>{phone}</strong> để trao đổi và xác nhận lịch cho bé. Bạn để ý điện thoại giúp Lê Sơn nhé.
      </p>
      <p className={s.safety}>Nếu bé có dấu hiệu nặng hơn trong lúc chờ, hãy gọi ngay <a href="tel:+84973555105">097 355 51 05</a>.</p>
      {variant === 'guest' && <p className={s.resultBody}>Muốn theo dõi các lần đặt lịch sau ngay trên web? Tạo tài khoản Lê Sơn.</p>}
      <div className={s.resultActions}>
        {variant === 'guest'
          ? <ButtonLink to={paths.signup} icon="circle-user-round">Tạo tài khoản</ButtonLink>
          : <ButtonLink to={paths.kh.appts} icon="calendar-days">Xem yêu cầu của tôi</ButtonLink>}
        <Button variant="secondary" icon="send" onClick={onAgain}>Gửi thêm yêu cầu khác</Button>
      </div>
    </div>
  );
}

/** Save failed: never show success, keep everything the person typed (customer §3e). */
export function BookingFailure({ onRetry }: { onRetry: () => void }) {
  const title = useFocusOnMount();
  return (
    <div className={s.result}>
      <span className={s.failMark} aria-hidden="true">!</span>
      <h3 ref={title} tabIndex={-1} className={s.resultTitle}>Chưa gửi được yêu cầu</h3>
      <p className={s.resultBody}>
        Kết nối đang gặp trục trặc nên yêu cầu của bạn chưa được lưu. Bạn thử lại sau ít phút, hoặc gọi 097 355 51 05 để Lê Sơn ghi nhận giúp.
      </p>
      <div className={s.resultActions}>
        <Button icon="rotate-ccw" onClick={onRetry}>Thử lại</Button>
        <ButtonAnchor href="tel:+84973555105" variant="secondary" icon="phone">Gọi Lê Sơn</ButtonAnchor>
      </div>
    </div>
  );
}
