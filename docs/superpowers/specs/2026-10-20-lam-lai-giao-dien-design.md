# Làm lại giao diện theo bộ mẫu mới (thiết kế)

Ngày: 20/10/2026 · Chủ dự án duyệt Phần A và Phần B trong hội thoại.

## 1. Mục tiêu

Chủ dự án gửi 9 bảng mẫu giao diện ("làm lại các trang theo hướng như này") và tài liệu chuyển động cho 10 màn. Mục tiêu: toàn bộ web (trang công khai, đặt lịch/đăng nhập, khu khách, khu nhân viên) đổi sang bố cục và phong cách của bộ mẫu — nhiều ảnh thật, thẻ phẳng gọn, bảng và khung "danh sách + chi tiết", ít trang trí hơn — **và** thêm các chức năng mới xuất hiện trong mẫu.

**Thành công khi:** mỗi màn trong mẫu có màn tương ứng trên bản xem trước, giống bố cục và phong cách mẫu; chức năng cũ không hỏng (bộ kiểm thử hiện có vẫn xanh); các quy tắc bảo vệ khách hàng (§3.1) vẫn đúng.

**Tài liệu nguồn (lưu trong repo):**
- Bảng mẫu: `docs/tham-khao/mau-giao-dien/01…05-*.webp` (trang chủ; đặt lịch + đăng nhập; khách tổng quan + nội trú; nhân viên lịch hẹn + hóa đơn; thú cưng + hồ sơ bé). Bốn bảng gửi sau (lịch hẹn & hóa đơn khách; khách hàng & hồ sơ khách; quản lý nội trú & cập nhật cho chủ nuôi; bảng giá & doanh thu) chưa có tệp — xem §7.
- Chuyển động: `docs/tham-khao/de-xuat-animation-tung-man-2026-10-20.md` (ràng buộc, áp dụng nguyên văn).
- Góp ý review: `docs/tham-khao/bao-cao-review-2026-10-20.md` (F01–F04 đã sửa; phần thiết kế được xử lý trong tài liệu này).
- Quy tắc nền: `docs/thiet-ke/QUYET-DINH.md`. Tài liệu này ghi rõ chỗ nào thay đổi QUYET-DINH (§3.2); chỗ nào không nhắc thì QUYET-DINH giữ nguyên.

## 2. Cách làm

**Làm lại tại chỗ.** Giữ tầng dữ liệu (`api` + mock), các đường dẫn trang và bộ kiểm thử; viết lại giao diện từng trang; thêm bộ thành phần chung mới; chức năng mới thêm dần, mỗi chức năng có kiểm thử. Sau mỗi phần, bản xem trước dùng được ngay.

Chia **5 phần**, làm theo thứ tự 1 → 2 → 3 → 4 → 5. Mỗi phần: bản thiết kế chi tiết (phần 1 nằm trong tài liệu này; phần 2–5 mỗi phần một tài liệu riêng trước khi làm) → kế hoạch → làm → `npm run verify` xanh → đăng lại bản xem trước.

## 3. Quyết định chung

### 3.1 Giữ nguyên

- Hero quỹ đạo (chỉ hero được lặp chuyển động).
- Khách không thấy: giờ trong nhật ký nội trú (chỉ "Sáng / Chiều / Tối"), tên thuốc, liều, giờ tiêm, y lệnh, ghi chú nội bộ, mã chuồng, tên nhân viên (R7, R20).
- Gọi khách là "bạn"; không dùng "quý khách", "Quý Khách", "lễ tân" (R17).
- Lịch hẹn chỉ có Đã hẹn / Đã hủy / Đã qua; không check-in (R8). "Chờ xác nhận" là trạng thái của **yêu cầu đặt lịch**, không phải của lịch hẹn.
- Thanh toán tại quầy; không thanh toán trực tuyến.
- Video nội trú không có âm thanh; không có biểu tượng loa / nút bật tiếng.

### 3.2 Thay đổi so với QUYET-DINH (chủ dự án quyết định 20/10/2026)

| Nội dung | Trước | Sau |
|---|---|---|
| Menu nhân viên | 6–7 mục, không có phân hệ ngoài 3 nhóm (C-brief) | Thêm Khám bệnh, Dịch vụ, Kho, Báo cáo, Cài đặt — **trang dữ liệu mẫu** có vài thao tác chính (phần 5) |
| Danh sách dịch vụ | Cố định 4 dịch vụ (R15) | Thêm dịch vụ mới (danh sách cụ thể chốt ở thiết kế phần 5; mẫu có "Tư vấn dinh dưỡng", "Xét nghiệm") |
| Tên bác sĩ trên web | Không đưa tên/chức danh bác sĩ | Hiện "Bác sĩ trưởng Lê Thái Sơn" kèm ảnh chủ dự án gửi |
| Video tải lên | ≤ 20 MB (R25) | ≤ 20 MB **và** ≤ 15 giây; luôn phát tắt tiếng |
| Quyền nhân viên Spa | Không nhập/xuất viện, không chia sẻ | Thêm `inpatient.admit`, `inpatient.share` (không có `inpatient.clinical`) — theo thiết kế nội trú đợt 2 |
| Tiền nội trú | — | Tính theo giờ, làm tròn lên 0,1 ngày — theo thiết kế nội trú đợt 2 |

### 3.3 Chi tiết trong ảnh mẫu không làm theo

Ảnh mẫu do công cụ tạo ảnh dựng, một số chữ sai: "Video tối đa 60 giây", "Cảm ơn Quý Khách", biểu tượng loa trên video, giờ "08:30" trong nhật ký cho khách, trạng thái "Đã hoàn tất" / "Hoàn thành" cho lịch hẹn, "Chờ xác nhận" gắn vào lịch hẹn. Những chỗ này làm theo §3.1. Dữ liệu trong mẫu (tên, số tiền, mã HD-…) là minh họa; bản demo dùng dữ liệu mẫu hiện có.

### 3.4 Điều hướng

- **Nhân viên** (thanh bên tím mận, hiện theo quyền): Trang chủ · Lịch hẹn (gồm Yêu cầu đặt lịch) · Khám bệnh · Khách hàng · Nội trú · Hóa đơn · Dịch vụ & Bảng giá · Kho · Doanh thu & Báo cáo · Cài đặt. Cuối thanh bên: người đang đăng nhập + "Đăng xuất". Điện thoại: thanh dưới 4 mục chính + "Thêm".
- **Khách** (thanh ngang trên cùng): Tổng quan · Thú cưng · Lịch hẹn · Nội trú · Hóa đơn; chuông cập nhật mới (dựa trên dấu "đã xem" R28); ảnh đại diện mở menu Tài khoản / Đăng xuất. Điện thoại: thanh dưới.
- **Công khai**: giữ menu Trang chủ · Giới thiệu · Dịch vụ · Liên hệ + Đăng nhập / Đăng ký.

### 3.5 Chuyển động (theo tài liệu của chủ dự án)

- Mỗi màn/khu vực kích hoạt độc lập với hero; hiệu ứng vào màn chạy một lần mỗi lần điều hướng; khu vực dưới chạy khi vào tầm nhìn.
- Dịch chuyển 8–12 px; không xoay, nảy, lò xo trên màn nghiệp vụ; nhóm lệch 40–60 ms, tổng ≤ 450 ms; chậm dần ở cuối.
- Nội dung và nút dùng được ngay, không khóa thao tác chờ hiệu ứng.
- Phản hồi nút 100–150 ms, không đổi kích thước; trạng thái "đang lưu" chỉ kéo dài theo xử lý thật; dấu tích chỉ khi lưu thành công; lỗi giữ dữ liệu nhập và báo tại chỗ; không rung báo lỗi.
- Tiến trình tải video phản ánh thật; không biết phần trăm thì hiện "Đang tải…"; không tự phát video.
- `prefers-reduced-motion`: bỏ trượt, phóng to, chuyển ảnh liên tục; chỉ hiện ngay hoặc mờ ≤ 100 ms.
- Không chạy lại hiệu ứng khi đang gõ/cuộn/đổi lựa chọn liên tục; không làm mất tiêu điểm bàn phím; không lặp hay tự cuộn trong khu làm việc.
- Thời lượng từng màn: theo bảng §2 của tài liệu chuyển động.

## 4. Năm phần

1. **Nền chung** — §5 dưới đây.
2. **Trang công khai, đặt lịch, đăng nhập**: trang chủ theo mẫu (Giới thiệu có ảnh + 3 điểm "Lắng nghe · Chăm sóc · Đồng hành"; Dịch vụ dạng tab + ảnh lớn + danh sách mục con; giảm viền/bóng theo review; giữ phân cấp cấp cứu và nút gọi); khối bác sĩ trưởng; trang đặt lịch hai cột (3 bước + hotline | form) với trường mới "Khung giờ (tùy chọn)"; đăng nhập có ảnh + dòng chữ viết tay "Luôn đồng hành cùng thú cưng của bạn", tab Khách hàng / Nhân viên, "Ghi nhớ đăng nhập", "Quên mật khẩu?".
3. **Khu khách hàng**: thanh ngang; Tổng quan (lời chào có ảnh, "Bé … hôm nay", "Lịch hẹn sắp tới", "Thú cưng của bạn", "Hóa đơn gần đây"); Thú cưng (danh sách có ảnh, tìm kiếm) và Hồ sơ bé (thông tin, lịch hẹn đã qua, tình trạng chung, "Chỉnh sửa", "Đặt lịch cho bé"); Lịch hẹn (tab Sắp tới / Lịch sử, khung chi tiết, **"Yêu cầu đổi lịch"**); Nội trú "Hôm nay của bé" (chọn bé, chọn ngày, video, nhật ký theo buổi); Hóa đơn (danh sách + chi tiết, **"Tải hóa đơn"** = bản in/PDF).
4. **Khu nhân viên**: Lịch hẹn tuần dạng lưới giờ + khung chi tiết; Khách hàng (bảng có phân trang, **"Thêm khách hàng"**, hồ sơ khách có tab Thú cưng / Lịch hẹn / Hóa đơn, **"Chỉnh sửa"**, lịch sử tương tác); Hóa đơn có bản xem trước bên phải và nhãn trạng thái lưu; Nội trú (tab Đang lưu trú / Đã xuất viện, khung chi tiết) + "Cập nhật cho chủ nuôi" (tình trạng chung, sáng/chiều/tối, video, xem trước góc nhìn khách) — **gộp `2026-10-20-noi-tru-day-du-design.md`**; Quản lý bảng giá (**thêm/sửa dịch vụ**, giá cố định / giá linh hoạt, giá tham khảo); Doanh thu (thẻ số liệu, biểu đồ theo ngày, theo danh mục).
5. **Phân hệ mới (dữ liệu mẫu)**: Khám bệnh, Dịch vụ, Kho, Báo cáo, Cài đặt + các dịch vụ mới. Mỗi mục là trang đẹp có dữ liệu mẫu và vài thao tác chính (ví dụ Kho: danh sách thuốc/vật tư, tồn, cảnh báo sắp hết, nhập thêm).

## 5. Phần 1 — Nền chung

### 5.1 Màu & bề mặt

Giữ bảng màu hiện có (`src/styles/tokens.css`). Thêm token:
- `--canvas-work` (nền tím xám nhạt cho khu làm việc khách/nhân viên, tông `#F4EFF4`), `--surface-card` (kem `#FCF9F6`), `--line-soft` (viền mảnh), `--r-card: 16px`, `--sh-card` (bóng rất nhẹ, mạnh nhất ngang `--e-1`/`--e-2`).
- Khu làm việc dùng thẻ phẳng: nền kem, viền mảnh, bo 16 px, bóng nhẹ. Bóng màu đậm (`--sh-plum*`) chỉ còn ở vài chỗ trang công khai (giảm theo review — phần 2 quyết định cụ thể).
- Độ tương phản chữ phụ ≥ 4,5:1 (review §4.5).

### 5.2 Thành phần dùng chung (thêm vào `src/ui/kit/`, xuất qua `@/ui`)

- **PetAvatar** — ảnh bé (bo 12 px) nếu có, ngược lại biểu tượng loài trên nền pastel; cỡ 40 / 56 / 96 / 160; `alt` = tên bé hoặc rỗng khi trang trí.
- **PageHeader** — breadcrumb, tiêu đề Lora, dòng mô tả, vùng nút; dùng chung cho khách và nhân viên (thay hai bản riêng hiện có).
- **DataTable** — cột khai báo, chọn dòng (nền tím nhạt + viền, không chỉ màu), phân trang "Hiển thị 1–5 của 24" + số trang, điều khiển bằng bàn phím (mũi tên lên/xuống, Enter mở), vùng cuộn có thể focus; dưới 768 px tự chuyển dạng thẻ; giữ chiều cao vùng bảng khi đổi trang/tìm kiếm.
- **MasterDetail** — danh sách + khung chi tiết: ≥ 1024 px chi tiết bên phải (vào từ phải 12 px, 220 ms); < 1024 px chi tiết toàn chiều rộng (đường dẫn riêng, nút quay lại). Quay lại giữ vị trí cuộn, bộ lọc, dòng đang chọn (lưu trong trạng thái điều hướng). Chi tiết mở không cướp tiêu điểm khỏi danh sách trừ khi mở bằng bàn phím.
- **StatCard** (biểu tượng + nhãn + số lớn), **SectionCard** (tiêu đề + liên kết "Xem tất cả →"), **DetailList** (cặp nhãn–giá trị), **EmptyState** (hình minh họa + câu + nút).
- **Tabs** — thêm gạch chân trượt (180 ms) cho kiểu `underline`.
- **SaveState** — "Bản nháp · Chưa lưu thay đổi" / "Đang lưu…" / "Đã lưu ✓"; dấu tích hiện 200 ms sau khi API trả thành công; lỗi → giữ nhãn "Chưa lưu thay đổi" và báo lỗi tại chỗ.

### 5.3 Ảnh

- `scripts/photos.py` (Python/PIL, như quy trình ảnh hiện có): cắt theo điểm nhấn, chỉnh màu đồng bộ, xuất WebP 3 cỡ — `avatar` (320 px vuông), `card` (960 px), `banner` (1600 px) — vào `src/assets/img/`.
- Nguồn: 7 ảnh hiện có + ảnh chủ dự án gửi (6 ảnh trong hội thoại 20/10: Pomeranian trắng, Poodle nâu ở khu chuồng, Poodle trong xe, hai bé mèo trắng, bác sĩ trưởng). Khi có tệp gốc, gán vào các bé mẫu hợp loài/màu lông; phần còn thiếu dùng biểu tượng.
- Dữ liệu: `pets.photo_key?` và `account_pets.photo_key?` (khóa ảnh, không phải URL); dữ liệu chiếu cho khách và nhân viên trả `photoKey`; giao diện đổi khóa thành URL qua `src/assets/media.ts`.
- Mọi ảnh mẫu kèm nhãn "Ảnh minh họa" như hiện nay. Ảnh có người: chỉ ảnh bác sĩ trưởng.
- Ảnh tải lười (`loading="lazy"`), có `width`/`height` để không giật bố cục.

### 5.4 Chuyển động dùng chung (`src/ui/motion.ts`)

Bộ preset đúng §3.5: `enterList` (8 px, 280 ms, lệch 60 ms, tối đa 5 mục), `enterPanel` (12 px từ phải, 220 ms), `tabSlide` (180 ms), `flashOnce` (nhấn nền 600 ms), `chartRise` (450 ms, một lần), `fadeSwap` (120–200 ms khi đổi dữ liệu). Ảnh bé chuyển từ danh sách sang hồ sơ bằng View Transitions (đã dùng ở R31); không hỗ trợ → mờ đơn giản. Giảm chuyển động → mọi preset thành mờ ≤ 100 ms.

### 5.5 Trang duyệt giao diện

`#/_giao-dien` (giống `#/_bo-icon`, mở từ chip demo): bày mọi thành phần §5.2 với dữ liệu mẫu, ở cả nền khách và nền nhân viên, để chủ dự án duyệt trước khi áp vào trang thật.

### 5.6 Kiểm thử phần 1

- Unit: DataTable (phân trang, đổi trang giữ số dòng, dòng chọn), PetAvatar (thiếu ảnh → biểu tượng loài), SaveState (dấu tích chỉ sau thành công), MasterDetail (giữ lựa chọn khi quay lại).
- E2E: trang `#/_giao-dien` qua axe; điều khiển bảng bằng bàn phím; giảm chuyển động (không còn transform); 320 px không cuộn ngang.
- Ngân sách: giữ ngưỡng hiện tại (JS khởi tạo ≤ 240 KB gz, ≤ 80 tệp ban đầu; ảnh không tính vào JS, tải lười).

## 6. Quan hệ với công việc khác

- Thiết kế nội trú đợt 2 (`2026-10-20-noi-tru-day-du-design.md`, kèm sửa đổi tiền theo giờ / cân nặng / quyền Spa) được thực hiện **trong phần 4**; màn "Quản lý nội trú" và "Cập nhật cho chủ nuôi" của mẫu thay cho §4 (màn hình) của tài liệu đó, còn §3 (dữ liệu & chức năng) giữ nguyên. Thời lượng video ≤ 15 giây bổ sung vào §3.6 của tài liệu đó.
- Các nhóm P1 khác (hủy hóa đơn, giảm giá, CSV, đặt lại mật khẩu…) chưa nằm trong đợt làm lại này trừ khi mẫu có (sửa bảng giá: phần 4).

## 7. Việc chờ chủ dự án

- **Tệp ảnh gốc**: ảnh dán trong khung chat không lưu thành tệp được. Cần đính kèm dạng tệp hoặc tải lên `docs/tham-khao/anh/` trên nhánh `claude/focused-pascal-rfxnnp`. Kèm 4 bảng mẫu gửi sau (để lưu vào `docs/tham-khao/mau-giao-dien/`).
- **Ảnh bác sĩ trưởng không có chữ in đè** (nếu có); chữ trên web dựng bằng văn bản thật.
- Phần 1 không bị chặn bởi ảnh: thành phần và trang duyệt dùng ảnh hiện có; ảnh mới thay khi có tệp.
