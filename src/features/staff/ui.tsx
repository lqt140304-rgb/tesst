import type { ReactNode } from 'react';
import { ButtonLink, Button, EmptyState, Icon, Skeleton, type IconName } from '@/ui';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/data/contracts/errors';
import { SERVICE_LABEL, SPECIES_LABEL, type Service, type Species } from '@/data/contracts/enums';
import { formatDayVi, formatShortDateVi, formatTimeVi, relativeDayVi } from '@/lib/dates';
import { formatPhoneVi } from '@/lib/phone';
import { paths } from '@/app/routes';
import { cx } from '@/lib/cx';
import s from './Staff.module.css';

export const SERVICE_ICON: Record<Service, IconName> = { kham: 'stethoscope', spa: 'scissors', noi_tru: 'house-paw' };
export const SPECIES_ICON: Record<Species, IconName> = { cat: 'cat-face', dog: 'dog-face', other: 'paw' };
/** Default duration per service (staff §4.1 confirm dialog). */
export const SERVICE_MINUTES: Record<Service, number> = { kham: 30, spa: 60, noi_tru: 30 };

/** "Thứ Ba 20/10" (toast and card wording, without the comma). */
export const dayLabel = (iso: string) => formatDayVi(iso).replace(',', '');
const SHORT_WD: Record<string, string> = { 'Thứ Hai': 'T2', 'Thứ Ba': 'T3', 'Thứ Tư': 'T4', 'Thứ Năm': 'T5', 'Thứ Sáu': 'T6', 'Thứ Bảy': 'T7', 'Chủ Nhật': 'CN' };
/** "T3 20/10" */
export function shortDay(iso: string): string {
  const [wd = '', d = ''] = formatDayVi(iso).split(', ');
  return `${SHORT_WD[wd] ?? wd} ${d}`;
}
/** "lúc 08:15 hôm nay" / "lúc 16:10 hôm qua" / "lúc 09:00 ngày 17/10" */
export function atWhen(iso: string, now: Date): string {
  const rel = relativeDayVi(iso, now);
  return `lúc ${formatTimeVi(iso)} ${rel ? rel.toLowerCase() : `ngày ${formatShortDateVi(iso)}`}`;
}

export function PageHeader({ title, sub, actions, eyebrow }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <header className={s.pageHead}>
      <div className={s.pageHeadText}>
        {eyebrow}
        <h1 className={s.h1}>{title}</h1>
        {sub && <p className={s.pageSub}>{sub}</p>}
      </div>
      {actions && <div className={s.pageActions}>{actions}</div>}
    </header>
  );
}

export function Panel({ title, icon, action, children, className, as: As = 'section' }: {
  title?: ReactNode; icon?: IconName; action?: ReactNode; children: ReactNode; className?: string; as?: 'section' | 'div';
}) {
  return (
    <As className={cx(s.panel, className)}>
      {title && <div className={s.panelHead}><h2 className={s.h2}>{icon && <Icon name={icon} size={18} />}{title}</h2>{action}</div>}
      {children}
    </As>
  );
}

export function ServiceChip({ service, short }: { service: Service; short?: boolean }) {
  return (
    <span className={cx(s.svc, s[`svc_${service}`])}>
      <Icon name={SERVICE_ICON[service]} size={14} />{short && service === 'kham' ? 'Khám' : short && service === 'spa' ? 'Spa' : SERVICE_LABEL[service]}
    </span>
  );
}

export function PetChip({ name, species, breed }: { name: string; species: Species; breed?: string }) {
  return (
    <span className={s.petChip}>
      <Icon name={SPECIES_ICON[species]} size={15} />
      <span><strong>{name}</strong> · {breed ? `${SPECIES_LABEL[species]} ${breed}` : SPECIES_LABEL[species]}</span>
    </span>
  );
}

/** Tap-to-call phone number (staff call from their phones). */
export function Tel({ e164, className }: { e164: string; className?: string }) {
  return <a href={`tel:${e164}`} className={cx(s.tel, className)}><Icon name="phone" size={14} />{formatPhoneVi(e164)}</a>;
}

/** The orange call-back flag (R11): orange-700 text on white, 3 px orange-500 bar, phone-redo icon. */
export function FlagBanner({ children }: { children: ReactNode }) {
  return <p className={s.flag}><Icon name="phone-redo" size={16} /><span>{children}</span></p>;
}

export function MiniTag({ children, tone = 'grey', icon }: { children: ReactNode; tone?: 'grey' | 'teal' | 'orange' | 'plum'; icon?: IconName }) {
  return <span className={cx(s.tag, s[`tag_${tone}`])}>{icon && <Icon name={icon} size={13} />}{children}</span>;
}

export function LoadingBlocks({ rows = 3 }: { rows?: number }) {
  return (
    <div className={s.loading} aria-busy="true" aria-label="Đang tải">
      <Skeleton h={30} w="40%" r={8} />
      {Array.from({ length: rows }, (_, i) => <Skeleton key={i} h={84} r={16} />)}
    </div>
  );
}

export function PageProblem({ error, onRetry }: { error: Error; onRetry: () => void }) {
  if (error instanceof NotFoundError) {
    return <EmptyState title="Không tìm thấy mục này" body="Có thể mục đã bị xóa hoặc đường dẫn đã thay đổi." action={<ButtonLink to={paths.nv.home} icon="layout-dashboard">Về Tổng quan</ButtonLink>} />;
  }
  if (error instanceof ForbiddenError) {
    return <EmptyState icon="lock" title="Mục này dành cho người có quyền phù hợp" body="Nếu bạn cần dùng, hãy nhờ quản lý cấp quyền." action={<ButtonLink to={paths.nv.home} icon="layout-dashboard">Về Tổng quan</ButtonLink>} />;
  }
  return <EmptyState icon="yarn-ball" title="Chưa tải được thông tin" body="Kết nối có thể đang chậm. Bạn thử lại nhé." action={<Button icon="refresh-cw" onClick={onRetry}>Thử lại</Button>} />;
}

/** First field message of a ValidationError, else the generic save failure (staff §2). */
export function saveError(e: unknown): string {
  if (e instanceof ValidationError) return Object.values(e.fields)[0] ?? 'Chưa lưu được. Vui lòng thử lại.';
  if (e instanceof ConflictError) return 'Mục này vừa được người khác cập nhật. Đã tải thông tin mới nhất — vui lòng kiểm tra lại.';
  return 'Chưa lưu được. Vui lòng thử lại.';
}

export function FormError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return <p className={s.formError} role="alert"><Icon name="info" size={16} />{children}</p>;
}

/** Append-only history ("Lịch sử"). */
export function Timeline({ items }: { items: { at: string; label: ReactNode; actor?: string; note?: string; icon?: IconName }[] }) {
  return (
    <ol className={s.timeline}>
      {items.map((e, i) => (
        <li key={i} className={s.tlItem}>
          <span className={s.tlDot} aria-hidden="true">{e.icon && <Icon name={e.icon} size={12} />}</span>
          <div>
            <p className={s.tlLabel}>{e.label}</p>
            {e.note && <p className={s.tlNote}>{e.note}</p>}
            <p className={s.meta}>{e.actor && <>{e.actor} · </>}<time dateTime={e.at} title={e.at}>{whenShort(e.at)}</time></p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** "08:42 · 19/10" */
export const whenShort = (iso: string) => `${formatTimeVi(iso)} · ${formatShortDateVi(iso)}`;
