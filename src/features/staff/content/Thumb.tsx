import { Icon } from '@/ui';
import { useFeaturedImage } from '@/features/public/home/useFeaturedImage';
import c from './Content.module.css';

/** The small picture in a list row; staff see it even while the item is hidden from visitors. */
export function Thumb({ imageKey }: { imageKey?: string }) {
  const src = useFeaturedImage(imageKey);
  return src ? <img className={c.thumb} src={src} alt="" /> : <span className={c.thumb} aria-hidden="true"><Icon name="image" size={20} /></span>;
}
