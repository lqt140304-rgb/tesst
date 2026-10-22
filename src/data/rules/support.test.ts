import { describe, expect, it } from 'vitest';
import { SUPPORT_MSG, validateReply, validateStatus, validateSupportInput } from './support';

const ok = { kind: 'bug', title: 'Tiêu đề', body: 'Nội dung' };
const rep = (n: number) => 'a'.repeat(n);

describe('validateSupportInput', () => {
  it('accepts the three kinds, the limits exactly, and a missing or undefined screen', () => {
    for (const kind of ['howto', 'bug', 'idea']) expect(validateSupportInput({ ...ok, kind }, )).toEqual({});
    expect(validateSupportInput({ ...ok, title: rep(80), body: rep(1000), screen: rep(100) })).toEqual({});
    expect(validateSupportInput({ ...ok, screen: undefined })).toEqual({});
  });
  it('refuses each field on its own', () => {
    expect(validateSupportInput({ ...ok, kind: 'x' })).toEqual({ kind: SUPPORT_MSG.kind });
    expect(validateSupportInput({ ...ok, kind: undefined })).toEqual({ kind: SUPPORT_MSG.kind });
    for (const title of ['', '   ', rep(81), 5, null, ['a']]) expect(validateSupportInput({ ...ok, title })).toEqual({ title: SUPPORT_MSG.title });
    for (const body of ['', '   ', rep(1001), 5, null]) expect(validateSupportInput({ ...ok, body })).toEqual({ body: SUPPORT_MSG.body });
    for (const screen of [rep(101), 5, null, {}]) expect(validateSupportInput({ ...ok, screen })).toEqual({ screen: SUPPORT_MSG.screen });
  });
  it('counts after trimming', () => {
    expect(validateSupportInput({ ...ok, title: `  ${rep(80)}  ` })).toEqual({});
    expect(validateSupportInput({ ...ok, screen: `  ${rep(100)}  ` })).toEqual({});
  });
  it('unknown keys, an own __proto__ key and input that is not an object', () => {
    const errs = validateSupportInput(JSON.parse('{"kind":"bug","title":"a","body":"b","__proto__":{"x":1},"colour":2}'));
    expect(Object.keys(errs).sort()).toEqual(['__proto__', 'colour']);
    expect(Object.values(errs)).toEqual([SUPPORT_MSG.unknown, SUPPORT_MSG.unknown]);
    for (const bad of [null, [], 'x', 5, undefined]) expect(validateSupportInput(bad)).toEqual({ support: SUPPORT_MSG.shape });
  });
});

describe('validateReply and validateStatus', () => {
  it('reply: 1 to 500 characters after trimming, text only', () => {
    expect(validateReply('Đã rõ')).toBeNull();
    expect(validateReply(rep(500))).toBeNull();
    for (const bad of ['', '  ', rep(501), 5, null, undefined]) expect(validateReply(bad)).toBe(SUPPORT_MSG.reply);
  });
  it('status: only new or seen can be set by hand', () => {
    expect(validateStatus('new')).toBeNull();
    expect(validateStatus('seen')).toBeNull();
    for (const bad of ['answered', 'x', undefined, 5]) expect(validateStatus(bad)).toBe(SUPPORT_MSG.status);
  });
});
