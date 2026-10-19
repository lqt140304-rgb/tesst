import { describe, expect, it } from 'vitest';
import {
  APPOINTMENT_STATUSES, APPOINTMENT_STATUS_LABEL, GENERAL_STATUSES, GENERAL_STATUS_LABEL, INTERNAL_STATUSES, INTERNAL_STATUS_LABEL,
  PAYMENT_STATES, PAYMENT_STATE_LABEL, REQUEST_STATUSES, REQUEST_STATUS_LABEL,
} from '../data/contracts/enums';
import { statusPill } from './status';

describe('statusPill', () => {
  it('maps every request status to its locked label, a tone and an icon', () => {
    for (const s of REQUEST_STATUSES) {
      const p = statusPill('request', s);
      expect(p.label).toBe(REQUEST_STATUS_LABEL[s]);
      expect(p.icon).toBeTruthy();
    }
    expect(statusPill('request', 'unreachable').tone).toBe('rose');
    expect(statusPill('request', 'rejected').tone).toBe('outline');
  });
  it('maps payment, appointment, internal and general statuses', () => {
    for (const s of PAYMENT_STATES) expect(statusPill('payment', s).label).toBe(PAYMENT_STATE_LABEL[s]);
    for (const s of APPOINTMENT_STATUSES) expect(statusPill('appointment', s).label).toBe(APPOINTMENT_STATUS_LABEL[s]);
    for (const s of INTERNAL_STATUSES) expect(statusPill('internal', s).label).toBe(INTERNAL_STATUS_LABEL[s]);
    for (const s of GENERAL_STATUSES) expect(statusPill('general', s).label).toBe(GENERAL_STATUS_LABEL[s]);
    expect(statusPill('payment', 'partial').tone).toBe('honey');
    expect(statusPill('general', 'want_to_talk')).toMatchObject({ tone: 'orange', icon: 'phone' });
  });
  it('maps video expiry by days left', () => {
    expect(statusPill('expiry', 2)).toMatchObject({ label: 'Còn 2 ngày', tone: 'rose' });
    expect(statusPill('expiry', 10).tone).toBe('orange');
    expect(statusPill('expiry', 45).tone).toBe('grey');
  });
  it('the call-back flag uses orange-700 small text, never orange-600', () => {
    expect(statusPill('flag', 'resubmit')).toMatchObject({ label: 'Khách vừa gửi lại — cần gọi lại', tone: 'flag', icon: 'phone-redo' });
  });
});
