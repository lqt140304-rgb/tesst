import { describe, expect, it } from 'vitest';
import { STAY_STEP_LABELS, currentStayStep, stepIndex } from './stayStep';

const NOW = new Date('2026-10-21T05:00:00Z'); // 12:00 on 21/10 in Vietnam
const shared = (at: string, general_status: string) => ({ status: 'shared' as const, shared_at: at, general_status }) as never;
const base = { discharged_at: undefined, expected_discharge_at: undefined, diary: [] };

describe('currentStayStep', () => {
  it('is discharged once there is a discharge time', () => {
    expect(currentStayStep({ ...base, discharged_at: '2026-10-20T08:00:00Z' }, NOW)).toBe('discharged');
  });
  it('is ready when the latest shared diary says ready to go home', () => {
    expect(currentStayStep({ ...base, diary: [shared('2026-10-20T08:00:00Z', 'ready_home')] }, NOW)).toBe('ready');
  });
  it('ignores drafts and withdrawn entries', () => {
    const draft = { status: 'draft', shared_at: undefined, general_status: 'ready_home' } as never;
    const withdrawn = { status: 'withdrawn', shared_at: '2026-10-20T08:00:00Z', general_status: 'ready_home' } as never;
    expect(currentStayStep({ ...base, diary: [draft, withdrawn] }, NOW)).toBe('caring');
  });
  it('a later shared entry with another status overrides an older ready one', () => {
    const diary = [shared('2026-10-20T08:00:00Z', 'ready_home'), shared('2026-10-21T01:00:00Z', 'watch')];
    expect(currentStayStep({ ...base, diary }, NOW)).toBe('caring');
  });
  it('is ready on the expected discharge day and after, caring before', () => {
    expect(currentStayStep({ ...base, expected_discharge_at: '2026-10-21T10:00:00+07:00' }, NOW)).toBe('ready');
    expect(currentStayStep({ ...base, expected_discharge_at: '2026-10-19T10:00:00+07:00' }, NOW)).toBe('ready');
    expect(currentStayStep({ ...base, expected_discharge_at: '2026-10-22T10:00:00+07:00' }, NOW)).toBe('caring');
  });
  it('maps to the label list', () => {
    expect(STAY_STEP_LABELS).toEqual(['Nhập viện', 'Đang chăm sóc', 'Sẵn sàng về', 'Đã xuất viện']);
    expect([stepIndex('caring'), stepIndex('ready'), stepIndex('discharged')]).toEqual([1, 2, 3]);
  });
});
