# Bàn giao thiết kế lại giao diện cho Antigravity

Ngày: 23/10/2026 · Người giao: Claude (nhánh `claude/giao-dien`) · Người nhận: Antigravity, làm trên **nhánh mới**.

Đọc theo thứ tự: tài liệu này → `CLAUDE.md` → `PROGRESS.md` → `docs/thiet-ke/QUYET-DINH.md` (R1–R51, quyết định cuối, ưu tiên cao nhất).

## 1. Dự án là gì

Bản demo bấm được của hệ thống web Bệnh viện Thú y Lê Sơn: **trang công khai** (hero quỹ đạo, giới thiệu, dịch vụ, đặt lịch), **cổng đăng nhập**, **khu khách hàng** (thú cưng, lịch hẹn, nội trú + nhật ký + video, hóa đơn) và **khu nhân viên** (lịch hẹn, khách hàng, nội trú, hóa đơn, bảng giá, kho, báo cáo, cài đặt, nội dung trang giới thiệu). Dữ liệu mẫu lưu trong trình duyệt; bản chạy thật (Next.js + Supabase) làm sau và thay tầng dữ liệu qua cùng hợp đồng `api`. Chủ dự án viết tiếng Việt, duyệt mọi thứ; mọi chữ hiển thị bằng tiếng Việt.

## 2. Nhánh và cách làm việc

- Điểm xuất phát: nhánh tích hợp `claude/focused-pascal-rfxnnp` **sau khi phần 7 được gộp** (đang chờ chạy kiểm tra toàn bộ lúc khoảng 03:05 giờ Việt Nam ngày 24/10; xong sẽ có dòng "Phần 7 đã gộp" ở đầu `PROGRESS.md`). Chưa gộp thì tạm tách từ `claude/giao-dien` (commit `2ddf838` hoặc mới hơn).
- Nhánh mới đề xuất: `antigravity/giao-dien-v2`, tách bằng `git checkout -b antigravity/giao-dien-v2 origin/claude/focused-pascal-rfxnnp`.
- **Không sửa `src/data`** (hợp đồng dữ liệu `src/data/contracts/`, mock, quy tắc): thuộc nhánh dữ liệu `claude/du-lieu`. Cần đổi thì ghi vào mục "Yêu cầu gửi nhánh kia" trong `PROGRESS.md`.
- Giao diện **chỉ** gọi dữ liệu qua `@/data/public`, `@/data/customer`, `@/data/staff`. Không đọc thẳng store, không `localStorage` ngoài tầng dữ liệu.
- Commit nhỏ, tiêu đề tiếng Anh `feat:` / `fix:` / `docs:`. Không ghi tên mô hình vào commit, mã hay tài liệu.
- Gộp về nhánh tích hợp bằng `git merge --no-ff` **chỉ khi `npm run verify` xanh**. Không rebase, không force-push nhánh dùng chung.
- Việc đáng kể: thiết kế → chủ dự án duyệt → kế hoạch → mã (xem `docs/superpowers/specs/` và `plans/` để học cách các phần 1–7 đã làm).

## 3. Chạy và kiểm tra

- Cài: `npm ci` (Node ≥ 22.22). Chạy: `npm run dev`.
- Nhanh: `npm run typecheck`, `npm run lint`, `npm test` (Vitest).
- E2E: `npm run build && npx playwright test` (chạy trên bản build, cổng 4173; **build lại trước mỗi lần chạy e2e**). Một tệp: `npx playwright test e2e/giao-dien-gioi-thieu-moi.spec.ts --project=desktop-1440`. Bốn môi trường: `desktop-1440`, `phone-390`, `phone-320` (chỉ bài gắn `@narrow`/`@header`), `reduced-motion` (chỉ bài `@motion-reduced`). Bài `@desktop-only` không chạy trên điện thoại.
- Toàn bộ trước khi gộp: `npm run verify` (khoảng 30 phút, chạy nền). **Không chạy 00:00–03:00 giờ Việt Nam** (dữ liệu mẫu "N phút trước" qua nửa đêm làm vài bài khách đỏ giả). Không chạy hai lần Playwright cùng lúc.
- Ảnh duyệt mọi màn: `npm run shots` → `review/index.html`.
- Bản xem trước một tệp: `npm run build:single` → `dist-single/index.html` (đổi tên `Le-Son-demo.html`). **Chủ dự án chỉ nhận một tệp HTML khi bạn xong một đợt và họ bảo gửi**; không đăng Artifact.
- Tài khoản mẫu (mật khẩu `leson-demo`): nhân viên `quanly_ha` (Quản lý), `bacsi_duc`, `bacsi_mai` (Bác sĩ), `spa_ngocanh` (Spa); khách `lan_nguyen` (đã liên kết), `minh_khoa` (chưa liên kết, mã `LS-7K2Q`).
- Bài kiểm tra e2e chỉnh trạng thái qua `window.__lesonDemo` (`setNow`, `loginAs`, `logout`, `failNextWrite`, `api`); đồng hồ và ngày lễ chỉnh qua đó, không dựa giờ thật.

## 4. Quy tắc nội dung (bắt buộc, không đổi khi thiết kế lại)

- Gọi khách là **"bạn"**, bệnh viện **"Lê Sơn"**, thú cưng **"bé" + tên**. Không "quý khách", không "lễ tân".
- Khách **không bao giờ** thấy: tên thuốc, liều, giờ tiêm/giờ thực hiện, y lệnh, ghi chú nội bộ, tình trạng nội bộ, mã chuồng, tên nhân viên. Nhật ký nội trú cho khách chỉ ghi buổi (Sáng/Chiều/Tối).
- Thông tin bệnh viện nguyên văn: "101 Khuất Duy Tiến, Nhân Chính, Thanh Xuân, Hà Nội"; hotline "097 355 51 05" (`tel:+84973555105`); "24/24" **chỉ** cho Cấp cứu (không ở hero). Giờ làm việc **08:00–21:00**, Chủ nhật như ngày thường, ngày lễ đến 19:00 (Quản lý nhập ngày lễ).
- Nội dung tự đặt ghi "Nội dung mẫu"; ảnh có sẵn ghi "Ảnh minh họa"; video "Video minh họa". Không bịa số liệu, máy móc, thành tích, bằng cấp. Được hiện "Bác sĩ trưởng Lê Thái Sơn".
- Thanh toán tại quầy, không trực tuyến. Video nội trú tự tắt tiếng, chỉ phát 15 giây đầu, tệp gốc đến 100 MB, tự xóa sau 60 ngày.
- Yêu cầu đặt lịch: Chờ xác nhận · Đang liên hệ · Đã xác nhận · Không liên lạc được · Đã hủy · Từ chối. Lịch hẹn: Đã hẹn / Đã hủy (+ "Đã qua"); không check-in.
- Nút không có quyền thì **ẩn**, không làm xám; quyền kiểm ở API **và** giao diện (`useSession().can`).
- Không gạch ngang dài (—) trong chữ hiển thị mới.

## 5. Thương hiệu

Nguồn: `src/styles/tokens.css` (không đặt màu cứng trong component, dùng biến).

- Tím mận `--plum-700 #5A1E5E` / `--plum-900 #421247`; tím nhạt `--plum-100 #F1E6F3` / `--plum-50 #F8F2F9`; cam nhấn `--orange-500 #EA7A24` / `--orange-600 #C2560C` (chữ lớn và hình, không dùng cho chữ nhỏ); xanh ngọc `--teal-600` (trạng thái tốt); hồng đậm `--rose-700` (cảnh báo nặng); nền kem `--cream-50`, giấy `--paper`; khu nhân viên `--canvas-staff #F6F2F5`; chữ `--ink-900`, `--ink-600`.
- Trang công khai dưới hero dùng bộ `--pub-*` (chỉ có bên trong `[data-pub]`): bốn nền ấm `--pub-bg-warm`, `--pub-bg-paper`, `--pub-bg-tint`, `--pub-bg-tint-strong`; chữ `--pub-ink`, `--pub-ink-soft`, `--pub-plum`; `--pub-orange` chỉ cho chữ lớn. Bài `src/styles/tokens.test.ts` đo tương phản ≥ 4,5:1 cho mọi cặp chữ/nền: đổi màu thì chạy lại.
- Chữ tiêu đề **Lora** (nghiêng cam cho từ nhấn), chữ giao diện **Be Vietnam Pro**; chỉ dùng tệp woff2 đóng gói (`src/styles/fonts.css`). Số, tiền, ngày giờ, mã, điện thoại luôn Be Vietnam Pro (class `.num`); quy chuẩn ở `docs/tham-khao/quy-chuan-font-chu-va-so-2026-10-21.md`; có sẵn `.t-bold`, `.t-upper`, `.t-title-upper`, `.t-italic` trong `src/styles/base.css`.
- Bo góc `--r-sm 10`, `--r-md 14`, `--r-lg 20`, `--r-xl 28`, pill; bóng `--e-1..3`. Icon: Phosphor Duotone sinh sẵn bằng `npm run icons` vào `src/ui/icons/duotone.generated.ts` (không nạp thư viện lúc chạy) + icon thú y riêng; xem `#/_bo-icon`.
- Logo: `src/assets/img/logo-le-son.png`. Ảnh đã xử lý ở `src/assets/img` và `src/assets/media`; quy trình ở `npm run media`.
- Không thêm thư viện khi chưa hỏi chủ dự án. Dung lượng có ngân sách (`npm run budgets`, `scripts/check-budgets.mjs`): JS khởi tạo đã sát giới hạn, nên tải lười thứ chỉ cần sau một cú bấm.

## 6. Chuyển động và trợ năng

- Chỉ **hero** được lặp. Còn lại chạy **một lần**, 150–450 ms, dịch chuyển 8–12 px, không nảy trên màn nghiệp vụ. Chuyển động gắn vào cuộn ở trang giới thiệu tối đa 12 px (ảnh bắc ngang, thành phần `Drift`).
- Luôn tôn trọng `prefers-reduced-motion` (và tùy chọn "Luôn giảm" trong khu nhân viên). Nội dung **không bao giờ ẩn mặc định** nếu mã chạy lỗi.
- Điều khiển được bằng bàn phím, có nhãn cho trình đọc màn hình, tương phản chữ ≥ 4,5:1, mục chạm ≥ 44 px trên điện thoại, **điện thoại 320 px không cuộn ngang** (bài `fitsDevice` trong `e2e/width.ts`), cả khi người dùng phóng chữ hệ thống 200%.
- Bài axe chạy ở `e2e/a11y.spec.ts` và trong nhiều bài từng màn.

## 7. Cấu trúc mã

```
src/app/            định tuyến (hash router), layout từng khu, phiên đăng nhập, hệ thống demo
src/data/           (KHÔNG sửa) contracts/, mock/, rules/, hooks/
src/features/       public (hero/, home/, header/, footer/, booking/, inquiry/), auth, customer, staff, shared
src/ui/             bộ thành phần dùng chung (kit/), icon, motion.ts, status.ts
src/styles/         tokens.css, base.css, fonts.css
src/assets/         ảnh/video đã xử lý, media.ts
e2e/                Playwright (manifest.ts liệt kê mọi màn; các tệp giao-dien-*.spec.ts)
docs/               thiết kế, kế hoạch, tài liệu tham khảo, ban-giao/
```

Mẫu mã cần theo: React 19 + TypeScript + Vite, react-router (hash), motion (`LazyMotion`, `m`), CSS Modules dùng token, Vitest cạnh tệp, e2e trong `e2e/`. **TDD**: viết bài thất bại trước. Viết mã giống mã xung quanh (tên, mật độ chú thích). Ghi dữ liệu qua hàm API đã có (có `version`, `ConflictError`, `ValidationError`).

## 8. Những gì đã làm ở phần 6–7 (trang công khai), để khỏi làm lại hoặc phá

- **Hero quỹ đạo** (`src/features/public/hero/`): năm ảnh (bốn dưới 993 px), tiêu đề "Khi bé không khỏe, bạn không phải lo *một mình.*" (chữ mẫu), nút Đặt lịch và Gọi/Để lại lời nhắn theo giờ (`HeroCall`). **Bất biến**: ảnh không bao giờ chạm chữ, nút, nút Tạm dừng hay mép hero (mờ dần trước khi chạm; bài `quỹ đạo` lấy mẫu 9 giây ở bảy cỡ cửa sổ). Dưới 993 px ảnh giữ hai dải trên và dưới chữ. `hero-orbit.js` là mô phỏng thuần JS, không còn "port đúng từng dòng" (R51).
- **Trang giới thiệu** (`src/features/public/home/`): chín đoạn theo mạch "từ lo lắng đến yên tâm" (Giới thiệu, Đội ngũ, Câu chuyện điều trị, Không gian, Dịch vụ, Sản phẩm nổi bật, Quy trình, Hỏi đáp, Liên hệ), mỗi đoạn một dòng hỏi và số chương (bộ đếm CSS), nền ấm theo từng đoạn, ba ảnh bắc ngang ranh giới (`PubSection` có chỗ `before`). Không có sợi chỉ hay đường vẽ theo cuộn (đã bỏ có chủ ý, R51).
- **Lời nhắn** ngoài giờ (`src/features/public/inquiry/`), đặt lịch ngoài giờ và ngày lễ (phần 6B, R49); **màn nhân viên "Nội dung trang giới thiệu"** (phần 6C, R50): sản phẩm và câu chuyện hiện ở trang công khai do Quản lý/Bác sĩ nhập.
- Neo cuộn `#gioi-thieu`, `#dich-vu`, `#lien-he` và đường dẫn `/gioi-thieu`, `/dich-vu`, `/lien-he` phải còn chạy; thanh điều hướng đánh dấu mục theo đoạn đang xem (`PublicHeader.tsx`, `NAV_OF`).
- Điều đã học: id trong CSS Modules bị đổi tên, dùng `:global(#id)`; `getComputedStyle` không giải bộ đếm CSS; lệnh `... | tail` trong script kiểm tra che mất bài đỏ; `pkill -f` có thể giết chính lệnh đang chạy.

## 9. Việc còn để lại (không bắt buộc, chủ dự án quyết)

- Lỗi nhỏ phần 7: ảnh dự phòng của câu chuyện hiện trong lúc ảnh tải lên đang tải; nút "Tìm hiểu Lê Sơn" vẫn cuộn tới Dịch vụ, bỏ qua các đoạn mới; tiêu đề hero điện thoại 32–34 px (thiết kế muốn 36–40); Quy trình và Hỏi đáp chưa có ảnh thú cưng; vài chú thích mã chưa cập nhật.
- Lỗi nhỏ phần 6C: lỗi của vài ô không có chỗ hiện; nút Ẩn/Hiện làm mất vị trí bàn phím khi đang lưu; thông báo "ảnh chưa tải được" chưa đọc thành tiếng; tên "Chủ nuôi đồng ý: <tên nhân viên>" dễ hiểu nhầm.
- Cần chủ dự án cung cấp: ảnh thật (đội ngũ, khu khám, chăm sóc, nội trú, thú cưng được chủ nuôi đồng ý), bài giới thiệu chính thức, quy trình đến khám thật, câu trả lời hỏi đáp, bảng giá và quy cách sản phẩm, chữ chính thức cho tiêu đề hero và các dòng hỏi. Đến lúc đó thay mọi chỗ ghi "Nội dung mẫu" và "Ảnh minh họa".

## 10. Trước khi trả lại

1. `npm run typecheck && npm run lint && npm test` sạch.
2. `npm run build && npx playwright test` (bốn môi trường) sạch, hoặc `npm run verify` xanh.
3. Cập nhật `PROGRESS.md` (mục của bạn): vừa làm gì, xong gì, việc tiếp theo, vướng gì; thêm quyết định mới vào `docs/thiet-ke/QUYET-DINH.md` (số tiếp theo R52, kiểm tra số trước khi ghi).
4. Báo chủ dự án bằng tiếng Việt dễ hiểu, không dùng thuật ngữ khi không cần; gửi tệp HTML chỉ khi họ bảo.
