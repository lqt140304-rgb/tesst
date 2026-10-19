import type { Db } from '../store/db';
import type { KV } from '../store/kv';
import { createSessionStore, type Env } from '../env';
import { authApi } from './auth';
import { systemApi } from './system';

export function createMockApi(opts: { db: Db; sessionKV: KV; clock: () => Date }) {
  const env: Env = { db: opts.db, session: createSessionStore(opts.sessionKV), clock: opts.clock };
  return {
    env,
    auth: authApi(env),
    system: systemApi(env),
  };
}

export type MockApi = ReturnType<typeof createMockApi>;
