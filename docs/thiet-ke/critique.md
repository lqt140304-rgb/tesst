# Design critique (cross-lens review)

Reviewer agent output, 19/10/2026. Every issue below is resolved in `QUYET-DINH.md` (authoritative).

## Overall

I found all four proposals in /tmp/claude-0/-home-user/ee1c545f-6576-5903-b05e-d62a2d0e8267/scratchpad/design/ (proposal-customer.md, proposal-staff.md, proposal-visual.md, proposal-tech.md), so no lens is missing.

**What holds up well.** All four respect the binding answers and nearly all locked decisions: no online payment by customers, no QR cage scanning, no HR/shift module, the hero keeps its approved looping exception with pause and reduced-motion support, Đăng nhập and Đăng ký stay visible at 320 px, the official logo is never recoloured, and drug data is kept separate.

**Three blockers to fix before synthesis.**
- **Account linking.** Customer uses the username; staff uses a "Mã kết nối hồ sơ".
- **Inpatient customer view.** Customer and staff define different status lists, a stay message versus none, and part-of-day/category versus exact times.
- **Demo seeds.** Personas, usernames, phones, dates, invoices and the unlinked account all differ between lenses, so no single seed drives both zones.

**Major issues.**
- The tech lens's stroke-1.6, no-fill icons would change the owner-approved icon set.
- The visual and tech lenses specify different fonts: variable Lora and weight 600, versus static Lora at 700 only.
- Putting photos in the hero frames means editing the simulator file, which tech's port-fidelity test forbids.
- Procedure lines such as "Tiêm thuốc" and "Truyền dịch" would be itemised on customer invoices, revealing injections.
- The staff "Đã đến" status reverses a locked rule.
- The customer screens lack partial-payment and voided invoice states.
- No lens defines how customers see appointments booked by phone or rescheduled.
- The staff flag text fails contrast at 3.91:1.
- Publishing a private Artifact with the real hospital's branding and a login form may be refused.
- The combined scope is far larger than a UI-approval demo needs.

**Suggested sources of truth:**
- Customer lens: copy, tone and customer screens.
- Staff lens: data model, capabilities and seeds.
- Visual lens: tokens, chips, motion and icons.
- Tech lens: stack, routing, the font packaging fix and the Artifact constraints.

Tier the build into P0 and P1, and present P0 to the owner first. The weekday errors and Vietnamese copy fixes listed in the issues are quick.

## Issues

### C1. [blocker] contradiction-between-proposals

**Where:** proposal-customer.md §9.3 (banner + locked pages), §9.2 step 3, §9.8 card 3, §10.4 #11 vs proposal-staff.md §4.4, §7 last paragraph, §8 web_accounts.link_code

**Problem:** The two lenses describe different linking flows. In the customer lens, the customer tells staff their username ("bạn báo nhân viên tên đăng nhập **tranminhkhoa**" with a [Sao chép] button). In the staff lens, the customer shows a "Mã kết nối hồ sơ" (LS-7K2Q) from their logged-in profile, and the manager finds the account only by that code. No customer screen ever shows the code, so the staff flow cannot be demoed end-to-end.

**Fix:** Use the staff lens's link code. It proves the person controls the logged-in account, which a username does not, because usernames are easy to guess or share. Rewrite the customer banner, both locked pages, the first-run step 3, Tài khoản › Liên kết hồ sơ and microcopy #11 to show "Mã kết nối hồ sơ: LS-7K2Q" with [Sao chép]. Suggested line: "Lần tới khi đến Lê Sơn, bạn mở trang này và đưa mã cho nhân viên để được liên kết." Keep "never by phone, never automatic". Label the method as proposed, because dinh-huong-san-pham.md §6 still lists the strong-verification method as undecided.

### C2. [blocker] contradiction-between-proposals

**Where:** proposal-customer.md §9.6 (overall-status chips, "Lời nhắn từ Lê Sơn" card, diary part-of-day + categories, "Cập nhật lúc 08:30 hôm nay") vs proposal-staff.md §5.2.2, §7 Diary row, §8 diary_entries; proposal-visual.md §2.2 note

**Problem:** The customer-facing inpatient model differs between lenses.
- Customer lens: a stay-level status (Ổn định / Đang theo dõi / Lê Sơn muốn trao đổi với bạn), a stay-level message, and diary entries with part of day (Sáng/Chiều/Tối) and a category (Ăn uống/Nghỉ ngơi/Tinh thần/Lời nhắn), signed "Lê Sơn".
- Staff lens: a per-entry general_status (Ổn định/Đang hồi phục tốt/Cần theo dõi thêm/Sẵn sàng về nhà), no part of day, no category and no stay message, signed "Đội ngũ Lê Sơn", with exact shared_at times.
- The customer header "Cập nhật lúc 08:30" also breaks the customer lens's own rule of showing part of day only.
The customer projection cannot be built from the staff composer as specified.

**Fix:** Adopt one model: diary_entries { part_of_day: sang|chieu|toi, category, text, general_status }.
- Merged status list: Ổn định · Đang hồi phục tốt · Cần theo dõi thêm · Sẵn sàng về nhà · "Lê Sơn muốn trao đổi với bạn" (orange, with a call CTA).
- The staff composer gets Buổi and Loại selects.
- The stay header shows the latest shared status as "Cập nhật sáng nay".
- Drop the separate stay message; use category "Lời nhắn" instead.
- Attribution is "Lê Sơn" everywhere.
- The customer projection never exposes shared_at or recorded_at clock times (videos show "Chiều 19/10").

### C3. [blocker] contradiction-between-proposals

**Where:** proposal-customer.md §5.4 demo chips, §9 personas, §9.1 example cards vs proposal-staff.md §1.3, §11.2–11.8 seeds

**Problem:** The demo personas and seeds disagree, so one seed cannot satisfy both zones:
- Lan's username is `nguyenlan` in one lens and `lan.nguyen` in the other.
- Phones are 098•••34 / 0912 345 678 in one lens and 0900 000 0NN in the other.
- Miu is admitted 18/10, "ngày thứ 2", in one lens, and admitted d−2 (17/10), "Ngày 3", in the other.
- Bông's appointment is at 09:00 on 21/10 in one lens, and YC-0235 is at 15:00 d+2 in the other.
- Lan has a 1.250.000 ₫ unpaid invoice in one lens; in the other she has only a stay draft.
- The unlinked persona is Trần Minh Khoa / `tranminhkhoa` with Mochi in one lens, and Đỗ Minh Khoa / `minhkhoa` / KH-0006 with Gạo in the other. Mochi belongs to Vũ Hoàng Long in the staff seeds.
- Every "Không liên lạc được" seed is guest-scope, so the customer "Nhờ Lê Sơn gọi lại" flow has nothing to show.
- The customer lens shows 3 staff chips; the staff lens has 4 staff accounts.

**Fix:** Make staff §11 the single seed source and rewrite the customer personas and §9 examples from it. Add three seeds:
- one account-scope Không liên lạc được request for the unlinked persona;
- one issued Chưa thanh toán invoice for Lan;
- the unlinked persona's self-added web pet (Gạo), so pet matching can be demoed.
The login chips list the 4 staff accounts and the 2 customer accounts with their real usernames and passwords.

### C4. [major] violates-locked-decision

**Where:** proposal-tech.md §10 ("stroke 1.6, no fills", lucide-react forced to 1.6) vs proposal-visual.md §5.1–5.3; refdocs/chot-icon-services-v1.md

**Problem:** The tech lens redraws every icon at stroke 1.6 with no fills. That changes the owner-approved service icons, which visual recovered byte-for-byte as 24-grid paths at stroke 2 with a filled paw in house-paw, and the approval said "không tăng/đổi độ dày viền" and "nét đồng đều". The two lenses also disagree on Lucide: lucide-react 1.52.0 as components versus lucide-static 1.59.0 as a sprite. Visual checked icon names against 1.59.0, which may not all exist in 1.52.

**Fix:** Tech §10 adopts the visual §5 grammar: stroke 2 with the optical-size table, the 4 approved paths kept byte-for-byte, and only the permitted fills (paw pads, dots). Use one icon source at one pinned Lucide version, and re-check the names against that exact version.

### C5. [major] contradiction-between-proposals

**Where:** proposal-visual.md §0 #11, §2.4, §2.11 vs proposal-tech.md §0 #6, §2, §3, §9.3

**Problem:** Visual specifies @fontsource-variable/lora with the family name "Lora Variable" and uses Lora 600 widely (display-m, title-l, zone page titles, greetings). Tech uses static @fontsource/lora, because the ported hero waits for the family "Lora". The variable package would break that wait. Tech also inlines only Lora 700 and 700 italic, so every 600 heading would render faux or fall back.

**Fix:** Use static @fontsource/lora and set --font-display to "Lora", Georgia, …. Either add Lora 600 and 600 italic (8 faces; raise the tech font budget of ≤ 6 faces / 220 KB) or change visual's 600 usages to 700.

### C6. [major] risk

**Where:** proposal-visual.md §6.3 ("Only the frame inner template: an <img>") vs proposal-tech.md §9.1/§9.3 (vendored-diff test allows only wiring lines); /tmp/claude-0/hero/demo/hero-orbit.js FRAME_HTML ~l.74–82

**Problem:** Frames are generated inside hero-orbit.js, so putting photos in them as visual proposes means editing the simulator file. That conflicts with the locked "port faithfully" rule and would fail the tech lens's vendored-diff test.

**Fix:** If the owner approves photos, inject them without touching the simulator. Either a separate CSS file sets `.ho__frames .frame:nth-of-type(n) .frame__inner{background-image:…}` and hides `.frame__label`, or a post-mount hook in HeroOrbit.tsx appends <img> into the existing `.frame__inner`. Record this in tech §9.1 as a documented non-maths change. Changing the preview tag text to "Ảnh minh họa" is markup only.

### C7. [major] violates-locked-decision

**Where:** proposal-staff.md §11.7 (KB04 Tiêm phòng, KB06 Truyền dịch, KB07 Tiêm thuốc under "Khám & điều trị"), §7 Invoice row, §6.3 "Ghi chú trên hóa đơn"; proposal-customer.md §9.7

**Problem:** Only the Thuốc and Vật tư categories are grouped for customers. Procedure lines such as "Tiêm thuốc (mũi) × 3" and "Truyền dịch (lần)" sit in the exam category, so they would be itemised on customer invoices and the printout, revealing injections and their count. Free-text fields the customer sees (invoice note, rejection message, video caption, discharge message) also have no soft lint; only the diary does.

**Fix:** Add price_items.customer_group so treatment procedures roll into the customer line "Thuốc và vật tư điều trị" (or a separate "Điều trị theo chỉ định" line). Apply the drug/dose lint and the "Xem như khách" preview to every customer-visible free-text field. Extend the tech §8.5 leak test to procedure names. Ask the owner whether vaccination may stay itemised (owner Q4).

### C8. [major] violates-locked-decision

**Where:** proposal-staff.md §4.2 (appointment statuses Đã hẹn/Đã đến/Không đến/Đã hủy), §3 tile "2 khách đã đến", §14 Q1 default yes; refdocs/rasoat-tai-khoan-va-form-dat-lich.md §4.2a

**Problem:** The locked text says: "Không có trạng thái 'đã đến', 'đã khám', 'hoàn thành' … trong bản đầu; không thêm qua quyết định này." The staff lens adds "Đã đến" and "Không đến" on a separate entity and defaults to yes, which brings back the forbidden status.

**Fix:** Until the owner answers, default to no check-in. Appointments carry only Đã hẹn and Đã hủy, and "Tạo hóa đơn" is available on any appointment for today. Keep Đã đến and Không đến behind a flag. Ask the owner, and say explicitly that this changes a locked rule (owner Q3).

### C9. [major] gap

**Where:** proposal-customer.md §9.7; proposal-staff.md §6.1 (customer sees Thanh toán một phần and Đã hủy); proposal-visual.md §2.2 invoice chips

**Problem:** The customer invoice screens define only Đã thanh toán and Chưa thanh toán. The staff lens makes partial and voided invoices visible to customers, so the customer lens has no copy, chip, remaining-amount line or payment list for them. The overview's unpaid count and sum are undefined when an invoice is partially paid.

**Fix:** Add a "Đã thanh toán một phần" chip (honey) with the line "Đã thanh toán 2.000.000 ₫ · còn lại 1.450.000 ₫. Bạn thanh toán phần còn lại tại quầy nhé." Add a voided state: grey "Đã hủy", amount struck through, "Hóa đơn này đã được thay bằng HĐ-…", no reason. Show a "Các lần thanh toán" list with date and method only, no collector. The overview counts remaining amounts. If partial payments are cut (see the over-scope issue), say that customers see only the two binding states.

### C10. [major] gap

**Where:** proposal-customer.md §9.5 vs proposal-staff.md §4.2 (Tạo lịch hẹn via phone or walk-in, Dời lịch, Hủy lịch, Không đến), §4.4 "after linking … all appointments"

**Problem:** The customer Lịch hẹn screen is built entirely on request statuses and snapshots. It never defines how the customer sees:
- an appointment booked by phone, with no request;
- a rescheduled time;
- an appointment cancelled by staff;
- a past appointment.

**Fix:** Rows without a request use the chip "Đã xác nhận" with the line "Đặt qua điện thoại". A reschedule shows the new time plus a timeline event "Lịch hẹn đã được đổi sang 15:00, thứ Tư 21/10". A staff cancel follows the request Đã hủy copy. Past appointments go to "Đã qua" with "Ngày hẹn đã qua", and check-in states are never shown. `customer_appointments_v` excludes the assignee and internal notes.

### C11. [major] feasibility

**Where:** proposal-tech.md §3 last row, §13.3, §16 Q1; BRIEF.md §6 Delivery

**Problem:** The brief assumes a private claude.ai Artifact for owner preview. The page uses the real hospital's name, logo, address and hotline, and has a working login form under that branding. The Artifact publisher can refuse such a page whatever demo labels it carries. Tech's fallback, the single file opened from file://, often does not run on Android phones, where file managers open HTML in a viewer rather than Chrome. The owner reviews on a phone.

**Fix:** Make the deliverable plan independent of a link. The `single` HTML file plus the Playwright contact sheet (1440 and 390 screenshots, sent as files) is the guaranteed review path. Publish only after the owner confirms they act for Lê Sơn and the tool accepts it. Do not promise a URL in the spec, and if publishing is refused, do not propose other hosting.

### C12. [major] over-scope

**Where:** proposal-staff.md §1, §2, §4.1, §5.2.3, §6.1–6.9; proposal-visual.md §4.4–4.7, §6.2–6.5; proposal-tech.md §0 #12, §8.5, §12

**Problem:** The combined scope is far beyond a UI-approval demo and puts the owner-visible flows at schedule risk.
- Staff: 17 capabilities and 4 staff accounts, invoice void, reversal and replacement, partial payments, discount with reason, CSV export, revenue deltas and a reconciliation table, an editable price list, cage transfer, global search and Tạo nhanh, conflict and version UX, call-log outcomes, IndexedDB device upload, keyword lint, and a "việc sắp đến giờ" due/overdue list that edges toward the excluded tasks module.
- Visual: about 20 animated objects, an orbit wipe, parallax and floating decor, photo grade, duotone and grain, and 14 custom icons.
- Tech: 3 build targets, alias tokens, a value-scanning leak test, ESLint boundary rules, css-guard and 5 e2e journeys.

**Fix:** Tier the spec and present P0 to the owner first.
- P0: guest booking → intake → confirm; sign-up → link → unlock; cage board → diary and video share → customer view; invoice → payment → customer view and print; basic revenue; hero, homepage and login polish.
- P1: void and reversal, partial payments, discount, CSV, reconciliation, price-list edit, global search and Tạo nhanh, call-log outcomes, device upload, conflict toasts, orbit wipe, phone mock, parallax and floating decor.
- Present the care-order checklist as a care log, not as tasks with "Quá giờ" alerts on the dashboard.

### C13. [major] a11y

**Where:** proposal-staff.md §4.1 request-card flag banner ("orange #C2560C text on #FDEBDD"), §3 tile subline "in orange"

**Problem:** #C2560C on #FDEBDD measures 3.91:1, below 4.5:1 for this small text. Visual already restricts orange-600 to large text and defines the flag differently.

**Fix:** Use the flag token from visual §2.2: orange-700 #A34803 text on white (paper) with a 3 px orange-500 left bar and the phone-redo icon. Every small orange text uses orange-700.

### C14. [minor] violates-locked-decision

**Where:** proposal-customer.md §0 #2, §3 nav, §12 Q1 (default yes); /tmp/claude-0/hero/demo/index.html l.87–89; refdocs/bo-trang-dich-vu-2026-10-17.md

**Problem:** On 17/10 the owner removed "Dịch vụ" from the desktop and mobile menus, and the current header reads Trang chủ · Giới thiệu · Liên hệ. The customer lens adds it back as a section anchor and defaults to yes.

**Fix:** Default to the locked nav (no Dịch vụ item) until the owner says yes. The section stays reachable by scrolling, from the footer "Khám phá" column and from the hero CTA path (owner Q1).

### C15. [minor] violates-locked-decision

**Where:** proposal-tech.md §6.1 PublicLayout ("mobile drawer per dac-ta-header-mobile"), §9.3 Header ("re-implemented in about 30 lines of React")

**Problem:** The locked header spec replaced the drawer with a floating dropdown box ("Bỏ drawer cũ") and says to copy the sample's CSS and JS. A React rewrite plus CSS-Module hashing can drift from the measured behaviour and break the class names the do-tung-px checks rely on.

**Fix:** Call it the "hộp menu xổ xuống". Turn spec §3 into e2e assertions: aria-controls="mobileMenu", the label swap, Esc returns focus, outside click and link click close, and the closed menu is hidden. Run the per-pixel 320–560 sweep in both guest and logged-in states.

### C16. [minor] gap

**Where:** proposal-customer.md §2/§3 S2 card copy, §1.3 demo labels; refdocs/chot-icon-services-v1.md, thong-tin-benh-vien-le-son.md §3.4

**Problem:** The four service descriptions ("Tắm, chải lông và cắt tỉa nhẹ nhàng…", "để bác sĩ thăm khám…") are presented as official copy with no "Nội dung mẫu" tag. The earlier decisions kept service details as placeholder text until the owner supplies it. The card order (Khám, Cấp cứu, Nội trú, Spa) also differs from the approved icon-set order (Khám, Spa, Nội trú, Cấp cứu).

**Fix:** Add a small "Nội dung mẫu" caption under the Dịch vụ grid, next to "Ảnh minh họa", or get the four lines approved. Use the approved card order unless the owner prefers the new one.

### C17. [minor] contradiction-between-proposals

**Where:** proposal-customer.md §9.5, §9.6, §9.10; proposal-visual.md §2.2, M17; proposal-staff.md §2, §5.2.3; proposal-tech.md §8.6

**Problem:** Chip and feedback details drift between lenses:
- Request status icons: phone / check / phone with slash, and a grey Từ chối (customer) versus phone-outgoing / calendar-check / phone-missed and an outline Từ chối (visual).
- Video expiry: orange at ≤ 7 days (staff) versus orange at 4–14 days and rose at ≤ 3 (customer, visual).
- Audio chip: "Video không có tiếng" (tech) versus "Không có âm thanh".
- Toasts appear at the top on mobile in staff, but bottom-centre in customer and visual.

**Fix:** Declare visual §2.2 and M17 the source of truth for chips, icons, thresholds and toast position. Update the customer §9.5 table and §9.10, staff §2 and §5.2.3, and tech §8.6 to match.

### C18. [minor] copy-quality

**Where:** proposal-staff.md §6.6 print footer, §7 "Request status wording" column

**Problem:** The printed invoice, which goes to the customer, says "Cảm ơn quý khách đã tin tưởng Bệnh viện Thú y Lê Sơn". The customer tone guide bans "quý khách", and the customer invoice footer differs. The staff §7 suggested customer sentences use "Bệnh viện…" and "Vui lòng gọi…" and a bare "Đã hủy". That conflicts with customer §9.5, which speaks as "Lê Sơn" with comfort lines.

**Fix:** Use customer copy for everything the customer sees: the print footer is "Cảm ơn bạn đã tin tưởng gửi gắm bé cho Lê Sơn." and the status sentences come from customer §9.5. Turn the staff §7 wording column into a pointer to customer §9.5.

### C19. [minor] copy-quality

**Where:** proposal-customer.md S6 "Đường dây chung", S3/§10.4 #3 "Xin đừng gửi form", §3c validation table, service names; proposal-staff.md and proposal-visual.md visibility labels

**Problem:** Several customer strings read unnaturally:
- "Đường dây chung" reads like "shared line".
- "Xin đừng gửi form." is cold and uses the English "form".
- Several validation lines read as flat statements: "Bạn chọn dịch vụ bé cần.", "Bạn chọn ngày mong muốn.", "Bạn nhập mật khẩu.", "Bạn chọn bé là mèo, chó hay loài khác."
- Service names drift: "Khám & điều trị" and "Spa & grooming" versus the locked "Khám và điều trị" and "Spa & Grooming".
- Staff visibility labels mix "chủ nuôi" and "khách": "Chủ nuôi sẽ thấy" vs "Khách sẽ thấy", "Xem như chủ nuôi" vs "Xem như khách".

**Fix:** Replacements:
- "Hotline" with the sub-line "Tư vấn, đặt lịch và cấp cứu".
- "Bé cần cấp cứu? Bạn gọi ngay 097 355 51 05 thay vì gửi yêu cầu, Lê Sơn tiếp nhận cấp cứu 24/24."
- "Bạn chọn giúp dịch vụ bé cần nhé.", "Bạn chọn giúp ngày mong muốn nhé.", "Bạn nhập mật khẩu giúp nhé."
- Use the locked service names everywhere.
- Pick one staff term ("Khách sẽ thấy" / "Xem như khách") and use it everywhere.

### C20. [minor] copy-quality

**Where:** proposal-tech.md §8.3 load error, §8.2 conflict copy, §8.7 reset; proposal-customer.md §8.2, §5.4; proposal-staff.md §2; proposal-visual.md §2.10 skip link, §6.6 IL9

**Problem:** Shared system strings are written three different ways:
- Load error: tech's "Bạn thử lại giúp Lê Sơn nhé" asks the customer to do Lê Sơn a favour for Lê Sơn's own failure.
- The conflict toast and the reset-demo confirm differ, with "dữ liệu demo" vs "dữ liệu mẫu" and [Thôi] vs [Để sau].
- The visual skip link "Bỏ qua, đến nội dung chính" replaces the ported "Chuyển đến nội dung chính".
- The demo marking is stacked: a chip on every screen, a top-bar chip, a footer chip, an invoice watermark and the paid stamp.

**Fix:** Keep one Vietnamese string table governed by customer §10 (or the staff glossary for staff-only strings). Keep the ported skip-link text. Always say "dữ liệu mẫu". Use one global "Bản demo · dữ liệu mẫu" chip, and add per-object marks only where the content is invented (photos, videos, prices, invoice paper).

### C21. [minor] copy-quality

**Where:** proposal-customer.md §9.1 ("09:00 · thứ Ba, 21/10/2026"), §9.5 Đã xác nhận row, §10.4 #7; proposal-visual.md §2.4 date example

**Problem:** 21/10/2026 is a Wednesday (thứ Tư). With the demo's "today" of Monday 19/10, the examples print the wrong weekday, and hand-typed weekdays in seeds or copy will spread the error.

**Fix:** Correct the examples to "thứ Tư, 21/10/2026" or "thứ Ba, 20/10/2026", and always format dates with Intl (vi-VN, Asia/Ho_Chi_Minh) and the weekday from the date.

### C22. [minor] contradiction-between-proposals

**Where:** proposal-customer.md §6 username rule ("chữ thường không dấu, số, _ hoặc -") vs proposal-staff.md §11.2 seeds (`lan.nguyen`, `hoang.long`, `ngoc.tran`, `thuy.pham`, `maianh.do`)

**Problem:** The seeded customer usernames contain dots, which the customer lens's own validator rejects. Any shared rules/validation.ts check or seed test will fail.

**Fix:** Either allow "." (update the helper text and the error copy) or rename the seeds, e.g. `lan_nguyen`.

### C23. [minor] gap

**Where:** proposal-customer.md §7 forgot password, §9.8 phone change and account deletion, §5.3 locked account and session expired, throttle; proposal-staff.md §4.4 (link/unlink only); proposal-tech.md §7.1 (no expiry, no throttle)

**Problem:** Customer copy promises staff-assisted actions that no staff screen or data operation supports:
- password reset after verification;
- phone-number change;
- account lock;
- session expiry;
- login throttling.
dinh-huong-san-pham.md §2 lists these sensitive account operations as capabilities. In a fully clickable demo the forgot-password path dead-ends.

**Fix:** Either add manager actions to `#/nv/tai-khoan-web` ("Đặt lại mật khẩu…" showing a one-time temporary password, and "Khóa / Mở khóa tài khoản…", each with a reason and audit entry) and a mock throttle in tech, or drop the locked, expired and throttled states from the customer lens and mark those steps "chưa có trong bản demo".

### C24. [minor] gap

**Where:** proposal-customer.md §9.5 Từ chối "Lời nhắn từ Lê Sơn", §11 #3, §12 Q4 vs proposal-staff.md §4.1 dialogs ("Lý do chỉ nhân viên thấy"), §14 Q4

**Problem:** The customer lens shows a staff-written message when a request is refused or cancelled. The staff dialogs have no field for it, and the two lenses' owner questions have opposite defaults. Locked rasoat §4.2a marks this as [Cần chốt].

**Fix:** Ask one merged owner question (owner Q4). Demo default: no customer message, only the generic sentence. If the owner says yes, add an optional "Lời nhắn cho khách (khách sẽ thấy)" field with the drug lint.

### C25. [minor] risk

**Where:** proposal-staff.md §7 Appointment row, §4.1 linked appointment card; proposal-customer.md §9.9

**Problem:** The staff projection hides "assignee notes" but not the assignee, so "BS. Phạm Thanh Mai" could reach the customer. That contradicts the customer rule of no staff names, and the locked ban on asserting doctor names.

**Fix:** `customer_appointments_v` and every customer DTO exclude assignee, author and collector names. Sample staff names (with the "BS." title) appear only inside the staff zone and the login demo chips, always tagged "Mẫu".

### C26. [minor] feasibility

**Where:** proposal-customer.md §9.7 "[In hóa đơn] runs window.print()", §9.3 [Sao chép]; proposal-tech.md §3, §14 (print preview only for staff)

**Problem:** Tech says print() is inert in the Artifact viewer but re-routes only staff printing, so the customer "In hóa đơn" would silently do nothing. Clipboard writes may also be blocked in the sandbox.

**Fix:** Add `/khach-hang/hoa-don/:id/ban-in` using the same A5 layout and the artifact note, or hide the print button in the artifact build. When the clipboard fails, select the text and show "Bạn bấm giữ để sao chép nhé".

### C27. [minor] contradiction-between-proposals

**Where:** proposal-visual.md §5.6 QA step 5 (`#/demo/bo-icon` from the "Tiêu chí" panel) vs proposal-tech.md §5.2 (`/_bo-icon`, alias `bo-icon`); BRIEF.md §4

**Problem:** The lenses disagree on the icon-sheet route, and nobody decides whether the new build keeps the old "DEMO UI/UX" review chrome (Desktop / Mobile 390 frame, guest/logged-in switch, Tiêu chí panel). Locked QA lines still mention "khung xem thử Mobile 390".

**Fix:** No review chrome in the product build. Put the icon sheet at `#/_bo-icon`, reachable from a small menu on the demo chip. Replace the "khung Mobile 390" checks with the 390 px and 320 px Playwright projects, and say so in the spec.

### C28. [minor] contradiction-between-proposals

**Where:** proposal-visual.md §4.3–4.4 (R1 ≈ 680 ms, R3 ≈ 1.1 s, R5 220 ms / y 8) vs proposal-tech.md §6.2 (zone 320 ms / y 12, "Total navigation stays under 0.5 s", public zone never scales)

**Problem:** The motion budgets and tokens disagree. Visual's orbit wipe scales an ellipse over the public zone, which collides with tech's no-scale rule for the hero unless the ellipse is an overlay.

**Fix:** Visual §4.3 tokens are the source. Tech's 0.5 s cap applies to in-zone navigation, with R1, R3 and R4 listed as named exceptions (≤ 1.1 s, reduced-motion fade). R1 must be a fixed overlay outside the hero container.

### C29. [minor] violates-locked-decision

**Where:** proposal-customer.md S6 map ("a pin shaped like the logo's house"); proposal-staff.md §5.1 ("Video count (camera icon and number)")

**Problem:** A pin modelled on the logo's house is a partial redraw of the logo. A camera glyph on cage tiles suggests surveillance cameras, which is unconfirmed equipment.

**Fix:** Use visual IL11's generic kennel pin and visual's `video` glyph. Never use a camera icon or a logo-derived shape.

### C30. [minor] risk

**Where:** proposal-visual.md §10 upload progress ("Đang bỏ âm thanh…" and toast "Video không có âm thanh…"); proposal-staff.md §5.2.3 (≤ 50 MB); proposal-tech.md §8.6

**Problem:** In the browser, device uploads keep their audio track; they are only forced muted, so the fake "removing audio" step overstates what the demo does. A 50 MB blob in the in-memory fallback is also heavy on phones.

**Fix:** Drop the fake step. For device uploads show "Bản demo: video tải từ máy được phát ở chế độ tắt tiếng; bản chính thức sẽ loại bỏ âm thanh khi tải lên." Cap demo uploads at about 20 MB.

### C31. [minor] risk

**Where:** proposal-tech.md §7.1, §8.2 (session per tab, data per browser); proposal-staff.md §4.1 "Live demo hook"

**Problem:** The binding localStorage choice means a change made in the staff zone on the desktop never appears on the owner's phone. The live sync works only between tabs of the same browser, and the owner may judge the demo broken.

**Fix:** State it in the spec and in the demo-chip menu ("Dữ liệu mẫu lưu riêng trên từng trình duyệt"). Script the review journeys to run in one browser with two tabs, and provide "Khôi phục dữ liệu mẫu" on every device.

### C32. [minor] a11y

**Where:** proposal-customer.md S5 phone-frame mock ("built from the real components"); proposal-staff.md §2 toasts with "Hoàn tác"; proposal-visual.md M17

**Problem:** The mock would expose duplicate links, buttons and headings to keyboard and screen-reader users. Undo toasts that vanish after 5 s violate WCAG 2.2.1 (timing adjustable) for users who need more time.

**Fix:** Render the mock with `inert` and `aria-hidden`, plus a one-line text alternative. Pause toast timers on hover and focus, and keep undo available from the record's "Lịch sử", or extend undo toasts to at least 10 s.

### C33. [minor] gap

**Where:** proposal-staff.md §8 (booking_requests.snapshot has only account_pet_id; web_accounts has no salutation or seen-state); proposal-customer.md §3b, §6 field 2, §8.1 unseen dots

**Problem:** Customer features have no fields in the data model:
- Linked customers can choose hospital pets in the booking form, but the snapshot has no pet_id.
- The "Lê Sơn nên gọi bạn là" preference has no field.
- The static unseen-update dots need per-account seen markers.
Also undefined: what the public booking form does for a logged-in staff user.

**Fix:** Add snapshot.pet_id?, web_accounts.salutation and account_seen {account_id, key, seen_at}. When a staff session opens the public form, show "Bạn đang đăng nhập bằng tài khoản nhân viên. Hãy dùng 'Tạo lịch hẹn' trong khu nhân viên." with the submit button disabled.

## Owner questions raised

- Có thêm lại mục "Dịch vụ" trên menu đầu trang không? Bấm vào sẽ cuộn xuống phần Dịch vụ ngay trên trang chủ, không mở trang riêng (trang riêng đã bỏ từ 17/10). Nếu chưa có câu trả lời, menu giữ như hiện tại: Trang chủ · Giới thiệu · Liên hệ.
- Có đưa ảnh miễn phí bản quyền (ghi nhãn "Ảnh minh họa") vào 9 khung ảnh bay vòng ở Hero, thay cho khung trống "ẢNH ĐANG CHỜ" không? Ngoài Hero, có cho vài họa tiết nhỏ (dấu chân, cuộn len) dịch nhẹ khi cuộn trang không? Họa tiết chỉ dịch khi đang cuộn, dừng khi ngừng cuộn, không tự lặp.
- Lịch hẹn ở khu nhân viên có thêm trạng thái "Đã đến" / "Không đến" (chỉ nhân viên thấy) không? Trạng thái này giúp biết khách nào đang chờ và lập hóa đơn từ lịch. Việc này thay đổi quy định cũ "không có trạng thái đã đến"; sáu trạng thái của yêu cầu đặt lịch vẫn giữ nguyên.
- Trên hóa đơn khách xem: có gộp thuốc, vật tư và các thủ thuật như tiêm, truyền dịch thành một dòng "Thuốc và vật tư điều trị" không? Khám, nội trú, spa vẫn ghi từng dòng; còn tiêm phòng có được ghi riêng không? Khi hủy hoặc từ chối yêu cầu đặt lịch, khách chỉ thấy câu thông báo chung, hay nhân viên được viết thêm lời nhắn riêng cho khách?
- Bản demo dùng tên, logo, địa chỉ và hotline thật của Bệnh viện Thú y Lê Sơn, và có màn đăng nhập. Chủ dự án có xác nhận mình được bệnh viện cho phép làm website này không? Nếu có, muốn xem bản demo qua một đường link riêng tư (không công khai, mỗi màn có nhãn "Bản demo · dữ liệu mẫu"), hay qua một tệp HTML mở trên máy tính kèm bộ ảnh chụp màn hình điện thoại?
