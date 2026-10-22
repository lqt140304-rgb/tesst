import { describe, expect, it } from 'vitest';
import {
  INQUIRY_ABOUT_MAX, INQUIRY_DAILY_MAX, INQUIRY_MSG, INQUIRY_NAME_MAX, INQUIRY_TEXT_MAX, inquiryKey, validateInquiry,
} from './inquiry';

const ok = { name: 'Lan', phone: '0912 345 678', text: 'Cho mình hỏi giờ khám.', about: 'Thức ăn hạt' };
const len = (n: number) => 'a'.repeat(n);

describe('limits', () => {
  it('pins the agreed values', () => {
    expect([INQUIRY_TEXT_MAX, INQUIRY_NAME_MAX, INQUIRY_ABOUT_MAX, INQUIRY_DAILY_MAX]).toEqual([500, 60, 60, 3]);
  });
});

describe('validateInquiry', () => {
  it('accepts a full and a minimal message', () => {
    expect(validateInquiry(ok)).toEqual({});
    expect(validateInquiry({ name: 'A', phone: '+84912345678', text: 'B' })).toEqual({});
    expect(validateInquiry({ ...ok, about: undefined })).toEqual({});
  });
  it('checks the name at 60 / 61 after trimming, and rejects blank or non-text', () => {
    expect(validateInquiry({ ...ok, name: ` ${len(60)} ` })).toEqual({});
    expect(validateInquiry({ ...ok, name: len(61) })).toEqual({ name: INQUIRY_MSG.name });
    for (const name of ['', '  ', 4, null, ['a']]) expect(validateInquiry({ ...ok, name })).toEqual({ name: INQUIRY_MSG.name });
  });
  it('checks the text at 500 / 501', () => {
    expect(validateInquiry({ ...ok, text: len(500) })).toEqual({});
    expect(validateInquiry({ ...ok, text: len(501) })).toEqual({ text: INQUIRY_MSG.text });
    for (const text of ['', '   ', 7, undefined]) expect(validateInquiry({ ...ok, text })).toEqual({ text: INQUIRY_MSG.text });
  });
  it('checks the product name at 60 / 61', () => {
    expect(validateInquiry({ ...ok, about: len(60) })).toEqual({});
    expect(validateInquiry({ ...ok, about: len(61) })).toEqual({ about: INQUIRY_MSG.about });
    expect(validateInquiry({ ...ok, about: 5 })).toEqual({ about: INQUIRY_MSG.about });
  });
  it('accepts the usual ways to write a phone number and nothing else', () => {
    for (const phone of ['0912345678', '091 234 5678', '+84 912 345 678', '84912345678', '(091) 234.56.78']) expect(validateInquiry({ ...ok, phone })).toEqual({});
    for (const phone of ['', '   ', '12345', '0112345678', 912345678, null]) expect(Object.keys(validateInquiry({ ...ok, phone }))).toEqual(['phone']);
    expect(validateInquiry({ ...ok, phone: '' })).toEqual({ phone: INQUIRY_MSG.phoneEmpty });
    expect(validateInquiry({ ...ok, phone: '12345' })).toEqual({ phone: INQUIRY_MSG.phone });
  });
  it('names unknown keys, including __proto__ from JSON, and a wrong shape', () => {
    expect(validateInquiry({ ...ok, colour: 1 })).toEqual({ colour: INQUIRY_MSG.unknown });
    expect(Object.keys(validateInquiry(JSON.parse('{"name":"A","phone":"0912345678","text":"B","__proto__":1}')))).toEqual(['__proto__']);
    for (const bad of [null, undefined, 'x', 3, [ok]]) expect(validateInquiry(bad)).toEqual({ inquiry: INQUIRY_MSG.shape });
  });
});

describe('inquiryKey', () => {
  it('ignores case, accents-free spacing and repeated spaces but not the words', () => {
    expect(inquiryKey('  Hỏi   MUA  ')).toBe(inquiryKey('hỏi mua'));
    expect(inquiryKey('hỏi mua')).not.toBe(inquiryKey('hỏi giá'));
  });
});
