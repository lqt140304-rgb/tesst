# Phần 5E: Trợ giúp và hỗ trợ, kế hoạch thực hiện

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mục Trợ giúp cho nhân viên (hướng dẫn tìm được, giải thích khi bị chặn), danh sách "Việc đầu tiên" tự tích ở Tổng quan, và hỏi/góp ý với hộp thư cho người có quyền.

**Architecture:** Chỉ lớp giao diện. Một trang `#/nv/tro-giup` với ba thẻ (Hướng dẫn, Góp ý của tôi, Hộp thư); hàm thuần `helpView.ts` có test; hook `useMarkDone` đánh dấu việc đầu tiên đúng lúc người dùng làm thật; màn bị chặn đọc `help.whyNot`. Dữ liệu (`staff.help`, `staff.support`, `staff.prefs`) chỉ đọc, **không đổi `src/data/**`**.

**Tech Stack:** React 19, TypeScript, react-router (hash), motion, CSS Modules, Vitest, Playwright. Không thêm thư viện.

**Spec:** `docs/superpowers/specs/2026-10-22-phan-5e-nhan-vien-tro-giup-ho-tro-design.md`.

## Global Constraints

- Mọi chữ hiển thị bằng tiếng Việt; không "quý khách", không "lễ tân"; số, ngày, mã dùng class `.num`; **không dùng `—` trong chữ hiển thị mới**. Bài và phiếu hiện bằng văn bản thường, không chèn HTML.
- R43: Linear 85% + Stripe 15%: nền phẳng, viền mảnh, một màu nhấn tím mận, không gradient trong vùng dữ liệu.
- Không đổi `src/data/**`. Giao diện **không bao giờ** gửi `prefs.save({ onboarding_done })` (thay cả danh sách); chỉ `help.markDone` và `prefs.save({ onboarding_hidden })`.
- Lỗi ghi: `ValidationError.fields` đúng ô (`kind`, `title`, `body`, `screen`); phiếu trùng và lỗi khác hiện dưới form; `ConflictError` ở Hộp thư → thông báo chuẩn (`saveError`), đóng hộp thoại, tải lại.
- Câu cố định (chép nguyên): "Trợ giúp" · "Hướng dẫn" · "Góp ý của tôi" · "Hộp thư" · "Nội dung mẫu" · "Tìm trong hướng dẫn" · "Chưa có bài nào khớp. Thử từ khác, hoặc hỏi Quản lý ở tab Góp ý." · "Việc đầu tiên" · "Đã làm {x}/{y}" · "Bạn đã làm hết các việc đầu tiên." · "Ẩn danh sách" · "Hiện danh sách việc đầu tiên" · "Bạn chưa gửi phiếu nào." · "Hỏi hoặc góp ý" · "Xem bài về quyền".
- Giới hạn ký tự: tiêu đề 80, nội dung 1000, màn hình 100, trả lời 500; có bộ đếm "x/80".
- Chuyển động một lần, 150 đến 450 ms, tôn trọng giảm chuyển động; bàn phím; tương phản ≥ 4,5:1; 320 px không cuộn ngang ở **cả cỡ chữ Lớn và bảng Gọn**.
- Commit tiêu đề tiếng Anh `feat:`/`test:`/`docs:`, không ghi tên model. Viết test trước. **Đọc kết quả test trước khi chạy `task-done`.**

## Review Focus

1. Gõ nhanh trong ô tìm: kết quả cũ về muộn không đè kết quả mới (Task 2).
2. `?bai=` trỏ tới bài không tồn tại hoặc bài người đó không được xem: về danh sách, không lỗi (Task 2).
3. Hai lần bấm "Gửi phiếu" liên tiếp hoặc gửi trùng: không tạo hai phiếu, người dùng được báo (Task 5).
4. Việc đầu tiên: làm cùng một việc nhiều lần không đánh dấu lặp; việc không thuộc danh sách của vai không gây lỗi hiện ra (Task 4).
5. Hai Quản lý cùng trả lời một phiếu: người sau được báo, không ghi đè (Task 6).
6. Người không có `support.inbox` mở thẳng `?tab=hop-thu`: rơi về Hướng dẫn, không thấy phiếu của người khác (Task 6).

---

## File structure

Mới, `src/features/staff/help/`: `helpView.ts` · `helpView.test.ts` · `useMarkDone.ts` · `HelpPage.tsx` · `ArticlesTab.tsx` · `SupportTab.tsx` (form + Phiếu của tôi) · `TicketRow.tsx` · `InboxTab.tsx` · `TicketDialog.tsx` · `ChecklistCard.tsx` · `Help.module.css`. Mới: `e2e/giao-dien-nhan-vien-i.spec.ts`.
Sửa: `src/app/routes.ts`, `src/app/router.tsx`, `src/features/staff/index.tsx`, `shell/StaffShell.tsx` (menu, menu tài khoản, màn bị chặn), `src/app/system/System.tsx` (`Forbidden` nhận câu giải thích), `dashboard/DashboardPage.tsx`, `settings/PrefsPage.tsx`, các điểm đánh dấu việc (`appointments/CalendarPage.tsx`, `customers/CustomerPage.tsx`, `inpatient/BoardPage.tsx`, `inpatient/DiaryTab.tsx`, `pricelist/PricesPage.tsx`, `requests/RequestDetail.tsx`, `invoices/InvoiceNewPage.tsx`, `invoices/PaymentDialog.tsx`), `src/ui/icons/names.ts`, `scripts/duotone-icons.mjs`, `e2e/manifest.ts`.

---

### Task 1: hàm thuần `helpView`, icon, `useMarkDone`

**Files:**
- Create: `src/features/staff/help/{helpView.ts,helpView.test.ts,useMarkDone.ts}`
- Modify: `src/ui/icons/names.ts`, `scripts/duotone-icons.mjs` (`'lifebuoy': 'Lifebuoy'`, rồi `npm run icons`)

**Interfaces:**
- Consumes: `SupportKind, SupportStatus, SUPPORT_STATUS_LABEL` (`@/data/contracts/enums`); `staff.help.markDone` (`@/data/staff`); `useSession` (`session.staffId`).
- Produces (`helpView.ts`):
  - `LIMITS = { title: 80, body: 1000, screen: 100, reply: 500 } as const`; `countText(value: string, max: number): string` (= `"{độ dài đã cắt khoảng trắng hai đầu}/{max}"`).
  - `statusTone(s: SupportStatus): 'orange' | 'teal' | 'plum'` (Mới cam, Đang xem tím, Đã trả lời xanh ngọc).
  - `progressText(done: number, total: number): string` ("Đã làm 3/8").
  - `helpTab(raw: string | null, canInbox: boolean): 'huong-dan' | 'gop-y' | 'hop-thu'` (mặc định `huong-dan`; `hop-thu` mà `canInbox` sai → `huong-dan`).
  - `pickArticle(id: string | null, ids: readonly string[]): string | undefined` (chỉ trả `id` nếu có trong `ids`).
  - `supportHref(screen?: string): string` (= `/nv/tro-giup?tab=gop-y` kèm `&man=` đã mã hóa khi có).
- Produces (`useMarkDone.ts`): `useMarkDone(): (key: string) => void` (gọi `staff.help.markDone(key)` **một lần cho mỗi nhân viên và mỗi khóa trong phiên trang**, lỗi nuốt); `useMarkOnMount(key: string): void` (gọi hàm trên khi trang dựng xong).

- [ ] **Step 1: Viết test (đỏ)** `helpView.test.ts`: `countText('  abc ', 80)` = "3/80"; `LIMITS` bốn giá trị; `statusTone` ba trạng thái; `progressText(3, 8)` = "Đã làm 3/8"; `helpTab(null, false)` = `huong-dan`, `('gop-y', false)` = `gop-y`, `('hop-thu', false)` = `huong-dan`, `('hop-thu', true)` = `hop-thu`, `('abc', true)` = `huong-dan`; `pickArticle('kho', ['tong-quan','kho'])` = `'kho'`, `('nope', ['kho'])` và `(null, ['kho'])` = `undefined`; `supportHref()` = `/nv/tro-giup?tab=gop-y`, `supportHref('Lịch hẹn')` = `/nv/tro-giup?tab=gop-y&man=L%E1%BB%8Bch%20h%E1%BA%B9n`.
- [ ] **Step 2: Chạy, thấy đỏ:** `npx vitest run src/features/staff/help`. Expected: FAIL (mô-đun chưa có).
- [ ] **Step 3: Cài** theo Interfaces; thêm icon `lifebuoy` vào `names.ts` và `MAP`, chạy `npm run icons`.
- [ ] **Step 4: Chạy, thấy xanh:** cùng lệnh; `npm run typecheck && npm run lint`. Expected: PASS.
- [ ] **Step 5: Commit:** `feat: help view helpers and icon`.

---

### Task 2: trang Trợ giúp và thẻ Hướng dẫn

**Files:**
- Create: `HelpPage.tsx`, `ArticlesTab.tsx`, `Help.module.css`
- Modify: `routes.ts` (`nv.help: '/nv/tro-giup'`, bí danh `nv-tro-giup`), `router.tsx` (`tro-giup`, tiêu đề "Trợ giúp", `pageKey: 'nv.help'`), `staff/index.tsx` (`StaffHelp`), `shell/StaffShell.tsx` (mục menu "Trợ giúp" cuối danh sách, `icon: 'lifebuoy'`, không `cap`; dòng "Hỏi hoặc góp ý" trong menu tài khoản tới `supportHref(tiêu đề trang đang xem)`), `e2e/manifest.ts` (`tro-giup`)
- Test: `e2e/giao-dien-nhan-vien-i.spec.ts` (mới)

**Interfaces:**
- Consumes: Task 1; `staff.help.articles()/search(q)`; `useSession().can`; `Tabs` (`idPrefix="tro-giup"`), `PageHeader, Panel, MiniTag, LoadingBlocks, PageProblem, EmptyState, ButtonLink` ; `useSearchParams`.
- Produces: `HelpPage()` (h1 "Trợ giúp"; `Tabs` "Hướng dẫn", "Góp ý của tôi", và "Hộp thư" chỉ khi `can('support.inbox')`; thẻ lấy từ `?tab=`; chỉ một thẻ dựng); `ArticlesTab()`; ô `searchbox` tên "Tìm trong hướng dẫn" trong vùng `role="search"`, tìm sau khi ngừng gõ 250 ms, kết quả cũ về muộn bị bỏ (so khóa tìm hiện hành); vùng `aria-live="polite"` "Có {n} bài." hoặc "Chưa có bài nào khớp. Thử từ khác, hoặc hỏi Quản lý ở tab Góp ý." kèm nút sang thẻ Góp ý; danh sách thẻ bài (tiêu đề, tóm tắt, `MiniTag` "Nội dung mẫu"); `?bai=<id>` mở bài (tiêu đề h2, tóm tắt, các bước `ol`, nhãn "Nội dung mẫu"; ≥ 900 px cạnh danh sách, điện thoại thay danh sách và có nút "Danh sách bài"); `?bai=` sai hoặc ngoài quyền → bỏ khỏi địa chỉ và về danh sách.

- [ ] **Step 1: Viết e2e (đỏ)**, `describe('help page')`: mọi vai thấy mục "Trợ giúp" trong menu (điện thoại: tờ "Thêm"); `bacsi_mai` và `quanly_ha` mở `/nv/tro-giup`: h1, hai thẻ (Bác sĩ) hoặc ba thẻ (Quản lý, có "Hộp thư"); `spa_ngocanh` không thấy thẻ "Hộp thư"; tìm "yeu cau dat lich" (không dấu) ra bài "Xử lý yêu cầu đặt lịch" cho Quản lý; Spa tìm cùng từ ra "Chưa có bài nào khớp…" và không có bài hóa đơn trong danh sách; mở một bài: địa chỉ có `bai=`, thấy các bước và "Nội dung mẫu"; `?bai=khong-co` rơi về danh sách; tải lại giữ bài; gõ nhanh hai từ khác nhau liên tiếp thì danh sách khớp từ gõ sau (kiểm bằng kết quả cuối); menu tài khoản có "Hỏi hoặc góp ý" dẫn tới `?tab=gop-y&man=…`; axe sạch; `@narrow` vừa.
- [ ] **Step 2: Build và chạy, thấy đỏ:** `npm run build && npx playwright test e2e/giao-dien-nhan-vien-i.spec.ts --project=desktop-1440 --timeout=15000`. Expected: FAIL.
- [ ] **Step 3: Cài** theo Interfaces. `SupportTab` và `InboxTab` chưa có ở Task này: `Tabs` chỉ có "Hướng dẫn" (ghi sổ), các thẻ kia được thêm ở Task 5 và 6.
- [ ] **Step 4: Chạy, thấy xanh:** build lại, cả file ba cỡ; `npm run typecheck && npm run lint && npm test`. Expected: PASS (đọc kết quả trước `task-done`; các ca về hai/ba thẻ và "Hỏi hoặc góp ý" chuyển sang Task 5/6 và được ghi sổ).
- [ ] **Step 5: Commit:** `feat: help page with searchable guides`.

---

### Task 3: màn bị chặn nói rõ vì sao

**Files:**
- Modify: `src/app/system/System.tsx` (`Forbidden({ home, hint?, missing?, helpTo? })`), `shell/StaffShell.tsx` (khi `blocked`, đọc `staff.help.whyNot(cap đầu tiên của trang)` và truyền xuống), `Help.module.css` nếu cần
- Test: `e2e/giao-dien-nhan-vien-i.spec.ts`

**Interfaces:**
- Consumes: `staff.help.whyNot(feature: Cap): Promise<WhyNot>`; `useQuery`; `paths.nv.help`.
- Produces: màn "Mục này dành cho người có quyền phù hợp" giữ nguyên câu cũ, thêm dòng `hint`, dòng "Quyền cần có: {missingLabels nối bằng dấu phẩy}" và liên kết "Xem bài về quyền" tới `/nv/tro-giup?bai=quyen-cua-toi`. Khi `whyNot` lỗi hoặc đang tải: giữ màn cũ, không báo lỗi.

- [ ] **Step 1: Viết e2e (đỏ)**, `describe('blocked page explains itself')`: `bacsi_mai` vào `/nv/doanh-thu`: có dòng "Quyền cần có: Xem doanh thu", câu giải thích, liên kết "Xem bài về quyền" dẫn tới trang Trợ giúp với bài "Quyền của tôi và vì sao có nút bị ẩn" mở; `spa_ngocanh` vào `/nv/cai-dat/tai-khoan`: nhắc "Quản lý tài khoản nhân viên"; trang hợp quyền không có các dòng này; axe sạch.
- [ ] **Step 2: Build và chạy, thấy đỏ.** Expected: FAIL.
- [ ] **Step 3: Cài** theo Interfaces (trang có `cap` dạng mảng thì dùng quyền đầu).
- [ ] **Step 4: Chạy, thấy xanh:** build lại, cả file; `e2e/staff-a.spec.ts` (kiểm tra màn bị chặn cũ); `npm run typecheck && npm run lint && npm test`. Expected: PASS.
- [ ] **Step 5: Commit:** `feat: blocked pages say what is missing`.

---

### Task 4: Việc đầu tiên

**Files:**
- Create: `dashboard/ChecklistCard.tsx` (+ CSS)
- Modify: `dashboard/DashboardPage.tsx` (đặt dưới `NudgeList`), `settings/PrefsPage.tsx` (công tắc "Hiện danh sách việc đầu tiên" ở khung Màn hình làm việc; câu hỏi "Về mặc định" thêm vế "và danh sách việc đầu tiên"), các điểm đánh dấu: `useMarkOnMount` ở `DashboardPage` (`xem-tong-quan`), `CalendarPage` (`xem-lich`), `CustomerPage` (`mo-ho-so-khach`), `BoardPage` (`xem-bang-noi-tru`), `PricesPage` (`xem-bang-gia`); `useMarkDone` sau thành công ở `RequestDetail` (bắt đầu liên hệ → `xu-ly-yeu-cau`), `DiaryTab` (lưu nhật ký → `viet-nhat-ky`), `InvoiceNewPage` (tạo nháp → `lap-hoa-don-nhap`), `PaymentDialog` (ghi nhận → `thu-tien`)
- Test: `e2e/giao-dien-nhan-vien-i.spec.ts`

**Interfaces:**
- Consumes: `staff.help.checklist()`; `usePrefs().save`; Task 1 (`progressText`, `useMarkDone`, `useMarkOnMount`).
- Produces: `ChecklistCard()` (không dựng khi `hidden`; tiêu đề "Việc đầu tiên", `progressText`, mỗi việc một dòng: việc đã làm có dấu tích và chữ "Đã làm", việc chưa làm là liên kết tới màn của nó; đủ hết thì "Bạn đã làm hết các việc đầu tiên."; nút "Ẩn danh sách" gọi `save({ onboarding_hidden: true })`).

- [ ] **Step 1: Viết e2e (đỏ)**, `describe('first tasks')`: `bacsi_mai` lần đầu vào `/nv`: khối "Việc đầu tiên" có "Đã làm 1/N" (Tổng quan tự tính là đã xem); mở `/nv/lich-hen` rồi về `/nv`: số tăng và dòng "Xem lịch hẹn" ghi "Đã làm"; mở `/nv/bang-gia`, mở một hồ sơ khách, mở `/nv/noi-tru`: ba dòng nữa đã làm; làm cùng việc lần hai không tăng số; `quanly_ha` tạo một hóa đơn nháp (qua giao diện) → "Lập một hóa đơn nháp" đã làm; ghi một khoản thu → "Thu tiền" đã làm; Spa không có các dòng không hợp quyền (không có "Lập một hóa đơn nháp"); "Ẩn danh sách" làm khối biến mất và còn sau tải lại; Tùy chọn của tôi có công tắc "Hiện danh sách việc đầu tiên" đã tắt, bật lại thì khối hiện; "Về mặc định" (có vế mới trong câu hỏi) đưa danh sách về chưa làm gì và hiện lại; không có lỗi nào trong console khi làm một việc không thuộc danh sách (Spa mở Báo cáo bị chặn rồi trở lại); axe sạch; `@narrow` vừa.
- [ ] **Step 2: Build và chạy, thấy đỏ.** Expected: FAIL.
- [ ] **Step 3: Cài** theo Interfaces và Files.
- [ ] **Step 4: Chạy, thấy xanh:** build lại, cả file ba cỡ; chạy lại `e2e/giao-dien-nhan-vien-h.spec.ts` (câu hỏi Về mặc định đổi chữ: sửa nhỏ nếu một kiểm tra dựa vào câu cũ, ghi sổ), `e2e/staff-a.spec.ts`; `npm run typecheck && npm run lint && npm test`. Expected: PASS.
- [ ] **Step 5: Commit:** `feat: first-tasks list on the overview`.

---

### Task 5: thẻ Góp ý của tôi

**Files:**
- Create: `SupportTab.tsx`, `TicketRow.tsx`
- Modify: `HelpPage.tsx` (thêm thẻ "Góp ý của tôi"), `Help.module.css`
- Test: `e2e/giao-dien-nhan-vien-i.spec.ts`

**Interfaces:**
- Consumes: `staff.support.submit/mine`; Task 1 (`LIMITS`, `countText`, `statusTone`); `ChipGroup`, `Field`, `Input`, `Textarea`, `Button`, `useToast`, `FormError`, `saveError`; `SUPPORT_KINDS`, `SUPPORT_KIND_LABEL`, `SUPPORT_STATUS_LABEL`.
- Produces: `SupportTab()`: form (nhóm nút "Loại phiếu" với ba loại, mặc định "Hỏi cách dùng"; "Tiêu đề", "Nội dung", "Màn hình" không bắt buộc điền sẵn từ `?man=`; mỗi ô có bộ đếm; nút "Gửi phiếu"); lỗi `ValidationError.fields` đúng ô và lỗi chung dưới form; khi đang gửi nút khóa (không gửi hai lần); thành công: toast "Đã gửi phiếu {mã}." và form trống; "Phiếu của tôi" ngay dưới: mỗi phiếu một dòng (`TicketRow`: mã, loại, tiêu đề, nhãn trạng thái có chữ, ngày), bấm mở chi tiết (nội dung, màn hình; đã trả lời: "Câu trả lời của {tên}" và ngày); rỗng thì "Bạn chưa gửi phiếu nào."

- [ ] **Step 1: Viết e2e (đỏ)**, `describe('my tickets')`: `bacsi_mai` mở `?tab=gop-y`: gửi rỗng → lỗi dưới "Tiêu đề" và "Nội dung" bằng câu của API; gõ 81 ký tự vào tiêu đề: bộ đếm đọc "81/80" và gửi bị từ chối đúng ô; gửi một phiếu "Báo lỗi" hợp lệ → toast "Đã gửi phiếu HT-" , form trống, phiếu mới đầu "Phiếu của tôi" với nhãn "Mới"; gửi lại y hệt khi phiếu còn chờ → câu "Bạn vừa gửi phiếu này rồi, đang chờ trả lời." và không có phiếu thứ hai; bấm đúp "Gửi phiếu" chỉ tạo một phiếu; vào từ menu tài khoản ("Hỏi hoặc góp ý") thì "Màn hình" đã điền tên trang trước đó; mở chi tiết phiếu thấy nội dung; người khác không thấy phiếu này; axe sạch; `@narrow` vừa.
- [ ] **Step 2: Build và chạy, thấy đỏ.** Expected: FAIL.
- [ ] **Step 3: Cài** theo Interfaces.
- [ ] **Step 4: Chạy, thấy xanh:** build lại, cả file ba cỡ; `npm run typecheck && npm run lint && npm test`. Expected: PASS (cùng các ca hai thẻ/"Hỏi hoặc góp ý" hoãn từ Task 2).
- [ ] **Step 5: Commit:** `feat: send and follow support tickets`.

---

### Task 6: thẻ Hộp thư

**Files:**
- Create: `InboxTab.tsx`, `TicketDialog.tsx`
- Modify: `HelpPage.tsx` (thẻ "Hộp thư" khi `can('support.inbox')`, nhãn kèm số phiếu Mới), `Help.module.css`
- Test: `e2e/giao-dien-nhan-vien-i.spec.ts`

**Interfaces:**
- Consumes: `staff.support.inbox/setStatus/reply`; Task 1; `DataTable`, `Dialog`, `ChipGroup`, `Textarea`, `Button`.
- Produces: `InboxTab()` (nhóm nút "Lọc theo trạng thái": Tất cả, Mới, Đang xem, Đã trả lời; bảng mã, loại, tiêu đề, người gửi, ngày, trạng thái; rỗng: "Chưa có phiếu nào."); `TicketDialog({ open, onClose, row })` (tiêu đề "Phiếu {mã}"; nội dung, màn hình, người gửi; "Đánh dấu đang xem" khi Mới; ô "Trả lời" có bộ đếm "x/500"; "Gửi trả lời"; giữ `version` lúc mở; `ConflictError` → toast chuẩn + đóng; phiếu đã trả lời cho sửa lại câu trả lời nhưng không có nút đổi trạng thái).

- [ ] **Step 1: Viết e2e (đỏ)**, `describe('inbox')`: `bacsi_mai` gửi phiếu (Task 5); `quanly_ha` mở `?tab=hop-thu`: thấy phiếu đó, nhãn thẻ có số Mới; lọc "Mới" còn phiếu, lọc "Đã trả lời" không có phiếu đó; mở phiếu, "Đánh dấu đang xem" → trạng thái "Đang xem"; trả lời rỗng bị từ chối đúng câu "Trả lời cần từ 1 đến 500 ký tự."; trả lời hợp lệ → trạng thái "Đã trả lời", không còn nút đánh dấu; `bacsi_mai` mở `?tab=gop-y` thấy "Câu trả lời của {tên Quản lý}"; hai tab Quản lý mở cùng một phiếu, tab A trả lời, tab B trả lời → "vừa được người khác cập nhật", hộp thoại đóng; `bacsi_mai` mở thẳng `?tab=hop-thu`: rơi về Hướng dẫn, không thấy thẻ Hộp thư, không thấy phiếu người khác; axe sạch với hộp thoại mở; `@narrow` vừa.
- [ ] **Step 2: Build và chạy, thấy đỏ.** Expected: FAIL.
- [ ] **Step 3: Cài** theo Interfaces.
- [ ] **Step 4: Chạy, thấy xanh:** build lại, cả file ba cỡ; `npm run typecheck && npm run lint && npm test`. Expected: PASS.
- [ ] **Step 5: Commit:** `feat: support inbox`.

---

### Task 7: tài liệu và kiểm tra tổng

**Files:**
- Modify: `docs/thiet-ke/QUYET-DINH.md` (R47), `PROGRESS.md`, `README.md`, `docs/tham-khao/bang-kiem-thu-nghiep-vu-2026-10-21.md` (mục Trợ giúp và hỗ trợ)

- [ ] **Step 1: Tài liệu.** R47 (trang Trợ giúp ba thẻ; hộp thư cùng trang; bài tìm không dấu và theo quyền; màn bị chặn nói rõ thiếu quyền gì; việc đầu tiên tự tích khi làm thật, ẩn/bật ở Tùy chọn, "Về mặc định" đưa về như đầu; phiếu ba loại với giới hạn ký tự; hộp thư cho `support.inbox`; chưa làm: tệp đính kèm, thông báo đẩy, nhãn nổi trên menu); `PROGRESS.md` (5E xong, việc tiếp theo là làm lại trang giới thiệu, các việc nhỏ để lại); `README.md` hàng trạng thái; mục kiểm thử nghiệp vụ.
- [ ] **Step 2: Chạy toàn bộ:** `npm run verify` (nền, khoảng 23 phút; không chạy Playwright khác song song). Expected: exit 0.
- [ ] **Step 3: Commit:** `docs: part 5E help and support`.

---

## Self-review

- **Phủ spec:** §3 lối vào → Task 2; §4 Hướng dẫn → Task 2; bị chặn → Task 3; §5 Việc đầu tiên → Task 4; §6 Góp ý → Task 5; §7 Hộp thư → Task 6; §8 quyền/trợ năng → từng task; §9 yêu cầu dữ liệu → đã ghi `PROGRESS.md` khi viết spec; §10 cấu trúc → File structure; §11 kiểm thử → từng task; §13 ba quyết định → Task 6 (cùng trang), Task 4 (tự tích, Về mặc định).
- **Chênh với spec (ghi sổ khi chạy):** thẻ Góp ý/Hộp thư đăng ký dần ở Task 5/6 nên các ca "ba thẻ" của Task 2 chuyển sang các task đó; địa chỉ `?man=` do `supportHref` dựng.
- **Nhất quán tên:** `LIMITS`, `countText`, `statusTone`, `progressText`, `helpTab`, `pickArticle`, `supportHref`, `useMarkDone`, `useMarkOnMount` định nghĩa ở Task 1 và dùng đúng tên ở Task 2 đến 6.
- **Số quyết định tiếp theo:** R47.
