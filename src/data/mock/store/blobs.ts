/** The only module allowed to touch IndexedDB: device videos kept in this browser only (spec §3.6). */
import { clear, createStore, del, delMany, get, keys, set, type UseStore } from 'idb-keyval';
import type { LocalMedia } from '../../contracts/api';

export interface BlobStore {
  available(): Promise<boolean>;
  put(key: string, video: Blob): Promise<void>;
  get(key: string): Promise<LocalMedia | null>;
  /** Never throws, so callers may fire and forget. */
  remove(keys: string[]): Promise<void>;
  keys(): Promise<string[]>;
  clear(): Promise<void>;
}

/** Tests and browsers without IndexedDB. Removal happens synchronously, before the promise settles. */
export function memoryBlobStore(opts: { available?: boolean } = {}): BlobStore {
  const files = new Map<string, LocalMedia>();
  const ok = opts.available ?? true;
  return {
    available: async () => ok,
    async put(key, video) {
      if (!ok) throw new Error('Blob storage unavailable');
      files.set(key, { video });
    },
    get: async (key) => files.get(key) ?? null,
    remove(ks) {
      ks.forEach((k) => files.delete(k));
      return Promise.resolve();
    },
    keys: async () => [...files.keys()],
    clear: async () => files.clear(),
  };
}

export function browserBlobStore(): BlobStore {
  let store: UseStore | undefined;
  let ok: Promise<boolean> | undefined;
  const db = () => (store ??= createStore('leson-demo-media', 'files'));
  // Sandboxed frames and private modes may refuse IndexedDB; probe once.
  const available = () => (ok ??= (async () => {
    try {
      if (typeof indexedDB === 'undefined') return false;
      await set('probe', 1, db());
      await del('probe', db());
      return true;
    } catch {
      return false;
    }
  })());
  return {
    available,
    async put(key, video) {
      const poster = await firstFrameJpeg(video);
      await set(key, poster ? { video, poster } : { video }, db());
    },
    async get(key) {
      if (!(await available())) return null;
      return (await get<LocalMedia>(key, db())) ?? null;
    },
    async remove(ks) {
      try {
        if (ks.length && (await available())) await delMany(ks, db());
      } catch { /* the next startup clean-up retries */ }
    },
    async keys() {
      return (await available()) ? (await keys(db())).map(String) : [];
    },
    async clear() {
      if (await available()) await clear(db());
    },
  };
}

/** First frame as a JPEG (≤ 640 px wide) for the poster; undefined when the browser cannot decode the file. */
async function firstFrameJpeg(file: Blob): Promise<Blob | undefined> {
  if (typeof document === 'undefined') return undefined;
  const url = URL.createObjectURL(file);
  try {
    const v = document.createElement('video');
    v.muted = true;
    v.playsInline = true;
    v.preload = 'auto';
    v.src = url;
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timeout')), 3000);
      v.addEventListener('loadeddata', () => { clearTimeout(timer); resolve(); }, { once: true });
      v.addEventListener('error', () => { clearTimeout(timer); reject(new Error('decode')); }, { once: true });
    });
    const scale = Math.min(1, 640 / (v.videoWidth || 640));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(v.videoWidth * scale));
    c.height = Math.max(1, Math.round(v.videoHeight * scale));
    c.getContext('2d')?.drawImage(v, 0, 0, c.width, c.height);
    return await new Promise<Blob | undefined>((r) => c.toBlob((b) => r(b ?? undefined), 'image/jpeg', 0.8));
  } catch {
    return undefined;
  } finally {
    URL.revokeObjectURL(url);
  }
}
