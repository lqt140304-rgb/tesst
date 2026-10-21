import { PAYMENT_METHODS, PRICE_CATEGORIES } from '../../../contracts/enums';
import { ValidationError } from '../../../contracts/errors';
import type { StaffInvoiceDetail, StaffInvoiceRow, StaffInvoicesApi, StaffReportsApi } from '../../../contracts/staff';
import { addDays, dayOf, toIsoVN } from '../../../../lib/dates';
import { formatVnd } from '../../../../lib/money';
import { cashChange, invoiceTotals, lineTotal, netLineTotals, paymentState } from '../../../rules/invoice-math';
import type { Env } from '../../env';
import { newId, nextCode } from '../../ids';
import { sleepRead, sleepWrite } from '../../latency';
import type { Doc, Invoice } from '../../store/schema';
import { checkVersion } from '../../store/version';
import { audit, find, fold, staffActor, staffName } from './common';

function row(doc: Readonly<Doc>, i: Invoice): StaffInvoiceRow {
  const ps = paymentState(i.total, doc.t.payments.filter((p) => p.invoice_id === i.id));
  return {
    id: i.id, code: i.code, customerId: i.customer_id, customerName: doc.t.customers.find((c) => c.id === i.customer_id)?.full_name ?? '—',
    petNames: i.pet_ids.map((id) => doc.t.pets.find((p) => p.id === id)?.name ?? '').filter(Boolean), status: i.status,
    state: i.status === 'issued' ? ps.state : undefined, total: i.total, paid: ps.paid, remaining: i.status === 'issued' ? ps.remaining : 0,
    created_at: i.created_at, issued_at: i.issued_at, sourceType: i.source_type,
  };
}

const BILLING = ['invoices.create', 'payments.record'] as const;

export function staffInvoicesApi(env: Env): StaffInvoicesApi {
  const { db } = env;

  function editDraft(id: string, version: number, label: string, fn: (d: Doc, inv: Invoice) => void) {
    staffActor(env, 'invoices.create');
    return db.transact(label, (d) => {
      const inv = find(d.t.invoices, id);
      checkVersion(inv, version);
      if (inv.status !== 'draft') throw new ValidationError({ status: 'Hóa đơn đã phát hành không sửa được.' });
      fn(d, inv);
      inv.version += 1;
      return inv.version;
    });
  }

  return {
    async list({ state, q }) {
      staffActor(env, [...BILLING]);
      await sleepRead();
      const doc = db.read();
      const needle = q ? fold(q.trim()) : '';
      return doc.t.invoices.map((i) => row(doc, i))
        .filter((r) => !state || (state === 'draft' || state === 'voided' ? r.status === state : r.status === 'issued' && r.state === state))
        .filter((r) => !needle || [r.code, r.customerName, ...r.petNames].some((x) => fold(x).includes(needle)))
        .sort((a, b) => (b.issued_at ?? b.created_at).localeCompare(a.issued_at ?? a.created_at));
    },

    async get(id) {
      staffActor(env, [...BILLING]);
      await sleepRead();
      const doc = db.read();
      const i = find(doc.t.invoices as Invoice[], id);
      const detail: StaffInvoiceDetail = {
        ...row(doc, i),
        version: i.version, subtotal: i.subtotal, discount: i.discount, note_customer: i.note_customer,
        customerPhone: doc.t.customers.find((c) => c.id === i.customer_id)?.phone_e164 ?? '',
        issuedByName: staffName(doc, i.issued_by), createdByName: staffName(doc, i.created_by), voidReason: i.void_reason_text,
        replacesCode: i.replaces_invoice_id ? doc.t.invoices.find((x) => x.id === i.replaces_invoice_id)?.code : undefined,
        lines: doc.t.invoice_lines.filter((l) => l.invoice_id === id).map((l) => {
          const item = doc.t.price_items.find((p) => p.id === l.price_item_id);
          return {
            id: l.id, price_item_id: l.price_item_id, code: item?.code ?? '', name: l.name_snapshot, unit: l.unit_snapshot,
            unit_price: l.unit_price, qty: l.qty, line_total: l.line_total, pet_id: l.pet_id, petName: l.pet_id ? doc.t.pets.find((p) => p.id === l.pet_id)?.name : undefined,
            category: l.category_snapshot, customer_group: l.customer_group_snapshot, price_mode: item?.price_mode ?? 'fixed',
          };
        }),
        payments: doc.t.payments.filter((p) => p.invoice_id === id).sort((a, b) => a.received_at.localeCompare(b.received_at)).map((p) => ({
          id: p.id, code: p.code, amount: p.amount, method: p.method, received_at: p.received_at, receivedByName: staffName(doc, p.received_by),
          cash_given: p.cash_given, change: p.cash_given !== undefined ? cashChange(p.amount, p.cash_given) : undefined, reversed_at: p.reversed_at, reverse_reason: p.reverse_reason,
        })),
      };
      return detail;
    },

    async createDraft({ customer_id, pet_ids, source_type, source_id }) {
      const a = staffActor(env, 'invoices.create');
      await sleepWrite();
      return db.transact('invoices.createDraft', (d) => {
        const c = find(d.t.customers, customer_id);
        for (const p of pet_ids) if (find(d.t.pets, p).customer_id !== c.id) throw new ValidationError({ pet_ids: 'Bé không thuộc hồ sơ khách hàng này.' });
        const id = newId();
        const code = nextCode(d, 'HD');
        d.t.invoices.push({ id, code, customer_id: c.id, pet_ids, source_type, source_id, status: 'draft', subtotal: 0, total: 0, created_by: a.staff.id, created_at: toIsoVN(env.clock()), version: 1 });
        audit(d, env, a, 'invoice.draft', 'invoice', id, `${a.staff.display_name} tạo hóa đơn nháp ${code}`);
        return id;
      });
    },

    async updateDraft(id, version, { lines, note_customer }) {
      await sleepWrite();
      return editDraft(id, version, 'invoices.updateDraft', (d, inv) => {
        // A line already on this draft keeps its name, unit, group and price from when it was added (R36); only new lines read the price list.
        const before = d.t.invoice_lines.filter((x) => x.invoice_id === inv.id);
        const reused = new Set<string>();
        const rows = lines.map((l, j) => {
          const item = find(d.t.price_items, l.price_item_id);
          const prev = before.find((x) => x.price_item_id === item.id && !reused.has(x.id));
          // A switched-off item may stay on the draft, but each line needs its own stored line: no more lines of it than before.
          if (!item.active && !prev) throw new ValidationError({ [`lines.${j}`]: `Mục "${item.name}" đã ngừng dùng. Bạn chọn mục khác nhé.` });
          if (prev) reused.add(prev.id);
          if (!(l.qty > 0)) throw new ValidationError({ [`lines.${j}`]: 'Số lượng phải lớn hơn 0.' });
          const unit_price = item.price_mode === 'open' ? l.unit_price ?? prev?.unit_price : l.unit_price ?? prev?.unit_price ?? item.price;
          if (unit_price === undefined || !(unit_price >= 0)) throw new ValidationError({ [`lines.${j}`]: `Vui lòng nhập đơn giá cho "${item.name}".` });
          return { id: newId(), invoice_id: inv.id, price_item_id: item.id, pet_id: l.pet_id, name_snapshot: prev?.name_snapshot ?? item.name, category_snapshot: prev?.category_snapshot ?? item.category, customer_group_snapshot: prev?.customer_group_snapshot ?? item.customer_group, unit_snapshot: prev?.unit_snapshot ?? item.unit, unit_price, qty: l.qty, line_total: lineTotal(unit_price, l.qty) };
        });
        d.t.invoice_lines = d.t.invoice_lines.filter((l) => l.invoice_id !== inv.id).concat(rows);
        const totals = invoiceTotals(rows, inv.discount);
        inv.subtotal = totals.subtotal;
        inv.total = totals.total;
        inv.note_customer = note_customer?.trim() || undefined;
      });
    },

    async issue(id, version) {
      await sleepWrite();
      const a = staffActor(env, 'invoices.create');
      db.transact('invoices.issue', (d) => {
        const inv = find(d.t.invoices, id);
        checkVersion(inv, version);
        if (inv.status !== 'draft') throw new ValidationError({ status: 'Hóa đơn đã phát hành không sửa được.' });
        if (!d.t.invoice_lines.some((l) => l.invoice_id === id)) throw new ValidationError({ lines: 'Hóa đơn chưa có dòng nào.' });
        inv.status = 'issued';
        inv.issued_at = toIsoVN(env.clock());
        inv.issued_by = a.staff.id;
        inv.version += 1;
        audit(d, env, a, 'invoice.issue', 'invoice', id, `${a.staff.display_name} phát hành hóa đơn ${inv.code} (${formatVnd(inv.total)})`);
      });
    },

    payments: {
      async record(invoiceId, { amount, method, cash_given, note }) {
        const a = staffActor(env, 'payments.record');
        await sleepWrite();
        return db.transact('payments.record', (d) => {
          const inv = find(d.t.invoices, invoiceId);
          if (inv.status !== 'issued') throw new ValidationError({ invoice: 'Chỉ thu tiền cho hóa đơn đã phát hành.' });
          const { remaining } = paymentState(inv.total, d.t.payments.filter((p) => p.invoice_id === inv.id));
          if (!(amount > 0) || amount > remaining) throw new ValidationError({ amount: `Số tiền cần từ 1 ₫ đến ${formatVnd(remaining)}.` });
          if (method === 'cash' && cash_given !== undefined && cash_given < amount) throw new ValidationError({ cash_given: 'Tiền khách đưa chưa đủ.' });
          const code = nextCode(d, 'PT');
          d.t.payments.push({ id: newId(), code, invoice_id: inv.id, amount, method, received_at: toIsoVN(env.clock()), received_by: a.staff.id, cash_given: method === 'cash' ? cash_given ?? amount : undefined, note: note?.trim() || undefined });
          audit(d, env, a, 'payment.record', 'invoice', inv.id, `${a.staff.display_name} thu ${formatVnd(amount)} cho ${inv.code}`);
          return { change: method === 'cash' && cash_given !== undefined ? cashChange(amount, cash_given) : 0 };
        });
      },
    },
  };
}

export function staffReportsApi(env: Env): StaffReportsApi {
  return {
    async revenue({ from, to }) {
      staffActor(env, 'reports.revenue');
      await sleepRead();
      const { t } = env.db.read();
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
    },
  };
}
