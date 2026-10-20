import type { Session } from '../contracts/api';
import type { Db } from './store/db';
import type { KV } from './store/kv';
import type { BlobStore } from './store/blobs';
import { toIsoVN } from '../../lib/dates';

export const SESSION_KEY = 'leson-demo:session';
/** "Ghi nhớ đăng nhập" (part 2 §4.2): customers only, in localStorage so every tab of this browser shares it. */
export const REMEMBER_KEY = 'leson-demo:session-remember';
export const REMEMBER_DAYS = 30;

export type SessionStore = { get(): Session | null; set(s: Session, opts?: { remember?: boolean }): void; clear(): void; subscribe(cb: () => void): () => void };

/** This tab's session (sessionStorage) first, else a remembered customer session that has not expired. */
export function createSessionStore(kv: KV, opts?: { remember?: KV; clock?: () => Date }): SessionStore {
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((l) => l());
  const remember = opts?.remember;
  const now = () => (opts?.clock ?? (() => new Date()))();
  const parse = <T>(raw: string | null): T | null => {
    try {
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  };
  return {
    subscribe(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    get() {
      const here = parse<Session>(kv.get(SESSION_KEY));
      if (here || !remember) return here;
      const kept = parse<{ session: Session; expires_at: string }>(remember.get(REMEMBER_KEY));
      if (!kept) return null;
      if (new Date(kept.expires_at).getTime() <= now().getTime()) {
        remember.remove(REMEMBER_KEY);
        return null;
      }
      return kept.session;
    },
    set(s, o) {
      if (o?.remember && s.kind === 'customer' && remember) {
        const expires_at = toIsoVN(new Date(now().getTime() + REMEMBER_DAYS * 86_400_000));
        remember.set(REMEMBER_KEY, JSON.stringify({ session: s, expires_at }));
        kv.remove(SESSION_KEY);
      } else {
        kv.set(SESSION_KEY, JSON.stringify(s));
        remember?.remove(REMEMBER_KEY);
      }
      notify();
    },
    clear: () => { kv.remove(SESSION_KEY); remember?.remove(REMEMBER_KEY); notify(); },
  };
}

/** What every mock API module receives. */
export type Env = { db: Db; session: SessionStore; clock: () => Date; media: BlobStore };
