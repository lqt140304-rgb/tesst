# Phần 4 — Dữ liệu khu nhân viên (khách hàng, bảng giá, doanh thu) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let staff edit customers and pets (with weight), see a customer's interaction history, manage the price list (fixed/open price + reference price, on/off), and read revenue by category that adds up after discounts — in the mock data layer behind the `api` contract.

**Architecture:** All work in `src/data` on `claude/du-lieu`. Contracts only grow. New pure rules: `validatePetInput` (`rules/pet.ts`), `netLineTotals` (`rules/invoice-math.ts`), `nextPriceCode` (`rules/price-codes.ts`). Customer interactions get their own module (`api/staff/customer-history.ts`); price writes go in `api/staff/prices.ts` (split out of `invoices.ts`, which keeps re-exporting nothing new). `Customer`, `Pet`, `PriceItem` gain `version`; documents saved before that are normalised to `version: 1` on load in `store/db.ts`.

**Tech Stack:** TypeScript 6, Vitest 5, Playwright 1.56 (one browser check).

**Spec:** `docs/superpowers/specs/2026-10-21-phan-4-du-lieu-nhan-vien-design.md` (approved 21/10/2026, all four §7 answers "yes").

## Global Constraints

- Touch only `src/data/**`, `e2e/du-lieu-*.spec.ts`, `docs/`, `PROGRESS.md` (own section, "Thay đổi hợp đồng", "Yêu cầu gửi nhánh kia").
- Contracts additive only; `customers.list(q)` unchanged (paging stays in the UI).
- Writes through `db.transact`; version checks with `checkVersion` → `ConflictError`; errors `ValidationError(fields)` / `NotFoundError` / `ForbiddenError`.
- Capabilities: customer/pet writes `customers.edit`; `findByPhone` and interactions `customers.view`; price writes `pricelist.edit`; revenue `reports.revenue`.
- Invoice lines keep their snapshots: editing or switching off a price item never changes an existing line.
- Copy exactly as in this plan; Vietnamese; no "quý khách".
- TDD (failing test first, watch it fail), commit per task, push `claude/du-lieu` after each task; `npm run typecheck && npm run lint && npm test` before each commit.

## Review Focus

1. Two tabs edit the same customer/pet/price item → the second save gets `ConflictError`, never a silent overwrite. Tests: Tasks 3 and 5 "stale version".
2. A customer phone written another way (`0900 000 001`, `+84 900000001`) still matches in `findByPhone`, and editing a customer doesn't warn about the customer's own number. Test: Task 3 `findByPhone`.
3. A discounted invoice whose lines span categories with amounts that don't divide evenly → category totals still sum to the invoice total, to the đồng. Test: Task 6 "odd split".
4. A draft that already holds a line of an item that was then switched off still saves; adding that item anew is refused. Test: Task 5 "switched-off item".
5. A browser document saved before this change (no `version` on customers/pets/price items) still loads and can be edited. Tests: Task 1 (unit) and Task 7 (browser).

---

### Task 1: Versions on customers, pets, price items; reference prices in the seed

**Files:**
- Modify: `src/data/mock/store/schema.ts` (`Customer.version: number`, `Pet.version: number`, `PriceItem.version: number`, `PriceItem.reference_price?: number`), `src/data/mock/store/db.ts` (`parse`: rows of `customers`, `pets`, `price_items` without `version` get `1`), `src/data/mock/seed/accounts.ts`, `src/data/mock/seed/billing.ts`, any other place that builds these rows (`customers.create`, `customers.createPet`, `public` submit if it creates pets — `npm run typecheck` lists them; each new row gets `version: 1`)
- Test: `src/data/mock/store/db.test.ts`, `src/data/mock/seed/seed.test.ts`

**Interfaces:** Produces `version` on all three tables; `reference_price` on `KB09` 200000, `TH06` 100000, `VT05` 50000 (open items only).

- [ ] **Step 1: Write the failing tests**

```ts
// db.test.ts
it('rows saved before versions existed load as version 1', () => {
  const kv = createKV(memoryStorage());
  const old = tinySeed(new Date(DAY1));
  old.dirty = true;
  old.t.customers.push({ id: 'c1', code: 'KH-0001', full_name: 'A', phone_e164: '+84900000001', created_at: DAY1, created_by: 's' } as never);
  old.t.pets.push({ id: 'p1', code: 'TC-0001', customer_id: 'c1', name: 'B', species: 'cat', alerts: [] } as never);
  kv.set(DOC_KEY, JSON.stringify(old));
  const db = createDb({ kv, clock: at(DAY1), seed: tinySeed });
  expect(db.read().t.customers[0]!.version).toBe(1);
  expect(db.read().t.pets[0]!.version).toBe(1);
});
// seed.test.ts
it('customers, pets and price items start at version 1; open items carry a reference price', () => {
  for (const rows of [doc.t.customers, doc.t.pets, doc.t.price_items]) expect(rows.every((r) => r.version === 1)).toBe(true);
  const ref = Object.fromEntries(doc.t.price_items.filter((p) => p.reference_price !== undefined).map((p) => [p.code, p.reference_price]));
  expect(ref).toEqual({ KB09: 200000, TH06: 100000, VT05: 50000 });
});
```

- [ ] **Step 2:** `npx vitest run src/data/mock/store/db.test.ts src/data/mock/seed/seed.test.ts` — FAIL.
- [ ] **Step 3:** Implement (schema fields, parse normalisation next to the existing `emptyTables` fill, seed values).
- [ ] **Step 4:** Same command + `npm test` + `npm run typecheck` — PASS.
- [ ] **Step 5:** Commit `feat: versions on customers, pets and price items; reference prices for open items`.

---

### Task 2: Pet input rule; richer `PetInput`

**Files:**
- Create: `src/data/rules/pet.ts`, `src/data/rules/pet.test.ts`
- Modify: `src/data/contracts/staff.ts` (`PetInput` + `weight_kg?: number; color?: string; neutered?: boolean; note_internal?: string`), `src/data/mock/api/staff/customers.ts` (`createPet` validates with the rule and saves the new fields)
- Test: `src/data/mock/api/staff/customers.test.ts`

**Interfaces:** Produces `PET_MSG = { name: 'Vui lòng nhập tên thú cưng.', weight: 'Cân nặng chưa đúng. Bạn nhập số kg, ví dụ 4,2.', year: 'Năm sinh chưa đúng. Bạn kiểm tra lại giúp nhé.' }` and `validatePetInput(input: PetInput, year: number): Partial<Record<'name' | 'weight_kg' | 'birth_year', string>>` — name required (trimmed); weight optional, finite, `> 0`, `≤ 120`, at most one decimal; birth year optional integer `1990 … year + 1`.

- [ ] **Step 1: Failing tests**

```ts
// pet.test.ts
const ok = { name: 'Miu', species: 'cat' } as const;
expect(validatePetInput(ok, 2026)).toEqual({});
expect(validatePetInput({ ...ok, weight_kg: 4.2, birth_year: 2027 }, 2026)).toEqual({});
for (const w of [0, -1, 121, 4.25, Number.NaN]) expect(validatePetInput({ ...ok, weight_kg: w }, 2026).weight_kg).toBe(PET_MSG.weight);
for (const y of [1989, 2028, 2020.5]) expect(validatePetInput({ ...ok, birth_year: y }, 2026).birth_year).toBe(PET_MSG.year);
expect(validatePetInput({ ...ok, name: '  ' }, 2026).name).toBe(PET_MSG.name);
// customers.test.ts — createPet keeps the new fields
const id = await api.staff.customers.createPet('cus-01', { name: 'Kẹo', species: 'dog', weight_kg: 3.5, color: 'Nâu', neutered: true, note_internal: 'Sợ máy sấy' });
expect(db.read().t.pets.find((p) => p.id === id)).toMatchObject({ weight_kg: 3.5, color: 'Nâu', neutered: true, note_internal: 'Sợ máy sấy', version: 1 });
await expect(api.staff.customers.createPet('cus-01', { name: 'Kẹo', species: 'dog', weight_kg: 0 })).rejects.toThrow(PET_MSG.weight);
```

- [ ] **Step 2:** `npx vitest run src/data/rules/pet.test.ts src/data/mock/api/staff/customers.test.ts` — FAIL.
- [ ] **Step 3:** Implement; `createPet` throws `ValidationError(fields)` when the rule returns any field.
- [ ] **Step 4:** Same command — PASS.
- [ ] **Step 5:** Commit `feat: pet input rule with weight, colour, neutered and internal note`.

---

### Task 3: Edit customer and pet; phone matches; pets in the table row

**Files:**
- Modify: `src/data/contracts/staff.ts`, `src/data/mock/api/staff/customers.ts`
- Test: `src/data/mock/api/staff/customers.test.ts`

**Interfaces:**
- `StaffPet` + `version: number; weight_kg?: number; color?: string`. `StaffCustomerDetail` + `version: number`. `StaffCustomerRow` + `pets: { id: string; name: string; species: Species; photoKey?: string }[]`.
- `StaffCustomersApi` + `update(id: string, version: number, input: CustomerInput): Promise<void>`, `updatePet(petId: string, version: number, input: PetInput): Promise<void>`, `findByPhone(phone: string, excludeId?: string): Promise<{ id: string; code: string; full_name: string }[]>`.
- `update`: same checks and messages as `create`; optional fields set to `trimmed || undefined` (empty clears); `version += 1`; audit `customer.update` "`{actor} cập nhật hồ sơ {KH-…}`". `updatePet`: `validatePetInput`; replaces name/species/breed/sex/birth_year/alerts/weight_kg/color/neutered/note_internal; keeps `photo_key`, `code`, `customer_id`; `version += 1`; audit `pet.update` "`{actor} cập nhật thông tin {bé}`".

- [ ] **Step 1: Failing tests** (`describe('edit customers and pets')`, as `bacsi_duc` unless noted)

```ts
await api.staff.customers.update('cus-01', 1, { full_name: ' Nguyễn Thị Lan B ', phone: '0912 345 678', address: '', note_internal: 'Gọi sau 17h' });
expect(db.read().t.customers.find((c) => c.id === 'cus-01')).toMatchObject({ full_name: 'Nguyễn Thị Lan B', phone_e164: '+84912345678', address: undefined, note_internal: 'Gọi sau 17h', version: 2 });
await expect(api.staff.customers.update('cus-01', 1, { full_name: 'X', phone: '0912345678' })).rejects.toThrow(ConflictError); // stale version
expect((await api.staff.customers.update('cus-01', 2, { full_name: '', phone: '123' }).catch((e) => e)).fields).toEqual({ full_name: 'Vui lòng nhập họ tên khách hàng.', phone: MSG.phoneInvalid });
// pet
await api.staff.customers.updatePet('pet-miu', 1, { name: 'Miu', species: 'cat', weight_kg: 4.6, color: 'Trắng' });
const miu = (await api.staff.customers.get('cus-01')).pets.find((p) => p.id === 'pet-miu')!;
expect(miu).toMatchObject({ weight_kg: 4.6, color: 'Trắng', version: 2, photoKey: 'meo-trang-ngu' });
expect(db.read().t.stays.find((s) => s.code === 'NT-0041')!.day_price_item_id).toBe('pi-LT01'); // stay untouched
await expect(api.staff.customers.updatePet('pet-miu', 1, { name: 'Miu', species: 'cat' })).rejects.toThrow(ConflictError);
await expect(api.staff.customers.updatePet('pet-none', 1, { name: 'A', species: 'cat' })).rejects.toThrow(NotFoundError);
// permissions: spa_ngocanh and lan_nguyen → ForbiddenError for update and updatePet; nothing written
// findByPhone (as spa_ngocanh, customers.view)
for (const p of ['0900000001', '0900 000 001', '+84 900000001']) expect(await api.staff.customers.findByPhone(p)).toEqual([{ id: 'cus-01', code: 'KH-0001', full_name: 'Nguyễn Thị Lan' }]);
expect(await api.staff.customers.findByPhone('0900000001', 'cus-01')).toEqual([]);
expect(await api.staff.customers.findByPhone('12')).toEqual([]);
// table row
expect((await api.staff.customers.list('lan'))[0]!.pets).toEqual([{ id: 'pet-miu', name: 'Miu', species: 'cat', photoKey: 'meo-trang-ngu' }, { id: 'pet-bong', name: 'Bông', species: 'dog', photoKey: 'cho-poodle-xe' }]);
```

- [ ] **Step 2:** `npx vitest run src/data/mock/api/staff/customers.test.ts` — FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Same + `npm test` — PASS.
- [ ] **Step 5:** Commit `feat: staff edit customers and pets; phone matches; pets on the customer row`.

---

### Task 4: Customer interaction history

**Files:**
- Create: `src/data/mock/api/staff/customer-history.ts`, `src/data/mock/api/staff/customer-history.test.ts`
- Modify: `src/data/contracts/staff.ts`, `src/data/mock/api/staff/customers.ts` (`get` adds `interactions`)

**Interfaces:**
- `export type StaffInteractionKind = 'customer' | 'request' | 'appointment' | 'stay' | 'invoice' | 'payment' | 'link'; export type StaffInteraction = { at: string; kind: StaffInteractionKind; label: string; actorName?: string; refId?: string };` and `StaffCustomerDetail.interactions: StaffInteraction[]`.
- `customerInteractions(doc: Readonly<Doc>, customerId: string, caps: ReadonlySet<Cap>): StaffInteraction[]` — newest first by `Date.parse(at)`, max 50. Rows (label · refId):
  - created: "Tạo hồ sơ {KH-…}" · customer id, actor `created_by`.
  - requests where `customer_id === id` or `snapshot.phone_e164 === phone`, from `request_events`: created "Gửi yêu cầu {YC-…}"; status_change "{YC-…}: {REQUEST_STATUS_LABEL}"; call "Gọi về {YC-…}: {CALL_OUTCOME_LABEL}" · request id; actor = staff name for staff events.
  - appointments: "Tạo lịch hẹn {LH-…} · {SERVICE_LABEL}" at `created_at` · appointment id.
  - stays (only with `inpatient.view`): "Nhập viện {bé} ({NT-…})" at `admitted_at`; "Xuất viện {bé} ({NT-…})" at `discharged_at` · stay id.
  - invoices (only with `invoices.create` or `payments.record`): "Tạo hóa đơn {HD-…}" `created_at`; "Phát hành {HD-…} · {formatVnd(total)}" `issued_at`; "Hủy {HD-…}" `voided_at`; payments "Thu {formatVnd(amount)} · {HD-…}" `received_at`; "Hủy phiếu thu {PT-…}" `reversed_at` · invoice id.
  - links: "Liên kết tài khoản web {username}" `linked_at` · account id.

- [ ] **Step 1: Failing tests**

```ts
// as quanly_ha
const h = (await api.staff.customers.get('cus-01')).interactions;
expect(h.length).toBeLessThanOrEqual(50);
expect(h.map((x) => Date.parse(x.at))).toEqual([...h.map((x) => Date.parse(x.at))].sort((a, b) => b - a));
expect(new Set(h.map((x) => x.kind))).toEqual(new Set(['customer', 'request', 'appointment', 'stay', 'invoice', 'payment', 'link']));
expect(h).toContainEqual(expect.objectContaining({ kind: 'request', label: 'YC-0235: Đã xác nhận', actorName: 'Nguyễn Thu Hà', refId: 'req-YC-0235' }));
expect(h).toContainEqual(expect.objectContaining({ kind: 'stay', label: 'Nhập viện Miu (NT-0041)', refId: 'stay-NT-0041' }));
expect(h).toContainEqual(expect.objectContaining({ kind: 'link', label: 'Liên kết tài khoản web lan_nguyen' }));
// spa_ngocanh (customers.view + inpatient.view, no billing): no invoice/payment rows, stays still there
const spa = (await api.staff.customers.get('cus-01')).interactions;
expect(spa.some((x) => x.kind === 'invoice' || x.kind === 'payment')).toBe(false);
// nothing clinical: JSON has no order names, care-note text or reason_internal
```

- [ ] **Step 2:** `npx vitest run src/data/mock/api/staff/customer-history.test.ts` — FAIL.
- [ ] **Step 3:** Implement; `get` calls it with the actor's caps.
- [ ] **Step 4:** Same + `npm test` — PASS.
- [ ] **Step 5:** Commit `feat: customer interaction history for staff`.

---

### Task 5: Price list writes

**Files:**
- Create: `src/data/rules/price-codes.ts` (+ test), `src/data/mock/api/staff/prices.ts`, `src/data/mock/api/staff/prices.test.ts`
- Modify: `src/data/contracts/staff.ts`, `src/data/mock/api/staff/invoices.ts` (move `staffPricesApi` to `prices.ts`; `updateDraft` refuses new lines of switched-off items), `src/data/mock/api/index.ts` (import path)

**Interfaces:**
- `nextPriceCode(category: PriceCategory, existing: string[]): string` — prefix `exam KB · spa SP · inpatient LT · medicine TH · supply VT`, max numeric suffix of that prefix + 1, zero-padded to 2 (`KB10`, `SP08`).
- `StaffPriceItem` + `version: number; reference_price?: number`. `export type PriceInput = { category: PriceCategory; name: string; unit: string; price_mode: 'fixed' | 'open'; price?: number; reference_price?: number; customer_group?: CustomerGroup; active?: boolean }`. `StaffPricesApi` + `create(input: PriceInput): Promise<string>`, `update(id: string, version: number, input: PriceInput): Promise<void>` (`input.category` must equal the item's, else `ValidationError({ category: 'Không đổi được danh mục của mục này.' })`; the field exists so one input type serves create and update), `setActive(id: string, version: number, active: boolean): Promise<void>`. All writes `pricelist.edit`.
- Rules: `customer_group` = treatment for medicine/supply, itemized for spa/inpatient, input ?? itemized for exam. Fixed → `price` integer ≥ 1, `reference_price` stored `undefined`. Open → `price` 0, `reference_price` optional integer ≥ 1. Name unique per category by `fold`. LT01–LT03: no deactivation, no switch to open.
- Copy: name "Vui lòng nhập tên mục." · duplicate "Mục này đã có trong bảng giá." · unit "Vui lòng nhập đơn vị, ví dụ: lần, mũi, ngày." · price "Giá cần là số từ 1 ₫ trở lên." · reference "Giá tham khảo cần là số từ 1 ₫ trở lên." · day item off "Mục này dùng để tính tiền nội trú nên không tắt được." · day item mode "Mục này dùng để tính tiền nội trú nên phải giữ giá cố định." · draft line (field `lines.{j}`) `Mục "${name}" đã ngừng dùng. Bạn chọn mục khác nhé.`
- Audit `price.create` / `price.update` / `price.deactivate` / `price.activate`; `updated_at`, `updated_by` set; `version += 1` on every write.

- [ ] **Step 1: Failing tests**

```ts
// price-codes.test.ts
expect(nextPriceCode('exam', ['KB01', 'KB09', 'SP07'])).toBe('KB10');
expect(nextPriceCode('supply', [])).toBe('VT01');
// prices.test.ts (quanly_ha)
const id = await api.staff.prices.create({ category: 'exam', name: 'Siêu âm', unit: 'lần', price_mode: 'fixed', price: 250000, reference_price: 999 });
expect(row(id)).toMatchObject({ code: 'KB10', customer_group: 'itemized', price: 250000, reference_price: undefined, active: true, version: 1 });
const open = await api.staff.prices.create({ category: 'medicine', name: 'Thuốc bôi da', unit: 'tuýp', price_mode: 'open', price: 5, reference_price: 80000, customer_group: 'itemized' });
expect(row(open)).toMatchObject({ code: 'TH07', price: 0, reference_price: 80000, customer_group: 'treatment' });
// validation fields: duplicate 'sieu am' in exam, unit '', fixed price 0, open reference 0
// update: price 300000 → existing draft and issued lines of that item keep their unit_price (add a line first via updateDraft, issue another)
// stale version → ConflictError; bacsi_duc → ForbiddenError; spa can still list()
// switched-off item: draft already holding it saves again; a draft adding it anew → lines.0 message
// category change on update → category message;
// LT01: setActive false → message; update to price_mode open → message; rename works
```

- [ ] **Step 2:** `npx vitest run src/data/rules/price-codes.test.ts src/data/mock/api/staff/prices.test.ts` — FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Same + `npm test` — PASS.
- [ ] **Step 5:** Commit `feat: managers add, edit and switch off price items; open prices carry a reference price`.

---

### Task 6: Revenue by category after discount

**Files:**
- Modify: `src/data/rules/invoice-math.ts` (+ test), `src/data/contracts/staff.ts` (`RevenueReport.invoiced: number`), `src/data/mock/api/staff/invoices.ts` (`revenue`)
- Test: `src/data/mock/api/staff/invoices.test.ts`

**Interfaces:** `netLineTotals(lineTotals: number[], total: number): number[]` — share of `total` per line proportional to `line_total / sum`, rounded by running total (`round(cum_i) − round(cum_{i−1})`) so the parts sum to `total`; sum 0 → all zeros. Revenue: `invoiced` = sum of `total` of invoices issued in range (status `issued`); `byCategory` from `netLineTotals` per invoice.

- [ ] **Step 1: Failing tests**

```ts
expect(netLineTotals([100, 100, 100], 200)).toEqual([67, 66, 67]); // odd split, sums to 200
expect(netLineTotals([150000, 50000], 200000)).toEqual([150000, 50000]);
expect(netLineTotals([0, 0], 0)).toEqual([0, 0]);
// invoices.test.ts: sum of byCategory === invoiced (whole October range, Lucky has 10% off);
// a test-made issued invoice with KB01 + TH03 + SP06 and discount { type: 'amount', value: 10001 } set via db.transact → still sums exactly
```

- [ ] **Step 2:** `npx vitest run src/data/rules/invoice-math.test.ts src/data/mock/api/staff/invoices.test.ts` — FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Same + `npm test` — PASS.
- [ ] **Step 5:** Commit `fix: revenue by category is counted after discount and adds up to invoiced`.

---

### Task 7: Browser check, docs, verify, merge

**Files:** Create `e2e/du-lieu-phien-ban.spec.ts`; modify `PROGRESS.md`, `docs/thiet-ke/QUYET-DINH.md` (R36: customer/pet editing; phone duplicates warn only; price list writes with reference price; LT01–LT03 locked; revenue by category after discount; paging stays in the UI).

- [ ] **Step 1:** Write the e2e (`@desktop-only`): open `/`, in `page.evaluate` read `localStorage['leson-demo:v1']`, delete `version` from every customer/pet/price item, set `dirty: true`, write it back; reload; as `quanly_ha` call `__lesonDemo.api.staff.customers.update('cus-01', 1, …)` → resolves; `customers.get('cus-01').version === 2`.
- [ ] **Step 2:** `npm run build && npx playwright test e2e/du-lieu-phien-ban.spec.ts --project=desktop-1440` — PASS.
- [ ] **Step 3:** PROGRESS (own section, "Thay đổi hợp đồng", request to giao-dien: screens for customer edit + phone warning + history tab, price list add/edit/on-off + reference-price prefill in the draft editor, revenue label "sau giảm giá"); QUYET-DINH R36.
- [ ] **Step 4:** `npm run verify` — green.
- [ ] **Step 5:** Commit `docs: part 4 data decisions and contract changes`, push, merge into `claude/focused-pascal-rfxnnp` (`--no-ff`), push.
