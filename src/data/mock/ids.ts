import type { CodePrefix, Doc } from './store/schema';

export function newId(): string {
  const c: Crypto = globalThis.crypto;
  if (typeof c.randomUUID === 'function') return c.randomUUID();
  // Fallback for older browsers / insecure contexts: RFC 4122 v4 from random bytes.
  const b = c.getRandomValues(new Uint8Array(16));
  b[6] = (b[6]! & 0x0f) | 0x40;
  b[8] = (b[8]! & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** Human code inside a transaction: "YC-0245". */
export function nextCode(doc: Doc, prefix: CodePrefix): string {
  doc.counters[prefix] += 1;
  return `${prefix}-${String(doc.counters[prefix]).padStart(4, '0')}`;
}
