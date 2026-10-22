import { PAYMENT_METHODS, PRICE_CATEGORIES } from '../../../contracts/enums';
import { ValidationError } from '../../../contracts/errors';
import type { OperationsReport, RevenueReport, StaffReportsApi } from '../../../contracts/staff';
import { addDays, dayOf, todayVN } from '../../../../lib/dates';
import { previousPeriod, validateRange } from '../../../rules/calendar';
import { netLineTotals, paymentState } from '../../../rules/invoice-math';
import { appointmentStats, countInRange, inpatientStats, requestStats } from '../../../rules/operations-report';
import type { Env } from '../../env';
import { sleepRead } from '../../latency';
import type { Doc } from '../../store/schema';
import { staffActor } from './common';
import { summarizeStock, toRow } from './stock';

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
      const errors = validateRange(range);
      if (Object.keys(errors).length) throw new ValidationError(errors);
      return revenueReport(env.db.read().t, range);
    },

    async operations(range) {
      const a = staffActor(env, 'reports.operations');
      await sleepRead();
      const errors = validateRange(range);
      if (Object.keys(errors).length) throw new ValidationError(errors);
      const { from, to } = range;
      const prev = previousPeriod(from, to);
      const now = env.clock();
      const { t } = env.db.read();
      const people = t.staff_users.map((u) => ({ id: u.id, name: u.display_name }));
      const stock = summarizeStock(t.stock_items.map((i) => toRow(i, todayVN(now))));
      const customerDates = t.customers.map((c) => c.created_at);
      const report: OperationsReport = {
        from, to, previous: prev,
        appointments: appointmentStats(t.appointments, people, range, prev),
        requests: requestStats(t.booking_requests, t.request_events, range, prev),
        inpatient: inpatientStats(t.stays, t.cages.filter((c) => c.active).length, range, prev, now),
        customers: { newCustomers: countInRange(customerDates, range), previousNewCustomers: countInRange(customerDates, prev) },
        stock: { low: stock.low, out: stock.out, expiringSoon: stock.expiringSoon, expired: stock.expired },
      };
      // Money figures stay behind their own capability, so this report never widens who can see revenue.
      if (a.caps.has('reports.revenue')) {
        const money = revenueReport(t, range);
        report.revenue = { collected: money.collected, invoiced: money.invoiced, outstanding: money.outstanding, previousCollected: revenueReport(t, prev).collected };
      }
      return report;
    },
  };
}
