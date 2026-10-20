import type { MediaApi } from '../../contracts/api';
import { ForbiddenError, NotFoundError } from '../../contracts/errors';
import type { Env } from '../env';
import { assertCap, currentActor } from '../guard';
import { visibleVideos } from '../projections/customer';
import type { BlobStore } from '../store/blobs';
import type { Db } from '../store/db';
import { isLocalKey } from '../../rules/video-upload';


export function mediaApi(env: Env): MediaApi {
  return {
    async local(mediaKey) {
      const actor = currentActor(env.db, env.session.get());
      const doc = env.db.read();
      if (actor.type === 'staff') {
        assertCap(actor, 'inpatient.view');
        if (!doc.t.videos.some((v) => v.media_key === mediaKey && !v.deleted_at)) return null;
      } else if (actor.type === 'customer') {
        // Same rule as the customer's video list: shared, not deleted, not expired, own pets.
        const petIds = new Set(actor.customerId ? doc.t.pets.filter((p) => p.customer_id === actor.customerId).map((p) => p.id) : []);
        if (!visibleVideos(doc, petIds, env.clock()).some((v) => v.media_key === mediaKey)) throw new NotFoundError();
      } else throw new ForbiddenError();
      return isLocalKey(mediaKey) ? env.media.get(mediaKey) : null;
    },
  };
}

/** Files left behind when their video vanished (another tab reset the demo, a day-change reseed). Runs at startup. */
export async function cleanOrphanBlobs(db: Db, media: BlobStore): Promise<number> {
  const live = new Set(db.read().t.videos.filter((v) => !v.deleted_at && isLocalKey(v.media_key)).map((v) => v.media_key));
  const orphans = (await media.keys()).filter((k) => !live.has(k));
  await media.remove(orphans);
  return orphans.length;
}
