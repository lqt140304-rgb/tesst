import type { Db } from '../store/db';
import type { KV } from '../store/kv';
import { createSessionStore, type Env } from '../env';
import { authApi } from './auth';
import { publicApi } from './public';
import { customerApi } from './customer';
import { systemApi } from './system';
import { staffRequestsApi } from './staff/requests';
import { staffAppointmentsApi } from './staff/appointments';
import { staffAccountsApi, staffCustomersApi } from './staff/customers';
import { staffInpatientApi } from './staff/inpatient';
import { staffInvoicesApi, staffPricesApi, staffReportsApi } from './staff/invoices';

export function createMockApi(opts: { db: Db; sessionKV: KV; clock: () => Date }) {
  const env: Env = { db: opts.db, session: createSessionStore(opts.sessionKV), clock: opts.clock };
  return {
    env,
    auth: authApi(env),
    public: publicApi(env),
    customer: customerApi(env),
    system: systemApi(env),
    staff: {
      requests: staffRequestsApi(env),
      appointments: staffAppointmentsApi(env),
      customers: staffCustomersApi(env),
      accounts: staffAccountsApi(env),
      inpatient: staffInpatientApi(env),
      prices: staffPricesApi(env),
      invoices: staffInvoicesApi(env),
      reports: staffReportsApi(env),
    },
  };
}

export type MockApi = ReturnType<typeof createMockApi>;
