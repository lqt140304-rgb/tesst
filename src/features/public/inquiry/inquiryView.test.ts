import { describe, expect, it } from 'vitest';
import { INQUIRY_MAX, SLOT_DROPPED_MSG, counter, slotView } from './inquiryView';

describe('slotView', () => {
  it('an ordinary day offers every slot and says nothing', () => {
    const v = slotView('18-20', '2026-10-27', []);
    expect(v.slots).toHaveLength(7);
    expect(v).toMatchObject({ outOfHours: false, holidayNote: null, slotDropped: false });
  });
  it('a holiday keeps only the slots that end by 19:00, says so, and drops a later chosen slot', () => {
    const v = slotView('18-20', '2026-10-26', ['2026-10-26']);
    expect(v.slots).not.toContain('18-20');
    expect(v.slots).not.toContain('20-21');
    expect(v.slots).toContain('16-18');
    expect(v.holidayNote).toBe('Ngày này Lê Sơn làm đến 19:00.');
    expect(v.slotDropped).toBe(true);
  });
  it('an early slot on a holiday stays chosen', () => {
    expect(slotView('10-12', '2026-10-26', ['2026-10-26']).slotDropped).toBe(false);
  });
  it('"other" is out of hours and never counts as dropped', () => {
    expect(slotView('other', '2026-10-26', ['2026-10-26'])).toMatchObject({ outOfHours: true, slotDropped: false });
  });
  it('no slot chosen: nothing out of hours, nothing dropped', () => {
    expect(slotView('', '2026-10-26', ['2026-10-26'])).toMatchObject({ outOfHours: false, slotDropped: false });
  });
  it('the dropped-slot sentence is fixed', () => {
    expect(SLOT_DROPPED_MSG).toBe('Khung giờ đã được bỏ chọn vì ngày này Lê Sơn làm đến 19:00.');
  });
});

describe('counter and limits', () => {
  it('counts the trimmed text', () => {
    expect(counter('  abc ', 500)).toBe('3/500');
    expect(INQUIRY_MAX).toEqual({ name: 60, text: 500, about: 60 });
  });
});
