import type { Session } from '../contracts/api';
import type { Db } from './store/db';
import type { KV } from './store/kv';

export const SESSION_KEY = 'leson-demo:session';

export type SessionStore = { get(): Session | null; set(s: Session): void; clear(): void; subscribe(cb: () => void): () => void };

export function createSessionStore(kv: KV): SessionStore {
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((l) => l());
  return {
    subscribe(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    get() {
      try {
        const raw = kv.get(SESSION_KEY);
        return raw ? (JSON.parse(raw) as Session) : null;
      } catch {
        return null;
      }
    },
    set: (s) => { kv.set(SESSION_KEY, JSON.stringify(s)); notify(); },
    clear: () => { kv.remove(SESSION_KEY); notify(); },
  };
}

/** What every mock API module receives. */
export type Env = { db: Db; session: SessionStore; clock: () => Date };
