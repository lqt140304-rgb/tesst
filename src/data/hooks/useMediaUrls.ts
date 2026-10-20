import { useEffect, useMemo, useState } from 'react';
import { mediaFor } from '../../assets/media';
import type { LocalMedia } from '../contracts/api';
import { isLocalKey } from '../rules/video-upload';
import { api } from '../index';

export type MediaUrls = { mp4: string; poster?: string; thumb?: string };
/** `missing`: the file is gone (show "Không còn tệp video"). */
export type MediaState = { urls?: MediaUrls; loading: boolean; missing: boolean };

/** Object URLs for a video kept in this browser; `created` is what the caller must revoke. The poster doubles as thumbnail. */
export async function resolveLocalMedia(
  key: string, load: (k: string) => Promise<LocalMedia | null>, toUrl: (b: Blob) => string,
): Promise<{ urls: MediaUrls; created: string[] } | null> {
  const media = await load(key);
  if (!media) return null;
  const mp4 = toUrl(media.video);
  const poster = media.poster ? toUrl(media.poster) : undefined;
  return { urls: { mp4, poster, thumb: poster }, created: poster ? [mp4, poster] : [mp4] };
}

/** One way to play any stay video, staff or customer side: sample clips ("demo:") and files kept in this browser ("local:"). */
export function useMediaUrls(mediaKey: string | undefined): MediaState {
  const local = !!mediaKey && isLocalKey(mediaKey);
  const demo = useMemo(() => (mediaKey && !local ? mediaFor(mediaKey) : null), [mediaKey, local]);
  const [loaded, setLoaded] = useState<{ key: string; urls: MediaUrls | null } | null>(null);

  useEffect(() => {
    if (!mediaKey || !local) return;
    let alive = true;
    let created: string[] = [];
    resolveLocalMedia(mediaKey, (k) => api.media.local(k), (b) => URL.createObjectURL(b)).then(
      (r) => {
        if (!alive) { r?.created.forEach((u) => URL.revokeObjectURL(u)); return; }
        created = r?.created ?? [];
        setLoaded({ key: mediaKey, urls: r?.urls ?? null });
      },
      () => { if (alive) setLoaded({ key: mediaKey, urls: null }); },
    );
    return () => {
      alive = false;
      created.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [mediaKey, local]);

  if (!mediaKey) return { loading: false, missing: false };
  if (!local) return demo ? { urls: demo, loading: false, missing: false } : { loading: false, missing: true };
  if (loaded?.key !== mediaKey) return { loading: true, missing: false };
  return loaded.urls ? { urls: loaded.urls, loading: false, missing: false } : { loading: false, missing: true };
}
