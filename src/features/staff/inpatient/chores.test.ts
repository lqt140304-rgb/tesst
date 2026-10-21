import { describe, expect, it } from 'vitest';
import type { Cap } from '@/data/rules/capabilities';
import { dischargeReminders, stayChores } from './chores';

const NOW = new Date('2026-10-21T05:00:00Z');
const all = () => true;
const none = () => false;
const only = (...caps: Cap[]) => (c: Cap | Cap[]) => (Array.isArray(c) ? c : [c]).some((x) => caps.includes(x));
const draftVideo = { share_status: 'draft', deleted: false } as never;
const v = (o: object = {}) => ({ diary: [], videos: [], billing: undefined, discharged_at: undefined, ...o }) as never;

describe('stayChores', () => {
  it('has nothing to suggest once the pet is discharged', () => {
    expect(stayChores(v({ discharged_at: '2026-10-20T08:00:00Z' }), all, NOW)).toEqual([]);
  });
  it('asks for today\'s diary only from people who can share, and only until one is shared today', () => {
    expect(stayChores(v(), only('inpatient.share'), NOW).map((c) => c.label)).toEqual(['Chưa gửi nhật ký hôm nay']);
    expect(stayChores(v(), none, NOW)).toEqual([]);
    const today = { status: 'shared', shared_at: '2026-10-21T01:00:00Z' } as never;
    expect(stayChores(v({ diary: [today] }), only('inpatient.share'), NOW)).toEqual([]);
    const yesterday = { status: 'shared', shared_at: '2026-10-20T01:00:00Z' } as never;
    expect(stayChores(v({ diary: [yesterday] }), only('inpatient.share'), NOW)).toHaveLength(1);
  });
  it('counts draft videos that are not deleted, singular and plural alike', () => {
    const one = stayChores(v({ videos: [draftVideo] }), only('inpatient.share'), NOW);
    expect(one.find((c) => c.key === 'videos')).toMatchObject({ label: '1 video chưa chia sẻ', tab: 'videos' });
    const two = stayChores(v({ videos: [draftVideo, draftVideo, { share_status: 'draft', deleted: true } as never] }), only('inpatient.share'), NOW);
    expect(two.find((c) => c.key === 'videos')?.label).toBe('2 video chưa chia sẻ');
  });
  it('suggests issuing the invoice only for a draft and with a billing right', () => {
    const billing = { status: 'draft' } as never;
    expect(stayChores(v({ billing }), only('invoices.create'), NOW).map((c) => c.key)).toContain('invoice');
    expect(stayChores(v({ billing }), none, NOW).map((c) => c.key)).not.toContain('invoice');
    expect(stayChores(v({ billing: { status: 'issued' } as never }), all, NOW).map((c) => c.key)).not.toContain('invoice');
  });
});

describe('dischargeReminders', () => {
  it('lists drafts and an unissued invoice', () => {
    const diary = [{ status: 'draft' }, { status: 'draft' }, { status: 'shared' }] as never;
    expect(dischargeReminders(v({ diary, videos: [draftVideo], billing: { status: 'draft' } as never }), all)).toEqual([
      'Còn 2 nhật ký nháp chưa chia sẻ', 'Còn 1 video nháp', 'Hóa đơn chưa phát hành',
    ]);
  });
  it('is empty when nothing is pending', () => {
    expect(dischargeReminders(v(), all)).toEqual([]);
  });
});
