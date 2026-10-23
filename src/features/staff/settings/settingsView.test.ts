import { describe, expect, it } from 'vitest';
import { CAPS, type Cap } from '@/data/rules/capabilities';
import type { AppSettingsValues } from '@/data/staff';
import { CAP_GROUPS, draftOf, extraOf, extraText, groupsFor, inheritedCaps, patchOf, rolesText, sortHolidays, viewNote } from './settingsView';

describe('capability groups', () => {
  it('place every capability in exactly one group', () => {
    const all = CAP_GROUPS.flatMap((g) => g.caps);
    expect([...all].sort()).toEqual([...CAPS].sort());
  });
  it('are the seven work areas, in order', () => {
    expect(CAP_GROUPS.map((g) => g.label)).toEqual(['Yêu cầu và lịch', 'Khách hàng', 'Nội trú', 'Hóa đơn và giá', 'Kho', 'Báo cáo và cài đặt', 'Nội dung']);
    expect(CAP_GROUPS[4]!.caps.at(-1)).toBe('stock.manage');
  });
  it('show the umbrella stock right only to someone who holds it', () => {
    const stock = (held: Cap[]) => groupsFor(new Set(held)).find((g) => g.key === CAP_GROUPS[4]!.key)!.caps;
    expect(stock([])).not.toContain('stock.manage');
    expect(stock(['stock.manage'])).toContain('stock.manage');
  });
});

describe('roles and extra rights', () => {
  it('collect what the roles give', () => {
    const spa = inheritedCaps(['spa']);
    expect(spa.has('stock.view')).toBe(true);
    expect(spa.has('stock.receive')).toBe(false);
    expect(inheritedCaps([]).size).toBe(0);
  });
  it('keep only the rights the roles do not give, in the order of CAPS', () => {
    expect(extraOf(new Set<Cap>(['stock.view', 'stock.receive', 'customers.view']), ['spa'])).toEqual(['stock.receive']);
    expect(extraOf(new Set<Cap>(['stock.receive', 'reports.operations']), ['spa'])).toEqual(['reports.operations', 'stock.receive']);
  });
  it('write the roles and the count of extra rights', () => {
    expect(rolesText(['quan_ly', 'bac_si'])).toBe('Quản lý, Bác sĩ');
    expect(extraText(0)).toBe('Không có');
    expect(extraText(3)).toBe('3 quyền thêm');
  });
});

describe('viewNote', () => {
  it('asks for viewing the stock when someone may write it but not view it', () => {
    expect(viewNote(new Set<Cap>(['stock.receive']), [])).toBe('Quyền ghi Kho cần thêm Xem kho.');
    expect(viewNote(new Set<Cap>(['stock.manage']), [])).toBe('Quyền ghi Kho cần thêm Xem kho.');
  });
  it('stays quiet when viewing comes with a role or is chosen', () => {
    expect(viewNote(new Set<Cap>(['stock.receive']), ['quan_ly'])).toBeUndefined();
    expect(viewNote(new Set<Cap>(['stock.view', 'stock.receive']), [])).toBeUndefined();
    expect(viewNote(new Set<Cap>(), [])).toBeUndefined();
  });
});

const V: AppSettingsValues = {
  stock_expiry_days: 30, stock_default_min: 5, default_duration_kham: 30, default_duration_spa: 60, calendar_start: '08:00', calendar_end: '21:00',
  payment_methods: ['cash', 'transfer', 'qr'], request_overdue_hours: 24, holidays: [{ date: '2026-11-20', note: 'Nhà giáo' }],
};

describe('system settings draft', () => {
  it('sends nothing when nothing changed', () => {
    expect(patchOf(V, draftOf(V))).toEqual({});
  });
  it('sends only the field that changed', () => {
    expect(patchOf(V, { ...draftOf(V), calendar_end: '20:00' })).toEqual({ calendar_end: '20:00' });
    expect(patchOf(V, { ...draftOf(V), default_duration_kham: '45' })).toEqual({ default_duration_kham: 45 });
  });
  it('sends an unreadable number as NaN so the rules name the field', () => {
    expect(Number.isNaN(patchOf(V, { ...draftOf(V), stock_expiry_days: 'abc' }).stock_expiry_days)).toBe(true);
  });
  it('compares the payment methods as a set', () => {
    expect(patchOf(V, { ...draftOf(V), payment_methods: ['qr', 'cash', 'transfer'] })).toEqual({});
    expect(patchOf(V, { ...draftOf(V), payment_methods: ['cash'] })).toEqual({ payment_methods: ['cash'] });
  });
  it('sends the whole holiday list when it changed and leaves empty notes out', () => {
    const d = draftOf(V);
    const patch = patchOf(V, { ...d, holidays: [...d.holidays, { date: '2026-12-25', note: '  ' }] });
    expect(patch.holidays).toEqual([{ date: '2026-11-20', note: 'Nhà giáo' }, { date: '2026-12-25' }]);
    expect(patchOf(V, { ...d, holidays: [{ date: '2026-11-20', note: 'Nhà giáo' }] })).toEqual({});
  });
});

describe('sortHolidays', () => {
  it('sorts by date without touching the original', () => {
    const list = [{ date: '2026-12-25' }, { date: '2026-11-20' }];
    expect(sortHolidays(list).map((h) => h.date)).toEqual(['2026-11-20', '2026-12-25']);
    expect(list[0]!.date).toBe('2026-12-25');
  });
});
