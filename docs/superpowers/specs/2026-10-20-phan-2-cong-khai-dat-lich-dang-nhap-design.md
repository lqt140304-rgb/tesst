# Phần 2 — Trang công khai, đặt lịch, đăng nhập (thiết kế)

Ngày: 20/10/2026 · Chủ dự án duyệt đoạn A và B trong hội thoại · Thuộc `docs/superpowers/specs/2026-10-20-lam-lai-giao-dien-design.md` §4 mục 2 · Nhánh `claude/giao-dien`.

## 1. Mục tiêu

Đổi trang chủ, trang đặt lịch, đăng nhập/đăng ký sang bố cục và phong cách của bộ mẫu (`docs/tham-khao/mau-giao-dien/01-trang-chu.webp`, `02-dat-lich-dang-nhap.webp`): bớt trang trí, thẻ phẳng, ảnh thật, dùng nền chung đã làm ở phần 1 (`@/ui`). **Thành công khi:** ba trang giống bố cục mẫu trên máy tính và điện thoại; đặt lịch có khung giờ; đăng nhập có "Ghi nhớ đăng nhập"; mọi kiểm thử (cũ đã chỉnh + mới) xanh; điện thoại 320 px không tràn ngang.

**Quyết định của chủ dự án (20/10/2026):**
- Đặt lịch thành **trang riêng** `#/dat-lich` (2 cột theo mẫu); trang chủ chỉ còn nút dẫn tới.
- **Cấp cứu 24/24** là **dải riêng nổi bật** dưới các tab Dịch vụ (không là tab).
- Các hiệu ứng nối cũ trên trang chủ (R30 ảnh bay vào Giới thiệu, R31 quỹ đạo sang Dịch vụ / đường nối sang Đặt lịch / chuyển cảnh sang cổng đăng nhập) **bỏ**, thay bằng hiệu ứng nhẹ theo tài liệu chuyển động. Hero giữ nguyên.
- **Khung giờ theo giờ** (thay quyết định cũ "không ghi giờ mở cửa"): 08:00–10:00 · 10:00–12:00 · 14:00–16:00 · 16:00–18:00 · 18:00–20:00 — **giờ tạm**, chủ dự án sẽ gửi giờ thật.
- **Mục "Đội ngũ" riêng** cho Bác sĩ trưởng Lê Thái Sơn.
- Giữ **Tài khoản khách hàng** và **Liên hệ**, làm gọn theo mẫu.
- **Ghi nhớ đăng nhập 30 ngày**, chỉ cho khách.
- Phần dữ liệu (khung giờ, ghi nhớ đăng nhập, `photoKey`) **do nhánh `claude/du-lieu` làm** (§4); nhánh giao diện làm màn hình và nối dữ liệu khi hợp đồng có trên nhánh tích hợp.

## 2. Ngoài phạm vi

Khu khách và khu nhân viên (phần 3–4), trừ hai chỗ hiển thị khung giờ (§4.1). Hero quỹ đạo (giữ nguyên). Sửa nội dung giới thiệu thật (vẫn "Nội dung mẫu" đến khi chủ dự án gửi).

## 3. Màn hình

### 3.1 Trang chủ `#/`

Thứ tự: Hero → Giới thiệu → Dịch vụ (+ dải Cấp cứu) → Đội ngũ → Dải mời đặt lịch → Tài khoản khách hàng → Liên hệ → Chân trang. Menu giữ: Trang chủ · Giới thiệu · Dịch vụ · Liên hệ (cuộn tới mục) + Đăng nhập / Đăng ký.

1. **Hero quỹ đạo** — giữ nguyên (chỉ hero được lặp). Nút "Gửi yêu cầu đặt lịch" dẫn tới `#/dat-lich`.
2. **Giới thiệu** (`#gioi-thieu`) — hai cột (điện thoại: xếp dọc, ảnh trước):
   - Trái: nhãn nhỏ "VỀ BỆNH VIỆN THÚ Y LÊ SƠN"; tiêu đề "Chăm sóc bằng chuyên môn, đồng hành bằng *sự thấu hiểu*." (cụm nhấn nghiêng cam); đoạn văn mẫu ("Nội dung mẫu"); ba điểm có biểu tượng: **Lắng nghe** — "Hiểu câu chuyện của từng bé" · **Chăm sóc** — "Tận tâm với chuyên môn" · **Đồng hành** — "Cùng bạn trong suốt hành trình"; một dòng thông tin nhỏ: Cấp cứu 24/24 · địa chỉ · 097 355 51 05 · "Chỉ đường".
   - Phải: ảnh lớn bo 20 px — **mèo trắng ngủ trên máy ở phòng khám** (`meo-trang-ngu`), nhãn "Ảnh minh họa".
3. **Dịch vụ** (`#dich-vu`) — tiêu đề "Dịch vụ *dành cho bé*", dòng phụ "Các dịch vụ tại Lê Sơn được thiết kế để đáp ứng nhu cầu chăm sóc toàn diện, từ thăm khám, điều trị đến lưu trú và làm đẹp."
   - **Tab** (gạch chân trượt, phím mũi tên): Khám & điều trị · Nội trú · Spa & grooming.
   - Mỗi tab: ảnh lớn trái (bo 20 px, "Ảnh minh họa") + phải: tên, mô tả (giữ câu hiện có), **3 mục con** có biểu tượng (gắn nhãn "Nội dung mẫu" một lần cho cả phần), nút "Gửi yêu cầu đặt lịch →" tới `#/dat-lich?dich-vu=<kham|noi_tru|spa>`.
     - Khám & điều trị — ảnh `kham` hiện có. Mục con: Khám tổng quát · Chẩn đoán & điều trị · Tư vấn chăm sóc tại nhà.
     - Nội trú — ảnh `cho-poodle-chuong`. Mục con: Theo dõi hằng ngày · Nhật ký & video cho chủ nuôi · Ăn uống, vệ sinh đều đặn.
     - Spa & grooming — ảnh `cho-poodle-xe`. Mục con: Tắm & sấy · Cắt tỉa lông · Vệ sinh tai, móng.
   - **Dải Cấp cứu 24/24** ngay dưới tab: nền hồng nhạt (`--rose-100`), biểu tượng tim, chữ "Cấp cứu 24/24 — Bé gặp tình huống khẩn cấp? Gọi ngay để được hướng dẫn và tiếp nhận.", nút chính "Gọi ngay 097 355 51 05" (`tel:+84973555105`). Không có nút đặt lịch cho cấp cứu.
4. **Đội ngũ** (`#doi-ngu`, không thêm vào menu) — ảnh bác sĩ trưởng (cắt bỏ phần chữ in sẵn, giữ bác sĩ và biển bệnh viện), nhãn "Bác sĩ trưởng", tên "Lê Thái Sơn" (Lora), câu "Đồng hành cùng thú cưng mỗi ngày." Không ghi bằng cấp, kinh nghiệm, thành tích. Ảnh này **không** gắn "Ảnh minh họa" (ảnh thật của bệnh viện).
5. **Dải mời đặt lịch** — "Hẹn gặp tại *Lê Sơn*" + một câu + nút "Gửi yêu cầu đặt lịch" tới `#/dat-lich`. Thay mục đặt lịch cũ trên trang chủ.
6. **Tài khoản khách hàng**, **Liên hệ** (`#lien-he`) — giữ nội dung, đổi sang thẻ phẳng (`--surface-card`, viền mảnh, bo 16, bóng nhẹ); bỏ kiểu "bo lệch + bóng màu" (R32) và kính/nghiêng (R29) trên toàn trang chủ.

### 3.2 Trang đặt lịch `#/dat-lich`

Trong khung trang công khai (header + chân trang), hai cột ≥ 960 px. Điện thoại: tiêu đề và ba bước (dạng gọn) ở trên, form ngay sau, khối hotline cuối trang.
- Trái: tiêu đề "Hẹn gặp tại *Lê Sơn*"; câu "Đặt lịch khám nhanh chóng, để thú cưng được chăm sóc kịp thời và chu đáo."; **3 bước** dọc nối bằng đường mảnh: Gửi yêu cầu — "Điền thông tin đặt lịch cho thú cưng." · Lê Sơn liên hệ — "Lê Sơn sẽ gọi lại để xác nhận lịch hẹn." · Xác nhận lịch hẹn — "Hoàn tất và sẵn sàng gặp bác sĩ."; khối **Hotline hỗ trợ** "097 355 51 05" (gọi được).
- Phải: thẻ "Gửi yêu cầu đặt lịch" + "Vui lòng điền thông tin, Lê Sơn sẽ liên hệ xác nhận lịch hẹn." Ô (lưới 2 cột ≥ 640 px): Họ và tên* · Số điện thoại* · Tên thú cưng* · Loại thú cưng* · Dịch vụ mong muốn* · Ngày mong muốn* · **Khung giờ (tùy chọn)** · Ghi chú (tùy chọn); ô đồng ý (khách vãng lai, bắt buộc như hiện nay); nút "Gửi yêu cầu đặt lịch"; ghi chú "Lịch hẹn được xác nhận sau khi Lê Sơn liên hệ."
- Giữ toàn bộ hành vi form hiện có (`BookingForm`): kiểm tra nhập, chống gửi trùng, lỗi lưu giữ dữ liệu, trang thành công `BookingSuccess`, nhân viên đang đăng nhập thì khóa gửi (R28), khách đã đăng nhập dùng thú cưng trong hồ sơ.
- `?dich-vu=kham|spa|noi_tru` chọn sẵn dịch vụ (giá trị lạ → bỏ qua).
- Các đường cũ trỏ vào mục đặt lịch trên trang chủ (`#/dat-lich` trước là cuộn tới mục) nay mở trang này; trang thành công và nút "Gửi yêu cầu khác" giữ nguyên.

### 3.3 Đăng nhập `#/dang-nhap`, `#/dang-nhap/nhan-vien`, đăng ký `#/dang-ky`, quên mật khẩu

Hai cột ≥ 960 px (điện thoại: chỉ thẻ, ảnh thu nhỏ thành dải trên cùng hoặc ẩn):
- Trái: "← Về trang chủ"; ảnh **chó Pomeranian trắng** (`cho-pom-trang`) trong khung bo 24 px, một vòng quỹ đạo mảnh vẽ tĩnh quanh khung (không lặp), dòng chữ "Luôn đồng hành cùng thú cưng của bạn" chữ **Lora nghiêng màu cam** (không thêm font viết tay — giữ ngân sách font); "Ảnh minh họa".
- Phải: thẻ "Đăng nhập" + "Đăng nhập để quản lý lịch hẹn và thông tin thú cưng dễ dàng hơn."; tab **Khách hàng / Nhân viên** (giữ đường dẫn hiện có); ô "Tên đăng nhập / Số điện thoại", "Mật khẩu" (mắt hiện/ẩn); **"Ghi nhớ đăng nhập"** (chỉ tab Khách hàng) + "Quên mật khẩu?"; nút "Đăng nhập"; "Chưa có tài khoản? Đăng ký ngay →". Chip tài khoản mẫu giữ ở dưới thẻ (bản demo).
- Đăng ký và Quên mật khẩu dùng cùng khung hai cột.
- Bỏ hiệu ứng chuyển cảnh trang chủ → cổng đăng nhập (R31 mục 3); trang hiện bằng chuyển mờ nhẹ như các trang khác.

### 3.4 Chuyển động

Theo `docs/tham-khao/de-xuat-animation-tung-man-2026-10-20.md` và preset phần 1: mỗi mục trang chủ hiện một lần khi vào tầm nhìn (8–12 px, ≤ 450 ms, độc lập với hero); tab Dịch vụ gạch chân 180 ms, nội dung tab `fadeSwap`; bước đặt lịch hiện lệch 60 ms; giảm chuyển động → chỉ mờ ≤ 100 ms. Không gì lặp ngoài hero.

## 4. Dữ liệu — yêu cầu gửi nhánh `claude/du-lieu`

Nhánh dữ liệu làm, ghi vào "Thay đổi hợp đồng" của `PROGRESS.md`; nhánh giao diện nối khi có trên nhánh tích hợp.

1. **Khung giờ**: `TimeSlot = '08-10' | '10-12' | '14-16' | '16-18' | '18-20'` và `TIME_SLOT_LABEL` (`'08:00–10:00'` …) trong `contracts/enums.ts`; `BookingInput.preferred_slot?: TimeSlot`; `RequestSnapshot.preferred_slot?`; lưu khi gửi, đưa vào `dedupeKey`; giá trị không hợp lệ → `ValidationError({ preferred_slot })`. `StaffRequestDetail` có sẵn qua `snapshot`; `CustomerBookingRow` thêm `preferredSlot?`.
2. **Ghi nhớ đăng nhập**: `LoginInput.remember?: boolean` (chỉ khách). `remember` → phiên khách lưu `localStorage` kèm hạn 30 ngày (mọi tab cùng trình duyệt), không → `sessionStorage` như hiện nay. Hết hạn → coi như đăng xuất. Đăng xuất và "Khôi phục dữ liệu mẫu" xóa cả hai. Nhân viên bỏ qua `remember`.
3. **Ảnh thú cưng**: `photo_key` cho `pets`/`account_pets` + `photoKey` trong dữ liệu chiếu (đã yêu cầu từ phần 1). Khóa ảnh có sẵn: `meo-tam-the`, `cho-vang`, `meo-muop`, `cho-pom-trang`, `cho-poodle-chuong`, `cho-poodle-xe`, `meo-trang-gang-tay`, `meo-trang-ngu`.

### 4.1 Hiển thị khung giờ (nhánh giao diện, sau khi hợp đồng có)

- Chi tiết yêu cầu (nhân viên): dòng "Khung giờ mong muốn" trong "Thông tin khách đã gửi".
- Lịch hẹn của khách: dòng phụ "Khung giờ mong muốn: 08:00–10:00".

Nếu phần dữ liệu chưa có khi xong màn hình: ô Khung giờ **chưa hiện** (cờ tính năng tạm) — không hiện ô mà không lưu được.

## 5. Ảnh

- Tệp gốc chủ dự án gửi (20/10/2026) lưu ở `docs/tham-khao/anh/` (thú cưng, tên = khóa ảnh) và `docs/tham-khao/anh/doi-ngu/bac-si-le-thai-son.png`.
- `scripts/photos.py`: thú cưng như phần 1 (avatar 320², card 960, banner 1600 nếu đủ lớn); **ảnh đội ngũ** xử lý riêng → `team-le-thai-son-{card,banner}.webp`, cắt bỏ phần chữ in sẵn bên trái (giữ bác sĩ và biển), không chỉnh màu mạnh (ảnh người thật).
- Ngân sách ảnh (phần 1): ≤ 60 tệp, ≤ 4 MB, ảnh lớn nhất ≤ 250 KB; tải lười, có `width/height`.

## 6. Quyết định cần ghi vào `docs/thiet-ke/QUYET-DINH.md`

- R34 (mới): đặt lịch thành trang riêng 2 cột; khung giờ theo giờ (giờ tạm); Cấp cứu là dải riêng; mục Đội ngũ với Bác sĩ trưởng Lê Thái Sơn (không ghi bằng cấp/thành tích); ghi nhớ đăng nhập 30 ngày cho khách.
- R29, R30, R31, R32: ghi "thay bằng R34 (20/10/2026)" — hiệu ứng nối và kiểu thẻ cũ không còn trên trang chủ.

## 7. Kiểm thử

- **Sửa** e2e cũ gắn với bố cục cũ: `e2e/public.spec.ts` (thứ tự mục, thẻ R32, @narrow), `e2e/transitions.spec.ts` (hiệu ứng nối — bỏ các bài của R30/R31), `e2e/booking.spec.ts` (form nay ở `#/dat-lich` trang riêng), `e2e/manifest.ts` (route `/dat-lich` là trang), các journey dùng form đặt lịch.
- **Mới** (`e2e/giao-dien-cong-khai.spec.ts`):
  - Trang chủ đúng thứ tự mục; tab Dịch vụ đổi bằng chuột và phím mũi tên; nút đặt lịch của tab mở `#/dat-lich` chọn sẵn đúng dịch vụ.
  - Dải Cấp cứu có liên kết `tel:+84973555105`; không có nút đặt lịch cấp cứu.
  - Mục Đội ngũ có "Bác sĩ trưởng" và "Lê Thái Sơn".
  - Trang đặt lịch: gửi yêu cầu thành công (khách vãng lai); khi hợp đồng khung giờ có: chọn "10:00–12:00", tab nhân viên thấy "Khung giờ mong muốn: 10:00–12:00".
  - Đăng nhập: tab Nhân viên không có "Ghi nhớ đăng nhập"; khi hợp đồng có: tick → mở tab mới vẫn đăng nhập; không tick → tab mới chưa đăng nhập.
  - Giảm chuyển động: mục trang chủ không có transform.
  - 320 px: so `scrollWidth` với **chiều rộng thiết bị** (`page.viewportSize().width`), không dùng `innerWidth` (giả lập điện thoại nới khung nhìn).
- a11y (axe) mọi trang qua `e2e/manifest.ts`; ảnh có `alt`, tab đúng vai trò.
- Ngân sách: giữ ngưỡng; JS khởi tạo ≤ 240 KB gz (bỏ hiệu ứng nối cũ dự kiến giảm).
