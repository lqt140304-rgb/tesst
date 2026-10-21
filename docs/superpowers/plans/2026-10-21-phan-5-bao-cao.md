# Phần 5 · Giai đoạn 2 — Báo cáo vận hành (dữ liệu) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hàm `staff.reports.operations({ from, to })` trả báo cáo vận hành (lịch hẹn, yêu cầu đặt lịch, nội trú, khách mới, kho, tóm tắt doanh thu) kèm "kỳ trước", chỉ tính từ dữ liệu có sẵn.

**Architecture:** Phần tính nằm ở hàm thuần `rules/operations-report.ts` (nhận mảng dòng, không đọc kho dữ liệu) cùng `rules/calendar.ts` (ngày, khoảng ngày). API ở `mock/api/staff/reports.ts` ghép các hàm thuần, dùng lại chính hàm tính doanh thu và tóm tắt kho (tách ra, không viết lại). Hợp đồng chỉ thêm.

**Tech Stack:** TypeScript 6, Vitest 5, mock store (`env.db.read()`), `staffActor`. Không thêm thư viện.

**Spec:** `docs/superpowers/specs/2026-10-21-phan-5-kho-bao-cao-cai-dat-design.md` (§3.0 quyền, §3.2 Báo cáo vận hành, §6 kiểm thử). Chủ dự án đã duyệt 21/10/2026.

## Global Constraints

- Chỉ sửa `src/data/**`, `scripts/check-budgets.mjs` (nếu ngân sách vượt), `docs/`, `PROGRESS.md`. **Không** sửa `src/features`, `src/app`, `src/ui`, `src/styles`.
- Hợp đồng `src/data/contracts/` **chỉ thêm**. Lỗi nhập là `ValidationError(fields)`; câu báo lỗi nguyên văn ở Task 1.
- Khoảng ngày `YYYY-MM-DD` theo giờ Việt Nam (`dayOf`, `addDays`, `daysBetween` ở `src/lib/dates.ts`); hợp lệ, `from ≤ to`, tối đa **366 ngày**; "kỳ trước" = khoảng liền trước, dài bằng nhau.
- Tỉ lệ có mẫu số 0 trả `null` (không 0, không `NaN`). Không có con số nhập tay.
- Quyền mới `reports.operations`: **chỉ Quản lý có sẵn**; Bác sĩ, Spa không đổi. Khối `revenue` của báo cáo **chỉ trả khi người gọi cũng có `reports.revenue`** (kế hoạch chốt: không mở rộng quyền xem tiền).
- Không đổi dữ liệu mẫu hiện có; không thêm dữ liệu mẫu (số liệu tính từ dữ liệu có sẵn).
- TDD: test thất bại trước. Viết code giống code xung quanh. Commit nhỏ, tiêu đề tiếng Anh; **không ghi tên model vào commit/code/tài liệu**; thân commit chỉ kết thúc bằng dòng `Claude-Session: https://claude.ai/code/session_01WQRA4c5rpvrJd3fkJ3fRkU`.
- Trước khi gộp: `npm run verify` trong `.worktrees/du-lieu` (~12 phút). **Ghi chú:** từ 00:00 đến khoảng 03:00 giờ Việt Nam, 4 bài e2e khu khách (×2 cỡ màn hình) đỏ sẵn vì dữ liệu mẫu "N phút trước" (đã ghi ở `PROGRESS.md`); nếu chỉ các bài đó đỏ thì không phải do giai đoạn này.

## Review Focus

1. **Biên ngày:** lịch lúc 23:59 và 00:00 giờ VN, mốc UTC `…T17:00:00Z` = 00:00 giờ VN hôm sau, cuối tháng; kỳ trước của khoảng 1 ngày và của cả tháng (Task 1, 2).
2. **Mẫu số 0:** không có lịch/yêu cầu/chuồng/khoảng đã trôi qua → tỉ lệ `null`, trung bình `null` (Task 2, 4).
3. **Khoảng ở tương lai hoặc mới trôi qua một phần:** ngày-giường và tỉ lệ lấp đầy chỉ tính đến "bây giờ" (Task 2, 4).
4. **Khoảng ngày vô lý:** ngày không có thật, đảo ngược, 367 ngày, `from = to` hợp lệ (Task 1, 4).
5. **Quyền với dữ liệu tiền:** Bác sĩ, Spa, khách, khách vãng lai bị từ chối; có `reports.operations` mà thiếu `reports.revenue` thì **không** thấy khối `revenue` (Task 4).

---

## File Structure

| Tệp | Việc |
|---|---|
| `src/data/rules/calendar.ts` (mới) | `isRealDate` (chuyển từ `stock.ts`), `daysInclusive`, `previousPeriod`, `validateRange`, `RANGE_MSG` |
| `src/data/rules/stock.ts` (sửa) | nhập `isRealDate` từ `calendar.ts` và xuất lại |
| `src/data/rules/request-status.ts` (sửa) + `mock/api/staff/requests.ts` (sửa) | `OPEN_REQUEST_STATUSES` dùng chung |
| `src/data/rules/capabilities.ts` (sửa) | quyền `reports.operations` |
| `src/data/contracts/enums.ts`, `staff.ts` (sửa) | `APPOINTMENT_SOURCES`; kiểu `Ops*`, `OperationsReport`; `StaffReportsApi.operations` |
| `src/data/rules/operations-report.ts` (mới) | `appointmentStats`, `requestStats`, `inpatientStats`, `countInRange` |
| `src/data/mock/api/staff/reports.ts` (mới) | `staffReportsApi` (chuyển từ `invoices.ts`) + `revenueReport` + `operations` |
| `src/data/mock/api/staff/invoices.ts`, `stock.ts`, `api/index.ts` (sửa) | bỏ `staffReportsApi` cũ; `summarizeStock` xuất ra; nối import |
| Test | `rules/calendar.test.ts`, `rules/operations-report.test.ts`, `rules/request-status.test.ts`, `rules/capabilities.test.ts`, `api/staff/reports.test.ts`, `api/staff/stock.test.ts` |

---

### Task 1: Ngày tháng, quyền, trạng thái "cần xử lý" dùng chung

**Files:**
- Create: `src/data/rules/calendar.ts`, `src/data/rules/calendar.test.ts`
- Modify: `src/data/rules/stock.ts`, `src/data/rules/request-status.ts`, `src/data/rules/request-status.test.ts`, `src/data/mock/api/staff/requests.ts`, `src/data/rules/capabilities.ts`, `src/data/rules/capabilities.test.ts`

**Interfaces:**
- Consumes: `addDays`, `daysBetween` từ `src/lib/dates.ts`.
- Produces:
```ts
// rules/calendar.ts
export function isRealDate(s: string): boolean;                       // chuyển nguyên văn từ rules/stock.ts
export const REPORT_MAX_DAYS = 366;
export const RANGE_MSG: { date: 'Ngày cần đúng dạng năm-tháng-ngày, ví dụ 2026-10-19.'; order: 'Ngày kết thúc cần sau hoặc bằng ngày bắt đầu.'; span: 'Khoảng ngày tối đa 366 ngày.' };
export function daysInclusive(from: string, to: string): number;     // cả hai đầu, from ≤ to
export function previousPeriod(from: string, to: string): { from: string; to: string };
export function validateRange(r: { from: string; to: string }): Record<string, string>; // khóa from, to
// rules/request-status.ts
export const OPEN_REQUEST_STATUSES: readonly RequestStatus[];        // ['pending', 'contacting', 'unreachable']
// capabilities: Cap thêm 'reports.operations' (nhãn 'Xem báo cáo vận hành')
```

- [ ] **Step 1: Write the failing tests**

`calendar.test.ts`:
```ts
describe('daysInclusive and previousPeriod', () => {
  it('counts both ends', () => {
    expect(daysInclusive('2026-10-19', '2026-10-19')).toBe(1);
    expect(daysInclusive('2026-10-19', '2026-10-25')).toBe(7);
    expect(daysInclusive('2024-01-01', '2024-12-31')).toBe(366);
  });
  it('the previous period is as long and ends the day before', () => {
    expect(previousPeriod('2026-10-19', '2026-10-25')).toEqual({ from: '2026-10-12', to: '2026-10-18' });
    expect(previousPeriod('2026-10-19', '2026-10-19')).toEqual({ from: '2026-10-18', to: '2026-10-18' });
    expect(previousPeriod('2026-11-01', '2026-11-30')).toEqual({ from: '2026-10-02', to: '2026-10-31' });
  });
});
describe('validateRange', () => {
  it('accepts a day, a week and a whole leap year', () => {
    for (const r of [{ from: '2026-10-19', to: '2026-10-19' }, { from: '2026-10-19', to: '2026-10-25' }, { from: '2024-01-01', to: '2024-12-31' }]) expect(validateRange(r)).toEqual({});
  });
  it('names the bad field for impossible or malformed dates', () => {
    expect(validateRange({ from: '2026-02-30', to: '2026-10-19' })).toEqual({ from: RANGE_MSG.date });
    expect(validateRange({ from: '2026-10-19', to: '26-1-1' })).toEqual({ to: RANGE_MSG.date });
    expect(validateRange({ from: '', to: '' })).toEqual({ from: RANGE_MSG.date, to: RANGE_MSG.date });
  });
  it('refuses a reversed range and one longer than 366 days', () => {
    expect(validateRange({ from: '2026-10-20', to: '2026-10-19' })).toEqual({ to: RANGE_MSG.order });
    expect(validateRange({ from: '2024-01-01', to: '2025-01-01' })).toEqual({ to: RANGE_MSG.span });
  });
});
```
`request-status.test.ts` thêm: `expect([...OPEN_REQUEST_STATUSES]).toEqual(['pending', 'contacting', 'unreachable'])`.
`capabilities.test.ts`: đổi số lượng thành **19**; thêm test "only the manager has `reports.operations`; doctor and spa do not; `reports.revenue` stays separate" (Quản lý có cả hai; Bác sĩ, Spa không có `reports.operations`).

- [ ] **Step 2: Run to verify fail** — `npx vitest run src/data/rules` → FAIL (thiếu `./calendar`, `OPEN_REQUEST_STATUSES`, số quyền).

- [ ] **Step 3: Implement.** `isRealDate` chuyển nguyên thân hàm sang `calendar.ts`; `stock.ts` nhập lại và `export { isRealDate }` (để `stock.test.ts` hiện có không đổi). `daysInclusive = daysBetween(from, to) + 1`. `previousPeriod`: độ dài `n = daysInclusive`, kết quả `{ from: addDays(from, -n), to: addDays(from, -1) }`. `validateRange`: ngày sai → khóa của nó; chỉ khi cả hai hợp lệ mới xét `from > to` (khóa `to`, `order`) rồi `daysInclusive > REPORT_MAX_DAYS` (khóa `to`, `span`). `requests.ts` thay hằng `OPEN` cục bộ bằng `OPEN_REQUEST_STATUSES` (hành vi không đổi). Thêm quyền vào cuối `CAPS` và `CAP_LABEL`; **không** đụng `PRESETS.bac_si`/`spa`.

- [ ] **Step 4: Run to verify pass** — `npm test && npm run typecheck && npx eslint src/data` → PASS (kể cả test cũ của `requests`, `stock`).

- [ ] **Step 5: Commit**
```bash
git add src/data
git commit -m "feat: calendar rules (range validation, previous period), reports.operations capability, shared open-request statuses

Claude-Session: https://claude.ai/code/session_01WQRA4c5rpvrJd3fkJ3fRkU"
```

---

### Task 2: Kiểu hợp đồng và các hàm thuần của báo cáo

**Files:**
- Modify: `src/data/contracts/enums.ts` (thêm `APPOINTMENT_SOURCES`), `src/data/contracts/staff.ts` (kiểu)
- Create: `src/data/rules/operations-report.ts`
- Test: `src/data/rules/operations-report.test.ts`

**Interfaces:**
- Consumes: `OpsRange`-kiểu từ hợp đồng; `addDays`, `dayOf` (`lib/dates`); `OPEN_REQUEST_STATUSES` (Task 1); `SERVICES`, `REQUEST_STATUSES`, `APPOINTMENT_SOURCES`.
- Produces (`enums.ts`): `export const APPOINTMENT_SOURCES = ['web_request', 'phone', 'walk_in'] as const;` (kiểu `AppointmentSource` hiện có giữ nguyên).
- Produces (`staff.ts`, chỉ thêm):
```ts
export type OpsRange = { from: string; to: string };
export type OpsAppointments = { scheduled: number; cancelled: number; total: number; cancelRate: number | null; daily: { date: string; count: number }[]; byService: Record<Service, number>; bySource: Record<AppointmentSource, number>; byAssignee: { id: string | null; name: string; count: number }[]; previousScheduled: number };
export type OpsRequests = { received: number; byStatus: Record<RequestStatus, number>; confirmRate: number | null; avgFirstResponseMin: number | null; waitingNow: number; previousReceived: number };
export type OpsInpatient = { admitted: number; discharged: number; currentlyAdmitted: number; bedDays: number; occupancyRate: number | null; previousAdmitted: number };
export type OpsCustomers = { newCustomers: number; previousNewCustomers: number };
export type OpsStock = { low: number; out: number; expiringSoon: number; expired: number };
export type OpsRevenue = { collected: number; invoiced: number; outstanding: number; previousCollected: number };
export type OperationsReport = { from: string; to: string; previous: OpsRange; appointments: OpsAppointments; requests: OpsRequests; inpatient: OpsInpatient; customers: OpsCustomers; stock: OpsStock; revenue?: OpsRevenue };
```
- Produces (`rules/operations-report.ts`):
```ts
export type ApptRow = { start_at: string; status: 'scheduled' | 'cancelled'; service: Service; source: AppointmentSource; assignee_id?: string };
export type RequestRow = { id: string; created_at: string; status: RequestStatus };
export type RequestEventRow = { request_id: string; actor_type: string; at: string };
export type StayRow = { admitted_at: string; discharged_at?: string };
export function countInRange(isoDates: readonly string[], range: OpsRange): number;
export function appointmentStats(rows: readonly ApptRow[], people: readonly { id: string; name: string }[], range: OpsRange, prev: OpsRange): OpsAppointments;
export function requestStats(rows: readonly RequestRow[], events: readonly RequestEventRow[], range: OpsRange, prev: OpsRange): OpsRequests;
export function inpatientStats(stays: readonly StayRow[], activeCages: number, range: OpsRange, prev: OpsRange, now: Date): OpsInpatient;
```
Quy tắc (spec §3.2): một mốc thuộc ngày D khi `dayOf(mốc) === D` (giờ VN). `appointmentStats`: chỉ xét dòng có ngày trong khoảng; `scheduled` = "Đã hẹn", `total = scheduled + cancelled`; `cancelRate = cancelled / total` hoặc `null`; `daily`, `byService`, `bySource`, `byAssignee` đếm **chỉ lịch "Đã hẹn"** (nên mỗi nhóm cộng đúng bằng `scheduled`); `daily` có đủ mọi ngày của khoảng (kể cả 0); `byAssignee` chỉ gồm người có ≥ 1 lịch, xếp theo `count` giảm dần rồi tên (`localeCompare(…, 'vi')`), dòng `{ id: null, name: 'Chưa phân công' }` luôn cuối; id không có trong `people` lấy tên `'Không rõ'`; `previousScheduled` = số "Đã hẹn" của `prev`. `requestStats`: `received` = dòng có `created_at` trong khoảng; `byStatus` theo trạng thái hiện tại (đủ mọi trạng thái, 0 nếu không có); `confirmRate = confirmed / received` hoặc `null`; `avgFirstResponseMin` = trung bình, làm tròn `Math.round`, của (sự kiện đầu tiên có `actor_type === 'staff'` − `created_at`) tính bằng phút (không âm) trên các yêu cầu trong khoảng **có** sự kiện đó, `null` nếu không có yêu cầu nào; `waitingNow` = số yêu cầu (mọi lúc) có trạng thái thuộc `OPEN_REQUEST_STATUSES`; `previousReceived`. `inpatientStats`: `admitted`, `discharged` theo ngày của `admitted_at`/`discharged_at`; `currentlyAdmitted` = ca chưa xuất viện và `admitted_at ≤ now`; thời gian giao nhau của `[admitted_at, discharged_at ?? now]` với `[00:00 ngày from, 00:00 ngày sau to)` **cắt ở `now`**; `bedDays` = tổng giao nhau (ms) / 86 400 000 làm tròn 0,1 (`Math.round(x * 10) / 10`); `occupancyRate` = tổng giao nhau / (`activeCages` × thời gian đã trôi qua của khoảng, tính từ 00:00 ngày `from` đến `min(hết khoảng, now)`), `null` nếu mẫu số ≤ 0 (cũng khi `activeCages` = 0); `previousAdmitted`. `countInRange` đếm mốc có ngày trong khoảng.

- [ ] **Step 1: Write the failing tests** (`operations-report.test.ts`; mọi số tự tính tay)

```ts
const D = (day: string, hhmm = '09:00') => `${day}T${hhmm}:00+07:00`;
const people = [{ id: 'a1', name: 'An' }, { id: 'a2', name: 'Bình' }];
const range = { from: '2026-10-19', to: '2026-10-20' }, prev = { from: '2026-10-17', to: '2026-10-18' };

describe('countInRange', () => {
  it('counts Vietnam days, including a UTC stamp at 17:00 as the next day', () => {
    expect(countInRange([D('2026-10-19', '23:59'), D('2026-10-20', '00:00'), '2026-10-19T17:00:00Z', D('2026-10-21', '00:00'), D('2026-10-18', '23:59')], range)).toBe(3);
  });
});

describe('appointmentStats', () => {
  const rows: ApptRow[] = [
    { start_at: D('2026-10-19', '23:59'), status: 'scheduled', service: 'kham', source: 'phone', assignee_id: 'a1' },
    { start_at: D('2026-10-20', '00:00'), status: 'scheduled', service: 'spa', source: 'walk_in', assignee_id: 'a2' },
    { start_at: D('2026-10-20', '09:00'), status: 'cancelled', service: 'kham', source: 'phone', assignee_id: 'a1' },
    { start_at: D('2026-10-21', '00:00'), status: 'scheduled', service: 'kham', source: 'phone', assignee_id: 'a1' },
    { start_at: D('2026-10-18', '10:00'), status: 'scheduled', service: 'kham', source: 'phone', assignee_id: 'a1' },
    { start_at: D('2026-10-19', '10:00'), status: 'scheduled', service: 'kham', source: 'web_request' },
    { start_at: '2026-10-19T17:00:00Z', status: 'scheduled', service: 'kham', source: 'phone', assignee_id: 'a1' },
  ];
  it('counts scheduled and cancelled inside the range only, and every group adds up to scheduled', () => {
    const r = appointmentStats(rows, people, range, prev);
    expect(r).toMatchObject({ scheduled: 4, cancelled: 1, total: 5, cancelRate: 0.2, previousScheduled: 1 });
    expect(r.daily).toEqual([{ date: '2026-10-19', count: 2 }, { date: '2026-10-20', count: 2 }]);
    expect(r.byService).toEqual({ kham: 3, spa: 1, noi_tru: 0 });
    expect(r.bySource).toEqual({ phone: 2, walk_in: 1, web_request: 1 });
    expect(r.byAssignee).toEqual([{ id: 'a1', name: 'An', count: 2 }, { id: 'a2', name: 'Bình', count: 1 }, { id: null, name: 'Chưa phân công', count: 1 }]);
    for (const total of [r.daily.reduce((n, d) => n + d.count, 0), Object.values(r.byService).reduce((n, c) => n + c, 0), Object.values(r.bySource).reduce((n, c) => n + c, 0), r.byAssignee.reduce((n, a) => n + a.count, 0)]) expect(total).toBe(r.scheduled);
  });
  it('nothing in range: zeros, null rate, every day still listed', () => {
    const r = appointmentStats([], people, range, prev);
    expect(r).toMatchObject({ scheduled: 0, cancelled: 0, total: 0, cancelRate: null, byAssignee: [], previousScheduled: 0 });
    expect(r.daily).toEqual([{ date: '2026-10-19', count: 0 }, { date: '2026-10-20', count: 0 }]);
  });
  it('an assignee missing from the list is named "Không rõ"', () => {
    expect(appointmentStats([{ start_at: D('2026-10-19'), status: 'scheduled', service: 'kham', source: 'phone', assignee_id: 'zz' }], people, range, prev).byAssignee).toEqual([{ id: 'zz', name: 'Không rõ', count: 1 }]);
  });
});

describe('requestStats (range 19/10, previous 18/10)', () => {
  const r19 = { from: '2026-10-19', to: '2026-10-19' }, p18 = { from: '2026-10-18', to: '2026-10-18' };
  const rows: RequestRow[] = [
    { id: 'r1', created_at: D('2026-10-19', '08:00'), status: 'pending' },
    { id: 'r2', created_at: D('2026-10-19', '09:00'), status: 'confirmed' },
    { id: 'r3', created_at: D('2026-10-19', '23:30'), status: 'contacting' },
    { id: 'r4', created_at: D('2026-10-18', '10:00'), status: 'rejected' },
    { id: 'r5', created_at: D('2026-10-20', '00:10'), status: 'pending' },
  ];
  const events: RequestEventRow[] = [
    { request_id: 'r2', actor_type: 'staff', at: D('2026-10-19', '10:00') },
    { request_id: 'r2', actor_type: 'guest', at: D('2026-10-19', '09:00') },
    { request_id: 'r2', actor_type: 'staff', at: D('2026-10-19', '09:30') },
    { request_id: 'r3', actor_type: 'staff', at: D('2026-10-19', '23:45') },
  ];
  it('received, by status, confirm rate, first response (earliest staff event, rounded), waiting now, previous', () => {
    const r = requestStats(rows, events, r19, p18);
    expect(r.received).toBe(3);
    expect(r.byStatus).toEqual({ pending: 1, contacting: 1, confirmed: 1, unreachable: 0, cancelled: 0, rejected: 0 });
    expect(r.confirmRate).toBeCloseTo(1 / 3, 10);
    expect(r.avgFirstResponseMin).toBe(23);               // (30 + 15) / 2 = 22.5 → 23
    expect(r.waitingNow).toBe(3);                          // r1, r3, r5 — not limited to the range
    expect(r.previousReceived).toBe(1);
  });
  it('no requests, or none answered: null rates and averages, never 0 or NaN', () => {
    expect(requestStats([], [], r19, p18)).toMatchObject({ received: 0, confirmRate: null, avgFirstResponseMin: null, waitingNow: 0, previousReceived: 0 });
    expect(requestStats([rows[0]!], [], r19, p18)).toMatchObject({ received: 1, confirmRate: 0, avgFirstResponseMin: null });
  });
});

describe('inpatientStats (now 20/10 12:00)', () => {
  const now = new Date(D('2026-10-20', '12:00'));
  const r = { from: '2026-10-19', to: '2026-10-21' }, p = { from: '2026-10-16', to: '2026-10-18' };
  const stays: StayRow[] = [
    { admitted_at: D('2026-10-18', '12:00') },
    { admitted_at: D('2026-10-19', '06:00'), discharged_at: D('2026-10-19', '18:00') },
    { admitted_at: D('2026-10-10', '09:00'), discharged_at: D('2026-10-12', '09:00') },
    { admitted_at: D('2026-10-17', '20:00'), discharged_at: D('2026-10-19', '04:00') },
  ];
  it('counts admissions and discharges by day, current stays, bed-days and occupancy up to now', () => {
    const s = inpatientStats(stays, 2, r, p, now);
    expect(s).toMatchObject({ admitted: 1, discharged: 2, currentlyAdmitted: 1, previousAdmitted: 2 });
    expect(s.bedDays).toBe(2.2);                           // (36 + 12 + 4) h = 52 h = 2.17 days
    expect(s.occupancyRate).toBeCloseTo(52 / (2 * 36), 6); // elapsed 19/10 00:00 → 20/10 12:00 = 36 h
  });
  it('a range wholly in the future, or no active cages: null occupancy, no bed-days', () => {
    expect(inpatientStats(stays, 2, { from: '2026-10-25', to: '2026-10-26' }, { from: '2026-10-23', to: '2026-10-24' }, now)).toMatchObject({ bedDays: 0, occupancyRate: null });
    expect(inpatientStats(stays, 0, r, p, now).occupancyRate).toBeNull();
  });
  it('a stay not yet admitted at "now" is not counted as current', () => {
    expect(inpatientStats([{ admitted_at: D('2026-10-21', '09:00') }], 2, r, p, now).currentlyAdmitted).toBe(0);
  });
});
```

- [ ] **Step 2: Run to verify fail** — `npx vitest run src/data/rules/operations-report.test.ts` → FAIL (module không tồn tại).

- [ ] **Step 3: Implement** enums, kiểu hợp đồng (đặt cuối `staff.ts`, thêm `operations` vào `StaffReportsApi` **ở Task 4**) và `rules/operations-report.ts` theo khối Interfaces. Gợi ý: mốc ngày bằng `dayOf`, so sánh chuỗi `YYYY-MM-DD`; đầu khoảng `Date.parse(`${from}T00:00:00+07:00`)`, cuối (loại trừ) `Date.parse(`${addDays(to, 1)}T00:00:00+07:00`)`; cắt `min(cuối, now)`; danh sách ngày cho `daily` bằng vòng `addDays` từ `from` đến `to`.

- [ ] **Step 4: Run to verify pass** — `npx vitest run src/data/rules && npm run typecheck && npx eslint src/data` → PASS.

- [ ] **Step 5: Commit**
```bash
git add src/data
git commit -m "feat: operations report types and pure rules (appointments, requests, inpatient)

Claude-Session: https://claude.ai/code/session_01WQRA4c5rpvrJd3fkJ3fRkU"
```

---

### Task 3: Tách `reports.ts`, dùng lại hàm tính doanh thu và tóm tắt kho

**Files:**
- Create: `src/data/mock/api/staff/reports.ts`
- Modify: `src/data/mock/api/staff/invoices.ts` (bỏ `staffReportsApi` và import thừa), `src/data/mock/api/staff/stock.ts` (xuất `summarizeStock`), `src/data/mock/api/index.ts`
- Test: `src/data/mock/api/staff/stock.test.ts` (thêm test cho `summarizeStock`); các test doanh thu hiện có giữ nguyên

**Interfaces:**
- Produces:
```ts
// stock.ts
export function summarizeStock(rows: readonly StockRow[]): StockSummary;   // chỉ món đang dùng; cùng phép đếm summary() hiện có
// reports.ts
export function revenueReport(t: Readonly<Doc['t']>, range: { from: string; to: string }): RevenueReport;   // thân hàm = thân `revenue()` hiện có, không đổi hành vi
export function staffReportsApi(env: Env): StaffReportsApi;                // `revenue` kiểm `reports.revenue`, gọi revenueReport
```
Đây là **tái cấu trúc không đổi hành vi**; bài kiểm là các test hiện có (`invoices.test`: doanh thu theo danh mục, khớp tổng; `stock.test`: `summary`).

- [ ] **Step 1: Write the failing test** (`stock.test.ts`):
```ts
it('summarizeStock counts active rows only', () => {
  const row = (o: Partial<StockRow>): StockRow => ({ id: 'x', code: 'K', name: 'x', kind: 'vat_tu', unit: 'cái', qty: 5, minQty: 1, active: true, level: 'ok', expiry: 'none', version: 1, ...o });
  expect(summarizeStock([row({}), row({ level: 'low' }), row({ level: 'out' }), row({ expiry: 'soon' }), row({ expiry: 'expired' }), row({ active: false, level: 'out', expiry: 'expired' })]))
    .toEqual({ total: 5, low: 1, out: 1, expiringSoon: 1, expired: 1 });
});
```
- [ ] **Step 2: Run to verify fail** — `npx vitest run src/data/mock/api/staff/stock.test.ts` → FAIL (`summarizeStock` chưa có).
- [ ] **Step 3: Implement** theo khối Interfaces: chuyển thân `staffReportsApi` sang `reports.ts` (import `PAYMENT_METHODS`, `PRICE_CATEGORIES`, `addDays`, `dayOf`, `netLineTotals`, `paymentState`…), tách phần tính thành `revenueReport(t, range)`; `invoices.ts` bỏ phần đã chuyển và các import không còn dùng; `api/index.ts` nhập `staffReportsApi` từ `./staff/reports`; `stock.ts` `summary()` gọi `summarizeStock(readRows())`.
- [ ] **Step 4: Run to verify pass** — `npm test && npm run typecheck && npx eslint src/data` → toàn bộ xanh (số bài tăng 1).
- [ ] **Step 5: Commit**
```bash
git add src/data
git commit -m "refactor: move staff reports to reports.ts; reuse revenueReport and summarizeStock

Claude-Session: https://claude.ai/code/session_01WQRA4c5rpvrJd3fkJ3fRkU"
```

---

### Task 4: `staff.reports.operations`

**Files:**
- Modify: `src/data/contracts/staff.ts` (`StaffReportsApi` thêm `operations(range: OpsRange): Promise<OperationsReport>`), `src/data/mock/api/staff/reports.ts`
- Test: `src/data/mock/api/staff/reports.test.ts`

**Interfaces:**
- Consumes: Task 1–3 (`validateRange`, `previousPeriod`, `appointmentStats`, `requestStats`, `inpatientStats`, `countInRange`, `revenueReport`, `summarizeStock`, `toRow` từ `./stock`, `staffActor`, `sleepRead`, `todayVN`).
- Produces: `StaffReportsApi.operations`.

Cách ghép: `const a = staffActor(env, 'reports.operations')`; `fail(validateRange(range))` thành `ValidationError`; `prev = previousPeriod(from, to)`; đọc `db.read()` một lần, `now = env.clock()`; `people` = mọi `staff_users` (kể cả đã tắt) `{ id, display_name }`; `appointmentStats(t.appointments, people, …)`; `requestStats(t.booking_requests, t.request_events, …)`; `inpatientStats(t.stays, t.cages.filter(c => c.active).length, …, now)`; `customers` = `countInRange(t.customers.map(c => c.created_at), …)` và kỳ trước; `stock` = `summarizeStock(t.stock_items.map(toRow(i, todayVN(now))))` rút `low/out/expiringSoon/expired`; `revenue` **chỉ khi `a.caps.has('reports.revenue')`**: `collected`, `invoiced`, `outstanding` từ `revenueReport(t, range)` và `previousCollected` từ `revenueReport(t, prev).collected`. Không ghi dữ liệu.

- [ ] **Step 1: Write the failing tests** (`reports.test.ts`; `makeTestApi()` → "bây giờ" = 2026-10-19 09:00 giờ VN; số liệu lấy từ dữ liệu mẫu hiện có, đã tính độc lập bằng bộ lọc thô từ bảng gốc)

```ts
const A = { from: '2026-10-19', to: '2026-10-25' }, B = { from: '2026-10-12', to: '2026-10-18' };
async function manager() { const t = makeTestApi(); await loginAs(t.api, 'quanly_ha'); return t; }

it('week of 19/10: appointments', async () => {
  const { api } = await manager();
  const r = await api.staff.reports.operations(A);
  expect(r).toMatchObject({ from: A.from, to: A.to, previous: B });
  expect(r.appointments).toMatchObject({ scheduled: 24, cancelled: 0, total: 24, cancelRate: 0, previousScheduled: 14, byService: { kham: 13, spa: 11, noi_tru: 0 }, bySource: { phone: 19, walk_in: 2, web_request: 3 } });
  expect(r.appointments.daily).toHaveLength(7);
  expect(r.appointments.daily[0]).toEqual({ date: '2026-10-19', count: 7 });
  expect(r.appointments.byAssignee).toEqual([
    { id: 'stf-ngocanh', name: 'Lê Ngọc Anh', count: 11 }, { id: 'stf-mai', name: 'BS. Phạm Thanh Mai', count: 6 },
    { id: 'stf-duc', name: 'BS. Trần Minh Đức', count: 6 }, { id: null, name: 'Chưa phân công', count: 1 },
  ]);
});
it('week of 19/10: requests, inpatient, customers, stock', async () => {
  const { api } = await manager();
  const r = await api.staff.reports.operations(A);
  expect(r.requests).toEqual({ received: 3, byStatus: { pending: 3, contacting: 0, confirmed: 0, unreachable: 0, cancelled: 0, rejected: 0 }, confirmRate: 0, avgFirstResponseMin: null, waitingNow: 12, previousReceived: 17 });
  expect(r.inpatient).toMatchObject({ admitted: 1, discharged: 0, currentlyAdmitted: 5, bedDays: 1.6, previousAdmitted: 4 });
  expect(r.inpatient.occupancyRate).toBeCloseTo(39 / 108, 6);   // 12 cages × 9 h elapsed; 4 stays × 9 h + one admitted 06:00 × 3 h
  expect(r.customers).toEqual({ newCustomers: 0, previousNewCustomers: 0 });
  expect(r.stock).toEqual({ low: 3, out: 1, expiringSoon: 1, expired: 1 });
});
it('the week before: cancelled lines, statuses, first response, bed-days over a finished range', async () => {
  const { api } = await manager();
  const r = await api.staff.reports.operations(B);
  expect(r.appointments).toMatchObject({ scheduled: 14, cancelled: 2, total: 16, cancelRate: 0.125, byService: { kham: 11, spa: 3, noi_tru: 0 }, bySource: { phone: 9, walk_in: 3, web_request: 2 } });
  expect(r.requests).toMatchObject({ received: 17, byStatus: { pending: 2, contacting: 3, confirmed: 5, unreachable: 4, cancelled: 2, rejected: 1 }, avgFirstResponseMin: 321 });
  expect(r.requests.confirmRate).toBeCloseTo(5 / 17, 10);
  expect(r.inpatient).toMatchObject({ admitted: 4, discharged: 0, bedDays: 8.2, previousAdmitted: 0 });
  expect(r.inpatient.occupancyRate).toBeCloseTo(197.0833 / 2016, 4);
});
it('a single day, and the previous period of one range is the scheduled count of the one before', async () => {
  const { api } = await manager();
  const day = await api.staff.reports.operations({ from: '2026-10-19', to: '2026-10-19' });
  expect(day.appointments).toMatchObject({ scheduled: 7, byService: { kham: 5, spa: 2, noi_tru: 0 } });
  expect(day.appointments.daily).toHaveLength(1);
  expect(day.requests.received).toBe(3);
  expect((await api.staff.reports.operations(A)).appointments.previousScheduled).toBe((await api.staff.reports.operations(B)).appointments.scheduled);
});
it('the money block matches reports.revenue and the stock block matches stock.summary; nothing is written', async () => {
  const { api, db } = await manager();
  const rev = await api.staff.reports.revenue(A), prevRev = await api.staff.reports.revenue(B), sum = await api.staff.stock.summary();
  const rev0 = db.read().rev;
  const r = await api.staff.reports.operations(A);
  expect(r.revenue).toEqual({ collected: rev.collected, invoiced: rev.invoiced, outstanding: rev.outstanding, previousCollected: prevRev.collected });
  expect(r.stock).toEqual({ low: sum.low, out: sum.out, expiringSoon: sum.expiringSoon, expired: sum.expired });
  expect(db.read().rev).toBe(rev0);
});
it('a range wholly in the future: no occupancy, no bed-days, no appointments from the past', async () => {
  const { api } = await manager();
  const r = await api.staff.reports.operations({ from: '2027-01-01', to: '2027-01-07' });
  expect(r.inpatient).toMatchObject({ bedDays: 0, occupancyRate: null, admitted: 0 });
  expect(r.appointments).toMatchObject({ scheduled: 0, cancelRate: null });
  expect(r.requests).toMatchObject({ received: 0, confirmRate: null, avgFirstResponseMin: null });
});
it('refuses bad ranges on the right field and changes nothing', async () => {
  const { api } = await manager();
  await expect(api.staff.reports.operations({ from: '2026-02-30', to: '2026-10-19' })).rejects.toMatchObject({ fields: { from: RANGE_MSG.date } });
  await expect(api.staff.reports.operations({ from: '2026-10-20', to: '2026-10-19' })).rejects.toMatchObject({ fields: { to: RANGE_MSG.order } });
  await expect(api.staff.reports.operations({ from: '2024-01-01', to: '2025-01-01' })).rejects.toMatchObject({ fields: { to: RANGE_MSG.span } });
});
describe('permissions', () => {
  it.each(['bacsi_duc', 'bacsi_mai', 'spa_ngocanh', 'lan_nguyen'])('%s is refused', async (who) => {
    const { api } = makeTestApi(); await loginAs(api, who);
    await expect(api.staff.reports.operations(A)).rejects.toThrow(ForbiddenError);
  });
  it('a signed-out visitor is refused', async () => { await expect(makeTestApi().api.staff.reports.operations(A)).rejects.toThrow(ForbiddenError); });
  it('reports.operations alone shows the figures but not the money block; adding reports.revenue shows it', async () => {
    const { api, db } = makeTestApi();
    const grant = (caps: ('reports.operations' | 'reports.revenue')[]) => db.transact('t', (d) => { d.t.staff_users.find((u) => u.id === 'stf-duc')!.extra_capabilities = caps; });
    await loginAs(api, 'bacsi_duc');
    grant(['reports.operations']);
    expect((await api.staff.reports.operations(A)).revenue).toBeUndefined();
    grant(['reports.operations', 'reports.revenue']);
    expect((await api.staff.reports.operations(A)).revenue).toBeDefined();
    grant(['reports.revenue']);
    await expect(api.staff.reports.operations(A)).rejects.toThrow(ForbiddenError);
  });
});
```
(Nhập `RANGE_MSG` từ `../../../rules/calendar`, `ForbiddenError` từ `contracts/errors`.)

- [ ] **Step 2: Run to verify fail** — `npx vitest run src/data/mock/api/staff/reports.test.ts` → FAIL (`operations` không có).
- [ ] **Step 3: Implement** theo "Cách ghép". Thêm `operations` vào `StaffReportsApi` (`contracts/staff.ts`).
- [ ] **Step 4: Run to verify pass** — `npm test && npm run typecheck && npx eslint src/data` → PASS. Kiểm độ "cắn": tạm bỏ điều kiện `reports.revenue` (luôn trả `revenue`) → test quyền tiền phải đỏ; tạm đổi `previousPeriod` thành kỳ cùng kỳ → test `previous` đỏ; trả lại.
- [ ] **Step 5: Commit**
```bash
git add src/data
git commit -m "feat: staff.reports.operations (appointments, requests, inpatient, customers, stock, revenue summary)

Claude-Session: https://claude.ai/code/session_01WQRA4c5rpvrJd3fkJ3fRkU"
```

---

### Task 5: Tài liệu, kiểm tra toàn bộ, rà soát độc lập, gộp

**Files:** `PROGRESS.md`, `docs/thiet-ke/QUYET-DINH.md` (không cần R mới: R38 đã bao trùm; chỉ thêm một câu nếu cần), có thể `scripts/check-budgets.mjs`.

- [ ] **Step 1: Cập nhật tài liệu.** `PROGRESS.md`: mục nhánh dữ liệu "Đã xong" thêm **Phần 5 · giai đoạn 2 — Báo cáo vận hành** (hàm, quyền `reports.operations` chỉ Quản lý, khối `revenue` chỉ khi có `reports.revenue`, chốt: mỗi nhóm lịch cộng bằng `scheduled`, mẫu số 0 → `null`, bé mới không đếm vì không có ngày tạo, không thêm dữ liệu cũ); "Việc tiếp theo" chuyển sang giai đoạn 3 (Cài đặt A); "Thay đổi hợp đồng": `OperationsReport` và các kiểu `Ops*`, `StaffReportsApi.operations`, `APPOINTMENT_SOURCES`, `Cap` `reports.operations`; "Yêu cầu gửi nhánh kia": menu "Báo cáo" hiện khi `can('reports.operations')`; giao diện hiện `null` thành "—"; "so với kỳ trước" lấy từ các trường `previous*`; `revenue` có thể vắng; khoảng ngày chọn nhanh (7 ngày / 30 ngày / Tháng này) do giao diện tính; danh sách "Quyền của tôi" của Quản lý dài thêm 1 mục; dữ liệu mẫu thưa ngoài tuần này.
- [ ] **Step 2: Chạy toàn bộ** — `npm run verify` (nền, log vào scratchpad). Expected: exit 0; nếu chỉ 4 bài khu khách (×2) đỏ trong khung 00:00–03:00 giờ VN thì ghi nhận như đã nêu và chạy lại sau 03:00.
- [ ] **Step 3: Rà soát độc lập** bằng agent mới (đọc `git diff` so với nhánh tích hợp, spec, kế hoạch, Review Focus); sửa mọi lỗi quan trọng theo test-first, mỗi lỗi một commit; lỗi nhỏ ghi sổ.
- [ ] **Step 4: Commit, đẩy, gộp.**
```bash
git add PROGRESS.md docs
git commit -m "docs: operations report phase done — progress and contract changes

Claude-Session: https://claude.ai/code/session_01WQRA4c5rpvrJd3fkJ3fRkU"
git push -u origin claude/du-lieu
cd /home/user/tesst && git fetch origin && git merge --ff-only origin/claude/focused-pascal-rfxnnp
git merge --no-ff claude/du-lieu -m "Merge claude/du-lieu: operations report data layer

Claude-Session: https://claude.ai/code/session_01WQRA4c5rpvrJd3fkJ3fRkU"
git push origin claude/focused-pascal-rfxnnp
```
Nếu nhánh tích hợp trên máy chủ đã đi tiếp, gộp `origin/claude/focused-pascal-rfxnnp` vào `claude/du-lieu` trước, chạy lại test đơn vị và kiểm tra kiểu, rồi mới gộp (không `force-push`).

---

## Self-Review

- **Độ phủ spec §3.2:** khoảng ngày và kỳ trước (T1) · mọi nhóm lịch hẹn/yêu cầu/nội trú/khách (T2) · kho và doanh thu dùng lại hàm có sẵn (T3) · API, quyền, khối tiền có điều kiện, không ghi dữ liệu (T4) · tài liệu/verify/gộp (T5). "Bé mới" bỏ vì không có ngày tạo (đã ghi trong spec §2).
- **Khác spec (kế hoạch quyết, ghi để chủ dự án thấy):** khối `revenue` chỉ trả khi có thêm `reports.revenue`; các nhóm lịch cộng bằng `scheduled` (đã nêu ở spec §3.2); `avgFirstResponseMin` dùng **sự kiện đầu tiên của nhân viên**; `occupancyRate` dùng thời gian trôi qua tính theo giờ (không theo ngày nguyên) để ngày hôm nay đang dở không bị đánh thấp.
- **Nhất quán kiểu:** `OpsRange` dùng ở T1 (qua `{from,to}`), T2, T4; `OpsAppointments`… định nghĩa T2, dùng T2/T4; `summarizeStock(rows: StockRow[])` định nghĩa T3, dùng T4; `toRow` đã xuất ở `stock.ts` (giai đoạn Kho); `RANGE_MSG` định nghĩa T1, dùng T1/T4.
- **Số liệu mẫu trong test T4** lấy từ bộ lọc thô độc lập trên dữ liệu mẫu hiện có (tuần 19–25/10 và 12–18/10 với "bây giờ" = 19/10 09:00).
