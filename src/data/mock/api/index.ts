import type { Db } from '../store/db';
import type { KV } from '../store/kv';
import { memoryBlobStore, type BlobStore } from '../store/blobs';
import { createSessionStore, type Env } from '../env';
import { authApi } from './auth';
import { publicApi } from './public';
import { customerApi } from './customer';
import { systemApi } from './system';
import { mediaApi } from './media';
import { staffRequestsApi } from './staff/requests';
import { staffAppointmentsApi } from './staff/appointments';
import { staffAccountsApi, staffCustomersApi } from './staff/customers';
import { staffInpatientApi } from './staff/inpatient';
import { staffInvoicesApi } from './staff/invoices';
import { staffReportsApi } from './staff/reports';
import { staffPricesApi } from './staff/prices';
import { staffContentApi } from './staff/content';
import { staffHelpApi } from './staff/help';
import { staffPrefsApi } from './staff/prefs';
import { staffProfileApi, staffSettingsApi } from './staff/profile';
import { staffStockApi } from './staff/stock';
import { staffSupportApi } from './staff/support';
import { staffTeamApi } from './staff/team';

/** `rememberKV`: where "Ghi nhớ đăng nhập" keeps a customer session (localStorage in the browser). */
export function createMockApi(opts: { db: Db; sessionKV: KV; clock: () => Date; media?: BlobStore; rememberKV?: KV }) {
  const session = createSessionStore(opts.sessionKV, { remember: opts.rememberKV, clock: opts.clock });
  const env: Env = { db: opts.db, session, clock: opts.clock, media: opts.media ?? memoryBlobStore() };
  return {
    env,
    auth: authApi(env),
    public: publicApi(env),
    customer: customerApi(env),
    system: systemApi(env),
    media: mediaApi(env),
    staff: {
      requests: staffRequestsApi(env),
      appointments: staffAppointmentsApi(env),
      customers: staffCustomersApi(env),
      accounts: staffAccountsApi(env),
      inpatient: staffInpatientApi(env),
      prices: staffPricesApi(env),
      invoices: staffInvoicesApi(env),
      reports: staffReportsApi(env),
      stock: staffStockApi(env),
      team: staffTeamApi(env),
      profile: staffProfileApi(env),
      prefs: staffPrefsApi(env),
      help: staffHelpApi(env),
      support: staffSupportApi(env),
      settings: staffSettingsApi(env),
      content: staffContentApi(env),
    },
  };
}

export type MockApi = ReturnType<typeof createMockApi>;
