import { describe, it, expect, beforeEach } from 'vitest';
import { __setKV, listDemoPets, load } from './demo-repo';
import { memoryKV } from './storage';
describe('demo repo', () => {
  beforeEach(() => __setKV(memoryKV()));
  it('seeds on first load and returns pets asynchronously', async () => {
    expect(load().schemaVersion).toBe(1);
    await expect(listDemoPets()).resolves.toEqual(['Mướp', 'Bơ', 'Cốm']);
  });
});
