/** Test helper: a fresh mock API on memory storage with a fixed clock and no latency. */
import { createKV, memoryStorage } from './store/kv';
import { createDb } from './store/db';
import { buildSeed } from './seed';
import { createMockApi } from './api';
import { setLatency } from './latency';
import { memoryBlobStore, type BlobStore } from './store/blobs';

export const TEST_NOW = '2026-10-19T09:00:00+07:00';

export function makeTestApi(nowIso = TEST_NOW, media: BlobStore = memoryBlobStore()) {
  setLatency(0);
  let now = new Date(nowIso);
  const clock = () => now;
  const db = createDb({ kv: createKV(memoryStorage()), clock, seed: buildSeed });
  const sessionKV = createKV(memoryStorage());
  const api = createMockApi({ db, sessionKV, clock, media });
  return { api, db, media, setNow: (iso: string) => { now = new Date(iso); } };
}

export async function loginAs(api: ReturnType<typeof makeTestApi>['api'], username: string) {
  return api.auth.login({ identifier: username, password: 'leson-demo' });
}
