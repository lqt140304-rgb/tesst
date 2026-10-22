# Phần 5A — Khu nhân viên: Kho

Ngày: 22/10/2026 · Nhánh `claude/giao-dien` · Chủ dự án đã duyệt thiết kế bằng lời (22/10/2026: "ổn rồi"); tệp này chờ duyệt bản viết.

Thuộc phần 5 (`2026-10-21-phan-5-kho-bao-cao-cai-dat-design.md`, R40), mục nhỏ đầu tiên trong 5A → 5E. **Dữ liệu và chức năng đã có đủ** từ nhánh dữ liệu (`staff.stock.*`, quyền `stock.view` / `stock.manage`, 14 món mẫu); không cần đổi hợp đồng. Chưa có bảng mẫu giao diện cho Kho: dựng theo phong cách 4A–4D (cùng bộ thành phần, cùng giọng chữ), chỉnh khi có mẫu.

## 1. Nguyên tắc và phạm vi

Giống 4C–4D: mỗi màn một việc chính; chữ đời thường; nói trước điều sẽ xảy ra; người mới nhìn là hiểu. Kho **không bao giờ hiện cho khách**.

Quyền (kiểm ở API và ẩn ở giao diện, `useSession().can`):
- `stock.view`: thấy mục **Kho** ở thanh bên, xem danh sách, chi tiết, lịch sử. Mặc định chỉ Quản lý.
- `stock.manage` (cần cả `stock.view`): thấy các nút Thêm món, Sửa, Nhập thêm, Xuất ra, Kiểm kê, Ngừng dùng / Dùng lại. Người chỉ có quyền xem không thấy nút ghi (ẩn, không làm mờ).
- Vào thẳng địa chỉ khi không có quyền: trang "Bạn chưa có quyền xem mục này" như các màn khác (cơ chế `cap` của lộ trình).

Giữ nguyên quy tắc dữ liệu (không viết lại ở giao diện, dùng lại `@/data/rules/stock` cho kiểm tra và câu báo lỗi): số tồn chỉ đổi bằng Nhập thêm / Xuất ra / Kiểm kê; không đổi được loại của món; tên món không trùng trong cùng loại; món ngừng dùng không nhập, xuất, kiểm kê được; số lượng là số nguyên 0 – 1.000.000.

Không làm: biểu đồ kho, in hoặc xuất tệp danh sách, nhập nhiều món một lúc, ảnh món, mã vạch, nối kho với hóa đơn (kho chỉ ghi nhận tay), cảnh báo đẩy. Không xóa món (chỉ ngừng dùng).

## 2. Lối vào và địa chỉ

- Thanh bên nhân viên thêm mục **Kho** (biểu tượng hộp, `cap: 'stock.view'`), đặt sau Hóa đơn, trước Bảng giá.
- `paths.nv.stock = '/nv/kho'`, `paths.nv.stockItem(id) = '/nv/kho/:id'`; bí danh `nv-kho`. Tiêu đề trang theo `handle` của lộ trình như các màn khác.
- Danh sách nhớ bộ lọc trên địa chỉ (`?q=&loai=&tt=&ngung=1`) để Back / làm mới không mất lọc.

## 3. Danh sách `#/nv/kho`

- **Đầu trang:** "Kho", dòng phụ "Thuốc và vật tư trong phòng khám. Số tồn đổi bằng Nhập thêm, Xuất ra hoặc Kiểm kê.", nút **Thêm món** (`stock.manage`). Banner nhỏ: "Dữ liệu kho trong bản demo là dữ liệu mẫu."
- **Bốn ô tóm tắt** (từ `staff.stock.summary()`): **Sắp hết**, **Hết hàng**, **Sắp hết hạn**, **Đã hết hạn**. Mỗi ô là nút: bấm thì lọc danh sách theo ô đó, bấm lần nữa bỏ lọc. Giá trị 0 hiện nhạt, không tô màu cảnh báo. Có `aria-pressed` và nhãn đọc được ("Sắp hết: 3 món"). Số chạy lên một lần (`CountUp`).
  - Bộ lọc hết hạn của API (`expiring`) gồm cả món sắp hết hạn lẫn đã hết hạn, nên hai ô "Sắp hết hạn" và "Đã hết hạn" cùng bật chip lọc **Sắp hoặc đã hết hạn**. Ô tóm tắt vẫn tách hai số; số dòng trong bảng sau khi bấm là tổng hai ô.
- **Tìm và lọc:** ô "Tìm trong kho" (mã hoặc tên, không dấu); nhóm lọc **Loại** (Tất cả · Thuốc · Vật tư); nhóm lọc **Tình trạng** (Tất cả · Sắp hết · Hết hàng · Sắp hoặc đã hết hạn); hộp chọn "Hiện cả món đã ngừng dùng".
- **Bảng chung** (`DataTable`, 10 dòng/trang, điện thoại: thẻ): **Mã** · **Tên** (chữ chính, bấm vào mở chi tiết) · **Loại** · **Tồn** (số + đơn vị, ví dụ "25 chai", dùng `formatQty`) · **Mức báo hết** ("—" khi 0) · **Hạn dùng** (ngày Việt, "—" khi không có) · **Tình trạng**. Cột Tình trạng dùng nhãn màu: Ổn (xanh ngọc) · Sắp hết (cam) · Hết hàng (hồng đậm); nếu có hạn thì thêm nhãn thứ hai **Sắp hết hạn** / **Đã hết hạn**; món ngừng dùng có nhãn xám **Ngừng dùng**. Thứ tự do API trả (hết hàng, sắp hết, hết hạn, tên); giao diện không xếp lại.
- Danh sách rỗng: `EmptyState` "Chưa có món nào khớp. Thử bỏ bớt bộ lọc." kèm nút **Bỏ lọc**; kho trống hoàn toàn: "Kho chưa có món nào." kèm **Thêm món** (nếu có quyền).
- Đang tải: `LoadingBlocks`; lỗi tải: `PageProblem` có nút thử lại.

## 4. Chi tiết một món `#/nv/kho/:id`

- **Đầu trang:** lối quay lại "Kho", tên món, mã (KHO-0001), nhãn loại và nhãn tình trạng.
- **Thẻ thông tin:** Tồn hiện tại (số lớn + đơn vị), Mức báo hết, Hạn dùng, Loại, Đơn vị. Nếu hết hàng hoặc sắp hết hoặc hết hạn, một dòng nói bằng lời thường ở đầu thẻ: "Còn 3 hộp, thấp hơn mức báo hết 5." / "Đã hết hàng." / "Hết hạn từ 12/10/2026." / "Còn 20 ngày nữa hết hạn." (tính từ hạn dùng đang ghi trên món).
- **Nút hành động** (`stock.manage`): **Nhập thêm** · **Xuất ra** · **Kiểm kê** · **Sửa thông tin** · **Ngừng dùng** (hoặc **Dùng lại** khi đang ngừng). Món ngừng dùng: ba nút đầu khóa, kèm dòng "Món đã ngừng dùng. Bật lại trước khi nhập hoặc xuất." (đúng câu của quy tắc).
- **Lịch sử nhập xuất** (tối đa 100 dòng, mới nhất trước; từ `get`): bảng chung với **Ngày giờ** · **Loại** (Nhập / Xuất / Kiểm kê) · **Thay đổi** (+30 hoặc −8, màu theo chiều, không chỉ bằng màu: kèm dấu) · **Tồn sau** · **Lý do** · **Ghi chú** (nhà cung cấp hoặc ghi chú) · **Người làm**. Điện thoại: thẻ. Dòng cuối trang: "Hiện tối đa 100 lần gần nhất." khi đủ 100.
- Mở món không tồn tại: trang "Không tìm thấy món này" với lối về danh sách.

## 5. Hộp thoại

Dùng `Dialog` chung (Esc, trả tiêu điểm, toàn màn hình trên điện thoại), `Field`, thông báo lỗi gắn `aria-describedby`. Mỗi hộp thoại **ghi nhớ `version` lúc mở**; gặp `ConflictError` thì báo `saveError(e)` bằng thông báo nổi, đóng hộp thoại và tải lại món (không ghi đè). Lỗi `ValidationError(fields)` gắn đúng ô. Nút gửi đổi thành "Đang lưu…" và khóa trong lúc lưu. Lưu xong: thông báo nổi ngắn ("Đã nhập thêm 30 chai vào Nước muối sinh lý.") và danh sách / chi tiết tự làm mới.

1. **Thêm / Sửa món** (`StockItemDialog({ open, onClose, item? })`): Tên món · Loại (chip Thuốc / Vật tư; **khóa khi sửa**, kèm chú thích "Không đổi được loại của món này.") · Đơn vị (ví dụ viên, ống, hộp) · Số lượng ban đầu (chỉ khi thêm, mặc định 0) · Mức báo hết (gợi ý lấy từ `settings.stock_default_min`, mặc định 5; ghi chú "Để 0 nếu không cần báo sắp hết; vẫn báo khi hết hàng.") · Hạn dùng (ô ngày, bỏ trống được; nhập tay dạng `năm-tháng-ngày` cũng được). Khi sửa không có ô số lượng; dòng giải thích "Muốn đổi số tồn, dùng Nhập thêm, Xuất ra hoặc Kiểm kê." Thêm xong chuyển sang trang chi tiết món mới. Nếu `settings.get()` không đọc được (không có quyền), dùng 5.
2. **Nhập thêm** (`StockReceiveDialog`): Số lượng (số nguyên ≥ 1) · Nhà cung cấp (không bắt buộc) · Hạn dùng lô mới (không bắt buộc; chú thích "Món giữ hạn gần nhất giữa hạn cũ và hạn mới.") · Ghi chú. Dòng xem trước: "Tồn sau khi nhập: 55 chai". Số vượt 1.000.000 → báo đúng câu của quy tắc.
3. **Xuất ra** (`StockIssueDialog`): Số lượng · Lý do (chip: Dùng tại phòng khám · Hư hỏng · Hết hạn · Khác; mặc định Dùng tại phòng khám) · Ghi chú. Dòng xem trước: "Tồn sau khi xuất: 17 chai"; xuất quá số tồn → "Kho chỉ còn N <đơn vị>." ngay dưới ô số lượng, nút Lưu vẫn bấm được và ô lỗi được lấy từ kiểm tra (không chặn trước).
4. **Kiểm kê** (`StockAdjustDialog`): hiện "Tồn trên sổ: 20 chai"; ô **Số đếm được**; dòng chênh lệch tính ngay khi gõ: "Lệch −2 chai so với sổ." / "Lệch +3 chai so với sổ." / "Khớp sổ." (khớp thì báo đúng câu "Số đếm trùng số tồn, chưa có gì để điều chỉnh." khi bấm Lưu); Ghi chú. Một câu báo trước: "Lưu xong, số tồn sẽ thành số bạn đếm và một dòng Kiểm kê được ghi vào lịch sử."
5. **Ngừng dùng / Dùng lại** (`StockActiveDialog`): xác nhận một bước, nói rõ hậu quả: "Món sẽ ẩn khỏi danh sách mặc định và không nhập hay xuất được. Lịch sử và số tồn được giữ." / "Món sẽ hiện lại và nhập, xuất được bình thường." Thực hiện bằng `update` giữ nguyên các ô còn lại, đổi `active`.

## 6. Cấu trúc code

`src/features/staff/stock/`:
- `StockPage.tsx` (danh sách, tóm tắt, lọc), `StockItemPage.tsx` (chi tiết + lịch sử), `StockSummaryTiles.tsx`, `StockLevelTag.tsx` (nhãn tình trạng + hạn dùng + ngừng dùng), `MoveHistory.tsx`.
- `StockItemDialog.tsx`, `StockReceiveDialog.tsx`, `StockIssueDialog.tsx`, `StockAdjustDialog.tsx`, `StockActiveDialog.tsx`.
- `stockView.ts` (hàm thuần, có test): đọc / ghi bộ lọc trên địa chỉ và bỏ qua giá trị hỏng; nhãn tình trạng và nhãn hạn dùng; câu giải thích đầu thẻ chi tiết ("Còn 3 hộp, thấp hơn mức báo hết 5."); dấu và màu thay đổi (+/−); nhãn lý do; câu xem trước sau nhập / xuất; chênh lệch kiểm kê.
- `stockForm.ts` (hàm thuần, có test): gõ chuỗi số ("1.000", "  25 ") → số nguyên hoặc lỗi; dựng đầu vào cho từng thao tác từ ô nhập; gộp kiểm tra phía giao diện với `validateStockInput / validateReceive / validateIssue / validateAdjust` của `@/data/rules/stock`.
- `Stock.module.css`.
- Chỗ khác: `NAV` trong `StaffShell.tsx` (mục Kho), `paths.nv.stock*` và bí danh trong `src/app/routes.ts`, lộ trình + xuất trang trong `src/features/staff/index.tsx` (trang tải chậm như các màn khác), kiểm tra tên mục trong `e2e/manifest.ts`.

Không đụng `src/data`. Nếu thấy thiếu gì ở dữ liệu thì ghi vào `PROGRESS.md` mục "Yêu cầu gửi nhánh kia", không tự sửa.

## 7. Chuyển động và trợ năng

Chuyển động chỉ chạy một lần, ngắn (150–450 ms, dịch chuyển 8–12 px), theo `prefers-reduced-motion`; không nảy. Mọi điều khiển dùng được bằng bàn phím; ô tóm tắt là nút có `aria-pressed`; `ChipGroup` là radio có phím mũi tên; bảng có `scope="col"`, nhãn tình trạng có chữ (không dựa vào màu); số tồn đọc đủ cả đơn vị; tương phản chữ ≥ 4,5:1; 320 px không cuộn ngang (bảng chuyển thẻ, nút xếp dọc).

## 8. Kiểm thử

Đơn vị (viết trước, đỏ rồi mới xanh): `stockView` (địa chỉ ↔ bộ lọc, giá trị hỏng bị bỏ; nhãn tình trạng đủ 3 mức × 3 hạn dùng; câu giải thích đầu thẻ; +/−; xem trước sau nhập / xuất; chênh lệch kiểm kê dương / âm / khớp) và `stockForm` ("1.000" → 1000; "0", "abc", "2,5", số âm, quá 1.000.000 → lỗi đúng câu; hạn dùng sai dạng; đầu vào Thêm / Sửa / Nhập / Xuất / Kiểm kê dựng đúng; sửa không gửi số lượng).

E2E `e2e/giao-dien-nhan-vien-e.spec.ts` (viết trước, ba cỡ màn hình, `@narrow` khi cần):
- Quản lý vào Kho thấy 13 món đang dùng (trang 1 có 10, trang 2 có 3); bật "Hiện cả món đã ngừng dùng" thì thấy 14; bốn ô tóm tắt khớp dữ liệu mẫu; bấm ô lọc đúng và bấm lại bỏ lọc; tìm không dấu; lọc loại và tình trạng; Back giữ bộ lọc.
- Bác sĩ / Spa không có mục Kho trên thanh bên và vào thẳng `#/nv/kho` thì thấy trang không có quyền. Trường hợp "chỉ có quyền xem, không thấy nút ghi" chưa thử được bằng giao diện vì màn cấp quyền thuộc 5C: ở 5A kiểm bằng test đơn vị của hàm quyết định nút (`stockView`) và bổ sung e2e ở 5C.
- Thêm món (tên trùng báo lỗi dưới ô tên; thêm hợp lệ → vào trang chi tiết món mới, tồn đúng số ban đầu); sửa món (loại bị khóa, đổi mức báo hết đổi tình trạng); Nhập thêm (tồn tăng, lịch sử có dòng Nhập kèm nhà cung cấp); Xuất ra (quá số tồn → "Kho chỉ còn N …"; hợp lệ → tồn giảm, dòng Xuất đúng lý do); Kiểm kê (lệch hiện ngay, khớp báo đúng câu, lưu → dòng Kiểm kê, tồn bằng số đếm); xuất về 0 → nhãn Hết hàng; Ngừng dùng → ba nút khóa + dòng giải thích, mất khỏi danh sách mặc định; Dùng lại → nhập được.
- Xung đột phiên bản: mở hộp thoại ở một tab, sửa món ở tab khác, lưu ở tab đầu → thông báo "đã có người cập nhật", hộp thoại đóng, dữ liệu mới hiện, không ghi đè.
- Bàn phím (mở hộp thoại bằng Enter, Esc đóng và tiêu điểm trở lại nút), `axe` không lỗi trên danh sách, chi tiết và một hộp thoại mở, 320 px không cuộn ngang trên danh sách và chi tiết.

Cập nhật `e2e/manifest.ts` (hai màn mới) để ảnh duyệt `npm run shots` có Kho.

## 9. Việc chờ chủ dự án

Bảng mẫu giao diện "Kho" (chỉnh bố cục khi có). Danh sách món và đơn vị thật của phòng khám (đang là dữ liệu mẫu).
