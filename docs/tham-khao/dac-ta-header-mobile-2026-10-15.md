# Đặc tả CHỐT: header mobile và menu xổ xuống (chủ dự án duyệt 15/10/2026)

**Người thiết kế:** Claude. **Chủ dự án đã duyệt** đặc tả đề xuất ngày 15/10/2026 với hai thay đổi: **(1) nút to hơn; (2) đã đăng nhập thì hiện "Đăng xuất" ở cuối menu.** **Bổ sung 16/10/2026 (chủ dự án): (3) khi đã đăng nhập hiện tên khách (1–3 từ giữ đủ; từ 4 từ trở lên chỉ lấy 2 từ cuối); (4) logo lớn hơn ở cả mobile và máy tính.** Các mục (3) và (4) thay các dòng liên quan ở mục 1 và 2 dưới đây. Ghi bởi Claude. **Người triển khai: Codex** (chủ dự án giao 15/10: "codex tích hợp"); Antigravity không làm mục này. Thay thế yêu cầu [header mobile giao Antigravity](yeu-cau-header-mobile-antigravity-2026-10-15.md). Nền thiết kế: ảnh chủ dự án chọn ([header-mobile-chu-du-an.png](anh-mau-header-mobile-2026-10-15/header-mobile-chu-du-an.png)).

**Bản mẫu chạy được (chuẩn):** [dac-ta-header-mobile-mau/header-mobile-mau.html](dac-ta-header-mobile-mau/header-mobile-mau.html) (thêm `?open=1` mở sẵn menu, `?user=1` trạng thái đã đăng nhập). Ảnh: [tổng hợp](dac-ta-header-mobile-mau/anh/00-tong-hop.png). Chép CSS và JS từ bản mẫu; không viết lại màu, cỡ, khoảng cách.

## 1. Header (menu đóng)

Một hàng: **logo trái; phải: Đăng nhập, Đăng ký, ☰.** Hai nút khách luôn hiện, cả khi menu mở.

| Phần | Đặc tả |
|---|---|
| Đăng nhập | Viên thuốc, nền `rgba(255,255,255,.7)`, viền 1,5 px `rgba(90,30,94,.2)`, chữ `#5A1E5E`, đậm 600 |
| Đăng ký | Viên thuốc, nền `#5A1E5E`, chữ `#FBF7F1`, đậm 600, bóng `0 10px 22px -12px rgba(90,30,94,.7)` |
| ☰ | Ô 44×44, bo 14 px, nền `#FEF7F1`, viền 1,5 px `rgba(90,30,94,.16)`, biểu tượng 22 px `#5A1E5E` |
| Cao nút | ≥ 44 px; header cao tối thiểu 68 px |
| Chữ nút | **≥ 13,5 px ở mọi cỡ** (14,5 px từ 501 px; 14 px ở 341–500 px; 13,5 px ở ≤ 340 px) |

**Logo lớn hơn (chủ dự án 16/10): ảnh logo rộng ≥ 56 px ở mọi cỡ mobile và 72×65 px ở máy tính** (trước đó 46×42 mobile, 48 đến 60 px cao ở máy tính). Khi hẹp thì thu **chữ thương hiệu bên cạnh logo**, không thu logo và không thu nút.

| Chiều rộng | Logo và chữ thương hiệu | Đệm ngang nút / khoảng cách nút | Lề header |
|---|---|---|---|
| ≥ 993 px (máy tính) | Logo **72×65**, "BỆNH VIỆN THÚ Y" 12 px, "Lê Sơn" 28 px; header cao tối thiểu 96 px; nav ngang hiện, không có ☰ | 22 px / 10 px, chữ nút 15 px | 24 px |
| 501–992 px | Logo **56×51**, "BỆNH VIỆN THÚ Y" 10 px, "Lê Sơn" 22 px | 18 px / 10 px, chữ nút 14,5 px | 16 px |
| 461–500 px | như trên | 12 px / 6 px, chữ nút 14 px | 12 px |
| 421–460 px | Logo 56×51 và "Lê Sơn" 21 px; **bỏ dòng "BỆNH VIỆN THÚ Y"** | 12 px / 6 px | 12 px |
| 341–420 px | **Chỉ còn logo** 56×51 (ảnh logo đã có chữ "Lê Sơn"); giữ tên truy cập (`aria-label`) | 12 px / 6 px | 12 px |
| 320–340 px | Chỉ logo 56×51 | 9 px / 5 px, chữ nút 13,5 px | 10 px |

Header cao tối thiểu 68 px trên mobile (72 px nếu logo cần). Logo giữ nguyên ảnh chính thức, không đổi màu. Nav ngang ở máy tính giữ như hiện có (Trang chủ, Dịch vụ, Giới thiệu, Liên hệ); chỉ đổi cỡ logo, chữ thương hiệu và chiều cao header. Khi đổi chiều cao header máy tính, kiểm lại Hero (chiều cao khối Hero tính lại theo stage).

## 2. Menu xổ xuống (☰)

- Hộp nổi ngay dưới header, **không đẩy Hero xuống** (định vị tuyệt đối, `z-index` cao hơn Hero), thay drawer trượt cạnh ở mobile.
- Nền `#FFFFFF`, viền 1 px `rgba(90,30,94,.08)`, bo 22 px, đệm 10 px, bóng `0 24px 50px -20px rgba(66,18,71,.35)`. Rộng `min(318px, 100% − 24px)`, cách mép phải 12 px, chồng lên đáy header 6 px.
- Liên kết xếp dọc, mỗi dòng cao ≥ 48 px, bo 12 px, chữ 16 px: **Trang chủ, Dịch vụ, Giới thiệu, Liên hệ**. Trang hiện tại (`aria-current="page"`): nền `#F6EFF4`, chữ `#5A1E5E`, đậm 700 (ở trang Dịch vụ thì đánh dấu Dịch vụ). Rê chuột: nền `#F6EFF4`.
- **Khách:** hàng cuối hộp có Đăng nhập (viền) và Đăng ký (tím) cạnh nhau, rộng bằng nhau, cách 8 px, cao ≥ 44 px.
- **Đã đăng nhập:** header hiện nút tài khoản (avatar + tên) thay hai nút khách. **Quy tắc hiển thị tên (chủ dự án 16/10):** tên có **1 đến 3 từ** hiện đủ (ví dụ "Nguyễn Văn An", "Khách Demo"); tên có **4 từ trở lên chỉ lấy 2 từ cuối** (ví dụ "Nguyễn Thị Phương Anh" thành "Phương Anh"; "Trần Nguyễn Thị Phương Anh Thư" thành "Anh Thư"). Tên đầy đủ đặt vào `title` và `aria-label` ("Tài khoản của ..."). Hiện ở mọi cỡ kể cả 320 px, chữ 13 px, một dòng; nếu vẫn không đủ chỗ thì cho xuống tối đa 2 dòng (nút cao ≥ 44 px). Avatar lấy chữ cái đầu của từ cuối. Hàm mẫu `shortName()` nằm trong bản mẫu. Bản mẫu thử với "Khách Demo", "Nguyễn Văn An", "Nguyễn Thị Phương Anh", "Trần Nguyễn Thị Phương Anh Thư" (thêm `?name=...`; ảnh [tên rút gọn](dac-ta-header-mobile-mau/anh/02-ten-rut-gon.png)). Hộp giữ bốn liên kết; hàng cuối là **một nút "Đăng xuất" rộng hết hộp**, cao ≥ 44 px, nền trắng, viền 1,5 px `rgba(156,42,42,.3)`, chữ `#9C2A2A`. Không hiện nút dành cho khách. Đích tạm `#dang-xuat` (cùng mục "Đăng xuất" của dropdown tài khoản hiện có; chưa có chức năng thật). Dropdown tài khoản có sẵn giữ nguyên.

## 3. Hành vi và hỗ trợ tiếp cận

- Bấm ☰ mở/đóng; `aria-expanded` và `aria-controls="mobileMenu"` đúng; nhãn nút đổi giữa "Mở danh mục điều hướng" và "Đóng danh mục điều hướng".
- Escape đóng và trả tiêu điểm về ☰. Bấm ngoài đóng. Bấm một liên kết trong hộp đóng.
- Menu đóng: `hidden`, không nhận tiêu điểm. Mở: Tab đi vào liên kết đầu rồi đến hàng cuối.
- Không khóa cuộn, không `inert` lên Hero (hộp nhỏ không phủ màn hình).
- Viền focus 3 px `#5A1E5E`, cách 3 px.
- Áp dụng từ 992 px trở xuống và trong khung xem thử Mobile 390; desktop ≥ 993 px không đổi. Trang Chủ và Dịch vụ dùng chung.
- Bỏ drawer cũ ở các mốc này (`#mobileDrawer`, lớp phủ, khóa cuộn, `inert` Hero), giữ mã desktop.

## 4. Đã kiểm trên bản mẫu (Claude, Chromium)

Đo từng px từ 320 đến 620 rồi mỗi 20 px đến 1500, tám tổ hợp (khách và bốn tên đã đăng nhập: "Khách Demo", "Nguyễn Thị Phương Anh", "Trần Nguyễn Thị Phương Anh Thư", "Nguyễn Văn An" × menu đóng/mở), mã [do-tung-px.js](dac-ta-header-mobile-mau/do-tung-px.js): 0 phép đo có đè nhau, vượt mép, tràn ngang, hộp menu vượt mép, nút thấp hơn 44 px, chữ nút nhỏ hơn 13,5 px, logo hẹp hơn 56 px, tên bị cắt chữ, hoặc logo sát nút dưới 4 px. Ảnh: [logo lớn và tên đầy đủ](dac-ta-header-mobile-mau/anh/01-logo-lon-ten-day-du.png). Hành vi: mở bằng ☰, `aria-expanded` đúng, Escape đóng và trả tiêu điểm, bấm ngoài đóng, menu đóng không hiển thị, Tab vào "Trang chủ". **Chưa kiểm:** tích hợp thật (khung Mobile 390, trang Dịch vụ, `app.js`, dropdown tài khoản), máy thật.

## 5. Giao Codex

Làm trên nhánh `codex/hero-chinh-quy-dao` (nền `0873d129fdfbdf87c082c09945548a26e3553902` hoặc bản mới hơn của bạn), tách commit riêng cho header. Nhánh CTA của Claude `claude/cta-dich-vu-sua` @ `229cf79` đang chờ Codex kiểm chéo; có thể gộp trước nếu Codex đã kiểm, nhưng không bắt buộc cho việc này.

**Phạm vi:** chỉ header và menu theo mục 1 đến 3, hai trang `index.html` và `services.html`, khung Mobile 390, trạng thái khách và đã đăng nhập. Không đổi `hero-orbit.js`, `hero-orbit.css`, nội dung Hero, CTA, bốn thẻ, modal. Không đẩy `antigravity/design` hay `main`, không merge, không deploy. Cập nhật bảng "Tiêu chí" trong demo nếu có chỗ nhắc header cũ.

**Đạt khi (Claude kiểm):**
1. Giống bản mẫu và ảnh chủ dự án ở 320, 360, 390, 420 px và khung Mobile 390, menu đóng và mở, khách và đã đăng nhập.
2. Đo từng px 320 đến 560, hai trang, hai trạng thái, menu đóng và mở: không đè, không vượt mép, không tràn ngang; hai nút khách luôn hiện; chữ nút ≥ 13,5 px; nút ≥ 44 px.
3. Menu: hộp nổi không đẩy Hero; thứ tự liên kết; dòng trang hiện tại đúng ở cả hai trang; hàng cuối đúng (khách: hai nút; đã đăng nhập: "Đăng xuất" ở cuối menu, không có nút khách).
4. Bàn phím và aria như mục 3; viền focus rõ; không còn drawer cũ ở mobile; desktop ≥ 993 px không đổi.
5. Hero không đổi (`hero-orbit.js` và `.css` trùng byte); không lỗi console; trang Dịch vụ không hồi quy.

**Bàn giao:** branch, SHA đầy đủ, danh sách tệp đổi, ảnh header đóng và mở ở 360, 390, 420 và khung Mobile 390 (khách, đã đăng nhập), số đo từng px, và ghi rõ đã kiểm hay chưa kiểm.
