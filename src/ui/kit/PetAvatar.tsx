import { useState } from 'react';
import type { Species } from '@/data/contracts/enums';
import { petPhoto } from '@/assets/media';
import { cx } from '@/lib/cx';
import { Icon } from '../icons/Icon';
import type { IconName } from '../icons/names';
import s from './PetAvatar.module.css';

export const SPECIES_ICON: Record<Species, IconName> = { cat: 'cat-face', dog: 'dog-face', other: 'paw' };
export const SPECIES_TONE: Record<Species, 'lilac' | 'peach' | 'mint'> = { cat: 'lilac', dog: 'peach', other: 'mint' };

/** The pet's photo when it has one (redesign §5.2); otherwise the species icon on a pastel square. A broken photo falls back too. */
export function PetAvatar({ name, species, photoKey, size = 56, decorative = false, className }: {
  name: string; species: Species; photoKey?: string; size?: 40 | 56 | 96 | 160; decorative?: boolean; className?: string;
}) {
  const [broken, setBroken] = useState(false);
  const src = photoKey && !broken ? petPhoto(photoKey, 'avatar') : undefined;
  const box = cx(s.avatar, size >= 96 && s.large, className);
  if (src) {
    return (
      <span className={box} style={{ width: size, height: size }} data-pet-avatar="photo">
        <img src={src} alt={decorative ? '' : name} width={size} height={size} loading="lazy" decoding="async" onError={() => setBroken(true)} />
      </span>
    );
  }
  const a11y = decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': name };
  return (
    <span className={cx(box, s[SPECIES_TONE[species]])} style={{ width: size, height: size }} data-pet-avatar="icon" {...a11y}>
      <Icon name={SPECIES_ICON[species]} size={Math.round(size * 0.5)} />
    </span>
  );
}
