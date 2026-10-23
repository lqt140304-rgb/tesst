# Phần 6B — Lời nhắn, đặt lịch ngoài giờ, ngày lễ: kế hoạch thực hiện

> **Cho người thực hiện:** dùng superpowers:executing-plans (làm trong phiên này) hoặc superpowers:subagent-driven-development. Các bước dùng ô `- [ ]`. TDD: viết bài kiểm tra thất bại trước, xem nó thất bại, rồi mới viết mã.

**Mục tiêu:** khách để lại lời nhắn (hộp thoại dùng chung), trang đặt lịch nói thật về giờ làm việc và ngày lễ, nhân viên thấy lời nhắn và bấm "Đã gọi lại".

**Kiến trúc:** logic thuần (`inquiryView.ts`) có test đơn vị; một `InquiryDialog` dùng chung đặt ở `src/features/public/inquiry/`; ba nơi mở nó (đoạn Sản phẩm, Dịch vụ/Liên hệ ngoài giờ, trang đặt lịch); một khối `InquiryQueue` ở trang Yêu cầu của nhân viên. Dữ liệu chỉ qua `@/data/public` (`inquiries`, `bookings`, `system`) và `@/data/staff` (`staff.inquiries`).

**Công nghệ:** React 19, CSS Modules, Vitest, Playwright. Không thêm thư viện.

**Thiết kế:** `docs/superpowers/specs/2026-10-23-phan-6b-loi-nhan-ngoai-gio-design.md` (đã duyệt 23/10/2026) và `…/2026-10-22-phan-6-trang-gioi-thieu-design.md`.

## Ràng buộc chung

- Chữ tiếng Việt; "bạn", "Lê Sơn"; không "quý khách", không "lễ tân"; không gạch ngang dài trong chữ mới; giờ 08:00–21:00 và hotline "097 355 51 05" (`tel:+84973555105`) nguyên văn; không nhắc phụ phí lễ.
- Không sửa `src/data`. Lỗi từng ô lấy từ `ValidationError.fields` (`name`, `phone`, `text`, `about`); câu của hệ thống hiện nguyên văn, không tự viết lại.
- Quyền theo khả năng: khối lời nhắn cho `can('requests.handle')`; ẩn (không làm xám) với người không có quyền.
- Trợ năng: bàn phím, nhãn cho trình đọc màn hình, tương phản ≥ 4,5:1, 320 px không cuộn ngang; `Dialog` hiện có (Esc, bẫy focus, trả focus).
- Bài kiểm tra theo giờ dùng đồng hồ demo (`setClock`, `remountHome`, `openDuringHours` trong `e2e/helpers.ts`); không phụ thuộc giờ thật.
- Chạy e2e: `npm run build && npx playwright test <tệp> --project=desktop-1440` (build lại trước khi chạy; không chạy hai lượt Playwright cùng lúc). Bài kiểm tra mới ở `e2e/giao-dien-loi-nhan.spec.ts`.

## Review Focus

1. Gửi lời nhắn hai lần (bấm đúp, Enter hai lần) hoặc mở hộp thoại chồng nhau (Task 2).
2. Chọn "Giờ khác" rồi đổi ngày, dịch vụ, bé: nút và câu cố định phải theo đúng lựa chọn hiện tại, không kẹt ở trạng thái gọi (Task 4).
3. Đổi sang ngày lễ khi đã chọn khung 18–20 hoặc 20–21, rồi đổi lại ngày thường (Task 1, 4).
4. Khối lời nhắn của nhân viên: rỗng, rất dài, tên và nội dung dài không tách từ, hai người cùng bấm "Đã gọi lại" (Task 5).
5. "Hỏi mua" với tên sản phẩm 60 ký tự trở lên hoặc có ký tự đặc biệt (Task 2).
6. Nhân viên đăng nhập mở hộp thoại ở trang giới thiệu: bị từ chối đúng câu của hệ thống (Task 2).

## Cấu trúc tệp

- Tạo: `src/features/public/inquiry/inquiryView.ts` (+ `inquiryView.test.ts`), `InquiryDialog.tsx`, `Inquiry.module.css`; `src/features/staff/requests/InquiryQueue.tsx`; `e2e/giao-dien-loi-nhan.spec.ts`.
- Sửa: `src/features/public/home/sections/Products.tsx`, `Contact.tsx`, `Services.tsx`; `src/features/booking/BookingForm.tsx` (+ `BookingForm.module.css` nếu cần); `src/features/staff/requests/RequestsPage.tsx`; `e2e/booking.spec.ts`/`giao-dien-cong-khai.spec.ts` nếu một bài cũ phụ thuộc chữ đã đổi.
- Docs: `docs/thiet-ke/QUYET-DINH.md` (R49), `PROGRESS.md`, `README.md`, `docs/tham-khao/bang-kiem-thu-nghiep-vu-2026-10-21.md`.

---

### Task 1: logic thuần

**Files:** Create `src/features/public/inquiry/inquiryView.ts`, `inquiryView.test.ts`.

**Interfaces — Produces (dùng ở Task 2–5):**
- `INQUIRY_MAX = { name: 60, text: 500, about: 60 }`.
- `slotView(slot: string, date: string, holidays: readonly string[]): { slots: TimeSlot[]; outOfHours: boolean; holidayNote: string | null; slotDropped: boolean }` — `slots` = `slotsOn(date, holidays)` (từ `@/data/rules/booking`); `outOfHours` = `slot === OUT_OF_HOURS_SLOT`; `holidayNote` = "Ngày này Lê Sơn làm đến 19:00." khi `date` nằm trong `holidays`, ngược lại `null`; `slotDropped` = `slot` là một khung thường nhưng không còn nằm trong `slots`.
- `SLOT_DROPPED_MSG = 'Khung giờ đã được bỏ chọn vì ngày này Lê Sơn làm đến 19:00.'`.
- `counter(text: string, max: number): string` → "x/max" (độ dài sau `trim`).

- [ ] **Step 1: Viết `inquiryView.test.ts` (thất bại).** Ca: ngày thường `slotView('18-20','2026-10-27',[])` → `slots` có đủ 7 khung, `outOfHours:false`, `holidayNote:null`, `slotDropped:false`; ngày lễ `slotView('18-20','2026-10-26',['2026-10-26'])` → `slots` không có `18-20` và `20-21`, `holidayNote` đúng chữ, `slotDropped:true`; ngày lễ + `'10-12'` → `slotDropped:false`; `slotView('other', …)` → `outOfHours:true`, `slotDropped:false`; `slotView('', …)` → cả hai `false`; `counter('  abc ', 500)` = `'3/500'`; `INQUIRY_MAX`.
- [ ] **Step 2: Chạy `npx vitest run src/features/public/inquiry/inquiryView.test.ts`.** Expected: FAIL (chưa có module).
- [ ] **Step 3: Viết `inquiryView.ts`** theo Interfaces.
- [ ] **Step 4: Chạy lại.** Expected: PASS. **Step 5:** `npm run typecheck && npm run lint`; commit `feat: inquiry view logic`.

---

### Task 2: hộp thoại lời nhắn + nút "Hỏi mua"

**Files:** Create `InquiryDialog.tsx`, `Inquiry.module.css`, `e2e/giao-dien-loi-nhan.spec.ts`; Modify `sections/Products.tsx`.

**Interfaces:**
- Consumes: `inquiries` từ `@/data/public`; `Dialog`, `Field`, `Input`, `Textarea`, `Button`, `Counter` từ `@/ui`; `useSession`; `ValidationError`, `ForbiddenError` từ `@/data/contracts/errors`; `INQUIRY_MAX`, `counter` (Task 1).
- Produces: `InquiryDialog({ open, onClose, about }: { open: boolean; onClose: () => void; about?: string })`; `inquiryAction(about?: string)` trong `Products.tsx` đổi thành `{ kind: 'message'; about?: string }`.

- [ ] **Step 1: Viết e2e thất bại** (`describe('hộp thoại lời nhắn')`, mở từ "Hỏi mua" của sản phẩm đầu): nút "Hỏi mua" là `button` (không còn liên kết `tel:`) và có `aria-label` "Hỏi mua: <tên>"; bấm mở hộp thoại tên "Để lại lời nhắn" có dòng "Bạn hỏi về: <tên>", lời dẫn có "08:00–21:00"; gửi trống → lỗi dưới ô tên, số, lời nhắn (nguyên văn từ hệ thống) và focus về ô lỗi đầu; số "123" báo lỗi ở ô số; gõ 20 ký tự thì bộ đếm "20/500"; điền đủ → bấm "Gửi lời nhắn" → thấy "Đã gửi. Lê Sơn sẽ gọi lại cho bạn." và nút "Đóng"; bấm đúp "Gửi lời nhắn" chỉ tạo **một** lời nhắn (kiểm bằng `__lesonDemo.api` đăng nhập `quanly_ha` và đọc `staff.inquiries.list()` đếm theo nội dung); gửi lại đúng nội dung khi dòng trước chưa xử lý vẫn báo "Đã gửi" nhưng không tạo thêm; bốn lời nhắn khác nhau từ một số trong một ngày → lần thứ tư báo lỗi ở ô lời nhắn có chữ hotline; `Esc` đóng và focus về đúng nút "Hỏi mua" đã bấm; khách `lan_nguyen` mở thì ô tên đã có tên; nhân viên `quanly_ha` mở thì gửi → thấy câu "Bạn đang đăng nhập bằng tài khoản nhân viên. Lời nhắn này dành cho khách." ở dạng lỗi chung; sản phẩm có tên dài 70 ký tự (tạo qua `staff.content.products.create`) → dòng "Bạn hỏi về" cắt còn 60 ký tự và gửi không lỗi `about`; 320 px không cuộn ngang và axe sạch khi mở (`@a11y @narrow`, chờ `opacity: 1`).
- [ ] **Step 2: Chạy.** Expected: FAIL.
- [ ] **Step 3: Viết `InquiryDialog.tsx`**: giữ `version` không cần; trạng thái `phase: 'form' | 'sending' | 'sent'`; ref chặn bấm đúp; `ValidationError.fields` ánh xạ theo ô (khóa lạ vào lỗi chung); `ForbiddenError` → lỗi chung bằng `message` của nó; tên điền sẵn từ `me.name` khi `me?.kind === 'customer'`; `about` cắt `slice(0, INQUIRY_MAX.about)` khi gửi; thành công thì nội dung đổi, không giữ bản nháp khi đóng (key theo `open`). **Sửa `Products.tsx`:** nút "Hỏi mua" thành `Button` mở dialog (state ở `Product`), `inquiryAction` trả `{ kind: 'message', about: item.name }`.
- [ ] **Step 4: Chạy lại e2e này + `giao-dien-gioi-thieu.spec.ts` (bài cũ "Hỏi mua gọi hotline" phải đổi theo: sửa thành kiểm tra mở hộp thoại).** Expected: PASS. **Step 5: Commit** `feat: leave-a-message dialog and Hỏi mua`.

---

### Task 3: nút "Để lại lời nhắn" ngoài giờ ở trang giới thiệu

**Files:** Modify `sections/Contact.tsx`, `sections/Services.tsx`; Test `e2e/giao-dien-loi-nhan.spec.ts`.

**Interfaces:** Consumes `InquiryDialog` (Task 2), `useHospitalHours` (6A).

- [ ] **Step 1: Viết e2e thất bại.** Ngoài giờ (đồng hồ `2026-10-26T21:30:00+07:00`, `remountHome`): trong `#lien-he [data-contact-cta]` có "Gọi 097 355 51 05" **và** nút "Để lại lời nhắn" mở hộp thoại (không có dòng "Bạn hỏi về"); trong `#dich-vu [data-services-cta]` có nút liên kết chữ "để lại lời nhắn" mở hộp thoại; trong giờ (14:00) cả hai chỗ **không** có nút lời nhắn; gửi từ cuối trang ngoài giờ thành công.
- [ ] **Step 2: Chạy.** Expected: FAIL. **Step 3: Viết:** mỗi chỗ giữ một `useState` mở hộp thoại; `Services` dòng nhỏ ngoài giờ: "Chưa chắc chọn dịch vụ nào? Lê Sơn sẽ tư vấn khi gọi lại, hoặc bạn có thể " + nút dạng liên kết "để lại lời nhắn" + ".".
- [ ] **Step 4: Chạy** các e2e đã nêu và `giao-dien-gioi-thieu.spec.ts`. Expected: PASS. **Step 5: Commit** `feat: leave a message when closed`.

---

### Task 4: trang đặt lịch: giờ khác và ngày lễ

**Files:** Modify `src/features/booking/BookingForm.tsx`; Test `e2e/giao-dien-loi-nhan.spec.ts`, và sửa `e2e/booking.spec.ts`/`e2e/giao-dien-cong-khai.spec.ts` nếu một bài phụ thuộc danh sách tùy chọn khung giờ.

**Interfaces:** Consumes `slotView`, `SLOT_DROPPED_MSG` (Task 1), `bookings.holidays()`, `OUT_OF_HOURS_SLOT`, `TIME_SLOT_CHOICE_LABEL` (từ `@/data/contracts/enums`), `BOOKING_MSG.outOfHours`, `InquiryDialog` (Task 2).

- [ ] **Step 1: Viết e2e thất bại** (trang `/dat-lich`, khách vãng lai, và một ca cho `lan_nguyen` ở `/khach-hang/dat-lich`): ô "Khung giờ" có thêm lựa chọn cuối "Giờ khác (ngoài giờ làm việc)"; chọn nó → ngay lập tức (không bấm Gửi) hiện nguyên văn "Ngoài giờ làm việc (08:00–21:00), bạn cần gọi hotline 097 355 51 05 trước nhé."; nút "Gửi yêu cầu" biến mất, thay bằng liên kết "Gọi 097 355 51 05" (`tel:+84973555105`) và nút "Để lại lời nhắn" mở hộp thoại; các ô đã điền (tên, số, bé, ghi chú) còn nguyên; chọn lại "10:00–12:00" → "Gửi yêu cầu" trở lại và gửi được; chọn "Giờ khác" rồi đổi ngày/dịch vụ → vẫn ở trạng thái gọi cho tới khi đổi khung; **ngày lễ** (thêm ngày lễ cho ngày mai qua `__lesonDemo.api.staff.settings.update`, đăng nhập `quanly_ha` rồi đăng xuất): chọn ngày đó thì danh sách khung **không** có "18:00–20:00" và "20:00–21:00" (đúng nhãn hiện có) và có dòng "Ngày này Lê Sơn làm đến 19:00."; khách đã chọn "18:00–20:00" ở ngày thường rồi đổi sang ngày lễ → ô về "Không chọn" và có dòng `SLOT_DROPPED_MSG`; đổi lại ngày thường thì đủ khung; ngày thường không có ghi chú; 320 px không cuộn ngang; axe sạch.
- [ ] **Step 2: Chạy.** Expected: FAIL. **Step 3: Viết:** `useQuery(() => bookings.holidays(), [])` trong form; dùng `slotView(values.preferred_slot, values.desired_date, holidays)` để dựng danh sách `<option>` (thêm lựa chọn `OUT_OF_HOURS_SLOT`), dòng ghi chú ngày lễ và câu cố định (`role="status"`); khi `slotDropped` thì `set('preferred_slot','')` một lần và hiện `SLOT_DROPPED_MSG`; khi `outOfHours` thì khối nút Gửi thay bằng liên kết gọi + nút mở `InquiryDialog`; `onSubmit` không chạy khi `outOfHours`. Giữ nguyên mọi phần còn lại của form.
- [ ] **Step 4: Chạy** `giao-dien-loi-nhan.spec.ts`, `booking.spec.ts`, `giao-dien-cong-khai.spec.ts`, `a11y.spec.ts`. Expected: PASS. **Step 5: Commit** `feat: out-of-hours choice and holidays on the booking form`.

---

### Task 5: khối "Lời nhắn của khách" cho nhân viên

**Files:** Create `src/features/staff/requests/InquiryQueue.tsx`; Modify `RequestsPage.tsx`; Test `e2e/giao-dien-loi-nhan.spec.ts`.

**Interfaces:** Consumes `staff.inquiries.list({status?})`, `staff.inquiries.markCalled(id, version)`, `StaffInquiryRow`, `INQUIRY_STATUS_LABEL`, `useSession().can`, `formatPhoneVi`, `useToast`, `saveError` (`../ui`), `ConflictError`.

- [ ] **Step 1: Viết e2e thất bại** (`describe('lời nhắn cho nhân viên')`): khách vãng lai để lại lời nhắn (qua hộp thoại), rồi `quanly_ha` mở `/nv/yeu-cau` thấy khối "Lời nhắn của khách" với số chờ, dòng có tên, số điện thoại là liên kết `tel:+84…`, nội dung và (nếu có) "Hỏi mua: <tên>"; `bacsi_mai` cũng thấy; `spa_ngocanh` **không** thấy khối (không có phần tử trong DOM); bấm "Đã gọi lại" → dòng chuyển khỏi "Chờ gọi lại", sang "Đã gọi lại" kèm tên người gọi, toast báo; hai tab cùng bấm một dòng → tab sau thấy toast "vừa được người khác cập nhật" và dòng cập nhật đúng; lời nhắn quá hạn (đặt `__lesonDemo.setNow` sau `request_overdue_hours`) có thẻ "Quá hạn"; không có lời nhắn nào chờ và chưa mở "Đã gọi lại" → không có khối; tên và nội dung 80 ký tự không khoảng trắng không tràn khung ở 320 px; axe sạch; trang `/nv/yeu-cau/:id` (đang xem chi tiết) không hiện khối (như khối đổi lịch).
- [ ] **Step 2: Chạy.** Expected: FAIL. **Step 3: Viết `InquiryQueue.tsx`** theo mẫu `RescheduleQueue.tsx`: `useQuery` đọc hai trạng thái; `can('requests.handle')` mới đọc; ẩn khi rỗng; lọc hai nút "Chờ gọi lại" / "Đã gọi lại" (nhóm nút có nhãn, `aria-pressed`); mỗi dòng dùng `overflow-wrap: anywhere`; `markCalled` bắt `ConflictError` bằng `saveError`. Gắn vào `RequestsPage.tsx` dưới `<RescheduleQueue />`, chỉ khi `!id`.
- [ ] **Step 4: Chạy** e2e này + `giao-dien-nhan-vien-a.spec.ts` (trang Yêu cầu). Expected: PASS. **Step 5: Commit** `feat: visitor messages queue for staff`.

---

### Task 6: tài liệu và kiểm tra toàn bộ

- [ ] **Step 1: Tài liệu.** `QUYET-DINH.md` R49 (hộp thoại lời nhắn dùng chung ở ba nơi; ngoài giờ trên trang đặt lịch đổi nút gửi thành nút gọi; ngày lễ lọc khung đến 19:00 kèm ghi chú; khối Lời nhắn cho nhân viên có quyền xử lý yêu cầu; chưa làm: chat, lịch sử lời nhắn cho khách, nhắc việc trên Tổng quan, phụ phí lễ); `PROGRESS.md` (6B xong; việc tiếp 6C, 6D, rồi gửi HTML; xóa mục "Yêu cầu" đã xong nếu còn); `README.md` hàng trạng thái; bảng kiểm thử nghiệp vụ mục "Lời nhắn và đặt lịch ngoài giờ (phần 6B)".
- [ ] **Step 2: Chạy `npm run verify`** ở nền (khoảng 25 phút; **không chạy lúc 00:00–03:00 giờ Việt Nam** vì 4 bài khu khách đỏ do dữ liệu mẫu; không chạy Playwright khác song song). Expected: exit 0.
- [ ] **Step 3: Commit** `docs: part 6B messages and out-of-hours booking`.

---

## Tự rà kế hoạch

- **Phủ spec 6B:** hộp thoại → Task 2; ba chỗ mở → Task 2, 3, 4; trang đặt lịch giờ khác + ngày lễ → Task 1, 4; khối nhân viên → Task 5; tài liệu → Task 6.
- **Nhất quán tên:** `slotView`, `SLOT_DROPPED_MSG`, `INQUIRY_MAX`, `counter`, `InquiryDialog`, `inquiryAction`, `InquiryQueue` dùng đúng tên từ Task 1 đến 6.
- **Chênh với spec (ghi sổ khi chạy):** tên API nhân viên để thêm ngày lễ trong e2e lấy từ `src/data/contracts/staff.ts`; nếu số bộ đếm hay nhãn khung giờ khác, dùng chữ thật trong mã và ghi quyết định.
- **Số quyết định tiếp theo:** R49.
