import { describe, expect, it } from 'vitest';
import { DRAFT_DAYS, nudgeLines, oldDrafts, toastWanted } from './nudges';

const NOW = new Date('2026-10-22T09:00:00+07:00');
const ALL = { requests: true, reschedules: true, stock: true, drafts: true };

describe('oldDrafts', () => {
  it('counts only drafts older than two days', () => {
    expect(DRAFT_DAYS).toBe(2);
    const rows = [
      { status: 'draft' as const, created_at: '2026-10-19T09:00:00+07:00' },
      { status: 'draft' as const, created_at: '2026-10-20T09:00:00+07:00' }, // exactly two days: not yet
      { status: 'draft' as const, created_at: '2026-10-21T09:00:00+07:00' },
      { status: 'issued' as const, created_at: '2026-10-01T09:00:00+07:00' },
    ];
    expect(oldDrafts(rows, NOW)).toBe(1);
  });
});

describe('nudgeLines', () => {
  it('drops kinds that are off or have nothing to do, in the fixed order', () => {
    const lines = nudgeLines({ enabled: ALL, requests: 3, reschedules: 0, stock: 4, drafts: 1 });
    expect(lines.map((l) => l.key)).toEqual(['requests', 'stock', 'drafts']);
    expect(lines.map((l) => l.text)).toEqual([
      '3 yêu cầu đặt lịch đang chờ xử lý', '4 món kho đã hết hoặc sắp hết', '1 hóa đơn nháp để quá 2 ngày chưa phát hành',
    ]);
    expect(lines.map((l) => l.to)).toEqual(['/nv/yeu-cau', '/nv/kho', '/nv/hoa-don']);
  });
  it('says reschedules in plain words', () => {
    expect(nudgeLines({ enabled: ALL, requests: 0, reschedules: 2, stock: 0, drafts: 0 })).toEqual([
      { key: 'reschedules', text: '2 khách xin đổi lịch', to: '/nv/yeu-cau' },
    ]);
  });
  it('a switched-off kind never shows', () => {
    expect(nudgeLines({ enabled: { ...ALL, requests: false }, requests: 5, reschedules: 0, stock: 0, drafts: 0 })).toEqual([]);
  });
});

describe('toastWanted', () => {
  it('follows the requests switch', () => {
    expect(toastWanted(ALL)).toBe(true);
    expect(toastWanted({ ...ALL, requests: false })).toBe(false);
  });
});
