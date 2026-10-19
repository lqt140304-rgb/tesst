/** Storage port: localStorage when available, in-memory fallback (Artifact previews/private mode can throw). */
export interface KV { get(key: string): string | null; set(key: string, value: string): void; remove(key: string): void; readonly persistent: boolean; }
export function memoryKV(): KV {
  const m = new Map<string, string>();
  return { get: (k) => m.get(k) ?? null, set: (k, v) => void m.set(k, v), remove: (k) => void m.delete(k), persistent: false };
}
export function browserKV(): KV {
  try {
    const ls = window.localStorage; const probe = '__leson_probe__';
    ls.setItem(probe, '1'); ls.removeItem(probe);
    return {
      get: (k) => { try { return ls.getItem(k); } catch { return null; } },
      set: (k, v) => { try { ls.setItem(k, v); } catch { /* quota/blocked: keep running in memory */ } },
      remove: (k) => { try { ls.removeItem(k); } catch { /* ignore */ } },
      persistent: true,
    };
  } catch { return memoryKV(); }
}
