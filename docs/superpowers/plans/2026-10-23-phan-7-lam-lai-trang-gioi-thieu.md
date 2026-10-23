# Phần 7 — Làm lại hero và câu chuyện trang giới thiệu "Từ lo lắng đến yên tâm": kế hoạch thực hiện

> **Cho người thực hiện:** dùng superpowers:executing-plans (làm trong phiên này) hoặc superpowers:subagent-driven-development. Các bước dùng ô `- [ ]`. TDD: viết bài kiểm tra thất bại trước, xem nó thất bại, rồi mới viết mã. Phần nhìn (bố cục, cảm xúc) được duyệt bằng ảnh chụp ở 1440, 768, 390 và 320 px sau mỗi tác vụ giao diện; sửa điều ảnh chụp cho thấy rồi mới chụp lại.

**Mục tiêu:** trang giới thiệu (hero và chín đoạn dưới) đổi sang mạch "từ lo lắng đến yên tâm", ấm hơn, có nhịp, không còn sợi chỉ.

**Kiến trúc:** giữ cấu trúc hiện có (`HeroOrbit` + `HomePage` + `PubSection` + các đoạn trong `sections/`). Đổi token `--pub-*` sang bộ ấm có nhiều nền, bỏ `ScrollThread` và đường vẽ theo cuộn, đổi thứ tự đoạn, thêm hai thành phần nhỏ (`Drift`, dòng `ask`), sửa mô phỏng quỹ đạo để ảnh không bao giờ vào vùng chữ. Không đổi dữ liệu.

**Công nghệ:** React 19, CSS Modules, motion, Vitest, Playwright. Không thêm thư viện.

**Thiết kế:** `docs/superpowers/specs/2026-10-23-phan-7-lam-lai-trang-gioi-thieu-design.md` (chủ dự án duyệt 23/10/2026; tiêu đề hero phương án B).

## Ràng buộc chung

- Chữ tiếng Việt, gọi khách "bạn", bệnh viện "Lê Sơn", thú cưng "bé"; không "quý khách", không "lễ tân"; không gạch ngang dài trong chữ mới; nội dung tự đặt ghi "Nội dung mẫu", ảnh có sẵn ghi "Ảnh minh họa"; không bịa số liệu, bằng cấp, đánh giá.
- Thông tin nguyên văn: "101 Khuất Duy Tiến, Nhân Chính, Thanh Xuân, Hà Nội"; hotline "097 355 51 05" (`tel:+84973555105`); giờ 08:00–21:00 (ngày lễ đến 19:00); "24/24" chỉ cho Cấp cứu và **không xuất hiện ở hero**.
- Chuyển động: chỉ hero được lặp; còn lại chạy một lần, 150–450 ms, dịch 8–12 px; chuyển động gắn vào cuộn tối đa 12 px và chỉ ở ảnh bắc ngang; luôn tôn trọng `prefers-reduced-motion`; nội dung không bao giờ ẩn mặc định.
- Màu chỉ từ token (`src/styles/tokens.css`); chữ ≥ 4,5:1 trên mọi nền; cam chỉ cho chữ lớn và hình. Bo góc từ token `--r-*`. Icon Phosphor Duotone như cũ.
- Trợ năng: bàn phím, nhãn, `h1` duy nhất ở hero, mỗi đoạn `<section aria-labelledby>` có một `h2`; 320 px không cuộn ngang (kể cả chữ phóng 200%).
- Neo cũ giữ nguyên: `#gioi-thieu`, `#dich-vu`, `#lien-he` và các neo đoạn; đường dẫn `/gioi-thieu`, `/dich-vu`, `/lien-he` vẫn cuộn đúng đoạn.
- Không sửa `src/data`, khu khách, khu nhân viên, trang đặt lịch. Ảnh mới chỉ dùng tệp đã có trong `src/assets/img`.
- Kiểm thử e2e mới ở `e2e/giao-dien-gioi-thieu-moi.spec.ts` (bài cũ chỉnh nhỏ và ghi sổ); đồng hồ demo cho ca trong/ngoài giờ; **không chạy `npm run verify` lúc 00:00–03:00 giờ Việt Nam**; không chạy Playwright song song.
- Chạy e2e: `npm run build && npx playwright test <tệp> --project=desktop-1440` (build lại trước khi chạy).

## Review Focus

1. Hero: ảnh bay vào vùng chữ hoặc nút ở cỡ lạ (320, 768 đứng, 1024, 1920, màn thấp 600 px cao), khi tiêu đề xuống ba dòng, khi cỡ chữ hệ thống phóng 200%, khi đổi kích thước cửa sổ giữa chừng (Task 7, 8).
2. Giảm chuyển động hoặc bấm "Tạm dừng chuyển động": vẫn thấy đủ tiêu đề, hai nút và 4–5 ảnh ở chỗ cố định, không đè chữ (Task 8).
3. Ngoài giờ và ngày lễ: nút phụ của hero đổi đúng thành "Để lại lời nhắn"; không thấy chữ "24/24" ở hero; nút bấm được bằng bàn phím và mở/đóng hộp thoại, trả focus (Task 7).
4. Đổi thứ tự đoạn làm hỏng neo `/dich-vu`, `/lien-he`, thanh điều hướng đánh dấu mục hiện tại, hoặc cuộn tới đoạn đến muộn (Câu chuyện, Sản phẩm) (Task 3).
5. Hết sản phẩm hoặc hết câu chuyện hiện: đoạn biến mất mà nền xen kẽ không bị hai đoạn liền nhau cùng một nền, không hở khoảng trống, số chương liền mạch (Task 1, 3).
6. Nền xen kẽ làm chữ phụ hoặc đường kẻ rớt dưới 4,5:1 ở một nền (Task 1).
7. Ảnh bắc ngang ranh giới tràn ngang ở 320 px, đè chữ khi chữ dài, hoặc đè nút ở đoạn trên; ảnh không tải được thì khung vẫn gọn (Task 5).
8. Câu chuyện 600 ký tự liền và tên bé 30 ký tự liền trong bố cục lớn hơn; tên sản phẩm 60 ký tự liền (Task 6).
9. `prefers-reduced-motion`: ảnh bắc ngang không trôi, đoạn hiện ngay, hero tĩnh (Task 5, 8).

## Cấu trúc tệp

- Sửa: `src/styles/tokens.css`, `src/styles/tokens.test.ts`, `src/features/public/home/{HomePage.tsx,PubSection.tsx,Pub.module.css,homeView.ts,homeView.test.ts}`, `src/features/public/home/sections/*.tsx`, `src/features/public/hero/{HeroOrbit.tsx,hero-orbit.js,hero-orbit.css,hero-photos.css}`, `src/features/public/header/PublicHeader.tsx` (chỉ nếu bản đồ mục menu cần chỉnh), `e2e/{public.spec.ts,giao-dien-gioi-thieu.spec.ts,giao-dien-cong-khai.spec.ts}`.
- Tạo: `src/features/public/home/Drift.tsx`, `src/features/public/hero/HeroCall.tsx`, `e2e/giao-dien-gioi-thieu-moi.spec.ts`, `src/features/public/home/chapters.test.ts` (nếu cần cho logic thuần).
- Xóa: `src/features/public/home/ScrollThread.tsx`, `src/features/public/hero/hero-port.test.ts` (thay bằng bài hành vi ở Task 8).
- Docs: `docs/thiet-ke/QUYET-DINH.md` (R51), `CLAUDE.md`, `PROGRESS.md`, `README.md`, `docs/tham-khao/bang-kiem-thu-nghiep-vu-2026-10-21.md`.

---

### Task 1: bộ token ấm và nền xen kẽ

**Files:** Modify `tokens.css`, `tokens.test.ts`, `Pub.module.css`; Test `tokens.test.ts`.

**Interfaces — Produces:** trong `[data-pub]`: `--pub-bg-warm` (#FBF7F1), `--pub-bg-paper` (#FFFDFB), `--pub-bg-tint` (#F8F2F9), `--pub-bg-tint-strong` (#F1E6F3); `--pub-ink` (#231627), `--pub-ink-soft` (#5E4A62), `--pub-plum` (#5A1E5E), `--pub-line` (#E3D8E5), `--pub-surface` (#FFFFFF), `--pub-orange` (#C2560C, chữ lớn), `--pub-r-btn: 14px`, `--pub-r-img: 22px`. `.flow > section` nhận nền theo chu kỳ ba: lẻ `--pub-bg-warm`, chẵn `--pub-bg-paper`, thứ ba `--pub-bg-tint` (CSS `:nth-of-type`), riêng `#cau-chuyen` dùng `--pub-bg-tint-strong`.

- [ ] **Step 1: Viết bài thất bại trong `tokens.test.ts`** (`describe('intro page tokens')`): với mỗi nền trong `--pub-bg-warm`, `--pub-bg-paper`, `--pub-bg-tint`, `--pub-bg-tint-strong` và mỗi chữ trong `--pub-ink`, `--pub-ink-soft`, `--pub-plum`, tỷ lệ tương phản ≥ 4,5; `--pub-orange` trên mọi nền ≥ 3 (chữ lớn); `--pub-line` khác mọi nền. (Regex của bài hiện có chỉ đọc chuỗi `#RRGGBB`; các token mới đều có dạng đó.)
- [ ] **Step 2: Chạy `npx vitest run src/styles/tokens.test.ts`.** Expected: FAIL (token chưa có).
- [ ] **Step 3: Sửa `tokens.css`** đặt bộ token trên trong khối `[data-pub]` (sửa dòng chú thích tương phản cho đúng số mới). **Step 4:** chạy lại. Expected: PASS. Nếu một cặp rớt dưới 4,5 thì chỉnh màu chữ phụ, không chỉnh ngưỡng.
- [ ] **Step 5: `Pub.module.css`:** `.flow { background: var(--pub-bg-warm) }`; thêm quy tắc nền theo `:nth-of-type` (`.flow > section`), chu kỳ ba, và ngoại lệ `#cau-chuyen`; bỏ `.section { background: transparent }`. **Step 6:** viết bài e2e thất bại trong `giao-dien-gioi-thieu-moi.spec.ts` (`describe('nền xen kẽ')`): hai đoạn liền nhau bất kỳ trong `#noi-dung section[id]` (trừ hero) có `background-color` khác nhau; sau khi ẩn hết sản phẩm (qua `__lesonDemo.api.staff.content.products.setVisible`, đăng nhập `quanly_ha`) và hết câu chuyện, vẫn đúng; `#gioi-thieu` có nền kem `rgb(251, 247, 241)`. Chạy: FAIL trước khi sửa CSS, PASS sau. Sửa bài 6A `the --pub-* tokens exist only inside the intro sections` cho giá trị mới (`#fbf7f1`) nếu nó đọc `--pub-bg`; giữ `--pub-bg` = `--pub-bg-warm` để bài đọc được.
- [ ] **Step 7: Commit** `feat: warm intro tokens and alternating section backgrounds`.

---

### Task 2: bỏ sợi chỉ, quầng và đường vẽ theo cuộn

**Files:** Delete `ScrollThread.tsx`; Modify `HomePage.tsx`, `PubSection.tsx`, `Pub.module.css`, `sections/About.tsx`, `sections/Process.tsx`; Test `giao-dien-gioi-thieu.spec.ts`, `giao-dien-gioi-thieu-moi.spec.ts`.

- [ ] **Step 1: Viết bài thất bại** (`describe('không còn sợi chỉ')`): không có `[data-thread]`, `[data-glow]`, `[data-process-line]` trong trang; không có phần tử `.node` (đốm sợi chỉ); không có phần tử trang giới thiệu nào có `transform` khác `none` khi mới tải và chưa cuộn (ngoại trừ ảnh bắc ngang ở Task 5, bài này chạy trước Task 5 nên chưa có) — dùng cùng cách đếm như bài 6A ở `giao-dien-cong-khai.spec.ts:113`.
- [ ] **Step 2: Chạy.** Expected: FAIL. **Step 3: Xóa** `ScrollThread` và chỗ dùng trong `HomePage.tsx`; trong `PubSection.tsx` bỏ `<span className={p.node}>`; trong `Pub.module.css` bỏ `.thread`, `.node`, `.glow`, `.stepsLine`; trong `About.tsx` bỏ `useScroll`, `useTransform`, `glow`; trong `Process.tsx` bỏ `useScroll`/đường vẽ, bước hiện tĩnh (giữ `Reveal` từng bước và số bước).
- [ ] **Step 4: Sửa bài 6A cũ:** thay bốn bài về sợi chỉ (`the scroll thread…`, `phones under 640…`, `reduced motion: the thread…`) và hai bài về đường Quy trình (`the line between the steps…`, `reduced motion: the line is already full`, `phones: the Quy trình line stays clear…`) bằng một bài "không có" ở Step 1; bỏ bài `#gioi-thieu [data-glow]` ở dòng 79. Ghi sổ từng bài đã xóa.
- [ ] **Step 5: Chạy** `giao-dien-gioi-thieu.spec.ts` và bài mới ở desktop-1440 và phone-390. Expected: PASS. **Step 6: Commit** `feat: drop the scroll thread, glow and drawn step line`.

---

### Task 3: thứ tự đoạn mới, dòng hỏi và số chương

**Files:** Modify `homeView.ts`, `homeView.test.ts`, `HomePage.tsx`, `PubSection.tsx`, `Pub.module.css`, các `sections/*.tsx` (chỉ truyền `ask`), `public.spec.ts`, `giao-dien-gioi-thieu.spec.ts`; Test `homeView.test.ts`, `giao-dien-gioi-thieu-moi.spec.ts`.

**Interfaces — Produces:** `PUB_SECTION_IDS = ['gioi-thieu','doi-ngu','cau-chuyen','khong-gian','dich-vu','san-pham','quy-trinh','hoi-dap','lien-he']`; `PubSection({ id, label, title, ask?, children, className })` hiện `ask` dưới `h2` (một dòng, chữ phụ, 18–20 px); số chương bằng bộ đếm CSS (`counter-increment: chapter` trên mỗi `.flow > section`, hiển thị `counter(chapter, decimal-leading-zero)` cạnh nhãn, nên đoạn ẩn không làm đứt số).

Dòng hỏi (nội dung mẫu, chủ dự án sửa được): Giới thiệu "Bé không khỏe, mình nên làm gì?"; Đội ngũ "Ai sẽ chăm bé của bạn?"; Câu chuyện "Những bé khác đã được chăm thế nào?"; Không gian "Bé sẽ nằm ở đâu?"; Dịch vụ "Lê Sơn làm được những gì?"; Sản phẩm "Bé cần thêm gì ở nhà?"; Quy trình "Lần đầu đến thì thế nào?"; Hỏi đáp "Còn điều gì bạn ngại hỏi?"; Liên hệ "Vậy mình hẹn nhau nhé."

- [ ] **Step 1: Viết bài thất bại:** `homeView.test.ts` kiểm `PUB_SECTION_IDS` đúng thứ tự trên; e2e `describe('thứ tự và dòng hỏi')`: thứ tự `#noi-dung section[id]` là `['hero-main', ...PUB_SECTION_IDS]`; mỗi đoạn có đúng một `h2` và một dòng `[data-ask]` có chữ như bảng trên; số chương hiện là "01", "02"... liên tiếp trong các đoạn đang hiện (ẩn hết câu chuyện rồi kiểm lại vẫn liên tiếp); `/dich-vu` và `/lien-he` vẫn đưa đúng đoạn lên đầu màn và mục menu "Dịch vụ", "Liên hệ" sáng (bài 6A `the menu follows the section` giữ nguyên); khi vào `/dich-vu` lạnh mà Câu chuyện và Sản phẩm đến muộn, đoạn vẫn nằm đúng chỗ (bài 6A `opening /lien-he cold` giữ nguyên và chạy lại).
- [ ] **Step 2: Chạy.** Expected: FAIL. **Step 3: Viết:** đổi mảng và thứ tự trong `HomePage.tsx` (About, Team, Stories, Space, Services, Products, Process, Faq, Contact); `PubSection` nhận `ask`; CSS bộ đếm và kiểu dòng hỏi; mỗi đoạn truyền `ask`. Kiểm `PublicHeader.tsx` `NAV_OF`: mục "Giới thiệu" sáng ở `gioi-thieu`, `doi-ngu`, `cau-chuyen`, `khong-gian`; "Dịch vụ" ở `dich-vu`, `san-pham`, `quy-trinh`; "Liên hệ" ở `hoi-dap`, `lien-he` (đã đúng với thứ tự mới vì chọn theo thứ tự trong tài liệu; chỉ sửa nếu bài kiểm tra đỏ).
- [ ] **Step 4: Sửa hai bài thứ tự cũ** (`public.spec.ts:64-67`, `giao-dien-gioi-thieu.spec.ts:487`) thành thứ tự mới. **Step 5: Chạy** các tệp này, `giao-dien-cong-khai.spec.ts`, `a11y.spec.ts` ở desktop-1440 và phone-390. Expected: PASS. **Step 6: Commit** `feat: story-first section order, ask lines and chapter numbers`.

---

### Task 4: hình dạng, chữ và độ sâu ấm

**Files:** Modify `Pub.module.css`, `sections/*.tsx` (lớp bố cục nhỏ nếu cần); Test `giao-dien-gioi-thieu-moi.spec.ts`.

- [ ] **Step 1: Viết bài thất bại** (`describe('hình dạng và chữ')`): ở 1440 px, mọi `.fig` thuộc đoạn có `border-top-left-radius` từ 20 đến 28 px; nút chính trong `#gioi-thieu` có bo từ 12 đến 999 px (không còn 5 px); `h2` có cỡ ≥ 40 px ở 1440 và ≥ 30 px ở 390, dùng Lora; chữ nghiêng cam chỉ trong `h2 em`; thẻ ảnh có `box-shadow` khác `none`; không có thẻ lồng thẻ (không `.fig` nằm trong phần tử có bóng và nền). Ở 390 và 320: `fitsDevice` đúng; chữ nội dung ≥ 16 px.
- [ ] **Step 2: Chạy.** Expected: FAIL. **Step 3: Sửa** `Pub.module.css`: `.h2` `clamp(1.875rem, 4.2vw, 3.25rem)`; khoảng giữa đoạn 72–112 px máy tính, 48–64 px điện thoại; `.fig` bo `var(--pub-r-img)`, bóng `var(--e-1)`; `.btn` bo `var(--pub-r-btn)`; chip, hàng dịch vụ, thẻ sản phẩm theo cùng bán kính; bóng chỉ ở ảnh và thẻ chính.
- [ ] **Step 4: Chụp ảnh** từng đoạn ở 1440, 768, 390, 320 (kịch bản playwright trong scratchpad, không commit), xem và sửa điều nhìn thấy (ảnh méo, chữ đè, khoảng trống lạ). **Step 5: Chạy** bài mới và `a11y.spec.ts`. Expected: PASS. **Step 6: Commit** `feat: softer shapes, bigger display type and warm depth`.

---

### Task 5: ảnh bắc ngang ranh giới với chuyển động rất nhẹ

**Files:** Create `Drift.tsx`; Modify `sections/About.tsx`, `sections/Stories.tsx`, `sections/Contact.tsx`, `Pub.module.css`; Test `giao-dien-gioi-thieu-moi.spec.ts`.

**Interfaces — Produces:** `Drift({ children, range = 12, className }: { children: ReactNode; range?: number; className?: string })` bọc một ảnh, dịch dọc tối đa `range` px theo cuộn (`useScroll` trên chính phần tử, `useTransform` về `[-range, range]`, giảm chuyển động thì `y = 0`); gắn `data-drift`.

Ba chỗ bắc ngang: ảnh chính của Giới thiệu nhô lên hero (kéo lên bằng lề âm 56–96 px, nằm trên nền hero); ảnh bài đầu của Câu chuyện nhô lên đoạn Đội ngũ phía trên; thẻ liên hệ của Liên hệ nhô lên đoạn Hỏi đáp. Mỗi chỗ chỉ nhô khi đoạn trên có nền khác (luôn đúng nhờ Task 1).

- [ ] **Step 1: Viết bài thất bại** (`describe('ảnh bắc ngang')`): ở 1440, hình chữ nhật của `[data-drift]` thứ nhất giao với hình chữ nhật của hero (phần dưới) ít nhất 24 px và không giao với nút hay chữ của hero (`.ho .cta`, `.ho-title`); ảnh bắc ngang thứ hai giao với `#doi-ngu`, thứ ba với `#hoi-dap`; sau khi cuộn qua mỗi ảnh, độ dịch tuyệt đối của `transform` ≤ 12 px; ở 390 px không có ảnh nào làm `scrollWidth` > 390 (`fitsDevice`) và không đè lên văn bản của đoạn dưới (hình chữ nhật của ảnh không giao hình chữ nhật của `.lead`/`h2` của chính đoạn); `@motion-reduced`: `transform` của mọi `[data-drift]` là `none`; ảnh lỗi (đặt `src` hỏng) vẫn giữ khung có nền `--pub-surface`.
- [ ] **Step 2: Chạy.** Expected: FAIL. **Step 3: Viết** `Drift` và dùng ở ba chỗ; chỉnh lề âm bằng biến CSS để ở 768 px và 390 px lề nhỏ hơn (không đè chữ). Nếu ảnh lỗi để lộ ô trống, thêm `background` và `aspect-ratio` cho `.fig`.
- [ ] **Step 4: Chụp ảnh** ba chỗ ở bốn cỡ, sửa điều thấy. **Step 5: Chạy** bài mới, `giao-dien-gioi-thieu.spec.ts`, `a11y.spec.ts`, `motion.spec.ts`. Expected: PASS. **Step 6: Commit** `feat: photos that bridge section boundaries with a light drift`.

---

### Task 6: bố cục từng đoạn có nhịp khác nhau

**Files:** Modify `sections/{Team,Stories,Space,Services,Products,Process,Faq,Contact}.tsx`, `Pub.module.css`; Test `giao-dien-gioi-thieu-moi.spec.ts`, bài 6A liên quan.

Quyết định bố cục (không gõ CSS ở kế hoạch; người làm quyết bằng ảnh chụp):
- **Đội ngũ:** bác sĩ trưởng chiếm cột lớn (5/12) cạnh khối chữ ("Bác sĩ trưởng", tên, câu), ba ô "Sẽ bổ sung" nhỏ ở dưới thành một hàng.
- **Câu chuyện:** nền tím nhạt đậm hơn; bài đầu lớn, ảnh 16:10, chữ bên cạnh trên máy tính; hai bài sau nhỏ dưới hoặc bên phải; một cột trên điện thoại.
- **Không gian:** ghép ảnh rộng hơn, chú thích ngắn trên ảnh bằng nền đặc.
- **Dịch vụ:** giữ danh sách đánh số + khung ảnh dính, bo lớn hơn; khối Cấp cứu giữ chữ "24/24".
- **Sản phẩm:** thẻ có ảnh bo lớn và bóng nhẹ; lọc nhóm giữ.
- **Quy trình:** bốn thẻ số tĩnh (không đường nối), nền giấy.
- **Hỏi đáp:** hai cột trên máy tính: bên trái dòng hỏi và tiêu đề dính, bên phải danh sách; một cột trên điện thoại.
- **Liên hệ:** thẻ lớn trên nền ấm, nút Đặt lịch và Gọi to; lời kết "Vậy mình hẹn nhau nhé." (đã ở `ask`).

- [ ] **Step 1: Viết bài thất bại** (`describe('nhịp bố cục')`): hai đoạn liền nhau không có cùng giá trị `grid-template-columns` ở thùng bố cục chính (đọc từ phần tử đầu tiên có `display: grid` trong `.inner` sau `.head`) ở 1440; bài đầu của Câu chuyện rộng hơn 55% thùng của nó ở 1440; `#hoi-dap` có hai cột ở 1440 và một cột ở 390; bốn bước Quy trình hiện không có phần tử đường nối; với câu chuyện 600 ký tự liền và tên bé 30 ký tự liền, tên sản phẩm 60 ký tự liền (tạo qua `__lesonDemo.api.staff.content.*`), `fitsDevice` ở 390 và 320 và không phần tử nào của đoạn rộng hơn khung đoạn (`scrollWidth <= clientWidth` của `.inner`).
- [ ] **Step 2: Chạy.** Expected: FAIL. **Step 3: Viết** từng bố cục theo quyết định trên; mỗi đoạn xong thì chụp ảnh bốn cỡ và sửa. **Step 4: Chạy** bài mới, toàn bộ `giao-dien-gioi-thieu.spec.ts` (các bài đoạn: Dịch vụ hàng/khung ảnh, Đội ngũ ô trống, Câu chuyện hộp thoại, Sản phẩm lọc/Hỏi mua, Hỏi đáp bàn phím, Liên hệ ngoài giờ), `giao-dien-loi-nhan.spec.ts`, `a11y.spec.ts` ở desktop-1440 và phone-390. Expected: PASS (bài cũ phụ thuộc vào chọn phần tử đã đổi thì sửa bộ chọn, không đổi ý nghĩa). **Step 5: Commit** `feat: varied section compositions`.

---

### Task 7: chữ và nút của hero

**Files:** Create `HeroCall.tsx`; Modify `HeroOrbit.tsx`, `hero-orbit.css`; Test `giao-dien-gioi-thieu-moi.spec.ts`, `giao-dien-cong-khai.spec.ts`.

**Interfaces — Produces:** `HeroCall()` — nút phụ của hero: trong giờ `<a class="btn btn--ghost" href="tel:+84973555105">Gọi 097 355 51 05</a>`; ngoài giờ (theo `useHospitalHours().state.open === false`) một `<button class="btn btn--ghost">Để lại lời nhắn</button>` mở `InquiryDialog` (lazy, `@/features/public/inquiry/LazyInquiryDialog`) và trả focus khi đóng. `HeroOrbit` vẫn là `memo` không có state; trạng thái giờ nằm trong `HeroCall`.

- [ ] **Step 1: Viết bài thất bại** (`describe('hero: chữ và nút')`): `h1#hero-title` chứa "Khi bé không khỏe, bạn không phải lo" và `em` "một mình."; dòng phụ chứa "Không gian lớn cho những người bạn nhỏ." và "Chăm sóc bằng chuyên môn, đồng hành bằng sự thấu hiểu."; có nhãn "Nội dung mẫu" gần tiêu đề (cùng `.ho__content`); trong giờ (`openDuringHours`) có nút "Gửi yêu cầu đặt lịch" (liên kết `/dat-lich`) và liên kết "Gọi 097 355 51 05" `tel:+84973555105`; ngoài giờ (`setClock` 22:30) liên kết gọi đổi thành nút "Để lại lời nhắn", bấm mở hộp thoại, Esc đóng và trả focus; ngày lễ đến 19:00 đổi đúng theo `hoursState`; không có chữ "24/24" trong `.ho`; `h1` duy nhất trên trang; bàn phím Tab đi qua hai nút theo thứ tự; ở 320 và 390 px hai nút xếp dọc, rộng hết bề ngang, `fitsDevice`.
- [ ] **Step 2: Chạy.** Expected: FAIL. **Step 3: Viết:** sửa chữ trong `HeroOrbit.tsx` (tiêu đề hai dòng: "Khi bé không khỏe," và "bạn không phải lo <em>một mình.</em>"; mỗi dòng giữ `data-measure` và lớp `line reveal`); đặt `HeroCall` trong `.cta` cạnh nút chính (`data-measure` ở nút phụ); thêm nhãn "Nội dung mẫu" nhỏ dưới dòng phụ (dùng lớp `.preview-tag` hiện có hoặc `DemoTag`); trong `hero-orbit.css` bỏ nền kính và viền của `.subtitle`, tiêu đề `clamp(2.25rem, 5.4cqw + .5rem, 4.5rem)` máy tính và `clamp(2rem, 8.4cqw + .1rem, 2.5rem)` điện thoại; nút phụ dùng `.btn--ghost`.
- [ ] **Step 4: Sửa bài cũ** `giao-dien-cong-khai.spec.ts:35` nếu bộ chọn nút đổi. **Step 5: Chạy** bài mới, `giao-dien-cong-khai.spec.ts`, `public.spec.ts`, `motion.spec.ts`. Expected: PASS. **Step 6: Commit** `feat: empathetic hero headline with call and message buttons`.

---

### Task 8: quỹ đạo: ít ảnh, ảnh rõ, không bao giờ vào vùng chữ

**Files:** Modify `hero-orbit.js`, `hero-orbit.css`, `hero-photos.css`; Delete `hero-port.test.ts`; Modify `public.spec.ts`; Test `giao-dien-gioi-thieu-moi.spec.ts`.

Quyết định: bộ khung còn **5** (`SPECS` còn 5 mục; điện thoại và máy tính bảng đứng dùng 4 đầu). Ảnh theo thứ tự khung: `hero-2` (chó con ngậm hoa), `hero-5` (bàn tay vuốt mèo), `hero-0` (mèo cười khăn vàng), `hero-1` (mèo ngủ), `hero-6` (người ôm mèo); khung 6–9 và ảnh xanh nền phẳng `hero-3` không dùng. Mọi khung rõ nét: độ sâu không làm mờ quá `--blur-mid` (bỏ làm mờ khung xa) và độ mờ nền khung xa ≥ 0,9. **Mở màn:** khung hiện tại chỗ trên quỹ đạo (phóng từ 0,22 lên đủ cỡ, mờ vào), không bay từ giữa chữ ra. Không còn đợt lướt qua chữ (đã tắt từ trước; giữ). Bố cục tĩnh (giảm chuyển động hoặc đang tạm dừng) có khóa mới `wide5` và `tall4` thay các khóa cũ.

- [ ] **Step 1: Viết bài thất bại** (`describe('quỹ đạo')`): `.ho__frames .frame` có đúng 5 phần tử (sửa `public.spec.ts:44-51` từ 9 xuống 5), hiển thị 5 ở 1440 và 4 ở 390 và 320; mỗi khung có `background-image` đúng thứ tự tệp trên; lấy mẫu mỗi 400 ms trong 14 giây ở 1440, 1024, 768 ngang, 390 và 320 (vòng lặp `page.evaluate` đọc `getBoundingClientRect` của mọi `.frame` có `opacity > 0.05` và của `.ho-title`, `.subtitle`, `.cta`, `.eyebrow`): **không hình chữ nhật khung nào giao hình chữ nhật chữ hay nút** (đệm 4 px) ở mọi thời điểm kể cả lúc mở màn; không khung nào vượt ra ngoài hero quá 20% bề rộng của nó; `@motion-reduced` và sau khi bấm "Tạm dừng chuyển động": khung đứng yên ở bố cục tĩnh, vẫn không giao chữ, tiêu đề và hai nút đều thấy; cỡ chữ hệ thống 200% ở 390: vẫn không giao; đổi kích thước cửa sổ từ 1440 sang 390 rồi quay lại: số khung hiển thị đổi đúng và không giao; tiêu đề ba dòng (ép độ rộng 320): vẫn không giao.
- [ ] **Step 2: Chạy.** Expected: FAIL (giao ở mở màn, số khung 9). **Step 3: Viết:** trong `hero-orbit.js` đổi `SPECS`, `count` (`mobile ? 4 : tall ? 4 : 5`), `STATIC` (`wide5`, `tall4` chọn tay để khung xa chữ), phần mở màn (đích làm điểm xuất phát, không đi qua chữ), độ sâu; nếu vẫn có giao ở màn thấp, đẩy `rx0/ry0` ra ngoài hộp chữ thêm đệm. Chỉ sửa tệp này theo quyết định trên; không cải tiến thêm. Trong `hero-photos.css` đổi bản đồ `nth-child` theo thứ tự ảnh; bỏ các luật `gt__slot-frame` đã chết nếu không còn dùng (kiểm bằng tìm kiếm).
- [ ] **Step 4: Xóa `hero-port.test.ts`** (bài "port đúng từng dòng", đã được chủ dự án cho phép bỏ ngày 23/10/2026) và ghi vào sổ; thêm một bài đơn vị thuần nếu rút được hàm tính hình học ra tệp riêng (không bắt buộc). **Step 5: Chạy** bài mới ở desktop-1440, phone-390, phone-320, reduced-motion; `public.spec.ts`; `motion.spec.ts`. Expected: PASS.
- [ ] **Step 6: Chụp ảnh hero** ở 1440, 1024, 768, 390, 320, ở các giây 1, 3, 8, 16 và ở chế độ tĩnh; sửa điều thấy. **Step 7: Commit** `feat: five clear orbit photos that never cross the text`.

---

### Task 9: hero tan vào đoạn đầu, chỉnh chu cuối cùng

**Files:** Modify `hero-orbit.css`, `Pub.module.css`; Test `giao-dien-gioi-thieu-moi.spec.ts`.

- [ ] **Step 1: Viết bài thất bại** (`describe('hero tan vào trang')`): màu cuối của nền hero (dừng cuối của `background-image` của `.ho`) bằng màu `--pub-bg-warm` (so sánh dạng `rgb`); `#gioi-thieu` bắt đầu ngay dưới hero không có khoảng trắng lạ (chênh `top` của `#gioi-thieu` và `bottom` của `.ho` trong khoảng −96 đến 0 vì ảnh bắc ngang); hero vừa một màn hình ở 1440×900, 1280×720, 390×844 và 320×568: nút chính và nút phụ nằm hoàn toàn trong khung nhìn đầu tiên (`getBoundingClientRect().bottom <= innerHeight`); ở 320×568 vẫn vậy hoặc hero cho phép cuộn mà không che nút Tạm dừng.
- [ ] **Step 2: Chạy.** Expected: FAIL. **Step 3: Viết:** đổi dừng cuối của gradient hero sang `var(--pub-bg-warm, #FBF7F1)` (hero không nằm trong `[data-pub]` nên dùng giá trị tương đương `#FBF7F1` đã có là `--cream` trong `.ho`; đặt cùng một giá trị ở một chỗ duy nhất qua `--cream-50`); thêm lớp mờ dần ở đáy hero (`::after`, cao 96–140 px) từ trong suốt sang nền kem; chỉnh `min-height` hero theo chiều cao khung nhìn (`min-height: min(736px, 100svh - header)` với sàn 560 px).
- [ ] **Step 4: Chụp ảnh** trang từ hero đến hết đoạn Giới thiệu ở bốn cỡ, sửa chỗ nối. **Step 5: Chạy** bài mới, `public.spec.ts`, `a11y.spec.ts`, `giao-dien-gioi-thieu.spec.ts` ở desktop-1440, phone-390, phone-320. Expected: PASS. **Step 6: Commit** `feat: hero background flows into the first section`.

---

### Task 10: tài liệu, bộ phát hiện và kiểm tra toàn bộ

- [ ] **Step 1: Tài liệu.** `QUYET-DINH.md` R51 (làm lại hero và trang giới thiệu theo mạch "từ lo lắng đến yên tâm"; thay các điều của R48: nền một màu, quầng, sợi chỉ, nút/ảnh phẳng, thứ tự đoạn; hero được sửa; tiêu đề B nhãn "Nội dung mẫu"; số chương, dòng hỏi; ảnh bắc ngang; không còn đường vẽ theo cuộn; chưa làm: ảnh thật, trang chi tiết, giá); `CLAUDE.md` (dòng "hero" ở mục Dự án và "Quy tắc nội dung": hero được phép sửa từ 23/10/2026; bỏ "port đúng từng dòng" nếu có; quy tắc "chỉ hero được lặp" giữ); `PROGRESS.md` (phần 7 xong, ghi các bài đã xóa/đổi, việc tiếp theo: chủ dự án xem rồi mới gửi một tệp HTML mới; tư liệu thật cần bổ sung); `README.md` hàng trạng thái; bảng kiểm thử nghiệp vụ mục "Trang giới thiệu mới (phần 7)". Kiểm số quyết định trước khi ghi (`grep -n "R51" docs/thiet-ke/QUYET-DINH.md`).
- [ ] **Step 2: Bộ phát hiện của Impeccable (một lần):** chạy `/root/.claude/skills/impeccable/scripts/impeccable detect --json src/features/public` khi giao diện đã xong; đọc kết quả, sửa điều thật sự vi phạm quy tắc dự án (tương phản, kích thước chạm, chữ nhỏ), ghi sổ điều bỏ qua vì mâu thuẫn quy chuẩn thương hiệu của dự án (màu, chữ, bo góc đã được chủ dự án chốt).
- [ ] **Step 3: `npm run typecheck && npm run lint && npx vitest run`.** Expected: sạch. **Step 4: Commit** `docs: part 7 intro page redesign`.
- [ ] **Step 5 (sau rà soát độc lập và một lượt sửa):** `npm run verify` ở nền (khoảng 30 phút; ngoài 00:00–03:00 giờ Việt Nam; không chạy Playwright khác song song). Expected: thoát mã 0. Bài đỏ chập chờn thì chạy riêng, sửa nguyên nhân, ghi sổ.

---

## Tự rà kế hoạch

- **Phủ spec phần 7:** bỏ sợi chỉ → Task 2; thứ tự đoạn, dòng hỏi, số chương → Task 3; nền xen kẽ và token ấm → Task 1; bo góc, chữ, bóng → Task 4; ảnh bắc ngang + chuyển động ≤ 12 px → Task 5; nhịp bố cục từng đoạn → Task 6; hero (tiêu đề B, hai nút, không giao chữ, ít ảnh rõ, tan vào đoạn đầu, điện thoại) → Task 7, 8, 9; quyết định thay R48, CLAUDE.md, bài kiểm tra cũ → Task 10, Task 2, Task 8.
- **Nhất quán tên:** `Drift`, `HeroCall`, `PUB_SECTION_IDS`, `PubSection.ask`, token `--pub-bg-warm/paper/tint/tint-strong`, khóa tĩnh `wide5`/`tall4` dùng đúng từ Task 1 đến 10.
- **Chênh với spec (ghi sổ khi chạy):** số chương chỉ "01…" không có "/ 09" (bộ đếm CSS xử lý đúng khi đoạn ẩn); nền xen kẽ chọn bằng `:nth-of-type` thay cho thuộc tính `tone`; ảnh xanh nền phẳng không dùng ở hero; nếu một ca đo ở màn rất thấp (≤ 500 px cao) không thể vừa trong một màn hình, hero được phép cuộn miễn là hai nút không bị che.
- **Số quyết định:** R51.
