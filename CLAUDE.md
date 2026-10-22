# CLAUDE.md — Bệnh viện Thú y Lê Sơn (bản demo web)

Đọc file này trước, rồi đọc `PROGRESS.md` (ai đang làm gì, việc tiếp theo). README.md là tài liệu bàn giao đầy đủ hơn.

## Dự án

Bản demo bấm được hết của hệ thống web cho Bệnh viện Thú y Lê Sơn: **trang công khai** (hero quỹ đạo, giới thiệu, dịch vụ, đặt lịch), **cổng đăng nhập**, **khu khách hàng** (thú cưng, lịch hẹn, nội trú + nhật ký + video, hóa đơn) và **khu nhân viên** (lịch hẹn, khách hàng, nội trú, hóa đơn & thanh toán tại quầy, bảng giá, doanh thu). Dữ liệu mẫu lưu trong trình duyệt; bản chạy thật (Next.js + Supabase) làm sau và thay tầng dữ liệu mẫu qua cùng hợp đồng `api`.

Chủ dự án viết tiếng Việt và duyệt mọi thứ. Trả lời chủ dự án bằng tiếng Việt, dễ hiểu, không dùng thuật ngữ khi không cần. Có gì chưa rõ thì hỏi lại.

Bản xem trước: **một tệp HTML riêng** `Le-Son-demo.html` (chủ dự án 21/10/2026 bỏ Artifact, đã xóa cả hai link Artifact cũ/mới; không đăng Artifact nữa). Tạo bằng `npm run build:single`, ra `dist-single/index.html` (~11,6 MB, mở thẳng từ ổ đĩa bằng trình duyệt, không cần máy chủ), có "Xem như máy tính / điện thoại". Chủ dự án chốt 22/10/2026: **chỉ gửi bản HTML một lần, khi xong cả phần giao diện trang giới thiệu**, và chỉ có một tệp duy nhất (không gửi sau từng phần).

## Tài liệu quyết định (thứ tự ưu tiên)

1. `docs/thiet-ke/QUYET-DINH.md` — quyết định cuối R1–R42, **ưu tiên cao nhất**.
2. `docs/superpowers/specs/2026-10-20-lam-lai-giao-dien-design.md` — làm lại giao diện theo bộ mẫu mới (§3.2 ghi các chỗ thay đổi QUYET-DINH). Bảng mẫu: `docs/tham-khao/mau-giao-dien/`. Chuyển động: `docs/tham-khao/de-xuat-animation-tung-man-2026-10-20.md`.
3. `docs/superpowers/specs/2026-10-20-noi-tru-day-du-design.md` — nội trú đầy đủ (nhập/chuyển/xuất viện, tải video, tiền theo giờ).
4. `docs/thiet-ke/proposal-*.md` (customer/staff/visual/tech) — chi tiết gốc; `docs/ke-hoach/` — kế hoạch và các quyết định khi xây đợt 1.

## Lệnh

- Cài: `npm ci` (Node ≥ 22.22). Chạy: `npm run dev`.
- Kiểm tra nhanh: `npm run typecheck`, `npm run lint`, `npm test` (Vitest).
- E2E: `npm run build && npx playwright test` (chạy trên bản build ở cổng 4173 — **build lại trước khi chạy e2e**). Một file: `npx playwright test e2e/staff-b.spec.ts --project=desktop-1440`.
- Toàn bộ trước khi gộp nhánh: `npm run verify` (typecheck → lint → unit → build artifact → ngân sách → build → e2e).
- Ảnh duyệt mọi màn: `npm run shots` → `review/index.html`.
- Tạo bản xem trước một tệp: `npm run build:single` → `dist-single/index.html` (đổi tên thành `Le-Son-demo.html` khi gửi chủ dự án). Không đăng Artifact.
- Chromium đã cài sẵn trong máy làm việc đám mây; không chạy `playwright install`.

Tài khoản mẫu (mật khẩu `leson-demo`): nhân viên `quanly_ha` (Quản lý), `bacsi_duc`, `bacsi_mai` (Bác sĩ), `spa_ngocanh` (Spa); khách `lan_nguyen` (đã liên kết), `minh_khoa` (chưa liên kết, mã `LS-7K2Q`).

## Cấu trúc

```
src/
  app/            định tuyến (hash router), layout từng khu, phiên đăng nhập, hệ thống demo
  data/
    contracts/    HỢP ĐỒNG api (kiểu dữ liệu + interface) — giao diện chỉ dùng qua đây
    mock/         bản cài đặt dữ liệu mẫu: store (localStorage, transact), api/, projections/, seed/
    rules/        quy tắc thuần (tính tiền, trạng thái, kiểm tra nhập) — có test
    hooks/        useQuery …
  features/       màn hình theo khu: public, auth, booking, customer, staff, shared
  ui/             bộ thành phần dùng chung (kit/), icon, motion.ts, status.ts
  styles/         tokens.css (màu, chữ, khoảng cách), fonts.css, global
  assets/         ảnh/video đã xử lý (img/, media/), media.ts
  lib/            ngày giờ VN, tiền, cx …
e2e/              Playwright (manifest.ts liệt kê mọi màn; a11y, journeys/, shots)
scripts/          xử lý ảnh/video, ngân sách dung lượng, bản một tệp
docs/             thiết kế, kế hoạch, tài liệu tham khảo
reference/        hero gốc đã duyệt
```

## Quy ước code

- React 19 + TypeScript 6 + Vite 8, react-router 8 (hash), motion 13 (`LazyMotion`, `m`), CSS Modules (`*.module.css`) dùng token trong `src/styles/tokens.css`. Không thêm thư viện khi chưa hỏi.
- Giao diện **chỉ** gọi dữ liệu qua `@/data/public|customer|staff` (hợp đồng trong `src/data/contracts/`). Không đọc thẳng store.
- Ghi dữ liệu luôn qua `db.transact(label, fn)` — tất cả hoặc không gì; kiểm tra phiên bản (`version`) để tab khác không bị ghi đè (`ConflictError`). Lỗi: `ValidationError(fields)`, `NotFoundError`, `ForbiddenError`.
- Quyền theo khả năng (`src/data/rules/capabilities.ts`), kiểm tra ở API (`staffActor(env, cap)`) **và** ẩn nút ở giao diện (`useSession().can`).
- **TDD**: viết test thất bại trước, rồi mới code. Sửa lỗi: test tái hiện trước. Unit test cạnh file (`*.test.ts`); e2e trong `e2e/`.
- Viết code giống code xung quanh: tên, mật độ chú thích, kiểu viết. Chú thích ngắn, nói "vì sao".
- Commit nhỏ, thường xuyên, tiêu đề tiếng Anh kiểu `feat: …` / `fix: …` / `docs: …`. Không ghi tên model vào commit/code/tài liệu.
- Việc mới đáng kể: thiết kế → chủ dự án duyệt → kế hoạch → code (quy trình superpowers: brainstorming → writing-plans → executing-plans).

## Quy tắc nội dung (bắt buộc)

- Mọi chữ hiển thị bằng tiếng Việt. Gọi khách là **"bạn"**, bệnh viện là **"Lê Sơn"**, thú cưng là **"bé" + tên**. Không bao giờ "quý khách"/"Quý Khách", không "lễ tân".
- Khách **không bao giờ** thấy: tên thuốc, liều, giờ tiêm/giờ thực hiện, y lệnh, ghi chú nội bộ, tình trạng nội bộ, mã chuồng, tên nhân viên (R7, R20). Nhật ký nội trú cho khách chỉ ghi buổi (Sáng/Chiều/Tối), không ghi giờ.
- Yêu cầu đặt lịch: Chờ xác nhận · Đang liên hệ · Đã xác nhận · Không liên lạc được · Đã hủy · Từ chối. Lịch hẹn: Đã hẹn / Đã hủy (+ "Đã qua"); không check-in (R8).
- Thanh toán tại quầy; không thanh toán trực tuyến. Video nội trú **tự tắt tiếng** (không có nút loa); dài hơn 15 giây thì **tự cắt từ giây thứ 15 trở đi** (không từ chối), tệp gốc đến 100 MB (chủ dự án chốt 22/10/2026; lớp dữ liệu đã làm, giao diện cập nhật chữ theo); tự xóa sau 60 ngày.
- Thông tin bệnh viện dùng nguyên văn: "101 Khuất Duy Tiến, Nhân Chính, Thanh Xuân, Hà Nội"; hotline "097 355 51 05" (`tel:+84973555105`); "24/24" chỉ dùng cho Cấp cứu. Giờ làm việc **08:00–21:00**, không nghỉ trưa, Chủ nhật như ngày thường (chủ dự án chốt 22/10/2026); ngoài giờ là giờ Cấp cứu; ngày lễ do Quản lý nhập trong Cài đặt hệ thống. Nội dung tự đặt ghi nhãn "Nội dung mẫu" / "Ảnh minh họa" / "Video minh họa" / "giá minh họa". Không bịa số liệu, máy móc, thành tích. Được phép hiện "Bác sĩ trưởng Lê Thái Sơn" (chủ dự án cho phép 20/10/2026).
- Chuyển động: chỉ hero được lặp; còn lại chạy một lần, ngắn (150–450 ms), dịch chuyển 8–12 px, không nảy trên màn nghiệp vụ; luôn tôn trọng `prefers-reduced-motion`.
- Trợ năng: điều khiển được bằng bàn phím, có nhãn cho trình đọc màn hình, tương phản chữ ≥ 4,5:1; điện thoại 320 px không cuộn ngang.

## Thương hiệu: màu và chữ

Nguồn: `src/styles/tokens.css` (không đặt màu cứng trong component — dùng biến).

| Vai trò | Biến | Mã |
|---|---|---|
| Tím mận chính (nút, thanh bên nhân viên, tiêu đề) | `--plum-700` / `--plum-900` | `#5A1E5E` / `#421247` |
| Tím nhạt (nền chọn, chip) | `--plum-100` / `--plum-50` | `#F1E6F3` / `#F8F2F9` |
| Cam nhấn (chữ nghiêng nhấn, điểm nhấn tiết chế) | `--orange-500` / `--orange-600` | `#EA7A24` / `#C2560C` |
| Xanh ngọc (trạng thái tốt: Đã thanh toán, Ổn định) | `--teal-600` / `--teal-100` | `#23706E` / `#E3F3F2` |
| Hồng đậm (cảnh báo nặng) | `--rose-700` / `--rose-100` | `#8E2A4F` / `#FBE7EE` |
| Nền kem / giấy | `--cream-50` / `--paper` | `#FBF7F1` / `#FFFFFF` |
| Nền khu nhân viên | `--canvas-staff` | `#F6F2F5` |
| Chữ | `--ink-900` / `--ink-600` | `#231627` / `#5E4A62` |

- Chữ tiêu đề: **Lora** (serif, có chữ nghiêng màu cam cho từ nhấn, ví dụ "dành cho *bé*"). Chữ giao diện: **Be Vietnam Pro**. Chỉ dùng tệp woff2 đã đóng gói (`src/styles/fonts.css`).
- Quy chuẩn chữ và số (chủ dự án, 21/10/2026): `docs/tham-khao/quy-chuan-font-chu-va-so-2026-10-21.md` — số, tiền, ngày giờ, mã, điện thoại luôn Be Vietnam Pro (class `.num`); tiêu đề khu nhân viên Be Vietnam Pro 600; nhãn IN HOA giãn chữ ≤ 0,08em; có `.t-bold`, `.t-upper`, `.t-upper-bold`, `.t-title-upper`, `.t-italic` trong `src/styles/base.css`. Hero giữ nguyên.
- Bo góc: `--r-sm 10` · `--r-md 14` · `--r-lg 20` · `--r-xl 28` · pill. Bóng: `--e-1..3`. Icon: Phosphor Duotone (chủ dự án chọn 21/10/2026; chỉ nét Duotone, sinh sẵn bằng `npm run icons` vào `src/ui/icons/duotone.generated.ts`, không nạp thư viện lúc chạy) + bộ icon thú y riêng (`src/ui/icons`), xem `#/_bo-icon`.
- Logo: `src/assets/img/logo-le-son.png`.

## Làm song song 2 nhánh

| Nhánh | Thư mục (worktree) | Phụ trách | Sở hữu thư mục |
|---|---|---|---|
| `claude/giao-dien` | `.worktrees/giao-dien` | Làm lại giao diện theo bộ mẫu: phần 1 nền chung → phần 2 công khai/đặt lịch/đăng nhập → phần 3 khu khách → màn hình phần 4–5 | `src/ui`, `src/features`, `src/styles`, `src/assets`, `src/app`, `scripts/photos.py` |
| `claude/du-lieu` | `.worktrees/du-lieu` | Dữ liệu & chức năng mới: nội trú đầy đủ (§3 thiết kế nội trú), ảnh thú cưng (`photo_key`), khung giờ đặt lịch, ghi nhớ đăng nhập, yêu cầu đổi lịch, thêm/sửa khách, sửa bảng giá, doanh thu theo danh mục, dữ liệu mẫu phân hệ mới | `src/data` (contracts, mock, rules, seed) |
| `claude/focused-pascal-rfxnnp` | thư mục gốc `tesst` | **Nhánh tích hợp**: chỉ gộp phần đã xong (verify xanh) từ 2 nhánh trên; đăng bản xem trước từ đây | — |

Quy tắc phối hợp:
- Chỉ sửa thư mục mình sở hữu. Cần sửa chỗ của nhánh kia → ghi vào mục "Yêu cầu gửi nhánh kia" trong `PROGRESS.md`.
- Hợp đồng dữ liệu (`src/data/contracts/`) do nhánh dữ liệu sửa, **chỉ thêm, không đổi tên/xóa** khi chưa báo; mọi thay đổi ghi vào mục "Thay đổi hợp đồng" của `PROGRESS.md`.
- `e2e/`: mỗi nhánh thêm file spec riêng (`giao-dien-*.spec.ts`, `du-lieu-*.spec.ts`); sửa spec cũ thì nhỏ và ghi lại.
- `PROGRESS.md`: mỗi nhánh **chỉ sửa mục của mình** (tránh xung đột khi gộp).
- Gộp: phần nào xong và `npm run verify` xanh → gộp vào `claude/focused-pascal-rfxnnp` (`git merge --no-ff`), push. Không rebase/force-push nhánh dùng chung.

Tạo worktree (một lần, trong thư mục repo):
```
git fetch origin
git worktree add .worktrees/giao-dien claude/giao-dien
git worktree add .worktrees/du-lieu claude/du-lieu
cd .worktrees/<nhánh> && npm ci     # hoặc: ln -s ../../node_modules node_modules
```

## Quy trình mỗi phiên làm việc

1. `git pull` (và `git fetch origin`), rồi đọc `PROGRESS.md` — cả mục của nhánh kia: `git show origin/claude/du-lieu:PROGRESS.md` hoặc `git show origin/claude/giao-dien:PROGRESS.md`.
2. Chuyển sang nhánh của mình (`cd .worktrees/<nhánh>`), gộp phần mới từ nhánh tích hợp: `git merge origin/claude/focused-pascal-rfxnnp`.
3. Làm việc, commit nhỏ và thường xuyên.
4. Cập nhật mục của mình trong `PROGRESS.md` (vừa làm gì, xong gì, việc tiếp theo, vướng gì), rồi `git push`.

Mở đầu phiên mới ở tài khoản khác: "Đọc CLAUDE.md và PROGRESS.md rồi tiếp tục". Cuối phiên: "Cập nhật PROGRESS.md với những gì vừa làm".
