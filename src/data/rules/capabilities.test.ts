import { describe, expect, it } from 'vitest';
import { CAPS, CAP_LABEL, PRESETS, effectiveCaps } from './capabilities';

describe('capabilities', () => {
  it('has 22 capabilities', () => {
    expect(CAPS).toHaveLength(22);
  });
  it('manager preset holds everything', () => {
    expect(new Set(PRESETS.quan_ly)).toEqual(new Set(CAPS));
  });
  it('doctor issues invoices but does not take money', () => {
    const caps = effectiveCaps({ preset_ids: ['bac_si'], extra_capabilities: [] });
    expect(caps.has('invoices.create')).toBe(true);
    expect(caps.has('payments.record')).toBe(false);
    expect(caps.has('requests.handle')).toBe(false);
  });
  it('one person can hold extra capabilities', () => {
    const caps = effectiveCaps({ preset_ids: ['bac_si'], extra_capabilities: ['requests.handle'] });
    expect(caps.has('requests.handle')).toBe(true);
  });
  it('spa staff can admit and share but never see clinical records', () => {
    const caps = effectiveCaps({ preset_ids: ['spa'], extra_capabilities: [] });
    expect([...caps].sort()).toEqual(['appointments.view', 'customers.view', 'inpatient.admit', 'inpatient.diary_write', 'inpatient.share', 'inpatient.view']);
    expect(caps.has('inpatient.clinical')).toBe(false);
  });
  it('only the manager has the stock capabilities; doctor and spa are unchanged', () => {
    const mgr = effectiveCaps({ preset_ids: ['quan_ly'], extra_capabilities: [] });
    expect(mgr.has('stock.view') && mgr.has('stock.manage')).toBe(true);
    for (const p of ['bac_si', 'spa'] as const) {
      const caps = effectiveCaps({ preset_ids: [p], extra_capabilities: [] });
      expect(caps.has('stock.view') || caps.has('stock.manage')).toBe(false);
    }
  });
  it('only the manager has reports.operations, and it stays separate from reports.revenue', () => {
    const mgr = effectiveCaps({ preset_ids: ['quan_ly'], extra_capabilities: [] });
    expect(mgr.has('reports.operations') && mgr.has('reports.revenue')).toBe(true);
    for (const p of ['bac_si', 'spa'] as const) expect(effectiveCaps({ preset_ids: [p], extra_capabilities: [] }).has('reports.operations')).toBe(false);
    expect(effectiveCaps({ preset_ids: ['bac_si'], extra_capabilities: ['reports.revenue'] }).has('reports.operations')).toBe(false);
  });
  it('only the manager has staff.manage by role; it can still be granted on its own', () => {
    expect(effectiveCaps({ preset_ids: ['quan_ly'], extra_capabilities: [] }).has('staff.manage')).toBe(true);
    for (const p of ['bac_si', 'spa'] as const) expect(effectiveCaps({ preset_ids: [p], extra_capabilities: [] }).has('staff.manage')).toBe(false);
    expect(effectiveCaps({ preset_ids: ['bac_si'], extra_capabilities: ['staff.manage'] }).has('staff.manage')).toBe(true);
  });
  it('only the manager has settings.manage by role; it can still be granted on its own', () => {
    expect(effectiveCaps({ preset_ids: ['quan_ly'], extra_capabilities: [] }).has('settings.manage')).toBe(true);
    for (const p of ['bac_si', 'spa'] as const) expect(effectiveCaps({ preset_ids: [p], extra_capabilities: [] }).has('settings.manage')).toBe(false);
    expect(effectiveCaps({ preset_ids: ['spa'], extra_capabilities: ['settings.manage'] }).has('settings.manage')).toBe(true);
    expect(CAP_LABEL['settings.manage']).toBe('Quản lý cài đặt hệ thống');
  });
  it('only the manager has support.inbox by role; it can still be granted on its own', () => {
    expect(effectiveCaps({ preset_ids: ['quan_ly'], extra_capabilities: [] }).has('support.inbox')).toBe(true);
    for (const p of ['bac_si', 'spa'] as const) expect(effectiveCaps({ preset_ids: [p], extra_capabilities: [] }).has('support.inbox')).toBe(false);
    expect(effectiveCaps({ preset_ids: ['bac_si'], extra_capabilities: ['support.inbox'] }).has('support.inbox')).toBe(true);
    expect(CAP_LABEL['support.inbox']).toBe('Xử lý góp ý, báo lỗi');
  });
});
