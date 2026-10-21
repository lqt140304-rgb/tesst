import { describe, expect, it } from 'vitest';
import { DEFAULT_PRESET, DEVICE_PRESETS, fitScale, presetOf, readMode, writeMode, type StorageLike } from './devices';

const memory = (init: Record<string, string> = {}): StorageLike & { data: Record<string, string> } => {
  const data = { ...init };
  return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v; } };
};

describe('device presets', () => {
  it('has the PC and phone sizes the owner asked for, defaults first-class', () => {
    const sizes = (kind: 'pc' | 'mobile') => DEVICE_PRESETS.filter((p) => p.kind === kind).map((p) => `${p.width}x${p.height}`);
    expect(sizes('pc')).toEqual(['1920x1080', '1440x900', '1366x768', '1280x720']);
    expect(sizes('mobile')).toEqual(['430x932', '390x844', '360x800', '320x568']);
    expect(presetOf(DEFAULT_PRESET.pc)).toMatchObject({ width: 1440, height: 900 });
    expect(presetOf(DEFAULT_PRESET.mobile)).toMatchObject({ width: 390, height: 844 });
    expect(new Set(DEVICE_PRESETS.map((p) => p.id)).size).toBe(DEVICE_PRESETS.length);
  });
  it('finds a preset by id and nothing for an unknown id', () => {
    expect(presetOf('m-360x800')).toMatchObject({ kind: 'mobile', width: 360, height: 800 });
    expect(presetOf('nope')).toBeUndefined();
  });
});

describe('remembered mode', () => {
  it('is "auto" until a size was chosen', () => {
    expect(readMode(memory())).toEqual({ kind: 'auto' });
    expect(readMode(null)).toEqual({ kind: 'auto' });
  });
  it('round-trips a preset', () => {
    const store = memory();
    writeMode(store, { kind: 'mobile', presetId: 'm-390x844' });
    expect(readMode(store)).toEqual({ kind: 'mobile', presetId: 'm-390x844' });
    writeMode(store, { kind: 'auto' });
    expect(readMode(store)).toEqual({ kind: 'auto' });
  });
  it('treats an unknown or damaged value as "auto", never as an error', () => {
    expect(readMode(memory({ 'leson:device': 'm-9999x1' }))).toEqual({ kind: 'auto' });
    expect(readMode(memory({ 'leson:device': '{' }))).toEqual({ kind: 'auto' });
    const broken: StorageLike = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
    expect(readMode(broken)).toEqual({ kind: 'auto' });
    expect(() => writeMode(broken, { kind: 'pc', presetId: 'pc-1440x900' })).not.toThrow();
  });
});

describe('fitScale', () => {
  it('never enlarges, and shrinks to the tighter side', () => {
    expect(fitScale({ width: 2000, height: 1200 }, { width: 1440, height: 900 })).toBe(1);
    expect(fitScale({ width: 720, height: 2000 }, { width: 1440, height: 900 })).toBe(0.5);
    expect(fitScale({ width: 2000, height: 450 }, { width: 1440, height: 900 })).toBe(0.5);
  });
  it('keeps a usable minimum for tiny areas', () => {
    expect(fitScale({ width: 10, height: 10 }, { width: 1440, height: 900 })).toBe(0.2);
    expect(fitScale({ width: 0, height: 0 }, { width: 390, height: 844 })).toBe(0.2);
  });
});
