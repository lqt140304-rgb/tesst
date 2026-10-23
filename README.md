# Bệnh viện Thú y Lê Sơn — Bản demo hệ thống web (giới thiệu · khách hàng · nhân viên)

> **README này là tài liệu bàn giao.** Bất kỳ tài khoản hoặc người làm nào (Claude, Codex, lập trình viên) đọc từ đây là
> làm tiếp được, không cần lịch sử chat. Cập nhật lần cuối: **19/10/2026**.

## 1. Mục tiêu (chủ dự án yêu cầu)

Một web thú y đầy đủ gồm **ba phần**:

1. **Web giới thiệu** phát triển từ Hero quỹ đạo đã duyệt ("Không gian lớn cho những người bạn nhỏ"). Có mục **Dịch vụ**
   ngay trên trang chủ, không làm trang riêng, và form **gửi yêu cầu đặt lịch**.
2. **Cổng đăng nhập riêng**, tách khỏi web giới thiệu, có hai thẻ **Khách hàng / Nhân viên**:
   - **Khu khách hàng:** thú cưng, lịch hẹn và yêu cầu đặt lịch, nội trú (nhật ký và **video**), **hóa đơn**, tài khoản.
   - **Khu nhân viên** (quản lý + nhân viên) có ba phân hệ:
     - lịch hẹn và khách hàng;
     - nội trú và video;
     - hóa đơn và thanh toán tại quầy.

     Quản lý xem thêm doanh thu và bảng giá.
3. Giao diện **đẹp, tinh tế, chuyên nghiệp**, nhiều hiệu ứng chuyển cảnh và vật thể chuyển động, **icon chỉn chu**.
   Lời văn nhẹ nhàng để khách thấy thoải mái.

**Mức độ:** bản **demo đầy đủ, bấm được hết**, dùng **dữ liệu mẫu** lưu trong trình duyệt. Chủ dự án duyệt giao diện trước;
bản chạy thật (Next.js + Supabase) làm sau.

## 2. Trạng thái hiện tại

| Bước | Trạng thái |
|---|---|
| Hỏi yêu cầu, chốt quyết định với chủ dự án | ✅ Xong (19/10/2026) |
| 4 bản thiết kế chi tiết + rà soát chéo | ✅ Xong (`docs/thiet-ke/`) |
| Quyết định cuối, gỡ mâu thuẫn | ✅ `docs/thiet-ke/QUYET-DINH.md` (R1–R35) |
| Kế hoạch triển khai đợt 1 | ✅ `docs/ke-hoach/2026-10-19-dot-1-p0.md` |
| Xây đợt 1 (P0): trang công khai, đăng nhập, khu khách hàng, khu nhân viên | ✅ Xong, đủ test (20/10/2026) |
| Gửi chủ dự án xem | ✅ một tệp HTML `Le-Son-demo.html` (`npm run build:single`); không dùng Artifact nữa |
| Rà soát độc lập toàn nhánh | ✅ Xong, đã sửa các lỗi quan trọng (20/10/2026) |
| Sửa theo góp ý + đợt 2 (P1) | ⏳ Chờ góp ý của chủ dự án |
| Làm lại giao diện theo bộ mẫu — phần 1 nền chung (`#/_giao-dien`) | ✅ Xong (20/10/2026), xem `PROGRESS.md` |
| Làm lại giao diện — phần 2 trang công khai, trang đặt lịch `#/dat-lich`, đăng nhập | ✅ Xong (20/10/2026), quyết định R34 |
| Làm lại giao diện — phần 3 khu khách hàng (thanh bên, chuông, đổi lịch, nội trú theo ngày) | ✅ Xong (21/10/2026), quyết định R35 |
| Làm lại giao diện — phần 4A khu nhân viên: lịch hẹn (lưới tuần, khung chi tiết), hóa đơn có xem trước | ✅ Xong trên nhánh giao diện (21/10/2026), quyết định R37 |
| Làm lại giao diện — phần 4B khu nhân viên: khách hàng (bảng chung, hồ sơ hai cột, sửa khách và bé, lịch sử tương tác) | ✅ Xong trên nhánh giao diện (21/10/2026), quyết định R38 |
| Làm lại giao diện — phần 4C khu nhân viên: nội trú (bảng chuồng, trang một bé, nhập viện 3 bước, chuyển chuồng, xuất viện, tải video) | ✅ Xong trên nhánh giao diện (21/10/2026), quyết định R39 |
| Làm lại giao diện — phần 4D khu nhân viên: bảng giá (thêm, sửa, ngừng dùng) và doanh thu (chọn kỳ, chọn ngày) | ✅ Xong trên nhánh giao diện (22/10/2026), quyết định R41 |
| Làm lại giao diện — phần 5A khu nhân viên: Kho (tóm tắt, lọc, nhập/xuất/kiểm kê, ngừng dùng) | ✅ Xong trên nhánh giao diện (22/10/2026), quyết định R42 |
| Làm lại giao diện — phần 5B khu nhân viên: Báo cáo vận hành (bốn số so với kỳ trước, cần chú ý, lịch hẹn, yêu cầu, nội trú, doanh thu tóm tắt) | ✅ Xong trên nhánh giao diện (22/10/2026), quyết định R44 |
| Làm lại giao diện — phần 5C khu nhân viên: Cài đặt (hồ sơ của tôi, thông tin bệnh viện, tài khoản nhân viên và quyền từng người, cài đặt hệ thống và ngày lễ) | ✅ Xong trên nhánh giao diện (22/10/2026), quyết định R45 |
| Làm lại giao diện — phần 5D khu nhân viên: Tùy chọn của tôi (cỡ chữ, bảng, chuyển động, trang vào, lịch, số dòng, kỳ báo cáo, nhắc việc) và áp dụng cài đặt hệ thống (thời lượng, giờ lịch, thanh toán, quá hạn, ngày lễ) | ✅ Xong trên nhánh giao diện (22/10/2026), quyết định R46 |
| Làm lại giao diện — phần 5E khu nhân viên: Trợ giúp (hướng dẫn tìm không dấu, góp ý, hộp thư cho Quản lý), màn bị chặn nói rõ thiếu quyền gì, danh sách việc đầu tiên tự tích | ✅ Xong trên nhánh giao diện (22/10/2026), quyết định R47 |
| Làm lại giao diện — phần 6A trang giới thiệu công khai: chín đoạn (Giới thiệu, Dịch vụ + nút đặt lịch theo giờ, Đội ngũ, Câu chuyện điều trị, Không gian, Sản phẩm nổi bật, Quy trình, Hỏi đáp, Liên hệ), sợi chỉ cuộn, nền chung | ✅ Xong trên nhánh giao diện (22/10/2026), quyết định R48; 6B–6D chưa làm |
| Làm lại giao diện — phần 6B: hộp thoại "Để lại lời nhắn" (Hỏi mua, ngoài giờ), trang đặt lịch có "Giờ khác" và ngày lễ, khối "Lời nhắn của khách" cho nhân viên | ✅ Xong trên nhánh giao diện (23/10/2026), quyết định R49; 6C, 6D chưa làm |

**Chạy thử trên máy:** `npm ci && npm run dev` (Node ≥ 22.22). Kiểm tra toàn bộ: `npm run verify`
(typecheck → lint → unit → build Artifact → ngân sách dung lượng → build → e2e). Bộ ảnh duyệt: `npm run shots`
(ảnh 1440 và 390 px của mọi màn hình + `review/index.html`). Tạo lại bản xem thử một tệp: `npm run build:single` (ra
`dist-single/index.html`, mở thẳng bằng trình duyệt).

**Tài khoản mẫu** (mật khẩu chung `leson-demo`): nhân viên `quanly_ha` (Quản lý), `bacsi_duc` (Bác sĩ + tiếp nhận yêu cầu),
`bacsi_mai` (Bác sĩ), `spa_ngocanh` (Nhân viên Spa); khách hàng `lan_nguyen` (đã liên kết), `minh_khoa` (chưa liên kết,
mã kết nối `LS-7K2Q`). Dữ liệu mẫu lưu riêng trên từng trình duyệt; nút "Bản demo · dữ liệu mẫu" có mục khôi phục.

## 3. Đọc theo thứ tự này

1. **[`docs/thiet-ke/QUYET-DINH.md`](docs/thiet-ke/QUYET-DINH.md)** ⭐: quyết định cuối, **ưu tiên cao nhất**. Gồm câu trả lời
   của chủ dự án, 28 điểm gỡ mâu thuẫn (R1–R28) và phân đợt P0/P1.
2. [`docs/thiet-ke/BRIEF.md`](docs/thiet-ke/BRIEF.md): bối cảnh, yêu cầu gốc, quy định đã chốt từ trước, tài nguyên, môi trường.
3. Bốn bản thiết kế chi tiết (tiếng Anh; chữ hiển thị cho người dùng viết tiếng Việt):
   - [`proposal-customer.md`](docs/thiet-ke/proposal-customer.md): web giới thiệu, đăng nhập/đăng ký, khu khách hàng,
     **giọng văn và toàn bộ câu chữ**.
   - [`proposal-staff.md`](docs/thiet-ke/proposal-staff.md): khu nhân viên, phân quyền theo khả năng, mô hình dữ liệu,
     **dữ liệu mẫu (nguồn duy nhất)**.
   - [`proposal-visual.md`](docs/thiet-ke/proposal-visual.md): màu, chữ, chip trạng thái, **danh mục hiệu ứng**, **bộ icon**,
     hình minh họa, ảnh và video.
   - [`proposal-tech.md`](docs/thiet-ke/proposal-tech.md): công nghệ và phiên bản, định tuyến, lớp dữ liệu mẫu, cách đưa Hero
     vào, video, kiểm thử, build và đăng.
4. [`docs/thiet-ke/critique.md`](docs/thiet-ke/critique.md): báo cáo rà soát C1–C33. Mọi điểm đã được xử lý trong QUYET-DINH.
5. [`docs/tham-khao/`](docs/tham-khao/): các quyết định cũ của dự án, chép từ repo `web-b-nh-vi-n`, nhánh `shared/requirements`.
   Gồm: định hướng sản phẩm, rà soát tài khoản/form đặt lịch (**sáu trạng thái**), thông tin liên hệ, Hero đã chốt, bộ icon
   đã chốt, đặc tả header mobile.

> Trong các bản thiết kế có đường dẫn dạng `/tmp/claude-0/...` (máy làm việc cũ). Đối chiếu như sau:
> `.../scratchpad/design/` → `docs/thiet-ke/`; `.../design/refdocs/` → `docs/tham-khao/`; `/tmp/claude-0/hero/demo/` →
> `reference/hero-demo/`; `.../design/probe/` → `reference/probe/`; `.../design/tools/` → `docs/thiet-ke/tools/`; ảnh
> chụp và bảng mẫu → `docs/thiet-ke/hinh/`.

## 4. Quyết định của chủ dự án (tóm tắt, chi tiết ở QUYET-DINH §1)

- **Repo:** `tesst`, nhánh `claude/focused-pascal-rfxnnp`.
- **Dịch vụ:** một mục trên trang chủ. Menu gồm Trang chủ · Dịch vụ (chỉ cuộn xuống mục đó) · Giới thiệu · Liên hệ ·
  Đăng nhập · Đăng ký.
- **Thanh toán:** nhân viên thu tại quầy (tiền mặt, chuyển khoản, QR ngân hàng tại quầy). Khách chỉ xem hóa đơn và trạng
  thái; **không thanh toán online**.
- **Khu nhân viên** chỉ gồm: Lịch hẹn & khách hàng · Nội trú & video · Hóa đơn & thanh toán (+ Doanh thu, Bảng giá cho quản
  lý). **Không** làm ca trực, giao việc hay nhân sự.
- **Đăng nhập:** một cổng, hai thẻ. Khách **tự đăng ký** (số điện thoại + tên đăng nhập + mật khẩu, **không OTP**). Nhân viên
  **liên kết** tài khoản web với hồ sơ tại bệnh viện bằng **"Mã kết nối hồ sơ"**. Khi chưa liên kết, mục Nội trú và Hóa đơn
  bị khóa.
- **Lịch hẹn:** chỉ có **Đã hẹn / Đã hủy**, không có "Đã đến". **Sáu trạng thái yêu cầu đặt lịch** giữ nguyên: Chờ xác nhận ·
  Đang liên hệ · Đã xác nhận · Không liên lạc được · Đã hủy · Từ chối.
- **Ảnh và video:**
  - 7 ảnh miễn phí bản quyền có sẵn, cắt thành 9 khung Hero, ghi nhãn "Ảnh minh họa".
  - Video nội trú mẫu dựng từ ảnh bằng ffmpeg, **không có tiếng**, tự xóa sau 60 ngày.
  - Môi trường làm việc cũ **không tải được** Unsplash hay Pexels.
- **Xem bản demo:** gửi **một tệp HTML đơn** (`npm run build:single`). Chủ dự án chọn bỏ Artifact (21/10/2026).
- **Khách không bao giờ thấy:** tên thuốc, liều, giờ tiêm, y lệnh, tên nhân viên. Dữ liệu nội bộ và dữ liệu cho khách là
  **hai bảng riêng**.
- **Không khẳng định điều chưa xác nhận:** giờ làm việc dịch vụ thường, giá thật, máy móc, tên bác sĩ, số liệu. Nội dung
  bịa ghi "Nội dung mẫu".
- **Thông tin thật:**
  - 101 Khuất Duy Tiến, Nhân Chính, Thanh Xuân, Hà Nội.
  - Hotline **097 355 51 05** (`tel:+84973555105`), dùng chung cho tư vấn, đặt lịch và cấp cứu; **cấp cứu 24/24**.
  - [Google Maps](https://maps.app.goo.gl/xFbQ4BjKtGVa3rp86) · [Facebook](https://www.facebook.com/benhvienthuyleson).

## 5. Công nghệ đã chọn (chi tiết: `proposal-tech.md` + QUYET-DINH R4, R5)

- **Vite 8 + React 19 + TypeScript 6**, `react-router` 8 dùng **hash routing** để chạy được trên trang tĩnh hoặc Artifact,
  `motion` 13 cho chuyển cảnh.
- Phosphor Duotone (`@phosphor-icons/react@2.1.10` chỉ dùng để sinh tệp: `npm run icons`; chủ dự án chọn 21/10/2026) và khoảng 14 icon thú y vẽ riêng (nét 2px, bo tròn); 4 icon dịch vụ đã duyệt giữ nguyên từng nét.
- Font tự chứa trong web, không cần mạng: `@fontsource/lora` (bản tĩnh, tên "Lora") và `@fontsource/be-vietnam-pro`, có bộ
  chữ tiếng Việt.
- **Lớp dữ liệu mẫu bất đồng bộ:** localStorage có phiên bản, có nút "Khôi phục dữ liệu mẫu", ngày tháng tính tương đối theo
  hôm nay. Sau này Codex thay bằng Supabase mà không phải sửa giao diện.
- **Hero quỹ đạo:** giữ nguyên mã mô phỏng trong `reference/hero-demo/hero-orbit.js`, chỉ bọc vào component có hàm dọn dẹp.
  **Không viết lại** (quy định của chủ dự án).
- **Kiểm thử:**
  - Vitest cho quy tắc, phân quyền và bài kiểm **chống lộ dữ liệu nội bộ**.
  - Playwright 1.56.1 chạy từng trang ở 1440, 390 và 320 px.
  - axe kiểm khả năng truy cập; một bài kiểm bảo đảm ngoài Hero không có gì chuyển động lặp.
- `reference/probe/` là bản thử khả thi của bộ công nghệ trên. Bản này đã build được, có hash router và chuyển cảnh.

## 6. Việc tiếp theo cho người nhận bàn giao

1. Đọc `QUYET-DINH.md` và nhật ký quyết định khi xây (`.superpowers/` không có trong git; các quyết định quan trọng đã ghi
   trong thông điệp commit và QUYET-DINH).
2. Chờ góp ý của chủ dự án trên bản xem thử, sửa theo góp ý.
3. Làm đợt 2 (P1) theo QUYET-DINH R13: hủy hóa đơn / phiếu thu, giảm giá, CSV, sửa bảng giá, tìm kiếm chung + "Tạo nhanh",
   tải video từ máy, nhập viện / xuất viện, đặt lại mật khẩu nhân viên.
4. Khi có máy chủ thật: thay lớp `src/data/mock` bằng bộ chuyển Supabase theo hợp đồng `src/data/contracts/*`.

**Quy ước:**
- Commit nhỏ, rõ ràng; chỉ đẩy lên nhánh `claude/focused-pascal-rfxnnp`.
- Không tạo PR khi chủ dự án chưa yêu cầu.
- Chữ trên giao diện chỉ dùng tiếng Việt.

## 7. Cấu trúc repo hiện tại

```
README.md                  ← tài liệu bàn giao (file này)
src/
  app/                     ← router hash, bố cục vùng, phiên đăng nhập, chuyển trang (morph R31)
  data/
    contracts/             ← kiểu dữ liệu và API dùng chung (thay mock bằng Supabase sau này)
    rules/                 ← quy tắc thuần + unit test (quyền, trạng thái yêu cầu, hóa đơn, liên kết…)
    mock/                  ← "máy chủ" trong trình duyệt: store localStorage, seed, API khách/nhân viên
  features/
    public/                ← trang chủ: hero quỹ đạo, giới thiệu, dịch vụ, đặt lịch, liên hệ
    auth/ booking/         ← cổng đăng nhập/đăng ký, form đặt lịch
    customer/ staff/       ← khu khách hàng, khu nhân viên
    shared/                ← phiếu hóa đơn A5 dùng chung
  ui/ styles/ assets/      ← bộ thành phần, token màu/chữ, ảnh và video mẫu
e2e/                       ← Playwright: theo màn, hành trình (journeys/), smoke + a11y theo manifest.ts
scripts/                   ← media, bản Artifact, ngân sách dung lượng, bộ ảnh duyệt
docs/
  thiet-ke/                ← QUYET-DINH.md (ưu tiên cao nhất), BRIEF, 4 bản thiết kế, rà soát chéo
  ke-hoach/                ← kế hoạch đợt 1
  tham-khao/               ← quyết định cũ của dự án
reference/                 ← hero gốc đã duyệt, bản thử khả thi (chỉ để tham chiếu)
```

## 8. Liên quan

- Repo gốc: [lqt140304-rgb/web-b-nh-vi-n](https://github.com/lqt140304-rgb/web-b-nh-vi-n). Hero quỹ đạo ở nhánh
  `codex/hero-chinh-quy-dao`; yêu cầu ở `shared/requirements`; QA ở `shared/qa-review`.
- Vai trò trong dự án gốc: Claude thiết kế và triển khai giao diện; Codex làm QA chính và sau này lập trình bản thật; chủ dự
  án duyệt cuối.
