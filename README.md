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
| Chủ dự án duyệt bản thiết kế tổng hợp | ✅ Đã duyệt trong chat (19/10/2026) |
| Quyết định cuối, gỡ mâu thuẫn giữa các bản thiết kế | ✅ `docs/thiet-ke/QUYET-DINH.md` |
| Kế hoạch triển khai từng bước | ⏳ **Việc tiếp theo** |
| Xây đợt 1 (P0) → gửi chủ dự án xem qua link riêng tư | ⏳ Chưa làm |
| Sửa theo góp ý + đợt 2 (P1) | ⏳ Chưa làm |

**Chưa có mã sản phẩm trong repo này.** `reference/` chỉ là tài liệu tham chiếu.

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
- **Xem bản demo:** đăng **link Artifact riêng tư** trên claude.ai. Chủ dự án đã xác nhận được bệnh viện cho phép. Nếu
  không đăng được thì gửi tệp HTML đơn và ảnh chụp.
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
- `lucide-react@1.59.0` và khoảng 14 icon thú y vẽ riêng. Nét 2px, bo tròn; 4 icon dịch vụ đã duyệt giữ nguyên từng nét.
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

1. Đọc `QUYET-DINH.md`, sau đó xem các phần liên quan trong bốn bản thiết kế.
2. Viết **kế hoạch triển khai** vào `docs/ke-hoach/`, gồm các bước nhỏ và cách kiểm từng bước, theo phân đợt **P0** của
   QUYET-DINH R13.
3. Dựng dự án theo bộ công nghệ ở mục 5:
   - Chép tài nguyên từ `reference/hero-demo/assets/`: logo, ảnh, SVG mèo.
   - Đưa Hero vào giữ nguyên mã.
   - Làm lớp dữ liệu mẫu từ seed trong `proposal-staff.md` §11, áp dụng R3.
4. Xây P0 → tự kiểm (test, ảnh chụp 1440/390/320) → build → đăng link riêng tư → gửi chủ dự án.
5. Sửa theo góp ý → làm P1.

**Quy ước:**
- Commit nhỏ, rõ ràng; chỉ đẩy lên nhánh `claude/focused-pascal-rfxnnp`.
- Không tạo PR khi chủ dự án chưa yêu cầu.
- Chữ trên giao diện chỉ dùng tiếng Việt.

## 7. Cấu trúc repo hiện tại

```
README.md                  ← tài liệu bàn giao (file này)
docs/
  thiet-ke/
    QUYET-DINH.md          ← quyết định cuối (ưu tiên cao nhất)
    BRIEF.md               ← bối cảnh và yêu cầu
    proposal-customer.md   ← web giới thiệu, đăng nhập, khu khách hàng, giọng văn
    proposal-staff.md      ← khu nhân viên, phân quyền, dữ liệu, seed
    proposal-visual.md     ← màu, chữ, hiệu ứng, icon, minh họa
    proposal-tech.md       ← kiến trúc kỹ thuật
    critique.md            ← rà soát chéo C1–C33
    tools/                 ← script Python: tương phản màu, cắt ảnh Hero, chỉnh màu ảnh
    hinh/                  ← ảnh Hero hiện tại, bảng cắt ảnh, mẫu icon đã chốt, ảnh bản thử
  tham-khao/               ← quyết định cũ của dự án (chép từ web-b-nh-vi-n)
reference/
  hero-demo/               ← Hero quỹ đạo đã duyệt (nhánh codex/hero-chinh-quy-dao) + assets
  hero-demo-server.js      ← máy chủ tĩnh nhỏ để xem Hero: `node reference/hero-demo-server.js` (cổng 3030)
  probe/                   ← bản thử khả thi Vite + React + hash router (chưa có node_modules)
```

## 8. Liên quan

- Repo gốc: [lqt140304-rgb/web-b-nh-vi-n](https://github.com/lqt140304-rgb/web-b-nh-vi-n). Hero quỹ đạo ở nhánh
  `codex/hero-chinh-quy-dao`; yêu cầu ở `shared/requirements`; QA ở `shared/qa-review`.
- Vai trò trong dự án gốc: Claude thiết kế và triển khai giao diện; Codex làm QA chính và sau này lập trình bản thật; chủ dự
  án duyệt cuối.
