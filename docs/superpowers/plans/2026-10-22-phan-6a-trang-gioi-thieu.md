# Phần 6A — Trang giới thiệu công khai: kế hoạch thực hiện

> **Cho người thực hiện:** dùng superpowers:executing-plans (làm trong phiên này) hoặc superpowers:subagent-driven-development. Các bước dùng ô `- [ ]`. TDD: viết bài kiểm tra thất bại trước, xem nó thất bại, rồi mới viết mã.

**Mục tiêu:** làm lại các đoạn phía dưới hero thành một trang kể chuyện liền mạch gồm 9 đoạn, nền chung, sợi chỉ tím nối các đoạn, CTA theo giờ.

**Kiến trúc:** thành phần dùng chung `PubSection` + `ScrollThread` + token `--pub-*` (gắn bằng `[data-pub]` để không rò sang hero, khu khách, khu nhân viên); logic thuần (theo giờ, bố cục câu chuyện, lọc sản phẩm) tách vào `homeView.ts` có test đơn vị; từng đoạn là một tệp trong `src/features/public/home/sections/`, thay lần lượt đoạn cũ và sửa e2e cũ ngay trong task đó.

**Công nghệ:** React 19, motion (`m`, `useScroll`, `useReducedMotion` bọc ở `@/ui/motion`), CSS Modules, Vitest, Playwright. Không thêm thư viện.

**Thiết kế:** `docs/superpowers/specs/2026-10-22-phan-6-trang-gioi-thieu-design.md` (đã duyệt 22/10/2026; mục 6A). Bản phác: `docs/tham-khao/storyboard/storyboard.png`.

## Ràng buộc chung

- Chữ hiển thị tiếng Việt; "bạn", "Lê Sơn", "bé"; không "quý khách", không "lễ tân"; không gạch ngang dài trong chữ mới; "24/24" chỉ cho Cấp cứu; giờ khám **08:00–21:00** tách khỏi Cấp cứu 24/24; mọi chỗ tự đặt ghi "Nội dung mẫu" / "Ảnh minh họa".
- Thông tin bệnh viện nguyên văn: "101 Khuất Duy Tiến, Nhân Chính, Thanh Xuân, Hà Nội"; hotline "097 355 51 05" (`tel:+84973555105`).
- Token mới (chỉ trong `[data-pub]`): nền `#F2EFF3`, tím `#53165C`, chữ `#291D34`, chữ phụ `#675E6D`, đường kẻ `#D9D1DD`, bề mặt phụ `#FAF8FB`, cam `#C95B0A`. Nút 4–6 px, ảnh 0–8 px, không nút bầu dục, không thẻ lồng thẻ, bóng tối thiểu. Lora cho tiêu đề (có chữ nghiêng cam), Be Vietnam Pro cho phần còn lại, số dùng `.num`.
- Một màu nền cho cả trang; chỉ một quầng tím rất nhạt sau ảnh chính của đoạn Giới thiệu; kính mờ tối đa một chú thích (có nền đặc thay thế).
- Chuyển động: hiện một lần khi vào màn hình, 8–12 px, 350–500 ms, không khóa cuộn; `prefers-reduced-motion` (và "Luôn giảm") bỏ dịch chuyển, bỏ lệch nhịp, sợi chỉ hiện sẵn đầy đủ; nội dung không bao giờ ẩn mặc định.
- Dữ liệu chỉ qua `@/data/public` (`featured`, `bookings`, `system`); không đọc store; không `localStorage`.
- Hero giữ nguyên. Không sửa `src/data`. Điện thoại 320 px không cuộn ngang; zoom 200% không đè chữ; tương phản chữ ≥ 4,5:1.
- Đường dẫn cũ `/gioi-thieu`, `/dich-vu`, `/lien-he` giữ nguyên; neo mới không thêm route.
- Chạy e2e: `npm run build && npx playwright test <tệp> --project=desktop-1440` (build lại trước khi chạy; không chạy hai lượt Playwright cùng lúc).

## Review Focus

1. Quầng và sợi chỉ gây tràn ngang hoặc lệch bố cục ở 320 px và khi chữ phóng 200% (Task 2, 3, 9).
2. Dữ liệu nổi bật rỗng, 1 hoặc 2 mục, tên rất dài, `imageKey` trỏ tới ảnh đã mất: đoạn không vỡ, không khung trống; rỗng thì ẩn cả đoạn (Task 5, 6).
3. Quên nhãn "Nội dung mẫu"/"Ảnh minh họa"; chữ cấm (quý khách, lễ tân, "24/24" ngoài Cấp cứu, "giá", "bán chạy") (Task 9).
4. Nút đặt lịch/gọi sai ở sát 21:00, 07:59, Chủ nhật, ngày lễ sau 19:00, và khi đồng hồ demo khác giờ thật (Task 1, 4, 8).
5. Hộp thoại đọc câu chuyện: Esc, trả focus về nút đã bấm, cuộn nền, nội dung rất dài (Task 5).
6. Thanh điều hướng đánh dấu sai khi vào thẳng `/dich-vu`, `/lien-he`, hoặc khi cuộn qua đoạn mới (Task 2, 8).
7. Token `--pub-*` rò sang hero, khu khách, khu nhân viên (Task 1, 9).

## Cấu trúc tệp

- Tạo: `src/features/public/home/homeView.ts` (+ `homeView.test.ts`), `src/features/public/home/Pub.module.css`, `src/features/public/home/PubSection.tsx`, `src/features/public/home/ScrollThread.tsx`, `src/features/public/home/useHospitalHours.ts`, `src/features/public/home/useFeaturedImage.ts`.
- Tạo/thay trong `sections/`: `About.tsx` (Giới thiệu), `Services.tsx` (Dịch vụ + CTA + Cấp cứu), `Team.tsx` (Đội ngũ), `Stories.tsx` + `StoryDialog.tsx` (Câu chuyện), `Space.tsx` (Không gian), `Products.tsx` (Sản phẩm), `Process.tsx` (Quy trình), `Faq.tsx` (Hỏi đáp), `Contact.tsx` (Đặt lịch & liên hệ, thay `BookCta.tsx` + `AccountTeaser.tsx`).
- Sửa: `src/features/public/home/HomePage.tsx`, `src/features/public/header/PublicHeader.tsx` (scroll-spy), `src/styles/tokens.css`, `e2e/giao-dien-cong-khai.spec.ts`, `e2e/public.spec.ts`, `e2e/manifest.ts` (nếu cần).
- Tạo e2e: `e2e/giao-dien-gioi-thieu.spec.ts` (mọi kiểm thử mới của 6A).
- Docs: `docs/thiet-ke/QUYET-DINH.md` (R48), `PROGRESS.md`, `README.md`, `docs/tham-khao/bang-kiem-thu-nghiep-vu-2026-10-21.md`.

---

### Task 1: token, logic thuần, yêu cầu gửi nhánh dữ liệu

**Files:** Create `src/features/public/home/homeView.ts`, `homeView.test.ts`; Modify `src/styles/tokens.css`, `PROGRESS.md`.

**Interfaces:**
- Produces (dùng ở Task 3–8):
  - `type HoursState = { open: boolean; holiday: boolean }`
  - `hoursState(now: Date, holidays: readonly string[]): HoursState` (giờ Việt Nam; mở 08:00 đến trước 21:00; ngày lễ chỉ mở đến trước 19:00; `holiday` = hôm nay nằm trong `holidays`).
  - `holidayNote(s: HoursState): string | null` → "Hôm nay Lê Sơn làm đến 19:00." khi `holiday && open`, ngược lại `null`.
  - `storyLayout(count: number): { lead: number | null; side: number[] }` (0 → `{lead:null, side:[]}`; 1 → `{lead:0, side:[]}`; 2 → `{lead:0, side:[1]}`; ≥3 → `{lead:0, side:[1,2]}`).
  - `excerpt(text: string, max: number): string` (cắt ở ranh giới từ, thêm "…" khi cắt; chuỗi ngắn giữ nguyên).
  - `productCategories(items: { category: string }[]): string[]` (thứ tự xuất hiện, không lặp) và `filterProducts<T extends { category: string }>(items: T[], category: string | 'all', limit = 6): T[]`.
  - `PUB_SECTION_IDS = ['gioi-thieu','dich-vu','doi-ngu','cau-chuyen','khong-gian','san-pham','quy-trinh','hoi-dap','lien-he'] as const`.

- [ ] **Step 1: Viết `homeView.test.ts` (thất bại).** Các ca: `hoursState` tại 07:59 → đóng; 08:00 → mở; 20:59 → mở; 21:00 → đóng; Chủ nhật 10:00 → mở (Chủ nhật như ngày thường); ngày lễ 18:59 → `{open:true, holiday:true}`, 19:00 → `{open:false, holiday:true}`; giờ đưa vào ở múi giờ UTC (vd `2026-10-26T01:30:00Z` = 08:30 VN) vẫn tính đúng. `holidayNote`: chỉ khi `holiday && open`. `storyLayout(0..4)` theo bảng trên. `excerpt('a '.repeat(200), 40)` có độ dài ≤ 41, kết thúc "…", không cắt giữa từ; chuỗi ngắn nguyên vẹn. `productCategories`/`filterProducts`: 8 mục, `limit` 6 mặc định; lọc `'food'` đúng nhóm; `'all'` giữ thứ tự.
- [ ] **Step 2: Chạy `npx vitest run src/features/public/home/homeView.test.ts`.** Expected: FAIL (module chưa có).
- [ ] **Step 3: Viết `homeView.ts`** theo Interfaces (dùng `Intl.DateTimeFormat` với `TZ` từ `@/lib/dates` để lấy giờ/phút VN; `todayVN` cho ngày).
- [ ] **Step 4: Chạy lại.** Expected: PASS.
- [ ] **Step 5: Token.** Thêm vào `src/styles/tokens.css` khối `[data-pub] { --pub-bg:#F2EFF3; --pub-plum:#53165C; --pub-ink:#291D34; --pub-ink-soft:#675E6D; --pub-line:#D9D1DD; --pub-surface:#FAF8FB; --pub-orange:#C95B0A; --pub-r-btn:5px; --pub-r-img:8px; }` (không đụng `:root`). Kiểm tra tương phản chữ phụ trên nền bằng phép tính (comment một dòng ghi tỉ lệ đo được; nếu < 4,5:1 thì sậm `--pub-ink-soft` và ghi sổ quyết định).
- [ ] **Step 6: `PROGRESS.md`.** Mục "Yêu cầu gửi nhánh kia" (giao-dien → du-lieu): `public.inquiries.submit({ name, phone, text, about? })` tạo yêu cầu liên hệ (loại "Lời nhắn") nhân viên thấy ở Yêu cầu; kiểm tra tên/điện thoại/nội dung, chống gửi trùng, giới hạn độ dài, không cần giờ làm việc; `about` = tên sản phẩm khi Hỏi mua. Ghi thêm (đợt sau): câu chuyện có `publishedAt` và mốc cập nhật.
- [ ] **Step 7: `npm run typecheck && npm run lint`.** Commit: `feat: home view logic and public tokens`.

---

### Task 2: khung đoạn, sợi chỉ, thanh điều hướng

**Files:** Create `PubSection.tsx`, `ScrollThread.tsx`, `Pub.module.css`; Modify `HomePage.tsx`, `PublicHeader.tsx`; Create `e2e/giao-dien-gioi-thieu.spec.ts`.

**Interfaces:**
- Consumes: `PUB_SECTION_IDS` (Task 1), `useReducedMotion` từ `@/ui/motion`.
- Produces:
  - `PubSection({ id, label, title, tone?, children, className? }: { id: string; label: string; title: ReactNode; ... })` → `<section id data-pub aria-labelledby>` với nhãn IN HOA `label`, `h2` (Lora, `title` có thể chứa `<em>`), một nút tròn nhỏ ("nút") trên sợi chỉ; reveal một lần cho phần đầu.
  - `ScrollThread()` → phần tử `[data-thread]` `aria-hidden`, một đường mảnh dọc, `scaleY` theo tiến độ cuộn của `<main>` (`useScroll`); `scaleY=1` cố định khi giảm chuyển động; ẩn dưới 640 px.
  - Scroll-spy trong `PublicHeader.tsx`: `ids` gồm toàn bộ `PUB_SECTION_IDS`; `doi-ngu`, `cau-chuyen`, `khong-gian`, `san-pham`, `quy-trinh`, `hoi-dap` quy về mục "Dịch vụ" của menu.

- [ ] **Step 1: Viết e2e thất bại** trong `e2e/giao-dien-gioi-thieu.spec.ts` (`describe('khung trang')`): (a) vào `/` thì `[data-thread]` có mặt ở 1440 và không có ở phone-320; sau khi cuộn xuống giữa trang, `transform` của nó có `scaleY` > giá trị ban đầu; với `@motion-reduced` `scaleY` = 1 ngay từ đầu; (b) vào thẳng `/dich-vu` thì mục menu "Dịch vụ" có `aria-current`; vào `/lien-he` thì "Liên hệ"; (c) `#noi-dung section[id]` chứa `hero-main` rồi các id theo `PUB_SECTION_IDS` còn hiện diện (kiểm tra ở cuối dự án; ở task này chỉ kiểm tra `[data-thread]` và scroll-spy).
- [ ] **Step 2: Chạy** `npm run build && npx playwright test e2e/giao-dien-gioi-thieu.spec.ts --project=desktop-1440`. Expected: FAIL.
- [ ] **Step 3: Viết `PubSection`, `ScrollThread`, CSS khung** (lưới 12 cột tối đa 1200 px, lề 16–20/24–40 px, khoảng giữa đoạn 72–96/40–56 px, nút 4–6 px). Gắn `<ScrollThread />` vào `HomePage.tsx` (trong `<main>`, đặt sau hero). Cập nhật scroll-spy. `HomePage.tsx` chưa đổi thứ tự đoạn.
- [ ] **Step 4: Chạy lại e2e này + `e2e/public.spec.ts` + `e2e/giao-dien-cong-khai.spec.ts`.** Expected: PASS (các test cũ của trang chủ không đổi vì chưa thay đoạn).
- [ ] **Step 5: Commit** `feat: public page frame, scroll thread and scroll spy`.

---

### Task 3: đoạn Giới thiệu "An tâm gửi gắm"

**Files:** Modify `sections/About.tsx`, `Pub.module.css`, `HomePage.tsx`; Modify e2e cũ (`giao-dien-cong-khai.spec.ts` mục "homepage — Giới thiệu"; `public.spec.ts` các test Giới thiệu và danh sách đoạn); Test `e2e/giao-dien-gioi-thieu.spec.ts`.

**Interfaces:** Consumes `PubSection`. Giữ id `gioi-thieu`.

- [ ] **Step 1: Viết/sửa e2e thất bại** (`describe('Giới thiệu')`): `#gioi-thieu` có `h2` "An tâm gửi gắm" (chữ "gửi gắm" là `<em>`), nhãn "VỀ LÊ SƠN", đoạn 2–3 câu, nút "Tìm hiểu Lê Sơn" cuộn tới `#dich-vu`, hai ảnh (ảnh lớn và ảnh phụ, `alt` khác nhau, cả hai có nhãn "Ảnh minh họa"), thẻ "Nội dung mẫu"; vẫn còn các sự kiện đã xác nhận: dòng "Nhận cấp cứu 24/24", liên kết `tel:+84973555105`, "Chỉ đường" (giữ test cũ về facts); ở 390 px thứ tự DOM là chữ → nút → ảnh và không cuộn ngang (`@narrow`, `fitsDevice`); `@motion-reduced`: transform của khối chữ là `none`. Sửa 2 test cũ (test "mockup layout: heading, three points…" và "reduced motion: Giới thiệu…") theo cấu trúc mới và bỏ tham chiếu `data-about-point`; cập nhật test thứ tự đoạn trong `giao-dien-cong-khai.spec.ts` (danh sách tiêu đề: đoạn đầu giờ là "An tâm gửi gắm").
- [ ] **Step 2: Chạy.** Expected: FAIL.
- [ ] **Step 3: Viết lại `About.tsx`** bằng `PubSection`: máy tính chia 5/7 (chữ trái, ảnh phải), ảnh phụ lệch xuống, quầng tím rất nhạt (`radial-gradient` một lớp, `pointer-events:none`, trôi theo cuộn qua `useScroll`/`useTransform` chỉ khi không giảm chuyển động), một chú thích kính mờ ngắn "Chăm sóc tận tâm" trên ảnh chính (`backdrop-filter` có `@supports` dự phòng nền đặc), không đè mặt. Ảnh dùng `petPhoto('meo-trang-ngu','card')` và `photo('kham','card')`, `width/height` rõ, `loading="lazy"`.
- [ ] **Step 4: Chạy** các tệp e2e đã sửa + `npx vitest run`. Expected: PASS. **Step 5: Commit** `feat: new Giới thiệu section`.

---

### Task 4: đoạn Dịch vụ + CTA

**Files:** Modify `sections/Services.tsx`, `Pub.module.css`; Create `useHospitalHours.ts`; Modify e2e cũ ("homepage — Dịch vụ", test thứ tự), Test `e2e/giao-dien-gioi-thieu.spec.ts`.

**Interfaces:**
- Consumes: `hoursState` (Task 1), `bookings.holidays()` và `system.now()` từ `@/data/public`.
- Produces: `useHospitalHours(): { state: HoursState; ready: boolean }` — đọc `system.now()` và `bookings.holidays()` khi gắn vào và làm mới mỗi 60 giây; dùng lại ở Task 6 và 8.

- [ ] **Step 1: Viết e2e thất bại** (`describe('Dịch vụ')`): ba hàng đánh số "01"/"02"/"03" với tên Khám & điều trị · Nội trú · Spa & grooming; mỗi hàng có mô tả một câu luôn thấy; mũi tên là liên kết `href` kết thúc `/dat-lich?dich-vu=kham|noi_tru|spa` (mở ra đúng dịch vụ đã chọn, như test cũ); máy tính: rê chuột/focus bàn phím vào hàng đổi ảnh khung dính (`alt` đổi) mà **không** điều hướng; điện thoại 390: chạm hàng mở ba mục con (`aria-expanded` đổi), tên và mô tả vẫn thấy khi đóng; dải "Cấp cứu 24/24" (`complementary` tên "Cấp cứu 24/24") giữ nút `tel:` và không có liên kết `dat-lich`; **CTA dưới dải Cấp cứu**: trong giờ (đặt đồng hồ `2026-10-26T14:00:00+07:00` bằng `__lesonDemo.setNow`, rồi vào `/dat-lich` và quay lại bằng liên kết "Về trang chủ" để đoạn gắn lại) có liên kết "Đặt lịch khám" tới `/dat-lich`; ngoài giờ (`2026-10-26T22:00:00+07:00`) đổi thành liên kết "Gọi 097 355 51 05" `tel:+84973555105`; ở 20:59 vẫn "Đặt lịch khám", 21:00 đã là gọi; dòng nhỏ "Chưa chắc chọn dịch vụ nào? Lê Sơn sẽ tư vấn khi gọi lại."; CTA nằm sau dải Cấp cứu trong DOM; `@narrow` không cuộn ngang. Sửa test cũ "three tabs; arrows switch…" và "Cấp cứu…" cho cấu trúc mới.
- [ ] **Step 2: Chạy.** Expected: FAIL.
- [ ] **Step 3: Viết `useHospitalHours.ts` rồi `Services.tsx`.** Mỗi `li` = nút chọn (`button`, tên + mô tả) và liên kết mũi tên riêng (không lồng tương tác trong tương tác); hàng đang chọn hiển thị ba mục con; máy tính: khung ảnh `position: sticky`, đổi ảnh bằng chồng mờ 200–300 ms; hover/focus chọn chỉ khi `(hover: hover)`; chạm/Enter chọn ở mọi thiết bị. Giữ nguyên nội dung ba mục con của mỗi dịch vụ từ `Services.tsx` cũ ("Nội dung mẫu"). Dải Cấp cứu giữ nguyên chữ và nút; CTA nằm dưới, tách xa nút Cấp cứu (khoảng cách ≥ 24 px).
- [ ] **Step 4: Chạy** các e2e đã sửa. Expected: PASS. **Step 5: Commit** `feat: new Dịch vụ section with booking CTA`.

---

### Task 5: Đội ngũ và Câu chuyện điều trị

**Files:** Modify `sections/Team.tsx`; Create `sections/Stories.tsx`, `sections/StoryDialog.tsx`, `useFeaturedImage.ts`; Modify `HomePage.tsx`, e2e (thứ tự đoạn, test Đội ngũ), Test `e2e/giao-dien-gioi-thieu.spec.ts`.

**Interfaces:**
- Consumes: `featured.cases()`, `storyLayout`, `excerpt`, `Dialog` từ `@/ui`, `useMediaUrls` (cho `local:img-…`).
- Produces: `useFeaturedImage(imageKey?: string): string | undefined` (URL ảnh nổi bật hoặc `undefined` khi không có/đã mất); `StoryDialog({ open, onClose, story })`.

- [ ] **Step 1: Viết e2e thất bại.** *Đội ngũ:* Bác sĩ trưởng Lê Thái Sơn (ảnh thật, không thẻ "Ảnh minh họa"), ba khung chỗ giữ "Nội dung mẫu" không có tên bịa. *Câu chuyện* (dữ liệu mẫu có 2 bài): nhãn "CÂU CHUYỆN ĐIỀU TRỊ", tiêu đề "Mỗi hành trình, một sự đồng hành."; bài lớn + một bài nhỏ ở 1440 (bài lớn rộng hơn); mỗi bài có tiêu đề, đoạn trích, "Đọc câu chuyện", thẻ "Nội dung mẫu"; bấm "Đọc câu chuyện" mở hộp thoại có tiêu đề bài, nội dung đầy đủ, tên bé + loài; không có tên chủ, thuốc, liều; `Esc` đóng và focus **trả về đúng nút đã bấm**; cuộn nền bị khóa khi mở; ở 390 một cột. Ẩn: dùng `__lesonDemo` đăng nhập `quanly_ha` và ẩn cả hai ca bằng API nhân viên (`api.staff.content.cases`, xem `src/data/contracts/staff.ts`), tải lại trang → không còn `#cau-chuyen` và sợi chỉ không để khoảng trống; một ca → chỉ bài lớn. Ảnh: ca không có `imageKey` hiện khung minh họa có nhãn "Ảnh minh họa" (không ảnh trống).
- [ ] **Step 2: Chạy.** Expected: FAIL.
- [ ] **Step 3: Viết `useFeaturedImage`, `Stories`, `StoryDialog`, sửa `Team`.** Không băng chuyền; bài đầu ~2/3 chiều rộng, hai bài sau xếp dọc (máy tính), một cột (điện thoại); `excerpt(story, 160)`; hộp thoại dùng `Dialog` hiện có (đã bẫy focus, Esc, trả focus); đoạn trả `null` khi không có bài (và không để lại `id`).
- [ ] **Step 4: Chạy** e2e + `npx vitest run`. Expected: PASS. **Step 5: Commit** `feat: Đội ngũ and Câu chuyện điều trị sections`.

---

### Task 6: Không gian và Sản phẩm nổi bật

**Files:** Create `sections/Space.tsx`, `sections/Products.tsx`; Modify `HomePage.tsx`, e2e; Test `e2e/giao-dien-gioi-thieu.spec.ts`.

**Interfaces:** Consumes `featured.products()`, `productCategories`, `filterProducts`, `useFeaturedImage`, `useHospitalHours` (Task 4). Produces `inquiryAction(name?: string): { kind: 'call'; href: string }` trong `Products.tsx` (hiện chỉ trả nút gọi; Task 6B thay bằng ô lời nhắn).

- [ ] **Step 1: Viết e2e thất bại.** *Không gian:* nhãn "KHÔNG GIAN", một ảnh chính + hai ảnh phụ, chú thích ngắn, mỗi ảnh "Ảnh minh họa", `alt` đúng nội dung. *Sản phẩm nổi bật* (mẫu: 3 sản phẩm hiện, 1 ẩn): nhãn "SẢN PHẨM NỔI BẬT", ba thẻ cùng tỷ lệ ảnh, mỗi thẻ có tên, nhóm, thẻ "Nội dung mẫu"; **không có chữ "giá", "bán chạy", ký hiệu "₫", nút giỏ hàng**; ba nút lọc nhóm (Thức ăn / Cát vệ sinh) chỉ có khi có từ hai nhóm: bấm "Cát vệ sinh" còn một thẻ; ẩn sản phẩm đến còn 0 (qua API nhân viên) → cả đoạn biến mất; "Hỏi mua" là liên kết `tel:+84973555105` kèm `aria-label` có tên sản phẩm; hai cột ở 390; một cột ở 320 hoặc khi chữ phóng 200%; không băng chuyền (không phần tử tự chạy).
- [ ] **Step 2: Chạy.** Expected: FAIL.
- [ ] **Step 3: Viết `Space.tsx` (3 ảnh minh họa có sẵn: `photo('noitru')`, `photo('grooming')`, `photo('kham')`) và `Products.tsx`** (tối đa 6, nền sáng cùng tỷ lệ, lọc bằng nhóm nút `ChipGroup`-kiểu của kit hoặc nút riêng cùng kiểu 4–6 px, chữ tên không bị cắt mất phân biệt).
- [ ] **Step 4: Chạy** e2e. Expected: PASS. **Step 5: Commit** `feat: Không gian and Sản phẩm nổi bật sections`.

---

### Task 7: Quy trình và Hỏi đáp

**Files:** Create `sections/Process.tsx`, `sections/Faq.tsx`; Modify `HomePage.tsx`; Test `e2e/giao-dien-gioi-thieu.spec.ts`.

**Interfaces:** Consumes `PubSection`, `useScroll`.

- [ ] **Step 1: Viết e2e thất bại.** *Quy trình:* bốn bước theo đúng thứ tự "Gửi yêu cầu · Lê Sơn liên hệ xác nhận · Đến khám · Hướng dẫn chăm sóc", "Nội dung mẫu"; đường nối vẽ theo cuộn (độ dài/`scaleX` tăng khi cuộn, đầy khi giảm chuyển động); ở 390 xếp dọc không cuộn ngang. *Hỏi đáp:* ba câu; mỗi câu là `button` có `aria-expanded="false"` và `aria-controls` trỏ tới panel; Enter/Space mở và đóng, `aria-expanded` đổi; mở một câu không bắt buộc đóng câu khác; nội dung không bị cắt; "Nội dung mẫu"; không lời khuyên điều trị (không chứa "liều", "thuốc").
- [ ] **Step 2: Chạy.** Expected: FAIL.
- [ ] **Step 3: Viết hai tệp.** Accordion tự viết bằng `button` (180–250 ms, chiều cao đo bằng `scrollHeight`; giảm chuyển động thì tức thì). Đường nối bước dùng `useScroll({ target })` + `useTransform`.
- [ ] **Step 4: Chạy.** Expected: PASS. **Step 5: Commit** `feat: Quy trình and Hỏi đáp sections`.

---

### Task 8: Đặt lịch và liên hệ, lối vào cổng khách

**Files:** Rewrite `sections/Contact.tsx`; Delete `sections/BookCta.tsx`, `BookCta.module.css`, `sections/AccountTeaser.tsx`; Modify `HomePage.tsx`, `PublicHeader.tsx`, e2e (`giao-dien-cong-khai.spec.ts` các test `data-book-cta`, `public.spec.ts` thứ tự đoạn và "no unconfirmed facts"), Test `e2e/giao-dien-gioi-thieu.spec.ts`.

**Interfaces:** Consumes `useHospitalHours`, `hoursState`, `holidayNote`, `HOSPITAL_INFO` (`@/data/rules/hospital`, nếu giao diện đã được phép nhập; nếu không thì hằng số chữ nguyên văn trong `Contact.tsx`), `MAPS_URL`, `FACEBOOK_URL` (giữ xuất từ `Contact.tsx`).

- [ ] **Step 1: Viết/sửa e2e thất bại.** Đoạn `#lien-he`: địa chỉ, hotline, "Giờ khám 08:00–21:00" **tách** khỏi "Cấp cứu 24/24", "Chỉ đường" (Maps), Facebook (`target=_blank`, `rel="noopener noreferrer"`, giữ test cũ); **trong giờ**: nút chính "Đặt lịch khám" → `/dat-lich`; **ngoài giờ**: "Gọi 097 355 51 05"; dòng ngày lễ: thêm một ngày lễ cho hôm nay bằng API nhân viên (`settings.update` với `holidays`, xem `src/data/contracts/staff.ts`) và đặt đồng hồ 14:00 → thấy "Hôm nay Lê Sơn làm đến 19:00."; 19:30 ngày lễ → nút gọi, không có dòng ghi chú; hai lối vào khác tên: "Đặt lịch khám" và "Đăng nhập theo dõi bé" (liên kết tới `/dang-nhap`; khi đã đăng nhập khách thì đổi thành "Vào tài khoản của bạn"); không còn `[data-book-cta]` cũ, `#hen-gap`, `#tai-khoan-khach-hang`; cập nhật test "booking buttons far down…" và "the booking band…" sang nút "Đặt lịch khám" trong `#lien-he`; cập nhật test thứ tự đoạn: `#noi-dung section[id]` = `['hero-main','gioi-thieu','dich-vu','doi-ngu','cau-chuyen','khong-gian','san-pham','quy-trinh','hoi-dap','lien-he']` (đoạn ẩn thì vắng, nên test ở dữ liệu mẫu đủ); test "no unconfirmed facts" bỏ `'giờ làm việc'` khỏi danh sách cấm (giờ đã được chủ dự án xác nhận 22/10) và giữ `'bảng giá', 'x-quang', 'siêu âm', 'quý khách', 'lễ tân'`; menu chính vẫn `['Trang chủ','Giới thiệu','Dịch vụ','Liên hệ']`; `@narrow` không cuộn ngang ở 320.
- [ ] **Step 2: Chạy.** Expected: FAIL.
- [ ] **Step 3: Viết `Contact.tsx`** (gộp liên hệ, CTA theo giờ, lối vào cổng khách, sơ đồ minh họa `MapArt` đổi màu theo `--pub-*`); xóa ba tệp cũ; sửa `HomePage.tsx` đúng thứ tự spec; bỏ `hen-gap`, `tai-khoan-khach-hang` khỏi scroll-spy.
- [ ] **Step 4: Chạy** toàn bộ e2e công khai (`giao-dien-cong-khai`, `public`, `giao-dien-gioi-thieu`, `booking`, `a11y`) ở desktop-1440. Expected: PASS. **Step 5: Commit** `feat: Đặt lịch and liên hệ section, remove old booking band and account teaser`.

---

### Task 9: rà tổng, trợ năng, tài liệu, kiểm tra toàn bộ

**Files:** Modify `Pub.module.css` và các đoạn nếu cần; docs (R48, PROGRESS, README, bảng kiểm thử nghiệp vụ); Test `e2e/giao-dien-gioi-thieu.spec.ts`, `e2e/manifest.ts`.

- [ ] **Step 1: Viết e2e thất bại.** (a) axe sạch trên `/` ở cả 3 dự án (`@a11y`, dùng cách ép kiểu `{ page } as unknown as ConstructorParameters<typeof AxeBuilder>[0]`), sau khi cuộn hết trang để mọi đoạn đã hiện; (b) 320 px và 390 px không cuộn ngang (`fitsDevice`) sau khi cuộn hết trang; zoom 200% (phóng cỡ chữ bằng `page.addStyleTag({content:'html{font-size:200%}'})`) vẫn không có phần tử vượt khung (`@narrow`); (c) token không rò: sau khi đăng nhập nhân viên và khách, `getComputedStyle(document.body).getPropertyValue('--pub-bg')` là chuỗi rỗng và không có `[data-pub]` trong `/nv` và `/khach-hang`; (d) quét chữ trên `/`: không chứa "quý khách", "lễ tân", "—" (gạch ngang dài) trong phần mới, "24/24" chỉ xuất hiện trong khối Cấp cứu hoặc dòng Cấp cứu; mọi đoạn "mẫu" (Đội ngũ phụ, Không gian, Quy trình, Hỏi đáp, bài/sản phẩm `sample`) có "Nội dung mẫu" hoặc "Ảnh minh họa"; (e) giảm chuyển động: không phần tử nào trong các đoạn mới có `transform` khác `none` sau 800 ms, sợi chỉ đầy; (f) ca biên: ẩn mọi sản phẩm và mọi câu chuyện, tải lại → trang không có khoảng trống lớn bất thường giữa Không gian và Quy trình (khoảng cách giữa hai đoạn kề nhau ≤ 160 px ở 1440); (g) thêm `/` vào `e2e/manifest.ts` nếu chưa có (trang công khai đã có sẵn).
- [ ] **Step 2: Chạy** `npm run build && npx playwright test e2e/giao-dien-gioi-thieu.spec.ts`. Sửa mọi lỗi thật tìm thấy (độ tương phản `--pub-ink-soft`, tràn ngang, thiếu nhãn). Expected: PASS ở desktop-1440, phone-390, phone-320.
- [ ] **Step 3: Tài liệu.** `QUYET-DINH.md` R48 (trang giới thiệu 9 đoạn, nền chung, sợi chỉ, token riêng, CTA theo giờ, sản phẩm nổi bật không giá, câu chuyện mở trên trang, ô lời nhắn chờ nhánh dữ liệu; chưa làm: 6B–6D, trang chi tiết, "Xem tất cả", giỏ hàng, phụ phí lễ, thanh gọi cố định); `PROGRESS.md` (6A xong, việc tiếp: 6B, 6C, 6D rồi gửi HTML; danh sách tư liệu cần chủ dự án bổ sung theo spec mục 10); `README.md` hàng trạng thái; bảng kiểm thử nghiệp vụ thêm mục "Trang giới thiệu (phần 6A)".
- [ ] **Step 4: Chạy `npm run verify`** ở nền (khoảng 24 phút; không chạy Playwright khác song song). Expected: exit 0.
- [ ] **Step 5: Commit** `docs: part 6A public intro page`.

---

## Tự rà kế hoạch

- **Phủ spec 6A:** nền/token/quầng/sợi chỉ → Task 1–3; 9 đoạn → Task 3–8; CTA Dịch vụ → Task 4; CTA theo giờ/ngày lễ → Task 1, 4, 8; Hỏi mua và lời nhắn → Task 6 (nút gọi chờ 6B); lối vào cổng khách → Task 8; yêu cầu nhánh dữ liệu → Task 1; chuyển động giảm → Task 2, 7, 9; trợ năng và 320 px → Task 9.
- **Nhất quán tên:** `hoursState`, `holidayNote`, `storyLayout`, `excerpt`, `productCategories`, `filterProducts`, `PUB_SECTION_IDS`, `PubSection`, `ScrollThread`, `useHospitalHours`, `useFeaturedImage`, `inquiryAction` dùng đúng tên từ Task 1 đến 9.
- **Chênh với spec (ghi sổ khi chạy):** ngày lễ trong e2e thêm qua API nhân viên của `__lesonDemo`; nếu API đó khác tên, dùng tên thực trong `src/data/contracts/staff.ts` và ghi một dòng quyết định.
- **Số quyết định tiếp theo:** R48.
