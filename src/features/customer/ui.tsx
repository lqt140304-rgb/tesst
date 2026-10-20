import { useState, type ReactNode } from 'react';
import { m } from 'motion/react';
import { ButtonLink, Button, EmptyState, Icon, IconBadge, Skeleton, type IconName } from '@/ui';
import type { BadgeTone } from '@/ui/kit/Misc';
import { NotFoundError } from '@/data/contracts/errors';
import { SERVICE_LABEL, SPECIES_LABEL, type Service, type Species } from '@/data/contracts/enums';
import { dayOf, formatLongDayVi, formatTimeVi } from '@/lib/dates';
import { paths } from '@/app/routes';
import { cx } from '@/lib/cx';
import { svgArt } from '@/assets/media';
import { ease } from '@/ui/motion';
import s from './Customer.module.css';

export const HOTLINE = '097 355 51 05';
export const TEL = 'tel:+84973555105';
export const ADDRESS = '101 Khuất Duy Tiến, Nhân Chính, Thanh Xuân, Hà Nội';
/** The hospital's own Maps link (Global Constraints: used verbatim everywhere). */
export const MAPS = 'https://maps.app.goo.gl/xFbQ4BjKtGVa3rp86';

/** "15:00, thứ Tư 21/10/2026" */
export function whenVi(iso: string): string {
  const day = formatLongDayVi(iso).replace(',', '');
  return `${formatTimeVi(iso)}, ${day.charAt(0).toLowerCase()}${day.slice(1)}`;
}
export const serviceLabel = (sv: Service) => SERVICE_LABEL[sv];

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

const PET_TONES: BadgeTone[] = ['peach', 'mint', 'lilac', 'rose', 'cream'];
const SPECIES_ICON: Record<Species, IconName> = { cat: 'cat-face', dog: 'dog-face', other: 'paw' };
export const speciesIcon = (sp: Species) => SPECIES_ICON[sp];
/** Pastel species avatar; the colour is fixed per pet (from its name). */
export function PetAvatar({ name, species, size = 52 }: { name: string; species: Species; size?: 32 | 40 | 52 | 56 }) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return <IconBadge icon={SPECIES_ICON[species]} tone={PET_TONES[h % PET_TONES.length]!} size={size} />;
}

export function petLine(p: { species: Species; breed?: string; ageYears?: number }) {
  return [SPECIES_LABEL[p.species], p.breed, p.ageYears !== undefined ? (p.ageYears < 1 ? 'dưới 1 tuổi' : `khoảng ${p.ageYears} tuổi`) : undefined].filter(Boolean).join(' · ');
}

/** Big day number with month under it; outline style for a preferred (not agreed) date. */
export function DateBlock({ iso, outline, label }: { iso: string; outline?: boolean; label?: string }) {
  const d = dayOf(iso);
  return (
    <span className={cx(s.dateBlock, outline && s.dateOutline)} aria-hidden="true">
      <span className={s.dateDay}>{d.slice(8, 10)}</span>
      <span className={s.dateMonth}>Th{Number(d.slice(5, 7))}</span>
      {label && <span className={s.dateLabel}>{label}</span>}
    </span>
  );
}

export function LoadingBlocks({ rows = 3 }: { rows?: number }) {
  return (
    <div className={s.loading} aria-busy="true" aria-label="Đang tải">
      <Skeleton h={34} w="45%" r={10} />
      {Array.from({ length: rows }, (_, i) => <Skeleton key={i} h={96} r={20} />)}
    </div>
  );
}

/** Page error / not-found states (customer §8.2). */
export function PageProblem({ error, onRetry }: { error: Error; onRetry: () => void }) {
  if (error instanceof NotFoundError) {
    return (
      <EmptyState title="Không tìm thấy trang này" body="Có thể đường dẫn đã thay đổi."
        action={<ButtonLink to={paths.kh.home} icon="house-heart">Về Tổng quan</ButtonLink>} />
    );
  }
  return (
    <EmptyState art={<img src={svgArt('sketch-cartoon-cat')} alt="" className={s.problemArt} />} title="Chưa tải được thông tin"
      body={<>Có thể kết nối đang chậm. Bạn thử lại nhé, dữ liệu của bạn vẫn an toàn.<br />Hoặc gọi <a href={TEL}>{HOTLINE}</a></>}
      action={<Button icon="refresh-cw" onClick={onRetry}>Thử lại</Button>} />
  );
}

/** Copyable link code (R1, R21: clipboard with a select-the-text fallback). */
export function LinkCode({ code }: { code: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'manual'>('idle');
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setState('copied');
    } catch {
      setState('manual');
      const el = document.getElementById(`code-${code}`);
      if (el) window.getSelection()?.selectAllChildren(el);
    }
  }
  return (
    <span className={s.linkCode}>
      <span>Mã kết nối hồ sơ: <strong id={`code-${code}`} className={s.code}>{code}</strong></span>
      <Button size="sm" variant="secondary" icon={state === 'copied' ? 'check' : 'copy'} onClick={() => void copy()}>
        {state === 'copied' ? 'Đã sao chép' : 'Sao chép'}
      </Button>
      {state === 'manual' && <span className={s.small}>Bạn bấm giữ để sao chép nhé.</span>}
    </span>
  );
}

export function Section({ title, children, action, className }: { title: ReactNode; children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <section className={cx(s.section, className)}>
      <div className={s.sectionHead}><h2 className={s.h2}>{title}</h2>{action}</div>
      {children}
    </section>
  );
}

/** One-shot check mark (draws in once). */
export function DrawCheck({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="22" fill="var(--teal-50)" stroke="var(--teal-500)" strokeWidth="2.5" />
      <m.path d="M14 25 21 32 34 17" fill="none" stroke="var(--teal-700)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, ease: ease.out, delay: 0.15 }} />
    </svg>
  );
}

export { Icon };
