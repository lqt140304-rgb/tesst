# BRIEF — Lê Sơn Veterinary Hospital: full demo web system (design phase)

You are contributing to the DESIGN of a new project. Do not write product code. Your output is design content
that the lead will synthesize into a spec and present (in Vietnamese) to the project owner for approval.

## 1. Owner's request (verbatim, Vietnamese) + translation

> hãy tạo một web thú y với đầy đủ các phần từ. mục tiêu là tạo được ba phần chính web chính giới thiệu, có phần đăng
> nhập riêng từ web chính chia thành web phụ và khu nhân viên và khu khách hàng. khu nhân viên gồm quản lý và nhân viên
> mục đích để quản lý và điều hành bệnh viện, có thể có cả phần thanh toán nữa. phần khách hàng có thể quan sát hóa đơn
> và lịch khám xem video nội trú do bệnh viện tải lên lưu được thông tin khách hàng. web phải làm thật đẹp với nhiều
> hiệu ứng chuyển cảnh và vật thể ngoài ra các icon phải được làm chỉnh chu. tôi có sẵn 1 hero (branch
> codex/hero-chinh-quy-dao) có thể tham khảo phát triển từ đây, tôi muốn nó trông thật đẹp tinh tế và chuyên nghiệp,
> từ ngữ cũng phải được tối ưu cho không gian khách hàng được thoải mái.

Translation: Build a complete veterinary website with three main parts: (1) a main introduction website; (2) a login
that is separate from the main site and splits into sub-sites: a STAFF zone and a CUSTOMER zone. Staff zone = manager
+ staff, to manage and run the hospital, possibly including payments. Customer zone = view invoices, appointment
schedule, watch inpatient videos uploaded by the hospital, store customer info. Must be truly beautiful: many
transition effects and animated objects; icons must be meticulously crafted. Develop from the existing orbit hero.
Look refined, elegant, professional. Wording must be optimized so customers feel comfortable/at ease.

## 2. Owner's answers to clarifying questions (BINDING)

| Question | Answer |
|---|---|
| Level of product | **Full demo with fake data.** Fully clickable: role-based login, appointments, invoices, payments, videos... Data is mock data persisted in the browser (localStorage). Owner approves UI first; a real backend (Next.js + Supabase, by Codex) comes later. |
| Repo | **`lqt140304-rgb/tesst`** (currently EMPTY, branch `claude/focused-pascal-rfxnnp`). Copy needed assets from `web-b-nh-vi-n`. |
| Services section on homepage? | **Yes, one section on the homepage** (NOT a separate services page — a separate page was removed by owner on 17/10). |
| Payments | **Collected at the counter; customer views invoices.** Staff create invoices and record payments (cash, bank transfer, bank QR). Customer sees invoices + paid/unpaid status. No online payment by customer. |
| Staff modules | **(a) Appointments & customers** (booking-request intake, confirm, day/week schedule, customer + pet records); **(b) Inpatient & video** (cage board, care log, upload videos for customers — muted by default, auto-delete after 60 days; internal drug/order info separated from what customers see); **(c) Invoices & payments** (create invoice from services/medicine, record payment, print; manager sees revenue report). NOT selected: tasks/shift scheduling/HR module — do not design it (YAGNI). |
| Login | **One login portal, two tabs** ("Khách hàng" / "Nhân viên"), separate from the main intro site. After login the system routes to the right zone; manager and staff see different capabilities. |
| Photos / video | **Free-license stock photos/videos** (owner chose). CONSTRAINT: this build environment cannot download from Unsplash/Pexels/Wikimedia (proxy blocks). Available: 7 free stock photos already in the repo (see §5) + we can generate demo videos locally with ffmpeg (e.g. slow Ken-Burns pans over photos, muted) + hand-drawn SVG illustrations. Label "ảnh minh họa". Owner can send real photos later. |
| Customer sign-up | **Self sign-up (phone + password, no OTP); staff link the web account to the hospital customer record.** Before linking, the customer can add pets and send booking requests, but invoices / inpatient / videos only appear after staff verify and link the account. |

## 3. Existing locked decisions from project docs (respect unless the new answers above override)

Reference docs (read as needed): `/tmp/claude-0/-home-user/ee1c545f-6576-5903-b05e-d62a2d0e8267/scratchpad/design/refdocs/`
- `dinh-huong-san-pham.md` (product direction — customer vs staff visibility, inpatient video rules, capability-based permissions)
- `rasoat-tai-khoan-va-form-dat-lich.md` (accounts + booking form; 92 KB, grep it)
- `thong-tin-lien-he.md`, `thong-tin-benh-vien-le-son.md` (official contact info)
- hero decisions: `thiet-ke-hero-chot-2026-10-15.md`, `yeu-cau-hero-chinh-khung-anh-bay-vong-2026-10-15.md`, `yeu-cau-chinh-hero-chu-du-an-2026-10-15.md`
- icon decision: `chot-icon-services-v1.md`; header mobile spec: `dac-ta-header-mobile-2026-10-15.md`

Key locked facts:
- Hospital: **Bệnh Viện Thú Y Lê Sơn**, 101 Khuất Duy Tiến, Nhân Chính, Thanh Xuân, Hà Nội. Hotline **097 355 51 05**
  (`tel:+84973555105`) — general line: advice, booking AND emergency. **Emergency reception 24/24** ("24/24" ONLY for
  emergency). Google Maps https://maps.app.goo.gl/xFbQ4BjKtGVa3rp86 ; Facebook https://www.facebook.com/benhvienthuyleson
- **Do NOT assert unconfirmed facts**: equipment (X-ray, ultrasound, lab machines, surgery rooms, stainless cages,
  cameras), opening hours of regular services, doctor names/credentials, prices, statistics. Use soft, non-factual copy
  or clearly-labelled sample content ("nội dung mẫu") inside the demo.
- Staff structure: **no dedicated receptionist**. Manager also does intake + operations. Doctors also examine/treat/
  care. Spa staff do assigned tasks. Permissions are **capability-based** (one person can hold many capabilities;
  roles = preset capability bundles). One personal account per person.
- Booking = a REQUEST; staff call to confirm. Guests and logged-in customers can both submit. No OTP.
  **Six request statuses (locked):** Chờ xác nhận, Đang liên hệ, Đã xác nhận, Không liên lạc được, Đã hủy, Từ chối.
  Main flow: Chờ xác nhận → Đang liên hệ → Đã xác nhận. "Đã xác nhận" = schedule agreed, NOT "visited/examined".
  If a request is "Không liên lạc được" and the customer re-submits identical info → no new request; show flag
  "Khách vừa gửi lại — cần gọi lại" with timestamp; starting contact moves it to Đang liên hệ and clears the flag.
  Duplicate prevention by full-snapshot match (not by phone alone). Request keeps a snapshot of info at submit time.
- Account: sign-up requires username, phone, password; profile has customer name. Login with phone OR username +
  password. Username must not look like a phone number. Email optional.
- Customer must NOT see: drug names injected, dosages, injection times, internal orders (y lệnh). Customers see shared
  health reports (only those staff chose to share), appointments, inpatient diary, general care status, videos.
  Design internal record vs customer-facing presentation as SEPARATE data (not hidden fields).
- Inpatient video: **audio removed by default; auto-delete after 60 days**; customer sees only videos of their own pet.
- **No QR cage scanning feature.**
- Web account ≠ hospital customer record; linking only by staff after verification, never automatic by phone.
- Hero (owner-approved, keep): orbit hero — headline "Không gian lớn / cho những người bạn nhỏ" ("người bạn nhỏ" in
  dark orange #C2560C), eyebrow "CHÀO MỪNG ĐẾN VỚI LÊ SƠN", sub "Chăm sóc bằng chuyên môn, đồng hành bằng sự thấu hiểu.",
  CTA "Gửi yêu cầu đặt lịch →". Photo frames fly out from behind the text then orbit continuously in the outer zone;
  continuous motion is an approved EXCEPTION for the hero only, with a "Tạm dừng chuyển động" button (aria-pressed)
  and prefers-reduced-motion support. Elsewhere, owner earlier asked to avoid looping/blinking/shaking decoration.
  Frames may pass behind text; text and buttons always readable on top. Header must show BOTH "Đăng nhập" and
  "Đăng ký" at every width incl. 320px, tap targets ≥ 44px. Orange arcs hug the outer side of side frames; light-purple
  yarn ball + thread on the left; three small light-purple paw prints on the right; small ball bottom-left.
- Approved icon style (services): **thin rounded line icons, dark plum stroke, on stronger pastel round badges**
  (stethoscope on peach; scissors on mint; house with paw on lilac; heart with pulse line on rose). Badge ≈52px,
  icon 26–28px, uniform stroke, no solid fills, no sparkles/leaves/stars, no looping shake/blink.
- Brand palette (from hero CSS): cream #FBF7F1, plum-900 #421247, plum-700 #5A1E5E, plum-500 #824787, plum-muted #76457A,
  orange-500 #EA7A24 (decor only), orange-400 #FC9238, orange-text #C2560C (large text), ink #3F3342, ink-soft #5E4A62.
  Identity: purple/plum, cream, orange, teal/turquoise accent. Fonts: **Be Vietnam Pro** (UI) + **Lora** (serif display,
  italic for accents). Contrast: text ≥ 4.5:1, large ≥ 3:1. Visible focus rings.
- Logo: official raster logo `logo-le-son.png` (cat in a house, orange roof, "Lê Sơn" script). Do not redraw the logo.
- Feature deferred: animated cat changing 3 poses between pages — postponed; static cat SVGs may be used.

## 4. The existing hero code (reference implementation to port, NOT rewrite)

Extracted at `/tmp/claude-0/hero/demo/` (index.html, styles.css 2460 lines, app.js, hero-orbit.css, hero-orbit.js ~700
lines orbit simulator, header-mobile.css/js) and served live at http://127.0.0.1:3030/ (may need restart:
`cd /tmp/claude-0/hero && node server.js &`). The owner's older single-file version:
`/root/.claude/uploads/ee1c545f-6576-5903-b05e-d62a2d0e8267/a314d868-hero-quy-dao-1-file.html` (380 KB, inline
base64 assets). Screenshots: `/tmp/claude-0/hero-1440.png`, `/tmp/claude-0/hero-390.png`, `/tmp/claude-0/upload-1440.png`.
Note: the demo index.html contains a "DEMO UI/UX" toolbar (Desktop/Mobile/Fullscreen toggles, guest/logged-in
switch, "Tiêu chí" criteria panel) wrapping the page — that is review chrome, not product.
Locked rule from owner: port the orbit simulator code faithfully (keep numbers/logic), don't re-derive it.

## 5. Assets available (in `/tmp/claude-0/hero/demo/assets/`)

logo-le-son.png, logo-le-son-original.png; photos (free stock, Unsplash-style): service-kham.jpg (woman petting tabby
cat, 1000x667), service-grooming.jpg (person with golden retriever, 1000x667), service-noitru.jpg (ginger cat sleeping
in blankets, 1000x1333), service-capcuu.jpg (golden puppy holding a flower, 1000x1603), pet-center.png (same puppy,
960x845), pet-left.png (happy tabby-white cat with yellow bandana, 700x840), pet-right.png (tabby cat on blue sky);
SVGs: cat-dancing-monoline-*.svg, cat-pose-booking.svg, cat-pose-services.svg, cat-silhouette.svg, sketch-cartoon-cat.svg.

## 6. Build environment facts

- Node 22, npm registry reachable (can install vite, react, framer-motion/motion, @fontsource/* fonts, lucide, etc).
- BLOCKED: images.unsplash.com, pexels, wikimedia, cdn.jsdelivr.net, cdnjs (from this container). fonts.googleapis.com
  CSS reachable but fonts.gstatic files unverified → prefer self-hosting fonts via @fontsource npm packages.
- Playwright + Chromium available for screenshots/tests; system ffmpeg 6.1 with libx264/libvpx (can make mp4/webm
  demo clips from photos); Python 3 + PIL.
- Delivery: source code pushed to repo `tesst`; a static build will be published as a private claude.ai Artifact page
  for the owner to preview (multi-file static site; client-side routing must work without server rewrites → hash
  routing or equivalent; all images/videos/fonts bundled locally; external scripts not allowed except a few CDNs).
- Owner reviews on desktop and phone (Chrome first). Vietnamese UI only.

## 7. Team context
Owner is non-technical-ish, detail-oriented, approves UI. Codex (another AI) does QA and later the real backend
implementation (Next.js + Supabase on Vercel). So the demo's code should make a later swap from mock data to a real
backend easy (e.g. a data-access layer with async functions).
