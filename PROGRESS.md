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
- 21/10/2026 · Đã gộp `claude/du-lieu`: dữ liệu khu khách phần 3 (cân nặng, tình trạng chung, đổi lịch, chuông cập nhật, ngày của nhật ký/video) — `npm run verify` xanh (362 unit, 433 e2e). Nhánh giao diện có thể bật các cờ `DATA_READY` khi làm màn hình phần 3.

**Việc chờ chủ dự án**
- Gửi ảnh dạng **tệp** (6 ảnh thú cưng + bác sĩ trưởng, ảnh bác sĩ không chữ nếu có) và 4 bảng mẫu gửi sau → lưu vào `docs/tham-khao/anh/` và `docs/tham-khao/mau-giao-dien/`.
- Danh sách dịch vụ mới cụ thể (phần 5).

---

## Nhánh `claude/giao-dien` — Làm lại giao diện

Cập nhật: 20/10/2026 (tài khoản 1).

**Đang làm:** — (phần 1 và phần 2 đã gộp vào nhánh tích hợp).

**Đã xong**
- Phần 1 — nền chung (kế hoạch `docs/superpowers/plans/2026-10-20-phan-1-nen-chung.md`), tất cả trong `@/ui`:
  - token khu làm việc (`--canvas-work`, `--surface-card`, `--line-soft`, `--r-card`, `--sh-card`, `--sel-bg`);
  - `preset(name, { reduced, index })` trong `src/ui/motion.ts` (enterList, enterPanel, tabSlide, flashOnce, chartRise, fadeSwap);
  - ảnh thú cưng: `petPhoto(key, 'avatar'|'card'|'banner')` (`src/assets/media.ts`); khóa hiện có: `meo-tam-the`, `cho-vang`, `meo-muop`; ảnh đặt vào `docs/tham-khao/anh/` tự thành khóa = tên tệp (chạy `python3 scripts/photos.py`);
  - `PetAvatar`, `PageHeader` (breadcrumb `crumbs`, `size`), `StatCard`, `SectionCard`, `DetailList`, `SaveState` + `useSaveStatus`, `DataTable` (+ `Column`), `MasterDetail`, `useListState`;
  - trang duyệt `#/_giao-dien` (chip demo → "Xem bộ giao diện");
  - ngân sách: tệp không phải ảnh ≤ 80, ảnh ≤ 60 tệp / 4 MB.
- Rà soát độc lập toàn nhánh: 5 lỗi quan trọng + 2 lỗi trợ năng đã sửa (lưu chồng nhau, nút trong dòng bảng, phân trang ở 320 px, tiêu điểm bàn phím khi mở/đóng chi tiết, `aria-current`, vùng thông báo lưu). `npm run verify` xanh (281 unit, 403 e2e).
- Phần 2 — trang công khai, đặt lịch, đăng nhập (thiết kế `docs/superpowers/specs/2026-10-20-phan-2-cong-khai-dat-lich-dang-nhap-design.md`, kế hoạch `docs/superpowers/plans/2026-10-20-phan-2-cong-khai.md`, quyết định R34):
  - trang đặt lịch riêng `#/dat-lich` (3 bước + hotline + phiếu; `?dich-vu=` chọn sẵn dịch vụ); `BookingForm` có `bare` khi nằm trong thẻ của trang;
  - trang chủ theo mẫu: Giới thiệu (ảnh thật), Dịch vụ dạng tab + dải Cấp cứu 24/24 riêng, mục Đội ngũ (Bác sĩ trưởng Lê Thái Sơn), dải "Hẹn gặp tại Lê Sơn", tài khoản + liên hệ làm gọn; bỏ hiệu ứng nối cảnh cũ (R29–R31) và chuyển cảnh sang đăng nhập — hero giữ nguyên;
  - đăng nhập/đăng ký: cột ảnh + quỹ đạo (≥ 960 px), "Ghi nhớ đăng nhập" (chỉ khách), "Quên mật khẩu?";
  - đã nối dữ liệu của nhánh dữ liệu: khung giờ (phiếu, yêu cầu ở khu nhân viên, danh sách của khách), ghi nhớ đăng nhập, ảnh thú cưng;
  - e2e mới `e2e/giao-dien-cong-khai.spec.ts`, `e2e/width.ts` (`fitsDevice`); `npm run shots` giờ cuộn qua trang để ảnh tải chậm hiện đủ.
- Lưu ý cho cả hai nhánh: hàm e2e `noHorizontalScroll` không phát hiện tràn ngang khi giả lập điện thoại (khung nhìn tự nới rộng) — so với `page.viewportSize().width` thay vì `innerWidth`.

**Việc tiếp theo**
1. Phần 3: khu khách theo mẫu (03, 05) — thiết kế chi tiết → chủ dự án duyệt → kế hoạch → làm.
2. Phần 4: khu nhân viên, gồm giao diện nội trú đầy đủ từ dữ liệu nhánh dữ liệu.

**Vướng / cần chủ dự án:** giờ thật của các khung giờ (đang tạm 08–10 · 10–12 · 14–16 · 16–18 · 18–20).

---

## Nhánh `claude/du-lieu` — Dữ liệu & chức năng

Cập nhật: 21/10/2026 (tài khoản 2).

**Đang làm:** — (dữ liệu phần 4 đã làm xong trên nhánh này, chờ gộp vào nhánh tích hợp).

**Đã xong**
- **Dữ liệu phần 4 — khu nhân viên** (thiết kế `docs/superpowers/specs/2026-10-21-phan-4-du-lieu-nhan-vien-design.md`, kế hoạch `docs/superpowers/plans/2026-10-21-phan-4-du-lieu-nhan-vien.md`, R36):
  - sửa hồ sơ khách và thú cưng (cân nặng, màu lông, triệt sản, ghi chú nội bộ; có kiểm tra phiên bản); `findByPhone` báo trùng số điện thoại (chỉ cảnh báo); bảng khách có ảnh bé; **lịch sử tương tác** trong hồ sơ khách;
  - bảng giá: thêm / sửa / tắt-bật mục (chỉ Quản lý), mã tự sinh, giá cố định hoặc linh hoạt + giá tham khảo; đổi giá không đổi dòng hóa đơn đã có; mục đã tắt không thêm vào hóa đơn mới; LT01–LT03 không tắt được;
  - doanh thu theo danh mục tính sau giảm giá, cộng lại đúng bằng `invoiced`;
  - phân trang giữ ở giao diện (không đổi hợp đồng `list`); dữ liệu cũ trong trình duyệt tự được coi là phiên bản 1.
- **Nội trú đầy đủ — dữ liệu & chức năng** (§3 `docs/superpowers/specs/2026-10-20-noi-tru-day-du-design.md`, kế hoạch `docs/superpowers/plans/2026-10-20-noi-tru-du-lieu.md`):
  - tiền nội trú theo giờ (làm tròn lên 0,1 ngày), gợi ý mục tiền ngày theo loài/cân nặng (không cân nặng → không ghi), thành tiền làm tròn đồng;
  - Spa thêm `inpatient.admit` + `inpatient.share` (vẫn không có `inpatient.clinical`); chủ dự án giữ việc Spa đổi "Tình trạng nội bộ" (R33). Đã sửa 1 test e2e cũ trong `e2e/staff-b.spec.ts`;
  - nhập viện (tình trạng ban đầu, từ lịch hẹn hôm nay, hóa đơn nháp + dòng tiền ngày), `admitOptions`, `findPets`; chuyển chuồng; xuất viện (tính lại dòng tiền ngày trên hóa đơn nháp, lời chào "Sẵn sàng về nhà", chọn thời điểm); `billing` trên trang lượt nội trú; lịch sử lượt nội trú;
  - tải video mẫu hoặc từ máy (≤ 20 MB, ≤ 15 giây), lưu IndexedDB trên trình duyệt; tự xóa 60 ngày / xóa video / khôi phục dữ liệu đều xóa tệp; dọn tệp mồ côi khi mở ứng dụng; hook `useMediaUrls`;
  - dữ liệu mẫu: cân nặng (trừ Tôm, Xoài), mục tiền ngày, nhật ký thao tác cho các lượt nội trú mẫu; R33 trong `QUYET-DINH.md`, bảng quyền Spa trong `proposal-staff.md`.
- **Ảnh thú cưng** (`photo_key`): `pets.photo_key?`, `account_pets.photo_key?`; `photoKey` trên mọi bé giao diện hiện. Gán: Miu `meo-trang-ngu`, Bông `cho-poodle-xe`, Mochi `cho-poodle-chuong`, Mít `cho-pom-trang`, Na `meo-trang-gang-tay`, Kem `cho-vang`, Gạo `meo-tam-the` (cả bé Gạo trên web của `minh_khoa`), Mướp `meo-muop`. Miu đổi giống ghi "Mèo ta lông trắng" cho khớp ảnh. Dùng tên tệp ảnh của nhánh giao diện; bản ảnh trùng của nhánh dữ liệu đã bỏ.
- **Dữ liệu phần 2** (§4 `docs/superpowers/specs/2026-10-20-phan-2-cong-khai-dat-lich-dang-nhap-design.md`):
  - khung giờ đặt lịch (5 khung tạm), lưu trong yêu cầu, tính vào chống gửi trùng chỉ khi có chọn (mã cũ không đổi); YC-0241, YC-0242 có khung giờ mẫu;
  - ghi nhớ đăng nhập: khách 30 ngày, mọi tab của trình duyệt; nhân viên bỏ qua; đăng xuất / khôi phục dữ liệu xóa cả hai.
- **Dữ liệu phần 3** (§4 `docs/superpowers/specs/2026-10-21-phan-3-khu-khach-design.md`, 21/10):
  - (1) cân nặng trên thẻ thú cưng của khách; (2) "Tình trạng chung" trong hồ sơ bé — dòng nhật ký đã chia sẻ gần nhất của Ăn uống / Nghỉ ngơi / Tinh thần / Vận động (không lấy "Lời nhắn"), chỉ từ lượt nội trú khách đang được xem; (5) ngày cụ thể trên nhật ký và video;
  - (3) yêu cầu đổi lịch: khách gửi cho lịch "Đã hẹn" còn ở tương lai (ngày từ mai, khung giờ, lý do ≤ 200 ký tự; mỗi lịch một yêu cầu đang chờ); nhân viên xem danh sách, dời lịch thì yêu cầu tự xong, hoặc đóng "Không đổi"; hủy lịch cũng đóng yêu cầu. Bảng mới `reschedule_requests`; dữ liệu cũ đã lưu trong trình duyệt tự có bảng rỗng (không cần đổi phiên bản dữ liệu);
  - (4) chuông cập nhật: tối đa 10 mục trong 30 ngày (nhật ký, video, nhân viên đổi trạng thái yêu cầu của khách, hóa đơn mới), câu cố định nên không lộ giờ, thuốc, tên nhân viên; mở chuông = đã xem. Đã thêm vào kiểm thử chống lộ.
- Kiểm tra lần cuối trên nhánh dữ liệu: `npm run verify` xanh (362 unit, 433 e2e); e2e riêng `e2e/du-lieu-media.spec.ts`, `e2e/du-lieu-auth.spec.ts`.

**Việc tiếp theo**
1. Dữ liệu mẫu cho phân hệ mới (phần 5): Khám bệnh, Dịch vụ, Kho, Báo cáo, Cài đặt — chờ chủ dự án gửi danh sách dịch vụ mới.

**Vướng / cần chủ dự án:** giờ thật của các khung giờ đặt lịch (đang tạm 08–10 · 10–12 · 14–16 · 16–18 · 18–20) — đổi chỉ cần sửa `TIME_SLOTS` / `TIME_SLOT_LABEL`.

---

## Thay đổi hợp đồng dữ liệu (`src/data/contracts/`)

Nhánh dữ liệu ghi mỗi thay đổi ở đây (ngày · kiểu/hàm · mô tả). Nhánh giao diện đọc trước khi dùng.

- 20/10/2026 · `StaffInvoiceDetail.lines[]` thêm `pet_id?`, `price_mode` (sửa F01, đã có trên nhánh tích hợp).
- 20/10/2026 · nội trú (`staff.ts`): thêm `AdmitPetOption`, `DayPriceItem`, `AdmitOptions`, `AdmitInput`, `DischargeInput`, `DischargeResult`, `StayBilling`, `StayHistoryIcon`, `StayHistoryItem`, `DemoClip`, `VideoUploadInput`.
- 20/10/2026 · `StaffInpatientApi`: thêm `admitOptions()`, `findPets(q)`, `transfer(id, version, { cage_id, reason? })`, `history(stayId)`, `videos.upload(stayId, input)`, `videos.demoClips()`, `videos.deviceUploadAvailable()`; `admit(input: AdmitInput)` nhận thêm `initial_status?`, `appointment_id?`, `invoice?: { day_price_item_id? }`; `discharge(id, version, input: DischargeInput)` nhận thêm `discharged_at?`, `farewell?` và **trả về** `{ days, invoiceUpdated }` (trước đây không trả gì).
- 20/10/2026 · `StaffStayView` thêm `billing?: StayBilling`; `StaffVideoRow` thêm `isLocal`; `CustomerVideo` (`customer.ts`) thêm `isLocal`. `duration_s` / `durationS` = **0 nghĩa là không đọc được thời lượng** → hiện "—".
- 20/10/2026 · ảnh thú cưng: thêm `photoKey?` vào `CustomerPetCard`, `CustomerStayCard` (`customer.ts`) và `StaffPet`, `StaffAppointment`, `CageTile.stay`, `StaffStayView`, `AdmitPetOption` (`staff.ts`). Là khóa ảnh, đổi ra URL bằng `petPhoto(key, size)`.
- 20/10/2026 · phần 2: `enums.ts` thêm `TIME_SLOTS`, `TimeSlot`, `TIME_SLOT_LABEL` (`'08:00–10:00'` …); `RequestSnapshot.preferred_slot?`; `BookingInput.preferred_slot?` (`public.ts`, giá trị lạ → `ValidationError({ preferred_slot })`, câu "Khung giờ này chưa đúng. Bạn chọn lại giúp nhé."); `CustomerBookingRow.preferredSlot?`; `CustomerRequestDetail.snapshot.preferred_slot?`. `validateBooking` trả thêm khóa `preferred_slot` (nhánh giao diện đã thêm nó vào `BOOKING_FIELDS` ở phần 2). `LoginInput.remember?: boolean` (`api.ts`).
- 21/10/2026 · phần 3 (`customer.ts`): `CustomerPetCard.weightKg?`; `CustomerPetCondition`; `pets.get(id)` trả thêm `condition: CustomerPetCondition[]`; `CustomerDiaryEntry.date`, `CustomerVideo.date` (`YYYY-MM-DD`); `RescheduleInput`, `appointments.requestReschedule(id, input)` — **`id` là `CustomerBookingRow.id`** (dòng của yêu cầu web hoặc của lịch hẹn); lỗi: `desired_date` "Bạn chọn từ ngày mai trở đi nhé.", `reason` "Lý do tối đa 200 ký tự.", `appointment` "Lịch hẹn này không đổi được nữa. Bạn gọi Lê Sơn để được hỗ trợ nhé." / "Bạn đã gửi yêu cầu đổi lịch này. Lê Sơn sẽ gọi cho bạn sớm."; `CustomerBookingRow.rescheduleRequest?`; `CustomerUpdate`, `updates.list()`, `updates.markAllSeen()`. Quy tắc dùng chung: `validateReschedule` (`rules/booking.ts`).
- 21/10/2026 · phần 3 (`staff.ts`): `StaffRescheduleRow`; `StaffRequestsApi.reschedules()` (đang chờ, cũ trước) và `keepAppointment(rescheduleId, { note? })` ("Không đổi") — quyền `requests.handle` hoặc `appointments.manage`; `StaffAppointment.rescheduleRequest?`. `appointments.reschedule` / `cancel` tự đóng yêu cầu đổi lịch đang chờ.
- 21/10/2026 · phần 4 (`staff.ts`): `StaffCustomersApi` thêm `update(id, version, CustomerInput)`, `updatePet(petId, version, PetInput)`, `findByPhone(phone, excludeId?)`; `PetInput` thêm `weight_kg?`, `color?`, `neutered?`, `note_internal?`; `StaffPet` thêm `version`, `weight_kg?`, `color?`; `StaffCustomerDetail` thêm `version`, `interactions` (`StaffInteraction[]`, mới nhất trước, tối đa 50; hóa đơn/thanh toán chỉ với `invoices.create` hoặc `payments.record`, nội trú chỉ với `inpatient.view`); `StaffCustomerRow` thêm `pets` (ảnh bé cho bảng).
- 21/10/2026 · phần 4 (`staff.ts`): `StaffPriceItem` thêm `version`, `reference_price?`; kiểu `PriceInput`; `StaffPricesApi` thêm `create(input)`, `update(id, version, input)`, `setActive(id, version, active)` (quyền `pricelist.edit`); lỗi `lines.N` của `invoices.updateDraft` khi thêm dòng của mục đã tắt. `RevenueReport` thêm `invoiced`; **`byCategory` đổi cách tính** (sau giảm giá, cộng lại bằng `invoiced`).
- 20/10/2026 · `api.ts`: thêm `LocalMedia`, `MediaApi` (`api.media.local(mediaKey)`). Hook mới `src/data/hooks/useMediaUrls.ts` (`useMediaUrls(mediaKey) → { urls?, loading, missing }`). Quy tắc dùng chung: `src/data/rules/stay-billing.ts` (`billableDays`, `formatDaysVi`, `suggestDayItemCode`), `src/data/rules/video-upload.ts` (`videoFileProblem`, giới hạn, câu lỗi, `isLocalKey`).

## Yêu cầu gửi nhánh kia

- (du-lieu → giao-dien, 21/10/2026) Dữ liệu phần 4 đã xong (xem "Thay đổi hợp đồng"). Khi làm màn hình khu nhân viên: **Khách hàng** — nút "Chỉnh sửa" khách và bé (gửi `version` của hồ sơ đang mở; `ConflictError` → báo và tải lại), ô cân nặng/màu lông/triệt sản/ghi chú nội bộ của bé (**`updatePet` ghi đè đủ các trường: form phải gửi lại mọi giá trị hiện có, kể cả `alerts`, nếu không chúng bị xóa**), cảnh báo "Số này đã có ở KH-… · tên" từ `findByPhone` (cho tiếp tục lưu), cột ảnh bé trong bảng từ `pets`, tab "Lịch sử tương tác" từ `interactions`. **Bảng giá** — thêm/sửa/tắt-bật (chỉ khi `can('pricelist.edit')`), mục LT01–LT03 không có nút tắt và không cho đổi sang giá linh hoạt, mục giá linh hoạt có ô "Giá tham khảo"; sửa mục không gửi `customer_group` thì giữ nhóm hiện tại, `setActive` mới đổi bật/tắt (`active` trong `update` bị bỏ qua); trình soạn hóa đơn: điền sẵn `reference_price` vào ô giá của mục giá linh hoạt, ẩn mục `active: false` khỏi ô chọn mục mới. **Doanh thu** — nhãn "Theo danh mục — hóa đơn đã phát hành trong kỳ, sau giảm giá" và có thể hiện `invoiced` làm thẻ số liệu (khác "Đã thu").

- ✅ đã xong (giao-dien → du-lieu, 20/10, phần 2 đã duyệt) Theo `docs/superpowers/specs/2026-10-20-phan-2-cong-khai-dat-lich-dang-nhap-design.md` §4: (1) khung giờ `TimeSlot` + `TIME_SLOT_LABEL`, `BookingInput.preferred_slot?`, `RequestSnapshot.preferred_slot?` (vào dedupeKey, giá trị lạ → ValidationError), `CustomerBookingRow.preferredSlot?`; (2) `LoginInput.remember?: boolean` — khách: localStorage 30 ngày, không tick: sessionStorage; đăng xuất / khôi phục dữ liệu xóa cả hai; nhân viên bỏ qua; (3) `photoKey` thú cưng (khóa ảnh có sẵn liệt kê ở §4.3). Ảnh gốc ở `docs/tham-khao/anh/`.
- ✅ đã xong (du-lieu → giao-dien, 20/10/2026) Yêu cầu phần 2 (khung giờ, ghi nhớ đăng nhập, `photoKey`) đã xong — xem "Thay đổi hợp đồng". Khi dựng ô "Khung giờ (tùy chọn)": thêm `'preferred_slot'` vào `BOOKING_FIELDS` (sau `desired_date`) cùng nhãn của nó trong `BookingForm`; gửi `remember` từ ô "Ghi nhớ đăng nhập" ở tab Khách hàng.

- ✅ đã xong (du-lieu → giao-dien, 20/10/2026) Dữ liệu mẫu đã dùng các khóa ảnh `meo-trang-ngu`, `cho-poodle-xe`, `cho-poodle-chuong`, `cho-pom-trang`, `meo-trang-gang-tay` (theo tên tệp của nhánh giao diện) — chạy `python3 scripts/photos.py` khi làm phần 2 để có tệp `pet-<khóa>-*.webp`; chưa có tệp thì `PetAvatar` hiện biểu tượng loài.

- ✅ đã xong 21/10 (giao-dien → du-lieu, phần 3) 5 mục dữ liệu §4 thiết kế phần 3 — tên cuối xem "Thay đổi hợp đồng" (khác đề xuất: `requestReschedule` nhận id của dòng lịch hẹn; phía nhân viên là `requests.reschedules()` + `requests.keepAppointment()`). Có thể bật các cờ `DATA_READY`.
- (du-lieu → giao-dien, 20/10/2026) Dữ liệu nội trú đầy đủ đã sẵn (xem "Thay đổi hợp đồng"). Khi làm phần 4: hộp thoại Nhập viện / Chuyển chuồng / Xuất viện / Tải video lên và tab "Lịch sử" theo §4 thiết kế nội trú + bộ mẫu; thay mọi chỗ dùng `mediaFor` (StayPage, VideoDialog, VideosTab) bằng `useMediaUrls` để phát được video `local:`; chip "Chỉ lưu trên trình duyệt này" khi `isLocal`; hiện "—" khi thời lượng = 0; Spa giờ thấy nút nhập/xuất viện và chia sẻ (theo `can()` sẵn có). Kiểm tra tệp trước khi gửi có thể dùng `videoFileProblem`; hiện tiền ngày bằng `billableDays` + `formatDaysVi`. Tệp mẫu WebM cho e2e: `e2e/fixtures/tiny.webm`.

- ~~(giao-dien → du-lieu) Cần `photoKey?: string` …~~ — đã xong 20/10 (xem "Thay đổi hợp đồng").
