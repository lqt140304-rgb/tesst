# Lê Sơn — Prompt và đặc tả thiết kế web giới thiệu

Ngày: 21/10/2026 · Phạm vi: website công khai dành cho chủ nuôi.

## 1. Hướng thiết kế được chọn

**Dùng mẫu 01 — Thanh lịch làm nền tảng, kết hợp danh sách dịch vụ của mẫu 03 — Cá tính.**

- Floating Minimalism: khoảng trống thoáng, ảnh có vị trí độc lập, ít khung bao quanh.
- Editorial: tiêu đề Lora, ảnh lớn nhỏ có nhịp điệu, nội dung ngắn và có câu chuyện.
- Glassmorphism: kính mờ tiết chế ở thanh điều hướng hoặc chú thích trên ảnh.
- Swiss / Elevated Brutalism: lưới căn chỉnh rõ, danh sách dịch vụ đánh số, đường kẻ mảnh, tiêu đề phụ đậm viết hoa.

Không chia toàn trang thành những đoạn mang phong cách khác nhau. Dùng chung màu, font, lưới, khoảng cách và hình dạng nút để tạo một tổng thể thống nhất.

**Giữ hero hiện tại mà chủ dự án đã thích.** Tập trung thiết kế lại phần giới thiệu phía dưới; chỉnh vùng chuyển tiếp khi cần để các phần ăn khớp. Ảnh concept là tham chiếu về bố cục và không khí, không phải nguồn dữ liệu, logo hay nhân sự chính thức.

## 2. Prompt chính để gửi Claude

Copy toàn bộ khối dưới đây. Các mục tiếp theo trong tài liệu là đặc tả đi kèm.

```text
Bạn phụ trách thiết kế và triển khai phần website giới thiệu công khai của Bệnh viện Thú y Lê Sơn trong repo https://github.com/lqt140304-rgb/tesst.

MỤC TIÊU
Thiết kế lại các phần giới thiệu phía dưới hero theo hướng thanh lịch, hiện đại, có cá tính, gọn và dễ dùng trên điện thoại. Khi kéo từ hero xuống, người dùng phải cảm thấy đây là cùng một website.

HƯỚNG ĐÃ CHỌN
Lấy Floating Minimalism + Editorial làm nền tảng, thêm Glassmorphism rất nhẹ ở một vài điểm phù hợp. Kết hợp danh sách dịch vụ của Swiss / Elevated Brutalism: hàng thẳng, số thứ tự 01–03, tên dịch vụ rõ, đường kẻ mảnh và mũi tên xem chi tiết. Không dùng toàn bộ phong cách brutalism cho cả trang.

BỐI CẢNH BẮT BUỘC
- Giữ hero hiện tại, logo thật, route và các chức năng đang hoạt động.
- Đọc CLAUDE.md và PROGRESS.md trước; kiểm tra branch, thay đổi chưa commit, remote và source hiện tại. Chỉ đồng bộ khi an toàn, không ghi đè công việc tài khoản khác. Làm trên nhánh riêng, không sửa cùng file với người đang làm song song.
- Bản HTML demo là tham chiếu giao diện. Xác định component nguồn tương ứng trước khi sửa; không chỉnh trực tiếp bundle HTML minify để thay cho sửa source.
- Chỉ sửa website công khai và component liên quan trong phạm vi này. Bảo toàn form đặt lịch, đăng nhập, cổng khách hàng, giao diện nhân viên và nghiệp vụ.
- Nếu component dùng chung ảnh hưởng các khu vực khác, khoanh vùng style hoặc tạo biến thể public-site và kiểm tra các nơi sử dụng.

THỊ GIÁC
- Nền chủ đạo tím xám rất nhạt #F2EFF3, tím mận #53165C, chữ #291D34.
- Dùng một màu nền chính xuyên suốt, tạo nhịp bằng khoảng trống, ảnh và đường kẻ.
- Font Lora cho tiêu đề giàu cảm xúc; Be Vietnam Pro cho nội dung, điều hướng, nút, nhãn và số.
- Có chữ thường, chữ đậm, VIẾT HOA và ĐẬM VIẾT HOA. Chỉ dùng viết hoa cho nhãn ngắn và một số tiêu đề phụ.
- Nút bo 4–6px, ảnh hoặc khung cần thiết bo 8px; hạn chế tối đa nút pill, thẻ lồng thẻ và các khung bo lớn.
- Giữ bộ icon Phosphor Duotone nhất quán. Ưu tiên icon chức năng, ít họa tiết trang trí.
- Dùng ảnh thật của bệnh viện khi có. Không tự tạo thông tin bác sĩ, bằng cấp, thành tích, đánh giá hoặc số liệu.

NỘI DUNG VÀ BỐ CỤC
1. Sau hero: giới thiệu ngắn với tiêu đề “An tâm gửi gắm”, đoạn 2–3 câu dựa trên dữ liệu thật, một ảnh lớn và một ảnh phụ nhỏ hơn, nút tìm hiểu thêm.
2. Dịch vụ: danh sách đánh số, tên, mô tả ngắn, mũi tên. Dùng dữ liệu và liên kết đang có. Có thể có một ảnh minh họa chung đổi khi chọn dịch vụ trên desktop; mobile chạm để chọn, nội dung thiết yếu luôn thấy được.
3. Đội ngũ: chân dung, tên và vai trò thật, trình bày gọn, ít khung.
4. Không gian và chăm sóc: ảnh thực tế theo bố cục có nhịp điệu, chú thích ngắn.
5. Quy trình đến khám: 3–4 bước sau khi đối chiếu quy trình thật.
6. Câu hỏi thường gặp: accordion truy cập được bằng bàn phím.
7. Liên hệ và đặt lịch: địa chỉ, điện thoại, giờ hoạt động được kiểm chứng; nút đặt lịch rõ.
Nếu source chưa có nội dung hoặc tư liệu cho một phần, ghi rõ mục cần bổ sung trong bàn giao, không dựng thông tin giả để hoàn thiện trang. Không ép thêm route rỗng hay chức năng ngoài phạm vi.

ANIMATION
- Reveal độc lập theo section, dịch chuyển 8–12px và fade, 350–500ms, chạy một lần.
- Stagger nhóm nhỏ 40–70ms; không chờ các section trước hoàn tất.
- Hover nút và hàng dịch vụ 150–200ms; ảnh đổi bằng crossfade 200–300ms.
- Không ép cuộn, không khóa màn hình, không hiệu ứng bám con trỏ hoặc chuyển động nền liên tục.
- Tôn trọng prefers-reduced-motion và giữ nội dung đọc được khi animation không chạy.
- Glassmorphism chỉ dùng nhẹ; không đặt chữ quan trọng trên nền kính thiếu tương phản.

RESPONSIVE
- Desktop thoáng, bất đối xứng có kiểm soát; mobile về một cột, ưu tiên chữ và hành động rồi đến ảnh.
- Không dùng chiều cao màn hình cố định cho các section giới thiệu.
- Body và input tối thiểu 16px; nút dễ chạm, không tràn ngang.
- Kiểm tra ở 390px, 768px, 1440px và zoom 200%, bàn phím và reduced motion.

QUY TRÌNH VÀ BÀN GIAO
Khảo sát source và các phần đang có trước, đối chiếu đặc tả rồi triển khai trong nhánh riêng. Nếu có khác biệt lớn với hiện trạng, giải thích tác động và cách xử lý; chỉ hỏi khi thiếu quyết định thật sự chặn công việc.
Chạy các kiểm tra phù hợp theo package và hướng dẫn repo, kiểm tra chức năng công khai sau khi thay đổi. Chụp preview desktop/mobile để chủ dự án duyệt.
Cập nhật PROGRESS.md, commit nhỏ rõ nghĩa và push nhánh khi có quyền truy cập. Tạo PR để duyệt, không tự merge main. Báo rõ phần đã làm, kết quả kiểm tra, tư liệu còn thiếu và tác động đến component dùng chung.
```

## 3. Quy chuẩn thị giác chi tiết

### Màu sắc

| Vai trò | Màu đề xuất | Cách dùng |
| --- | --- | --- |
| Nền chính | `#F2EFF3` | Xuyên suốt các phần mới bên dưới hero |
| Thương hiệu | `#53165C` | Nút chính, liên kết, số thứ tự, điểm nhấn |
| Chữ chính | `#291D34` | Tiêu đề và nội dung |
| Chữ phụ | `#675E6D` | Mô tả và chú thích; kiểm tra tương phản thực tế |
| Đường phân cách | `#D9D1DD` | Phân nhóm, không dùng cho chữ cần đọc |
| Bề mặt phụ | `#FAF8FB` | Menu hoặc phần điều khiển cần phân biệt nền |
| Cam tiết chế | `#C95B0A` | Chỉ khi cần điểm nhấn phụ, không rải khắp trang |

Không biến mỗi section thành một mảng màu khác nhau. Nền hero cũ có thể giữ màu hiện tại, dùng khoảng cách và đường chuyển tiếp đơn giản để kết nối.

### Font và chữ

| Thành phần | Font | Desktop | Mobile | Độ đậm |
| --- | --- | --- | --- | --- |
| Tiêu đề section | Lora | 32–40px | 26–30px | 500–600 |
| Tiêu đề dịch vụ | Be Vietnam Pro | 20–24px | 18–20px | 600–700 |
| Nhãn viết hoa | Be Vietnam Pro | 12–14px | 12–13px | 700 |
| Nội dung | Be Vietnam Pro | 16–18px | 16px | 400 |
| Nút | Be Vietnam Pro | 14–16px | 16px | 600–700 |
| Số thứ tự | Be Vietnam Pro | 28–36px | 24–28px | 700 |
| Chú thích | Be Vietnam Pro | 13–14px | 13–14px | 400 |

Ví dụ phân cấp:

- Nhãn: **VỀ LÊ SƠN**.
- Tiêu đề: An tâm gửi gắm.
- Mô tả: Đồng hành cùng bạn trong từng bước chăm sóc thú cưng.
- Hành động: Tìm hiểu Lê Sơn →.

Tiêu đề in hoa có thể dùng ở các phần ngắn như **ĐỘI NGŨ**, **DỊCH VỤ**, **LIÊN HỆ**. Không viết hoa cả đoạn mô tả. Giữ dấu tiếng Việt đầy đủ; dùng font có glyph tương ứng, không ép giả đậm bằng CSS khi có font weight thật. Line-height nội dung khoảng 1.6, tiêu đề 1.2–1.3; nhãn viết hoa tối thiểu 1.4. Không dùng cỡ chữ lớn vượt nhịp hero.

### Lưới, khoảng cách và hình dạng

- Container desktop tối đa khoảng 1200px, căn theo lưới và chiều rộng hero hiện có.
- Lề ngoài: 24–40px desktop, 20–24px tablet, 16–20px mobile.
- Khoảng cách section: 72–96px desktop, 40–56px mobile; tinh chỉnh theo nội dung thật.
- Khoảng cách tiêu đề–mô tả: 12–16px; mô tả–nút: 20–24px.
- Nút cao tối thiểu 44px; mục tương tác chính có vùng chạm khoảng 44 × 44px trở lên.
- Rounding: nút 4–6px; ảnh 0–8px; không bo toàn bộ layout thành một thẻ lớn.
- Bóng chỉ dùng khi thể hiện lớp nổi thật sự; tránh bóng dưới từng đoạn nội dung.
- Ảnh không bị méo; giữ vùng mặt bác sĩ và thú cưng khi crop ở các màn hình.

## 4. Đặc tả từng phần

### 4.1. Giới thiệu sau hero

**Desktop:** chia khoảng 5/7 hoặc 6/6. Bên chữ có nhãn, tiêu đề, mô tả, nút và ảnh phụ nhỏ. Bên ảnh là một ảnh đứng hoặc gần vuông lớn hơn. Hai ảnh khác khoảnh khắc để tăng thông tin, không lặp lại cùng một cảnh.

Chú thích kính mờ có thể nằm trong ảnh lớn, với nội dung ngắn như “Chăm sóc tận tâm”. Không phủ khuôn mặt, không dùng kính cho toàn khối chữ. Nếu ảnh không phù hợp, bỏ chú thích và để bố cục đơn giản.

**Mobile:** nhãn → tiêu đề → mô tả → nút → ảnh chính. Ảnh phụ chỉ giữ khi tăng giá trị, không kéo dài trang vô ích. Dùng bố cục luồng bình thường để không đè chữ khi đổi kích thước.

### 4.2. Dịch vụ — điểm nhấn lấy từ mẫu 03

Mỗi hàng gồm: số thứ tự, tên dịch vụ, mô tả một câu, mũi tên. Các hàng ngăn bằng đường kẻ; không đóng từng dịch vụ vào một card nổi riêng.

Ví dụ cấu trúc nội dung, phải khớp dịch vụ thật trước khi xuất bản:

| Số | Tên | Mô tả mẫu |
| --- | --- | --- |
| 01 | Khám & điều trị | Tư vấn và thăm khám theo tình trạng thú cưng. |
| 02 | Chăm sóc nội trú | Theo dõi và chăm sóc trong thời gian lưu viện. |
| 03 | Spa & vệ sinh | Chăm sóc vệ sinh và diện mạo cho thú cưng. |

**Desktop:** nếu có đủ ảnh, danh sách bên trái và ảnh chung bên phải. Hover, focus hoặc chạm chọn hàng để đổi ảnh; không tự động điều hướng khi chỉ focus. Hành động xem chi tiết là liên kết rõ ràng, không đặt liên kết lồng nhau.

**Mobile:** tên và mũi tên cùng hàng, mô tả bên dưới; có thể bỏ ảnh đổi theo lựa chọn để rút ngắn phần này. Không giấu tên hoặc mô tả thiết yếu sau hover. Giữ URL dịch vụ hiện có; nếu chưa có trang chi tiết, dùng hành vi đang hoạt động hoặc anchor đúng nội dung, không tạo link chết.

### 4.3. Đội ngũ

- Dùng dữ liệu bác sĩ thật hiện có; tên, vai trò và chuyên môn chỉ hiển thị khi đã xác nhận.
- Lê Thái Sơn chỉ gắn vai trò bác sĩ trưởng khi dữ liệu và ảnh đã được chủ dự án duyệt.
- Ảnh cùng tỷ lệ; tên phía dưới; không cần khung và bóng quanh mỗi người.
- Desktop 3–4 cột tùy dữ liệu; mobile 1–2 cột với chữ đọc được, ưu tiên danh sách thường hơn carousel tự chạy.

### 4.4. Không gian và chăm sóc

Dùng 2–3 ảnh thật bố trí một ảnh chính và ảnh phụ. Có thể gồm khu khám, khu chăm sóc và nội trú sau khi có tư liệu phù hợp. Chú thích mô tả đúng ảnh, ngắn và cụ thể. Không công khai dữ liệu thuốc, liều, thời điểm tiêm, y lệnh, thông tin khách hoặc dữ liệu bệnh án trên ảnh chụp màn hình.

### 4.5. Quy trình, FAQ và liên hệ

- Quy trình minh họa để đối chiếu: Gửi yêu cầu → Bệnh viện liên hệ xác nhận → Đến khám → Hướng dẫn chăm sóc. Không hiển thị như quy trình chính thức trước khi đối chiếu thực tế.
- FAQ dùng câu hỏi người nuôi quan tâm, câu trả lời được bệnh viện xác nhận; không tự thêm lời khuyên điều trị.
- Accordion dùng button, trạng thái `aria-expanded`, liên kết panel; hoạt động bằng bàn phím.
- Liên hệ lấy từ cấu hình nguồn hiện có và xác minh trước xuất bản. Dữ liệu đã được cung cấp: 101 Khuất Duy Tiến, Nhân Chính, Thanh Xuân, Hà Nội; 0973 555 105; cấp cứu 24/24. Phân biệt giờ cấp cứu với giờ khám thường, không suy diễn mọi dịch vụ đều 24/24.
- Đặt lịch dẫn vào luồng đặt lịch sẵn có. Không thêm thanh nổi che nội dung hoặc xung đột nút liên hệ hiện có.

## 5. Animation và hiệu ứng kính

| Thành phần | Hiệu ứng | Thời lượng gợi ý | Điều kiện |
| --- | --- | --- | --- |
| Tiêu đề và mô tả | Fade + translateY 8–12px | 350–450ms | Một lần khi vào vùng nhìn |
| Ảnh chính | Fade + translateY 8px | 450–500ms | Không zoom mạnh hoặc parallax |
| Hàng dịch vụ | Fade theo nhóm nhỏ | 300–400ms, lệch 40–70ms | Không đợi từng hàng xong mới chạy hàng sau |
| Hover/focus hàng | Đổi nền/tím mận, mũi tên dịch 3–4px | 150–200ms | Có trạng thái bàn phím tương đương |
| Ảnh dịch vụ | Crossfade | 200–300ms | Tải trước hợp lý, tránh nhấp nháy |
| FAQ | Mở/đóng ngắn, không cắt nội dung | 180–250ms | Đảm bảo trạng thái truy cập được |
| Nút | Đổi màu, phản hồi nhấn nhẹ | 150ms | Không phát sáng hoặc rung liên tục |

- Mỗi section tự kích hoạt khi vào màn hình; không có chuỗi animation khóa toàn trang.
- Chỉ animate `transform` và `opacity` cho reveal khi có thể; tránh lạm dụng `will-change`.
- Không để nội dung mặc định vô hình nếu script lỗi hoặc observer chưa khởi tạo.
- Với `prefers-reduced-motion: reduce`, bỏ dịch chuyển, stagger và chuyển ảnh động; cập nhật trạng thái tức thời hoặc fade rất ngắn.
- Kính mờ chỉ ở 1–2 loại thành phần. Dùng bề mặt sáng bán trong suốt, viền nhẹ, blur khoảng 10–16px; kiểm tra với ảnh thật vì độ đọc phụ thuộc nền.
- Nếu không hỗ trợ blur, dùng nền đặc sáng tương đương. Chữ và nút luôn đủ tương phản; tránh animate blur toàn màn hình.
- Liquid Glass có khúc xạ và hiệu ứng quang học không nằm trong hướng triển khai đã chọn.

## 6. Yêu cầu kỹ thuật và bảo toàn luồng hiện có

1. Khảo sát cấu trúc thật trước khi quyết định tên file. Không coi đường dẫn component tưởng tượng là hiện trạng repo.
2. Tái sử dụng token hiện có khi phù hợp; thêm token public-site rõ phạm vi nếu cần. Tránh sửa CSS toàn cục khiến màn nhân viên đổi theo.
3. Giữ ngữ nghĩa HTML: một H1 cho trang theo cấu trúc hiện có, H2 cho section, link để điều hướng, button cho thao tác.
4. Ảnh có `alt` phù hợp, kích thước hoặc aspect-ratio ổn định; lazy-load ảnh dưới fold. Không thêm video nền nặng để trang có cảm giác sinh động.
5. Tải đúng các font weight được dùng; dùng fallback và `font-display` phù hợp. Hạn chế thêm thư viện animation khi CSS và công cụ sẵn có đủ đáp ứng.
6. Không coi file demo HTML tự chứa là chuẩn dung lượng cho bản host. Tối ưu ảnh/font trong source cho cách triển khai thực tế.
7. Giữ nội dung quan trọng có thể đọc và truy cập khi JavaScript tăng cường hiệu ứng chưa chạy.
8. Không sửa các lỗi nghiệp vụ lịch hẹn/video trong cùng thay đổi thiết kế này; xử lý theo nhánh và kế hoạch riêng đã có.

## 7. Checklist nghiệm thu

- [ ] Hero hiện tại còn nguyên các nội dung và tương tác đã được duyệt.
- [ ] Phần mới cùng nhịp màu, font và chiều rộng với hero.
- [ ] Nền tím xám thống nhất, ít khung, không thẻ lồng thẻ.
- [ ] Dịch vụ dùng danh sách đánh số, dễ quét và dễ bấm.
- [ ] Có đủ chữ thường, đậm, nhãn viết hoa và nhãn đậm viết hoa đúng vai trò.
- [ ] Icon đúng Phosphor Duotone, cùng nét và kích thước.
- [ ] Không có dữ liệu bác sĩ, thành tích, phản hồi hay số liệu tự bịa.
- [ ] Ảnh concept được thay bằng tư liệu thật đã duyệt trước xuất bản chính thức.
- [ ] Kiểm tra 390px, 768px, 1440px; không tràn ngang, không cắt mặt hoặc đè chữ.
- [ ] Zoom 200% vẫn đọc và thao tác được.
- [ ] Menu, FAQ, dịch vụ dùng được bằng bàn phím; focus nhìn rõ.
- [ ] Reduced motion và fallback kính mờ hoạt động.
- [ ] Chức năng đặt lịch, điều hướng, đăng nhập và liên kết liên hệ vẫn đúng.
- [ ] Kiểm tra các màn sử dụng component chung bị ảnh hưởng.
- [ ] Không có lỗi mới trong console hoặc ảnh bị hỏng.
- [ ] Chạy build/lint hoặc các lệnh kiểm tra thực sự tồn tại và phù hợp trong repo; báo rõ phần chưa chạy.
- [ ] Có preview desktop/mobile, danh sách file thay đổi và ghi chú tư liệu còn thiếu.
- [ ] Cập nhật PROGRESS.md, commit/push nhánh khi có quyền, bàn giao PR để duyệt trước merge.

## 8. Mẫu bàn giao cuối phiên

```text
Nhánh / commit:
Các phần đã thiết kế:
Các file đã sửa:
Ảnh preview desktop / mobile:
Kết quả kiểm tra:
Ảnh và nội dung còn cần bổ sung:
Tác động đến component dùng chung:
PR hoặc trạng thái push:
Việc tiếp theo:
```

Tài liệu này là brief cho thay đổi giao diện công khai. Nó không thay thế kế hoạch hoàn thiện nghiệp vụ, phân quyền, backend và chuyển dữ liệu GPet đã lập riêng.
