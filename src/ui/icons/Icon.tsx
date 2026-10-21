import { APPROVED, CUSTOM } from './custom';
import { DUOTONE } from './duotone.generated';
import type { IconName } from './names';

/** Optical stroke per render size (proposal-visual.md §5.3), in 24-unit space — for the hand-drawn icons; Phosphor icons are filled shapes. */
export function opticalStroke(size: number): number {
  if (size <= 14) return 2.5;
  if (size <= 16) return 2.25;
  if (size >= 40) return 1.5;
  return 2;
}

type Props = { name: IconName; size?: number; label?: string; className?: string; strokeWidth?: number };

export function Icon({ name, size = 20, label, className, strokeWidth }: Props) {
  const sw = strokeWidth ?? opticalStroke(size);
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true as const, focusable: 'false' as const };
  const duo = DUOTONE[name];
  if (duo) {
    // Phosphor Duotone (owner's choice, 21/10/2026): a 20% back shape plus the line, drawn from the generated table.
    return (
      <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor" className={className} data-icon={name} {...a11y}>
        {duo.map(([d, opacity]) => <path key={d} d={d} opacity={opacity} />)}
      </svg>
    );
  }
  const body = APPROVED[name] ?? CUSTOM[name];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className} data-icon={name} {...a11y}>
      {body}
    </svg>
  );
}

export const hasIcon = (name: string) => !!(DUOTONE[name] ?? APPROVED[name] ?? CUSTOM[name]);
