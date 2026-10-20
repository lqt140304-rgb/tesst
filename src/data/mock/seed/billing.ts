import type { CustomerGroup, PaymentMethod, PriceCategory } from '../../contracts/enums';
import { invoiceTotals, lineTotal } from '../../rules/invoice-math';
import { DAY_ITEM_CODES } from '../../rules/stay-billing';
import type { Invoice, InvoiceLine, Payment, PriceItem } from '../store/schema';
import { cus, pet, petCustomer, STAFF } from './accounts';
import type { SeedCtx } from './ctx';
import { stay } from './inpatient';

type P = [code: string, category: PriceCategory, name: string, unit: string, price: number | null];
const PRICES: P[] = [
  ['KB01', 'exam', 'Khám lâm sàng', 'lần', 150000], ['KB02', 'exam', 'Tái khám', 'lần', 100000], ['KB03', 'exam', 'Khám cấp cứu', 'lần', 300000],
  ['KB04', 'exam', 'Tiêm phòng', 'mũi', 250000], ['KB05', 'exam', 'Tẩy giun', 'lần', 80000], ['KB06', 'exam', 'Truyền dịch', 'lần', 120000],
  ['KB07', 'exam', 'Tiêm thuốc', 'mũi', 60000], ['KB08', 'exam', 'Vệ sinh, xử lý vết thương', 'lần', 150000], ['KB09', 'exam', 'Thủ thuật theo chỉ định', 'lần', null],
  ['SP01', 'spa', 'Tắm sấy chó dưới 5 kg', 'lần', 150000], ['SP02', 'spa', 'Tắm sấy chó 5–15 kg', 'lần', 220000], ['SP03', 'spa', 'Tắm sấy chó trên 15 kg', 'lần', 320000],
  ['SP04', 'spa', 'Tắm sấy mèo', 'lần', 200000], ['SP05', 'spa', 'Cắt tỉa tạo kiểu', 'lần', 200000], ['SP06', 'spa', 'Cắt móng', 'lần', 50000], ['SP07', 'spa', 'Vệ sinh tai', 'lần', 50000],
  ['LT01', 'inpatient', 'Nội trú mèo', 'ngày', 150000], ['LT02', 'inpatient', 'Nội trú chó dưới 15 kg', 'ngày', 180000], ['LT03', 'inpatient', 'Nội trú chó từ 15 kg', 'ngày', 250000],
  ['LT04', 'inpatient', 'Chăm sóc tăng cường', 'ngày', 200000],
  ['TH01', 'medicine', 'Dịch truyền', 'chai 500 ml', 45000], ['TH02', 'medicine', 'Kháng sinh đường uống', 'vỉ', 60000], ['TH03', 'medicine', 'Men tiêu hóa', 'gói', 15000],
  ['TH04', 'medicine', 'Thuốc nhỏ mắt/tai', 'lọ', 85000], ['TH05', 'medicine', 'Giảm đau đường uống', 'viên', 12000], ['TH06', 'medicine', 'Thuốc theo đơn khác', 'đơn', null],
  ['VT01', 'supply', 'Băng gạc', 'bộ', 30000], ['VT02', 'supply', 'Kim luồn', 'cái', 25000], ['VT03', 'supply', 'Vòng chống liếm', 'cái', 90000],
  ['VT04', 'supply', 'Tã lót thú cưng', 'miếng', 10000], ['VT05', 'supply', 'Vật tư khác', 'cái', null],
];
/** R7: medicines, consumables and treatment procedures are one combined line for customers. */
const TREATMENT = new Set(['KB06', 'KB07', 'KB09']);
const groupOf = (code: string, cat: PriceCategory): CustomerGroup =>
  cat === 'medicine' || cat === 'supply' || TREATMENT.has(code) ? 'treatment' : 'itemized';
export const priceId = (code: string) => `pi-${code}`;

type L = [code: string, qty: number, petSlug?: string, unitPrice?: number];
type InvSeed = {
  customer: string; pets: string[]; source: Invoice['source_type']; sourceId?: string; lines: L[]; created: string;
  issued?: string; by?: string; pays?: [amount: number | 'all', method: PaymentMethod, at: string, opts?: { given?: number; reversed?: { at: string; reason: string } }][];
  discount?: { type: 'percent' | 'amount'; value: number; reason: string }; voided?: { at: string; code: string; text: string };
};

export function seedBilling(c: SeedCtx): void {
  const { t } = c.doc;
  const { d, ago } = c;
  for (const [code, category, name, unit, price] of PRICES) {
    t.price_items.push({ id: priceId(code), code, category, customer_group: groupOf(code, category), name, unit, price: price ?? 0, price_mode: price === null ? 'open' : 'fixed', active: true, updated_at: d(-30, '09:00'), updated_by: STAFF.ha } satisfies PriceItem);
  }

  const S: InvSeed[] = [];
  const of = (slug: string) => petCustomer(slug);
  // Drafts: one per active stay.
  S.push(
    { customer: of('miu'), pets: ['miu'], source: 'stay', sourceId: stay('NT-0041'), created: d(-2, '10:40'), lines: [['LT01', 2, 'miu'], ['KB06', 4, 'miu'], ['KB07', 2, 'miu'], ['TH01', 2, 'miu'], ['TH05', 4, 'miu']] },
    { customer: of('kem'), pets: ['kem'], source: 'stay', sourceId: stay('NT-0044'), created: ago(175), lines: [['LT02', 1, 'kem'], ['KB06', 1, 'kem']] },
    { customer: of('mochi'), pets: ['mochi'], source: 'stay', sourceId: stay('NT-0039'), created: d(-4, '11:10'), lines: [['LT02', 4, 'mochi'], ['TH02', 1, 'mochi']] },
    { customer: of('lu'), pets: ['lu'], source: 'stay', sourceId: stay('NT-0040'), created: d(-3, '10:00'), lines: [['LT02', 3, 'lu'], ['LT04', 3, 'lu'], ['KB06', 3, 'lu'], ['KB07', 4, 'lu']] },
    { customer: of('gao'), pets: ['gao'], source: 'stay', sourceId: stay('NT-0043'), created: d(-1, '11:50'), lines: [['LT01', 1, 'gao'], ['TH03', 1, 'gao'], ['TH04', 1, 'gao']] },
  );
  // Issued, unpaid.
  S.push(
    { customer: of('com'), pets: ['com'], source: 'appointment', created: ago(30), issued: ago(25), by: STAFF.ha, lines: [['SP01', 1, 'com'], ['SP05', 1, 'com'], ['SP06', 1, 'com']] },
    { customer: of('kem'), pets: ['kem'], source: 'appointment', created: d(-1, '16:40'), issued: d(-1, '16:45'), by: STAFF.duc, lines: [['KB01', 1, 'kem'], ['KB06', 1, 'kem'], ['TH01', 1, 'kem']] },
    { customer: of('milo'), pets: ['milo'], source: 'appointment', created: d(-10, '10:30'), issued: d(-10, '10:35'), by: STAFF.duc, lines: [['KB01', 1, 'milo'], ['TH02', 1, 'milo'], ['VT01', 1, 'milo']] },
    { customer: cus(1), pets: ['bong'], source: 'counter', created: d(-3, '17:00'), issued: d(-3, '17:05'), by: STAFF.mai, lines: [['KB01', 1, 'bong'], ['KB05', 1, 'bong']] },
  );
  // Partially paid.
  S.push(
    { customer: of('bo'), pets: ['bo'], source: 'stay', sourceId: stay('NT-0035'), created: d(-52, '15:30'), issued: d(-52, '15:40'), by: STAFF.duc,
      lines: [['LT03', 6, 'bo'], ['LT04', 6, 'bo'], ['KB06', 5, 'bo'], ['KB01', 1, 'bo']], pays: [[2000000, 'transfer', d(-52, '15:50')]] },
    { customer: of('soi'), pets: ['soi'], source: 'appointment', created: d(-6, '10:40'), issued: d(-6, '10:45'), by: STAFF.duc,
      lines: [['KB01', 1, 'soi'], ['KB08', 1, 'soi'], ['VT03', 1, 'soi'], ['SP02', 1, 'soi'], ['VT01', 1, 'soi']], pays: [[300000, 'cash', d(-6, '10:50'), { given: 300000 }]] },
  );
  // Voided (wrong customer), replaced by a paid invoice below.
  S.push({ customer: of('tom'), pets: ['tom'], source: 'appointment', created: d(-6, '15:20'), issued: d(-6, '15:25'), by: STAFF.mai, lines: [['KB01', 1, 'tom'], ['TH03', 2, 'tom']], voided: { at: d(-6, '15:40'), code: 'lap_nham_khach', text: 'Lập nhầm khách hàng' } });
  // Paid: fixed anchors.
  S.push(
    { customer: of('muop'), pets: ['muop'], source: 'appointment', created: d(-6, '15:42'), issued: d(-6, '15:45'), by: STAFF.mai, lines: [['KB01', 1, 'muop'], ['TH03', 2, 'muop']], pays: [['all', 'cash', d(-6, '15:50'), { given: 200000 }]] },
    { customer: of('bin'), pets: ['bin'], source: 'appointment', created: ago(55), issued: ago(50), by: STAFF.mai, lines: [['KB02', 1, 'bin'], ['KB05', 1, 'bin']], pays: [['all', 'cash', ago(48), { given: 200000 }]] },
    { customer: cus(1), pets: ['bong'], source: 'appointment', created: d(-20, '10:20'), issued: d(-20, '10:25'), by: STAFF.duc, lines: [['KB04', 1, 'bong'], ['SP01', 1, 'bong']], pays: [['all', 'cash', d(-20, '10:30'), { given: 500000 }]] },
    { customer: of('lucky'), pets: ['lucky'], source: 'appointment', created: d(-5, '15:40'), issued: d(-5, '15:45'), by: STAFF.ha, lines: [['SP02', 1, 'lucky'], ['SP05', 1, 'lucky'], ['SP07', 1, 'lucky']], discount: { type: 'percent', value: 10, reason: 'Khách quen' }, pays: [['all', 'qr', d(-5, '15:50')]] },
    { customer: of('oi'), pets: ['oi'], source: 'appointment', created: d(-2, '15:40'), issued: d(-2, '15:45'), by: STAFF.duc, lines: [['KB01', 1, 'oi'], ['TH04', 1, 'oi']],
      pays: [['all', 'cash', d(-2, '15:50'), { reversed: { at: d(-2, '16:05'), reason: 'Ghi nhầm phương thức thanh toán' } }], ['all', 'transfer', d(-2, '16:06')]] },
  );
  // Paid: generated history (this month and last month) from a deterministic sequence.
  const SLUGS = ['bin', 'com', 'sushi', 'oi', 'map', 'mit', 'na', 'lucky', 'xoai', 'tom', 'dau', 'mochi', 'bo', 'su', 'soi', 'milo', 'kem', 'muop'];
  const KHAM_EXTRAS = ['TH02', 'TH03', 'TH04', 'KB05', 'VT01', 'KB04'];
  const SPA_SETS: L[][] = [[['SP01', 1]], [['SP02', 1], ['SP06', 1]], [['SP04', 1], ['SP07', 1]], [['SP03', 1], ['SP05', 1]], [['SP02', 1], ['SP05', 1], ['SP06', 1]]];
  const days = [-1, -3, -4, -7, -8, -9, -11, -13, -15, -17, -18, -22, -26, -30, -34, -38, -42, -45];
  days.forEach((day, i) => {
    const slug = SLUGS[i % SLUGS.length]!;
    const spa = c.rng() < 0.4;
    const lines: L[] = spa ? SPA_SETS[Math.floor(c.rng() * SPA_SETS.length)]!.map(([code, q]) => [code, q, slug]) : [['KB01', 1, slug], [KHAM_EXTRAS[Math.floor(c.rng() * KHAM_EXTRAS.length)]!, 1, slug]];
    const r = c.rng();
    const method: PaymentMethod = r < 0.45 ? 'cash' : r < 0.75 ? 'transfer' : 'qr';
    const hh = String(9 + Math.floor(c.rng() * 8)).padStart(2, '0');
    S.push({ customer: of(slug), pets: [slug], source: 'appointment', created: d(day, `${hh}:10`), issued: d(day, `${hh}:15`), by: spa ? STAFF.ha : STAFF.duc, lines, pays: [['all', method, d(day, `${hh}:20`)]] });
  });

  // Codes in creation order.
  S.sort((a, b) => a.created.localeCompare(b.created));
  let pt = 0;
  S.forEach((s, i) => {
    const id = `inv-${i + 1}`;
    const code = `HD-${String(1001 + i)}`;
    const lines: InvoiceLine[] = s.lines.map(([pc, qty, slug, unit], j) => {
      const item = t.price_items.find((p) => p.code === pc)!;
      const unit_price = unit ?? item.price;
      return { id: `${id}-l${j + 1}`, invoice_id: id, price_item_id: item.id, pet_id: slug ? pet(slug) : undefined, name_snapshot: item.name, category_snapshot: item.category, customer_group_snapshot: item.customer_group, unit_snapshot: item.unit, unit_price, qty, line_total: lineTotal(unit_price, qty) };
    });
    const totals = invoiceTotals(lines, s.discount);
    const inv: Invoice = {
      id, code, customer_id: s.customer, pet_ids: s.pets.map(pet), source_type: s.source, source_id: s.sourceId,
      status: s.voided ? 'voided' : s.issued ? 'issued' : 'draft', subtotal: totals.subtotal, total: totals.total,
      discount: s.discount ? { ...s.discount, amount: totals.discountAmount } : undefined, issued_at: s.issued, issued_by: s.issued ? s.by : undefined,
      voided_at: s.voided?.at, voided_by: s.voided ? STAFF.ha : undefined, void_reason_code: s.voided?.code, void_reason_text: s.voided?.text,
      created_by: s.by ?? STAFF.duc, created_at: s.created, version: 1,
    };
    t.invoices.push(inv);
    t.invoice_lines.push(...lines);
    let paid = 0;
    for (const [amount, method, atIso, opts] of s.pays ?? []) {
      const amt = amount === 'all' ? inv.total - paid : amount;
      pt += 1;
      const p: Payment = { id: `${id}-p${pt}`, code: `PT-${String(pt).padStart(4, '0')}`, invoice_id: id, amount: amt, method, received_at: atIso, received_by: STAFF.ha, cash_given: method === 'cash' ? opts?.given ?? amt : undefined };
      if (opts?.reversed) {
        p.reversed_at = opts.reversed.at;
        p.reversed_by = STAFF.ha;
        p.reverse_reason = opts.reversed.reason;
      } else paid += amt;
      t.payments.push(p);
    }
  });
  // The voided invoice is replaced by the next one for the right customer.
  const voided = t.invoices.find((i) => i.status === 'voided')!;
  const replacement = t.invoices.find((i) => i.created_at === d(-6, '15:42'))!;
  replacement.replaces_invoice_id = voided.id;
  // Link stays to their drafts; a draft's LT line is the stay's day charge (recalculated at discharge).
  for (const inv of t.invoices) if (inv.source_type === 'stay' && inv.source_id) {
    const s = t.stays.find((x) => x.id === inv.source_id);
    if (s && !s.invoice_id) s.invoice_id = inv.id;
    if (s && inv.status === 'draft') {
      const day = t.invoice_lines.find((l) => l.invoice_id === inv.id && DAY_ITEM_CODES.some((code) => priceId(code) === l.price_item_id));
      s.day_price_item_id = day?.price_item_id;
    }
  }
  c.doc.counters.HD = 1000 + S.length;
  c.doc.counters.PT = pt;
}
