# Phần 4B — Khu nhân viên: Khách hàng

Ngày: 21/10/2026 · Nhánh `claude/giao-dien` · Chủ dự án đã duyệt thiết kế bằng lời (21/10/2026); tệp này chờ duyệt bản viết.

Thuộc phần 4 của `2026-10-20-lam-lai-giao-dien-design.md` §4 mục 4. Chưa có bảng mẫu cho màn này (chủ dự án chọn dựng theo phong cách 4A, chỉnh khi có mẫu). **Dữ liệu đã có đủ** từ nhánh dữ liệu (R36, `StaffCustomersApi.update/updatePet/findByPhone`, `interactions`, `pets` trong hàng danh sách); không đổi hợp đồng.

## 1. Giữ nguyên / không làm

- Quyền: `customers.view` xem; `customers.edit` (Quản lý, Bác sĩ; Spa không có) mới thấy Thêm khách, Chỉnh sửa, Thêm thú cưng. Quyền kiểm tra ở API và ẩn nút ở giao diện.
- Số điện thoại trùng chỉ **cảnh báo, không chặn** (một nhà có thể dùng chung số).
- Ghi chú nội bộ chỉ nhân viên thấy; hiện kèm nhãn "khách không thấy".
- Không làm: gộp hoặc xóa khách, sửa ảnh thú cưng (bản demo chưa có), kéo thả.

## 2. Danh sách `#/nv/khach-hang`

`DataTable` (10 dòng/trang, hàng bấm được, Enter mở; điện thoại: thẻ). Cột: **Khách hàng** (ảnh các bé xếp chồng tối đa 3 + "+N", tên, mã, nhãn "Nội trú"), **Số điện thoại**, **Thú cưng** (tên), **Tài khoản web** (nhãn đã liên kết), **Lịch hẹn gần nhất** (ngày, "sắp tới"), **Còn nợ** (màu nhấn khi > 0). Giữ ô tìm "Tìm khách hàng" (không dấu, tên/số/tên bé) và nhóm lọc Tất cả · Đang có bé nội trú · Còn nợ · Đã liên kết tài khoản web. Nút "Thêm khách hàng" mở hộp thoại hiện có (đã cảnh báo trùng số).

## 3. Hồ sơ `#/nv/khach-hang/:id`

Từ 1100 px hai cột; dưới 1100 px thẻ thông tin nằm trên các tab.

- **Thẻ "Thông tin khách hàng"** (cột trái, dính khi cuộn): tên, mã, số gọi được (`Tel`), địa chỉ, ghi chú nội bộ, ngày tạo hồ sơ, nhãn đã liên kết tài khoản web, "Còn nợ …" khi có, nút **Chỉnh sửa** (`customers.edit`).
- **Chỉnh sửa khách** (hộp thoại): họ tên, số điện thoại, địa chỉ, ghi chú nội bộ. Số trùng của khách **khác** (`findByPhone(phone, id)`) hiện cảnh báo kèm liên kết, vẫn lưu được. Lưu bằng `update(id, version, input)` với phiên bản lúc mở; `ConflictError` báo "vừa được người khác cập nhật" và tải lại dữ liệu mới; lỗi trường (`ValidationError`) hiện tại ô. Thành công: toast "Đã lưu hồ sơ".
- **Tab** (cột phải): Thú cưng · Lịch hẹn · Hóa đơn · Nội trú · Tài khoản web · **Lịch sử tương tác** (mới). Lịch hẹn/Hóa đơn/Nội trú/Tài khoản web giữ nội dung hiện có, chỉ đổi kiểu cho cùng họ (thẻ chung, `.num` cho số và mã).
- **Thẻ thú cưng**: `PetAvatar` (ảnh `photoKey`), tên, mã; dòng "loài · giống · giới · tuổi (từ năm sinh) · cân nặng (kg, `formatKg`) · màu lông · đã triệt sản" (bỏ phần chưa có); cảnh báo an toàn; ghi chú nội bộ; nút **Chỉnh sửa** (`customers.edit`).
- **Chỉnh sửa bé** (hộp thoại): tên, loài, giống, giới tính, năm sinh, cân nặng (0,1–120 kg, tối đa một số lẻ), màu lông, triệt sản (chưa rõ / đã / chưa), ghi chú nội bộ, cảnh báo an toàn bằng ô tích. Lưu bằng `updatePet(petId, version, input)`. **Cảnh báo luôn gửi theo ô tích hiện tại**: bỏ hết tích là xóa cảnh báo (có chú thích dưới nhóm ô tích), không đụng tới thì giữ nguyên. Cùng xử lý xung đột và lỗi trường như trên.
- **Thêm thú cưng**: hộp thoại hiện có, thêm ô cân nặng, màu lông, triệt sản, ghi chú nội bộ (như sửa bé) — dùng chung một biểu mẫu `PetForm` cho thêm và sửa.
- **Lịch sử tương tác**: dòng thời gian mới nhất lên trên (tối đa 50 dòng do API cấp). Mỗi dòng: biểu tượng theo loại (`customer`, `request`, `appointment`, `stay`, `invoice`, `payment`, `link`), nội dung (`label`), thời điểm, người thực hiện (`actorName` nếu có); dòng có `refId` hợp lệ là liên kết tới lịch hẹn/hóa đơn/nội trú khi người xem có quyền xem trang đó. Hóa đơn và thanh toán chỉ có với `invoices.create`/`payments.record`; nội trú chỉ với `inpatient.view` — API đã lọc, giao diện không tự thêm. Không có dòng nào: "Chưa có hoạt động nào."

## 4. Cấu trúc code

Mới trong `src/features/staff/customers/`: `CustomerForm.tsx` (hộp thoại sửa khách; dùng lại phần cảnh báo trùng của `NewCustomerDialog`, tách thành `PhoneNote.tsx`), `PetForm.tsx` (thêm/sửa bé), `PetCard.tsx`, `InteractionList.tsx` (+ `interactions.ts` thuần: biểu tượng, đường dẫn theo loại, có test), `Customers.module.css`. Sửa `CustomersPage.tsx` (DataTable), `CustomerPage.tsx` (rút gọn: bố cục, tab). Thêm `e2e/giao-dien-nhan-vien-b.spec.ts`; spec cũ chỉnh nhỏ nếu cần (`staff-a` bài khách hàng, `giao-dien-chu`).

## 5. Chuyển động và trợ năng

Tab đổi nội dung bằng hiệu ứng ngắn hiện có; hộp thoại theo `Dialog` chung (Esc, trả tiêu điểm). Mọi điều khiển dùng bàn phím; lỗi trường gắn `aria-describedby` qua `Field`; điện thoại 320 px không cuộn ngang; tương phản ≥ 4,5:1; `prefers-reduced-motion` tắt dịch chuyển.

## 6. Kiểm thử

Đơn vị: `interactions.ts` (biểu tượng và đường dẫn theo loại, kiểu lạ không làm hỏng). e2e (viết trước): bảng có phân trang, tìm không dấu, lọc, bấm hàng mở hồ sơ, ảnh bé; thêm khách với số trùng → cảnh báo, vẫn lưu; sửa khách thành công, và sửa với phiên bản cũ (hai tab) → báo xung đột, hiện dữ liệu mới; sửa bé (cân nặng 0 hoặc 200 → đúng câu lỗi; bỏ tích cảnh báo → xóa; không đụng → giữ); tab Lịch sử đúng thứ tự mới nhất trước, dòng nội trú/hóa đơn đúng quyền (Spa không có hóa đơn/thanh toán); Spa không thấy Chỉnh sửa/Thêm; 320 px (danh sách và hồ sơ).

## 7. Việc chờ chủ dự án

Bảng mẫu "Khách hàng & hồ sơ khách" (chỉnh bố cục khi có).
