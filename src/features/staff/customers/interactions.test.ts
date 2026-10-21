import { describe, expect, it } from 'vitest';
import { paths } from '@/app/routes';
import { INTERACTION_ICON, interactionLink } from './interactions';

const all = () => true;

describe('interactionLink', () => {
  it('links requests, stays and invoices/payments when allowed', () => {
    expect(interactionLink({ kind: 'request', refId: 'req-YC-0234' }, all)).toBe(paths.nv.request('req-YC-0234'));
    expect(interactionLink({ kind: 'stay', refId: 's1' }, all)).toBe(paths.nv.stay('s1'));
    expect(interactionLink({ kind: 'invoice', refId: 'inv-27' }, all)).toBe(paths.nv.invoice('inv-27'));
    expect(interactionLink({ kind: 'payment', refId: 'inv-27' }, all)).toBe(paths.nv.invoice('inv-27'));
  });
  it('has no link for the other kinds, a missing id, or a missing right', () => {
    for (const kind of ['customer', 'link'] as const) expect(interactionLink({ kind, refId: 'x' }, all)).toBeUndefined();
    expect(interactionLink({ kind: 'invoice', refId: undefined }, all)).toBeUndefined();
    expect(interactionLink({ kind: 'invoice', refId: 'inv-27' }, () => false)).toBeUndefined();
    expect(interactionLink({ kind: 'stay', refId: 's1' }, () => false)).toBeUndefined();
  });
  it('links an appointment to its day on the calendar, only with the right to view appointments and a known start', () => {
    const appts = [{ id: 'a1', start_at: '2026-10-22T02:30:00.000Z' }];
    expect(interactionLink({ kind: 'appointment', refId: 'a1' }, all, appts)).toBe(`${paths.nv.calendar}?view=ngay&date=2026-10-22&lich=a1`);
    expect(interactionLink({ kind: 'appointment', refId: 'a1' }, () => false, appts)).toBeUndefined();
    expect(interactionLink({ kind: 'appointment', refId: 'zz' }, all, appts)).toBeUndefined();
    expect(interactionLink({ kind: 'appointment', refId: 'a1' }, all)).toBeUndefined();
  });
  it('asks for the right right', () => {
    const asked: unknown[] = [];
    interactionLink({ kind: 'payment', refId: 'inv-27' }, (c) => { asked.push(c); return true; });
    expect(asked).toEqual([['invoices.create', 'payments.record']]);
  });
  it('gives every kind an icon and survives an unknown kind', () => {
    for (const kind of ['customer', 'request', 'appointment', 'stay', 'invoice', 'payment', 'link'] as const) expect(INTERACTION_ICON[kind]).toBeTruthy();
    expect(interactionLink({ kind: 'weird' as never, refId: 'x' }, all)).toBeUndefined();
  });
});
