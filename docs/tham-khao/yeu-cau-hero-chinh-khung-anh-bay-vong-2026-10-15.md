# Yêu cầu: Hero "khung ảnh bay vòng" là Hero chính của website (chủ dự án chốt 15/10/2026)

**Ghi bởi:** Claude, chép quyết định của chủ dự án ngày 15/10/2026 ("oke đây sẽ là hero chính của website") và thêm mục "Đạt khi" để QA. **Thay thế** Hero hiện tại trên `antigravity/design` và mọi yêu cầu sửa Hero cũ, gồm [yeu-cau-sua-hero-giong-anh-demo-antigravity.md](yeu-cau-sua-hero-giong-anh-demo-antigravity.md). Chưa merge `main`, chưa xuất bản.

## Người làm: Codex (chủ dự án giao 15/10/2026)

Chủ dự án giao **Codex** đưa Hero này vào `demo/` của `antigravity/design` (thay vì Antigravity tự làm lại). Nội dung các mục dưới đây áp dụng cho Codex. Claude đã làm thử một bản tích hợp để Codex tham khảo (patch áp được vào `8bb446f`, kèm ghi chú những gì đã và chưa kiểm): [ban-tich-hop-demo-tham-khao](https://github.com/lqt140304-rgb/web-b-nh-vi-n/tree/shared/qa-review/docs/de-xuat-hero-quy-dao/ban-tich-hop-demo-tham-khao) trên `shared/qa-review` @ `5b15b37`. Codex được dùng, sửa hoặc bỏ. Sau khi Codex báo xong, Claude kiểm theo mục "Đạt khi" (lượt đầu dùng Opus).

## Nguồn tham chiếu (bản duyệt)

Thư mục [docs/de-xuat-hero-quy-dao/](https://github.com/lqt140304-rgb/web-b-nh-vi-n/tree/shared/qa-review/docs/de-xuat-hero-quy-dao) trên nhánh `shared/qa-review`, commit `f58c2d7`:
- [hero-quy-dao.html](https://github.com/lqt140304-rgb/web-b-nh-vi-n/blob/shared/qa-review/docs/de-xuat-hero-quy-dao/hero-quy-dao.html): bản chạy được, là chuẩn về chuyển động và bố cục (cần cả thư mục `assets/`).
- [xem-truoc-chuyen-dong.webp](https://github.com/lqt140304-rgb/web-b-nh-vi-n/blob/shared/qa-review/docs/de-xuat-hero-quy-dao/xem-truoc-chuyen-dong.webp): ảnh động 16 giây.
- [README.md](https://github.com/lqt140304-rgb/web-b-nh-vi-n/blob/shared/qa-review/docs/de-xuat-hero-quy-dao/README.md): giải thích, điểm khác ảnh tham khảo, những gì đã và chưa kiểm.

## Chủ dự án đã chốt

1. Hero này là Hero chính. Antigravity đưa vào `demo/` của `antigravity/design`, thay Hero cũ.
2. **Chuyển động liên tục là ngoại lệ riêng của Hero**, dù ngày 15/10 đã yêu cầu bỏ hiệu ứng lặp ([yeu-cau-sua-hieu-ung-lap-antigravity.md](yeu-cau-sua-hieu-ung-lap-antigravity.md)). Điều kiện: có nút "Tạm dừng chuyển động" và tôn trọng `prefers-reduced-motion`.
3. Khung ảnh chỉ bay vòng ở vùng ngoài. **Không còn đợt khung bay vào giữa hay qua chữ** (chủ dự án đã bỏ ý này).
4. Khung ảnh to hơn bản đầu khoảng 10%.
5. Nội dung giữ như bản duyệt:
   - Tiêu đề "Không gian lớn / cho những người bạn nhỏ", "người bạn nhỏ" màu cam đậm `#C2560C`.
   - Nhãn "CHÀO MỪNG ĐẾN VỚI LÊ SƠN".
   - Câu phụ "Chăm sóc bằng chuyên môn, đồng hành bằng sự thấu hiểu."
   - Hai nút "Gửi yêu cầu đặt lịch →" (`index.html#form-dat-lich`) và "Xem dịch vụ" (`services.html`).
   - Menu chỉ gồm Trang chủ, Dịch vụ, Giới thiệu, Liên hệ, Đăng nhập, Đăng ký.
   - Không có Bảng giá, Tin tức, tìm kiếm, "Đặt lịch hẹn" (chưa chốt).
6. Khung ảnh hiện là khung trống "ẢNH ĐANG CHỜ"; ảnh thật chủ dự án cung cấp sau.

## Chủ dự án chốt thêm (15/10/2026, sau QA của Claude)

7. **Khung được phép đi xuyên qua / đi sau chữ**, như bản duyệt. Không cần đổi quỹ đạo để tránh vùng chữ. Điều kiện giữ nguyên: chữ và nút luôn nằm trên khung và đọc được. (Đây vẫn không phải đợt khung chui vào giữa đã bỏ ở mục 3.)
8. **Giữ nút "Đăng nhập" ở header ở mọi cỡ màn hình**, kể cả ≤ 420 px và trong khung xem thử Mobile 390. Không ẩn nữa. Thay đổi này **khác bản duyệt** (bản duyệt ẩn nút ở ≤ 420 px).

## Chưa chốt (không tự quyết, hỏi chủ dự án)

- Ảnh thật: khi có ảnh, cần 9 ảnh tỉ lệ gần vuông (khoảng 1:1,06), thấy rõ con vật hoặc không gian bệnh viện. Chưa có ảnh; chưa làm.
- Nhãn góc "Bản xem thử · ảnh sẽ thay sau": chỉ là nhãn tạm, bỏ khi có ảnh thật hoặc khi chủ dự án bảo bỏ.
- Liên kết "Đăng nhập", "Đăng ký" (`#dang-nhap`, `#dang-ky`) đang là chỗ giữ tạm vì chưa có trang. Đích `#form-dat-lich` chưa có form: HOÃN ĐÃ CHỐT.

## Lưu ý khi đưa vào `demo/`

- **Chép nguyên mã của bản duyệt, không viết lại.** Phần chuyển động là bộ mô phỏng quỹ đạo dài gần 1.000 dòng JavaScript, viết lại từ ảnh hoặc từ mô tả gần như chắc chắn ra khác (nhịp bay ra, khoảng cách khung, độ sâu, tránh chồng khung). Cách làm: copy `<style>` và `<script>` của `hero-quy-dao.html` vào `demo/` (tách thành file CSS/JS riêng thì được), giữ nguyên số liệu, tên lớp CSS và logic; chỉ chỉnh những chỗ bắt buộc để khớp header/footer dùng chung. Không đổi nhịp chuyển động, kích thước khung, màu, chữ. Nếu phải đổi bất kỳ thông số nào, ghi rõ đổi gì và vì sao.
- Header, menu ☰ và chân trang phải dùng chung với trang Dịch vụ; không để hai trang có menu khác nhau.
- `hero-quy-dao.html` còn mã không dùng của các bản chuyển động trước (đợt khung chui vào giữa: `SNAKE`, `conv`, `startSnake`, `relax`, `pickExcursionFrame`, `chooseDelta`). Được phép xóa nếu hành vi không đổi.
- Phông chữ: bản duyệt tải Google Fonts (Lora, Be Vietnam Pro) như Hero hiện tại. Nếu Codex quyết định tự host phông thì làm ở bước sau, không thuộc yêu cầu này.
- Khi sửa CSS dùng chung, Claude sẽ kiểm cả Hero và Services.

## Đạt khi (Claude kiểm, lượt đầu dùng Opus)

1. Mở trang: chữ hiện trước, chưa có khung nào; sau đó các khung bay ra từ sau chữ (khoảng giây 1–3), rồi bay vòng liên tục ở vùng ngoài.
2. Không có đợt khung chui vào giữa (không khung nào có lớp `is-crossing`) trong ít nhất 60 giây. Khung được phép đi sau mép chữ (mục 7) nhưng không được che nét chữ: chữ luôn đọc được.
3. Chữ và nút luôn nằm trên khung; khung không bắt chuột hay chạm. Bấm được hai nút bằng chuột; nút "Gửi yêu cầu đặt lịch" trỏ đúng `index.html#form-dat-lich`, nút "Xem dịch vụ" mở `services.html`.
4. Không tràn ngang ở 1440, 1280, 1024, 768, 390, 360. Từ 992 px trở xuống có menu ☰ mở và đóng được (Esc đóng, tiêu điểm bàn phím đúng).
5. Hai khung không chồng nhau quá khoảng 25% diện tích trong lúc bay vòng bình thường (ngoại trừ lúc bay ra ở giây 2–3).
6. Nút "Tạm dừng chuyển động" có `aria-pressed`, đổi nhãn "Tạm dừng chuyển động" / "Tiếp tục chuyển động", dùng được bằng Enter và Space; chuyển động tự dừng khi chuyển tab.
7. `prefers-reduced-motion: reduce`: chữ hiện ngay, khung đứng yên ở vị trí sắp sẵn, ẩn nút tạm dừng.
8. Nút "Đăng nhập" và "Đăng ký" đều hiện ở header ở 1440, 1024, 768, 390, 360 và 320 px, cả trong khung xem thử Mobile 390; không tràn ngang, không đè logo, nút menu ☰ hoặc nhau; vùng chạm mỗi nút cao tối thiểu 44 px; bấm được.
9. Chữ "người bạn nhỏ" tương phản ≥ 3:1 trên nền; các chữ còn lại ≥ 4,5:1. Có viền focus bàn phím rõ trên mọi liên kết và nút.
10. Không có Bảng giá, Tin tức, tìm kiếm, "Đặt lịch hẹn" và không có nội dung chưa chốt.
11. Không lỗi console; trang Dịch vụ không bị ảnh hưởng (hồi quy Services PASS).
12. Hiệu năng trên điện thoại Android cấu hình thấp: **chưa kiểm được trong môi trường của Claude**; chủ dự án hoặc Codex thử trên máy thật trước khi xuất bản.

## Cách tự kiểm (đủ, không cần báo cáo dài)

So ảnh chụp của mình với `01-desktop-1440.png` và `03-mobile-390-3-thoi-diem.png` trong thư mục bản duyệt (cùng cỡ màn hình, khoảng giây thứ 5). Báo branch và SHA đầy đủ, "đã làm / chưa làm" cho 6 mục "Chủ dự án đã chốt", và ảnh chụp 1440 và 390. Claude kiểm theo mục "Đạt khi".

## Đợt sửa 1 cho Codex (sau QA `3a96713`)

Báo cáo QA: [ra-soat-hero-chinh-codex-46d89c0-claude.md](https://github.com/lqt140304-rgb/web-b-nh-vi-n/blob/shared/qa-review/docs/ra-soat-hero-chinh-codex-46d89c0-claude.md). Làm trên nhánh `codex/hero-chinh-quy-dao` (giữ base, không merge, không đổi hành vi bộ mô phỏng).

| # | Việc | Đạt khi |
|---|---|---|
| 1 | **Giữ nút "Đăng nhập" ở header ở mọi cỡ màn hình** (mục 8 ở trên): bỏ quy tắc ẩn ở ≤ 420 px và trong khung Mobile 390 (`.viewport-outer.mode-mobile .site-header .btn-auth-login`, `@media (max-width: 420px)`). Header phải vừa ở 320, 360, 390: nếu chật thì thu gọn khoảng cách/đệm/cỡ chữ nút, không bỏ nút nào, không để nút nhỏ hơn 44 px chiều cao. Hai trang Trang chủ và Dịch vụ dùng cùng header. Cập nhật `tests/hero-orbit.cjs` và `tests/hero-shell.cjs` (đang khẳng định Đăng nhập ẩn). | Cả hai nút hiện, không đè nhau hay đè logo và ☰, không tràn ngang ở 320, 360, 390, 768, 1440 và trong khung Mobile 390 (cả khách lẫn đã đăng nhập); focus bàn phím rõ; ảnh chụp 360 và 390 trong báo cáo của Codex. |
| 2 | **Sửa bảng "Tiêu chí" trong `demo/index.html`** (FIX 1 của QA): mục "Bố cục Hero khung ảnh bay vòng" và mục "Mobile Ergonomics" đang mô tả Hero cũ (3 khung vòm, ảnh gốc, ba ảnh một hàng). Viết lại cho đúng Hero mới, hoặc bỏ hai mục. Không thêm cam kết chưa kiểm. | Đọc bảng không còn chữ "khung vòm", "ảnh gốc", "ba ảnh". |
| 3 | `<meta name="description">` còn ghi "Phương án D": đổi cho đúng Hero mới. | Không còn "Phương án D" trong `demo/index.html`. |

Tùy chọn, không bắt buộc: dọn CSS Hero cũ trong `demo/styles.css` nếu chắc chắn Dịch vụ không dùng.

Khi xong, báo branch và SHA đầy đủ, "đã làm / chưa làm" cho 3 việc, ảnh chụp header ở 360 và 390. Claude kiểm lại đúng các mục này và mục 8 ở "Đạt khi".
