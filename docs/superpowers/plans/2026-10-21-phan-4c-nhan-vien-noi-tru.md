# Phần 4C — Khu nhân viên: Nội trú đầy đủ (màn hình) — Kế hoạch thực hiện

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Làm trọn vòng nội trú trên giao diện nhân viên: bảng chuồng mới, trang một bé (thẻ thông tin, dải tiến trình, việc nên làm, tab Lịch sử), hộp thoại Nhập viện 3 bước, Chuyển chuồng, Xuất viện, Tải video lên 3 bước.

**Architecture:** Chỉ viết lớp giao diện trong `src/features/staff/inpatient/`; mọi dữ liệu qua `staff.inpatient.*` (hợp đồng đã có, **không đổi**). Logic có điều kiện (bước hiện tại, việc nên làm, bước có ô lỗi, tóm tắt tiền) tách thành hàm thuần có test đơn vị; hộp thoại và trang chỉ ghép. Cùng họ với 4A/4B: thẻ chung, `PageHeader` có đường dẫn, `Dialog`, `Field`, `ChipGroup`.

**Tech Stack:** React 19, TypeScript, react-router (hash), motion (`m`), CSS Modules + tokens, Vitest, Playwright. Không thêm thư viện.

**Spec:** `docs/superpowers/specs/2026-10-21-phan-4c-nhan-vien-noi-tru-design.md` (đọc kèm `docs/superpowers/specs/2026-10-20-noi-tru-day-du-design.md` §3 cho quy tắc dữ liệu).

## Global Constraints

- Mọi chữ hiển thị bằng tiếng Việt; gọi bé là "bé" + tên; không "quý khách", không "lễ tân"; không dùng "lượt nội trú" ở chữ hiển thị (dùng "bé đang nội trú").
- Khách không thấy mã chuồng, tên nhân viên, ghi chú nội bộ, y lệnh (R7, R20); nhãn "Chỉ nhân viên" cạnh lý do nhập viện và ghi chú nội bộ.
- Quyền: `inpatient.view/admit/share/diary_write/clinical`; Spa có admit + share, không clinical. Kiểm tra ở API **và** ẩn nút ở giao diện (`useSession().can`).
- Video: không âm thanh, tối đa **15 giây** và **20 MB**, tự xóa sau 60 ngày; câu lỗi lấy từ `VIDEO_MSG`/`videoFileProblem` ở `src/data/rules/video-upload.ts`, không tự đặt.
- Tiền ngày: `billableDays`, `formatDaysVi` ở `src/data/rules/stay-billing.ts`; không viết lại quy tắc.
- Ghi dữ liệu có phiên bản (`transfer`, `discharge`) gửi **phiên bản lúc mở hộp thoại**; `ConflictError` → toast lỗi `saveError(e)`, đóng hộp thoại (dữ liệu tự tải lại).
- Số, giờ, tiền, mã dùng class `.num`; chuyển chuyển động chạy một lần, 150–450 ms, dịch 8–12 px; tôn trọng `prefers-reduced-motion`.
- Thẻ bo `--r-card` (12 px), nút/ô `--r-control` (6 px); màu chỉ qua token. Điện thoại 320 px không cuộn ngang; tương phản ≥ 4,5:1.
- Không đổi `src/data/**`. Cần đổi hợp đồng → dừng, ghi vào `PROGRESS.md` mục "Yêu cầu gửi nhánh kia".
- Giữ `[data-cage]` trên mọi ô chuồng và tiêu đề khu là `<h2>` (test cũ dựa vào).
- Commit tiêu đề tiếng Anh `feat:`/`test:`/`docs:`, không ghi tên model. Viết test trước.

## Review Focus

1. Hai tab nhập viện cùng một chuồng: tab sau nhận "Chuồng này đang có bé ở." → quay về bước 2, danh sách chuồng tải lại, dữ liệu đã nhập giữ nguyên (Task 2).
2. Đổi thời điểm xuất viện sang sát lúc nhập viện (vài phút) hoặc gõ giờ không hợp lệ: tóm tắt không hiện `NaN`/số âm, lỗi hiện tại ô, nút vẫn bấm được và lỗi do API trả (Task 6).
3. Hộp thoại xuất viện/chuyển chuồng mở trên bé vừa bị tab khác xuất viện: báo xung đột, không ghi đè (Task 5, 6).
4. Tệp video 0 byte, tên lạ, `type` rỗng, hoặc trình duyệt không đọc được thời lượng: báo đúng câu hoặc nhận với "—", không treo ở bước 1 (Task 7).
5. Spa (không `inpatient.clinical`): mọi màn không lộ tên thuốc/y lệnh — kể cả tab Lịch sử và chú thích tóm tắt (Task 4, 8).

---

## File structure

`src/features/staff/inpatient/` (mới → ghi "mới"):
- `stayStep.ts` (mới) · `chores.ts` (mới) · `groupByDay.ts` (mới) · `admitSteps.ts` (mới) · `stayMoney.ts` (mới) — hàm thuần + `*.test.ts` cạnh file.
- `CagePicker.tsx` (mới, dùng chung Nhập viện/Chuyển chuồng) · `AdmitDialog.tsx` (mới) · `TransferDialog.tsx` (mới) · `DischargeDialog.tsx` (mới) · `VideoUploadDialog.tsx` (mới) · `videoProbe.ts` (mới: đọc thời lượng).
- `StayInfoCard.tsx` (mới) · `StayProgress.tsx` (mới) · `NextChores.tsx` (mới) · `HistoryTab.tsx` (mới).
- Viết lại: `BoardPage.tsx`, `StayPage.tsx`. Sửa kiểu/phát video: `DiaryTab.tsx`, `VideosTab.tsx`, `InternalTab.tsx`. `Inpatient.module.css` mở rộng.
- Test: `e2e/giao-dien-nhan-vien-c.spec.ts` (mới). Sửa nhỏ `e2e/staff-b.spec.ts`, `e2e/journeys/video.spec.ts` nếu nhãn đổi (ghi vào sổ).

Dữ liệu mẫu dùng trong test: bé nội trú Miu (M2, `stay-NT-0041`), Kem (C4, `stay-NT-0044`), Mochi (C1, `stay-NT-0039`), Lu (C3, `stay-NT-0040`), Gạo (M4); chuồng trống C2, C5, C6, M1, M3, R1, R2; bé chưa nội trú: **Bông** (chó 5,5 kg, chủ lan_nguyen), **Tôm** (chó, chưa có cân nặng), **Mập** (mèo, có lịch hẹn hôm nay).

Chạy e2e cần `npm run build` trước. Mẫu helper: `openStaff(page, route, as)`, `staffMain` (xem `e2e/helpers.ts`); toast: `page.getByRole('status').filter({ hasText })`. Mỗi task e2e chạy `--project=desktop-1440 --project=phone-390 --project=phone-320`.

---

### Task 1: Hàm thuần — bước, việc nên làm, gom ngày, nhập viện, tiền

**Files:**
- Create: `stayStep.ts`, `chores.ts`, `groupByDay.ts`, `admitSteps.ts`, `stayMoney.ts` và `*.test.ts` tương ứng, tất cả trong `src/features/staff/inpatient/`.

**Interfaces:**
- Produces (dùng ở Task 2–7):
  - `stayStep.ts`: `type StayStep = 'caring' | 'ready' | 'discharged'`; `STAY_STEP_LABELS = ['Nhập viện', 'Đang chăm sóc', 'Sẵn sàng về', 'Đã xuất viện'] as const`; `currentStayStep(v: Pick<StaffStayView, 'discharged_at' | 'expected_discharge_at' | 'diary'>, now: Date): StayStep`; `stepIndex(s: StayStep): 1 | 2 | 3` (caring=1, ready=2, discharged=3; chỉ số vào `STAY_STEP_LABELS`).
  - `chores.ts`: `type Chore = { key: 'diary' | 'videos' | 'invoice'; label: string; tab: 'diary' | 'videos' | 'invoice' }`; `stayChores(v: Pick<StaffStayView, 'diary' | 'videos' | 'billing' | 'discharged_at'>, can: (c: Cap | Cap[]) => boolean, now: Date): Chore[]`; `dischargeReminders(v: same, can): string[]`.
  - `groupByDay.ts`: `groupByDay<T extends { at: string }>(items: T[], now: Date): { day: string; label: string; items: T[] }[]` (`day` = ngày VN `yyyy-mm-dd`, giữ thứ tự đầu vào = mới nhất trước).
  - `admitSteps.ts`: `type AdmitStep = 1 | 2 | 3`; `type AdmitDraft = { pet?: AdmitPetOption; appointment?: AdmitOptions['today'][number]; cageId?: string; doctorId?: string; reason: string; status: InternalStatus; expected: string; invoice: boolean; dayItemId?: string }`; `canAdvance(step: AdmitStep, d: AdmitDraft): boolean`; `stepOfField(field: string): AdmitStep`; `admitSummary(d: AdmitDraft, o: Pick<AdmitOptions, 'cages' | 'doctors' | 'dayItems'>): string`; `dayItemNote(d: AdmitDraft): string | undefined`; `orderCages(cages: AdmitOptions['cages'], species: Species): { zone: string; fit: boolean; cages: AdmitOptions['cages'] }[]`.
  - `stayMoney.ts`: `infoMoneyLine(billing: StayBilling | undefined, admittedAt: string, until: string | Date, discharged: boolean): string`; `dischargeMoneyLine(billing: StayBilling | undefined, admittedAt: string, at: string | Date): { text: string; invalid: boolean }`.

- [ ] **Step 1: Write the failing unit tests** (một file test cho mỗi module, mỗi `it` một hành vi; dùng `now` cố định `new Date('2026-10-21T05:00:00Z')`):
  - `stayStep`: có `discharged_at` → `discharged`; nhật ký đã chia sẻ gần nhất có `general_status: 'ready_home'` → `ready` (bản nháp hoặc đã thu hồi không tính; nhật ký chia sẻ cũ hơn bị chia sẻ mới hơn với trạng thái khác ghi đè → `caring`); `expected_discharge_at` là hôm nay (ngày VN) hoặc đã qua → `ready`; ngày mai → `caring`; `stepIndex`: 1/2/3.
  - `chores`: lượt xuất viện → `[]`; Spa (có `inpatient.share`) chưa có nhật ký chia sẻ hôm nay → có `diary` ("Chưa gửi nhật ký hôm nay"); không có quyền share → không có; `videos` đếm `share_status === 'draft'` và `!deleted` ("2 video chưa chia sẻ", số ít vẫn "1 video chưa chia sẻ"); `invoice` chỉ khi `billing.status === 'draft'` và `can(['invoices.create','payments.record'])` ("Hóa đơn chưa phát hành"); `dischargeReminders`: "Còn 2 nhật ký nháp chưa chia sẻ" · "Còn 1 video nháp" · "Hóa đơn chưa phát hành", rỗng khi không có.
  - `groupByDay`: hai mục cùng ngày VN gom một nhóm, thứ tự giữ nguyên; mục 20:00Z (03:00 ngày sau giờ VN) nằm ngày VN kế tiếp; nhãn "Hôm nay"/"Hôm qua" qua `relativeDayVi`, ngày xa thì `formatDayVi(first.at)`; rỗng → `[]`.
  - `admitSteps`: `canAdvance(1)` cần `pet` và `!pet.inpatient`; `canAdvance(2)` cần `cageId` và `reason.trim()`; `canAdvance(3)` luôn true; `stepOfField`: `pet_id`→1; `cage_id`, `reason_internal`, `expected_discharge_at`, `doctor_id`, `initial_status`→2; `day_price_item_id`, `invoice`→3; lạ → 3; `admitSummary`: "Kem · chuồng C4 · Mai · hóa đơn nháp có Nội trú mèo" (không tick hóa đơn → "… · không tạo hóa đơn"; tick nhưng không chọn dòng ngày → "… · hóa đơn nháp, chưa ghi tiền nội trú"); `dayItemNote`: bé không cân nặng và chưa chọn → "Hồ sơ bé chưa có cân nặng nên chưa ghi tiền nội trú."; lịch hẹn có `draftInvoice` → "Thêm vào hóa đơn nháp HD-1028 của lịch hẹn"; `orderCages`: khu có `species_hint === species` hoặc `'any'` đứng trước và `fit: true`, giữ thứ tự mã chuồng trong khu.
  - `stayMoney`: 52 giờ, "Nội trú mèo", 150.000/ngày → `"Nội trú mèo × 2,2 ngày = 330.000 ₫ · tạm tính tới bây giờ"` (đã xuất viện: `"… · đã tính 2,2 ngày"` đúng chữ "đã tính"); không `billing` → "Chưa có hóa đơn"; `billing` không có `dayItemName` → "Chưa ghi tiền nội trú"; `dischargeMoneyLine`: nháp → `"Nội trú mèo × 2,2 ngày (52 giờ) = 330.000 ₫ · Hóa đơn đang là bản nháp"`; `issued` → "Hóa đơn đã phát hành — không thay đổi"; `voided` → "Hóa đơn đã hủy — không thay đổi"; không billing → "Lượt nội trú này chưa có hóa đơn."; không có dòng ngày → "Chưa ghi tiền nội trú — bạn có thể thêm trong hóa đơn."; `at` trước `admittedAt` → `{ invalid: true }` và văn bản không chứa `NaN` hay dấu trừ.
- [ ] **Step 2: Run to verify RED** — `npx vitest run src/features/staff/inpatient`. Expected: FAIL (module chưa có).
- [ ] **Step 3: Implement** các hàm theo Interfaces; số tiền qua `formatVnd` (`@/lib/money`), ngày VN qua `dayOf`/`todayVN`/`relativeDayVi`/`formatDayVi` (`@/lib/dates`), `billableDays`/`formatDaysVi`; thành tiền `Math.round(dayPrice * days)`; số giờ `Math.floor(phút / 60)`.
- [ ] **Step 4: Run to verify GREEN** — `npx vitest run src/features/staff/inpatient && npm run typecheck && npm run lint`. Expected: PASS.
- [ ] **Step 5: Commit** — `feat: pure helpers for the inpatient screens`.

---

### Task 2: Chọn chuồng và hộp thoại Nhập viện 3 bước

**Files:**
- Create: `CagePicker.tsx`, `AdmitDialog.tsx`; Modify: `Inpatient.module.css`
- Test: `e2e/giao-dien-nhan-vien-c.spec.ts` (tạo)

**Interfaces:**
- Consumes: Task 1 `admitSteps.ts`; `staff.inpatient.admitOptions()`, `findPets(q)`, `admit(input): Promise<string>`; `useAppNavigate`, `paths.nv.stay(id)`, `PetAvatar`, `ChipGroup`, `Dialog`, `Field`, `Checkbox`.
- Produces: `CagePicker({ cages, species, value, onChange, label })` — nhóm theo khu, ô radio có nhãn "Chuồng C4", khu hợp loài đứng đầu kèm nhãn "Hợp với bé"; `AdmitDialog({ open, onClose, cageId? })` — hộp thoại rộng, đầu hộp thoại "Bước N/3 · tên bước" (`aria-live="polite"`), chân Quay lại · Tiếp · (bước 3) Nhập viện; dùng `key` để mở mới mỗi lần.

- [ ] **Step 1: Write the failing e2e** (`test.describe('admit a pet', …)`):
  - "three steps: pick from today's appointments, choose a cage, confirm": `bacsi_mai` mở `/nv/noi-tru`, bấm "Nhập viện"; thấy "Bước 1/3"; thẻ lịch hẹn của Mập bấm chọn; "Tiếp" → "Bước 2/3"; ô "Lý do nhập viện" trống thì "Tiếp" bị tắt; điền lý do, chọn chuồng M1 (radio "Chuồng M1"); "Tiếp" → "Bước 3/3" thấy tóm tắt chứa "Mập · chuồng M1"; "Nhập viện" → toast "Đã nhập viện Mập vào chuồng M1." và URL `#/nv/noi-tru/stay-…`.
  - "search finds a pet by owner or phone, a pet already in a cage cannot be chosen": gõ "Nguyễn Thị Lan" ô "Tìm bé, chủ nuôi hoặc số điện thoại" → có Bông; Miu có chữ "Đang nội trú" và nút bị `disabled`.
  - "an empty cage opens the dialog with the cage chosen": bấm ô "Nhập viện vào chuồng C2" → "Bước 1/3"; chọn Bông; "Tiếp" → ô radio "Chuồng C2" đã `checked`.
  - "a cage taken meanwhile sends the person back to the cage step with the typed reason kept": mở hộp thoại ở tab A tới bước 3 (Tôm, chuồng C5, lý do "Theo dõi"); tab B (cùng context) nhập viện Đậu vào C5; tab A bấm "Nhập viện" → thấy "Chuồng này đang có bé ở." và "Bước 2/3", ô lý do còn "Theo dõi", chuồng C5 không còn trong danh sách.
  - "a pet without a weight starts with no day charge": chọn Tôm → bước 3 thấy "Hồ sơ bé chưa có cân nặng nên chưa ghi tiền nội trú."; chọn Bông → dòng ngày mặc định "Nội trú chó dưới 15 kg".
- [ ] **Step 2: Run to verify RED** — `npm run build && npx playwright test e2e/giao-dien-nhan-vien-c.spec.ts -g "admit a pet" --project=desktop-1440 --project=phone-390`. Expected: FAIL.
- [ ] **Step 3: Implement** — `CagePicker` bằng nhóm radio tự viết (`role="radiogroup"` theo khu, mũi tên di chuyển) dùng `orderCages`; `AdmitDialog`: trạng thái `AdmitDraft` + `step`; bước 1 gồm ô tìm (debounce không cần, gọi `findPets` khi `q.length ≥ 1`) và thẻ "Lịch hẹn hôm nay" từ `admitOptions().today` (chọn → `pet` + `appointment`, lịch có `draftInvoice` thì `dayItemNote` báo); bước 2 gồm `CagePicker`, bác sĩ (`Select`, mặc định người đăng nhập nếu có trong `doctors`), lý do (nhãn "Chỉ nhân viên", `Textarea`), tình trạng ban đầu (`ChipGroup`, mặc định `watch`), dự kiến xuất viện (`type="date"`, `min` hôm nay); bước 3 gồm ô tick "Tạo hóa đơn nháp" (tick sẵn), `Select` dòng ngày (`dayItems` + "Chưa ghi tiền nội trú", mặc định `suggestedDayItemId`), `dayItemNote`, `admitSummary`. Gửi `admit(...)` với `invoice: draft.invoice ? { day_price_item_id } : undefined`. `ValidationError` → trường lỗi dưới ô + `setStep(stepOfField(firstKey))`; sau lỗi `cage_id` tải lại `admitOptions` (qua `useQuery` tự làm mới theo store). Thành công: toast, `onClose()`, `navigate(paths.nv.stay(id))`. Dữ liệu giữ khi Quay lại.
- [ ] **Step 4: Run to verify GREEN** — như Step 2, cộng `--project=phone-320`. Expected: PASS.
- [ ] **Step 5: Commit** — `feat: admit a pet in three steps`.

---

### Task 3: Bảng chuồng mới

**Files:**
- Modify: `BoardPage.tsx` (viết lại), `Inpatient.module.css`
- Test: `e2e/giao-dien-nhan-vien-c.spec.ts`

**Interfaces:**
- Consumes: Task 2 `AdmitDialog`; `staff.inpatient.board()`; `PetAvatar`, `StatusPill`, `ChipGroup`.
- Produces: `BoardPage` (giữ tên export).

- [ ] **Step 1: Write the failing e2e** (`test.describe('cage board', …)`):
  - "summary numbers, zone filter and the next-step line": `bacsi_mai` mở bảng: thấy "5 bé đang nội trú" và "7 chuồng trống" (dữ liệu mẫu: 12 chuồng, 5 bé); chọn radio "Khu mèo" → mọi `[data-cage]` còn lại thuộc khu mèo (tiêu đề `<h2>` "Khu chó" biến mất); thẻ Miu có ảnh (`[data-pet-avatar]`) và một dòng việc (không rỗng).
  - "an empty cage is a button for people who can admit": `quanly_ha` và `spa_ngocanh` (cả hai có `inpatient.admit`): ô "Trống" là nút "Nhập viện vào chuồng C2"; bấm → hộp thoại "Bước 1/3"; thấy dòng gợi ý "Bấm thẻ để xem hồ sơ bé, bấm chuồng trống để nhập viện." (Bộ quyền mẫu không có vai nào thiếu `inpatient.admit`, nên nhánh "không có quyền → chỉ chữ Trống" được giữ trong code nhưng không có e2e; ghi vào sổ.)
  - "phones: the board fits 320 px @narrow": `fitsDevice`.
  - Bài cũ `e2e/staff-b.spec.ts` ("spa_ngocanh stay page…": `[data-cage]` có chữ "Trống", tiêu đề "Khu mèo") vẫn xanh.
- [ ] **Step 2: Run to verify RED** — `npm run build && npx playwright test e2e/giao-dien-nhan-vien-c.spec.ts -g "cage board" --project=desktop-1440 --project=phone-390`. Expected: FAIL.
- [ ] **Step 3: Implement** theo spec §2: đầu trang ba số tóm tắt (số "cần gửi nhật ký hôm nay" đếm `stay && !diaryToday`, chỉ với `inpatient.share`), `ChipGroup` lọc khu (`Tất cả` + `zone` duy nhất), nút "Nhập viện" (`inpatient.admit`), dòng gợi ý; thẻ có `PetAvatar`, chuồng, "Ngày N", `StatusPill`, viết tắt bác sĩ, **một** dòng việc tiếp theo chọn theo thứ tự "Dự kiến về hôm nay" (so `expectedDischarge` với hôm nay) → "Chưa gửi nhật ký hôm nay" → "N việc chưa ghi" → "Chủ nuôi chưa liên kết tài khoản" → cảnh báo an toàn đầu; chuồng trống là `<button>` với `can('inpatient.admit')`, ngược lại `<li>` chữ "Trống"; trạng thái `admitCage` mở `AdmitDialog` (`key`); rỗng toàn bảng → `EmptyState` "Chưa có bé nào nội trú." Giữ hiệu ứng vào nhẹ một lần.
- [ ] **Step 4: Run to verify GREEN + regression** — `npm run build && npx playwright test e2e/giao-dien-nhan-vien-c.spec.ts e2e/staff-b.spec.ts e2e/giao-dien-khach.spec.ts --project=desktop-1440 --project=phone-390 --project=phone-320`. Expected: PASS.
- [ ] **Step 5: Commit** — `feat: cage board with summary, filter and admit from an empty cage`.

---

### Task 4: Trang một bé — thẻ thông tin, tiến trình, việc nên làm, Lịch sử, Hóa đơn

**Files:**
- Create: `StayInfoCard.tsx`, `StayProgress.tsx`, `NextChores.tsx`, `HistoryTab.tsx`
- Modify: `StayPage.tsx`, `DiaryTab.tsx`, `VideosTab.tsx`, `InternalTab.tsx` (chỉ kiểu, `.num`), `Inpatient.module.css`
- Test: `e2e/giao-dien-nhan-vien-c.spec.ts`

**Interfaces:**
- Consumes: Task 1 (`currentStayStep`, `stepIndex`, `STAY_STEP_LABELS`, `stayChores`, `groupByDay`, `infoMoneyLine`); `staff.inpatient.getStay`, `history`.
- Produces: `StayInfoCard({ v, onGoTab, actions?: ReactNode })` — `[data-stay-info]`, khối theo spec §3 (nút hành động nhận qua `actions` ở Task 5–6); `StayProgress({ v })` — danh sách có thứ tự, bước hiện tại `aria-current="step"`; `NextChores({ v, onGoTab })`; `HistoryTab({ stayId })`; `Tab = 'internal' | 'diary' | 'videos' | 'invoice' | 'history'`.

- [ ] **Step 1: Write the failing e2e** (`test.describe('a pet on the ward', …)`):
  - "the page shows progress, the info card and the money line": `bacsi_mai` mở `/nv/noi-tru/stay-NT-0039` (Mochi): thấy `[data-stay-info]` chứa "Mochi", "Chuồng C1"; dải tiến trình có phần tử `aria-current="step"`; thẻ có một dòng bắt đầu bằng "Nội trú" hoặc "Chưa ghi tiền nội trú" hoặc "Chưa có hóa đơn".
  - "the history tab groups by day, newest first": bấm tab "Lịch sử": có ≥ 1 tiêu đề ngày và các dòng `[data-history]`; thời điểm (`<time dateTime>`) giảm dần; Mochi có dòng "Nhập viện …".
  - "Spa sees no orders in the history and no internal tab": `spa_ngocanh` mở `stay-NT-0041` → tab Lịch sử không chứa tên thuốc/y lệnh ("Ringer", "Kháng sinh", "Giảm đau") và không có tab "Hồ sơ nội bộ".
  - "the chores point to the right tab": Mochi (có nhật ký nháp và hóa đơn nháp): bấm dòng "Hóa đơn chưa phát hành" mở tab Hóa đơn; bé không có việc nào (sau khi tự tạo bằng cách chia sẻ hết) hiện "Không có việc nào đang chờ." — nếu không dựng được trạng thái này ổn định thì chỉ giữ ý đầu.
  - "a stay that is discharged hides the actions and shows the strip": mở bé đã xuất viện (`stay-NT-0035`, Bơ) → có "Đã xuất viện lúc", không có nút "Xuất viện…"/"Chuyển chuồng…" và không có ô "Tình trạng nội bộ".
  - "phones: info card above the tabs and no sideways scroll @narrow"; "desktop: the info card sits beside the tabs from 1100 px" (như 4B).
- [ ] **Step 2: Run to verify RED** — `npm run build && npx playwright test e2e/giao-dien-nhan-vien-c.spec.ts -g "a pet on the ward" --project=desktop-1440 --project=phone-390`. Expected: FAIL.
- [ ] **Step 3: Implement** — `StayPage`: bố cục hai cột như `CustomerPage` (`.record`/`.info` kiểu 4B, đặt tên lớp riêng trong `Inpatient.module.css`), `PageHeader` (đường dẫn Nội trú › tên bé, mã + chuồng + ngày ở `sub`), `StayProgress` ngay dưới tiêu đề, `Tabs` có `idPrefix="nt"` và panel `role="tabpanel"` nối tab (bài học 4B), `PageProblem` chỉ khi không có dữ liệu. `StayInfoCard`: bé (`PetAvatar`, cảnh báo), chủ nuôi (liên kết hồ sơ với `customers.view`, `Tel`), thời gian ("đang ở N ngày M giờ" bằng `daysBetween`/phút, đã xuất viện thì "đã ở …"), tình trạng nội bộ (`StatusControl` giữ từ code cũ), tiền (`infoMoneyLine`, nút "Mở hóa đơn" theo quyền), "Chủ nuôi đang thấy" (đếm nhật ký `shared`, video `share_status === 'shared' && !deleted`; chủ chưa liên kết → "Chủ nuôi chưa liên kết tài khoản nên chưa xem được."), `NextChores`, rồi `actions`. Dải "Đã xuất viện lúc 15:20, 19/10" thay cho nút khi có `discharged_at`. `HistoryTab`: `useQuery(() => staff.inpatient.history(stayId))`, gom bằng `groupByDay(items, system.now())`, mỗi dòng `[data-history]` có biểu tượng theo `StayHistoryIcon` (ánh xạ sang tên icon có sẵn), giờ ở `<time className="num" dateTime>`, người làm; rỗng "Chưa có hoạt động nào." Tab Hóa đơn: `infoMoneyLine` + nút mở hóa đơn. Điều chỉnh `DiaryTab`/`VideosTab`/`InternalTab` chỉ về kiểu (thẻ chung, `.num`), không đổi chức năng.
- [ ] **Step 4: Run to verify GREEN + regression** — `npm run build && npx playwright test e2e/giao-dien-nhan-vien-c.spec.ts e2e/staff-b.spec.ts e2e/journeys/video.spec.ts e2e/giao-dien-khach.spec.ts --project=desktop-1440 --project=phone-390 --project=phone-320`. Expected: PASS.
- [ ] **Step 5: Commit** — `feat: stay page with progress, info card, chores and history`.

---

### Task 5: Hộp thoại Chuyển chuồng

**Files:**
- Create: `TransferDialog.tsx`; Modify: `StayPage.tsx` (nút trong `actions`), `Inpatient.module.css`
- Test: `e2e/giao-dien-nhan-vien-c.spec.ts`

**Interfaces:**
- Consumes: Task 2 `CagePicker`; `staff.inpatient.transfer(id, version, { cage_id, reason? })`, `admitOptions().cages`; Task 4 `StayInfoCard.actions`.
- Produces: `TransferDialog({ open, onClose, stay: Pick<StaffStayView, 'id' | 'version' | 'petName' | 'species' | 'cageCode'> })`.

- [ ] **Step 1: Write the failing e2e** (`test.describe('transfer', …)`):
  - "move to another cage with a quick reason": `bacsi_mai` mở Miu (`stay-NT-0041`), "Chuyển chuồng…"; thấy "M2 →"; chọn M3 → "M2 → M3"; chọn lý do "Cách ly"; "Chuyển chuồng" → toast "Đã chuyển Miu sang chuồng M3."; thẻ hiện "Chuồng M3"; tab Lịch sử có dòng "chuyển … từ chuồng M2 sang M3".
  - "Khác opens a free text, max 200 characters": chọn "Khác" → ô "Lý do khác"; gõ 201 ký tự → bị cắt còn 200.
  - "a stale form does not overwrite": tab A mở hộp thoại; tab B chuyển bé sang chuồng khác; tab A bấm "Chuyển chuồng" → "vừa được người khác cập nhật", hộp thoại đóng.
  - "no button without the right or after discharge" (Bơ đã xuất viện: không có nút).
- [ ] **Step 2: Run to verify RED** — `npm run build && npx playwright test e2e/giao-dien-nhan-vien-c.spec.ts -g "transfer" --project=desktop-1440 --project=phone-390`. Expected: FAIL.
- [ ] **Step 3: Implement** — hộp thoại theo spec §5 (chuồng mới chỉ chuồng trống ≠ chuồng hiện tại; `ChipGroup` lý do Cách ly · Đổi khu · Gần bác sĩ hơn · Khác; "Khác" → `Input` `maxLength={200}`); `version` giữ bằng `useState` lúc mở; `ValidationError` hiện ở `cage_id`; `ConflictError` → toast `saveError`, đóng. Nút "Chuyển chuồng…" (secondary, `can('inpatient.admit')`, bé chưa xuất viện) truyền vào `StayInfoCard actions`.
- [ ] **Step 4: Run to verify GREEN** — như Step 2 cộng `--project=phone-320` và `e2e/giao-dien-nhan-vien-c.spec.ts` toàn bộ. Expected: PASS.
- [ ] **Step 5: Commit** — `feat: transfer a pet to another cage`.

---

### Task 6: Hộp thoại Xuất viện

**Files:**
- Create: `DischargeDialog.tsx`; Modify: `StayPage.tsx` (nút chính), `Inpatient.module.css`
- Test: `e2e/giao-dien-nhan-vien-c.spec.ts`

**Interfaces:**
- Consumes: Task 1 `dischargeMoneyLine`, `dischargeReminders`; `staff.inpatient.discharge(id, version, input): Promise<DischargeResult>`, `staff.inpatient.diary.lint(text)` (qua `useDoseLint`/`DoseWarning` ở `../ui`).
- Produces: `DischargeDialog({ open, onClose, stay: StaffStayView })`.

- [ ] **Step 1: Write the failing e2e** (`test.describe('discharge', …)`):
  - "the bill summary follows the discharge time": `bacsi_mai` mở Mochi (`stay-NT-0039`, hóa đơn nháp có dòng ngày LT02 trong dữ liệu mẫu), "Xuất viện…"; thấy dòng tóm tắt có "ngày" và "Hóa đơn đang là bản nháp"; đổi "Thời điểm xuất viện" sang sớm hơn → số ngày đổi; gõ giờ trước lúc nhập viện → lỗi tại ô "Thời điểm xuất viện" và tóm tắt không chứa "NaN".
  - "reminders do not block": Mochi có nhật ký nháp của Ngọc Anh trong dữ liệu mẫu nên hiện dòng "Còn 1 nhật ký nháp chưa chia sẻ"; nút "Xác nhận xuất viện" vẫn bấm được.
  - "farewell text: the suggestion button fills it, a drug name warns, sharing needs the right": bấm "Dùng câu gợi ý" → ô chứa "đã khỏe và sẵn sàng về nhà. Cảm ơn gia đình đã tin tưởng Lê Sơn!"; gõ "uống 0,5 ml" → cảnh báo mềm; ô "Chia sẻ ngay với chủ nuôi" có với bacsi_mai.
  - "confirm discharges: toast, strip, empty cage": "Xác nhận xuất viện" → toast "Đã cho Mochi xuất viện" (có "hóa đơn tính … ngày" khi hóa đơn nháp); trang hiện "Đã xuất viện lúc"; bảng chuồng: C1 là "Trống".
  - (Hóa đơn đã phát hành giữ nguyên được kiểm bằng test đơn vị `dischargeMoneyLine` ở Task 1 và test dữ liệu sẵn có; không lặp lại ở e2e.)
  - "a stale form does not overwrite": như Task 5.
- [ ] **Step 2: Run to verify RED** — `npm run build && npx playwright test e2e/giao-dien-nhan-vien-c.spec.ts -g "discharge" --project=desktop-1440 --project=phone-390`. Expected: FAIL.
- [ ] **Step 3: Implement** theo spec §6: các trường (`datetime-local`, mặc định bây giờ, `max` bây giờ), dòng hóa đơn từ `dischargeMoneyLine(v.billing, v.admitted_at, at)` + giải thích "Tiền nội trú tính theo giờ, làm tròn lên 0,1 ngày." + nút "Mở hóa đơn" (`invoices.create`|`payments.record`), lời chào (gợi ý "{Tên} đã khỏe và sẵn sàng về nhà. Cảm ơn gia đình đã tin tưởng Lê Sơn!", `useDoseLint`/`DoseWarning`, ô chia sẻ chỉ với `inpatient.share`), dòng cố định về hướng dẫn thuốc, nhắc `dischargeReminders`, nút "Xác nhận xuất viện". Gửi `discharge(id, version, { discharged_at, note_internal, farewell })` (`farewell` chỉ khi có chữ); toast `Đã cho {tên} xuất viện` + ` · hóa đơn tính {formatDaysVi(days)} ngày.` khi `invoiceUpdated`. `ValidationError` tại ô; xung đột như Task 5. Nút "Xuất viện…" là nút chính của thẻ (`can('inpatient.admit')`, chưa xuất viện).
- [ ] **Step 4: Run to verify GREEN** — như Step 2 cộng `--project=phone-320`. Expected: PASS.
- [ ] **Step 5: Commit** — `feat: discharge with a live bill summary and a farewell note`.

---

### Task 7: Tải video lên 3 bước và phát video qua `useMediaUrls`

**Files:**
- Create: `VideoUploadDialog.tsx`, `videoProbe.ts`; Modify: `VideosTab.tsx`, `Inpatient.module.css`
- Test: `e2e/giao-dien-nhan-vien-c.spec.ts`; `src/features/staff/inpatient/videoProbe.test.ts`

**Interfaces:**
- Consumes: `staff.inpatient.videos.upload(stayId, VideoUploadInput): Promise<string>`, `demoClips()`, `deviceUploadAvailable()`; `videoFileProblem`, `VIDEO_MAX_BYTES`, `VIDEO_MAX_SECONDS`, `VIDEO_CAPTION_MAX`, `VIDEO_MSG` (`@/data/rules/video-upload`); `useMediaUrls(mediaKey): { urls?: { mp4, poster?, thumb? }; loading: boolean; missing: boolean }`; `VideoPlayer`.
- Produces: `readVideoDuration(file: Blob, timeoutMs?: number): Promise<number>` (0 khi không đọc được hoặc quá hạn; thu hồi object URL); `captionHints(petName: string): string[]` (3 câu gợi ý, câu đầu `"{tên} sưởi nắng buổi sáng"`); `VideoUploadDialog({ open, onClose, stay: Pick<StaffStayView, 'id' | 'petName'> })`.

- [ ] **Step 1: Write the failing tests:**
  - Unit `videoProbe.test.ts`: `captionHints('Miu')[0] === 'Miu sưởi nắng buổi sáng'` và có 3 câu khác nhau; `readVideoDuration` với `Blob` rác trả `0` trong ≤ `timeoutMs` (dùng `timeoutMs = 50` và môi trường jsdom/happy-dom: phần tử `video` không bắn `loadedmetadata` → hết hạn → 0).
  - e2e (`test.describe('upload a video', …)`):
    - "a sample clip: three steps, saved as a draft without the right to share": `bacsi_mai` mở Miu, tab Video, "Tải video lên"; thấy chữ "MP4, MOV, WebM · tối đa 15 giây · 20 MB"; "Bước 1/3"; chọn clip "Mèo chợp mắt"; Tiếp; gõ lời nhắn, thấy "n/120"; bấm câu gợi ý điền vào ô; Tiếp; bước 3 có hai ô xác nhận và nút "Lưu nháp"/"Tải lên và chia sẻ" (tắt tới khi tick đủ hai ô); "Lưu nháp" → toast "Đã tải video lên." và video mới xuất hiện ở tab với trạng thái nháp.
    - "from the device: a tiny WebM is accepted with the duration shown as —, shared with both ticks, and the customer sees it with the chip": dùng `page.setInputFiles` với buffer `{ name: 'clip.webm', mimeType: 'video/webm', buffer }` (vài byte); thấy xem trước và "—"; tick hai ô → "Tải lên và chia sẻ"; tab khách (`lan_nguyen`, Miu) thấy video và chip "Chỉ lưu trên trình duyệt này"; video phát được ở phía nhân viên hoặc hiện "Không còn tệp video" khi không đọc được (không treo).
    - "a file over 20 MB and a non-video file show the exact message at once": buffer 20 MB + 1 → `VIDEO_MSG.tooBig`; `text/plain` → `VIDEO_MSG.notVideo`; "Tiếp" bị tắt.
    - "a sample clip never shows the device note": chọn clip mẫu → không có chip "Chỉ lưu trên trình duyệt này".
    - "no 'Tải video lên' for someone without inpatient.diary_write or after discharge".
- [ ] **Step 2: Run to verify RED** — `npx vitest run src/features/staff/inpatient/videoProbe.test.ts` rồi `npm run build && npx playwright test e2e/giao-dien-nhan-vien-c.spec.ts -g "upload a video" --project=desktop-1440 --project=phone-390`. Expected: FAIL.
- [ ] **Step 3: Implement** — `videoProbe.ts`: tạo `<video preload="metadata" muted>` với object URL, `loadedmetadata` → `duration` (hữu hạn, làm tròn 0,1), `error`/hết hạn → 0, luôn `URL.revokeObjectURL`. `VideoUploadDialog` theo spec §7: tiêu đề các bước "Chọn video → Lời nhắn → Chia sẻ" và `aria-live` "Bước N/3"; bước 1 hai lựa chọn (`ChipGroup`: "Video mẫu" lưới `demoClips()` kèm ảnh bìa từ `mediaFor`, nhãn "Video minh họa"; "Chọn từ máy" tắt kèm `VIDEO_MSG.storage` khi `deviceUploadAvailable()` sai) với `<input type="file" accept="video/*">` trong vùng bấm/kéo thả; chọn tệp → `videoFileProblem(file, duration)` hiện ngay (`role="alert"`), xem trước tắt tiếng, thời lượng "—" khi 0, ghi chú R25 nguyên văn "Bản demo: video tải từ máy được phát ở chế độ tắt tiếng; bản chính thức sẽ loại bỏ âm thanh khi tải lên." và chip "Chỉ lưu trên trình duyệt này"; "Tiếp" chỉ mở khi có clip/tệp hợp lệ; bước 2 lời nhắn (`maxLength={VIDEO_CAPTION_MAX}`, đếm, `captionHints`), thời điểm quay (`datetime-local`, `max` bây giờ), chip cố định "Âm thanh: đã loại bỏ" · "Tự xóa sau 60 ngày"; bước 3 hai ô xác nhận (chỉ `inpatient.share`) và nút theo quyền. Gửi `upload(stayId, { source, caption, recorded_at, duration_s, share })`, `ValidationError` hiện ở bước tương ứng (`file`→1, `caption`→2, `share`→3). `VideosTab`: nút "Tải video lên" (`inpatient.diary_write`, chưa xuất viện), phát/ảnh bìa qua `useMediaUrls(x.media_key)` (`missing` → "Không còn tệp video"), chip "Chỉ lưu trên trình duyệt này" khi `x.isLocal`, cuộn tới video mới sau khi tải.
- [ ] **Step 4: Run to verify GREEN + regression** — unit + `npm run build && npx playwright test e2e/giao-dien-nhan-vien-c.spec.ts e2e/journeys/video.spec.ts e2e/du-lieu-media.spec.ts e2e/staff-b.spec.ts --project=desktop-1440 --project=phone-390 --project=phone-320`. Expected: PASS.
- [ ] **Step 5: Commit** — `feat: upload a video in three steps and play local videos`.

---

### Task 8: Hành trình đầy đủ, quyền, trợ năng và màn nhỏ

**Files:**
- Test: `e2e/giao-dien-nhan-vien-c.spec.ts`; sửa nhỏ `e2e/staff-b.spec.ts`/`e2e/journeys/video.spec.ts` nếu nhãn đổi (ghi sổ); `e2e/manifest.ts` nếu cần thêm route

**Interfaces:**
- Consumes: Task 2–7.
- Produces: không có (kiểm thử).

- [ ] **Step 1: Write the failing e2e** (`test.describe('whole stay', …)`):
  - "the whole round: admit → transfer → upload and share → owner sees it → discharge with a farewell → bill by the day → cage empty": `bacsi_mai` nhập viện **Bông** vào C2 (hóa đơn nháp, dòng ngày mặc định "Nội trú chó dưới 15 kg"); chuyển sang C5; tải WebM nhỏ từ máy, chia sẻ (tick hai ô); tab khách `lan_nguyen` mở `/khach-hang/noi-tru` thấy bé Bông, video và chip "Chỉ lưu trên trình duyệt này", không thấy "C5" hay tên nhân viên; xuất viện với lời chào "Dùng câu gợi ý" + chia sẻ; toast có "hóa đơn tính 0,1 ngày"; khách thấy lời chào "Sẵn sàng về nhà"; hóa đơn `/nv/hoa-don/…` của Bông có dòng "Nội trú chó dưới 15 kg" với số lượng "0,1"; bảng chuồng: C2 và C5 là "Trống".
  - "spa_ngocanh can admit, transfer, discharge and share, but never sees internal data": nhập viện Đậu (cần chọn bác sĩ; thiếu bác sĩ → lỗi API ở ô bác sĩ), chuyển chuồng, xuất viện, chia sẻ video; trang không có tab "Hồ sơ nội bộ", Lịch sử không có y lệnh.
  - "axe on the four dialogs": mở lần lượt Nhập viện (bước 1 và 3), Chuyển chuồng, Xuất viện, Tải video lên (bước 1) và chạy `AxeBuilder` (wcag2a/aa/21aa/22aa): không vi phạm `serious`/`critical` (mẫu ở `e2e/a11y.spec.ts`).
  - "phones: every dialog fits the device width @narrow": `fitsDevice` ở mỗi hộp thoại và ở trang bé, bảng chuồng.
  - "keyboard: a cage can be chosen with arrows and Esc closes a dialog returning focus to its button".
- [ ] **Step 2: Run to verify RED** — `npm run build && npx playwright test e2e/giao-dien-nhan-vien-c.spec.ts -g "whole stay" --project=desktop-1440 --project=phone-390`. Expected: một số bài FAIL cho tới khi sửa lỗi phát hiện được (nếu mọi bài xanh ngay vì Task 2–7 đã đủ, ghi sổ "pin existing behavior" cho bài đó).
- [ ] **Step 3: Fix** những lỗi hành trình hoặc a11y lộ ra (mỗi lỗi: test tái hiện đã có ở Step 1 → sửa nhỏ nhất); cập nhật spec cũ nhỏ nếu nhãn đổi.
- [ ] **Step 4: Run to verify GREEN** — `npm run build && npx playwright test e2e/giao-dien-nhan-vien-c.spec.ts e2e/staff-b.spec.ts e2e/journeys e2e/a11y.spec.ts e2e/giao-dien-chu.spec.ts --project=desktop-1440 --project=phone-390 --project=phone-320`. Expected: PASS.
- [ ] **Step 5: Commit** — `test: whole inpatient round, permissions, axe and narrow screens`.

---

### Task 9: Hoàn tất

- [ ] **Step 1:** `npm run typecheck && npm run lint && npm test` — sạch, mọi bài đơn vị pass.
- [ ] **Step 2:** Ghi **R39** vào `docs/thiet-ke/QUYET-DINH.md` (nội trú nhân viên: bảng chuồng mới, trang bé hai cột + dải tiến trình + việc nên làm + tab Lịch sử, nhập viện 3 bước, chuyển chuồng có lý do nhanh, xuất viện có tóm tắt tiền theo giờ và nhắc nháp không chặn, tải video 3 bước, không đổi hợp đồng); cập nhật `PROGRESS.md` (mục giao diện: xong 4C, tiếp 4D) và dòng trạng thái `README.md`; cập nhật `docs/tham-khao/bang-kiem-thu-nghiep-vu-2026-10-21.md` cho các ô liên quan (nội trú: nhập viện/chuyển/xuất viện/video từ máy, chuồng bận đồng thời).
- [ ] **Step 3:** `npm run verify` — exit 0 (chạy nền, đọc đuôi `/tmp/*.log`; bài chập chờ chỉ khi chạy cả bộ: chạy riêng 3 lần, xác định nguyên nhân trước khi kết luận).
- [ ] **Step 4:** `npm run build:single`, chép `dist-single/index.html` thành `dist-single/Le-Son-demo.html`; commit `docs: part 4C decisions, progress and status`. Gửi bản HTML cho chủ dự án **một lần** sau rà soát cuối.
