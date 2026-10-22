# Phần 6 — Làm lại trang giới thiệu (thiết kế)

Ngày: 22/10/2026 · Nhánh: `claude/giao-dien` · Trạng thái: **chờ chủ dự án duyệt bản viết**.

Nguồn quyết định: R43 (hướng thiết kế), `docs/tham-khao/prompt-thiet-ke-web-gioi-thieu-2026-10-21.md`, tệp tư vấn `Loi_khuyen_thiet_ke_web_Le_Son.md` (22/10), bản phác `docs/tham-khao/storyboard/storyboard.png`, và các câu trả lời của chủ dự án ngày 22/10 (mục 2).

## 1. Mục tiêu

Một trang giới thiệu cuộn từ hero xuống, **kể một câu chuyện liền mạch**: bệnh viện là ai, làm gì, ai chăm bé, bé đã được chăm thế nào, bước tiếp theo là gì. Phong cách Stripe 70% + Linear 30%; chuyển động tinh tế; không bịa tư liệu.

Hero hiện tại giữ nguyên (logo, route, chức năng). Không sửa khu khách và khu nhân viên.

## 2. Quyết định đã chốt (chủ dự án, 22/10/2026)

1. Kiểu **scrollytelling**, không khóa cuộn.
2. **Một màu nền cho cả trang** (không có đoạn nền tím đậm). Chỉ **một quầng tím rất nhạt sau ảnh chính ở đoạn "An tâm gửi gắm"** và **sợi chỉ tím mảnh** nối các đoạn; không có quầng màu ở nơi khác.
3. Thứ tự: Hero → Giới thiệu → Dịch vụ → Đội ngũ → Câu chuyện điều trị → Không gian → Sản phẩm nổi bật → Quy trình → Hỏi đáp → Đặt lịch và liên hệ.
4. **Sản phẩm nổi bật** (không phải "bán chạy"): không hiện giá, không nhãn bán chạy; nút **Hỏi mua** mở ô để lại lời nhắn có sẵn "Hỏi mua: <tên>".
5. **Câu chuyện điều trị**: ba bài (một lớn, hai nhỏ); **Đọc câu chuyện** mở bài đầy đủ ngay trên trang; chưa có trang danh sách, chưa có ngày đăng và mốc cập nhật (đợt sau).
6. **Khung chat ngoài giờ** là ô để lại lời nhắn (tên, số điện thoại, nội dung) gửi thành yêu cầu liên hệ cho nhân viên; không chat trực tiếp.
7. **Màn "Nội dung trang giới thiệu" cho Quản lý** (đăng sản phẩm và câu chuyện) làm **sau trang công khai và trước khi gửi HTML** (lựa chọn A). Gửi HTML một lần, một tệp, khi xong cả hai.

## 3. Phạm vi và chia đợt

| Đợt | Nội dung | Phụ thuộc |
|---|---|---|
| **6A** | Trang công khai: nền chung, sợi chỉ, 9 đoạn, các thành phần dùng chung | Chỉ dữ liệu có sẵn (`public.featured.*`, `public.bookings.holidays`) |
| **6B** | Đặt lịch ngoài giờ và ngày lễ: nút Gửi đổi thành nút gọi, ô để lại lời nhắn, ghi chú ngày lễ ở `/dat-lich` và `/khach-hang/dat-lich`; ô lời nhắn dùng cho "Hỏi mua" và cho cuối trang chủ | **Cần nhánh dữ liệu thêm API** (mục 7) |
| **6C** | Màn "Nội dung trang giới thiệu" trong khu nhân viên (`content.publish`) | Dữ liệu đã có (`staff.content.*`) |
| **6D** | Hộp thoại tải video nội trú: chữ theo 100 MB, phát 15 giây đầu, tự tắt tiếng | Dữ liệu đã có |

Mỗi đợt có kế hoạch và kiểm tra riêng; 6A làm trước. **Không** làm trong phần 6: trang chi tiết câu chuyện/sản phẩm, "Xem tất cả", giỏ hàng, giá, nhãn bán chạy, phụ phí lễ, thanh gọi cố định trên đầu trang (đã đề xuất, chủ dự án chưa trả lời, giữ ngoài phạm vi).

## 4. Ngôn ngữ thị giác (chỉ áp dụng cho phần mới của trang công khai)

- Token riêng cho trang công khai mới (tiền tố `--pub-*` trong `src/styles/tokens.css`, dùng trong một lớp bọc `[data-pub]` chỉ gắn vào các đoạn mới) để **không đổi** hero, khu khách, khu nhân viên.
  - Nền `#F2EFF3` · tím mận `#53165C` · chữ `#291D34` · chữ phụ `#675E6D` (kiểm tra ≥ 4,5:1 trên nền) · đường kẻ `#D9D1DD` · bề mặt phụ `#FAF8FB` · cam `#C95B0A` rất ít.
- Chữ: Lora cho tiêu đề giàu cảm xúc (32–40 px máy tính, 26–30 px điện thoại, có chữ nghiêng cam cho từ nhấn); Be Vietnam Pro cho phần còn lại (nội dung 16–18 px, tối thiểu 16 px trên điện thoại); nhãn IN HOA đậm giãn chữ ≤ 0,08em; số luôn Be Vietnam Pro (`.num`).
- Hình dạng: **nút 4–6 px, ảnh 0–8 px**; hạn chế nút bầu dục, thẻ lồng thẻ, bóng. Phẳng, đường kẻ mảnh, số thứ tự 01–03.
- Icon: Phosphor Duotone như hiện tại, ít, chỉ chức năng. Ảnh thật quan trọng hơn icon.
- Kính mờ: tối đa **một chú thích trên ảnh chính** của đoạn Giới thiệu (và có nền đặc thay thế khi không hỗ trợ blur). Không đặt chữ quan trọng lên kính.
- Khoảng cách: container ≤ 1200 px; lề 16–20 px điện thoại, 24–40 px máy tính; giữa các đoạn 72–96 px máy tính, 40–56 px điện thoại.

## 5. Chuyển động

- Mỗi đoạn tự hiện khi vào màn hình, chạy **một lần**: mờ dần + dịch 8–12 px, 350–500 ms; nhóm nhỏ lệch 40–70 ms; không đợi đoạn trước. Dùng `preset('enterList')` hiện có khi vừa, thêm preset mới trong `src/ui/motion.ts` khi cần (có test).
- **Sợi chỉ**: một đường mảnh dọc trang vẽ dần theo vị trí cuộn (`useScroll` + độ dài đường), mỗi đoạn "bắt" vào sợi chỉ ở nhãn tiêu đề. Trên điện thoại là đường mảnh sát lề trái; nếu quá chật thì ẩn, nội dung không phụ thuộc vào nó. Ở đoạn Quy trình, đường nối 4 bước vẽ theo cuộn.
- Quầng tím nhạt sau ảnh chính trôi rất chậm **chỉ khi cuộn** (không chạy nền liên tục).
- Hover/focus hàng dịch vụ 150–200 ms (nền đổi, mũi tên dịch 3–4 px); ảnh dịch vụ đổi bằng chồng mờ 200–300 ms; FAQ mở/đóng 180–250 ms.
- Không băng chuyền tự chạy, không hiệu ứng bám con trỏ, không đếm số tăng dần, không nút nhấp nháy.
- `prefers-reduced-motion` (và tùy chọn "Luôn giảm"): bỏ dịch chuyển, bỏ lệch nhịp, bỏ sợi chỉ vẽ dần (hiện sẵn đầy đủ), ảnh đổi tức thì; nội dung vẫn đọc được. Nội dung **không bao giờ ẩn mặc định** nếu script lỗi.

## 6. Từng đoạn (6A)

Mọi đoạn là một `<section>` có `aria-labelledby`, một `h2`, nhãn IN HOA ngắn. Neo cuộn hiện có (`/gioi-thieu`, `/dich-vu`, `/lien-he`) giữ nguyên; thêm neo cho đoạn mới nhưng **không thêm route rỗng**. Thanh điều hướng đánh dấu mục hiện tại theo đoạn đang xem (mở rộng `useActiveSection`).

1. **Giới thiệu "An tâm gửi gắm"** (`#gioi-thieu`). Máy tính chia 5/7: nhãn VỀ LÊ SƠN, tiêu đề, 2–3 câu (lấy từ chữ đang có), nút "Tìm hiểu Lê Sơn →" (cuộn tới Dịch vụ), ghi "Nội dung mẫu". Bên phải ảnh lớn đứng + ảnh phụ lệch xuống, hai khoảnh khắc khác nhau (dùng ảnh minh họa có sẵn, ghi "Ảnh minh họa"); một chú thích kính mờ ngắn. Điện thoại: một cột, chữ → nút → ảnh; ảnh phụ bỏ nếu kéo dài trang.
2. **Dịch vụ** (`#dich-vu`). Danh sách đánh số 01 Khám & điều trị · 02 Nội trú · 03 Spa & grooming: tên, mô tả một câu, mũi tên, ngăn bằng đường kẻ. Máy tính: danh sách trái, **một khung ảnh dính** phải, đổi ảnh khi chọn/rê/focus (không tự điều hướng khi chỉ focus). Mũi tên là liên kết tới `/dat-lich?dich-vu=<khóa>` (như hiện tại). Điện thoại: một cột, chạm một hàng để mở mô tả và ba mục con; tên và mô tả luôn thấy. Dải **Cấp cứu 24/24** giữ như hiện tại (chỉ nút gọi, không đặt lịch), tách khỏi "giờ khám 08:00–21:00".
3. **Đội ngũ** (`#doi-ngu`). Bác sĩ trưởng Lê Thái Sơn (ảnh thật, chữ đã duyệt). Các vị trí khác là khung "Nội dung mẫu" cho tới khi có ảnh và tên thật; không tạo tên, bằng cấp.
4. **Câu chuyện điều trị** (`#cau-chuyen`). Dữ liệu `public.featured.cases()`. Nhãn CÂU CHUYỆN ĐIỀU TRỊ, tiêu đề "Mỗi hành trình, một sự đồng hành." Máy tính: bài đầu chiếm ~2/3, hai bài sau xếp dọc; điện thoại một cột. Mỗi bài: ảnh, tiêu đề, 2–3 dòng đầu của nội dung, "Đọc câu chuyện". Có 1 hoặc 2 bài thì bố cục co lại; **0 bài thì cả đoạn ẩn** (kể cả khỏi sợi chỉ). Bấm "Đọc câu chuyện" mở **hộp thoại đọc** (đóng bằng Esc/nút, trả focus về nút đã bấm) với tiêu đề, nội dung đầy đủ, tên bé + loài, "Nội dung mẫu" khi `sample`. Không bao giờ hiện tên chủ, thuốc, liều, giờ tiêm. Không dùng ảnh do máy tạo làm bằng chứng cho ca thật.
5. **Không gian & chăm sóc** (`#khong-gian`). Một ảnh chính và hai ảnh phụ so le, chú thích ngắn đúng nội dung ảnh. Chưa có ảnh thật nên dùng ảnh minh họa có sẵn, ghi "Ảnh minh họa", và đoạn này **nằm trong danh sách bạn cần bổ sung**.
6. **Sản phẩm nổi bật** (`#san-pham`). Dữ liệu `public.featured.products()`; tối đa 6, bốn một hàng máy tính, hai cột điện thoại (một cột khi chữ rất lớn). Ảnh cùng tỷ lệ, nền sáng; tên, nhóm (Thức ăn / Cát vệ sinh / Phụ kiện), ghi chú; **không giá**. Ba nút lọc theo nhóm chỉ hiện khi có từ hai nhóm. **Hỏi mua** mở ô lời nhắn (6B) điền sẵn "Hỏi mua: <tên>"; khi 6B chưa có thì nút đổi thành gọi hotline. **0 sản phẩm thì ẩn cả đoạn.** Không giỏ hàng, không carousel.
7. **Quy trình đến khám** (`#quy-trinh`). Bốn bước: Gửi yêu cầu → Lê Sơn liên hệ xác nhận → Đến khám → Hướng dẫn chăm sóc. Đường nối vẽ theo cuộn. Ghi "Nội dung mẫu" cho tới khi bạn xác nhận quy trình thật.
8. **Hỏi đáp** (`#hoi-dap`). Accordion bằng `button` + `aria-expanded` + `aria-controls`, điều khiển bằng bàn phím; ba câu mẫu về đặt lịch, nội trú, cấp cứu; "Nội dung mẫu"; không lời khuyên điều trị.
9. **Đặt lịch & liên hệ** (`#lien-he`, giữ neo). Địa chỉ, hotline, giờ **08:00–21:00** tách khỏi **Cấp cứu 24/24**, Chỉ đường, Facebook (nguyên văn như CLAUDE.md). **Theo giờ** (đồng hồ demo `system.now()`, ngày lễ từ `public.bookings.holidays()`): trong giờ → nút "Đặt lịch khám" (`/dat-lich`); ngoài giờ → "Gọi 097 355 51 05" cùng ô lời nhắn (6B); ngày lễ → một dòng "Hôm nay Lê Sơn làm đến 19:00". Hai nút **"Đặt lịch khám"** và **"Đăng nhập theo dõi bé"** khác tên, khác mục đích; lối vào cổng khách hiện (thay `AccountTeaser`) dễ thấy, tách khỏi nội dung giới thiệu.

Sơ đồ minh họa vị trí hiện có (`MapArt`) giữ, đổi màu theo token mới.

## 7. Dữ liệu và yêu cầu gửi nhánh dữ liệu

6A chỉ dùng hợp đồng hiện có. **Việc gửi nhánh `claude/du-lieu` (ghi vào mục "Yêu cầu gửi nhánh kia" của `PROGRESS.md` khi bắt đầu 6A):**

1. `public.inquiries.submit({ name, phone, text, about? })` → tạo một yêu cầu liên hệ nhân viên thấy trong danh sách Yêu cầu (loại "Lời nhắn", không phải đặt lịch), kiểm tra tên/điện thoại/nội dung, chống gửi trùng, giới hạn độ dài; không cần giờ làm việc. `about` là tên sản phẩm khi "Hỏi mua".
2. (Đợt sau, không chặn 6A) câu chuyện có `publishedAt` và mốc cập nhật kết quả; trang danh sách.

Cho tới khi (1) xong, 6A hiện nút gọi thay cho ô lời nhắn; 6B mới bật ô.

## 8. Trợ năng, hiệu năng, kiểm tra

- Bàn phím đủ cho mọi điều khiển; hộp thoại đọc bẫy và trả focus; accordion và danh sách dịch vụ có tên cho trình đọc màn hình; tương phản chữ ≥ 4,5:1 (kể cả chữ phụ `#675E6D` trên nền `#F2EFF3` — đo thật, nếu thiếu thì sậm lên); điện thoại 320 px không cuộn ngang; zoom 200% không đè chữ; không dùng chiều cao cố định theo màn hình.
- Ảnh có `alt`, `width`/`height`, `loading="lazy"` dưới màn hình đầu; không video nền; không thêm thư viện (dùng `motion` đang có); tệp một-HTML vẫn trong ngân sách dung lượng (`npm run budget` trong `verify`).
- Chữ hiển thị tiếng Việt; "bạn", "Lê Sơn", "bé"; không "quý khách", không "lễ tân"; không gạch ngang dài trong chữ mới; "24/24" chỉ cho Cấp cứu; mọi chỗ tự đặt ghi "Nội dung mẫu" / "Ảnh minh họa".
- Kiểm thử (viết trước): e2e cho từng đoạn ở 1440/390/320 (có đúng thứ tự, đoạn trống ẩn, lọc sản phẩm, mở/đóng câu chuyện và trả focus, accordion bằng phím, nút theo giờ/ngày lễ với đồng hồ demo, giảm chuyển động không còn dịch chuyển), axe trên cả trang, neo và thanh điều hướng đánh dấu đúng, e2e cũ của hero và trang chủ vẫn qua; test đơn vị cho hàm chọn nút theo giờ, sắp bố cục câu chuyện (0/1/2/3 bài), lọc nhóm sản phẩm.

## 9. Rủi ro đã thấy trước (đưa vào Review Focus của kế hoạch)

1. Quầng và sợi chỉ làm tràn ngang hoặc kéo lệch bố cục ở 320 px.
2. Dữ liệu nổi bật rỗng, 1 hoặc 2 mục, tên rất dài, ảnh bị mất (`imageKey` không còn) — đoạn không vỡ, không khung trống.
3. Nội dung mẫu/ảnh minh họa quên gắn nhãn; chữ cấm (quý khách, lễ tân, 24/24 ngoài Cấp cứu).
4. Nút đặt lịch/gọi sai ở sát 21:00, ngày lễ, Chủ nhật; đồng hồ demo khác giờ thật.
5. Hộp thoại đọc: Esc, trả focus, cuộn nền, chữ rất dài.
6. Đổi `useActiveSection` làm thanh điều hướng đánh dấu sai khi vào thẳng `/dich-vu`, `/lien-he`.
7. Token `--pub-*` rò sang khu khách/nhân viên.

## 10. Việc cần chủ dự án bổ sung (để thay "Nội dung mẫu")

Ảnh và tên thật của đội ngũ; ảnh thật khu khám, chăm sóc, nội trú; quy trình đến khám thật; câu trả lời cho các câu hỏi thường gặp; bảng giá và quy cách sản phẩm; bài giới thiệu chính thức; các ca điều trị đã được chủ nuôi đồng ý và bác sĩ duyệt.
