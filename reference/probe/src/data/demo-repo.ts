import { browserKV, type KV } from './storage';
const KEY = 'leson-demo:v1';
const SCHEMA = 1;
type Db = { schemaVersion: number; seededAt: string; pets: string[] };
let kv: KV | null = null;
export function __setKV(next: KV) { kv = next; }
const store = () => (kv ??= browserKV());
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
export function seed(today = new Date()): Db { return { schemaVersion: SCHEMA, seededAt: today.toISOString().slice(0, 10), pets: ['Mướp', 'Bơ', 'Cốm'] }; }
export function load(): Db {
  const raw = store().get(KEY);
  if (raw) { try { const db = JSON.parse(raw) as Db; if (db.schemaVersion === SCHEMA) return db; } catch { /* corrupt → reseed */ } }
  const db = seed(); store().set(KEY, JSON.stringify(db)); return db;
}
export async function listDemoPets(): Promise<string[]> { await sleep(150); return [...load().pets]; }
