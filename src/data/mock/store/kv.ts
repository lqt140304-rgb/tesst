/** The only module allowed to touch Web Storage. Every access is guarded; failures degrade to memory. */
export interface KV {
  get(k: string): string | null;
  set(k: string, v: string): void;
  remove(k: string): void;
  keys(): string[];
  readonly persistent: boolean;
  onFallback?: () => void;
}

export function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get length() { return m.size; },
    clear: () => m.clear(),
    getItem: (k) => m.get(k) ?? null,
    key: (i) => [...m.keys()][i] ?? null,
    removeItem: (k) => { m.delete(k); },
    setItem: (k, v) => { m.set(k, String(v)); },
  };
}

export function createKV(backend: Storage | null | (() => Storage)): KV {
  let store: Storage;
  let persistent = true;
  const memory = memoryStorage();
  try {
    store = typeof backend === 'function' ? backend() : backend ?? memory;
    if (!backend) persistent = false;
  } catch {
    store = memory;
    persistent = false;
  }
  const kv: KV = {
    get persistent() { return persistent; },
    get(k) {
      try { return store.getItem(k); } catch { fallback(); return memory.getItem(k); }
    },
    set(k, v) {
      try { store.setItem(k, v); } catch { fallback(); memory.setItem(k, v); }
    },
    remove(k) {
      try { store.removeItem(k); } catch { fallback(); memory.removeItem(k); }
    },
    keys() {
      try {
        const out: string[] = [];
        for (let i = 0; i < store.length; i++) { const k = store.key(i); if (k) out.push(k); }
        return out;
      } catch { fallback(); return [...Array(memory.length).keys()].map((i) => memory.key(i)!).filter(Boolean); }
    },
  };
  function fallback() {
    if (store === memory) return;
    store = memory;
    persistent = false;
    kv.onFallback?.();
  }
  return kv;
}

/** Browser KVs. Guarded getters: some sandboxes throw on mere property access. */
export const browserLocalKV = () => createKV(() => window.localStorage);
export const browserSessionKV = () => createKV(() => window.sessionStorage);
