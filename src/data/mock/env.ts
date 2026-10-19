import type { Session } from '../contracts/api';
import type { Db } from './store/db';
import type { KV } from './store/kv';

export const SESSION_KEY = 'leson-demo:session';

export type SessionStore = { get(): Session | null; set(s: Session): void; clear(): void };

export function createSessionStore(kv: KV): SessionStore {
  return {
    get() {
      try {
        const raw = kv.get(SESSION_KEY);
        return raw ? (JSON.parse(raw) as Session) : null;
      } catch {
        return null;
      }
    },
    set: (s) => kv.set(SESSION_KEY, JSON.stringify(s)),
    clear: () => kv.remove(SESSION_KEY),
  };
}

/** What every mock API module receives. */
export type Env = { db: Db; session: SessionStore; clock: () => Date };
