/** Test helper: a fresh mock API on memory storage with a fixed clock and no latency. */
import { createKV, memoryStorage } from './store/kv';
import { createDb } from './store/db';
import { buildSeed } from './seed';
import { createMockApi } from './api';
import { setLatency } from './latency';

export const TEST_NOW = '2026-10-19T09:00:00+07:00';

export function makeTestApi(nowIso = TEST_NOW) {
  setLatency(0);
  let now = new Date(nowIso);
  const clock = () => now;
  const db = createDb({ kv: createKV(memoryStorage()), clock, seed: buildSeed });
  const sessionKV = createKV(memoryStorage());
  const api = createMockApi({ db, sessionKV, clock });
  return { api, db, setNow: (iso: string) => { now = new Date(iso); } };
}

export async function loginAs(api: ReturnType<typeof makeTestApi>['api'], username: string) {
  return api.auth.login({ identifier: username, password: 'leson-demo' });
}
