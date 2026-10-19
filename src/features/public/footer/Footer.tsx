import { AppLink } from '@/app/nav';
import { paths } from '@/app/routes';
import { logoUrl } from '@/assets/media';
import { Icon } from '@/ui';
import { DrawArc } from '@/features/public/home/sections/Decor';
import s from './Footer.module.css';

export function Footer() {
  return (
    <footer className={s.footer}>
      <DrawArc className={s.arc} viewBox="0 0 420 260" d="M10 250 C 80 80, 260 20, 410 30" width={1.6} />
      <div className={s.paws} aria-hidden="true"><Icon name="paw" size={22} /><Icon name="paw" size={22} /><Icon name="paw" size={22} /></div>
      <div className={s.grid}>
        <div className={s.brand}>
          <span className={s.logoTile}><img src={logoUrl} alt="Logo Bệnh viện Thú y Lê Sơn" width={74} height={67} loading="lazy" /></span>
          <p className={s.name}>Bệnh Viện Thú Y Lê Sơn</p>
          <p className={s.tag}>Không gian lớn cho những người bạn nhỏ.</p>
        </div>
        <div>
          <p className={s.h}>LIÊN HỆ</p>
          <ul className={s.list}>
            <li>101 Khuất Duy Tiến, Nhân Chính, Thanh Xuân, Hà Nội</li>
            <li><a href="tel:+84973555105">097 355 51 05</a></li>
            <li>Cấp cứu: tiếp nhận 24/24</li>
          </ul>
        </div>
        <div>
          <p className={s.h}>KHÁM PHÁ</p>
          <ul className={s.list}>
            <li><AppLink to={paths.section('gioi-thieu')}>Giới thiệu</AppLink></li>
            <li><AppLink to={paths.section('dich-vu')}>Dịch vụ</AppLink></li>
            <li><AppLink to={paths.section('dat-lich')}>Gửi yêu cầu đặt lịch</AppLink></li>
            <li><AppLink to={paths.section('lien-he')}>Liên hệ</AppLink></li>
          </ul>
        </div>
        <div>
          <p className={s.h}>TÀI KHOẢN</p>
          <ul className={s.list}>
            <li><AppLink to={paths.login}>Đăng nhập</AppLink></li>
            <li><AppLink to={paths.signup}>Đăng ký</AppLink></li>
            <li><AppLink to={paths.loginStaff}>Dành cho nhân viên</AppLink></li>
          </ul>
        </div>
      </div>
      <div className={s.bottom}>
        <span>© 2026 Bệnh Viện Thú Y Lê Sơn · Ảnh trên trang là ảnh minh họa.</span>
      </div>
    </footer>
  );
}
