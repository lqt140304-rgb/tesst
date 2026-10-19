import { AppLink } from '@/app/nav';
import { paths } from '@/app/routes';
import { ButtonAnchor, IconBadge } from '@/ui';
import s from './Auth.module.css';

/** Forgot password (customer §7, R19): no OTP, no email — call the hospital or ask at the counter. */
export function ForgotPanel() {
  return (
    <div className={s.forgot}>
      <IconBadge icon="lock" tone="lilac" size={52} />
      <h1 className={s.h1}>Quên mật khẩu?</h1>
      <p className={s.body}>
        Để giữ an toàn cho hồ sơ của bé, mật khẩu chỉ được đặt lại sau khi nhân viên Lê Sơn xác nhận bạn là chủ tài khoản.
        Bạn gọi 097 355 51 05 hoặc báo nhân viên khi đến bệnh viện, nhân viên sẽ hướng dẫn bạn từng bước.
      </p>
      <ButtonAnchor href="tel:+84973555105" icon="phone" full>Gọi 097 355 51 05</ButtonAnchor>
      <AppLink to={paths.login} className={s.textLink}>Quay lại đăng nhập</AppLink>
      <p className={s.small}>Lê Sơn không bao giờ hỏi mật khẩu của bạn.</p>
      <p className={s.small}>Bạn là nhân viên? Bạn liên hệ quản lý để được cấp lại mật khẩu.</p>
    </div>
  );
}
