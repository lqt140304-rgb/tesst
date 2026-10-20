# PROGRESS.md — Tiến độ

Mỗi nhánh chỉ sửa **mục của mình**. Cuối phiên: cập nhật mục, rồi push. Quy trình: xem `CLAUDE.md` → "Quy trình mỗi phiên làm việc".

## Tổng quan (nhánh tích hợp `claude/focused-pascal-rfxnnp`)

Cập nhật: 20/10/2026.

**Đã xong**
- Đợt 1 (P0): trang công khai, đăng nhập, khu khách, khu nhân viên; đủ test; đã rà soát độc lập và sửa.
- Bản xem trước v3: https://claude.ai/artifact/LUkgUBhrcA1fzS8SrBnYbM (chưa có các sửa F01–F04).
- Sửa 4 lỗi từ báo cáo review (`docs/tham-khao/bao-cao-review-2026-10-20.md`): F01 hóa đơn nháp mất ô sửa giá, F02 lịch hẹn ghép theo tên bé, F03 giờ y lệnh không hợp lệ, F04 đăng ký trùng — mỗi lỗi có test tái hiện; `npm run verify` xanh (247 unit, 378 e2e).
- Thiết kế — **chủ dự án đã duyệt cả hai (20/10/2026)**:
  - `docs/superpowers/specs/2026-10-20-lam-lai-giao-dien-design.md` — làm lại giao diện theo 9 bảng mẫu, 5 phần.
  - `docs/superpowers/specs/2026-10-20-noi-tru-day-du-design.md` — nội trú đầy đủ (đã sửa: tiền theo giờ làm tròn 0,1 ngày; bé chưa có cân nặng không ghi tiền ngày; Spa có quyền nội trú). Phần màn hình (§4) sẽ theo bộ mẫu mới; video thêm giới hạn 15 giây.

**Việc chờ chủ dự án**
- Gửi ảnh dạng **tệp** (6 ảnh thú cưng + bác sĩ trưởng, ảnh bác sĩ không chữ nếu có) và 4 bảng mẫu gửi sau → lưu vào `docs/tham-khao/anh/` và `docs/tham-khao/mau-giao-dien/`.
- Danh sách dịch vụ mới cụ thể (phần 5).

---

## Nhánh `claude/giao-dien` — Làm lại giao diện

Cập nhật: 20/10/2026 (tài khoản 1).

**Đang làm:** rà soát cuối phần 1, rồi gộp vào nhánh tích hợp và đăng lại bản xem trước.

**Đã xong**
- Phần 1 — nền chung (kế hoạch `docs/superpowers/plans/2026-10-20-phan-1-nen-chung.md`), tất cả trong `@/ui`:
  - token khu làm việc (`--canvas-work`, `--surface-card`, `--line-soft`, `--r-card`, `--sh-card`, `--sel-bg`);
  - `preset(name, { reduced, index })` trong `src/ui/motion.ts` (enterList, enterPanel, tabSlide, flashOnce, chartRise, fadeSwap);
  - ảnh thú cưng: `petPhoto(key, 'avatar'|'card'|'banner')` (`src/assets/media.ts`); khóa hiện có: `meo-tam-the`, `cho-vang`, `meo-muop`; ảnh đặt vào `docs/tham-khao/anh/` tự thành khóa = tên tệp (chạy `python3 scripts/photos.py`);
  - `PetAvatar`, `PageHeader` (breadcrumb `crumbs`, `size`), `StatCard`, `SectionCard`, `DetailList`, `SaveState` + `useSaveStatus`, `DataTable` (+ `Column`), `MasterDetail`, `useListState`;
  - trang duyệt `#/_giao-dien` (chip demo → "Xem bộ giao diện");
  - ngân sách: tệp không phải ảnh ≤ 80, ảnh ≤ 60 tệp / 4 MB.
- `npm run verify` xanh (278 unit, 395 e2e).

**Việc tiếp theo**
1. Phần 2: thiết kế chi tiết (trang chủ theo mẫu, khối bác sĩ trưởng, đặt lịch 2 cột + khung giờ, đăng nhập theo mẫu) → chủ dự án duyệt → kế hoạch → làm.
2. Phần 3: khu khách theo mẫu.

**Vướng / cần nhánh kia:** khung giờ đặt lịch và "ghi nhớ đăng nhập" (phần 2) cần dữ liệu từ nhánh dữ liệu; `PetAvatar` cần `photoKey` trong dữ liệu thú cưng — trong lúc chờ dùng biểu tượng loài.

---

## Nhánh `claude/du-lieu` — Dữ liệu & chức năng

**Đang làm:** —

**Đã xong:** —

**Việc tiếp theo**
1. Thiết kế nội trú đã duyệt → viết kế hoạch §3 (dữ liệu & chức năng) vào `docs/superpowers/plans/`, rồi làm theo TDD:
   - `billableDays` (giờ ÷ 24, làm tròn lên 0,1); `lineTotal` làm tròn đồng; quyền Spa thêm `inpatient.admit` + `inpatient.share`;
   - nhập viện (tình trạng ban đầu, hóa đơn nháp + dòng tiền ngày theo loài/cân nặng; không cân nặng → không ghi), `admitOptions`, `findPets`;
   - chuyển chuồng; xuất viện (tính lại tiền ngày, lời chào tạm biệt); tải video (mẫu/từ máy, IndexedDB, ≤ 20 MB, **≤ 15 giây**); lịch sử lượt nội trú; `billing` trong `StaffStayView`.
2. `photo_key` cho `pets` / `account_pets` + `photoKey` trong dữ liệu chiếu (khách & nhân viên).
3. Dữ liệu cho phần 2–4 của thiết kế làm lại (mỗi mục cần thiết kế nhỏ được duyệt trước): khung giờ đặt lịch, ghi nhớ đăng nhập, yêu cầu đổi lịch, thêm/sửa khách hàng, phân trang danh sách, sửa/thêm bảng giá (giá cố định / linh hoạt + giá tham khảo), doanh thu theo danh mục.
4. Dữ liệu mẫu cho phân hệ mới (phần 5): Khám bệnh, Dịch vụ, Kho, Báo cáo, Cài đặt.

**Vướng / cần nhánh kia:** —

---

## Thay đổi hợp đồng dữ liệu (`src/data/contracts/`)

Nhánh dữ liệu ghi mỗi thay đổi ở đây (ngày · kiểu/hàm · mô tả). Nhánh giao diện đọc trước khi dùng.

- 20/10/2026 · `StaffInvoiceDetail.lines[]` thêm `pet_id?`, `price_mode` (sửa F01, đã có trên nhánh tích hợp).

## Yêu cầu gửi nhánh kia

- (giao-dien → du-lieu) Cần `photoKey?: string` trên thẻ thú cưng của khách (`customer.pets.list/get`) và trong dữ liệu thú cưng phía nhân viên (hồ sơ khách, nội trú, lịch hẹn).
