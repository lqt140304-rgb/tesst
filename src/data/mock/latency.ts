let fixed: number | null = null;

/** Test hook: 0 for instant e2e runs, null to restore the realistic defaults. */
export function setLatency(ms: number | null) {
  fixed = ms;
}

const sleep = (ms: number) => (ms > 0 ? new Promise<void>((r) => setTimeout(r, ms)) : Promise.resolve());
const between = (a: number, b: number) => a + Math.round(Math.random() * (b - a));

export const sleepRead = () => sleep(fixed ?? between(120, 300));
export const sleepWrite = () => sleep(fixed ?? between(250, 500));
