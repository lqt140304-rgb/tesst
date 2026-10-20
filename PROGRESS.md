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

- 20/10/2026 · Đã gộp `claude/du-lieu`: dữ liệu & chức năng nội trú đầy đủ (§3 thiết kế nội trú) — `npm run verify` xanh trên nhánh tích hợp (298 unit, 379 e2e). Màn hình làm ở phần 4 (nhánh giao diện).

**Việc chờ chủ dự án**
- Gửi ảnh dạng **tệp** (6 ảnh thú cưng + bác sĩ trưởng, ảnh bác sĩ không chữ nếu có) và 4 bảng mẫu gửi sau → lưu vào `docs/tham-khao/anh/` và `docs/tham-khao/mau-giao-dien/`.
- Danh sách dịch vụ mới cụ thể (phần 5).

---

## Nhánh `claude/giao-dien` — Làm lại giao diện

Cập nhật: 20/10/2026 (tài khoản 1).

**Đang làm:** — (phần 1 đã gộp vào nhánh tích hợp).

**Đã xong**
- Phần 1 — nền chung (kế hoạch `docs/superpowers/plans/2026-10-20-phan-1-nen-chung.md`), tất cả trong `@/ui`:
  - token khu làm việc (`--canvas-work`, `--surface-card`, `--line-soft`, `--r-card`, `--sh-card`, `--sel-bg`);
  - `preset(name, { reduced, index })` trong `src/ui/motion.ts` (enterList, enterPanel, tabSlide, flashOnce, chartRise, fadeSwap);
  - ảnh thú cưng: `petPhoto(key, 'avatar'|'card'|'banner')` (`src/assets/media.ts`); khóa hiện có: `meo-tam-the`, `cho-vang`, `meo-muop`; ảnh đặt vào `docs/tham-khao/anh/` tự thành khóa = tên tệp (chạy `python3 scripts/photos.py`);
  - `PetAvatar`, `PageHeader` (breadcrumb `crumbs`, `size`), `StatCard`, `SectionCard`, `DetailList`, `SaveState` + `useSaveStatus`, `DataTable` (+ `Column`), `MasterDetail`, `useListState`;
  - trang duyệt `#/_giao-dien` (chip demo → "Xem bộ giao diện");
  - ngân sách: tệp không phải ảnh ≤ 80, ảnh ≤ 60 tệp / 4 MB.
- Rà soát độc lập toàn nhánh: 5 lỗi quan trọng + 2 lỗi trợ năng đã sửa (lưu chồng nhau, nút trong dòng bảng, phân trang ở 320 px, tiêu điểm bàn phím khi mở/đóng chi tiết, `aria-current`, vùng thông báo lưu). `npm run verify` xanh (281 unit, 403 e2e).
- Lưu ý cho cả hai nhánh: hàm e2e `noHorizontalScroll` không phát hiện tràn ngang khi giả lập điện thoại (khung nhìn tự nới rộng) — so với `page.viewportSize().width` thay vì `innerWidth`.

**Việc tiếp theo**
1. Phần 2: thiết kế chi tiết (trang chủ theo mẫu, khối bác sĩ trưởng, đặt lịch 2 cột + khung giờ, đăng nhập theo mẫu) → chủ dự án duyệt → kế hoạch → làm.
2. Phần 3: khu khách theo mẫu.

**Vướng / cần nhánh kia:** khung giờ đặt lịch và "ghi nhớ đăng nhập" (phần 2) cần dữ liệu từ nhánh dữ liệu; `PetAvatar` cần `photoKey` trong dữ liệu thú cưng — trong lúc chờ dùng biểu tượng loài.

---

## Nhánh `claude/du-lieu` — Dữ liệu & chức năng

**Đang làm:** —

**Đã xong (20/10/2026)** — phần dữ liệu & chức năng nội trú (§3 thiết kế nội trú), kế hoạch `docs/superpowers/plans/2026-10-20-noi-tru-du-lieu.md`:
- Tiền nội trú theo giờ (làm tròn lên 0,1 ngày), gợi ý mục tiền ngày theo loài/cân nặng (không cân nặng → không ghi), thành tiền làm tròn đồng.
- Nhân viên Spa thêm quyền nhập/chuyển/xuất viện và chia sẻ (vẫn không xem hồ sơ điều trị). Đã sửa 1 test e2e cũ trong `e2e/staff-b.spec.ts` (Spa giờ thấy nút "Chia sẻ với chủ nuôi").
- Nhập viện (tình trạng ban đầu, từ lịch hẹn hôm nay, hóa đơn nháp + dòng tiền ngày 0,1), `admitOptions`, `findPets`; chuyển chuồng; xuất viện (tính lại dòng tiền ngày trên hóa đơn nháp, lời chào tạm biệt "Sẵn sàng về nhà", chọn thời điểm); `billing` trên trang lượt nội trú; lịch sử lượt nội trú.
- Tải video: video mẫu hoặc từ máy (chỉ video, ≤ 20 MB, ≤ 15 giây), lưu IndexedDB trên trình duyệt này; tự xóa 60 ngày / xóa video / khôi phục dữ liệu mẫu đều xóa tệp; dọn tệp mồ côi khi mở ứng dụng. Hook `useMediaUrls` phát được cả video mẫu và video lưu trên trình duyệt.
- Dữ liệu mẫu: cân nặng cho các bé (trừ Tôm, Xoài — để thử "Chưa ghi tiền nội trú"), mục tiền ngày cho các lượt có hóa đơn nháp, nhật ký thao tác cho các lượt nội trú mẫu.
- Ghi quyết định R33 vào `QUYET-DINH.md`, sửa bảng quyền Spa trong `proposal-staff.md`.
- Kiểm tra: unit 298 test; e2e mới `e2e/du-lieu-media.spec.ts` (IndexedDB thật trên Chromium).

- `photo_key` (20/10): `pets.photo_key?`, `account_pets.photo_key?`; `photoKey` trên mọi bé giao diện hiện. Ảnh chủ dự án gửi lưu ở `docs/tham-khao/anh/` (5 ảnh thú cưng, gán: Miu, Bông, Mochi, Mít, Na — xem README trong thư mục) và `docs/tham-khao/anh-bac-si/bac-si-truong.png`; 3 ảnh cũ: Kem `cho-vang`, Gạo `meo-tam-the` (cả bé Gạo trên web của `minh_khoa`), Mướp `meo-muop`. Miu đổi giống ghi "Mèo ta lông trắng" cho khớp ảnh.

**Việc tiếp theo**
1. Dữ liệu cho phần 2–4 của thiết kế làm lại (mỗi mục cần thiết kế nhỏ được duyệt trước): khung giờ đặt lịch, ghi nhớ đăng nhập, yêu cầu đổi lịch, thêm/sửa khách hàng (kèm cân nặng của bé), phân trang danh sách, sửa/thêm bảng giá (giá cố định / linh hoạt + giá tham khảo), doanh thu theo danh mục.
2. Dữ liệu mẫu cho phân hệ mới (phần 5): Khám bệnh, Dịch vụ, Kho, Báo cáo, Cài đặt.

**Vướng / cần chủ dự án:** — (20/10: chủ dự án giữ nguyên việc Spa được đổi "Tình trạng nội bộ"; đã ghi vào R33.)

---

## Thay đổi hợp đồng dữ liệu (`src/data/contracts/`)

Nhánh dữ liệu ghi mỗi thay đổi ở đây (ngày · kiểu/hàm · mô tả). Nhánh giao diện đọc trước khi dùng.

- 20/10/2026 · `StaffInvoiceDetail.lines[]` thêm `pet_id?`, `price_mode` (sửa F01, đã có trên nhánh tích hợp).
- 20/10/2026 · nội trú (`staff.ts`): thêm `AdmitPetOption`, `DayPriceItem`, `AdmitOptions`, `AdmitInput`, `DischargeInput`, `DischargeResult`, `StayBilling`, `StayHistoryIcon`, `StayHistoryItem`, `DemoClip`, `VideoUploadInput`.
- 20/10/2026 · `StaffInpatientApi`: thêm `admitOptions()`, `findPets(q)`, `transfer(id, version, { cage_id, reason? })`, `history(stayId)`, `videos.upload(stayId, input)`, `videos.demoClips()`, `videos.deviceUploadAvailable()`; `admit(input: AdmitInput)` nhận thêm `initial_status?`, `appointment_id?`, `invoice?: { day_price_item_id? }`; `discharge(id, version, input: DischargeInput)` nhận thêm `discharged_at?`, `farewell?` và **trả về** `{ days, invoiceUpdated }` (trước đây không trả gì).
- 20/10/2026 · `StaffStayView` thêm `billing?: StayBilling`; `StaffVideoRow` thêm `isLocal`; `CustomerVideo` (`customer.ts`) thêm `isLocal`. `duration_s` / `durationS` = **0 nghĩa là không đọc được thời lượng** → hiện "—".
- 20/10/2026 · ảnh thú cưng: thêm `photoKey?` vào `CustomerPetCard`, `CustomerStayCard` (`customer.ts`) và `StaffPet`, `StaffAppointment`, `CageTile.stay`, `StaffStayView`, `AdmitPetOption` (`staff.ts`). Là khóa ảnh, đổi ra URL bằng `petPhoto(key, size)`.
- 20/10/2026 · `api.ts`: thêm `LocalMedia`, `MediaApi` (`api.media.local(mediaKey)`). Hook mới `src/data/hooks/useMediaUrls.ts` (`useMediaUrls(mediaKey) → { urls?, loading, missing }`). Quy tắc dùng chung: `src/data/rules/stay-billing.ts` (`billableDays`, `formatDaysVi`, `suggestDayItemCode`), `src/data/rules/video-upload.ts` (`videoFileProblem`, giới hạn, câu lỗi, `isLocalKey`).

## Yêu cầu gửi nhánh kia

- (du-lieu → giao-dien, 20/10/2026) Ảnh chủ dự án đã có trong `docs/tham-khao/anh/` (5 ảnh thú cưng): chạy `python3 scripts/photos.py` để tạo `pet-<khóa>-*.webp` — dữ liệu mẫu đã dùng các khóa `meo-trang-ngu`, `poodle-nau-xe`, `poodle-nau-chuong`, `pom-trang`, `meo-trang-gang-tay` (chưa có tệp ảnh thì `PetAvatar` vẫn hiện biểu tượng loài). Ảnh bác sĩ trưởng ở `docs/tham-khao/anh-bac-si/bac-si-truong.png` (có chữ in sẵn — xem README) cho khối bác sĩ trưởng ở phần 2. Kiểm tra lại ngân sách ảnh (≤ 60 tệp / 4 MB).

- (du-lieu → giao-dien, 20/10/2026) Dữ liệu nội trú đầy đủ đã sẵn (xem "Thay đổi hợp đồng"). Khi làm phần 4: hộp thoại Nhập viện / Chuyển chuồng / Xuất viện / Tải video lên và tab "Lịch sử" theo §4 thiết kế nội trú + bộ mẫu; thay mọi chỗ dùng `mediaFor` (StayPage, VideoDialog, VideosTab) bằng `useMediaUrls` để phát được video `local:`; chip "Chỉ lưu trên trình duyệt này" khi `isLocal`; hiện "—" khi thời lượng = 0; Spa giờ thấy nút nhập/xuất viện và chia sẻ (theo `can()` sẵn có). Kiểm tra tệp trước khi gửi có thể dùng `videoFileProblem`; hiện tiền ngày bằng `billableDays` + `formatDaysVi`. Tệp mẫu WebM cho e2e: `e2e/fixtures/tiny.webm`.

- ~~(giao-dien → du-lieu) Cần `photoKey?: string` …~~ — đã xong 20/10 (xem "Thay đổi hợp đồng").
