# Phần 4C — Khu nhân viên: Nội trú đầy đủ (màn hình)

Ngày: 21/10/2026 · Nhánh `claude/giao-dien` · Chủ dự án đã duyệt thiết kế bằng lời (21/10/2026: "nhập viện 3 bước", "làm hết rồi gửi một lần", "chi tiết hơn nhưng gọn gàng, dễ tiếp cận với người mới"); tệp này chờ duyệt bản viết.

Thuộc phần 4 của `2026-10-20-lam-lai-giao-dien-design.md` §4 mục 4 và là **phần màn hình** (§4) của `2026-10-20-noi-tru-day-du-design.md`. Chưa có bảng mẫu "Quản lý nội trú & cập nhật cho chủ nuôi" (chủ dự án chọn dựng theo phong cách 4A/4B, chỉnh khi có mẫu). **Dữ liệu và chức năng đã có đủ** từ nhánh dữ liệu (`staff.inpatient.admitOptions/findPets/admit/transfer/discharge/history/videos.upload/demoClips/deviceUploadAvailable`, `StaffStayView.billing`, `useMediaUrls`, quy tắc video 15 giây · 20 MB); **không đổi hợp đồng**.

## 1. Mục tiêu và nguyên tắc cho người mới

Người xem demo làm trọn vòng: nhập viện → chăm sóc → chuyển chuồng → tải video → chia sẻ cho chủ nuôi → xuất viện → hóa đơn đúng số ngày → chuồng trống lại; khách chỉ thấy phần được chia sẻ (R7, R20).

Ba nguyên tắc cho cả phần:
1. **Mỗi màn một việc chính**, nút chính nổi bật, các việc phụ ở sau.
2. **Chữ đời thường**: "bé đang nội trú", "chuồng", "tiền tạm tính"; không "lượt nội trú", "hồ sơ lưu trú" ở chữ hiển thị. Gọi bé là "bé" + tên.
3. **Nói trước điều sẽ xảy ra**: hộp thoại có dòng tóm tắt kết quả ("Kem vào chuồng C4, tạo hóa đơn nháp có Nội trú mèo") trước khi bấm. Lời nhắc chỉ **nhắc**, không chặn.

Giữ nguyên: quyền theo khả năng (`inpatient.view/admit/share/diary_write/clinical`; Spa có admit + share, không có clinical), ẩn nút ở giao diện, không check-in (R8), video không âm thanh · tối đa 15 giây và 20 MB · tự xóa sau 60 ngày, khách không thấy mã chuồng, tên nhân viên, ghi chú nội bộ, y lệnh.

Không làm: sửa cấu hình chuồng, cho khách tải video về, kéo thả chuồng, gộp hoặc xóa lượt nội trú.

## 2. Bảng chuồng `#/nv/noi-tru`

- **Đầu trang:** ba số tóm tắt (đang nội trú · chuồng trống · cần gửi nhật ký hôm nay — số cuối chỉ cho người có `inpatient.share`), chú thích tình trạng, nhóm lọc khu (Tất cả · tên từng khu lấy từ dữ liệu chuồng), nút **Nhập viện** (`inpatient.admit`). Người có `inpatient.admit` thấy một dòng gợi ý: "Bấm thẻ để xem hồ sơ bé, bấm chuồng trống để nhập viện."
- **Thẻ có bé** (kiểu thẻ chung, bo 12 px): `PetAvatar` (ảnh `photoKey`), tên, loài · chủ nuôi, chuồng, "Ngày N", tình trạng, chữ viết tắt bác sĩ, và **một dòng việc tiếp theo** theo thứ tự ưu tiên: "Dự kiến về hôm nay" · "Chưa gửi nhật ký hôm nay" (`inpatient.share`) · "N việc chưa ghi" (`inpatient.clinical`) · "Chủ nuôi chưa liên kết tài khoản" · cảnh báo an toàn đầu tiên của bé. Không dùng "Quá giờ" (R13).
- **Chuồng trống** (viền nét đứt): "Trống · bấm để nhập viện" là nút mở hộp thoại Nhập viện **đã chọn chuồng** (`aria-label` "Nhập viện vào chuồng C4"); không có quyền → chữ "Trống", không bấm được.
- Bé mới vào chuồng hiện một lần, nhẹ (150–450 ms, dịch 8–12 px); giảm chuyển động → hiện ngay.
- Chưa có bé nào: thông báo "Chưa có bé nào nội trú." kèm nút Nhập viện (nếu có quyền).

## 3. Trang một bé nội trú `#/nv/noi-tru/:stayId`

Từ 1100 px hai cột (thẻ trái dính khi cuộn), dưới đó thẻ nằm trên các tab — cùng cách với hồ sơ khách (4B).

- **Dải tiến trình** trên cùng: Nhập viện → Đang chăm sóc → Sẵn sàng về → Đã xuất viện. Bước hiện tại: "Đang chăm sóc"; "Sẵn sàng về" khi tình trạng chung gần nhất đã chia sẻ là "Sẵn sàng về nhà" hoặc đã tới ngày dự kiến về; "Đã xuất viện" khi có `discharged_at`. Chỉ để định hướng, không bấm được.
- **Thẻ trái** (`[data-stay-info]`), từ trên xuống:
  1. Bé (ảnh, tên, loài · giống, cảnh báo an toàn) và chủ nuôi (liên kết hồ sơ khi có `customers.view`, số gọi được).
  2. **Thời gian:** nhập viện lúc …, "đang ở N ngày M giờ" (hoặc "đã ở …" sau xuất viện), dự kiến về, bác sĩ phụ trách, chuồng.
  3. **Tình trạng nội bộ** (chọn nhanh như hiện nay; chỉ `inpatient.admit` và lượt chưa xuất viện).
  4. **Tiền tạm tính:** từ `billing` — "Nội trú mèo × 2,2 ngày = 330.000 ₫ · tạm tính tới bây giờ" (đã xuất viện: "đã tính N ngày"); không có hóa đơn: "Chưa có hóa đơn"; có hóa đơn nhưng không có dòng tiền ngày: "Chưa ghi tiền nội trú"; nút "Mở hóa đơn" khi có `invoices.create` hoặc `payments.record`. Số ngày tính bằng `billableDays` dùng chung với hộp thoại xuất viện.
  5. **Chủ nuôi đang thấy:** số nhật ký và video đã chia sẻ; chủ chưa liên kết tài khoản → "Chủ nuôi chưa liên kết tài khoản nên chưa xem được."
  6. **Việc nên làm** (chỉ gợi ý, mỗi dòng bấm sang đúng tab): "Chưa gửi nhật ký hôm nay" · "N video chưa chia sẻ" · "Hóa đơn chưa phát hành" (có quyền hóa đơn). Không có việc nào: "Không có việc nào đang chờ."
  7. **Nút:** chính "Xuất viện…", phụ "Chuyển chuồng…" (`inpatient.admit`). Đã xuất viện: ẩn hai nút và ô đổi tình trạng; hiện dải "Đã xuất viện lúc 15:20, 19/10".
- **Tab** (cột phải): Hồ sơ nội bộ (chỉ `inpatient.clinical`) · Nhật ký cho chủ nuôi · Video (nút "Tải video lên" với `inpatient.diary_write`, lượt chưa xuất viện) · Hóa đơn (dòng tiền ngày + "đang tính N ngày", nút mở hóa đơn) · **Lịch sử** (mới).
- **Lịch sử:** `staff.inpatient.history(stayId)` (mới nhất trước), **gom theo ngày** (tiêu đề ngày, rồi các dòng giờ · nội dung · người làm), mỗi dòng có biểu tượng theo `StayHistoryIcon`. API đã lọc theo quyền; giao diện không tự thêm. Rỗng: "Chưa có hoạt động nào."
- Tab Hồ sơ nội bộ, Nhật ký, Video giữ chức năng hiện có, chỉ đổi kiểu cho cùng họ (thẻ chung, `.num` cho số và giờ). Video phát qua `useMediaUrls` (cả clip mẫu và video từ máy, chip "Chỉ lưu trên trình duyệt này" khi `isLocal`; không còn tệp → "Không còn tệp video").

## 4. Hộp thoại Nhập viện (3 bước)

`NewStayDialog({ open, onClose, cageId? })`, hộp thoại rộng; điện thoại: toàn màn hình. Đầu hộp thoại: "Bước N/3 · tên bước"; chân: **Quay lại** · **Tiếp** (bước 3: **Nhập viện**). Dữ liệu từ `admitOptions()`; tìm bé bằng `findPets(q)` (không dấu).

1. **Chọn bé.** Ô "Tìm bé, chủ nuôi hoặc số điện thoại" + nhóm thẻ **"Lịch hẹn hôm nay"** (từ `today`: giờ, dịch vụ, bé) — bấm một cái là chọn và nhớ `appointment_id` (và hóa đơn nháp của lịch nếu có). Mỗi bé hiện ảnh, tên, loài · giống, cân nặng (nếu có), chủ nuôi. Bé đang nội trú: mờ, không chọn được, kèm "Đang nội trú". Không tìm thấy: "Chưa có hồ sơ bé này. Bạn tạo ở mục Khách hàng rồi quay lại." kèm liên kết. **Tiếp** chỉ mở khi đã chọn bé.
2. **Chuồng và chăm sóc.** Chuồng trống hiện thành các ô bấm được (radio), nhóm theo khu, khu hợp loài (`species_hint`) đứng đầu kèm nhãn "Hợp với bé"; mở từ chuồng trống ở bảng thì ô đó chọn sẵn (vẫn đổi được). Còn: **Bác sĩ phụ trách** (mặc định người đang đăng nhập nếu là bác sĩ), **Lý do nhập viện** (nhãn "Chỉ nhân viên", bắt buộc), **Tình trạng ban đầu** (mặc định "Cần theo dõi"), **Dự kiến xuất viện** (không bắt buộc, không trước hôm nay).
3. **Hóa đơn và xác nhận.** Ô tick "Tạo hóa đơn nội trú nháp" (tick sẵn) + ô chọn dòng tiền ngày (3 mục `dayItems` hoặc "Chưa ghi tiền nội trú"); mặc định theo `suggestedDayItemId`; bé chưa có cân nặng → mặc định "Chưa ghi tiền nội trú" với chú thích "Hồ sơ bé chưa có cân nặng nên chưa ghi tiền nội trú."; lịch hẹn đã có hóa đơn nháp → chú thích "Thêm vào hóa đơn nháp {mã} của lịch hẹn". Một dòng **tóm tắt**: "Kem · chuồng C4 · BS. Mai · hóa đơn nháp có Nội trú mèo". Nút **Nhập viện**.

Lỗi (`ValidationError`) hiện dưới đúng ô và **đưa người dùng về bước có ô lỗi** (`pet_id`→1; `cage_id`, `reason_internal`, `expected_discharge_at`→2). Chuồng vừa bị tab khác lấy ("Chuồng này đang có bé ở."): về bước 2, danh sách chuồng tải lại. Thành công: toast "Đã nhập viện Kem vào chuồng C4." rồi mở trang bé mới. Dữ liệu đã nhập giữ nguyên khi quay lại bước trước.

## 5. Hộp thoại Chuyển chuồng

`TransferDialog({ open, onClose, stay })`: chuồng hiện tại và ô chọn **chuồng mới** (chuồng trống, nhóm theo khu, như bước 2 của Nhập viện), dòng "C4 → C5", **Lý do** chọn nhanh (Cách ly · Đổi khu · Gần bác sĩ hơn · Khác — "Khác" mở ô gõ ≤ 200 ký tự; không bắt buộc). Gửi `transfer(id, version, { cage_id, reason })` với phiên bản lúc mở; xung đột → báo "vừa được người khác cập nhật", đóng hộp thoại, trang tải lại. Toast "Đã chuyển Kem sang chuồng C5."

## 6. Hộp thoại Xuất viện

`DischargeDialog({ open, onClose, stay })`:
- **Thời điểm xuất viện** (mặc định bây giờ; không trước lúc nhập viện, không sau bây giờ — lỗi hiện tại ô) và **Ghi chú nội bộ** ("Chỉ nhân viên").
- **Hóa đơn:** tóm tắt theo §3.4 của đặc tả nội trú, **tự tính lại khi đổi thời điểm**: "Nội trú mèo × 2,2 ngày (52 giờ) = 330.000 ₫ · Hóa đơn đang là bản nháp"; một câu giải thích "Tiền nội trú tính theo giờ, làm tròn lên 0,1 ngày."; đã phát hành → "Hóa đơn đã phát hành — không thay đổi"; không có → "Lượt nội trú này chưa có hóa đơn."; chưa ghi tiền → "Chưa ghi tiền nội trú — bạn có thể thêm trong hóa đơn." Nút "Mở hóa đơn" (có quyền).
- **Lời chào gửi chủ nuôi** (không bắt buộc): nút "Dùng câu gợi ý" điền "{Tên} đã khỏe và sẵn sàng về nhà. Cảm ơn gia đình đã tin tưởng Lê Sơn!"; cảnh báo mềm khi gặp tên thuốc/liều (`diary.lint`); ô "Chia sẻ ngay với chủ nuôi" chỉ với `inpatient.share`.
- Dòng cố định: "Hướng dẫn dùng thuốc và chăm sóc tại nhà được dặn trực tiếp, không gửi qua web."
- **Nhắc trước khi xác nhận** (không chặn): "Còn N nhật ký nháp chưa chia sẻ" · "Còn N video nháp" · "Hóa đơn chưa phát hành" — lấy từ `StaffStayView`.
- Nút **Xác nhận xuất viện**; toast "Đã cho Kem xuất viện · hóa đơn tính 2,2 ngày." (bỏ vế sau khi `invoiceUpdated` sai). Gửi `discharge(id, version, input)` với phiên bản lúc mở; xử lý xung đột như §5.

## 7. Hộp thoại Tải video lên (3 bước nhìn thấy được)

`VideoUploadDialog({ open, onClose, stay })`, tiêu đề các bước: **Chọn video → Lời nhắn → Chia sẻ**. Giới hạn ghi sẵn ngay đầu: "MP4, MOV, WebM · tối đa 15 giây · 20 MB".
1. **Chọn video:** hai lựa chọn "Video mẫu" (lưới ảnh bìa từ `demoClips()`, nhãn "Video minh họa") và "Chọn từ máy" (vùng chọn/kéo thả tệp; tắt kèm lý do khi `deviceUploadAvailable()` sai: "Trình duyệt này không lưu được video. Bạn dùng video mẫu nhé."). Chọn tệp: **xem trước tắt tiếng**, đọc thời lượng bằng phần tử video; báo lỗi **ngay** khi sai loại, quá 20 MB hay quá 15 giây (dùng đúng câu từ `src/data/rules/video-upload.ts`, không tự đặt); không đọc được thời lượng → vẫn nhận, hiện "—". Ghi chú R25 nguyên văn và chip "Chỉ lưu trên trình duyệt này".
2. **Lời nhắn:** "Lời nhắn kèm video" (≤ 120 ký tự, có đếm 0/120, vài câu gợi ý bấm vào, ví dụ "{Tên} sưởi nắng buổi sáng") và "Thời điểm quay" (mặc định bây giờ, không sau bây giờ). Chip cố định "Âm thanh: đã loại bỏ" · "Tự xóa sau 60 ngày".
3. **Chia sẻ:** với `inpatient.share`: hai ô xác nhận ("Video không có người hay thú cưng của khách khác" · "Không thấy tên thuốc, y lệnh hay giấy tờ nội bộ") và hai nút **Lưu nháp** · **Tải lên và chia sẻ** (cần đủ hai ô); không có quyền: một nút **Tải lên (bản nháp)**.
Thành công: toast "Đã tải video lên." (hoặc "…và chia sẻ với chủ nuôi."), tab Video cuộn tới video mới.

## 8. Phía khách

Không có màn mới. Video từ máy phát tắt tiếng với chip "Chỉ lưu trên trình duyệt này"; lời chào "Sẵn sàng về nhà" và video đã chia sẻ hiện như các mục hiện có. Dữ liệu chiếu cho khách không đổi (không lộ mã chuồng, tên nhân viên, ghi chú nội bộ).

## 9. Cấu trúc code

`src/features/staff/inpatient/`: `BoardPage.tsx` (viết lại, dùng `PetAvatar`), `StayPage.tsx` (rút gọn: bố cục, tab), `StayInfoCard.tsx`, `StayProgress.tsx` (+ `stayStep.ts` thuần: bước hiện tại, có test), `NextChores.tsx` (+ `chores.ts` thuần: việc nên làm, có test), `HistoryTab.tsx` (+ `groupByDay.ts` thuần, có test), `AdmitDialog.tsx` (+ `admitSteps.ts` thuần: bước có ô lỗi, điều kiện Tiếp, tóm tắt; có test), `CagePicker.tsx` (dùng chung Nhập viện/Chuyển chuồng), `TransferDialog.tsx`, `DischargeDialog.tsx` (+ `dischargeSummary.ts` thuần: tóm tắt hóa đơn theo giờ, có test), `VideoUploadDialog.tsx` (+ đọc thời lượng/kiểm tệp ở phía giao diện), `Inpatient.module.css`. Sửa `DiaryTab`, `VideosTab` (phát bằng `useMediaUrls`), `InternalTab` (chỉ kiểu). Không thêm thư viện. Quy tắc tiền ngày dùng `billableDays` ở `src/data/rules/`, không viết lại.

## 10. Chuyển động và trợ năng

Hộp thoại theo `Dialog` chung (Esc, trả tiêu điểm, toàn màn hình trên điện thoại); đổi bước chạy một lần ngắn; mỗi bước có tiêu đề và `aria-live` cho "Bước N/3"; lỗi gắn `aria-describedby` qua `Field`; ô chuồng và thẻ bé là radio/nút có nhãn đọc màn hình; điều khiển bằng bàn phím; tương phản chữ ≥ 4,5:1; điện thoại 320 px không cuộn ngang; `prefers-reduced-motion` tắt dịch chuyển. Số, giờ, tiền, mã dùng `.num`.

## 11. Kiểm thử

Đơn vị (viết trước): `stayStep`, `chores`, `groupByDay`, `admitSteps`, `dischargeSummary` (ví dụ 52 giờ → "2,2 ngày", đổi giờ đổi số, đã phát hành giữ nguyên, không có hóa đơn).

E2E `e2e/giao-dien-nhan-vien-c.spec.ts` (viết trước, ba cỡ màn hình): bảng chuồng (số tóm tắt, lọc khu, chuồng trống bấm mở Nhập viện có chuồng chọn sẵn); nhập viện đủ 3 bước (từ lịch hẹn hôm nay và từ ô tìm, bé đang nội trú không chọn được, lỗi đưa về đúng bước, chuồng bị tab khác lấy); chuyển chuồng (lý do nhanh, chuồng bận); xuất viện (tóm tắt đổi theo giờ, nhắc nháp, lời chào chia sẻ); tải video (video mẫu; tệp WebM nhỏ từ máy; quá 20 MB, quá 15 giây, sai loại báo ngay trước khi tải); tab Lịch sử gom theo ngày và đúng quyền (Spa không có dòng y lệnh); Spa nhập, chuyển, xuất viện, chia sẻ được nhưng không thấy Hồ sơ nội bộ; **hành trình đầy đủ**: `bacsi_mai` nhập viện → chuyển chuồng → tải video và chia sẻ → khách đã liên kết thấy video kèm chip → xuất viện kèm lời chào → hóa đơn đúng số ngày → chuồng trống lại; a11y (axe) cho bốn hộp thoại; 320 px (bảng chuồng, trang bé, mỗi hộp thoại). Chỉnh nhỏ spec cũ (`staff-b`, `journeys/video`) nếu nhãn đổi, ghi lại trong sổ.

## 12. Việc chờ chủ dự án

Bảng mẫu "Quản lý nội trú & cập nhật cho chủ nuôi" (chỉnh bố cục khi có). Bản HTML gửi **một lần** sau khi xong cả phần (chủ dự án chọn 21/10/2026).
