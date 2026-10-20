# Phần 2 — Trang công khai, đặt lịch, đăng nhập Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the homepage, a standalone booking page and the login/sign-up shell in the new mockup style on the part-1 foundation, with the owner's photos, without breaking the booking/login flows.

**Architecture:** Restyle in place. Homepage sections are rewritten one by one (Giới thiệu, Dịch vụ + Cấp cứu strip, Đội ngũ, CTA band, flattened Tài khoản/Liên hệ); the old pinned/linked effects (R30/R31) and their tests are removed with the code they test. `#/dat-lich` becomes its own page reusing `BookingForm` unchanged in behaviour. The auth shell swaps the hero-morph portal panel for a photo panel. Data the data branch owes (time slot, remember-me, pet photo keys) is wired only when its contract is on the integration branch; until then those controls stay hidden behind one flag file.

**Tech Stack:** React 19, TS 6, Vite 8, CSS Modules + tokens, motion 13 presets (`@/ui/motion` `preset()`), part-1 kit (`@/ui`: Tabs, SectionCard, PetAvatar, PageHeader …), Playwright + axe, Python/PIL.

**Spec:** `docs/superpowers/specs/2026-10-20-phan-2-cong-khai-dat-lich-dang-nhap-design.md` (parent: `2026-10-20-lam-lai-giao-dien-design.md`; base rules `docs/thiet-ke/QUYET-DINH.md`, `CLAUDE.md`).

**Branch:** `claude/giao-dien` (`/home/user/tesst/.worktrees/giao-dien`). Do not edit `src/data/**`.

## Global Constraints

- Copy Vietnamese, customer = "bạn"; hotline text exactly "097 355 51 05", link `tel:+84973555105`; address exactly "101 Khuất Duy Tiến, Nhân Chính, Thanh Xuân, Hà Nội"; "24/24" only for Cấp cứu.
- Sample content tagged "Nội dung mẫu"; sample photos tagged "Ảnh minh họa" — except the head-doctor photo (real).
- Doctor block shows only "Bác sĩ trưởng", "Lê Thái Sơn", "Đồng hành cùng thú cưng mỗi ngày." — no credentials, experience or awards.
- Only the hero loops. Section reveals once, 8–12 px, ≤ 450 ms (`preset('enterList'|'fadeSwap')`); reduced motion → opacity ≤ 100 ms.
- No new font files (font budget); "Luôn đồng hành cùng thú cưng của bạn" uses Lora italic orange.
- Phones 320 px: no sideways overflow measured against `page.viewportSize().width` (not `innerWidth`).
- Budgets: initial JS ≤ 240 KB gz; non-photo files ≤ 80; photos ≤ 60 files / 4 MB; largest photo ≤ 250 KB.
- `npm run verify` green before merge.

## Review Focus

1. Old links to the homepage booking section (`#/dat-lich` from menus, footer, hero, login, emails in tests) → must land on the new booking page, never on a homepage that no longer has the section. Pinned in Task 2 (route test + hero/footer link test).
2. `?dich-vu=` with an unknown value or a staff session on the booking page → form still renders, nothing preselected / submit disabled with the R28 note. Pinned in Task 2.
3. Hero script after the pinned "Giới thiệu" is gone → hero still shows 9 frames and loops; no console errors. Pinned in Task 3 (existing hero test + error tracker).
4. Keyboard on the service tabs: arrows move and activate, the panel is labelled by its tab, the CTA inside the panel is reachable with Tab. Pinned in Task 4.
5. Login while the remember-me contract is missing → no checkbox shown (never a box that does nothing). Pinned in Task 6.

---

### Task 1: Owner photos → sizes, team photo

**Files:** Modify `scripts/photos.py`, `src/assets/media.ts`, `src/assets/media.test.ts`. Generated: `src/assets/img/pet-{cho-pom-trang,cho-poodle-chuong,cho-poodle-xe,meo-trang-gang-tay,meo-trang-ngu}-{avatar,card[,banner]}.webp`, `src/assets/img/team-le-thai-son-card.webp`.

**Interfaces:**
- Produces: `petPhoto(key, size)` (existing) now resolves the five new keys; `teamPhoto(): string` → URL of `team-le-thai-son-card.webp` (portrait, 720 px wide).
- `photos.py`: owner pet photos use EXIF-corrected images; **banner only when the source is ≥ 1600 px wide**, quality 72; card quality 76. Team photo: crop the left text band off — keep x from 34 % of width to the right edge, full height, resize to 720 px wide, quality 80, no plum colour grade (mild `ImageEnhance.Color(0.97)` only). Every output ≤ 250 KB (assert in the script; fail loudly).

- [ ] **Step 1 (test):** add to `src/assets/media.test.ts`: `petPhoto('cho-poodle-xe','card')` matches `/pet-cho-poodle-xe-card.*\.webp/`; `petPhoto('meo-trang-ngu','avatar')` defined; `teamPhoto()` matches `/team-le-thai-son-card.*\.webp/`.
- [ ] **Step 2:** `npx vitest run src/assets/media.test.ts` → FAIL.
- [ ] **Step 3:** extend `photos.py` (team crop under `docs/tham-khao/anh/doi-ngu/`, top-level scan stays for pets), run it, open a contact sheet of the 5 avatars + team crop and check faces are in frame and the overlaid text is gone; add `teamPhoto` to `media.ts`.
- [ ] **Step 4:** test → PASS; `npm run build:artifact && npm run budgets` → all ✓.
- [ ] **Step 5:** commit `feat(media): owner photos and the head-doctor photo`.

### Task 2: Booking page `#/dat-lich`

**Files:** Create `src/features/public/booking/BookingPage.tsx`, `BookingPage.module.css`, `e2e/giao-dien-cong-khai.spec.ts`, `e2e/width.ts`. Modify `src/app/routes.ts` (`SECTIONS` drops `'dat-lich'`; add `paths.book = '/dat-lich'`), `src/app/routes.test.ts`, `src/app/router.tsx` (`dat-lich` → `BookingPage`, eager like `HomePage`, handle `{ pageKey: 'book', title: 'Gửi yêu cầu đặt lịch' }`), every `paths.section('dat-lich')` user → `paths.book` (HeroOrbit, Footer, LoginPage, BookingForm, Services, PublicHeader ids list), delete `src/features/public/home/BookingSlot.tsx` (its `?dich-vu` parsing moves into `BookingPage`).

**Interfaces:**
- Produces: `paths.book`; `BookingPage` (default export not needed — named export); `fitsDevice(page: Page): Promise<void>` in `e2e/width.ts` — asserts `document.documentElement.scrollWidth <= page.viewportSize()!.width`.
- Layout per spec §3.2: left — h1 "Hẹn gặp tại *Lê Sơn*" (`<em>` orange), the lead sentence, 3 steps (`<ol>`, icons `send`, `phone`, `calendar-check`; titles/lines verbatim from spec), hotline block (`tel:` link, text "097 355 51 05", label "Hotline hỗ trợ"); right — `SectionCard`-style card titled "Gửi yêu cầu đặt lịch" with sub line, `BookingForm initialService={…}`, note "Lịch hẹn được xác nhận sau khi Lê Sơn liên hệ.". Two columns ≥ 960 px (`minmax(0,5fr) minmax(0,7fr)`), phone: heading+steps, form, hotline. Steps enter with `preset('enterList', { index })`.

- [ ] **Step 1 (tests):** `routes.test.ts`: `paths.book === '/dat-lich'` and `SECTIONS` excludes `'dat-lich'`. `e2e/giao-dien-cong-khai.spec.ts` describe "booking page":
  - `/dat-lich` shows h1 `Hẹn gặp tại Lê Sơn`, the 3 step titles in order, a `tel:+84973555105` link, and `#form-dat-lich`.
  - `/dat-lich?dich-vu=noi_tru` → radio "Nội trú" checked; `/dat-lich?dich-vu=xyz` → no service radio checked, form usable (Review Focus 2).
  - hero CTA and footer "Gửi yêu cầu đặt lịch" from `/` land on `/dat-lich` page h1 (Review Focus 1).
  - guest fills (reuse the fill steps from `e2e/booking.spec.ts`) and sees "Đã gửi yêu cầu" confirmation.
  - `@narrow` `fitsDevice(page)`.
- [ ] **Step 2:** `npx vitest run src/app/routes.test.ts`; `npm run build && npx playwright test e2e/giao-dien-cong-khai.spec.ts` → FAIL.
- [ ] **Step 3:** implement; update `e2e/booking.spec.ts` only where it relied on the homepage section (it opens `/dat-lich`, which is now the page — the `#form-dat-lich` locators keep working; the "service card preselects" test moves to Task 4).
- [ ] **Step 4:** unit + `e2e/giao-dien-cong-khai.spec.ts` + `e2e/booking.spec.ts` + `e2e/journeys/booking.spec.ts` → PASS.
- [ ] **Step 5:** commit `feat(public): standalone booking page #/dat-lich`.

### Task 3: Giới thiệu (new) and removal of the pinned flight

**Files:** Rewrite `src/features/public/home/sections/About.tsx` (+ new `About.module.css`), delete `src/features/public/home/sections/gioi-thieu.css`; modify `src/features/public/home/HomePage.tsx` (drop `introLandedY` and its use), `src/features/public/hero/*` only if the vendored hero script needs a guard for the missing `.gt-pin` (check `hero-orbit.js` for `gt` lookups; if it already null-checks, leave it); tests `e2e/public.spec.ts` (delete "Giới thiệu: three hero frames land…", keep/adjust "@narrow Giới thiệu fits…" to `fitsDevice`), `e2e/motion.spec.ts` (replace "Giới thiệu shows its photos in place, no flight" with "Giới thiệu has no transform under reduced motion"), `e2e/giao-dien-cong-khai.spec.ts`.

**Interfaces:**
- Consumes: `petPhoto('meo-trang-ngu','card')` (Task 1), `DemoTag`, `Icon`, `ButtonAnchor`, `preset`.
- Content per spec §3.1.2 verbatim: eyebrow "VỀ BỆNH VIỆN THÚ Y LÊ SƠN"; h2 "Chăm sóc bằng chuyên môn, đồng hành bằng <em>sự thấu hiểu</em>."; the current lead paragraph (keep its text) + DemoTag "Nội dung mẫu · Lê Sơn sẽ cập nhật bài giới thiệu chính thức"; three points (icons `heart`, `stethoscope`, `users-round`): "Lắng nghe" / "Hiểu câu chuyện của từng bé", "Chăm sóc" / "Tận tâm với chuyên môn", "Đồng hành" / "Cùng bạn trong suốt hành trình"; facts row (existing `FACTS`) + "Chỉ đường". Photo right (bo 20 px, `alt="Bé mèo trắng nằm nghỉ trên máy ở phòng khám"`, DemoTag "Ảnh minh họa"). `id="gioi-thieu"` stays on the section.

- [ ] **Step 1 (tests):** in `giao-dien-cong-khai.spec.ts`: `/gioi-thieu` → heading "Chăm sóc bằng chuyên môn, đồng hành bằng sự thấu hiểu." visible, the three point titles, an `img` with that alt; page has no `.gt-pin`; `trackErrors` empty after 2 s (Review Focus 3).
- [ ] **Step 2:** build + run → FAIL.
- [ ] **Step 3:** implement; remove the old About markup/CSS; keep hero intact.
- [ ] **Step 4:** run new spec + `e2e/public.spec.ts -g "hero"` + `e2e/motion.spec.ts` → PASS.
- [ ] **Step 5:** commit `feat(public): Giới thiệu in the mockup layout; drop the pinned flight`.

### Task 4: Dịch vụ tabs + Cấp cứu strip

**Files:** Rewrite `src/features/public/home/sections/Services.tsx` + `Services.module.css`; delete `src/features/public/home/serviceFlight.ts` and `sections/Decor.tsx` if nothing else imports them (grep); tests `e2e/public.spec.ts` (replace "services are in the locked order…", "services continue the hero…", "emergency card…", "cards have their own shapes… (R32)"), `e2e/booking.spec.ts` ("a service card preselects" → tab CTA), `e2e/transitions.spec.ts` (delete the file — every test in it covers R30/R31 effects removed by Tasks 3–6), `e2e/giao-dien-cong-khai.spec.ts`.

**Interfaces:**
- Consumes: `Tabs` (`variant="underline"`), `preset('fadeSwap')`, `petPhoto` / `photo('kham')`, `paths.book`.
- Data: `TABS = [{ value: 'kham', label: 'Khám & điều trị', photo: photo('kham','card'), alt: 'Bàn tay nhẹ nhàng vuốt ve một bé mèo mướp', desc: <existing Khám desc>, items: [['Khám tổng quát', …], ['Chẩn đoán & điều trị', …], ['Tư vấn chăm sóc tại nhà', …]] }, { value: 'noi_tru', label: 'Nội trú', photo: petPhoto('cho-poodle-chuong','card'), … }, { value: 'spa', label: 'Spa & grooming', photo: petPhoto('cho-poodle-xe','card'), … }]` — item titles verbatim from spec §3.1.3; each item has one short line (write gentle, factual lines; no claims). Tab panel: `role="tabpanel"`, `aria-labelledby` = tab id (extend `Tabs` with an optional `idPrefix` so tabs get stable ids `${idPrefix}-${value}`; add a unit markup test for the ids). CTA "Gửi yêu cầu đặt lịch →" → `${paths.book}?dich-vu=${value}`. One DemoTag "Nội dung mẫu" for the items, "Ảnh minh họa" on the photo.
- Cấp cứu strip: `<aside aria-labelledby>` with heading "Cấp cứu 24/24", line "Bé gặp tình huống khẩn cấp? Gọi ngay để được hướng dẫn và tiếp nhận.", `ButtonAnchor href="tel:+84973555105"` "Gọi ngay 097 355 51 05"; rose tokens; no booking link.

- [ ] **Step 1 (tests):** `Tabs` markup test: `idPrefix="dv"` → `id="dv-kham"` and `aria-controls="dv-kham-panel"`. e2e: tablist "Dịch vụ" has exactly the three tab names in order; ArrowRight from the first tab selects "Nội trú" and shows "Theo dõi hằng ngày"; the panel's CTA `href` ends with `/dat-lich?dich-vu=noi_tru` and clicking it shows radio "Nội trú" checked (Review Focus 4); Cấp cứu strip has `tel:+84973555105` and no link to `/dat-lich`.
- [ ] **Step 2:** run → FAIL.
- [ ] **Step 3:** implement; delete the old effect code and the tests listed above.
- [ ] **Step 4:** run `npx vitest run src/ui` + new spec + `e2e/public.spec.ts` + `e2e/booking.spec.ts` → PASS.
- [ ] **Step 5:** commit `feat(public): services as tabs with an emergency strip; drop linked effects`.

### Task 5: Đội ngũ, CTA band, flat Tài khoản/Liên hệ, homepage order

**Files:** Create `src/features/public/home/sections/Team.tsx` (+css), `sections/BookCta.tsx` (+css); delete `sections/Booking.tsx`; modify `HomePage.tsx` (order: HeroOrbit, About, Services, Team, BookCta, AccountTeaser, Contact), `AccountTeaser.tsx`, `Contact.tsx`, `Home.module.css` (flat cards: `--surface-card`, `--line-soft`, `--r-card`, `--sh-card`; remove `--tint`/ghost-shadow/`data-card` corner rules), `PublicHeader.tsx` (active-section ids without `dat-lich`), `e2e/public.spec.ts` ("homepage order…" → new order), `e2e/giao-dien-cong-khai.spec.ts`.

**Interfaces:**
- Consumes: `teamPhoto()` (Task 1), `paths.book`.
- Team: `<section id="doi-ngu" aria-labelledby>`; h2 "Đội ngũ"; figure with `img` (`alt="Bác sĩ trưởng Lê Thái Sơn"`, width/height, lazy) + caption block: "Bác sĩ trưởng" (eyebrow), "Lê Thái Sơn" (Lora), "Đồng hành cùng thú cưng mỗi ngày." No "Ảnh minh họa".
- BookCta: h2 "Hẹn gặp tại <em>Lê Sơn</em>", one line "Gửi yêu cầu, Lê Sơn sẽ gọi lại để xác nhận lịch hẹn.", `ButtonLink to={paths.book}` "Gửi yêu cầu đặt lịch".

- [ ] **Step 1 (tests):** e2e: section headings on `/` appear in order Giới thiệu → Dịch vụ → Đội ngũ → Hẹn gặp tại Lê Sơn → Tài khoản khách hàng → Liên hệ; Đội ngũ shows the three texts and the photo has no "Ảnh minh họa" next to it; the R32 card styling is gone — `page.locator('main [data-card]')` count 0 on `/`; `@motion-reduced` sections have computed transform `none`; `@narrow` `fitsDevice`.
- [ ] **Step 2:** run → FAIL.
- [ ] **Step 3:** implement.
- [ ] **Step 4:** run new spec + `e2e/public.spec.ts` + `e2e/a11y.spec.ts -g "public"` → PASS.
- [ ] **Step 5:** commit `feat(public): team section, booking band, flat account/contact; new homepage order`.

### Task 6: Login / sign-up shell + feature flags

**Files:** Modify `src/features/auth/index.tsx` (AuthLayout two columns), replace `PortalPanel.tsx` with `AuthPhoto.tsx` (+ styles in `Auth.module.css`), `LoginPage.tsx` (card per spec §3.3; remember-me row), delete `src/app/morph.ts` and its uses (`PublicHeader.tsx` morph branch → plain navigation; `RootLayout.tsx` `isMorphing` branch); create `src/features/data-ready.ts`; tests `e2e/auth.spec.ts` (adjust only locators that relied on the portal panel), `e2e/giao-dien-cong-khai.spec.ts`.

**Interfaces:**
- Produces: `src/features/data-ready.ts`: `export const DATA_READY = { timeSlot: false, rememberLogin: false } as const;` — the only switch for controls whose data the data branch owes (spec §4).
- AuthPhoto: "← Về trang chủ" stays in `AuthLayout`; photo `petPhoto('cho-pom-trang','card')` in a 24 px-radius frame with a static thin orbit SVG arc behind it; caption "Luôn đồng hành cùng thú cưng của bạn" (Lora italic, `--orange-600`); DemoTag "Ảnh minh họa". Below 960 px: photo hidden (`display:none`), card only.
- Login card: h1 "Đăng nhập"; sub "Đăng nhập để quản lý lịch hẹn và thông tin thú cưng dễ dàng hơn."; tabs unchanged (routes); remember row `Checkbox label="Ghi nhớ đăng nhập"` shown only when `tab === 'customer' && DATA_READY.rememberLogin`, with "Quên mật khẩu?" aligned right on the same row (when the box is hidden the link keeps its row); bottom "Chưa có tài khoản? Đăng ký ngay →" (`paths.signup`). Keep DemoAccountChips, errors, pending state.

- [ ] **Step 1 (tests):** e2e: `/dang-nhap` shows the photo caption text on desktop and not on `@narrow`; "Đăng ký ngay" links to `/dang-ky`; **no** "Ghi nhớ đăng nhập" checkbox on either tab while the flag is off (Review Focus 5); clicking header "Đăng nhập" from `/` navigates without a view transition (no `::view-transition` — assert `document.querySelectorAll('[style*="view-transition-name"]').length === 0` after navigation); login with `lan_nguyen` still reaches `/khach-hang`.
- [ ] **Step 2:** run → FAIL.
- [ ] **Step 3:** implement; remove morph code.
- [ ] **Step 4:** run new spec + `e2e/auth.spec.ts` + `e2e/guards.spec.ts` → PASS.
- [ ] **Step 5:** commit `feat(auth): photo + card login shell; drop the homepage morph`.

### Task 7: Wire the data branch's contracts (only if present)

**Files:** `src/features/data-ready.ts`, `src/features/booking/BookingForm.tsx`, `src/features/auth/LoginPage.tsx`, `src/features/staff/requests/RequestDetail.tsx`, customer bookings row (`src/features/customer/appointments/*`), `e2e/giao-dien-cong-khai.spec.ts`.

- [ ] **Step 1:** `git fetch origin && git show origin/claude/focused-pascal-rfxnnp:src/data/contracts/public.ts | grep preferred_slot` and `…/api.ts | grep remember`. For each contract that is present: merge the integration branch, then do Steps 2–5 for it. For each that is absent: ledger `Ruling: <contract> not delivered yet — control stays hidden (DATA_READY false)` and skip.
- [ ] **Step 2 (tests, time slot):** guest picks "10:00–12:00" on `/dat-lich` and submits; `quanly_ha` opens the request → "Khung giờ mong muốn" shows "10:00–12:00". **(remember):** log in `lan_nguyen` with the box ticked, open a new page in the same context → still in `/khach-hang`; without the box → new page lands on the public site/login.
- [ ] **Step 3:** run → FAIL.
- [ ] **Step 4:** flip the flag, add the `Select` "Khung giờ (tùy chọn)" (options from `TIME_SLOT_LABEL`, first option "Không chọn") into `BookingForm`; pass `remember` to `auth.login`; show the slot in `RequestDetail` ("Thông tin khách đã gửi") and the customer row.
- [ ] **Step 5:** run → PASS; commit `feat: time slot and remember-me wired to the data contracts`.

### Task 8: Decisions, progress, verify, review, merge

**Files:** `docs/thiet-ke/QUYET-DINH.md` (add R34 per spec §6; mark R29–R32 "thay bằng R34 (20/10/2026)"), `PROGRESS.md` (giao-dien section only), `README.md` status line.

- [ ] **Step 1:** write the docs; `npm run shots` and look at `public__trang-chu`, `public__dat-lich`, `auth__dang-nhap` at 1440 and 390 against `docs/tham-khao/mau-giao-dien/01…02`; fix visible gaps.
- [ ] **Step 2:** `npm run verify` → exit 0.
- [ ] **Step 3:** final whole-branch review (fresh reviewer), fix Critical/Important RED→GREEN, re-verify.
- [ ] **Step 4:** merge into `claude/focused-pascal-rfxnnp` (`--no-ff`), verify there, push, republish the Artifact, record the published set (`node scripts/artifact-files.mjs --commit`).
