import type { SystemApi } from '../../contracts/api';
import type { Env } from '../env';
import { purgeExpiredVideos } from './staff/inpatient';

export function systemApi(env: Env): SystemApi {
  const { db, session } = env;
  return {
    async resetDemo() {
      session.clear();
      db.reset();
    },
    storageStatus: () => ({ persistent: db.kv.persistent, needsRefresh: db.needsRefreshBanner(), seededAt: db.read().seededAt }),
    now: () => env.clock(),
    subscribe: (cb) => db.subscribe(cb),
    rev: () => db.read().rev,
    purgeExpiredVideos: () => purgeExpiredVideos(db, env.clock()),
  };
}
