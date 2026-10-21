import { PAYMENT_METHODS, PRICE_CATEGORIES } from '../../../contracts/enums';
import type { RevenueReport, StaffReportsApi } from '../../../contracts/staff';
import { addDays, dayOf } from '../../../../lib/dates';
import { netLineTotals, paymentState } from '../../../rules/invoice-math';
import type { Env } from '../../env';
import { sleepRead } from '../../latency';
import type { Doc } from '../../store/schema';
import { staffActor } from './common';

/** Money in the range: collected by payment day, invoiced by issue day, owed as of now. Shared with the operations report. */
export function revenueReport(t: Readonly<Doc['t']>, { from, to }: { from: string; to: string }): RevenueReport {
  const inRange = (iso?: string) => !!iso && dayOf(iso) >= from && dayOf(iso) <= to;
  const pays = t.payments.filter((p) => !p.reversed_at && inRange(p.received_at));
  const byMethod = Object.fromEntries(PAYMENT_METHODS.map((m) => [m, pays.filter((p) => p.method === m).reduce((s, p) => s + p.amount, 0)])) as Record<(typeof PAYMENT_METHODS)[number], number>;
  const issued = t.invoices.filter((i) => i.status === 'issued' && inRange(i.issued_at));
  // After discount: each invoice's total is shared over its lines, so the categories add up to what was invoiced.
  const byCategory = Object.fromEntries(PRICE_CATEGORIES.map((c) => [c, 0])) as Record<(typeof PRICE_CATEGORIES)[number], number>;
  for (const i of issued) {
    const lines = t.invoice_lines.filter((l) => l.invoice_id === i.id);
    netLineTotals(lines.map((l) => l.line_total), i.total).forEach((n, k) => { byCategory[lines[k]!.category_snapshot] += n; });
  }
  const open = t.invoices.filter((i) => i.status === 'issued').map((i) => paymentState(i.total, t.payments.filter((p) => p.invoice_id === i.id))).filter((s) => s.remaining > 0);
  const daily: { date: string; amount: number }[] = [];
  for (let day = from; day <= to; day = addDays(day, 1)) daily.push({ date: day, amount: pays.filter((p) => dayOf(p.received_at) === day).reduce((s, p) => s + p.amount, 0) });
  return {
    from, to, collected: pays.reduce((s, p) => s + p.amount, 0), byMethod, byCategory, invoiced: issued.reduce((s, i) => s + i.total, 0),
    outstanding: open.reduce((s, x) => s + x.remaining, 0), outstandingCount: open.length, daily, invoicesIssued: issued.length,
  };
}

export function staffReportsApi(env: Env): StaffReportsApi {
  return {
    async revenue(range) {
      staffActor(env, 'reports.revenue');
      await sleepRead();
      return revenueReport(env.db.read().t, range);
    },
  };
}
