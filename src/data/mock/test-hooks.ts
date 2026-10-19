import type { MockApi } from './api';
import { setLatency } from './latency';

/** Demo/e2e helpers on window.__lesonDemo (not linked anywhere in the UI). */
export function installTestHooks(api: MockApi, setNow: (iso: string | null) => void, failNextWrite: () => void) {
  (window as unknown as { __lesonDemo: unknown }).__lesonDemo = {
    setLatency,
    setNow,
    failNextWrite,
    reset: () => api.system.resetDemo(),
    loginAs: (username: string) => api.auth.login({ identifier: username, password: 'leson-demo' }),
    logout: () => api.auth.logout(),
  };
}
