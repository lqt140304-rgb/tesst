import { useMediaUrls } from '@/data/hooks/useMediaUrls';

/** The picture a Quản lý attached to a featured item ("local:img-…"), or `undefined` when there is none or the file is gone. */
export function useFeaturedImage(imageKey?: string): string | undefined {
  const m = useMediaUrls(imageKey?.startsWith('local:') ? imageKey : undefined);
  return imageKey && !m.missing ? m.urls?.mp4 : undefined;
}
