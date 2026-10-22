import { describe, expect, it } from 'vitest';
import { CAPS, CAP_LABEL, PRESETS, effectiveCaps } from './capabilities';

describe('capabilities', () => {
  it('has 27 capabilities', () => {
    expect(CAPS).toHaveLength(27);
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
    expect([...caps].sort()).toEqual(['appointments.view', 'customers.view', 'inpatient.admit', 'inpatient.diary_write', 'inpatient.share', 'inpatient.view', 'stock.view']);
    expect(caps.has('inpatient.clinical')).toBe(false);
  });
  it('everyone on staff may see the stock; only the manager writes it by role (owner, 22/10)', () => {
    const mgr = effectiveCaps({ preset_ids: ['quan_ly'], extra_capabilities: [] });
    for (const c of ['stock.view', 'stock.receive', 'stock.issue', 'stock.adjust', 'stock.items', 'stock.manage'] as const) expect(mgr.has(c)).toBe(true);
    for (const p of ['bac_si', 'spa'] as const) {
      const caps = effectiveCaps({ preset_ids: [p], extra_capabilities: [] });
      expect(caps.has('stock.view')).toBe(true);
      for (const c of ['stock.receive', 'stock.issue', 'stock.adjust', 'stock.items', 'stock.manage'] as const) expect(caps.has(c)).toBe(false);
    }
  });
  it('each stock write right can be given on its own, and the old stock.manage stands for all four', () => {
    for (const c of ['stock.receive', 'stock.issue', 'stock.adjust', 'stock.items'] as const) {
      const caps = effectiveCaps({ preset_ids: ['spa'], extra_capabilities: [c] });
      expect(caps.has(c)).toBe(true);
      expect(['stock.receive', 'stock.issue', 'stock.adjust', 'stock.items'].filter((x) => caps.has(x as never))).toEqual([c]);
    }
    const old = effectiveCaps({ preset_ids: ['spa'], extra_capabilities: ['stock.manage'] });
    for (const c of ['stock.receive', 'stock.issue', 'stock.adjust', 'stock.items'] as const) expect(old.has(c)).toBe(true);
    expect(CAP_LABEL['stock.receive']).toBe('Nhập thêm kho');
    expect(CAP_LABEL['stock.issue']).toBe('Xuất kho');
    expect(CAP_LABEL['stock.adjust']).toBe('Kiểm kê kho');
    expect(CAP_LABEL['stock.items']).toBe('Thêm, sửa, ngừng dùng món kho');
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
  it('the manager and the doctor have content.publish by role, the spa does not; it can still be granted on its own', () => {
    for (const p of ['quan_ly', 'bac_si'] as const) expect(effectiveCaps({ preset_ids: [p], extra_capabilities: [] }).has('content.publish')).toBe(true);
    expect(effectiveCaps({ preset_ids: ['spa'], extra_capabilities: [] }).has('content.publish')).toBe(false);
    expect(effectiveCaps({ preset_ids: ['spa'], extra_capabilities: ['content.publish'] }).has('content.publish')).toBe(true);
    expect(CAP_LABEL['content.publish']).toBe('Đăng nội dung trang giới thiệu');
  });
  it('only the manager has support.inbox by role; it can still be granted on its own', () => {
    expect(effectiveCaps({ preset_ids: ['quan_ly'], extra_capabilities: [] }).has('support.inbox')).toBe(true);
    for (const p of ['bac_si', 'spa'] as const) expect(effectiveCaps({ preset_ids: [p], extra_capabilities: [] }).has('support.inbox')).toBe(false);
    expect(effectiveCaps({ preset_ids: ['bac_si'], extra_capabilities: ['support.inbox'] }).has('support.inbox')).toBe(true);
    expect(CAP_LABEL['support.inbox']).toBe('Xử lý góp ý, báo lỗi');
  });
});
