/** Typed access to bundled photos and demo clips (hashed URLs from Vite). */
const imgs = import.meta.glob('./img/*.{webp,png,svg}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const media = import.meta.glob('./media/*.{mp4,jpg}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

export type PhotoKey = 'kham' | 'grooming' | 'noitru' | 'capcuu' | 'pet_center' | 'pet_left' | 'pet_right';

export const logoUrl = imgs['./img/logo-le-son.png']!;
export const heroPhotos = Array.from({ length: 9 }, (_, i) => imgs[`./img/hero-${i}.webp`]!);
export const photo = (key: PhotoKey, variant: 'card' | 'thumb' = 'card') => imgs[`./img/${key}-${variant}.webp`]!;
export const svgArt = (name: 'cat-silhouette' | 'cat-pose-booking' | 'sketch-cartoon-cat') => imgs[`./img/${name}.svg`]!;

/** media_key "demo:v1-mieu-an-sang" → urls. */
export function mediaFor(mediaKey: string): { mp4: string; poster: string; thumb: string } | null {
  const id = mediaKey.replace(/^demo:/, '');
  const mp4 = media[`./media/${id}.mp4`];
  if (!mp4) return null;
  return { mp4, poster: media[`./media/${id}.poster.jpg`]!, thumb: media[`./media/${id}.thumb.jpg`]! };
}
