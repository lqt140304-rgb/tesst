# Phần 4D — Khu nhân viên: Bảng giá và Doanh thu

Ngày: 22/10/2026 · Nhánh `claude/giao-dien` · Chủ dự án đã duyệt thiết kế bằng lời (22/10/2026: **sửa dịch vụ bằng hộp thoại**, **Doanh thu có thêm "Chọn ngày"**); tệp này chờ duyệt bản viết.

Thuộc phần 4 của `2026-10-20-lam-lai-giao-dien-design.md` §4 mục 4. Chưa có bảng mẫu "Bảng giá & Doanh thu" (dựng theo phong cách 4A–4C, chỉnh khi có mẫu). **Dữ liệu và chức năng đã có đủ** từ nhánh dữ liệu (R36: `staff.prices.list/create/update/setActive`, `reference_price`, `staff.reports.revenue` với `byCategory` sau giảm giá); **không đổi hợp đồng**.

## 1. Nguyên tắc và phạm vi

Giống 4C: mỗi màn một việc chính; chữ đời thường; nói trước điều sẽ xảy ra; nhắc nhưng không chặn khi không cần. Giữ nguyên quyền theo khả năng: `pricelist.edit` (chỉ Quản lý) mới thấy nút thêm, sửa, ngừng dùng; `reports.revenue` (chỉ Quản lý) mới thấy mục Doanh thu. Bác sĩ và Spa chỉ **xem** Bảng giá như hiện nay.

Giữ nguyên quy tắc dữ liệu (không viết lại ở giao diện): giá mới chỉ áp dụng cho hóa đơn lập sau, dòng hóa đơn cũ giữ nguyên; mục ngừng dùng không thêm được vào hóa đơn mới nhưng hóa đơn nháp đang có vẫn lưu được; ba mục tiền nội trú LT01–LT03 không tắt được và không đổi sang nhập giá; nhóm (category) không đổi được sau khi tạo; mã dịch vụ do hệ thống cấp (KB10…); thuốc và vật tư luôn gộp thành một dòng cho khách ("Thuốc và vật tư điều trị", R7); nhóm Khám và điều trị chọn được khách thấy từng dòng hay gộp; Spa và Nội trú luôn hiện từng dòng.

Không làm: sửa ngay trên dòng bảng, nhập/xuất tệp, sửa hàng loạt, xóa dịch vụ (chỉ ngừng dùng), in bảng giá, xuất CSV doanh thu, thay đổi cách tính doanh thu.

## 2. Bảng giá `#/nv/bang-gia`

- **Đầu trang:** tiêu đề "Bảng giá", dòng phụ "Đơn giá dùng khi lập hóa đơn. Giá trên hóa đơn cũ được giữ nguyên.", nút **Thêm dịch vụ** (`pricelist.edit`). Giữ banner "Giá trong bản demo là giá minh họa, chưa phải giá thật của bệnh viện."
- **Tìm và lọc:** ô "Tìm trong bảng giá" (mã hoặc tên, không dấu); nhóm lọc theo nhóm dịch vụ (Tất cả · Khám và điều trị · Spa & Grooming · Nội trú · Thuốc · Vật tư — chỉ các nhóm có mục); nhóm lọc trạng thái (Đang dùng · Ngừng dùng · Tất cả), **mặc định "Đang dùng"**, mỗi chip kèm số lượng (ví dụ "Ngừng dùng (3)").
- **Bảng chung** (`DataTable`, 10 dòng/trang, điện thoại: thẻ): **Mã** · **Tên** (kèm chú thích "khách thấy trong 'Thuốc và vật tư điều trị'" cho mục gộp) · **Nhóm** (nhãn màu như hiện nay) · **Đơn vị** · **Giá** · **Trạng thái** · (có quyền sửa) cột thao tác **Sửa**. Cột Giá: mục giá cố định `formatVnd`; mục nhập giá ghi "Nhập khi lập hóa đơn" và dòng nhỏ "gợi ý 200.000 ₫" khi có `reference_price`. Mục ngừng dùng mờ nhẹ và có nhãn "Ngừng dùng". Mục LT01–LT03 ghi chú nhỏ "Dùng để tính tiền nội trú". Số, mã, tiền dùng `.num`.
- **Hộp thoại Thêm/Sửa dịch vụ** (`PriceDialog({ open, onClose, item? })`, một biểu mẫu cho cả hai):
  - **Nhóm:** khi thêm — chọn (`Select`, 5 nhóm); khi sửa — chỉ hiển thị kèm "Nhóm không đổi được".
  - **Tên**, **Đơn vị** (ví dụ "lần", "ngày", "viên").
  - **Cách tính giá:** `ChipGroup` Giá cố định / Nhập khi lập hóa đơn (mục LT01–LT03: khóa ở "Giá cố định" kèm "Mục tính tiền nội trú không đổi sang nhập giá.").
  - **Giá (₫)** khi giá cố định; **Giá gợi ý (₫)** khi nhập giá, không bắt buộc, chú thích "Chỉ để điền sẵn khi lập hóa đơn, bạn vẫn sửa được lúc đó." Nhập số nguyên ≥ 1, bỏ dấu chấm và khoảng trắng khi gõ (`150.000` → 150000).
  - **Khách thấy trong:** chỉ với nhóm Khám và điều trị — "Từng dòng" / "Thuốc và vật tư điều trị"; các nhóm khác không hiện ô (ghi một dòng cố định: Thuốc/Vật tư "Khách thấy gộp trong 'Thuốc và vật tư điều trị'", Spa/Nội trú "Khách thấy từng dòng").
  - Dòng nhắc luôn hiện khi sửa: "Giá mới chỉ áp dụng cho hóa đơn lập sau. Hóa đơn cũ giữ nguyên." Dòng tóm tắt trước khi lưu: "Lưu: Cắt móng · 80.000 ₫ / lần".
  - Nút **Lưu dịch vụ**; thêm mới thành công → toast "Đã thêm dịch vụ KB32." (mã do hệ thống cấp); sửa → "Đã lưu dịch vụ KB32." Lỗi trường (`ValidationError`: `name`, `unit`, `price`, `reference_price`, `price_mode`, `category`) hiện dưới đúng ô, dữ liệu đã gõ giữ nguyên. Sửa gửi **phiên bản lúc mở**; `ConflictError` → toast "vừa được người khác cập nhật", đóng hộp thoại, bảng tự tải lại.
  - Hộp thoại đã mở **không biến mất** khi dữ liệu nền đổi (bài học 4C): lưu sẽ báo lý do.
- **Ngừng dùng / Dùng lại** (`pricelist.edit`): trên mỗi dòng, nút phụ trong hộp thoại Sửa và ở dòng bảng ("Ngừng dùng"/"Dùng lại"). Ngừng dùng mở hộp xác nhận: "Ngừng dùng {tên}? Dịch vụ sẽ không thêm được vào hóa đơn mới. Hóa đơn nháp đang có dịch vụ này vẫn lưu được và hóa đơn cũ giữ nguyên." (nút "Ngừng dùng" / "Giữ lại"). Dùng lại không cần xác nhận. LT01–LT03: nút bị tắt kèm lý do "Mục tính tiền nội trú, không tắt được." Gửi `setActive(id, version, active)` với phiên bản của hàng; xung đột như trên.
- **Chỉ xem** (không có `pricelist.edit`): không có nút nào; giữ nguyên chữ và banner; bài e2e cũ ("price list is read-only…") vẫn đúng.
- Rỗng sau khi lọc: "Không tìm thấy dịch vụ phù hợp." kèm nút "Xóa bộ lọc".

## 3. Doanh thu `#/nv/doanh-thu`

- **Chọn kỳ:** `ChipGroup` Hôm nay · 7 ngày · Tháng này · Tháng trước · **Chọn ngày**. "Chọn ngày" mở hai ô ngày **Từ ngày** và **Đến ngày** ngay dưới (mặc định = kỳ đang xem), nút **Xem**. Kiểm tra ở giao diện bằng `validateRange` (`src/data/rules/calendar.ts`): ngày thật, từ ≤ đến, tối đa 366 ngày, trong các năm 2000–2100, dùng đúng các câu `RANGE_MSG`; lỗi hiện dưới ô, **không gọi** API khi có lỗi và giữ số liệu đang xem. Đường dẫn giữ trạng thái kỳ trong `?tu=…&den=…` để tải lại hoặc quay lại vẫn thấy kỳ cũ.
- **Dòng tiêu đề kỳ:** "{từ} – {đến} · tính theo tiền đã thu" như hiện nay.
- **Ba thẻ số** (thẻ chung): **Tiền đã thu** (kèm "↑ 12% so với kỳ trước" hoặc "Kỳ trước chưa có số liệu"; kỳ trước = khoảng dài bằng kỳ này liền trước — `previousPeriod`), **Hóa đơn phát hành**, **Còn phải thu** (không theo kỳ; giữ `data-kpi="collected|issued|outstanding"` và giá trị 2.975.000 ₫ của dữ liệu mẫu).
- **Hộp "Cách tính"** gấp gọn (`<details>`, đóng sẵn) giải thích bằng chữ thường: "Tiền đã thu là tiền khách đã trả trong kỳ. Theo nhóm dịch vụ tính trên hóa đơn phát hành trong kỳ, sau giảm giá, nên hai con số có thể khác nhau. Còn phải thu là mọi hóa đơn đang nợ, không theo kỳ."
- **Tiền thu theo ngày:** biểu đồ cột như hiện nay (một lần vào, giảm chuyển động → hiện ngay) + nút "Xem dạng bảng" (bảng chung, mặc định một trang đủ cho kỳ ngắn; kỳ dài phân trang 10 ngày). Kỳ dài hơn 31 ngày: nhãn cột chỉ hiện đầu mỗi tuần để không chen chúc.
- **Theo phương thức:** ba dòng (Tiền mặt · Chuyển khoản · QR) kèm tỷ lệ %.
- **Theo nhóm dịch vụ:** thanh ngang như hiện nay, mỗi nhóm kèm số tiền và **tỷ lệ % trên tổng**; có nút "Xem dạng bảng". Ghi chú "(theo hóa đơn phát hành trong kỳ, sau giảm giá)".
- **Hóa đơn còn nợ:** bảng chung (`DataTable`): Hóa đơn · Khách hàng · Đã qua (số ngày, "Quá N ngày" khi > 10) · Còn nợ · nút Mở (khi có quyền xem hóa đơn); cũ nhất lên trước. Rỗng: "Không có hóa đơn còn nợ."
- Giữ dòng "Số liệu được tính từ dữ liệu mẫu." và việc ẩn mục Doanh thu với người không có quyền (màn "Mục này dành cho người có quyền phù hợp").
- Không có dữ liệu trong kỳ: thẻ số hiện 0 ₫ và biểu đồ ghi "Chưa có khoản thu nào trong kỳ này." thay vì cột rỗng.

## 4. Cấu trúc code

`src/features/staff/pricelist/`: `PricesPage.tsx` (viết lại: bảng chung, lọc), `PriceDialog.tsx` (mới), `DeactivateDialog.tsx` (mới), `priceForm.ts` (mới, hàm thuần: gõ số tiền → số nguyên, kiểm tra trước khi gửi, tóm tắt "Cắt móng · 80.000 ₫ / lần", nhãn giá cho bảng, khóa LT01–LT03; có test), `Prices.module.css`. `src/features/staff/revenue/`: `RevenuePage.tsx` (viết lại), `PeriodPicker.tsx` (mới), `revenueView.ts` (mới, hàm thuần: khoảng ngày theo kỳ có sẵn, đọc/ghi `?tu&den`, tỷ lệ %, nhãn trục, kỳ trước; có test), `RevenueChart.tsx`/`CategoryBars.tsx` (tách từ trang), `OpenInvoices.tsx` (mới), `Revenue.module.css`. Không thêm thư viện; không đổi `src/data/**`.

Ghi vào `PROGRESS.md` mục "Yêu cầu gửi nhánh kia" (không chặn 4D): `staff.reports.revenue` **chưa kiểm tra khoảng ngày** (khác `operations`), nên khoảng ngày vô lý (đảo ngược, hơn 366 ngày, năm quá lớn) chỉ bị chặn ở giao diện.

## 5. Chuyển động và trợ năng

Hộp thoại theo `Dialog` chung (Esc, trả tiêu điểm, toàn màn hình trên điện thoại). Lỗi gắn `aria-describedby` qua `Field`; `ChipGroup` là radio có phím mũi tên; biểu đồ có nhãn và bảng thay thế; thẻ số có `aria-label`; điều khiển bằng bàn phím; tương phản ≥ 4,5:1; 320 px không cuộn ngang; `prefers-reduced-motion` tắt dịch chuyển. Chuyển động chạy một lần, 150–450 ms.

## 6. Kiểm thử

Đơn vị (viết trước): `priceForm` (gõ "150.000" → 150000; số âm/0/thập phân → lỗi; tên trống; giá gợi ý rỗng được; tóm tắt; LT01–LT03 khóa; nhãn giá cố định/nhập giá/gợi ý), `revenueView` (khoảng ngày của 4 kỳ cố định; `?tu&den` đọc/ghi và bỏ qua giá trị hỏng; tỷ lệ % cộng đúng 100 và không `NaN` khi tổng 0; kỳ trước bằng độ dài; nhãn trục thưa khi kỳ dài).

E2E `e2e/giao-dien-nhan-vien-d.spec.ts` (viết trước, ba cỡ màn hình): Quản lý thêm dịch vụ (mã mới, hiện trong bảng, thêm được vào hóa đơn nháp); sửa giá (hóa đơn cũ giữ giá — kiểm bằng một hóa đơn có sẵn); dịch vụ nhập giá có giá gợi ý và lập hóa đơn điền sẵn đúng số; LT01–LT03 không tắt được; ngừng dùng (xác nhận, không còn trong "Thêm dịch vụ" của hóa đơn nháp, hóa đơn nháp đã có vẫn lưu); dùng lại; lỗi trường giữ dữ liệu; hai tab sửa cùng dịch vụ → xung đột, không ghi đè; hộp thoại mở giữ nguyên khi tab khác đổi dữ liệu; bác sĩ/Spa chỉ xem (không thấy nút); Doanh thu: 4 kỳ cố định, "Chọn ngày" hợp lệ đổi số liệu, từ > đến / quá 366 ngày / ngày sai báo đúng `RANGE_MSG` và giữ số liệu cũ, `?tu&den` giữ kỳ khi tải lại, tỷ lệ nhóm cộng 100%, kỳ không có thu hiện thông báo rỗng, ẩn với người không quyền; a11y (axe) cho hai trang và hai hộp thoại; 320 px. Chỉnh nhỏ bài cũ ở `staff-b` (các bài Bảng giá/Doanh thu) nếu chữ đổi và ghi lại.

## 7. Việc chờ chủ dự án

Bảng mẫu "Bảng giá & Doanh thu" (chỉnh bố cục khi có). Giá thật của bệnh viện (đang là giá minh họa).
