import { describe, expect, it } from 'vitest';
import { LIMITS, countText, helpTab, pickArticle, progressText, statusTone, supportHref } from './helpView';

describe('limits and counters', () => {
  it('match the rules of the tickets', () => {
    expect(LIMITS).toEqual({ title: 80, body: 1000, screen: 100, reply: 500 });
  });
  it('counts what is typed without the spaces at both ends', () => {
    expect(countText('  abc ', 80)).toBe('3/80');
    expect(countText('', 1000)).toBe('0/1000');
  });
});

describe('statusTone', () => {
  it('new is orange, seen is plum, answered is teal', () => {
    expect(statusTone('new')).toBe('orange');
    expect(statusTone('seen')).toBe('plum');
    expect(statusTone('answered')).toBe('teal');
  });
});

describe('progressText', () => {
  it('says how many are done', () => {
    expect(progressText(3, 8)).toBe('Đã làm 3/8');
  });
});

describe('helpTab', () => {
  it('opens the guides unless another tab is asked for and allowed', () => {
    expect(helpTab(null, false)).toBe('huong-dan');
    expect(helpTab('gop-y', false)).toBe('gop-y');
    expect(helpTab('hop-thu', false)).toBe('huong-dan');
    expect(helpTab('hop-thu', true)).toBe('hop-thu');
    expect(helpTab('abc', true)).toBe('huong-dan');
  });
});

describe('pickArticle', () => {
  it('only an article the person can see', () => {
    expect(pickArticle('kho', ['tong-quan', 'kho'])).toBe('kho');
    expect(pickArticle('nope', ['kho'])).toBeUndefined();
    expect(pickArticle(null, ['kho'])).toBeUndefined();
  });
});

describe('supportHref', () => {
  it('goes to the feedback tab, with the screen when known', () => {
    expect(supportHref()).toBe('/nv/tro-giup?tab=gop-y');
    expect(supportHref('Lịch hẹn')).toBe('/nv/tro-giup?tab=gop-y&man=L%E1%BB%8Bch%20h%E1%BA%B9n');
  });
});
