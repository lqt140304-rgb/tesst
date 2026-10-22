# Ba yêu cầu của chủ dự án 22/10 (dữ liệu): quyền Kho, video, đặt lịch ngoài giờ

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline). Steps use checkbox (`- [ ]`) syntax.

**Goal:** Làm ba trong bốn yêu cầu mà nhánh giao diện chuyển lại theo chat của chủ dự án 22/10 (`PROGRESS.md` → "Yêu cầu gửi nhánh kia" → "Chủ dự án đã chốt hết", ý 1–3). Ý 4 (nội dung nổi bật trang giới thiệu) làm riêng sau, có thiết kế. Phụ phí lễ **không** làm (chủ dự án: chỉ một số mặt hàng, cập nhật sau).

**Architecture:** Chỉ `src/data/**`, `docs/`, `PROGRESS.md`. Hợp đồng chỉ thêm; có một chỗ chuyển tiếp có chủ đích: `stock.manage` được giữ lại làm quyền "gộp" (ai có nó tự có cả bốn quyền Kho mới) để màn Kho đang chạy của bên giao diện không gãy, và sẽ bỏ khi họ chuyển xong.

**Global Constraints:** TDD; commit tiếng Anh, không tên model, thân kết thúc bằng `Claude-Session: https://claude.ai/code/session_01WQRA4c5rpvrJd3fkJ3fRkU`; bài học cũ: `Map` cho lỗi, `Array.from` cho mảng thưa, chép khóa đã biết, đọc đầu vào một lần.

## Task 1 — Kho: tách quyền ghi (ý 1)
- Quyền mới (thêm cuối `CAPS`, có nhãn): `stock.receive` "Nhập thêm kho" · `stock.issue` "Xuất kho" · `stock.adjust` "Kiểm kê kho" · `stock.items` "Thêm, sửa, ngừng dùng món kho". `stock.manage` giữ, nhãn "Quản lý kho (gồm cả bốn việc trên)". `effectiveCaps`: có `stock.manage` thì có thêm cả bốn.
- Xem kho cho mọi nhân viên nội bộ: `stock.view` thêm vào preset Bác sĩ và Spa. Quản lý có tất cả như cũ. Ghi vẫn chỉ Quản lý theo mặc định.
- API: `create`/`update`/`setActive` cần `stock.items`; `receive` cần `stock.receive`; `issue` cần `stock.issue`; `adjust` cần `stock.adjust`; mọi thao tác ghi cần thêm `stock.view`.
- Phụ thuộc: nhắc việc "Kho sắp hết" (`NUDGE_NEEDS.stock`) đổi từ `stock.view` sang `['stock.receive','stock.items']` (ai xem cũng được nhưng chỉ người nhập kho/quản món mới cần nhắc); `FEATURES` bỏ `stock.write` (mỗi quyền đã là một tính năng); thêm bài hướng dẫn `kho` (đối chiếu màn Kho thật ở `src/features/staff/stock/`).
- Tests: `capabilities.test` (26 quyền; Bác sĩ và Spa có `stock.view` và không có quyền ghi; `stock.manage` mở rộng; cấp lẻ từng quyền); `stock.test` (mỗi thao tác chỉ qua với quyền của nó, thiếu `stock.view` bị từ chối, người chỉ có `stock.receive` không xuất/kiểm kê/sửa được, `stock.manage` làm được cả bốn); `help.test`/`help` API (bài `kho`, không còn `stock.write`); `staff-prefs`; `team.test` nếu có liệt kê quyền; leak.

## Task 2 — Video nội trú: tự cắt 15 giây, tệp gốc đến 100 MB (ý 2)
- `rules/video-upload.ts`: `VIDEO_MAX_BYTES` = 100 MB; bỏ `VIDEO_MSG.tooLong` và việc từ chối vì dài; `VIDEO_CLIP_SECONDS = 15`; giữ `notVideo`, `tooBig` (câu "Video lớn hơn 100 MB…"). Hàm `clipOf(duration_s)` → `{ clip_end_s, trimmed }` (`clip_end_s = min(duration, 15)` hoặc 15 nếu không đọc được độ dài; `trimmed = duration > 15`).
- Lưu thêm trên `Video`: `clip_end_s: number` và `trimmed: boolean` (video cũ đọc ra `duration_s ≤ 15` → `clip_end_s = duration_s`, `trimmed = false`). Trả ra ở `StaffVideoRow` và `CustomerVideo` (`clipEndS`, `trimmed`) — thêm trường, không đổi cũ. Phát luôn không tiếng (`audio_removed` đã có).
- Tests: `video-upload.test` (video 60 giây và tệp 99 MB hợp lệ, 101 MB bị từ chối, không phải video bị từ chối, độ dài không đọc được hợp lệ); `inpatient-videos.test` (tải lên video 40 giây → `duration_s` 40 gốc, `clip_end_s` 15, `trimmed` true; 10 giây → 10, false; video mẫu); khách thấy `clipEndS`; rò rỉ không đổi.

## Task 3 — Đặt lịch ngoài giờ (ý 3, trừ phụ phí lễ)
- `TIME_SLOTS` thêm `'20-21'` ("20:00–21:00", khung 1 giờ cuối ngày, sau `'18-20'`). Mới: `OUT_OF_HOURS_SLOT = 'other'`, `TIME_SLOT_CHOICES = [...TIME_SLOTS, 'other']`, `TIME_SLOT_CHOICE_LABEL` (nhãn "Giờ khác (ngoài giờ làm việc)").
- Lớp dữ liệu **từ chối** `preferred_slot = 'other'` ở đặt lịch công khai, khách đăng nhập và xin đổi lịch: lỗi `preferred_slot` = "Ngoài giờ làm việc (08:00–21:00) cần gọi hotline 097 355 51 05 trước nhé." (không tạo yêu cầu). Ngày nghỉ: khung `'20-21'` cũng bị cắt như `'18-20'` (kết thúc sau 19:00).
- Tests: `booking.test` (7 khung liền nhau 08:00–21:00; `'other'` bị từ chối ở cả đặt lịch và đổi lịch; `slotsOn` ngày nghỉ còn 5 khung); `public.test` (gửi `'other'` bị từ chối, không ghi gì; `'20-21'` được); `holidays.test` cập nhật.

## Task 4 — Tài liệu, kiểm tra, rà soát, gộp
`PROGRESS.md` (đã xong; thay đổi hợp đồng; yêu cầu cho bên giao diện: chuyển nút Kho sang bốn quyền mới, `TIME_SLOT_CHOICES` và hotline khi chọn "Giờ khác", `clipEndS`/`trimmed` khi phát video, bỏ cách kiểm 15 giây/20 MB ở hộp tải lên); `npm run verify` (nền); rà soát độc lập (agent mới); sửa lỗi quan trọng test-first; build lại và chạy lại e2e Kho/đặt lịch/nội trú/quyền; gộp vào nhánh tích hợp.

## Review Focus
1. Quyền Kho: ai ghi được gì (ma trận 4 vai × 5 thao tác, cả khi thiếu `stock.view`, cấp lẻ, `stock.manage` mở rộng); người có `staff.manage` không tự cấp được quyền Kho vượt mức mình có.
2. Video: tệp 100 MB đúng/101 MB; độ dài 0/NaN/âm/15/15,01/3600; mọi video cũ vẫn đọc được; khách không thấy giờ hay tên nhân viên.
3. Ngoài giờ: `'other'` bị từ chối ở mọi đường; `'20-21'` đi qua dedupe; ngày nghỉ cắt `'20-21'`; các nơi giả định 6 khung.
