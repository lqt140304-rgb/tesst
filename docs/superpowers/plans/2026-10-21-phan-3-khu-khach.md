# Phần 3 — Khu khách hàng — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the customer zone (`#/khach-hang/…`) to mockups 03/05 and add reschedule requests, the update bell, the pet's general condition and day picking on the inpatient page.

**Architecture:** Rewrite each customer page in place on the part-1 kit (`@/ui`: `PageHeader` with `crumbs`, `SectionCard`, `DetailList`, `PetAvatar`, `MasterDetail`, `useListState`, `Tabs`, `Dialog`, `preset`). Routes stay. Tasks 1–8 use only today's data contracts; Tasks 9–12 consume the data branch's §4 contracts and start with a contract check — until a contract is on the integration branch its flag in `src/features/data-ready.ts` stays `false` and the control is not rendered.

**Tech Stack:** React 19, TypeScript 6, react-router 8 (hash), motion 13, CSS Modules + `src/styles/tokens.css`, Vitest, Playwright + axe.

**Spec:** `docs/superpowers/specs/2026-10-21-phan-3-khu-khach-design.md` (approved 21/10/2026). Parent: `docs/superpowers/specs/2026-10-20-lam-lai-giao-dien-design.md`.

## Global Constraints

- Branch `claude/giao-dien`, worktree `/home/user/tesst/.worktrees/giao-dien`; touch only `src/ui`, `src/features`, `src/styles`, `src/assets`, `src/app`, `e2e/giao-dien-*.spec.ts` (small, recorded edits to older specs allowed); never `src/data` (requests go to `PROGRESS.md`).
- UI reads data only through `@/data/customer` (`customer.*`) and `@/data/hooks/useQuery`.
- Copy: Vietnamese; customer = "bạn"; never "quý khách"/"Quý khách", never "Hoàn thành" for appointments; appointment states only "Đã hẹn" / "Đã hủy" / "Đã qua"; request states as `REQUEST_STATUS_LABEL`.
- Customers never see clock times in diary or bell, drug names, doses, staff names, internal notes, cage codes (R7, R20).
- Video: never autoplay, always muted, no speaker control; "Video được lưu trong 60 ngày".
- Hotline "097 355 51 05" / `tel:+84973555105`; payment "Thanh toán tại quầy".
- Breakpoints: top-bar nav ≥ 993 px; `MasterDetail` side-by-side ≥ 1024 px (kit behaviour); 320 px phones never scroll sideways (`fitsDevice`).
- Motion (spec §3.9): pet rows 8 px / 60 ms stagger / max 5 / 280 ms; pet profile photo 300 ms, info 220 ms; tab underline 180 ms; detail from right 12 px 220 ms; invoice fade 180 ms; bell panel ≤ 180 ms; once per entry; reduced motion → instant (`preset(…, { reduced })`).
- Flags: `DATA_READY` gains `petWeight`, `petCondition`, `reschedule`, `updates`, `diaryDate` — all `false` until Tasks 9–12.
- Commits: small, English `feat:`/`fix:`/`docs:` titles, no model names, end with `Claude-Session: https://claude.ai/code/session_013xgtFbNtYrgX8b1A7NpkL4`.
- New e2e file: `e2e/giao-dien-khach.spec.ts` (Lan = `lan_nguyen`, linked, pets Miu (hospital, in stay `stay-NT-0041`) and Bông; Khoa = `minh_khoa`, unlinked, code `LS-7K2Q`).

## Review Focus

1. Unlinked account (`minh_khoa`) on every new block: overview invoice card shows the link reminder with `LS-7K2Q`, Nội trú/Hóa đơn nav stay locked, no invoice/stay data fetched into view — pinned in Task 2.
2. Deep link to an appointment-only row (phone-booked, no request) at `#/khach-hang/lich-hen/<id>` on desktop and phone → detail renders from the row; unknown id → "not found" page, not a crash — pinned in Task 5.
3. Phone back from a detail (appointments, invoices) returns to the same tab and scroll position — pinned in Task 5 and Task 7 via `useListState`.
4. 320 px with long names (pet "Na" plus breed chips, invoice codes) → no sideways scroll on every customer screen — pinned in Task 8 (loop over customer manifest routes).
5. Pet search with Vietnamese diacritics/case ("bong" finds "Bông", "MÈO" finds cats) and whitespace-only queries (= no filter) — pinned in Task 3 unit test.

---

### Task 1: Data-ready flags and the customer top bar

**Files:**
- Modify: `src/features/data-ready.ts`, `src/features/customer/shell/CustomerShell.tsx`, `src/features/customer/shell/Shell.module.css`
- Test: `e2e/giao-dien-khach.spec.ts` (create), `e2e/customer-a.spec.ts` (only if a selector depended on the sidebar; record it)

**Interfaces:**
- Produces: `DATA_READY = { timeSlot: true, rememberLogin: true, petWeight: false, petCondition: false, reschedule: false, updates: false, diaryDate: false } as const`; shell slot `<div data-bell-slot />` in the top bar where Task 10 mounts the bell; `useCustomerNav()` unchanged.

- [ ] **Step 1: Write the failing tests** in `e2e/giao-dien-khach.spec.ts`, `describe('customer shell')`:
  - `wide screens: one top bar with the five sections, the current one marked, no sidebar` — at 1440: `page.getByRole('navigation', { name: 'Khu khách hàng' })` contains links Tổng quan, Thú cưng, Lịch hẹn, Nội trú, Hóa đơn in that order; on `/khach-hang/thu-cung` link "Thú cưng" has `aria-current="page"`; `page.locator('aside')` count 0; the nav's bounding box `y < 120`.
  - `the account menu holds Tài khoản and Đăng xuất` — click button `/Tài khoản của/` → menu shows link "Tài khoản" and button "Đăng xuất"; Esc closes it and focus returns to the button.
  - `phones: bottom bar with five items, top bar with logo and account @narrow` — `[data-bottom-bar]` visible with 5 links; top nav not visible; `fitsDevice(page)` true.
  - `unlinked: Nội trú and Hóa đơn are marked locked` — as `minh_khoa`, link name `/Hóa đơn \(mở sau khi liên kết hồ sơ\)/` attached.
- [ ] **Step 2: Run** `npm run build && npx playwright test e2e/giao-dien-khach.spec.ts -g "customer shell"` — Expected: the first test FAILS (sidebar `aside` still present).
- [ ] **Step 3: Implement.** Replace the sidebar with a top bar (`header`): logo + "Lê Sơn" → `paths.kh.home`; `nav aria-label="Khu khách hàng"` with the five items (gạch chân via `m.span layoutId="kh-underline"`, 180 ms, like `PublicHeader`); `data-bell-slot` empty span; account button with initial + `shortName` opening the existing menu (keep its items, Esc/outside-click, return focus). Below 993 px the nav hides and the existing bottom bar stays. Remove the sidebar help block (hotline stays in the menu). Add the five new flags to `DATA_READY`.
- [ ] **Step 4: Run** the shell tests + `npx playwright test e2e/customer-a.spec.ts e2e/customer-b.spec.ts e2e/a11y.spec.ts` — Expected: PASS (fix only selectors that named the sidebar; note each in the ledger).
- [ ] **Step 5: Commit** `feat(customer): top-bar shell and data-ready flags for part 3`.

### Task 2: Tổng quan

**Files:**
- Modify: `src/features/customer/overview/OverviewPage.tsx`, create `src/features/customer/overview/Overview.module.css`
- Test: `e2e/giao-dien-khach.spec.ts`; update `e2e/customer-a.spec.ts` first test if its texts move (record)

**Interfaces:**
- Consumes: `customer.overview()`, `customer.invoices.list()` (only when `o.linked`), `greeting(o)` (keep exported).
- Produces: section ids/attrs `data-card="pet-today"` (one per active stay), `data-card="next-appointment"`, `data-card="pets"`, `data-card="invoices"`.

- [ ] **Step 1: Write the failing tests** (`describe('overview')`):
  - `greeting band, then the four blocks` — as Lan: h1 "Chào chị Lan." visible; band has `DemoTag` "Ảnh minh họa"; `[data-card="pet-today"]` contains "Bé Miu hôm nay" and link "Xem nhật ký" → `href` contains `/khach-hang/noi-tru/`; `[data-card="next-appointment"]` contains "Bông" and pill "Đã hẹn" and link "Đặt lịch mới"; `[data-card="pets"]` has ≤ 3 pet links + link "Thêm thú cưng"; `[data-card="invoices"]` has ≤ 3 rows and the text "Thanh toán tại quầy".
  - `no stay → no "hôm nay" card` — as `minh_khoa`: `[data-card="pet-today"]` count 0.
  - `unlinked: invoices card asks to link, shows the code` (Review Focus 1) — as `minh_khoa`: `[data-card="invoices"]` contains "LS-7K2Q" and no `HD-` text.
  - `no appointment text says "Hoàn thành"` — `main` innerText not matching `/Hoàn thành|[Qq]uý khách/`.
- [ ] **Step 2: Run** — Expected: FAIL (no `pet-today` card).
- [ ] **Step 3: Implement** per spec §3.2: band (Lora h1 `greeting(o)`, sub-line, photo `petPhoto('cho-vang','card')` + `DemoTag`, thin orbit SVG); 2-column grid ≥ 960 px of `SectionCard`s with `action` links; next-appointment falls back to the first processing request with its request pill; one-time cards (`Welcome`, linked) stay above the grid; `UnlinkedBanner` stays for unlinked. Entry motion `preset('enterList', { reduced, index })`.
- [ ] **Step 4: Run** overview tests + `e2e/customer-a.spec.ts` — Expected: PASS.
- [ ] **Step 5: Commit** `feat(customer): overview to mockup 03`.

### Task 3: Thú cưng (list + search)

**Files:**
- Create: `src/features/customer/pets/search.ts`, `src/features/customer/pets/search.test.ts`, `src/features/customer/pets/Pets.module.css`
- Modify: `src/features/customer/pets/PetsPage.tsx`
- Test: `e2e/giao-dien-khach.spec.ts`; `e2e/customer-a.spec.ts` "adding pet Na" (button label becomes "Thêm thú cưng"; record)

**Interfaces:**
- Produces: `foldVi(s: string): string` (lowercase, strip diacritics incl. đ→d, collapse spaces, trim); `matchPet(p: Pick<CustomerPetCard, 'name' | 'species' | 'breed'>, query: string): boolean` (every whitespace-separated token of `foldVi(query)` is found in `foldVi(name + ' ' + SPECIES_LABEL[species] + ' ' + (breed ?? ''))`; empty/whitespace query → true).

- [ ] **Step 1: Write failing unit tests** `search.test.ts`: `matchPet(bong,'bong')` true; `matchPet(miu,'MÈO')` true; `matchPet(bong,'poodle cho')` true; `matchPet(miu,'chó')` false; `matchPet(miu,'   ')` true; `foldVi('Đức  Anh ')` === `'duc anh'`. (Review Focus 5)
- [ ] **Step 2: Run** `npx vitest run src/features/customer/pets/search.test.ts` — Expected: FAIL (module missing).
- [ ] **Step 3: Implement** `search.ts` (`normalize('NFD')` + strip `\p{M}`, map đ/Đ).
- [ ] **Step 4: Write failing e2e** (`describe('pets')`): breadcrumb "Trang chủ › Thú cưng" (`nav[aria-label="Đường dẫn"]` per `PageHeader`); search box label "Tìm thú cưng" — typing "bong" leaves one row "Bông"; typing "xyz" shows "Không có bé nào khớp với “xyz”." and button "Xóa tìm kiếm" restores both; each row has link "Xem hồ sơ" to `/khach-hang/thu-cung/pet-…`; dashed card has button "Thêm thú cưng".
- [ ] **Step 5: Implement** the page per spec §3.3 (rows: `PetAvatar` 104 px, Lora name, "giống • tuổi", chip row with icons, "Xem hồ sơ" `ButtonLink` secondary; header action and dashed card both open `PetForm`; query kept with `useListState('kh-pets', { q: '' })`; rows `preset('enterList', { index: min(i, 4) })`).
- [ ] **Step 6: Run** unit + e2e pets + `e2e/customer-a.spec.ts` — Expected: PASS.
- [ ] **Step 7: Commit** `feat(customer): pets list with search (mockup 05)`.

### Task 4: Hồ sơ bé + "Đặt lịch cho bé"

**Files:**
- Modify: `src/features/customer/pets/PetPage.tsx`, `src/features/customer/BookPage.tsx`, `src/features/booking/BookingForm.tsx`
- Test: `e2e/giao-dien-khach.spec.ts`; `e2e/customer-a.spec.ts` "hospital pet" (h1 becomes "Hồ sơ của Miu"; record)

**Interfaces:**
- Consumes: `customer.pets.get(id)` → `{ pet, bookings }`.
- Produces: `BookingForm` prop `initialPetId?: string` (selects that saved pet once the list loads; ignored when absent from the list); `BookPage` reads `?thu-cung=<petId>`; `paths.kh.book + '?thu-cung=' + id` used by the profile button. Profile blocks `data-block="info"`, `data-block="past"`, `data-block="condition"` (Task 12 fills condition).

- [ ] **Step 1: Write failing e2e** (`describe('pet profile')`):
  - `Miu: title, info card, past appointments, read-only note` — h1 "Hồ sơ của Miu"; crumbs "Trang chủ › Thú cưng › Hồ sơ của Miu"; `[data-block="info"]` shows labels Tên, Loài, Giống, Giới tính, Năm sinh; no button "Chỉnh sửa"; text "Thông tin do Lê Sơn cập nhật" with a `tel:+84973555105` link; `[data-block="past"]` rows' status cells only match `/^(Đã qua|Đã hủy)$/`, none "Hoàn thành".
  - `a web pet can be edited` — as `minh_khoa` open Gạo (web pet) → button "Chỉnh sửa" opens dialog "Sửa thông tin bé Gạo".
  - `"Đặt lịch cho Miu" opens the booking form with Miu chosen` — click → URL contains `/khach-hang/dat-lich?thu-cung=`; `#form-dat-lich` radio `/Miu/` has `aria-checked="true"`.
  - `condition block hidden until its data lands` — `[data-block="condition"]` count 0.
- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement** spec §3.4 (photo `PetAvatar` 200 px fades 300 ms, info `DetailList` 220 ms; Năm sinh "2021 (3 tuổi)" from `birthYear`/`ageYears`, missing → "—"; web pet note row "Điều Lê Sơn nên biết"; past table = `bookings` with `group === 'past'` newest first, max 5, columns Ngày · Dịch vụ · Trạng thái using `rowPill`; "Xem tất cả" → `paths.kh.appts + '?tab=lich-su'`; empty "Bé chưa có lịch hẹn nào đã qua."). `BookingForm`: on pets loaded, if `initialPetId` matches a saved pet set `values.pet` to its key once. `BookPage`: pass `initialPetId={params.get('thu-cung') ?? undefined}`.
- [ ] **Step 4: Run** pet-profile tests + `e2e/customer-a.spec.ts` + `e2e/booking.spec.ts` — Expected: PASS.
- [ ] **Step 5: Commit** `feat(customer): pet profile to mockup 05, book for this pet`.

### Task 5: Lịch hẹn — tabs + list/detail

**Files:**
- Create: `src/features/customer/appointments/BookingDetail.tsx`, `src/features/customer/appointments/Appointments.module.css`
- Modify: `src/features/customer/appointments/AppointmentsPage.tsx`, `RequestPage.tsx` (becomes the phone/deep-link wrapper around `BookingDetail`), `BookingRow.tsx`
- Test: `e2e/giao-dien-khach.spec.ts`; `e2e/customer-a.spec.ts` tab name "Đã qua" → "Lịch sử" (record)

**Interfaces:**
- Consumes: `customer.appointments.list()`, `customer.appointments.getRequest(id)` (request rows only), `RowActions`, `rowPill`, `explain`.
- Produces: `BookingDetail({ row }: { row: CustomerBookingRow })` — renders facts, map link, timeline (fetched for `kind === 'request'`), actions; exposes an actions slot `data-actions` where Task 9 adds "Yêu cầu đổi lịch". Tabs keys `'sap-toi' | 'dang-xu-ly' | 'lich-su'`, `?tab=` honoured; `useListState('kh-appts', { tab: 'sap-toi', id: '' })`.

- [ ] **Step 1: Write failing e2e** (`describe('appointments')`):
  - `three tabs; the first row's detail opens beside the list on wide screens` — tabs named `/Sắp tới/`, `/Đang xử lý/`, `/Lịch sử/`; at 1440 the detail region (`[data-detail]`) shows "Bông" and "Đã hẹn" next to the list (both visible); selected row has `aria-current="true"`.
  - `?tab=lich-su opens history` — rows only "Đã qua"/"Đã hủy".
  - `phones: tapping a row opens its detail, back returns to the same tab @narrow` (Review Focus 3) — switch to "Đang xử lý", tap first row, h2 visible, press the back button (`backLabel` "Danh sách lịch hẹn"), tab "Đang xử lý" still selected.
  - `deep link to an appointment-only row and to an unknown id` (Review Focus 2) — as `ngoc_tran`, open `/khach-hang/lich-hen/<id of the phone-booked appointment>` (read it from the list's first row link) → "Đặt qua điện thoại" visible; `/khach-hang/lich-hen/khong-co` → `PageProblem`/not-found text visible, no error overlay.
- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement** spec §3.5 with `MasterDetail` (list rows: `PetAvatar` · pet · service · date · pill); `RequestPage` renders `BookingDetail` for the row found by id in `appointments.list()` (any group) and `PageProblem` "Không tìm thấy lịch hẹn này." when absent.
- [ ] **Step 4: Run** appointment tests + `e2e/customer-a.spec.ts` + `e2e/journeys/booking.spec.ts` — Expected: PASS.
- [ ] **Step 5: Commit** `feat(customer): appointments tabs with list and detail`.

### Task 6: Nội trú — "Hôm nay của bé" (days from the data we have)

**Files:**
- Create: `src/features/customer/inpatient/StayToday.tsx`, `src/features/customer/inpatient/days.ts`, `src/features/customer/inpatient/days.test.ts`, `src/features/customer/inpatient/Today.module.css`
- Modify: `src/features/customer/inpatient/StaysPage.tsx`, `StayPage.tsx`
- Test: `e2e/giao-dien-khach.spec.ts`; rewrite `e2e/customer-b.spec.ts` first two tests to the new page (keep their assertions: no clock times, muted, "Không có âm thanh", days left; record)

**Interfaces:**
- Consumes: `customer.stays.list()`, `customer.stays.get(id)`, `useMediaUrls` (data hook), `VideoPlayer`.
- Produces: `dayKeys(diary: CustomerDiaryEntry[]): string[]` (distinct `dayLabel` in data order, newest last) and `stepDay(keys: string[], current: string, dir: -1 | 1): string` (clamped). Task 11 swaps the key to `date` and adds the calendar input. Component `StayToday({ stayId })` with `data-today`, pet select labelled "Chọn thú cưng", day control labelled "Chọn ngày" with buttons "Ngày trước" / "Ngày sau".

- [ ] **Step 1: Write failing unit tests** `days.test.ts`: `dayKeys` dedupes and keeps order; `stepDay(['A','B','C'],'B',1)` → `'C'`; `stepDay(['A'],'A',-1)` → `'A'`.
- [ ] **Step 2: Run** — Expected: FAIL. **Step 3:** implement `days.ts`. **Step 4:** run → PASS.
- [ ] **Step 5: Write failing e2e** (`describe('inpatient today')`): `/khach-hang/noi-tru` as Lan → h1 "Hôm nay của Miu"; "Chọn thú cưng" shows Miu; "Ngày trước" moves the diary heading; diary `[data-diary]` innerText has no `/\b\d{1,2}:\d{2}\b/`; entries labelled Sáng/Chiều/Tối; `video` elements have `muted` and no `autoplay`; no button named `/âm thanh|loa|Bật tiếng/`; text "Video được lưu trong 60 ngày"; card "Luôn đồng hành cùng bé" with link "Liên hệ bệnh viện" `href="tel:+84973555105"`; link "Các lần nội trú trước". As `minh_khoa` (locked) unchanged behaviour (lock page).
- [ ] **Step 6: Implement** spec §3.6 (title band with `PetAvatar`/`petPhoto` banner; default day = last key; empty day text "Lê Sơn chưa cập nhật nhật ký ngày này."; no current stay → "Hiện không có bé nào đang nội trú." + past list). `/noi-tru` shows the newest current stay; `/noi-tru/:stayId` shows that stay.
- [ ] **Step 7: Run** inpatient tests + `e2e/customer-b.spec.ts` + `e2e/journeys/video.spec.ts` — Expected: PASS.
- [ ] **Step 8: Commit** `feat(customer): inpatient "Hôm nay của bé" (mockup 03)`.

### Task 7: Hóa đơn — list/detail + "Tải hóa đơn"

**Files:**
- Create: `src/features/customer/invoices/InvoiceDetail.tsx`, `src/features/customer/invoices/Invoices.module.css`
- Modify: `InvoicesPage.tsx`, `InvoicePage.tsx` (phone/deep-link wrapper)
- Test: `e2e/giao-dien-khach.spec.ts`; `e2e/customer-b.spec.ts` invoice tests if selectors move (record)

**Interfaces:**
- Consumes: `customer.invoices.list()`, `customer.invoices.get(id)`.
- Produces: `InvoiceDetail({ id })` with `data-invoice-total` around the totals; link "Tải hóa đơn" → `paths.kh.invoicePrint(id)`.

- [ ] **Step 1: Write failing e2e** (`describe('invoices')`): at 1440 the first invoice's detail is beside the list; choosing another row changes the code in the detail while `[data-invoice-total]` keeps its `y` within 2 px; "Tải hóa đơn" link `href` ends `/ban-in`; text "Thanh toán tại quầy"; phones: row → detail → back keeps scroll (Review Focus 3).
- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement** spec §3.7 with `MasterDetail`; detail fades 180 ms (`preset('fadeSwap')`); `InvoicePage` renders `InvoiceDetail` for `:id`; not found → existing `PageProblem`.
- [ ] **Step 4: Run** invoice tests + `e2e/customer-b.spec.ts` + `e2e/journeys/billing.spec.ts` — Expected: PASS.
- [ ] **Step 5: Commit** `feat(customer): invoices list and detail, download = print`.

### Task 8: Tài khoản, Đặt lịch (khách), whole-zone checks

**Files:**
- Modify: `src/features/customer/account/AccountPage.tsx`, `src/features/customer/BookPage.tsx`, `src/features/customer/Customer.module.css` (drop rules no page uses any more)
- Test: `e2e/giao-dien-khach.spec.ts`

- [ ] **Step 1: Write failing e2e** (`describe('whole zone')`): for every `SCREENS` entry with `zone === 'customer'`: `fitsDevice(page)` at the narrow project (Review Focus 4, add pet "Na" first for the pets route); main text never matches `/[Qq]uý khách|Hoàn thành/`; `#/khach-hang/tai-khoan` uses `SectionCard` headings "Thông tin tài khoản", "Đổi mật khẩu", "Liên kết hồ sơ".
- [ ] **Step 2: Run** — Expected: FAIL on the account headings.
- [ ] **Step 3: Implement** account sections as flat `SectionCard`s; `BookPage` steps aside restyled to the part-2 steps look; remove dead CSS.
- [ ] **Step 4: Run** `npx playwright test e2e/giao-dien-khach.spec.ts e2e/customer-a.spec.ts e2e/customer-b.spec.ts e2e/a11y.spec.ts` — Expected: PASS.
- [ ] **Step 5: Commit** `feat(customer): account and booking pages in the new frame; zone-wide checks`.

### Tasks 9–12 (after the data branch delivers §4)

Each starts with: `git fetch origin && git merge origin/claude/focused-pascal-rfxnnp`; read the data branch's "Thay đổi hợp đồng" entry and the real names in `src/data/contracts/customer.ts`; ledger a `Ruling:` for every name that differs from spec §4; run `npm test` (green) before writing UI. If the contract is absent, skip the task and leave its flag `false`.

### Task 9: Yêu cầu đổi lịch (flag `reschedule`)

**Files:** create `src/features/customer/appointments/RescheduleDialog.tsx`; modify `BookingDetail.tsx`, `BookingRow.tsx`, `data-ready.ts`; staff tag in `src/features/staff/requests/*` (list badge "Đổi lịch" + current appointment line only); test `e2e/giao-dien-khach.spec.ts`.

**Interfaces:** consumes `customer.appointments.requestReschedule(id, { desired_date, preferred_slot?, reason? })`, `CustomerBookingRow.rescheduleRequest?` and the staff request field the data branch names.

- [ ] **Step 1: Failing e2e** `reschedule: request → pending tag → staff reschedules → tag gone`: Lan opens Bông's appointment → "Yêu cầu đổi lịch" → dialog fields "Ngày mong muốn" (min = tomorrow), "Khung giờ", "Lý do" (counter /200) → "Gửi yêu cầu" → toast "Lê Sơn sẽ gọi cho bạn để đổi lịch." → row shows "Đang chờ đổi lịch" and "Bạn muốn đổi sang …"; button gone. Staff `bacsi_duc` sees request tagged "Đổi lịch"; reschedules the appointment → Lan's tag gone and the new time shows. Validation: empty date → field error, dialog keeps "Lý do" text.
- [ ] **Step 2–4:** run (FAIL) → implement (spec §3.5; `Dialog`, `Field`, `Select` with `TIME_SLOTS`, `Textarea` max 200; set `DATA_READY.reschedule = true`) → run (PASS) + `e2e/staff-a.spec.ts`.
- [ ] **Step 5: Commit** `feat(customer): reschedule requests`.

### Task 10: Chuông cập nhật (flag `updates`)

**Files:** create `src/features/customer/shell/UpdatesBell.tsx`; modify `CustomerShell.tsx`, `data-ready.ts`; test `e2e/giao-dien-khach.spec.ts`.

**Interfaces:** consumes `customer.updates.list()`, `customer.updates.markAllSeen()`.

- [ ] **Step 1: Failing e2e** `bell: dot, list, links, seen`: as Lan the button "Cập nhật mới" has a dot (`[data-unseen]`) and accessible name containing the count; open → ≤ 10 links, each to a customer route; panel innerText has no `/\b\d{1,2}:\d{2}\b/` and no staff name from `STAFF_NAMES`; Esc closes, focus back on the bell; reload → no dot. Empty list text "Chưa có cập nhật mới.".
- [ ] **Step 2–4:** run (FAIL) → implement (popover in `data-bell-slot`, opens ≤ 180 ms; calls `markAllSeen` on open; refetch on focus) → run (PASS).
- [ ] **Step 5: Commit** `feat(customer): update bell`.

### Task 11: Chọn ngày theo lịch (flag `diaryDate`)

**Files:** modify `days.ts`(+test), `StayToday.tsx`, `data-ready.ts`; test `e2e/giao-dien-khach.spec.ts`.

**Interfaces:** consumes `CustomerDiaryEntry.date`, `CustomerVideo.date` (`YYYY-MM-DD`). Produces `dayRange(admittedAt: string, end: string): string[]` (inclusive, VN dates) and `?ngay=YYYY-MM-DD`.

- [ ] **Step 1: Failing unit tests** `dayRange('2026-10-18T09:00:00+07:00','2026-10-20')` → `['2026-10-18','2026-10-19','2026-10-20']`; a `?ngay=` outside the range clamps to the nearest end.
- [ ] **Step 2: Failing e2e** `pick a day: input, arrows, URL keeps it`: "Chọn ngày" input `min`/`max` = stay range; choose the first day → URL has `?ngay=`; reload keeps it; a day without entries shows "Lê Sơn chưa cập nhật nhật ký ngày này."; videos shown are only that day's.
- [ ] **Step 3–4:** implement (date input + ‹ ›; filter diary/videos by `date`) → run (PASS).
- [ ] **Step 5: Commit** `feat(customer): pick any day of the stay`.

### Task 12: Cân nặng + Tình trạng chung (flags `petWeight`, `petCondition`)

**Files:** modify `PetPage.tsx`, `data-ready.ts`; test `e2e/giao-dien-khach.spec.ts`.

**Interfaces:** consumes `CustomerPetCard.weightKg?`, `pets.get(id).condition`.

- [ ] **Step 1: Failing e2e** `weight and condition`: Miu's info shows "Cân nặng" formatted `/^\d+(,\d)? kg$/`; `[data-block="condition"]` lists only labels among Ăn uống, Nghỉ ngơi, Tinh thần, Vận động, Cân nặng, each with a date like `/\d{1,2}\/\d{1,2}/` (weight row excepted) and no clock time; a pet without diary or weight (Khoa's Gạo) has no condition block.
- [ ] **Step 2–4:** run (FAIL) → implement (icons per category; weight `toLocaleString('vi-VN')`) → run (PASS).
- [ ] **Step 5: Commit** `feat(customer): pet weight and general condition`.

### Task 13: Finish

- [ ] **Step 1:** Add R35 to `docs/thiet-ke/QUYET-DINH.md` (spec §6); update the giao-dien section of `PROGRESS.md` and README status row; mark any flag still `false` and its waiting data in PROGRESS.
- [ ] **Step 2:** `npm run shots` — compare `customer__tong-quan`, `customer__noi-tru-miu`, `customer__thu-cung`, `customer__thu-cung-miu` at 1440 and 390 with mockups 03/05; fix visible gaps (each fix test-first when it changes behaviour).
- [ ] **Step 3:** `npm run verify` → exit 0.
- [ ] **Step 4:** Final whole-branch review by a fresh reviewer; fix Critical/Important RED→GREEN; re-verify.
- [ ] **Step 5:** Merge into `claude/focused-pascal-rfxnnp` (`--no-ff`), verify there, push; republish the Artifact; `node scripts/artifact-files.mjs --commit`.
