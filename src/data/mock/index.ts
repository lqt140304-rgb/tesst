/** Browser singleton of the mock backend. Codex replaces this module with the Supabase adapter. */
import { createMockApi } from './api';
import { createDb, DOC_KEY, type DbEvent } from './store/db';
import { browserLocalKV, browserSessionKV } from './store/kv';
import { browserBlobStore } from './store/blobs';
import { cleanOrphanBlobs } from './api/media';
import { buildSeed } from './seed';
import { installTestHooks } from './test-hooks';

let fixedNow: Date | null = null;
const clock = () => fixedNow ?? new Date();
const events: DbEvent[] = [];
let failNext = false;

const localKV = browserLocalKV();
const db = createDb({ kv: localKV, clock, seed: buildSeed, onEvent: (e) => events.push(e) });

// One-shot simulated write failure (e2e: "save did not succeed" states).
const realTransact = db.transact.bind(db);
db.transact = ((label: string, fn: Parameters<typeof db.transact>[1], opts?: Parameters<typeof db.transact>[2]) => {
  if (failNext) {
    failNext = false;
    throw new Error('Simulated storage failure');
  }
  return realTransact(label, fn, opts);
}) as typeof db.transact;

const media = browserBlobStore();
export const mockApi = createMockApi({ db, sessionKV: browserSessionKV(), clock, media });
export const dbEvents = () => [...events];

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === DOC_KEY) db.reloadFromStorage();
  });
  void cleanOrphanBlobs(db, media);
  installTestHooks(mockApi, (iso) => { fixedNow = iso ? new Date(iso) : null; }, () => { failNext = true; }, {
    blobKeys: () => media.keys(),
    cleanOrphans: () => cleanOrphanBlobs(db, media),
  });
}
