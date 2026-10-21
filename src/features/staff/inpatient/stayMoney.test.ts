import { describe, expect, it } from 'vitest';
import { formatVnd } from '@/lib/money';
import { dischargeMoneyLine, infoMoneyLine, stayDuration } from './stayMoney';

const IN = '2026-10-19T01:00:00Z';
const OUT = '2026-10-21T05:00:00Z'; // 52 hours later
const billing = (o: object = {}) => ({ invoiceId: 'inv-1', invoiceCode: 'HD-1', status: 'draft', dayItemName: 'Nội trú mèo', dayPrice: 150000, ...o }) as never;
const money = formatVnd(330000);

describe('infoMoneyLine', () => {
  it('shows the running charge while the pet is still here', () => {
    expect(infoMoneyLine(billing(), IN, OUT, false)).toBe(`Nội trú mèo × 2,2 ngày = ${money} · tạm tính tới bây giờ`);
  });
  it('says "đã tính" after discharge', () => {
    expect(infoMoneyLine(billing(), IN, OUT, true)).toBe(`Nội trú mèo × 2,2 ngày = ${money} · đã tính 2,2 ngày`);
  });
  it('explains the empty cases', () => {
    expect(infoMoneyLine(undefined, IN, OUT, false)).toBe('Chưa có hóa đơn');
    expect(infoMoneyLine(billing({ dayItemName: undefined, dayPrice: undefined }), IN, OUT, false)).toBe('Chưa ghi tiền nội trú');
  });
});

describe('dischargeMoneyLine', () => {
  it('shows days, hours and the total for a draft', () => {
    expect(dischargeMoneyLine(billing(), IN, OUT)).toEqual({ text: `Nội trú mèo × 2,2 ngày (52 giờ) = ${money} · Hóa đơn đang là bản nháp`, invalid: false });
  });
  it('leaves an issued or voided invoice alone', () => {
    expect(dischargeMoneyLine(billing({ status: 'issued' }), IN, OUT).text).toBe('Hóa đơn đã phát hành — không thay đổi');
    expect(dischargeMoneyLine(billing({ status: 'voided' }), IN, OUT).text).toBe('Hóa đơn đã hủy — không thay đổi');
  });
  it('explains having no invoice or no day line', () => {
    expect(dischargeMoneyLine(undefined, IN, OUT).text).toBe('Lượt nội trú này chưa có hóa đơn.');
    expect(dischargeMoneyLine(billing({ dayItemName: undefined, dayPrice: undefined }), IN, OUT).text).toBe('Chưa ghi tiền nội trú — bạn có thể thêm trong hóa đơn.');
  });
  it('flags a time before admission without NaN or a minus sign', () => {
    const r = dischargeMoneyLine(billing(), IN, '2026-10-18T01:00:00Z');
    expect(r.invalid).toBe(true);
    expect(r.text).not.toMatch(/NaN|-/);
    expect(dischargeMoneyLine(billing(), IN, 'not a date').invalid).toBe(true);
  });
});

describe('stayDuration', () => {
  it('says days and hours, or only hours under a day, or minutes under an hour', () => {
    expect(stayDuration('2026-10-19T01:00:00Z', '2026-10-21T05:00:00Z')).toBe('2 ngày 4 giờ');
    expect(stayDuration('2026-10-21T01:00:00Z', '2026-10-21T05:00:00Z')).toBe('4 giờ');
    expect(stayDuration('2026-10-21T04:30:00Z', '2026-10-21T05:00:00Z')).toBe('30 phút');
    expect(stayDuration('2026-10-19T01:00:00Z', '2026-10-20T01:00:00Z')).toBe('1 ngày');
  });
  it('never goes negative', () => expect(stayDuration('2026-10-21T05:00:00Z', '2026-10-21T04:00:00Z')).toBe('0 phút'));
});
