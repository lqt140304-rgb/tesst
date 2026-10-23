import { describe, expect, it } from 'vitest';
import { CASE_LIMITS, PRODUCT_LIMITS, consentLine, contentTab, updatedLine, usedText } from './contentView';

describe('contentTab', () => {
  it('defaults to the products tab', () => {
    expect(contentTab(null)).toBe('san-pham');
    expect(contentTab('xyz')).toBe('san-pham');
  });
  it('reads the stories tab', () => expect(contentTab('cau-chuyen')).toBe('cau-chuyen'));
});

describe('usedText', () => {
  it('counts against the 30-item limit', () => expect(usedText(4)).toBe('Đã dùng 4/30 mục'));
});

describe('consentLine', () => {
  it('names who confirmed and when', () => {
    const t = consentLine({ consentByName: 'Nguyễn Thu Hà', consentAt: '2026-10-20T03:00:00.000Z' });
    expect(t).toContain('Chủ nuôi đồng ý: Nguyễn Thu Hà, ');
    expect(t).toContain('20/10/2026');
  });
  it('drops the date when the time is unreadable', () => {
    expect(consentLine({ consentByName: 'Hà', consentAt: '' })).toBe('Chủ nuôi đồng ý: Hà');
  });
});

describe('updatedLine', () => {
  it('names who and when', () => {
    expect(updatedLine({ updatedByName: 'Hà', updatedAt: '2026-10-20T03:05:00.000Z' })).toBe('Hà · 10:05 20/10/2026');
  });
  it('is just the name when the time is unreadable', () => {
    expect(updatedLine({ updatedByName: 'Hà', updatedAt: 'x' })).toBe('Hà');
  });
});

describe('limits', () => {
  it('match the data rules', () => {
    expect(PRODUCT_LIMITS).toEqual({ name: 60, note: 120 });
    expect(CASE_LIMITS).toEqual({ title: 80, story: 600, petName: 30 });
  });
});
