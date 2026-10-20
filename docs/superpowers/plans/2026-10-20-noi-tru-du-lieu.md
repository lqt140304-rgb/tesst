# Nội trú đầy đủ — Dữ liệu & chức năng (§3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the whole inpatient lifecycle work in the mock data layer — admit (with draft invoice), transfer, upload video (sample or from the device, kept in IndexedDB), discharge (hourly day charge, farewell note), stay history — behind the `api` contract, so the UI branch can build part 4 screens on it.

**Architecture:** Everything lands in `src/data` (branch `claude/du-lieu`). Pure rules (`billableDays`, day-item suggestion, video file checks) go in `src/data/rules/`; mock API functions extend `staffInpatientApi`; helpers that grew large move to `inpatient-billing.ts` / `inpatient-history.ts`. Device videos live in a `BlobStore` (IndexedDB in the browser, memory in tests) injected through `Env`; a small `MediaApi` + `useMediaUrls` hook turn `local:` keys into object URLs for both zones. Contracts only grow (no rename/removal).

**Tech Stack:** TypeScript 6, Vitest 5 (node env), idb-keyval 6.3.0 (already a dependency), Playwright 1.56 for one browser-only check.

**Spec:** `docs/superpowers/specs/2026-10-20-noi-tru-day-du-design.md` §3, §5, §6 (unit part) + `docs/superpowers/specs/2026-10-20-lam-lai-giao-dien-design.md` §3.2 (video ≤ 15 giây). Screens (§4) belong to the UI branch (part 4) and are out of scope here.

## Global Constraints

- Touch only `src/data/**`, `e2e/du-lieu-*.spec.ts`, `e2e/fixtures/`, one small edit in `e2e/staff-b.spec.ts` (Task 2), `docs/`, `PROGRESS.md` (own section + "Thay đổi hợp đồng").
- Contracts in `src/data/contracts/` are **additive only**; every change is listed in PROGRESS.md "Thay đổi hợp đồng".
- Every write goes through `db.transact(label, fn)`; one user action = one transaction; errors are `ValidationError(fields)`, `NotFoundError`, `ForbiddenError`, `ConflictError` (via `checkVersion`).
- Capability checks in the API (`staffActor(env, cap)`); customer DTOs are explicit object literals (no spread, lint-enforced).
- Customer data never contains drug names, doses, times of care, orders, internal notes/status, cage codes or staff names (R7, R20).
- Copy is Vietnamese, exact strings as written in this plan; "bạn", "Lê Sơn", "bé".
- No new dependencies. IndexedDB only inside `src/data/mock/store/blobs.ts` (lint rule already names this file).
- TDD: failing test first, watch it fail, then code. Commit after each task (`feat: …`/`test: …`/`docs: …`, English, no model names), push `claude/du-lieu` after each task.
- Quick checks before each commit: `npm run typecheck && npm run lint && npm test`.

## Review Focus

1. Audit rows written by `appendAudit` default to UTC `…Z` while seeded rows use `…+07:00` → history must sort by instant, not by string. Test: Task 10 "orders mixed timestamp formats by time".
2. Staff re-saves or edits the stay's draft invoice between admission and discharge (line ids change, LT02 swapped for LT03) → discharge still updates the pet's day line. Test: Task 7 "finds the day line after the draft was re-saved with another day item".
3. A decimal quantity (2,2) goes back through the invoice editor (`updateDraft`) → qty stays 2.2 and money stays whole đồng. Test: Task 7 "a 2,2-day line survives updateDraft with whole-đồng totals".
4. The device file is saved but the data write fails (stay discharged in another tab) → no orphan file left. Test: Task 9 "removes the stored file when the write fails".
5. Stay length a few seconds past an exact hour boundary, or timestamps with different offsets (`Z` vs `+07:00`) → exactly 24 h is 1 day, not 1,1. Test: Task 1 "ignores leftover seconds and offset differences".

## Decisions taken while planning (spec silent or ambiguous)

- **Day line** = the first line on the stay's invoice whose price item code is LT01, LT02 or LT03 and whose `pet_id` is the stay's pet (or empty). This is a superset of "the line carrying `day_price_item_id`": it keeps working when staff re-save the draft (new line ids) or swap LT02→LT03 in the editor. A removed day line is still never re-added.
- **Spa and the stay invoice:** admitting with "Tạo hóa đơn nội trú nháp" needs only `inpatient.admit` (draft only; issuing still needs `invoices.create`). Discharge already edits the draft the same way.
- **Doctor in charge** must be an active staff member with the `bac_si` preset; when `doctor_id` is omitted the actor is used only if they are a doctor, else `ValidationError({ doctor_id })`.
- **Unknown video duration** is stored as `duration_s: 0` (contract stays `number`); the UI shows "—" for 0.
- **Seeded history:** the seed writes audit rows for each seeded stay (admit, orders, care notes, diary drafts/shares, video uploads/shares, discharges) so the "Lịch sử" tab is not empty; per-slot administrations are not seeded (too many rows).
- **Pet weights:** most seeded pets get `weight_kg`; Tôm and Xoài stay without, to demo "Chưa ghi tiền nội trú".
- **Spa and internal status:** the existing UI gates "Tình trạng nội bộ" by `inpatient.admit`, so Spa can now change it (consistent with Spa choosing "Tình trạng ban đầu" at admission). Reported to the owner, not changed here.

## Exact copy introduced by this plan

| Field | Message |
|---|---|
| `cage_id` | Chuồng này đang có bé ở. *(existing)* |
| `pet_id` | Bé đang nội trú. *(existing)* |
| `stay` | Bé đã xuất viện. *(existing)* |
| `doctor_id` | Bạn chọn bác sĩ phụ trách nhé. |
| `expected_discharge_at` | Ngày dự kiến xuất viện không được trước hôm nay. |
| `day_price_item_id` | Mục tiền nội trú không hợp lệ. |
| `appointment_id` | Lịch hẹn này không phải của bé. |
| `discharged_at` | Thời điểm xuất viện không được trước lúc nhập viện. / Thời điểm xuất viện không được sau bây giờ. |
| `file` | Tệp này không phải video. Bạn chọn tệp MP4, MOV hoặc WebM nhé. / Video lớn hơn 20 MB. Bạn cắt ngắn hoặc chọn video khác nhé. / Video dài hơn 15 giây. Bạn cắt ngắn hoặc chọn video khác nhé. / Trình duyệt này không lưu được video. Bạn dùng video mẫu nhé. |
| `source` | Không tìm thấy video mẫu này. |
| `caption` | Lời nhắn tối đa 120 ký tự. |
| `recorded_at` | Thời điểm quay không được sau bây giờ. |
| `checks` | Vui lòng kiểm tra đủ hai mục trước khi chia sẻ. *(existing)* |

Audit summaries (actor display name first, so history can strip it): admit *(existing)* `{actor} nhập viện {bé} vào chuồng {C4} ({NT-…})`; transfer `{actor} chuyển {bé} từ chuồng {C4} sang {C5}` + ` — {lý do}` when given; discharge `{actor} cho xuất viện {NT-…}` + ` · hóa đơn tính {2,2} ngày` when the invoice was updated; upload `{actor} tải lên 1 video của {bé}`; farewell `{actor} chia sẻ lời chào tạm biệt với khách` / `{actor} lưu nháp lời chào tạm biệt cho {NT-…}`; day line added to an appointment draft `{actor} thêm tiền nội trú vào hóa đơn nháp {HD-…}`.

---

### Task 1: Hourly day charge rules

**Files:**
- Create: `src/data/rules/stay-billing.ts`, `src/data/rules/stay-billing.test.ts`
- Modify: `src/data/rules/invoice-math.ts` (`lineTotal`), `src/data/rules/invoice-math.test.ts`

**Interfaces:**
- Produces: `billableDays(admittedAt: string | Date, until: string | Date): number` · `DAY_ITEM_CODES = ['LT01', 'LT02', 'LT03'] as const` · `type DayItemCode` · `suggestDayItemCode(pet: { species: Species; weight_kg?: number }): DayItemCode | undefined` · `formatDaysVi(days: number): string` · `MIN_BILLABLE_DAYS = 0.1`.
- `lineTotal(unitPrice, qty)` now `Math.round(unitPrice * qty)`.

- [ ] **Step 1: Write the failing tests**

```ts
// stay-billing.test.ts
const at = (h: number, m = 0, s = 0) => new Date(Date.parse('2026-10-17T10:30:00+07:00') + ((h * 60 + m) * 60 + s) * 1000);
it('rounds hours up to tenths of a day', () => {
  expect(billableDays('2026-10-17T10:30:00+07:00', at(6))).toBe(0.3);
  expect(billableDays('2026-10-17T10:30:00+07:00', at(12))).toBe(0.5);
  expect(billableDays('2026-10-17T10:30:00+07:00', at(24))).toBe(1);
  expect(billableDays('2026-10-17T10:30:00+07:00', at(30))).toBe(1.3);
  expect(billableDays('2026-10-17T10:30:00+07:00', at(52))).toBe(2.2);
  expect(billableDays('2026-10-17T10:30:00+07:00', at(0, 4))).toBe(0.1);
  expect(billableDays('2026-10-17T10:30:00+07:00', at(0))).toBe(0.1);
});
it('ignores leftover seconds and offset differences', () => {
  expect(billableDays('2026-10-17T10:30:00+07:00', at(24, 0, 30))).toBe(1);
  expect(billableDays('2026-10-17T03:30:00Z', '2026-10-18T10:30:00+07:00')).toBe(1);
});
it('suggests a day item only when the pet has a weight', () => {
  expect(suggestDayItemCode({ species: 'cat', weight_kg: 4 })).toBe('LT01');
  expect(suggestDayItemCode({ species: 'dog', weight_kg: 14.9 })).toBe('LT02');
  expect(suggestDayItemCode({ species: 'dog', weight_kg: 15 })).toBe('LT03');
  expect(suggestDayItemCode({ species: 'other', weight_kg: 3 })).toBe('LT02');
  expect(suggestDayItemCode({ species: 'cat' })).toBeUndefined();
  expect(suggestDayItemCode({ species: 'dog' })).toBeUndefined();
});
it('formats days the Vietnamese way', () => {
  expect(formatDaysVi(2.2)).toBe('2,2');
  expect(formatDaysVi(1)).toBe('1');
});
// invoice-math.test.ts
it('line totals round to whole đồng', () => {
  expect(lineTotal(150000, 0.3)).toBe(45000);
  expect(lineTotal(180000, 2.2)).toBe(396000);
  expect(lineTotal(12345, 0.1)).toBe(1235);
  expect(lineTotal(60000, 2)).toBe(120000);
});
```

- [ ] **Step 2: Run `npx vitest run src/data/rules/stay-billing.test.ts src/data/rules/invoice-math.test.ts`** — expect FAIL (module missing; `lineTotal(12345, 0.1)` = 1234.5).

- [ ] **Step 3: Implement.** `billableDays`: whole minutes = `Math.floor((until − admitted) / 60000)`, tenths = `Math.max(1, Math.ceil(minutes / 144))` (144 min = 0,1 day), return `tenths / 10`. `formatDaysVi` = `toLocaleString('vi-VN', { maximumFractionDigits: 1 })`. Suggestion: no weight → undefined; cat → LT01; dog ≥ 15 → LT03; else LT02.

- [ ] **Step 4: Run the same command** — expect PASS; then `npm test` (seed invoices use integer quantities, totals unchanged).

- [ ] **Step 5: Commit** `feat: hourly day charge rules (billableDays, day item suggestion, rounded line totals)`

---

### Task 2: Spa can admit, transfer, discharge and share

**Files:**
- Modify: `src/data/rules/capabilities.ts`, `src/data/rules/capabilities.test.ts`, `src/data/mock/api/staff/inpatient.test.ts` (test "spa can save a draft but cannot share"), `e2e/staff-b.spec.ts:39-50`

**Interfaces:** `PRESETS.spa` = `['appointments.view', 'customers.view', 'inpatient.view', 'inpatient.admit', 'inpatient.diary_write', 'inpatient.share']`.

- [ ] **Step 1: Update the tests first.**

```ts
// capabilities.test.ts — replaces "spa staff can view and draft but not share…"
it('spa staff can admit and share but never see clinical records', () => {
  const caps = effectiveCaps({ preset_ids: ['spa'], extra_capabilities: [] });
  expect([...caps].sort()).toEqual(['appointments.view', 'customers.view', 'inpatient.admit', 'inpatient.diary_write', 'inpatient.share', 'inpatient.view']);
  expect(caps.has('inpatient.clinical')).toBe(false);
});
// inpatient.test.ts — "spa can save a draft and share it, but not write care notes"
const id = await api.staff.inpatient.diary.saveDraft('stay-NT-0044', { part_of_day: 'sang', category: 'an_uong', general_status: 'recovering', text: 'Kem ăn được nửa bát cháo.' });
await api.staff.inpatient.diary.share(id);
expect(db.read().t.diary_entries.find((e) => e.id === id)!).toMatchObject({ status: 'shared', shared_by: 'stf-ngocanh' });
await expect(api.staff.inpatient.careNotes.create('stay-NT-0044', { type: 'note', text: 'x' })).rejects.toThrow(ForbiddenError);
```

E2E (`staff-b.spec.ts`, test "spa_ngocanh stay page has no Hồ sơ nội bộ tab"): replace the last assertion (no "Chia sẻ với chủ nuôi") with: open `/nv/noi-tru/stay-NT-0039` (Mochi has Ngọc Anh's seeded draft), tab "Nhật ký cho chủ nuôi", expect `getByRole('button', { name: 'Chia sẻ với chủ nuôi' })` visible. Rename the test "…no Hồ sơ nội bộ tab, but can share drafts".

- [ ] **Step 2: Run `npx vitest run src/data/rules/capabilities.test.ts src/data/mock/api/staff/inpatient.test.ts`** — expect FAIL (spa lacks the caps).
- [ ] **Step 3: Add the two caps to `PRESETS.spa`.**
- [ ] **Step 4: Run the unit command** — PASS. Then `npm run build && npx playwright test e2e/staff-b.spec.ts --project=desktop-1440` — PASS.
- [ ] **Step 5: Commit** `feat: spa preset gains inpatient.admit and inpatient.share`

---

### Task 3: Seed — day item on stays, pet weights, stay audit trail

**Files:**
- Modify: `src/data/mock/store/schema.ts` (`Stay.day_price_item_id?: string`), `src/data/mock/seed/accounts.ts` (PETS `extra.weight`), `src/data/mock/seed/inpatient.ts` (`seedStayAudit`, called at the end of `seedInpatient`), `src/data/mock/seed/billing.ts` (set `day_price_item_id` when linking stays to drafts), `src/data/mock/seed/seed.test.ts`

**Interfaces:**
- Produces: `Stay.day_price_item_id?: string`; `Pet.weight_kg` filled for every seeded pet except `pet-tom`, `pet-xoai`; audit actions `stay.admit`, `order.create`, `care_note.create`, `diary.draft`, `diary.share`, `video.upload`, `video.share`, `stay.discharge` with `entity_type` `'stay'` (or `'video'` for video rows), `at` = the row's own timestamp.
- Weights (kg): miu 4.2, bong 5.5, kem 12, mochi 6.5, bo 32, su 4, lu 11, gao 3.8, mit 2.5, soi 24, na 3.1, bin 4.8, dau 16, muop 4.5, lucky 6, milo 7, com 4, map 5.2, oi 2.8, sushi 10.

- [ ] **Step 1: Write the failing tests** (`seed.test.ts`)

```ts
it('stays with a draft carry the day item of their LT line', () => {
  const dayOf = (code: string) => byCode(doc.t.stays, code).day_price_item_id;
  expect(dayOf('NT-0041')).toBe('pi-LT01');
  expect(dayOf('NT-0044')).toBe('pi-LT02');
  expect(dayOf('NT-0039')).toBe('pi-LT02');
  expect(dayOf('NT-0040')).toBe('pi-LT02');
  expect(dayOf('NT-0043')).toBe('pi-LT01');
  expect(dayOf('NT-0035')).toBeUndefined(); // issued invoice: left alone
});
it('every pet has a weight except the two kept for "Chưa ghi tiền nội trú"', () => {
  expect(doc.t.pets.filter((p) => p.weight_kg === undefined).map((p) => p.id).sort()).toEqual(['pet-tom', 'pet-xoai']);
});
it('every seeded stay has its admission (and discharge) in the audit trail', () => {
  for (const s of doc.t.stays) {
    const ev = doc.t.audit_events.filter((e) => e.entity_type === 'stay' && e.entity_id === s.id);
    expect(ev.find((e) => e.action === 'stay.admit')?.at).toBe(s.admitted_at);
    expect(ev.some((e) => e.action === 'stay.discharge')).toBe(!!s.discharged_at);
  }
  const v1 = doc.t.audit_events.filter((e) => e.entity_id === 'video-V1').map((e) => e.action);
  expect(v1).toEqual(['video.upload', 'video.share']);
});
```

- [ ] **Step 2: Run `npx vitest run src/data/mock/seed/seed.test.ts`** — FAIL.
- [ ] **Step 3: Implement.** In `billing.ts`'s "Link stays to their drafts" loop, for `inv.status === 'draft'` set `s.day_price_item_id` to the first line of that invoice whose price item code is in `DAY_ITEM_CODES`. `seedStayAudit(c)` iterates stays/orders/care notes/diary/videos and calls `appendAudit(doc, c.now, { at, actor_type: 'staff', actor_id, actor_name_snapshot, action, entity_type, entity_id, summary_vi, sensitive })` with the summaries listed in "Exact copy" (orders: `{actor} thêm y lệnh cho {code}`, care notes: `{actor} thêm ghi chú chăm sóc cho {code}`, diary draft: `{actor} lưu nháp nhật ký cho {code}`, diary share: `{actor} chia sẻ nhật ký với khách`, video share: `{actor} chia sẻ video với khách`); share/video rows `sensitive: true`.
- [ ] **Step 4: Run `npm test`** — PASS (the FK test also checks `day_price_item_id` and audit `actor_id`/`entity_id`).
- [ ] **Step 5: Commit** `feat: seed day items, pet weights and a stay audit trail`

---

### Task 4: Admission queries — `admitOptions`, `findPets`

**Files:**
- Create: `src/data/mock/api/staff/inpatient-billing.ts` (start with `dayItems`), `src/data/mock/api/staff/inpatient-admit.test.ts`
- Modify: `src/data/contracts/staff.ts`, `src/data/mock/api/staff/inpatient.ts`

**Interfaces:**
- Contract (add):

```ts
export type AdmitPetOption = {
  id: string; name: string; species: Species; breed?: string; weight_kg?: number; ownerName: string; ownerPhone: string; inpatient: boolean;
  /** LT01–LT03 price item id from species + weight; absent when the pet has no weight (no day charge by default). */
  suggestedDayItemId?: string;
};
export type DayPriceItem = { id: string; code: string; name: string; price: number };
export type AdmitOptions = {
  cages: { id: string; code: string; zone: string; species_hint: Species | 'any' }[];
  doctors: StaffOption[];
  dayItems: DayPriceItem[];
  /** Today's "Đã hẹn" appointments whose pet is not staying. */
  today: { appointmentId: string; start_at: string; service: Service; pet: AdmitPetOption; draftInvoice?: { id: string; code: string } }[];
};
// StaffInpatientApi:
admitOptions(): Promise<AdmitOptions>;
findPets(q: string): Promise<AdmitPetOption[]>;
```

- `inpatient-billing.ts`: `dayItems(doc: Readonly<Doc>): PriceItem[]` (active items with code in `DAY_ITEM_CODES`, in code order).
- Both queries need `inpatient.admit`. Cages = active and not holding an open stay, in seed order. Doctors = active staff with preset `bac_si`. `draftInvoice` = invoice with `source_type 'appointment'`, `source_id` = the appointment, `status 'draft'`. `findPets`: trimmed `q` empty → `[]`; `normalizeVnPhone(q)` set → owner phone equals it; else `fold(q)` contained in pet name or owner name; max 20, seed order.

- [ ] **Step 1: Write the failing tests** (`inpatient-admit.test.ts`, `describe('admission queries')`, login `bacsi_mai`)

```ts
const o = await api.staff.inpatient.admitOptions();
expect(o.cages.map((c) => c.code)).toEqual(['C2', 'C5', 'C6', 'M1', 'M3', 'R1', 'R2']);
expect(o.doctors.map((d) => d.name)).toEqual(['BS. Trần Minh Đức', 'BS. Phạm Thanh Mai']);
expect(o.dayItems).toEqual([
  { id: 'pi-LT01', code: 'LT01', name: 'Nội trú mèo', price: 150000 },
  { id: 'pi-LT02', code: 'LT02', name: 'Nội trú chó dưới 15 kg', price: 180000 },
  { id: 'pi-LT03', code: 'LT03', name: 'Nội trú chó từ 15 kg', price: 250000 },
]);
const names = o.today.map((t) => t.pet.name);
expect(names).toEqual(expect.arrayContaining(['Bin', 'Mập', 'Mít']));
expect(names).not.toContain('Miu');
expect(o.today.every((t) => t.start_at.startsWith('2026-10-19'))).toBe(true);
// a draft invoice on today's appointment is offered
const map = o.today.find((t) => t.pet.name === 'Mập')!;
const inv = await api.staff.invoices.createDraft({ customer_id: 'cus-16', pet_ids: ['pet-map'], source_type: 'appointment', source_id: map.appointmentId });
expect((await api.staff.inpatient.admitOptions()).today.find((t) => t.pet.name === 'Mập')!.draftInvoice?.id).toBe(inv);
// findPets
expect((await api.staff.inpatient.findPets('lan')).map((p) => [p.name, p.inpatient])).toEqual([['Miu', true], ['Bông', false]]);
expect((await api.staff.inpatient.findPets('0900000001')).map((p) => p.name)).toEqual(['Miu', 'Bông']);
expect(await api.staff.inpatient.findPets('kem')).toEqual([expect.objectContaining({ name: 'Kem', weight_kg: 12, inpatient: true, suggestedDayItemId: 'pi-LT02', ownerName: 'Phạm Thu Thủy' })]);
expect((await api.staff.inpatient.findPets('tôm'))[0]!.suggestedDayItemId).toBeUndefined();
expect(await api.staff.inpatient.findPets('  ')).toEqual([]);
// permission
await loginAs(api, 'quanly_ha'); await api.staff.inpatient.admitOptions(); // manager ok
```

Plus a forbidden case: a customer session (`lan_nguyen`) → `ForbiddenError` for both.

- [ ] **Step 2: Run `npx vitest run src/data/mock/api/staff/inpatient-admit.test.ts`** — FAIL.
- [ ] **Step 3: Implement** the contract types, `dayItems`, and the two methods (a local `petOption(doc, pet)` builds `AdmitPetOption`; suggestion = `dayItems(doc).find((i) => i.code === suggestDayItemCode(pet))?.id`).
- [ ] **Step 4: Run** — PASS; `npm run typecheck`.
- [ ] **Step 5: Commit** `feat: admitOptions and findPets for the admission dialog`

---

### Task 5: Admit — initial status, appointment, draft invoice

**Files:**
- Modify: `src/data/contracts/staff.ts`, `src/data/mock/api/staff/inpatient.ts` (`admit`), `src/data/mock/api/staff/inpatient-billing.ts`, `src/data/mock/api/staff/inpatient-admit.test.ts`

**Interfaces:**
- Contract (add, and use as `admit(input: AdmitInput): Promise<string>` — a superset of today's inline type):

```ts
export type AdmitInput = {
  pet_id: string; cage_id: string; doctor_id?: string; reason_internal: string; expected_discharge_at?: string;
  initial_status?: InternalStatus; appointment_id?: string;
  /** Present = "Tạo hóa đơn nội trú nháp" ticked; no day_price_item_id = "Chưa ghi tiền nội trú". */
  invoice?: { day_price_item_id?: string };
};
```

- `inpatient-billing.ts`: `recomputeTotals(d: Doc, inv: Invoice): void` (subtotal/total via `invoiceTotals` over the invoice's lines and `inv.discount`); `addDayLine(d: Doc, inv: Invoice, item: PriceItem, petId: string): void` (pushes one line, qty `MIN_BILLABLE_DAYS`, `line_total = lineTotal(price, 0.1)`, snapshots like `updateDraft`, then `recomputeTotals` and `inv.version += 1`).
- Rules inside the one `inpatient.admit` transaction, in this order: pet, cage (`!active` or occupied → `cage_id` "Chuồng này đang có bé ở."), pet staying → `pet_id`, doctor (see Decisions) → `doctor_id`, `expected_discharge_at` day before today (VN) → its message, appointment not this pet → `appointment_id`, unknown day item → `day_price_item_id`. Stay gets `internal_status = initial_status ?? 'watch'`, `appointment_id`, `invoice_id`, `day_price_item_id`. Invoice: appointment draft if any (add the pet to `pet_ids` if missing, audit `invoice.update` "… thêm tiền nội trú vào hóa đơn nháp HD-…" only when a line was added), else a new draft `source_type 'stay'`, `source_id` = stay id, code `nextCode(d, 'HD')`, audit `invoice.draft` "… tạo hóa đơn nháp HD-…".

- [ ] **Step 1: Write the failing tests** (`describe('admit')`, now `2026-10-19T09:00+07:00`)

```ts
it('creates a stay draft with a 0,1-day line', async () => {
  await loginAs(api, 'bacsi_mai');
  const id = await api.staff.inpatient.admit({ pet_id: 'pet-bin', cage_id: 'cage-M1', reason_internal: 'Theo dõi nôn', initial_status: 'stable', invoice: { day_price_item_id: 'pi-LT01' } });
  const s = db.read().t.stays.find((x) => x.id === id)!;
  expect(s).toMatchObject({ internal_status: 'stable', doctor_id: 'stf-mai', day_price_item_id: 'pi-LT01' });
  const inv = db.read().t.invoices.find((i) => i.id === s.invoice_id)!;
  expect(inv).toMatchObject({ status: 'draft', source_type: 'stay', source_id: id, pet_ids: ['pet-bin'], subtotal: 15000, total: 15000 });
  expect(db.read().t.invoice_lines.filter((l) => l.invoice_id === inv.id)).toEqual([expect.objectContaining({ price_item_id: 'pi-LT01', qty: 0.1, line_total: 15000, pet_id: 'pet-bin' })]);
});
it('"Chưa ghi tiền nội trú" makes an empty draft; no invoice when unticked', /* Tôm → invoice {} → 0 lines, day_price_item_id undefined; Đậu without invoice → s.invoice_id undefined, invoice count unchanged */);
it('adds the day line to the appointment draft instead of a new invoice', async () => {
  // as bacsi_mai: createDraft for today's Mập appointment, then admit Mập with appointment_id + LT01
  // expect: invoice count +1 only (the draft), stay.invoice_id === draft id, stay.appointment_id set, draft has the LT01 line
});
it('refuses busy cage, staying pet, non-doctor, past expected date, foreign appointment, bad day item — and writes nothing', async () => {
  const before = JSON.stringify(db.read().t);
  const bad: [Partial<AdmitInput>, string, string][] = [
    [{ cage_id: 'cage-C1' }, 'cage_id', 'Chuồng này đang có bé ở.'],
    [{ pet_id: 'pet-miu' }, 'pet_id', 'Bé đang nội trú.'],
    [{ doctor_id: 'stf-ngocanh' }, 'doctor_id', 'Bạn chọn bác sĩ phụ trách nhé.'],
    [{ expected_discharge_at: '2026-10-18T10:00:00+07:00' }, 'expected_discharge_at', 'Ngày dự kiến xuất viện không được trước hôm nay.'],
    [{ appointment_id: '<Bin today>' }, 'appointment_id', 'Lịch hẹn này không phải của bé.'],
    [{ invoice: { day_price_item_id: 'pi-LT04' } }, 'day_price_item_id', 'Mục tiền nội trú không hợp lệ.'],
  ];
  // base input: { pet_id: 'pet-dau', cage_id: 'cage-C5', reason_internal: 'Theo dõi' } merged with each case; ValidationError.fields[field] === message
  expect(JSON.stringify(db.read().t)).toBe(before);
});
it('spa admits with a doctor and a draft; without a doctor it is refused', /* spa_ngocanh: no doctor_id → doctor_id error; doctor_id 'stf-duc' + invoice {} → ok, stay.doctor_id 'stf-duc' */);
```

- [ ] **Step 2: Run `npx vitest run src/data/mock/api/staff/inpatient-admit.test.ts`** — FAIL.
- [ ] **Step 3: Implement** as described.
- [ ] **Step 4: Run** the file and `npx vitest run src/data/mock/api/staff/inpatient.test.ts` (old admit test still passes) — PASS.
- [ ] **Step 5: Commit** `feat: admit with initial status, appointment and stay draft invoice`

---

### Task 6: Transfer

**Files:**
- Create: `src/data/mock/api/staff/inpatient-stay.test.ts`
- Modify: `src/data/contracts/staff.ts`, `src/data/mock/api/staff/inpatient.ts`

**Interfaces:** `transfer(id: string, version: number, input: { cage_id: string; reason?: string }): Promise<void>` — cap `inpatient.admit`, via `mutateStay` (discharged → "Bé đã xuất viện."), `checkVersion`, target cage same/inactive/occupied → `ValidationError({ cage_id: 'Chuồng này đang có bé ở.' })`, `version += 1`, audit `stay.transfer` (summary per "Exact copy", `reason` field = trimmed reason).

- [ ] **Step 1: Write the failing tests** (`describe('transfer')`)

```ts
await loginAs(api, 'spa_ngocanh');
const kem = db.read().t.stays.find((s) => s.code === 'NT-0044')!;
await api.staff.inpatient.transfer(kem.id, kem.version, { cage_id: 'cage-C5', reason: 'Chuồng C4 cần vệ sinh' });
const after = db.read().t.stays.find((s) => s.id === kem.id)!;
expect(after).toMatchObject({ cage_id: 'cage-C5', version: kem.version + 1 });
expect(db.read().t.audit_events.at(-1)!.summary_vi).toBe('Lê Ngọc Anh chuyển Kem từ chuồng C4 sang C5 — Chuồng C4 cần vệ sinh');
await expect(api.staff.inpatient.transfer(kem.id, kem.version, { cage_id: 'cage-C6' })).rejects.toThrow(ConflictError);
for (const cage_id of ['cage-C1', 'cage-C5']) {
  const err = await api.staff.inpatient.transfer(kem.id, after.version, { cage_id }).catch((e) => e);
  expect((err as ValidationError).fields.cage_id).toBe('Chuồng này đang có bé ở.');
}
await expect(api.staff.inpatient.transfer('stay-NT-0035', 1, { cage_id: 'cage-C6' })).rejects.toThrow('Bé đã xuất viện.');
```

- [ ] **Step 2: Run `npx vitest run src/data/mock/api/staff/inpatient-stay.test.ts`** — FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** — PASS.
- [ ] **Step 5: Commit** `feat: transfer a stay to another free cage`

---

### Task 7: Discharge — hourly day line, farewell, time checks; `billing` on the stay view

**Files:**
- Modify: `src/data/contracts/staff.ts`, `src/data/mock/api/staff/inpatient.ts` (`discharge`, `getStay`), `src/data/mock/api/staff/inpatient-billing.ts`, `src/data/mock/api/staff/inpatient-stay.test.ts`

**Interfaces:**
- Contract (add; `discharge` return goes `void` → `DischargeResult`, input type widens):

```ts
export type DischargeInput = { discharged_at?: string; note_internal?: string; farewell?: { text: string; share: boolean } };
export type DischargeResult = { days: number; invoiceUpdated: boolean };
export type StayBilling = { invoiceId: string; invoiceCode: string; status: import('./enums').InvoiceStatus; dayItemName?: string; dayPrice?: number; dayQty?: number };
// StaffStayView gains: billing?: StayBilling;
discharge(id: string, version: number, input: DischargeInput): Promise<DischargeResult>;
```

- `inpatient-billing.ts`: `findDayLine(doc: Readonly<Doc>, invoiceId: string, petId: string): InvoiceLine | undefined` (see Decisions); `settleDayLine(d: Doc, stay: Stay, until: string): DischargeResult` (days = `billableDays(stay.admitted_at, until)`; updates qty + `line_total`, `recomputeTotals`, `inv.version += 1` only when the invoice is a draft and a day line exists); `stayBilling(doc, stay): StayBilling | undefined` (no `invoice_id` → undefined; day fields from `findDayLine`).
- Discharge transaction: `discharged_at` = input or now (`toIsoVN`); before `admitted_at` / after now → `ValidationError({ discharged_at })`. Farewell with non-blank text → one diary entry `{ general_status: 'ready_home', category: 'tinh_than', part_of_day: partOfDay(discharged_at), text, author_id: actor, created_at: now }`, shared (`shared_by/at`) when `farewell.share && caps.has('inpatient.share')`, else draft; audit per "Exact copy". Discharge audit gets the " · hóa đơn tính X ngày" suffix only when `invoiceUpdated`.

- [ ] **Step 1: Write the failing tests** (`describe('discharge')`; `makeTestApi('2026-10-19T14:30:00+07:00')` so Miu has stayed exactly 52 h)

```ts
it('sets the day line to 2,2 days for 52 hours and re-totals the draft', async () => {
  await loginAs(api, 'bacsi_mai');
  const miu = stay('NT-0041'); const inv = invoice(miu.invoice_id!);
  const r = await api.staff.inpatient.discharge(miu.id, miu.version, {});
  expect(r).toEqual({ days: 2.2, invoiceUpdated: true });
  expect(line(inv.id, 'pi-LT01')).toMatchObject({ qty: 2.2, line_total: 330000 });
  expect(invoice(inv.id)).toMatchObject({ subtotal: inv.subtotal + 30000, version: inv.version + 1 });
  expect(db.read().t.audit_events.at(-1)!.summary_vi).toBe('BS. Phạm Thanh Mai cho xuất viện NT-0041 · hóa đơn tính 2,2 ngày');
});
it('leaves an issued invoice alone', /* issue Gạo's draft first; discharge → { invoiceUpdated: false }, invoice JSON unchanged */);
it('does not re-add a day line staff removed', /* updateDraft Kem's draft keeping only KB06 → discharge → no LT line, invoiceUpdated false */);
it('finds the day line after the draft was re-saved with another day item', /* updateDraft Mochi: [LT03 qty 4, TH02 qty 1] → discharge → LT03 line qty = billableDays(...) */);
it('a 2,2-day line survives updateDraft with whole-đồng totals', /* after Miu discharge, updateDraft with the same lines (qty 2.2) → line_total 330000, Number.isInteger(subtotal) */);
it('turns the farewell into a "Sẵn sàng về nhà" entry, shared only with inpatient.share', async () => {
  // bacsi_duc on Mochi: farewell { text: 'Mochi đã khỏe và sẵn sàng về nhà. Cảm ơn gia đình đã tin tưởng Lê Sơn!', share: true }
  //   → newest diary entry { status: 'shared', general_status: 'ready_home', category: 'tinh_than', part_of_day: 'chieu' }
  // a staff member with only inpatient.view + inpatient.admit (set extra_capabilities via db.transact in the test) on Kem → status 'draft'
  // blank farewell text → no entry
});
it('refuses a discharge time before admission or in the future', /* fields.discharged_at messages; nothing written */);
it('exposes billing on the stay view', async () => {
  const v = await api.staff.inpatient.getStay('stay-NT-0041');
  expect(v.billing).toMatchObject({ status: 'draft', dayItemName: 'Nội trú mèo', dayPrice: 150000, dayQty: 2 });
  // a stay admitted without invoice → billing undefined; with an empty draft → dayItemName undefined
});
```

- [ ] **Step 2: Run `npx vitest run src/data/mock/api/staff/inpatient-stay.test.ts`** — FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the file + `npm test` — PASS.
- [ ] **Step 5: Commit** `feat: discharge recalculates the hourly day line and records the farewell`

---

### Task 8: Device media store, `MediaApi`, clean-up on purge/delete/reset/startup

**Files:**
- Create: `src/data/mock/store/blobs.ts`, `src/data/mock/store/blobs.test.ts`, `src/data/mock/api/media.ts`, `src/data/mock/api/media.test.ts`
- Modify: `src/data/contracts/api.ts`, `src/data/mock/env.ts`, `src/data/mock/api/index.ts`, `src/data/mock/api/system.ts`, `src/data/mock/api/staff/inpatient.ts` (`purgeExpiredVideos`, `videos.delete`), `src/data/mock/api/customer/index.ts` (pass `env.media` to purge), `src/data/mock/testing.ts`, `src/data/mock/index.ts`

**Interfaces:**
- `contracts/api.ts`: `export type LocalMedia = { video: Blob; poster?: Blob };` `export interface MediaApi { /** A video kept only in this browser ("local:…"); null when its file is gone. */ local(mediaKey: string): Promise<LocalMedia | null> }`.
- `blobs.ts`:

```ts
export interface BlobStore {
  available(): Promise<boolean>;
  put(key: string, video: Blob): Promise<void>;
  get(key: string): Promise<LocalMedia | null>;
  /** Deletes synchronously in memory; IndexedDB deletes are fire-and-forget safe. */
  remove(keys: string[]): Promise<void>;
  keys(): Promise<string[]>;
  clear(): Promise<void>;
}
export function memoryBlobStore(opts?: { available?: boolean }): BlobStore;
export function browserBlobStore(): BlobStore; // idb-keyval createStore('leson-demo-media', 'files'); put() also stores a first-frame JPEG poster when the browser can decode the file (≤ 640 px wide, 3 s timeout, failures ignored); available() probes a set/del once and caches it
```

- `Env` gains `media: BlobStore`; `createMockApi(opts: { db; sessionKV; clock; media?: BlobStore })` (default `memoryBlobStore()`) and returns `media: mediaApi(env)`; `makeTestApi(nowIso?, media = memoryBlobStore())` also returns `media`.
- `media.ts`: `LOCAL_PREFIX = 'local:'`, `isLocalKey(key: string): boolean`, `mediaApi(env): MediaApi` (staff with `inpatient.view`: any non-deleted video's key; customer: only keys of videos in `visibleVideos` for their pets, else `NotFoundError`; guest → `ForbiddenError`; non-local key or deleted video → `null`), `cleanOrphanBlobs(db: Db, media: BlobStore): Promise<number>` (removes stored keys with no non-deleted video).
- `purgeExpiredVideos(db, now, media?: BlobStore)` calls `media.remove(localKeysJustExpired)` after the transaction (not awaited); `videos.delete` removes the file after its transaction; `resetDemo` = `session.clear(); db.reset(); await env.media.clear();`. Browser singleton: `browserBlobStore()` passed to `createMockApi`, then `void cleanOrphanBlobs(db, media)`.

- [ ] **Step 1: Write the failing tests**

```ts
// blobs.test.ts — memory store contract
const s = memoryBlobStore();
await s.put('local:a', new Blob(['x'], { type: 'video/webm' }));
expect((await s.get('local:a'))!.video.size).toBe(1);
expect(await s.keys()).toEqual(['local:a']);
void s.remove(['local:a']); expect(await s.keys()).toEqual([]); // removal is immediate
expect(await memoryBlobStore({ available: false }).available()).toBe(false);
// media.test.ts — seed a local video row by hand: db.transact pushes { ...copy of video-V2, id: 'video-L1', media_key: 'local:video-L1' } and media.put('local:video-L1', blob)
it('staff read local files; demo keys and deleted videos give null', /* bacsi_mai: local('local:video-L1') size 1; local('demo:v1-mieu-an-sang') null */);
it('a customer reads only files of videos shared with them', /* lan_nguyen: shared L1 (Miu) → blob; thuy_pham → NotFoundError; set share_status 'draft' → lan NotFoundError */);
it('purge, delete and reset remove local files', /* setNow +61 days → api.system.purgeExpiredVideos() → media.keys() lacks key; second row → staff videos.delete → removed; put another → system.resetDemo() → keys [] */);
it('cleanOrphanBlobs removes files whose video is gone', /* put 'local:ghost' → cleanOrphanBlobs → 1, keys keep 'local:video-L1' */);
```

- [ ] **Step 2: Run `npx vitest run src/data/mock/store/blobs.test.ts src/data/mock/api/media.test.ts`** — FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** + `npm test` + `npm run lint` (IndexedDB only via `blobs.ts`) — PASS.
- [ ] **Step 5: Commit** `feat: device video store (IndexedDB) with clean-up on purge, delete, reset and startup`

---

### Task 9: Video upload (sample clip or device file)

**Files:**
- Create: `src/data/rules/video-upload.ts`, `src/data/rules/video-upload.test.ts`, `src/data/mock/api/staff/inpatient-videos.test.ts`
- Modify: `src/data/contracts/staff.ts`, `src/data/contracts/customer.ts`, `src/data/mock/seed/inpatient.ts` (export `DEMO_CLIPS`), `src/data/mock/api/staff/inpatient.ts`, `src/data/mock/projections/customer/index.ts`

**Interfaces:**
- `video-upload.ts`: `VIDEO_MAX_BYTES = 20 * 1024 * 1024`, `VIDEO_MAX_SECONDS = 15`, `VIDEO_CAPTION_MAX = 120`, `VIDEO_MSG = { notVideo, tooBig, tooLong, storage }` (copy table), `videoFileProblem(file: { type: string; size: number }, duration_s?: number): string | null` (checks type `video/*` → size → duration; unknown duration 0/undefined passes).
- Contract (add):

```ts
export type DemoClip = { key: string; label: string; duration_s: number };
export type VideoUploadInput = {
  source: { kind: 'demo'; key: string } | { kind: 'device'; file: Blob };
  caption?: string; recorded_at?: string;
  /** Seconds the browser read; 0 or absent = unknown (shown "—"). Ignored for sample clips. */
  duration_s?: number;
  /** Only for staff with inpatient.share; both boxes ticked. */
  share?: VideoShareChecks;
};
// StaffVideoRow gains isLocal: boolean;  CustomerVideo gains isLocal: boolean;
// StaffInpatientApi.videos gains:
upload(stayId: string, input: VideoUploadInput): Promise<string>;
demoClips(): Promise<DemoClip[]>;
deviceUploadAvailable(): Promise<boolean>;
```

- `DEMO_CLIPS` (keys from the seed, durations from ffprobe): v1-mieu-an-sang 10 "Mèo ăn sáng", v2-mieu-suoi-nang 10 "Mèo sưởi nắng", v3-mieu-nghi 8 "Mèo chợp mắt", v4-kem-uong-nuoc 10 "Chó uống nước", v5-gao 8 "Mèo nằm nghỉ", v6-bo-spa 10 "Chó sau khi tắm sấy" (keys prefixed `demo:`).
- `upload` order: actor (`inpatient.diary_write`) → `share` without `inpatient.share` → `ForbiddenError`, incomplete checks → `checks` → caption > 120 → recorded_at > now → source (`demo` key not in `DEMO_CLIPS` → `source`; device → `videoFileProblem` → `file`) → device: `available()` false or `put` throws → `file` storage message → `mutateStay(stayId, 'inpatient.diary_write', 'inpatient.videos.upload', …)` pushes the video (`id = newId()`, `media_key` = clip key or `local:${id}`, `duration_s` = clip's or `Math.round(input.duration_s ?? 0)`, `uploaded_at = recorded_at default = now`, `expires_at = videoExpiresAt(uploaded_at)`, `audio_removed: true`, `share_status` shared/draft, `customer_id`/`pet_id` from the stay) + audit `video.upload` (+ `video.share` when shared) → on any error after `put`, `await media.remove([key])` and rethrow.

- [ ] **Step 1: Write the failing tests**

```ts
// video-upload.test.ts
expect(videoFileProblem({ type: 'image/png', size: 10 })).toBe('Tệp này không phải video. Bạn chọn tệp MP4, MOV hoặc WebM nhé.');
expect(videoFileProblem({ type: 'video/mp4', size: VIDEO_MAX_BYTES + 1 })).toBe('Video lớn hơn 20 MB. Bạn cắt ngắn hoặc chọn video khác nhé.');
expect(videoFileProblem({ type: 'video/webm', size: 10 }, 15.4)).toBe('Video dài hơn 15 giây. Bạn cắt ngắn hoặc chọn video khác nhé.');
expect(videoFileProblem({ type: 'video/quicktime', size: VIDEO_MAX_BYTES }, 15)).toBeNull();
expect(videoFileProblem({ type: 'video/webm', size: 10 }, 0)).toBeNull();
// inpatient-videos.test.ts
const webm = (bytes = 10) => new Blob([new Uint8Array(bytes)], { type: 'video/webm' });
it('uploads a sample clip as a draft', /* spa_ngocanh, Kem, { source: { kind: 'demo', key: 'demo:v4-kem-uong-nuoc' }, caption: 'Kem chơi bóng' } → row { media_key 'demo:v4-kem-uong-nuoc', duration_s 10, share_status 'draft', audio_removed true }, expires 60 days after */);
it('uploads a device file, shares it, and the owner sees it with isLocal', async () => {
  // bacsi_mai, Miu, { source: { kind: 'device', file: webm() }, duration_s: 9.6, share: { only_this_pet: true, no_people_or_private_info: true } }
  // → media_key `local:${id}`, duration_s 10, share_status 'shared'; media.keys() contains it; getStay video row isLocal true
  // lan_nguyen: customer.stays.get('stay-NT-0041').videos[0] has isLocal true and id === new id
});
it('refuses wrong files, long videos, long captions, future times, unknown clips', /* each → ValidationError field + exact copy; media.keys() stays [] */);
it('refuses sharing without inpatient.share or with one box', /* staff with only diary_write+view → ForbiddenError; bacsi_mai with one box → fields.checks */);
it('says the browser cannot store videos when storage is unavailable', /* makeTestApi(TEST_NOW, memoryBlobStore({ available: false })) → deviceUploadAvailable() false; upload device → fields.file storage message */);
it('removes the stored file when the write fails', /* upload device to 'stay-NT-0035' (discharged) → 'Bé đã xuất viện.'; media.keys() [] */);
it('lists the sample clips', /* demoClips() length 6, first { key: 'demo:v1-mieu-an-sang', label: 'Mèo ăn sáng', duration_s: 10 } */);
```

- [ ] **Step 2: Run `npx vitest run src/data/rules/video-upload.test.ts src/data/mock/api/staff/inpatient-videos.test.ts`** — FAIL.
- [ ] **Step 3: Implement** (`isLocal: isLocalKey(v.media_key)` in `getStay` rows and in `videoCard`, as an explicit field).
- [ ] **Step 4: Run** + `npm test` (customer leak test still green) — PASS.
- [ ] **Step 5: Commit** `feat: upload stay videos from sample clips or the device (≤ 20 MB, ≤ 15 s)`

---

### Task 10: Stay history

**Files:**
- Create: `src/data/mock/api/staff/inpatient-history.ts`, `src/data/mock/api/staff/inpatient-history.test.ts`
- Modify: `src/data/contracts/staff.ts`, `src/data/mock/api/staff/inpatient.ts`

**Interfaces:**
- Contract (add):

```ts
export type StayHistoryIcon = 'admit' | 'transfer' | 'status' | 'discharge' | 'diary' | 'video' | 'clinical';
export type StayHistoryItem = { at: string; label: string; actorName: string; icon: StayHistoryIcon };
history(stayId: string): Promise<StayHistoryItem[]>; // StaffInpatientApi, cap inpatient.view
```

- `inpatient-history.ts`: `CLINICAL_ACTIONS = new Set(['order.create', 'order.stop', 'administration.record', 'care_note.create'])`; `stayHistory(doc: Readonly<Doc>, stayId: string, clinical: boolean): StayHistoryItem[]` — rows with (`entity_type 'stay'` and `entity_id = stayId`) or (`entity_type 'video'` and that video's `stay_id = stayId`); drop clinical actions unless `clinical`; `label` = `summary_vi` minus the leading `actor_name_snapshot + ' '`, first letter upper-cased; `icon` by action prefix (`stay.admit`→admit, `stay.transfer`→transfer, `stay.status`→status, `stay.discharge`→discharge, `diary.*`→diary, `video.*`→video, clinical→clinical); newest first by `Date.parse(at)`, ties → the later-written audit row first (so a seeded admission stays below the orders written at the same instant).

- [ ] **Step 1: Write the failing tests**

```ts
it('a doctor sees the full history; spa never sees orders or care notes', async () => {
  await loginAs(api, 'bacsi_mai');
  const doc = await api.staff.inpatient.history('stay-NT-0041');
  expect(doc.at(-1)).toMatchObject({ label: 'Nhập viện Miu vào chuồng M2 (NT-0041)', actorName: 'BS. Phạm Thanh Mai', icon: 'admit' });
  expect(doc.some((h) => h.icon === 'clinical' && h.label === 'Thêm y lệnh cho NT-0041')).toBe(true);
  await loginAs(api, 'spa_ngocanh');
  const spa = await api.staff.inpatient.history('stay-NT-0041');
  expect(spa.some((h) => h.icon === 'clinical')).toBe(false);
  expect(JSON.stringify(spa)).not.toMatch(/NaCl|Kháng sinh|0,5 ml/);
  expect(spa.some((h) => h.icon === 'video' && h.label === 'Tải lên 1 video của Miu')).toBe(true);
});
it('orders mixed timestamp formats by time', async () => {
  // bacsi_duc transfers Kem now (audit at …Z) → history('stay-NT-0044')[0] is the transfer, label 'Chuyển Kem từ chuồng C4 sang C5'
});
it('shows system deletions as Hệ thống', /* purge at '2026-10-23T09:00:00+07:00' → history('stay-NT-0035')[0] { actorName: 'Hệ thống', label: 'Tự xóa 1 video của Bơ sau 60 ngày', icon: 'video' } */);
```

- [ ] **Step 2: Run `npx vitest run src/data/mock/api/staff/inpatient-history.test.ts`** — FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** — PASS.
- [ ] **Step 5: Commit** `feat: stay history from the audit trail, clinical rows only for inpatient.clinical`

---

### Task 11: Leak test over the whole new lifecycle

**Files:** Modify `src/data/mock/api/customer/leak.test.ts`

- [ ] **Step 1: Write the test** — new `it('after admit → transfer → device video → discharge with farewell, the owner still sees nothing internal')`: as `bacsi_mai` admit Bông (`pet-bong`, cage C5, reason "Theo dõi sau tiêm phòng", invoice LT02), transfer to C6 with reason "Đổi chuồng gần quầy", upload a shared device video, discharge with `note_internal: 'Dặn chủ tái khám sau 3 ngày'` and a shared farewell; then as `lan_nguyen` run `everyCustomerOutput` and assert the existing FORBIDDEN_KEYS plus values: the reason, the transfer reason, the discharge note, `"C5"`, `"C6"`, every staff display name; and `JSON` contains the farewell text and `"isLocal":true`.
- [ ] **Step 2: Run `npx vitest run src/data/mock/api/customer/leak.test.ts`** — expect PASS immediately (guard test). If it fails, fix the projection that leaks (that is a real bug) before committing.
- [ ] **Step 3: Commit** `test: customer leak check covers the full stay lifecycle`

---

### Task 12: `useMediaUrls` hook

**Files:**
- Create: `src/data/hooks/useMediaUrls.ts`, `src/data/hooks/useMediaUrls.test.ts`

**Interfaces:**
- `export type MediaUrls = { mp4: string; poster?: string; thumb?: string };`
- `export async function resolveLocalMedia(key: string, load: (k: string) => Promise<LocalMedia | null>, toUrl: (b: Blob) => string): Promise<{ urls: MediaUrls; created: string[] } | null>` — poster doubles as thumb.
- `export function useMediaUrls(mediaKey: string | undefined): { urls?: MediaUrls; loading: boolean; missing: boolean }` — `demo:` → `mediaFor` (sync; null → missing); `local:` → effect calling `resolveLocalMedia(key, api.media.local, URL.createObjectURL)`, revoking `created` on cleanup/key change; errors → missing. UI shows "Không còn tệp video" when `missing`.

- [ ] **Step 1: Write the failing tests** (resolver only; node env)

```ts
const toUrl = (b: Blob) => `blob:${b.type}`;
it('makes urls for the video and its poster', async () => {
  const r = await resolveLocalMedia('local:x', async () => ({ video: new Blob([], { type: 'video/webm' }), poster: new Blob([], { type: 'image/jpeg' }) }), toUrl);
  expect(r).toEqual({ urls: { mp4: 'blob:video/webm', poster: 'blob:image/jpeg', thumb: 'blob:image/jpeg' }, created: ['blob:video/webm', 'blob:image/jpeg'] });
});
it('works without a poster and reports a missing file as null', /* poster absent → created length 1, poster undefined; load → null → null */);
```

- [ ] **Step 2: Run `npx vitest run src/data/hooks/useMediaUrls.test.ts`** — FAIL.
- [ ] **Step 3: Implement** (hook mirrors `useQuery`'s `alive` flag pattern).
- [ ] **Step 4: Run** + `npm run typecheck && npm run lint` — PASS.
- [ ] **Step 5: Commit** `feat: useMediaUrls plays sample clips and browser-stored videos alike`

---

### Task 13: Browser check — IndexedDB really keeps and drops the file

**Files:**
- Create: `e2e/fixtures/tiny.webm` (`ffmpeg -f lavfi -i testsrc=size=64x64:rate=10 -t 1 -c:v libvpx -b:v 50k -an e2e/fixtures/tiny.webm`), `e2e/du-lieu-media.spec.ts`
- Modify: `src/data/mock/test-hooks.ts`, `src/data/mock/index.ts` (pass the extras)

**Interfaces:** `installTestHooks(api: MockApi, setNow, failNextWrite, extras: { blobKeys(): Promise<string[]>; cleanOrphans(): Promise<number> })` → `window.__lesonDemo.api`, `.blobKeys()`, `.cleanOrphans()`.

- [ ] **Step 1: Write the test** `@desktop-only`: `open(page, '/nv/noi-tru', { as: 'bacsi_mai' })`; read the fixture in Node, pass bytes to `page.evaluate`, call `api.staff.inpatient.videos.deviceUploadAvailable()` (true) and `videos.upload('stay-NT-0041', { source: { kind: 'device', file }, duration_s: 1, caption: 'Miu tập đi' })`; expect from `api.media.local(key)`: `video.size` = fixture size, `poster.type` = `'image/jpeg'`; `page.reload()` + `waitForFunction(() => '__lesonDemo' in window)` → `await cleanOrphans()` returns 0 and `media.local(key)` still returns the file (survives reload, not taken for an orphan); `__lesonDemo.reset()` → `blobKeys()` is `[]`.
- [ ] **Step 2: Run `npm run build && npx playwright test e2e/du-lieu-media.spec.ts --project=desktop-1440`** — FAIL (hooks not exposed).
- [ ] **Step 3: Expose the hooks.**
- [ ] **Step 4: Run again** — PASS.
- [ ] **Step 5: Commit** `test: IndexedDB keeps device videos across reloads and reset clears them`

---

### Task 14: Docs, PROGRESS, full verify, push and merge

**Files:** `docs/thiet-ke/QUYET-DINH.md` (new R33: hourly day charge rounded up to 0,1 day, day line auto-updated on discharge for drafts only, no weight → no day line, Spa gains `inpatient.admit` + `inpatient.share`, video ≤ 20 MB and ≤ 15 s, device videos kept in this browser only), `docs/thiet-ke/proposal-staff.md` §2 (capability table: Spa ✓ for `inpatient.admit`, `inpatient.share`; rewrite the "Spa staff can draft … but not publish" bullet), `PROGRESS.md` (own section; "Thay đổi hợp đồng" lists every addition from Tasks 4–10 + `isLocal`, `duration_s 0 = unknown`, `MediaApi`, `useMediaUrls`; "Yêu cầu gửi nhánh kia": UI for admit/transfer/discharge/upload/history dialogs per spec §4 + redesign part 4, show "—" for `duration_s` 0, use `useMediaUrls` everywhere `mediaFor` is used, chip "Chỉ lưu trên trình duyệt này" on `isLocal`, Spa now sees share/admit actions).

- [ ] **Step 1:** Edit the docs.
- [ ] **Step 2:** `npm run verify` — all green (typecheck, lint, unit, artifact build, budgets, build, e2e). Fix anything red before continuing.
- [ ] **Step 3:** Commit `docs: record inpatient data decisions and contract changes`; `git push -u origin claude/du-lieu`.
- [ ] **Step 4:** Merge into the integration branch as CLAUDE.md "Gộp" says: in the repo root, `git checkout claude/focused-pascal-rfxnnp && git pull && git merge --no-ff claude/du-lieu`, run `npm run verify` there, push.
