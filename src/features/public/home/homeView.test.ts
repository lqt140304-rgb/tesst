import { describe, expect, it } from 'vitest';
import { PUB_SECTION_IDS, storyPhotoKey, excerpt, filterProducts, holidayNote, hoursState, productCategories, storyLayout } from './homeView';

const at = (hhmm: string, day = '2026-10-26') => new Date(`${day}T${hhmm}:00+07:00`); // 26/10/2026 is a Monday

describe('hoursState (08:00–21:00, Sunday like any day, holidays until 19:00)', () => {
  it('opens at 08:00 and closes at 21:00', () => {
    expect(hoursState(at('07:59'), []).open).toBe(false);
    expect(hoursState(at('08:00'), []).open).toBe(true);
    expect(hoursState(at('20:59'), []).open).toBe(true);
    expect(hoursState(at('21:00'), []).open).toBe(false);
  });
  it('Sunday works like a normal day', () => {
    expect(hoursState(at('10:00', '2026-10-25'), []).open).toBe(true);
  });
  it('a holiday closes at 19:00 and is flagged', () => {
    expect(hoursState(at('18:59'), ['2026-10-26'])).toEqual({ open: true, holiday: true });
    expect(hoursState(at('19:00'), ['2026-10-26'])).toEqual({ open: false, holiday: true });
    expect(hoursState(at('12:00'), ['2026-10-27'])).toEqual({ open: true, holiday: false });
  });
  it('reads Vietnam time from a UTC instant', () => {
    expect(hoursState(new Date('2026-10-26T01:30:00Z'), []).open).toBe(true); // 08:30 in Vietnam
    expect(hoursState(new Date('2026-10-26T00:30:00Z'), []).open).toBe(false); // 07:30 in Vietnam
  });
});

describe('holidayNote', () => {
  it('only while open on a holiday', () => {
    expect(holidayNote({ open: true, holiday: true })).toBe('Hôm nay Lê Sơn làm đến 19:00.');
    expect(holidayNote({ open: false, holiday: true })).toBeNull();
    expect(holidayNote({ open: true, holiday: false })).toBeNull();
  });
});

describe('storyLayout', () => {
  it('hides, leads alone, leads with one, then with two', () => {
    expect(storyLayout(0)).toEqual({ lead: null, side: [] });
    expect(storyLayout(1)).toEqual({ lead: 0, side: [] });
    expect(storyLayout(2)).toEqual({ lead: 0, side: [1] });
    expect(storyLayout(3)).toEqual({ lead: 0, side: [1, 2] });
    expect(storyLayout(4)).toEqual({ lead: 0, side: [1, 2] });
  });
});

describe('excerpt', () => {
  it('cuts at a word boundary with an ellipsis, keeps short text', () => {
    const out = excerpt('a '.repeat(200), 40);
    expect(out.length).toBeLessThanOrEqual(41);
    expect(out.endsWith('…')).toBe(true);
    expect(out.slice(0, -1).endsWith(' ')).toBe(false);
    expect(excerpt('ngắn thôi', 40)).toBe('ngắn thôi');
  });
  it('never cuts inside a word', () => {
    expect(excerpt('một hai ba bốn năm sáu', 12)).toBe('một hai ba…');
  });
});

describe('products', () => {
  const items = Array.from({ length: 8 }, (_, i) => ({ id: i, category: i % 3 === 0 ? 'food' : i % 3 === 1 ? 'litter' : 'accessory' }));
  it('lists categories in order of appearance, once each', () => {
    expect(productCategories(items)).toEqual(['food', 'litter', 'accessory']);
  });
  it('limits to six by default and filters by category keeping order', () => {
    expect(filterProducts(items, 'all')).toHaveLength(6);
    expect(filterProducts(items, 'all').map((x) => x.id)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(filterProducts(items, 'food').map((x) => x.id)).toEqual([0, 3, 6]);
  });
});

describe('section order (part 7: from worry to reassurance)', () => {
  it('tells the team, the stories and the space before the services', () => {
    expect([...PUB_SECTION_IDS]).toEqual(['gioi-thieu', 'doi-ngu', 'cau-chuyen', 'khong-gian', 'dich-vu', 'san-pham', 'quy-trinh', 'hoi-dap', 'lien-he']);
  });
});

describe('storyPhotoKey (an illustrative photo for a story that has none of its own)', () => {
  it('picks a cat photo for a cat and a dog photo for a dog, by position', () => {
    expect(storyPhotoKey('cat', 0)).toBe('meo-tam-the');
    expect(storyPhotoKey('cat', 1)).toBe('meo-trang-gang-tay');
    expect(storyPhotoKey('dog', 0)).toBe('cho-poodle-xe');
    expect(storyPhotoKey('dog', 1)).toBe('cho-vang');
  });
  it('wraps around instead of running out', () => {
    expect(storyPhotoKey('cat', 3)).toBe('meo-tam-the');
    expect(storyPhotoKey('dog', 3)).toBe('cho-poodle-xe');
  });
  it('gives no photo for another species rather than a wrong animal', () => {
    expect(storyPhotoKey('other', 0)).toBeNull();
  });
});
