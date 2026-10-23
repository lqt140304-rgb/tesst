# Phần 6C — Màn "Nội dung trang giới thiệu": kế hoạch thực hiện

> **Cho người thực hiện:** dùng superpowers:executing-plans (làm trong phiên này) hoặc superpowers:subagent-driven-development. Các bước dùng ô `- [ ]`. TDD: viết bài kiểm tra thất bại trước, xem nó thất bại, rồi mới viết mã.

**Mục tiêu:** người có quyền `content.publish` tự thêm, sửa, ẩn/hiện, xóa sản phẩm nổi bật và câu chuyện điều trị (kể cả ảnh) ở một màn riêng; thay đổi hiện ngay ở trang giới thiệu công khai.

**Kiến trúc:** một trang `ContentPage` với hai thẻ nằm trong địa chỉ; logic thuần (`contentView.ts`) có test đơn vị; bảng dùng `DataTable` như Bảng giá; hộp thoại Thêm/Sửa dùng `Dialog`, `Field`, hook `useSave` của Cài đặt; ảnh qua `staff.content.*.setImage` và `useFeaturedImage` (6A) để xem. Dữ liệu chỉ qua `@/data/staff` (`staff.content`) và `@/data/rules/content`.

**Công nghệ:** React 19, CSS Modules, Vitest, Playwright. Không thêm thư viện.

**Thiết kế:** `docs/superpowers/specs/2026-10-23-phan-6c-noi-dung-trang-gioi-thieu-design.md` (đã duyệt 23/10/2026).

## Ràng buộc chung

- Chữ tiếng Việt, gọi người dùng là "bạn"; câu lỗi của hệ thống hiện nguyên văn dưới đúng ô (`ValidationError.fields`: `name`, `category`, `note`, `title`, `story`, `petName`, `species`, `consent`, `file`); không gạch ngang dài trong chữ mới.
- Quyền: mục menu và trang chỉ cho `can('content.publish')`; ẩn (không làm xám) khi không có; vào thẳng địa chỉ thì ra trang "chưa có quyền" như các màn khác (`handle.cap` trong `router.tsx`).
- Ghi dữ liệu mang `version` đã đọc; `ConflictError` → toast `saveError(e)`, đóng hộp thoại, danh sách tải lại. Không đọc store trực tiếp; không `localStorage`.
- Trợ năng: bàn phím, nhãn cho trình đọc màn hình, tương phản ≥ 4,5:1, 320 px không cuộn ngang, `Dialog` hiện có (Esc, bẫy focus, trả focus); nút Ẩn/Hiện/Xóa có `aria-label` nêu rõ mục.
- Không sửa `src/data`. Không có ô giá. Không thêm sắp xếp, hẹn giờ, nhiều ảnh, trang chi tiết.
- Bài kiểm tra mới ở `e2e/giao-dien-noi-dung.spec.ts`; ngày giờ không phụ thuộc giờ thật; **không chạy `npm run verify` lúc 00:00–03:00 giờ Việt Nam**; không chạy Playwright song song.
- Chạy e2e: `npm run build && npx playwright test <tệp> --project=desktop-1440` (build lại trước khi chạy).

## Review Focus

1. Lưu chữ thành công nhưng ảnh lỗi: hộp thoại ở lại chế độ Sửa, bấm Lưu lần nữa không tạo mục thứ hai (Task 3, 5).
2. Chọn ảnh rồi đổi ý hoặc chọn nhiều lần liên tiếp: URL xem trước được thu hồi, không ảnh cũ nhảy vào mục mới (Task 3).
3. Mục đang ẩn có ảnh: người có quyền thấy ảnh trong danh sách, khách không thấy mục lẫn ảnh (Task 3, 4).
4. Người mất quyền `content.publish` giữa chừng: màn đang mở không sập, thao tác tiếp theo báo lỗi (Task 5).
5. Câu chuyện 600 ký tự, tên có ký tự đặc biệt hoặc rất dài không tách từ: bảng, hộp thoại và trang công khai không vỡ khung (Task 4, 5).
6. Bấm Hiện/Ẩn liên tiếp nhanh; xóa mục đang mở trong hộp thoại ở tab khác (Task 3, 5).

## Cấu trúc tệp

- Tạo: `src/features/staff/content/contentView.ts` (+ `contentView.test.ts`), `ContentPage.tsx`, `ProductsTab.tsx`, `CasesTab.tsx`, `ProductDialog.tsx`, `CaseDialog.tsx`, `ImageField.tsx`, `DeleteDialog.tsx`, `Content.module.css`; `e2e/giao-dien-noi-dung.spec.ts`.
- Sửa: `src/app/routes.ts` (`nv.content`, bí danh `nv-trang-gioi-thieu`), `src/app/router.tsx`, `src/features/staff/index.tsx`, `src/features/staff/shell/StaffShell.tsx` (NAV), `src/features/staff/settings/settingsView.ts` (nhóm "Nội dung") và `settingsView.test.ts`, `e2e/manifest.ts`.
- Docs: `docs/thiet-ke/QUYET-DINH.md` (R50, kiểm tra số trước khi ghi), `PROGRESS.md`, `README.md`, `docs/tham-khao/bang-kiem-thu-nghiep-vu-2026-10-21.md`.

---

### Task 1: logic thuần

**Files:** Create `contentView.ts`, `contentView.test.ts`.

**Interfaces — Produces (dùng ở Task 2–5):**
- `type ContentTab = 'san-pham' | 'cau-chuyen'`; `contentTab(raw: string | null): ContentTab` (khác `'cau-chuyen'` thì `'san-pham'`).
- `usedText(used: number, max = FEATURED_MAX): string` → "Đã dùng 4/30 mục" (`FEATURED_MAX` từ `@/data/rules/content`).
- `imageProblem(file: { type: string; size: number }): string | null` → `CONTENT_MSG.notImage` khi không bắt đầu bằng `image/`, `CONTENT_MSG.tooBig` khi `size > FEATURED_IMAGE_MAX_BYTES`, ngược lại `null`.
- `consentLine(row: { consentByName: string; consentAt: string }): string` → "Chủ nuôi đồng ý: <tên>, <ngày>" (dùng `formatDateVi`; thời gian hỏng thì bỏ phần ngày).
- `updatedLine(row: { updatedByName: string; updatedAt: string }): string` → "<tên> · <HH:MM dd/mm/yyyy>" (dùng `whenText` ở `../requests/inquiryWhen`; thời gian hỏng thì chỉ có tên).
- `PRODUCT_LIMITS = { name: 60, note: 120 }`, `CASE_LIMITS = { title: 80, story: 600, petName: 30 }`.

- [ ] **Step 1: Viết `contentView.test.ts` (thất bại).** Ca: `contentTab(null)`, `contentTab('xyz')` → `'san-pham'`; `contentTab('cau-chuyen')`; `usedText(4)` = `'Đã dùng 4/30 mục'`; `imageProblem({type:'application/pdf',size:1})` = `CONTENT_MSG.notImage`; `imageProblem({type:'image/png',size:5*1024*1024+1})` = `CONTENT_MSG.tooBig`; `imageProblem({type:'image/webp',size:100})` = `null`; `consentLine` có tên và ngày, và với `consentAt:''` chỉ còn "Chủ nuôi đồng ý: <tên>"; `updatedLine` tương tự với thời gian hỏng; các giới hạn đúng số.
- [ ] **Step 2: Chạy `npx vitest run src/features/staff/content/contentView.test.ts`.** Expected: FAIL (chưa có module).
- [ ] **Step 3: Viết `contentView.ts`** theo Interfaces. **Step 4: Chạy lại.** Expected: PASS. **Step 5:** `npm run typecheck && npm run lint`; commit `feat: content view logic`.

---

### Task 2: đường dẫn, menu, khung trang, nhóm quyền

**Files:** Create `ContentPage.tsx`, `Content.module.css`; Modify `routes.ts`, `router.tsx`, `index.tsx`, `StaffShell.tsx`, `settingsView.ts`, `settingsView.test.ts`, `e2e/manifest.ts`; Test `e2e/giao-dien-noi-dung.spec.ts`.

**Interfaces:** Consumes `contentTab`, `usedText` (Task 1), `staff.content.products.list()` / `cases.list()` (số mục cho bộ đếm và nhãn thẻ), `Tabs`, `PageHeader`. Produces `ContentPage` với vùng thẻ `role="tabpanel"` id `noi-dung-<tab>-panel`; `ProductsTab` và `CasesTab` ở Task 3 và 4 (ở task này là khung trống có tiêu đề).

- [ ] **Step 1: Viết e2e thất bại** (`describe('khung màn')`): Quản lý và `bacsi_mai` thấy mục menu "Trang giới thiệu" (trên điện thoại trong "Thêm"), `spa_ngocanh` không thấy; Spa vào thẳng `#/nv/trang-gioi-thieu` thì thấy trang "chưa có quyền" (không có tiêu đề màn); sau khi cấp lẻ `content.publish` cho Spa qua `__lesonDemo.api.staff.team.update` thì Spa thấy mục menu và mở được (khôi phục sau test không cần vì mỗi bài thử có kho riêng); trang có `h1` "Nội dung trang giới thiệu", hai thẻ "Sản phẩm" và "Câu chuyện", `?tab=cau-chuyen` mở thẻ Câu chuyện và `aria-selected`; đổi thẻ đổi địa chỉ; mục menu được đánh dấu đang chọn; liên kết "Xem trang giới thiệu" có `target="_blank"` và `rel="noopener noreferrer"`; màn Tài khoản nhân viên (Quản lý mở một nhân viên) có nhóm quyền "Nội dung" chứa "Đăng nội dung trang giới thiệu" và nhóm "Báo cáo và cài đặt" không còn nó; `settingsView.test.ts` vẫn bắt mỗi quyền nằm trong đúng một nhóm.
- [ ] **Step 2: Chạy.** Expected: FAIL. **Step 3: Viết:** `paths.nv.content = '/nv/trang-gioi-thieu'` (+ bí danh), route `trang-gioi-thieu` với `handle: { pageKey: 'nv.content', title: 'Nội dung trang giới thiệu', cap: 'content.publish' }`, export `ContentPage as StaffContent`, NAV `{ key:'content', to, label:'Trang giới thiệu', icon:'image', cap:'content.publish' }` sau `prices` và trước `reports`; `settingsView.ts` thêm nhóm `{ key:'noidung', label:'Nội dung', caps:['content.publish'] }` và bỏ quyền khỏi `baocao`, sửa `settingsView.test.ts` cho khớp; `ContentPage` có `PageHeader`, `Tabs` (nhãn "Mục của nội dung trang giới thiệu", `idPrefix="noi-dung"`), liên kết ngoài "Xem trang giới thiệu", và hai khung thẻ tạm; thêm `nv-trang-gioi-thieu` vào `manifest.ts` (as `quanly_ha`).
- [ ] **Step 4: Chạy** e2e này, `giao-dien-nhan-vien-c.spec.ts` (menu), `giao-dien-nhan-vien-g.spec.ts` (Tài khoản nhân viên, nhóm quyền) và `npx vitest run`. Expected: PASS. **Step 5: Commit** `feat: content screen frame, menu and permission group`.

---

### Task 3: tab Sản phẩm (danh sách, hộp thoại, ảnh, ẩn/hiện, xóa)

**Files:** Create `ProductsTab.tsx`, `ProductDialog.tsx`, `ImageField.tsx`, `DeleteDialog.tsx`; Modify `ContentPage.tsx`, `Content.module.css`; Test `e2e/giao-dien-noi-dung.spec.ts`.

**Interfaces:**
- Consumes: Task 1; `staff.content.products` (`list`, `create`, `update`, `setVisible`, `remove`, `setImage`); `useSave` từ `../settings/useSave`; `useFeaturedImage` từ `@/features/public/home/useFeaturedImage`; `FEATURED_CATEGORY_LABEL`, `FEATURED_CATEGORIES`; `DataTable`, `Dialog`, `Field`, `Input`, `Select`, `Textarea`, `Button`, `MiniTag`.
- Produces: `ImageField({ imageKey, onChange, error }: { imageKey?: string; onChange: (f: File | null | undefined) => void; error?: string })` (xem trước, "Gỡ ảnh", báo lỗi tệp tức thì bằng `imageProblem`, thu hồi URL xem trước); `DeleteDialog({ open, onClose, name, onConfirm })`; `ProductDialog({ open, onClose, row? })`; dùng lại ở Task 4.

- [ ] **Step 1: Viết e2e thất bại** (`describe('sản phẩm')`, Quản lý): bảng có đúng 4 dòng mẫu (1 đang ẩn "Dây dắt chó cỡ vừa (mẫu)"), mỗi dòng có thẻ "Nội dung mẫu", bộ đếm "Đã dùng 4/30 mục"; **Thêm sản phẩm** "Hạt cho mèo con" nhóm Thức ăn ghi chú "Túi 400 g" (không bị coi là liều) → thấy dòng mới, đếm 5/30, và ở trang công khai `/` đoạn `#san-pham` có thẻ mới; thêm có ảnh (tệp PNG nhỏ tạo trong bài thử) → ảnh nhỏ trong bảng và ảnh trong thẻ công khai (`img[alt="Hạt cho mèo con"]`); ô trống tên báo "Tên cần từ 1 đến 60 ký tự."; ghi chú có "Nguyễn Văn An 0912345678" báo đúng câu số điện thoại hoặc họ tên; ghi chú có tên thuốc kèm liều báo `CONTENT_MSG.medicine`; tệp PDF chọn làm ảnh báo "Tệp này không phải ảnh. Bạn chọn tệp JPG, PNG hoặc WebP nhé." ngay khi chọn và nút Lưu vẫn lưu được phần chữ; **Ẩn** một dòng (không hỏi) → dòng thành "Đang ẩn", biến mất khỏi trang công khai; **Hiện lại** → quay lại; mục ẩn có ảnh vẫn hiện ảnh trong bảng cho nhân viên nhưng không có ở `public.featured.products()`; **Sửa** mục mẫu → mất nhãn "Nội dung mẫu"; **Xóa** → hộp thoại hỏi lại nói rõ xóa hẳn, "Để sau" giữ nguyên, "Xóa" bỏ dòng; chọn ảnh nhiều lần liên tiếp chỉ giữ ảnh cuối (số `blob:` URL xem trước còn sống ≤ 1, kiểm bằng `performance`/đếm thẻ `img`); sau khi đóng hộp thoại không còn `blob:` xem trước; Spa không có quyền không thấy gì (đã ở Task 2).
- [ ] **Step 2: Chạy.** Expected: FAIL. **Step 3: Viết** các tệp theo Interfaces: bảng dùng `DataTable` (`caption` "Sản phẩm nổi bật", `noun` "sản phẩm"), cột ảnh nhỏ (`useFeaturedImage`, khung "Ảnh minh họa" khi không có), tên + ghi chú, nhóm, trạng thái, `updatedLine`; nút theo dòng có `aria-label` ("Sửa <tên>", "Ẩn <tên>", "Hiện lại <tên>", "Xóa <tên>"); `ProductDialog` dùng `useSave`, gửi `create`/`update` (không gửi `priceVnd`), rồi `setImage` với `version` mới đọc lại từ `list()` khi có tệp mới hoặc "Gỡ ảnh"; lỗi ảnh sau khi lưu chữ → câu "Đã lưu nội dung, nhưng ảnh chưa tải được: <lý do>", hộp thoại chuyển sang chế độ Sửa của mục vừa lưu; `setVisible` làm ngay, `ConflictError` → toast `saveError`; `DeleteDialog` hỏi lại; bộ đếm dùng `usedText(rows.length)`; nút Thêm đủ 30 mục thì vẫn bấm được và hiện câu của hệ thống ở hộp thoại.
- [ ] **Step 4: Chạy** e2e này + `giao-dien-gioi-thieu.spec.ts` (đoạn Sản phẩm) + `a11y.spec.ts`. Expected: PASS. **Step 5: Commit** `feat: products tab of the content screen`.

---

### Task 4: tab Câu chuyện

**Files:** Create `CasesTab.tsx`, `CaseDialog.tsx`; Modify `ContentPage.tsx`; Test `e2e/giao-dien-noi-dung.spec.ts`.

**Interfaces:** Consumes Task 1 và 3 (`ImageField`, `DeleteDialog`, `useSave`), `staff.content.cases`, `SPECIES_LABEL`. Produces `CaseDialog({ open, onClose, row? })`.

- [ ] **Step 1: Viết e2e thất bại** (`describe('câu chuyện')`): bảng có 2 dòng mẫu, mỗi dòng "Nội dung mẫu", "Chủ nuôi đồng ý: Nguyễn Thu Hà, <ngày>", bộ đếm "Đã dùng 2/30 mục"; Thêm không tích đồng ý → báo "Bạn cần xác nhận chủ nuôi đã đồng ý trước khi đăng." ở ô tích; điền đủ và tích → lưu, hiện ở trang công khai đoạn `#cau-chuyen` (tiêu đề, tên bé, loài), bấm "Đọc câu chuyện" mở đúng nội dung; **Sửa** một câu chuyện mà không tích lại → bị từ chối ở ô tích (hộp thoại luôn mở với ô tích chưa tích), tích rồi lưu thì ghi tên người sửa trong dòng đồng ý; tiêu đề quá 80, câu chuyện quá 600, tên bé quá 30 báo đúng câu (bộ đếm chặn trước, kiểm bằng gõ vượt); câu chuyện có số điện thoại, họ tên khách hay "amoxicillin 250mg" bị từ chối đúng câu; Ẩn một câu chuyện → biến khỏi trang công khai, ẩn hết hai thì đoạn `#cau-chuyen` biến mất; Hiện lại; Xóa có hỏi lại; câu chuyện 600 ký tự không khoảng trắng và tên bé dài không làm bảng hoặc hộp thoại tràn ở 320 px; ảnh như Task 3.
- [ ] **Step 2: Chạy.** Expected: FAIL. **Step 3: Viết** `CasesTab` và `CaseDialog` theo mẫu Task 3: cột ảnh, tiêu đề, tên bé + loài, trạng thái, dòng đồng ý (`consentLine`) và cập nhật (`updatedLine`); hộp thoại có Tiêu đề, Tên bé hiển thị, Loài (`Select`), Câu chuyện (`Textarea` + đếm "x/600"), ô tích "Chủ nuôi đã đồng ý cho đăng câu chuyện này" (luôn bắt đầu chưa tích), `ImageField`, dòng nhắc cố định "Đừng ghi tên thuốc, liều dùng, họ tên khách hay số điện thoại. Hệ thống sẽ từ chối." Lỗi đúng ô; `consent: true` gửi theo ô tích.
- [ ] **Step 4: Chạy** e2e này + `giao-dien-gioi-thieu.spec.ts` (đoạn Câu chuyện) + `a11y.spec.ts`. Expected: PASS. **Step 5: Commit** `feat: cases tab of the content screen`.

---

### Task 5: các ca khó

**Files:** Modify các tệp ở Task 3 và 4 theo kết quả; Test `e2e/giao-dien-noi-dung.spec.ts`.

- [ ] **Step 1: Viết e2e thất bại** (`describe('ca khó')`): đủ 30 mục (tạo qua `__lesonDemo.api.staff.content.products.create` đến 30) → bấm Thêm và Lưu thì hiện câu "Đã đủ 30 mục. Bạn xóa bớt một mục rồi thêm nhé." và không có mục thứ 31; hai tab của Quản lý cùng sửa một mục → tab sau bấm Lưu được báo "vừa được người khác cập nhật", hộp thoại đóng, danh sách đúng; ảnh lỗi sau khi lưu chữ (làm `__lesonDemo.failNextWrite()` đúng lúc tải ảnh hoặc dùng ảnh vượt 5 MB bằng API) → hộp thoại ở lại chế độ Sửa, câu "Đã lưu nội dung, nhưng ảnh chưa tải được: …", bấm Lưu lần nữa **không** tạo mục thứ hai (số dòng không tăng); người mất quyền giữa chừng (đăng nhập `quanly_ha` ở tab khác rút `content.publish` của `bacsi_mai`, kèm `bacsi_mai` đang mở màn) → thao tác kế tiếp của `bacsi_mai` báo lỗi quyền bằng toast, trang không sập, và tải lại thì ra trang "chưa có quyền"; bấm Ẩn/Hiện năm lần liên tiếp nhanh → trạng thái cuối khớp với lần bấm cuối và không có toast lỗi; xóa mục đang mở trong hộp thoại ở tab khác → Lưu báo không còn mục (hoặc cập nhật xung đột) và đóng hộp thoại; axe sạch ở danh sách và khi mở hộp thoại ở hai thẻ; 320 px không cuộn ngang ở danh sách và ở hộp thoại.
- [ ] **Step 2: Chạy.** Mỗi ca đỏ thì sửa nguyên nhân ở mã (không nới bài thử): thường là khóa nút khi đang lưu, giữ id mục sau lần lưu chữ đầu, bắt `ForbiddenError`/`NotFoundError` bằng `saveError`, `overflow-wrap: anywhere`. Expected cuối: PASS ở desktop-1440, phone-390, phone-320.
- [ ] **Step 3: Commit** `fix: hard cases of the content screen`.

---

### Task 6: tài liệu và kiểm tra toàn bộ

- [ ] **Step 1: Tài liệu.** `QUYET-DINH.md` R50 (màn "Nội dung trang giới thiệu" cho người có `content.publish`: hai thẻ, bảng, hộp thoại, ảnh, ô đồng ý của chủ nuôi tích lại mỗi lần, ẩn/hiện/xóa, 30 mục, lỗi bằng câu của hệ thống, nhóm quyền "Nội dung"; chưa làm: giá, sắp xếp, hẹn giờ, nhiều ảnh, trang chi tiết, ngày đăng); `PROGRESS.md` (6C xong; việc tiếp: chủ dự án xem lại rồi **gửi một tệp HTML**; **yêu cầu nhánh dữ liệu** thêm bài trợ giúp "Đăng sản phẩm và câu chuyện lên trang giới thiệu" nhãn "Nội dung mẫu"); `README.md` hàng trạng thái; bảng kiểm thử nghiệp vụ mục "Nội dung trang giới thiệu (phần 6C)". Kiểm tra `grep -n "R50" docs/thiet-ke/QUYET-DINH.md` trước khi ghi số.
- [ ] **Step 2: Chạy `npm run verify`** ở nền (khoảng 30 phút; ngoài 00:00–03:00 giờ Việt Nam; không chạy Playwright khác song song). Expected: exit 0.
- [ ] **Step 3: Commit** `docs: part 6C content screen`.

---

## Tự rà kế hoạch

- **Phủ spec 6C:** menu, quyền, thẻ → Task 2; bảng, hộp thoại sản phẩm, ảnh, ẩn/hiện/xóa → Task 3; câu chuyện và ô đồng ý → Task 4; lỗi, 30 mục, xung đột, ảnh lỗi, mất quyền, trợ năng, 320 px → Task 5; nhóm quyền "Nội dung" → Task 2; bài trợ giúp → Task 6.
- **Nhất quán tên:** `contentTab`, `usedText`, `imageProblem`, `consentLine`, `updatedLine`, `PRODUCT_LIMITS`, `CASE_LIMITS`, `ImageField`, `DeleteDialog`, `ProductDialog`, `CaseDialog`, `ProductsTab`, `CasesTab`, `ContentPage` dùng đúng tên từ Task 1 đến 6.
- **Chênh với spec (ghi sổ khi chạy):** nếu nhãn nút theo dòng hay số ngày khác trong mã thật, dùng chữ thật; nếu `team.update` không tên như vậy trong `src/data/contracts/staff.ts`, dùng tên thực và ghi một dòng quyết định.
- **Số quyết định tiếp theo:** R50.
