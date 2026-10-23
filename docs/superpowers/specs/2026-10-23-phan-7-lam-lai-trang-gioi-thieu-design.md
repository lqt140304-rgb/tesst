# Phần 7 — Làm lại câu chuyện trang giới thiệu "Từ lo lắng đến yên tâm" (thiết kế)

Ngày: 23/10/2026 · Nhánh: `claude/giao-dien` · Trạng thái: **chờ chủ dự án duyệt bản viết**.

Làm theo kỹ năng Impeccable (`shape`) trong khuôn quy trình của dự án (thiết kế → duyệt → kế hoạch → mã). Không tạo `PRODUCT.md` của Impeccable: sự thật sản phẩm đã nằm trong `CLAUDE.md`, `QUYET-DINH.md` và các thiết kế trước. Hero giữ nguyên. Không đổi dữ liệu, khu khách, khu nhân viên.

## 1. Vì sao làm lại

Chủ dự án (23/10/2026): trang hiện tại **thiếu cảm xúc thú cưng, chưa tinh tế chỉnh chu, khá đơn điệu**; muốn **ấm áp, tin cậy**; **bỏ sợi chỉ khi cuộn**; được làm lại cả câu chuyện.

Nguyên nhân trong bản 6A (R48) tôi thấy rõ: một màu nền xám tím cho cả trang, nút vuông 4–6 px, ảnh 0–8 px, mọi đoạn cùng nhịp (nhãn, tiêu đề, khối), ảnh minh họa nhỏ, sợi chỉ là nét trang trí duy nhất nối các đoạn. Tất cả cùng nghiêng về "gọn, lạnh, kiểu phần mềm". Phần 7 sửa đúng các điểm đó và **thay chỗ nào 6A đã chốt thì ghi rõ ở mục 6**.

## 2. Người xem và việc họ cần làm

- **Ai:** chủ nuôi đang lo cho một bé không khỏe (hoặc sắp cần khám, spa, gửi nội trú), thường xem bằng điện thoại, có khi buổi tối.
- **Họ phải hiểu:** Lê Sơn là nơi đáng tin, ai chăm bé, bé khác đã được chăm thế nào, đến thì làm gì.
- **Họ phải làm:** Gọi (trong giờ), Đặt lịch khám, hoặc Để lại lời nhắn (ngoài giờ). Hai nút này luôn trong tầm tay ở đầu và cuối trang.
- **Chế độ:** thuyết phục (Persuade). Ấm áp để tin, nhưng không bịa tư liệu.

## 3. Câu chuyện của trang

Một mạch cảm xúc của chủ nuôi, mỗi đoạn trả lời một câu họ đang nghĩ:

| # | Đoạn (neo) | Câu họ đang nghĩ | Thay đổi so với 6A |
|---|---|---|---|
| 1 | An tâm gửi gắm (`#gioi-thieu`) | "Bé không khỏe, mình nên làm gì?" | Mở đầu bằng sự đồng cảm, nút Gọi/Đặt lịch ngay; ba dòng sự thật: giờ 08:00–21:00, Cấp cứu 24/24, địa chỉ |
| 2 | Đội ngũ (`#doi-ngu`) | "Ai sẽ chăm bé?" | **Lên trước Dịch vụ** |
| 3 | Câu chuyện điều trị (`#cau-chuyen`) | "Bé khác đã được chăm thế nào?" | **Lên trước Dịch vụ**, bài đầu là khoảnh khắc lớn nhất của trang |
| 4 | Không gian (`#khong-gian`) | "Bé sẽ nằm ở đâu?" | Lên trước Dịch vụ |
| 5 | Dịch vụ (`#dich-vu`) | "Lê Sơn làm được những gì?" | Sau khi đã tin; giữ liên kết `/dat-lich?dich-vu=` |
| 6 | Sản phẩm nổi bật (`#san-pham`) | "Bé cần thêm gì ở nhà?" | Giữ; vẫn ẩn cả đoạn khi không có mục hiện |
| 7 | Quy trình (`#quy-trinh`) | "Lần đầu đến thì thế nào?" | Bỏ đường nối vẽ theo cuộn, thay bằng số bước tĩnh |
| 8 | Hỏi đáp (`#hoi-dap`) | "Còn điều gì mình ngại hỏi?" | Giữ |
| 9 | Đặt lịch và liên hệ (`#lien-he`) | "Vậy mình đặt lịch/gọi." | Giữ; lời kết ấm hơn |

Thanh điều hướng và neo cuộn `/gioi-thieu`, `/dich-vu`, `/lien-he` giữ nguyên; thứ tự mục đánh dấu theo bảng trên.

## 4. Ngôn ngữ thị giác (ấm hơn, có nhịp, tinh hơn)

- **Bỏ hẳn sợi chỉ**: không đường dọc, không đường nối bước vẽ theo cuộn. Gỡ `ScrollThread`, `useScroll` ở các đoạn; bỏ các đoạn mô tả sợi chỉ trong tài liệu cũ (ghi ở R51).
- **Cách nối các đoạn thay cho sợi chỉ** (ba thứ, không thêm trang trí lạ):
  1. **Nền xen kẽ**: kem ấm (`--cream-50`) → giấy trắng (`--paper`) → tím nhạt (`--plum-50`) theo nhịp của câu chuyện, đoạn Câu chuyện nền tím nhạt đậm hơn một nấc để thành điểm nhấn; không có nền tím đậm.
  2. **Ảnh bắc ngang ranh giới** hai đoạn (một ảnh nhô lên đoạn trên) ở 2–3 chỗ, để mắt đi liền.
  3. **Số chương** nhỏ "01 / 09" cạnh nhãn mỗi đoạn.
- **Ảnh là nhân vật chính:** ảnh lớn hơn, bo `--r-lg` (20) đến `--r-xl` (28) thay cho 0–8 px; mỗi đoạn có ít nhất một ảnh thú cưng, chọn khoảnh khắc (nằm ngủ, được ôm, ánh mắt) thay vì chân dung đứng; dùng ảnh minh họa có sẵn trong `src/assets/img` (ghi "Ảnh minh họa"). Cần ảnh thật khi chủ dự án có.
- **Nút:** bo `--r-md` (14) đến pill cho nút chính; chữ nút là động từ ("Đặt lịch khám", "Gọi 097 355 51 05"); giữ nút Gọi/Đặt lịch cùng bộ, không thêm kiểu mới.
- **Chữ:** Lora cho tiêu đề cảm xúc, lớn hơn (40–52 px máy tính, 30–34 px điện thoại), chữ nghiêng cam cho một từ nhấn mỗi tiêu đề; Be Vietnam Pro cho nội dung (≥ 16 px). Câu mở đoạn viết như người nói với người ("Bé nhà bạn đang cần được chăm sóc?"). Số luôn `.num`.
- **Màu:** tiếp tục token `--pub-*`, nhưng nền chính chuyển từ xám tím `#F2EFF3` sang kem ấm; chữ phụ và đường kẻ giữ tương phản ≥ 4,5:1. Cam chỉ cho chữ lớn hoặc điểm nhấn, không cho chữ nhỏ.
- **Bóng và độ sâu:** thẻ có bóng ấm nhẹ (`--e-1`), không thẻ lồng thẻ; kính mờ chỉ ở chú thích trên ảnh đầu tiên như 6A.
- **Nhịp đoạn khác nhau:** có đoạn chia đôi ảnh/chữ, đoạn ảnh tràn, đoạn danh sách, đoạn ba cột, đoạn câu hỏi; không để hai đoạn liền nhau cùng bố cục.

## 5. Chuyển động

- Mỗi đoạn hiện khi vào màn hình, **một lần**, mờ dần + dịch 8–12 px, 350–500 ms, nhóm nhỏ lệch 40–70 ms (preset `enterList` như 6A).
- **Chỉ một chuyển động nhẹ gắn vào cuộn:** ảnh bắc ngang ranh giới trôi lệch rất ít (tối đa 12 px) so với chữ; không vẽ đường, không khóa cuộn.
- Giữ hover/focus dịch vụ, FAQ mở/đóng, đổi ảnh dịch vụ như 6A.
- `prefers-reduced-motion`: bỏ dịch chuyển và lệch nhịp; nội dung không bao giờ ẩn mặc định.

## 6. Quyết định 6A bị thay (cần chủ dự án duyệt)

| 6A/R48 đã chốt | Phần 7 |
|---|---|
| Một màu nền cho cả trang | Nền xen kẽ ba sắc ấm (không có nền tím đậm) |
| Chỉ một quầng tím nhạt sau ảnh chính | Bỏ quầng; dùng nền xen kẽ và ảnh bắc ngang |
| Sợi chỉ tím mảnh nối các đoạn | **Bỏ hẳn** |
| Nút 4–6 px, ảnh 0–8 px, phẳng | Nút 14 px hoặc pill, ảnh 20–28 px, bóng ấm nhẹ |
| Thứ tự Giới thiệu → Dịch vụ → Đội ngũ → Câu chuyện → Không gian | Giới thiệu → Đội ngũ → Câu chuyện → Không gian → Dịch vụ |

Giữ nguyên: Stripe 70% + Linear 30% ở tinh thần (rõ ràng, nhiều khoảng trống), mọi quy tắc nội dung ("bạn", "Lê Sơn", "bé" + tên, nhãn "Nội dung mẫu"/"Ảnh minh họa", giờ 08:00–21:00, "24/24" chỉ cho Cấp cứu, hotline nguyên văn), sản phẩm không giá, lời nhắn ngoài giờ, màn nhân viên.

## 7. Trợ năng và kỹ thuật

- Mỗi đoạn là `<section>` có `aria-labelledby`, một `h2`; điều khiển được bằng bàn phím; tương phản ≥ 4,5:1 (kiểm tra bằng axe và bài kiểm tra token); 320 px không cuộn ngang.
- Ngân sách dung lượng giữ: ảnh mới dùng `.webp` đã xử lý, tải lười dưới màn hình đầu; JS khởi tạo không tăng (bỏ `ScrollThread` sẽ giảm).
- Không thêm thư viện.

## 8. Kiểm thử (viết trước)

- Không còn phần tử sợi chỉ hay đường nối bước theo cuộn; bài kiểm tra 6A cho sợi chỉ và đường Quy trình được thay bằng bài kiểm tra "không có".
- Thứ tự đoạn đúng bảng mục 3; thanh điều hướng đánh dấu đúng đoạn; neo cũ còn chạy.
- Mỗi đoạn có tiêu đề, ít nhất một ảnh có `alt` hoặc nhãn trang trí đúng; ảnh minh họa có nhãn "Ảnh minh họa".
- Hai nút Gọi/Đặt lịch hiện ở đầu và cuối; ngoài giờ đổi theo đồng hồ demo như 6A/6B.
- Tương phản token mới ≥ 4,5:1; axe sạch; 320/390/1440 không cuộn ngang; giảm chuyển động.
- Các bài 6A/6B/6C khác (câu chuyện mở hộp thoại, sản phẩm, lời nhắn, Hỏi đáp) vẫn qua.

## 9. Rủi ro đưa vào Review Focus của kế hoạch

1. Đổi thứ tự đoạn làm hỏng neo, điều hướng đánh dấu hoặc liên kết `/dich-vu` từ nơi khác.
2. Ảnh bắc ngang ranh giới tràn ngang ở 320 px hoặc đè chữ khi chữ dài.
3. Nền xen kẽ làm chữ phụ rớt dưới 4,5:1 ở một sắc.
4. Đoạn Sản phẩm/Câu chuyện ẩn hết (không có mục hiện): đoạn biến mất mà nền xen kẽ không bị "lệch nhịp" hay hở khoảng trống.
5. Câu chuyện 600 ký tự liền, tên rất dài trong bố cục lớn hơn.
6. Ảnh minh họa không đủ cảm xúc: nếu không có ảnh hợp thì thà dùng khung "Ảnh minh họa" gọn còn hơn ảnh sai ngữ cảnh.

## 10. Không làm trong phần 7

Hero; trang chi tiết câu chuyện; chat trực tiếp; giá sản phẩm; video nền; chuyển động lặp; khu khách và khu nhân viên; đổi dữ liệu. **Việc chủ dự án cần làm:** ảnh thật (đội ngũ, khu khám, nội trú, thú cưng được chủ nuôi đồng ý) để thay "Ảnh minh họa", vì cảm xúc thật nằm ở ảnh thật.

## 11. Điểm cần chủ dự án quyết

1. **Duyệt mục 6**: bỏ nền một màu, bo góc lớn hơn, đổi thứ tự (Đội ngũ, Câu chuyện, Không gian lên trước Dịch vụ).
2. Số quyết định: R51 (R50 là 6C).
3. Làm trong một đợt (7A: nền, chữ, ảnh, thứ tự; 7B: chỉnh bố cục từng đoạn và kiểm thử), gửi một tệp HTML sau khi chủ dự án xem xong bản mới.
