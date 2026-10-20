import { describe, expect, it } from 'vitest';
import { CAPS, PRESETS, effectiveCaps } from './capabilities';

describe('capabilities', () => {
  it('has 16 capabilities', () => {
    expect(CAPS).toHaveLength(16);
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
});
