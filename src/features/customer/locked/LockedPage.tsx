import { paths } from '@/app/routes';
import { customer } from '@/data/customer';
import { useQuery } from '@/data/hooks/useQuery';
import { ButtonLink, Icon, IconBadge } from '@/ui';
import { HOTLINE, LinkCode, TEL } from '../ui';
import s from '../Customer.module.css';

const COPY = {
  stays: {
    icon: 'house-paw', title: 'Nhật ký và video nội trú sẽ hiện ở đây sau khi liên kết hồ sơ',
    body: 'Hình ảnh và thông tin chăm sóc của bé chỉ được chia sẻ với đúng chủ hồ sơ.',
  },
  invoices: {
    icon: 'receipt', title: 'Hóa đơn sẽ hiện ở đây sau khi liên kết hồ sơ',
    body: 'Lê Sơn chỉ hiển thị hóa đơn khi đã chắc chắn đây là tài khoản của chủ hồ sơ.',
  },
} as const;

/** Full-page explainer for Nội trú / Hóa đơn before linking (customer §9.3 with R1: link code, never automatic, never by phone). */
export function LockedPage({ kind }: { kind: keyof typeof COPY }) {
  const c = COPY[kind];
  const acc = useQuery(() => customer.account.get(), []);
  return (
    <section className={s.locked}>
      <span className={s.lockedBadge}>
        <IconBadge icon={c.icon} tone="lilac" size={56} />
        <span className={s.lockedLock} aria-hidden="true"><Icon name="lock" size={14} /></span>
      </span>
      <h1 className={s.h1}>{c.title}</h1>
      <p className={s.lockedBody}>{c.body} Lần tới khi đến Lê Sơn, bạn mở trang này và đưa mã cho nhân viên để được liên kết.</p>
      {acc.data && <LinkCode code={acc.data.linkCode} />}
      <ButtonLink to={paths.kh.home} variant="secondary" icon="house-heart">Về Tổng quan</ButtonLink>
      <p className={s.small}>Có thắc mắc? Gọi <a href={TEL}>{HOTLINE}</a>.</p>
    </section>
  );
}
