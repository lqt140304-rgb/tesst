# Proposal: the customer-facing experience (public site, login portal, customer zone)

Lens: customer-facing experience. This is design only, not product code. The prose is in English for the lead. Every user-facing string is in Vietnamese and is meant to be used exactly as written.
Sources: BRIEF.md §2 (binding answers) and §3 (locked decisions), refdocs (`rasoat-tai-khoan-va-form-dat-lich.md` §1, §3.4, §4.2–4.5, §5; `thong-tin-lien-he.md`; hero, header and icon decisions), and the current demo in `/tmp/claude-0/hero/demo/`. The owner's older single-file hero (the upload) contains only the hero and header, with nav "Trang chủ · Dịch vụ · Giới thiệu · Liên hệ". It adds nothing new for this lens.

---

## 0. Key decisions at a glance

| # | Decision | Reason |
|---|---|---|
| 1 | Homepage order: **Hero → Dịch vụ → Gửi yêu cầu đặt lịch → Giới thiệu → Tài khoản khách hàng → Liên hệ → Footer** | Visitors come with a need. Services answer "can they help my pet?", and the form sits right below, so a card's CTA scrolls only a short way. |
| 2 | Header nav: **Trang chủ · Dịch vụ · Giới thiệu · Liên hệ**, with Dịch vụ as an anchor to the homepage section. No "Đặt lịch" item. | Matches the page order and the nav the owner approved before 17/10. Dịch vụ is now a section, not a page. The ban on an "Đặt lịch hẹn" nav item still holds. (Owner confirms, Q1.) |
| 3 | Customers are addressed as **"bạn"**; the hospital speaks as **"Lê Sơn"**; pets are **"bé" + name**. An optional **"Lê Sơn nên gọi bạn là: Anh / Chị / Bạn"** setting is used for greetings only. | "bạn" is warm and works for every age. "quý khách" feels distant, and "anh/chị" with a slash reads clumsily. |
| 4 | Booking form: **date only, no time-slot field**. Preferred time goes in the note. | A slot picker would imply opening hours that are not confirmed. |
| 5 | Every valid submit gets **the same success screen**: "Lê Sơn đã nhận yêu cầu của bạn". Guests never get a request code. | Locked anti-enumeration rule (§4.4). A code would reveal duplicates. |
| 6 | Requests in **Không liên lạc được** get a **"Nhờ Lê Sơn gọi lại"** button that re-submits the identical snapshot. | This applies the locked §4.2b flag ("Khách vừa gửi lại — cần gọi lại") with no retyping and no seventh status. |
| 7 | Customers **cannot cancel or edit requests online**. Changes go through the hotline. | Locked: Đã hủy is recorded by staff. Not offering self-cancel is also simpler (YAGNI). |
| 8 | Before linking, **Nội trú and Hóa đơn stay visible in the nav with a small lock** and a kind explanation. The page never says "chưa xác minh". | Customers learn what is coming without feeling suspected. |
| 9 | **Customer-facing data is separate data.** Diary entries, overall status, invoice lines and notes are authored for customers. Medicines show on invoices only as **"Thuốc và vật tư điều trị"**, with no names. | Locked rule: no drug names, doses, injection times or orders. (Owner confirms the invoice wording, Q3.) |
| 10 | A distinct **login portal shell** at `#/dang-nhap`: a split screen on desktop, a single column on mobile, tabs **Khách hàng / Nhân viên**, and demo quick-fill chips. | Owner: the login is separate from the main site and is one portal with two tabs. |

---

## 1. Principles for this lens

1. **Comfort first.** Each message says what is happening, then what the customer can do. No blame, no alarm colours for money, no jargon.
2. **Honesty guard.** Never state equipment, opening hours of regular services, doctor names or credentials, prices, statistics, testimonials or awards. The only fixed facts are those in `thong-tin-lien-he.md`: name, address, hotline 097 355 51 05, emergency reception 24/24, Google Maps and Facebook links.
3. **Demo labels.** Wherever the demo shows invented or illustrative content, it carries one small, calm label:
   - "Ảnh minh họa" on stock photos (one label per section).
   - "Video minh họa" on the generated videos.
   - "Nội dung mẫu" on the Giới thiệu text and the consent wording.
   - "Dữ liệu mẫu" on mock invoices, pets and diaries.
4. **Motion.** The hero keeps its approved continuous orbit. Everywhere else, motion plays **once**: a reveal on scroll, a stroke drawing in on reveal, a route cross-fade, a status timeline drawing in. Nothing loops, blinks or shakes. With `prefers-reduced-motion`, all of it is instant.
5. **Hash routing.** The static artifact needs hash routes, so homepage anchors are routes too:
   - `#/dich-vu`, `#/dat-lich`, `#/gioi-thieu` and `#/lien-he` render the homepage and smooth-scroll to the section.
   - The hero CTA keeps its label "Gửi yêu cầu đặt lịch →" and now points to `#/dat-lich`.

---

## 2. Route map (customer-facing)

| Route | Screen | Access |
|---|---|---|
| `#/` | Homepage | Everyone |
| `#/dich-vu`, `#/dat-lich`, `#/gioi-thieu`, `#/lien-he` | Homepage, scrolled to the section | Everyone |
| `#/dang-nhap` | Login portal, Khách hàng tab | Logged-out visitors (logged-in users are sent to their own zone) |
| `#/dang-nhap/nhan-vien` | Login portal, Nhân viên tab | Logged-out visitors |
| `#/dang-nhap/quen-mat-khau` | Forgot-password panel | Logged-out visitors |
| `#/dang-ky` | Customer sign-up | Logged-out visitors |
| `#/khach-hang` | Customer zone: Tổng quan | Customers |
| `#/khach-hang/thu-cung`, `…/thu-cung/:id` | Pets list and pet profile | Customers |
| `#/khach-hang/lich-hen`, `…/lich-hen/:id` | Appointments and requests, request detail | Customers |
| `#/khach-hang/dat-lich` | Booking form, logged-in variant, inside the zone | Customers |
| `#/khach-hang/noi-tru`, `…/noi-tru/:stayId` | Inpatient stays, diary and videos | Customers, **linked only** |
| `#/khach-hang/hoa-don`, `…/hoa-don/:id` | Invoices list and invoice detail | Customers, **linked only** |
| `#/khach-hang/tai-khoan` | Account and profile | Customers |

**Guards**
- A logged-out visitor opening `#/khach-hang/*` goes to `#/dang-nhap?tiep=<route>`. A strip above the form says: "Bạn đăng nhập để tiếp tục nhé." After login they return to the original route.
- A staff account opening the customer zone is sent to the staff zone, and the reverse is also true.
- An id that does not belong to the account (another customer's invoice, for example) shows the normal "Không tìm thấy trang này" screen. The page never reveals whether the record exists.

**Document titles** follow "<Tên màn hình> · Lê Sơn", for example "Hóa đơn · Lê Sơn". The homepage title is "Bệnh viện Thú y Lê Sơn".

---

## 3. Public header

Keep the approved header spec (`dac-ta-header-mobile-2026-10-15.md`) exactly: logo sizes, the 44 px targets, the dropdown menu, and the name-shortening rule `shortName()`.

**Logged out**
- Nav: Trang chủ · Dịch vụ · Giới thiệu · Liên hệ. Scroll-spy underlines the section in view.
- On the right, "Đăng nhập" (outline) goes to `#/dang-nhap` and "Đăng ký" (filled) goes to `#/dang-ky`.
- Both stay visible at every width, including 320 px.

**Logged-in customer**
- An account button (avatar + short name) replaces the two buttons.
- The dropdown has a header block with the full name and the masked phone, e.g. "098 ••• ••34", then these items:
  1. "Tổng quan"
  2. "Lịch hẹn của tôi", with a badge such as "1 đang chờ" when relevant
  3. "Thú cưng của tôi"
  4. "Hóa đơn", with a small lock icon if the account is not linked
  5. "Tài khoản"
  6. A divider, then "Đăng xuất"
- No emoji icons. Use the line-icon set from §9.10.

**Logged-in staff viewing the public site**
- The dropdown has two items: "Vào khu nhân viên" and "Đăng xuất".

**Mobile ☰ menu**
- Unchanged from the spec: the four links, then the auth row for guests, or a single "Đăng xuất" for logged-in users.

**Staff entry point**
- Staff reach the portal through a footer link only: "Dành cho nhân viên" → `#/dang-nhap/nhan-vien`. The public header stays customer-focused.

**Logout**
- Logging out returns to `#/` with the toast "Bạn đã đăng xuất. Hẹn gặp lại bạn và bé!"

---

## 4. Homepage, section by section

Background rhythm:
- cream `#FBF7F1` (hero)
- white band (Dịch vụ)
- soft lilac wash (Đặt lịch)
- cream (Giới thiệu)
- white (Tài khoản)
- cream (Liên hệ)
- plum-900 (footer)

Thin orange arcs echoing the orbit act as static section dividers. Each one draws in once when it enters the viewport.

### S1. Hero (keep, approved)

- Copy unchanged:
  - Eyebrow "CHÀO MỪNG ĐẾN VỚI LÊ SƠN"
  - H1 "Không gian lớn / cho những *người bạn nhỏ*"
  - Subtitle "Chăm sóc bằng chuyên môn, đồng hành bằng sự thấu hiểu."
  - CTA "Gửi yêu cầu đặt lịch →", now pointing to `#/dat-lich`
- The orbit simulator, the decorations, and the "Tạm dừng chuyển động" button are ported faithfully.
- If the frames get stock photos, the corner tag "Bản xem thử · ảnh sẽ thay sau" becomes "Ảnh minh họa". That is the only change.

### S2. Dịch vụ (`#dich-vu`)

**Purpose:** in one glance, show the four things Lê Sơn does, and route each one: book, or call for emergencies.

**Layout**
- Centred header: eyebrow, H2 and subtitle.
- Below it, a grid of 4 cards: 4 columns at ≥ 1200 px, 2×2 from 641 to 1199 px, 1 column at ≤ 640 px. No carousel, because a carousel hides content.
- Each card, top to bottom:
  - An arch-topped photo window (r = 120 px top corners, pastel backdrop) using the stock photo.
  - The approved round icon badge (≈ 52 px, 26–28 px plum line icon on the stronger pastel), overlapping the photo's bottom-left edge.
  - Title, a two-line description, and the CTA.
- One caption "Ảnh minh họa" sits bottom-right under the grid, at 12 px in ink-soft.

**Motion (one-shot):**
- Cards rise 16 px and fade in, 80 ms apart.
- Each icon's stroke draws in once.
- On hover (desktop only), the card lifts 4 px and the photo zooms 1.04 over 400 ms.

**Copy**
- Eyebrow: "DỊCH VỤ"
- H2: "Lê Sơn có thể giúp gì cho bé?"
- Subtitle: "Chọn điều bé cần và gửi yêu cầu, nhân viên sẽ gọi lại để hẹn thời gian phù hợp. Nếu bé cần cấp cứu, xin gọi ngay cho Lê Sơn."

| Card (order) | Badge / icon / photo | Description | CTA |
|---|---|---|---|
| **Khám & điều trị** | Peach badge, stethoscope; `service-kham.jpg` | "Khi bé mệt, bỏ ăn hay có biểu hiện lạ, hãy để bác sĩ thăm khám và cùng bạn tìm hướng chăm sóc phù hợp." | "Gửi yêu cầu đặt lịch →" goes to `#/dat-lich`, Khám & điều trị preselected |
| **Cấp cứu 24/24** | Rose badge, heart with pulse line; `service-capcuu.jpg`; chip "Tiếp nhận 24/24" in the top-right of the photo | "Bé gặp tình huống khẩn cấp? Đừng chờ — gọi ngay để được hướng dẫn và tiếp nhận." Small line under it: "Cấp cứu không cần đặt lịch." | **"Gọi 097 355 51 05"** with a phone icon (`tel:+84973555105`). Filled rose-plum. **Never** a booking button. |
| **Nội trú** | Lilac badge, house with paw; `service-noitru.jpg` | "Khi bé cần ở lại để theo dõi và chăm sóc, bạn vẫn xem được nhật ký và video của bé trong tài khoản Lê Sơn." | "Gửi yêu cầu đặt lịch →", Nội trú preselected |
| **Spa & grooming** | Mint badge, scissors; `service-grooming.jpg` | "Tắm, chải lông và cắt tỉa nhẹ nhàng để bé sạch sẽ, thơm tho và dễ chịu hơn." | "Gửi yêu cầu đặt lịch →", Spa & grooming preselected |

**Behaviour:** a card CTA smooth-scrolls to the form and preselects the service. The service field shows a one-time soft highlight (about 600 ms) so the customer sees it was filled in for them.

**Fact guard:** the copy never mentions machines, durations, prices, hours (except the confirmed emergency 24/24) or doctor names. "bác sĩ" is used only generically. The Nội trú card mentions only a feature of this website (the diary and videos).

### S3. Gửi yêu cầu đặt lịch (`#form-dat-lich`, route `#/dat-lich`)

**Purpose:** make the request feel easy, and set honest expectations: this is a request, staff will call, nothing is confirmed yet.

**Layout**
- Desktop is two columns.
  - Left column (5/12): eyebrow, H2, subtitle, a 3-step vertical stepper, the emergency callout, and the static `cat-pose-booking.svg` illustration underneath.
  - Right column (7/12): the form card (white, radius 24, soft plum shadow).
- Mobile stacks them: heading, steps as a compact horizontal row of 3 numbered dots with short labels, the emergency callout, then the form.
- The numbered step dots are joined by a line that draws in once.

**Copy (left column)**
- Eyebrow: "ĐẶT LỊCH"
- H2: "Gửi yêu cầu đặt lịch"
- Subtitle: "Bạn không cần tài khoản. Sau khi nhận yêu cầu, nhân viên Lê Sơn sẽ gọi để cùng bạn chốt thời gian."
- Steps:
  1. **"Bạn gửi yêu cầu"**: "Cho Lê Sơn biết bé cần gì và ngày bạn mong muốn."
  2. **"Lê Sơn gọi lại"**: "Nhân viên gọi vào số bạn để lại để trao đổi và chọn giờ phù hợp."
  3. **"Lịch hẹn được xác nhận"**: "Lịch chỉ được xác nhận sau khi hai bên đã thống nhất qua điện thoại."
- Emergency callout (rose background, heart-pulse icon): "**Bé cần cấp cứu?** Xin đừng gửi form. Gọi ngay **097 355 51 05**, Lê Sơn tiếp nhận cấp cứu 24/24." The number is a `tel:` link.

#### 3a. Form, guest variant

Card title: "Thông tin đặt lịch". Optional fields are marked "(không bắt buộc)". Required fields get no asterisk.

| Group | Field label | Control / placeholder | Helper text |
|---|---|---|---|
| Về bạn | "Họ và tên" | text, "Ví dụ: Nguyễn Thị Lan", `autocomplete=name` | — |
| | "Số điện thoại" | tel, `inputmode=tel`, "Ví dụ: 0912 345 678" | "Lê Sơn sẽ gọi số này để xác nhận lịch." |
| Về bé | "Tên bé" | text, "Ví dụ: Miu" | — |
| | "Bé là" | Segmented control: "Mèo" · "Chó" · "Khác". Choosing "Khác" reveals a text field "Bé là loài gì?" | — |
| Bé cần gì | "Dịch vụ" | 3 radio cards with the service badges: "Khám & điều trị" · "Nội trú" · "Spa & grooming" | Under the group: "Cấp cứu? Gọi ngay 097 355 51 05" (tel link). Cấp cứu is never a form option. |
| | "Ngày bạn mong muốn" | Date picker; minimum today; no maximum | "Giờ cụ thể sẽ được thống nhất khi nhân viên gọi cho bạn." |
| | "Ghi chú thêm (không bắt buộc)" | textarea, 500 characters max with a counter "0/500", placeholder "Ví dụ: bé bỏ ăn từ hôm qua; tôi tiện nghe máy sau 17 giờ." | — |
| Đồng ý | checkbox | "Tôi đồng ý để Lê Sơn dùng thông tin trên để liên hệ và sắp xếp lịch hẹn." (In the demo, a tiny "Nội dung mẫu" tag sits next to it.) | — |

- Submit button: "Gửi yêu cầu". While sending, the button shows an inline spinner and "Đang gửi…" and is disabled. With reduced motion, the text alone is shown.
- Under the button: "Lịch chỉ được xác nhận sau khi nhân viên gọi cho bạn."
- Guest-only line, identical for every guest: "Đã có tài khoản? **Đăng nhập** để điền sẵn thông tin." This goes to `#/dang-nhap?tiep=/dat-lich`.

#### 3b. Form, logged-in variant (also used at `#/khach-hang/dat-lich`)

- A strip at the top of the card: avatar + "Gửi với tài khoản **Nguyễn Thị Lan** · 098 ••• ••34" and a link "Không phải bạn? Đăng xuất".
- Name and phone come from the profile and are shown as **read-only text**, with the helper "Số liên hệ lấy từ tài khoản của bạn." Changing the phone per request is outside v1, per the default proposal in §4.5.
- "Chọn bé" shows the saved pets as chips (species avatar, name, "Mèo"/"Chó"), single-select. The last chip is "+ Bé khác". It reveals "Tên bé" and "Bé là" fields plus the checkbox "Lưu bé vào hồ sơ của tôi", checked by default.
- Dịch vụ, Ngày bạn mong muốn and Ghi chú are the same as for guests.
- There is no consent checkbox, because consent was captured at sign-up.

#### 3c. Validation (inline, shown on blur and on submit)

| Case | Message |
|---|---|
| Name empty | "Bạn cho Lê Sơn biết tên của bạn nhé." |
| Phone empty | "Bạn nhập số điện thoại để nhân viên gọi xác nhận." |
| Phone invalid | "Số điện thoại chưa đúng. Bạn kiểm tra lại giúp nhé (ví dụ: 0912 345 678)." |
| Pet name empty | "Bạn nhập tên bé nhé." |
| Species not chosen | "Bạn chọn bé là mèo, chó hay loài khác." |
| Service not chosen | "Bạn chọn dịch vụ bé cần." |
| Date empty | "Bạn chọn ngày mong muốn." |
| Date in the past | "Ngày này đã qua. Bạn chọn từ hôm nay trở đi nhé." |
| Note too long | "Ghi chú tối đa 500 ký tự." |
| Consent unchecked | "Bạn cần đồng ý để Lê Sơn có thể liên hệ với bạn." |

On submit with errors, a summary box above the form says "Còn 2 mục cần bổ sung", lists links to each field, and focus moves to it.

#### 3d. Success: identical for a new request, a duplicate, and a duplicate that sets the call-back flag

The success state replaces the form card at the same height. A check mark draws in once.

- Title: "**Lê Sơn đã nhận yêu cầu của bạn**"
- Body: "Nhân viên sẽ gọi đến số **0912 345 678** để trao đổi và xác nhận lịch cho bé. Bạn để ý điện thoại giúp Lê Sơn nhé." (The number shown is the one the user typed.)
- Safety line in small text: "Nếu bé có dấu hiệu nặng hơn trong lúc chờ, hãy gọi ngay 097 355 51 05."
- Guest, identical for all guests:
  - "Muốn theo dõi các lần đặt lịch sau ngay trên web? Tạo tài khoản Lê Sơn."
  - Buttons: [Tạo tài khoản] [Gửi thêm yêu cầu khác]
- Logged in:
  - Buttons: [Xem yêu cầu của tôi] [Gửi thêm yêu cầu khác]
  - The request appears in the account. If it was a duplicate, they simply see their existing request. That is their own scope, so nothing leaks.

#### 3e. Failure: save did not succeed

Never show success in this case.

- Title: "Chưa gửi được yêu cầu"
- Body: "Kết nối đang gặp trục trặc nên yêu cầu của bạn chưa được lưu. Bạn thử lại sau ít phút, hoặc gọi 097 355 51 05 để Lê Sơn ghi nhận giúp."
- Buttons: [Thử lại] [Gọi Lê Sơn]
- Everything the user typed is kept.

**Fact guard:** there is no time-slot field and no promise of a callback time. The words "đặt lịch thành công", "đã đặt" and "xác nhận ngay" are never used.

### S4. Giới thiệu (`#gioi-thieu`)

**Purpose:** set a warm, human tone without claims. The owner will supply official text later, so this is sample content.

**Layout**
- Desktop, two columns.
  - Left: `pet-left.png` (cat in a yellow bandana) in a tall arch frame, with a thin orange arc hugging its outer side (the hero motif), a light-purple yarn ball, and the tag "Ảnh minh họa".
  - Right: eyebrow, H2, paragraph, and 3 "pillar" rows. Each row has a small pastel badge with a line icon, a bold title and one line of text.
- Mobile: image on top (max height 320), text below.
- One-shot reveal. The arc draws in once.

**Copy**
- Eyebrow: "VỀ LÊ SƠN"
- H2: "Đón bé bằng sự *dịu dàng*", with "dịu dàng" in Lora italic, orange-text `#C2560C` (large text).
- Paragraph: "Mỗi lần đưa bé đi khám là một lần cả nhà cùng lo. Ở Lê Sơn, chúng tôi bắt đầu bằng việc lắng nghe: bé đang thế nào, bạn đang băn khoăn điều gì. Sau đó mới đến thăm khám, giải thích rõ ràng và cùng bạn chọn cách chăm sóc phù hợp cho bé."
- Pillars:
  1. (speech bubble with a small heart, peach) **"Lắng nghe trước"**: "Hỏi kỹ thói quen và biểu hiện của bé trước khi đưa ra lời khuyên."
  2. (open book, mint) **"Giải thích dễ hiểu"**: "Bạn biết bé đang gặp vấn đề gì và vì sao cần chăm sóc như vậy."
  3. (house with paw, lilac) **"Cập nhật khi bé ở lại"**: "Khi bé nội trú, nhật ký chăm sóc và video của bé được cập nhật trong tài khoản của bạn."
- Demo tag under the paragraph: "Nội dung mẫu · Lê Sơn sẽ cập nhật bài giới thiệu chính thức"

**Fact guard:**
- The section describes attitudes, not facts.
- Pillar 3 describes a feature of this website.
- No year founded, no case counts, no team list, no equipment.
- The Facebook "about" sentence is not used (owner decision).

### S5. Tài khoản khách hàng (`#tai-khoan-khach-hang`, no nav item)

**Purpose:** make sign-up attractive, and be honest that some features appear only after linking.

**Layout**
- Desktop, two columns.
  - Left: eyebrow, H2, subtitle, a 2×2 grid of feature tiles (badge icon, title, one line), the footnote, and two CTAs.
  - Right: a phone-frame mock of the customer zone's Tổng quan, built from the real components and filled with sample data, labelled "Dữ liệu mẫu".
- Mobile: the phone mock is hidden at ≤ 640 px to keep the page short. The tiles become 1 column.

**Copy**
- Eyebrow: "TÀI KHOẢN KHÁCH HÀNG"
- H2: "Mọi thông tin của bé, gọn trong một tài khoản"
- Subtitle: "Tạo tài khoản để lưu hồ sơ của bé, theo dõi yêu cầu đặt lịch và xem lại các cập nhật từ Lê Sơn."
- Tiles:
  - (paw, peach) **"Hồ sơ thú cưng"**: "Lưu thông tin các bé để lần sau đặt lịch nhanh hơn."
  - (calendar with check, mint) **"Lịch hẹn & yêu cầu"**: "Biết yêu cầu của bạn đang ở bước nào."
  - (house with paw, lilac) **"Nhật ký & video nội trú"**: "Xem nhật ký chăm sóc và video khi bé ở lại Lê Sơn."
  - (receipt, rose) **"Hóa đơn"**: "Xem lại các hóa đơn và tình trạng thanh toán."
- Footnote (link icon, ink-soft): "Hóa đơn, nhật ký và video nội trú sẽ hiện sau khi nhân viên liên kết tài khoản với hồ sơ của bạn tại bệnh viện."
- CTAs: [Tạo tài khoản] goes to `#/dang-ky`; [Tôi đã có tài khoản] goes to `#/dang-nhap`.
- Logged-in variant: the CTAs become one button, [Vào khu khách hàng].

**Fact guard:** no "miễn phí" and no claims about how fast linking happens.

### S6. Liên hệ (`#lien-he`)

**Layout**
- Desktop, two columns.
  - Left: 4 stacked info rows. Each has a pastel badge icon, a label, a value and a small action button.
  - Right: a **hand-drawn SVG map card**, not an embedded map. It has abstract streets in plum-muted, the main road labelled "Khuất Duy Tiến", a pin shaped like the logo's house, the caption "Sơ đồ minh họa · không theo tỉ lệ", and a [Mở Google Maps] button.
  - Reasons for the drawing: an iframe embed is unreliable inside the artifact, and a drawn map matches the brand.
- Mobile: the info rows come first, then the map card.

**Copy**
- Eyebrow: "LIÊN HỆ"
- H2: "Ghé thăm Lê Sơn"
- Subtitle: "Bạn nên gọi trước khi đến để được hướng dẫn và sắp xếp thời gian phù hợp."

| Icon | Label | Value | Action |
|---|---|---|---|
| Map pin (peach) | "Địa chỉ" | "101 Khuất Duy Tiến, Nhân Chính, Thanh Xuân, Hà Nội" | [Chỉ đường]: Google Maps link, new tab, `rel="noopener noreferrer"` |
| Phone (mint) | "Đường dây chung" | "097 355 51 05", with the sub-line "Tư vấn, đặt lịch và cấp cứu" | [Gọi ngay] (tel) |
| Heart-pulse (rose) | "Cấp cứu" | "Tiếp nhận 24/24" | [Gọi cấp cứu] (tel, same number) |
| Facebook glyph in line style (lilac) | "Facebook" | "Bệnh viện Thú y Lê Sơn" | [Mở trang Facebook]: new tab |

**Fact guard:**
- **No opening-hours row at all.** No placeholder hours either, because that would look like a fact.
- No email address (none has been confirmed).

### S7. Footer

**Layout**
- Plum-900 background, cream text.
- A thin orange arc and three small light-purple paw prints as static decoration.
- Desktop has 4 columns; mobile stacks them with 24 px gaps.

**Content**
1. Brand column: logo (official PNG, on a cream rounded tile so the logo is not recoloured), "Bệnh Viện Thú Y Lê Sơn", and the line "Không gian lớn cho những người bạn nhỏ."
2. "Liên hệ": the address, "097 355 51 05" (tel link), and "Cấp cứu: tiếp nhận 24/24".
3. "Khám phá": "Dịch vụ" · "Gửi yêu cầu đặt lịch" · "Giới thiệu" · "Liên hệ".
4. "Tài khoản": "Đăng nhập" · "Đăng ký" · "Dành cho nhân viên".

**Bottom bar:**
- "© 2026 Bệnh Viện Thú Y Lê Sơn · Ảnh trên trang là ảnh minh họa."
- In the demo, add a chip: "Bản demo · dữ liệu mẫu".

**Not on the homepage (YAGNI or unconfirmed):** price list, news, search, testimonials, a team or doctors section, a stats band, FAQ, newsletter, chat widget, floating call button.

---

## 5. Login portal (`#/dang-nhap`)

### 5.1 Shell (separate from the public site)

- Minimal top bar: logo, linking to `#/`, on the left, and "← Về trang chủ" on the right. There is no public nav.
- **Desktop (≥ 993 px): split screen.**
  - Left 45%: an illustrated panel with a plum-900 → plum-700 gradient. It carries a static orbit ellipse in thin lines, 3 still photo frames in the hero frame style (pet-center.png, pet-right.png, service-noitru.jpg), the static `cat-silhouette.svg`, and the panel copy.
  - Right 55%: a cream background and the centred card (max 440 px wide).
- **Mobile:**
  - A 112 px plum band at the top holds the logo tile and one line of panel copy.
  - The card overlaps the band by 24 px and spans the full width with 16 px gutters.
- The route enters with a cross-fade and a 12 px rise (280 ms). Changing tab cross-fades the panel copy (200 ms).

**Panel copy**
- Khách hàng tab:
  - Title (Lora): "Rất vui được gặp lại bạn và bé"
  - Bullets with line icons: "Theo dõi yêu cầu và lịch hẹn" · "Xem nhật ký, video khi bé nội trú" · "Xem lại hóa đơn"
- Nhân viên tab:
  - Title: "Khu làm việc của đội ngũ Lê Sơn"
  - Line: "Mỗi người một tài khoản riêng để mọi thao tác được ghi nhận đúng người."

### 5.2 Card and tabs

- H1: "Đăng nhập"
- Tabs (`role=tablist`, arrow-key navigation, each ≥ 44 px tall): **"Khách hàng"** (default) and **"Nhân viên"**. The URL follows the tab: `#/dang-nhap` and `#/dang-nhap/nhan-vien`.

**Khách hàng tab**
- Subtitle: "Chào mừng bạn quay lại với Lê Sơn."
- Field "Số điện thoại hoặc tên đăng nhập":
  - Placeholder "Ví dụ: 0912 345 678 hoặc nguyenlan"
  - `autocomplete=username`, `autocapitalize=none`, `spellcheck=false`
- Field "Mật khẩu":
  - `autocomplete=current-password`
  - A toggle button inside the field, "Hiện" / "Ẩn", with `aria-pressed`
  - A right-aligned link above the field: "Quên mật khẩu?"
- Button: "Đăng nhập". While loading it shows "Đang đăng nhập…".
- Divider, then "Chưa có tài khoản? **Tạo tài khoản**", linking to `#/dang-ky`.
- Comfort note in small text: "Bạn không cần tài khoản để gửi yêu cầu đặt lịch. **Gửi yêu cầu ngay**", linking to `#/dat-lich`.

**Nhân viên tab**
- Subtitle: "Đăng nhập bằng tài khoản được quản lý cấp."
- Fields: "Tên đăng nhập" (placeholder "Tên đăng nhập của bạn") and "Mật khẩu".
- Button: "Đăng nhập".
- Note: "Quên mật khẩu? Bạn liên hệ quản lý để được cấp lại."
- Hint: "Bạn là khách hàng? **Chuyển sang thẻ Khách hàng**."

**Routing on success**
- Correct credentials always route by the account's actual type, **whichever tab was used**, and no error is shown. A wrong tab is never punished.
  - Customers go to `?tiep` if present, otherwise `#/khach-hang`.
  - Staff go to their zone's landing page, which depends on capabilities (staff lens).
- A logged-in user who opens the portal is redirected to their own zone.

### 5.3 Login errors

| Case | Message (shown above the button, `role=alert`) |
|---|---|
| Empty identifier | "Bạn nhập số điện thoại hoặc tên đăng nhập." |
| Empty password | "Bạn nhập mật khẩu." |
| Wrong credentials (generic, never says which field) | "Thông tin đăng nhập chưa đúng. Bạn kiểm tra lại rồi thử lần nữa nhé." |
| Throttled (progressive slow-down, no hard lock) | "Bạn đã thử khá nhiều lần. Để bảo vệ tài khoản, bạn đợi 30 giây rồi thử lại nhé." The button reads "Thử lại sau 30 giây" and counts down. |
| Account locked by staff (shown only after correct credentials) | "Tài khoản này đang tạm khóa. Bạn gọi 097 355 51 05 để được hỗ trợ." |
| Network or mock failure | "Chưa kết nối được. Bạn kiểm tra mạng rồi thử lại nhé." |
| Arrived from a protected link | Info strip, not an error: "Bạn đăng nhập để tiếp tục nhé." |
| Session expired inside a zone | Info strip: "Phiên đăng nhập đã hết. Bạn đăng nhập lại để tiếp tục nhé." |

### 5.4 Demo quick-fill chips

- A dashed-border box below the card, on the cream background:
  - Title: "Dùng thử nhanh"
  - Sub-line: "Chỉ có trong bản demo. Bấm để điền sẵn, rồi bấm Đăng nhập."
- A chip **fills both fields and moves focus to "Đăng nhập". It does not submit**, so the owner sees the real flow.
- Each tab shows only its own chips.

**Khách hàng chips**
- "Chị Lan · đã liên kết hồ sơ". Fills `nguyenlan` / `demo1234`. Pets: Miu (mèo), currently inpatient, and Bông (chó). Has invoices, one of them unpaid.
- "Anh Khoa · tài khoản mới, chưa liên kết". Fills `tranminhkhoa` / `demo1234`. Has one self-added pet, Mochi, and one request in "Không liên lạc được".

**Nhân viên chips** (exact accounts to be aligned with the staff lens): "Quản lý" · "Bác sĩ" · "Nhân viên Spa".

**Reset:** a quiet link at the bottom of the box, "Khôi phục dữ liệu mẫu ban đầu". It asks "Đưa toàn bộ dữ liệu demo về trạng thái ban đầu?" with buttons [Khôi phục] [Thôi].

All chips are behind a `DEMO` flag so the real build drops them.

---

## 6. Customer sign-up (`#/dang-ky`)

Same shell as login, with no tabs.

- H1: "Tạo tài khoản"
- Subtitle: "Chỉ cần vài thông tin cơ bản. Bạn không cần nhập mã xác minh."

**Fields, in this order.** Name comes first so the username can be suggested from it.

| # | Label | Control | Helper |
|---|---|---|---|
| 1 | "Họ và tên" | text, `autocomplete=name`, "Ví dụ: Nguyễn Thị Lan" | "Tên để Lê Sơn xưng hô và nhận ra bạn khi gọi điện." |
| 2 | "Lê Sơn nên gọi bạn là (không bắt buộc)" | 3 small chips: "Anh" · "Chị" · "Bạn" (default Bạn) | — |
| 3 | "Số điện thoại" | tel, `inputmode=tel`, "Ví dụ: 0912 345 678" | "Dùng để đăng nhập và để nhân viên liên hệ với bạn." |
| 4 | "Tên đăng nhập" | text, lowercased automatically as the user types, "Ví dụ: nguyenlan" | "4–30 ký tự: chữ thường không dấu, số, dấu gạch dưới (_) hoặc gạch ngang (-), có ít nhất một chữ cái." A chip below: "Gợi ý: **nguyenthilan**", built from the name without diacritics; tapping it fills the field. Live check: "✓ Tên này dùng được" (teal). |
| 5 | "Mật khẩu" | password with a show/hide toggle, `autocomplete=new-password` | "Ít nhất 8 ký tự. Một cụm từ dễ nhớ với bạn là lựa chọn tốt." |
| 6 | "Nhập lại mật khẩu" | password | — (Kept on purpose: with no OTP and no email reset, a mistyped password at sign-up means a trip to the counter.) |
| 7 | Consent checkbox | "Tôi đồng ý để Lê Sơn lưu và sử dụng thông tin này để liên hệ và chăm sóc bé." Plus a "Nội dung mẫu" tag in the demo. | — |

- Email is **not** asked at sign-up. It is optional and lives in the profile (YAGNI: nothing uses it in v1).
- Button: "Tạo tài khoản". While loading: "Đang tạo tài khoản…".
- Below the button: "Đã có tài khoản? **Đăng nhập**".
- Expectation box under the card (info icon):
  - "Sau khi tạo tài khoản, bạn có thể thêm hồ sơ bé và gửi yêu cầu đặt lịch ngay."
  - "Hóa đơn, nhật ký và video nội trú sẽ hiện khi nhân viên liên kết tài khoản với hồ sơ của bạn tại bệnh viện."

**Errors**

| Case | Message |
|---|---|
| Name empty | "Bạn cho Lê Sơn biết tên của bạn nhé." |
| Phone invalid | "Số điện thoại chưa đúng. Bạn kiểm tra lại giúp nhé (ví dụ: 0912 345 678)." |
| Phone already registered | "Số điện thoại này đã có tài khoản. Nếu là bạn, hãy **đăng nhập**. Nếu bạn chưa từng đăng ký, xin gọi 097 355 51 05 để Lê Sơn hỗ trợ." (Locked: sign-up must say the number is taken. This is an accepted risk.) |
| Username length | "Tên đăng nhập cần từ 4 đến 30 ký tự." |
| Username has diacritics | "Tên đăng nhập không dùng dấu tiếng Việt. Bạn thử: nguyenlan." |
| Username has other invalid characters | "Chỉ dùng chữ thường không dấu, số, dấu _ hoặc -." |
| Username looks like a phone or has no letter | "Tên đăng nhập không được giống số điện thoại. Bạn thêm ít nhất một chữ cái nhé." |
| Username taken | "Tên này đã có người dùng. Bạn thử một tên khác, ví dụ: nguyenlan2." |
| Username reserved (admin, leson, quanly, nhanvien…) | "Tên này không dùng được. Bạn chọn tên khác nhé." |
| Password too short | "Mật khẩu cần ít nhất 8 ký tự." |
| Password too common | "Mật khẩu này quá dễ đoán. Bạn chọn mật khẩu khác nhé." |
| Passwords differ | "Hai mật khẩu chưa khớp nhau." |
| Consent unchecked | "Bạn cần đồng ý để Lê Sơn có thể lưu thông tin của bạn." |

**Success**
1. The user is logged in automatically and lands on `#/khach-hang`.
2. Toast: "Đã tạo tài khoản. Chào mừng bạn đến với Lê Sơn!"
3. The first-run welcome card (§9.2) appears.

---

## 7. Forgot password (`#/dang-nhap/quen-mat-khau`)

This panel replaces the form inside the same card. There is no OTP and no reset email.

**Khách hàng**
- H1: "Quên mật khẩu?"
- Body: "Để giữ an toàn cho hồ sơ của bé, mật khẩu chỉ được đặt lại sau khi nhân viên Lê Sơn xác nhận bạn là chủ tài khoản. Bạn gọi 097 355 51 05 hoặc báo nhân viên khi đến bệnh viện, nhân viên sẽ hướng dẫn bạn từng bước."
- Buttons: [Gọi 097 355 51 05] (filled, tel) and [Quay lại đăng nhập] (text link).
- Small line: "Lê Sơn không bao giờ hỏi mật khẩu của bạn."

**Nhân viên**
- Body: "Bạn liên hệ quản lý để được cấp lại mật khẩu."
- Button: [Quay lại đăng nhập]

The panel never describes what proof is needed. The evidence rule is still to be decided by the manager (refdoc §5.1).

---

## 8. Customer zone: shell and navigation

### 8.1 Shell

**Desktop (≥ 993 px)**
- Left sidebar, 248 px, cream with a hairline divider. Top to bottom:
  - Logo with "Lê Sơn"
  - Nav items (44 px rows, 22 px line icons, label 15 px)
  - A help card: "Cần hỗ trợ?" with "097 355 51 05" (tel) and a small line "Cấp cứu 24/24"
  - "← Trang chủ Lê Sơn"
  - "Đăng xuất"
- Top bar: page title (Lora, 28 px), and an account chip on the right (avatar + short name) that links to Tài khoản.

**Mobile and tablet (≤ 992 px)**
- Top bar: logo, page title and avatar button. The avatar opens a small menu: "Tài khoản" · "Trang chủ Lê Sơn" · "Gọi 097 355 51 05" · "Đăng xuất".
- **Bottom tab bar with 5 items**: Tổng quan · Thú cưng · Lịch hẹn · Nội trú · Hóa đơn.
  - Each item has a 24 px icon and a 12.5 px label (contrast ≥ 4.5:1).
  - Height 60 px plus the safe-area inset. At 320 px each target is 64 px wide.

**Nav labels and icons** (custom line icons, matching the approved style)

| Label | Icon |
|---|---|
| Tổng quan | house-heart |
| Thú cưng | paw |
| Lịch hẹn | calendar-check |
| Nội trú | house-paw (the approved icon) |
| Hóa đơn | receipt |
| Tài khoản | person-circle |

**Indicators**
- The active item has a lilac background, plum text and a 600 weight.
- A **static** orange dot (never pulsing) marks unseen updates: a new diary entry or video on Nội trú, a status change on Lịch hẹn.
- Before linking, Nội trú and Hóa đơn carry a 12 px lock glyph and `aria-label` "Nội trú (mở sau khi liên kết hồ sơ)".

**Other details**
- A demo ribbon sits in the top bar: a small "Dữ liệu mẫu" chip.
- Page changes cross-fade with a 8 px rise (220 ms).

### 8.2 States that apply everywhere

| State | Design |
|---|---|
| Loading | **Static** skeleton blocks in `#F3ECF4`, with no shimmer (no looping decoration). Mock latency is 250–500 ms so the states are visible. |
| Page error | Illustration of a cat on a cushion. "Chưa tải được thông tin" / "Có thể kết nối đang chậm. Bạn thử lại nhé, dữ liệu của bạn vẫn an toàn." [Thử lại] · "Hoặc gọi 097 355 51 05". |
| Not found / not yours | "Không tìm thấy trang này" / "Có thể đường dẫn đã thay đổi." [Về Tổng quan] |
| Save success | Toast, bottom-centre on mobile and bottom-right on desktop, 4 s, `role=status`. Examples: "Đã lưu thay đổi." / "Đã thêm bé Mochi." |
| Save failure | Inline: "Chưa lưu được thay đổi. Bạn thử lại nhé." The user's input is kept. |

---

## 9. Customer zone: screens

Persona data for the demo:
- **Lan**, linked: Nguyễn Thị Lan, prefers "Chị".
- **Khoa**, not linked: Trần Minh Khoa, prefers "Anh".

### 9.1 Tổng quan, linked (`#/khach-hang`)

**Greeting block**
- Line 1 (Lora, 32 px): "**Chào chị Lan**". The greeting depends on the preference: Anh gives "Chào anh Khoa", Chị gives "Chào chị Lan", Bạn gives "Xin chào, Lan". The name used is the last word of the full name.
- Line 2: "Thứ Hai, 19 tháng 10 · Đây là những cập nhật mới nhất về các bé."
- Primary button on the right: [Gửi yêu cầu đặt lịch], linking to `#/khach-hang/dat-lich`.

**Cards in priority order.** A card shows only if it has content; the first card is the one that matters most.

1. **Nội trú, if a pet is currently admitted.** Full width, lilac wash, house-paw badge.
   - "**Bé Miu đang nội trú** · ngày thứ 2"
   - Overall-status chip, e.g. "Ổn định"
   - "Cập nhật mới nhất · Sáng nay: Bé ăn hết nửa phần, uống nước tốt và ngủ khá lâu."
   - Chip "2 video mới"
   - [Xem nhật ký & video]
2. **Lịch hẹn sắp tới.**
   - A date block: big "21" with "Th10" under it
   - "09:00 · thứ Ba, 21/10/2026"
   - "Bé Bông · Spa & grooming"
   - Chip "Đã xác nhận"
   - Small line: "Cần đổi hoặc hủy lịch? Gọi 097 355 51 05."
   - [Xem chi tiết]
3. **Yêu cầu đang xử lý (n).** Up to 3 rows, for example "Khám & điều trị · bé Miu · mong muốn 25/10" with the chip "Chờ xác nhận". Link [Xem tất cả].
4. **Hóa đơn.**
   - If anything is unpaid: "**1 hóa đơn chưa thanh toán** · 1.250.000 ₫" / "Bạn thanh toán tại quầy khi đến Lê Sơn nhé." [Xem hóa đơn]
   - If not: "Bạn không có hóa đơn nào cần thanh toán."
5. **Các bé của bạn.** Avatars, with a final avatar "+ Thêm bé".

**Empty overview** (linked, but nothing has happened yet)
- Illustration: `cat-pose-services.svg`, static.
- "Chưa có gì mới" / "Khi bạn gửi yêu cầu hoặc bé có cập nhật từ Lê Sơn, mọi thứ sẽ hiện ở đây."
- [Gửi yêu cầu đặt lịch]

**Linked celebration** (shown once after staff link the account, dismissible)
- A check mark draws in once.
- "**Đã liên kết hồ sơ**" / "Từ nay bạn xem được hóa đơn, nhật ký nội trú và video của bé ngay tại đây."
- [Đã hiểu]

### 9.2 First-run welcome (new account, shown above Tổng quan until dismissed)

- "**Chào mừng bạn đến với Lê Sơn!**"
- Three checklist rows. Each row ticks itself when the step is done.
  1. "Thêm hồ sơ bé đầu tiên" → [Thêm bé]
  2. "Gửi yêu cầu đặt lịch khi bé cần" → [Gửi yêu cầu]
  3. "Liên kết hồ sơ tại bệnh viện" → "Lần tới khi đến Lê Sơn, bạn báo nhân viên tên đăng nhập của mình."
- Dismiss link: "Ẩn hướng dẫn".

### 9.3 NOT-YET-LINKED state (Khoa)

**What is locked:** Nội trú (diary and videos) and Hóa đơn.

**What still works:**
- Tổng quan
- Thú cưng (add, edit and delete self-added pets)
- Lịch hẹn: requests and their statuses, because requests belong to the account
- Gửi yêu cầu đặt lịch, including "Nhờ Lê Sơn gọi lại"
- Tài khoản

**Tổng quan banner** (first card; calm lilac background; link icon, not a warning icon):
- Title: "**Tài khoản của bạn chưa liên kết với hồ sơ tại Lê Sơn**"
- Body: "Để giữ an toàn cho thông tin của bé, hóa đơn, nhật ký nội trú và video chỉ hiện sau khi nhân viên xác nhận bạn là chủ hồ sơ. Bạn chỉ cần làm việc này một lần."
- "**Cách liên kết:** lần tới khi đến Lê Sơn, bạn báo nhân viên tên đăng nhập bên dưới, nhân viên sẽ xác nhận và liên kết giúp bạn. Nếu bé chưa từng đến Lê Sơn, nhân viên sẽ liên kết giúp bạn trong lần đầu bạn đưa bé đến."
- "Tên đăng nhập của bạn: **tranminhkhoa**" [Sao chép]. After copying, the button reads "Đã sao chép".
- "Trong lúc chờ, bạn vẫn có thể:" followed by three inline links: "Thêm hồ sơ bé" · "Gửi yêu cầu đặt lịch" · "Theo dõi yêu cầu đã gửi"
- Footnote: "Có thắc mắc? Gọi 097 355 51 05."

**Locked pages** (`#/khach-hang/hoa-don` and `#/khach-hang/noi-tru`). These are full pages, not modals. Each uses the pastel badge with a small lock overlay.

Hóa đơn:
- Title: "Hóa đơn sẽ hiện ở đây sau khi liên kết hồ sơ"
- Body: "Lê Sơn chỉ hiển thị hóa đơn khi đã chắc chắn đây là tài khoản của chủ hồ sơ. Lần tới khi đến bệnh viện, bạn báo nhân viên tên đăng nhập **tranminhkhoa** để được liên kết."
- [Về Tổng quan]

Nội trú:
- Title: "Nhật ký và video nội trú sẽ hiện ở đây sau khi liên kết hồ sơ"
- Body: "Hình ảnh và thông tin chăm sóc của bé chỉ được chia sẻ với đúng chủ hồ sơ. Lần tới khi đến bệnh viện, bạn báo nhân viên tên đăng nhập **tranminhkhoa** để được liên kết."

**Wording rules for this state:**
- Never use "chưa xác minh", "chưa xác thực" or "bị hạn chế".
- Never suggest that linking can happen by phone or automatically by phone number. That is locked: a phone call is not strong verification, and there is no automatic match.

### 9.4 Thú cưng (`#/khach-hang/thu-cung`)

**List**
- H1 "Thú cưng của tôi" and the button [Thêm bé].
- Grid of cards: 3 columns on desktop, 1 on mobile. Each card shows:
  - A species avatar: a line-drawn cat, dog or paw on a pastel circle; the colour is fixed per pet.
  - The name.
  - "Mèo · Mèo Anh lông ngắn · khoảng 3 tuổi".
  - The tag "**Hồ sơ tại Lê Sơn**" (teal, small) when the pet is matched to the hospital record.
- Empty state: "Bạn chưa thêm bé nào" / "Thêm hồ sơ để lần sau đặt lịch nhanh hơn." [Thêm bé đầu tiên]

**Add or edit pet.** A side drawer on desktop, a full page on mobile. Title "Thêm bé" or "Sửa thông tin bé Mochi".

| Field | Control / placeholder | Helper |
|---|---|---|
| "Tên bé" | text, "Ví dụ: Mochi" | — |
| "Bé là" | Mèo / Chó / Khác. "Khác" reveals "Bé là loài gì?" | — |
| "Giống (không bắt buộc)" | "Ví dụ: Mèo Anh lông ngắn" | — |
| "Giới tính (không bắt buộc)" | Đực / Cái / Chưa rõ | — |
| "Năm sinh (không bắt buộc)" | "Ví dụ: 2022" | "Không nhớ chính xác? Bạn ghi năm ước chừng cũng được." |
| "Điều Lê Sơn nên biết về bé (không bắt buộc)" | textarea, "Ví dụ: bé nhát người lạ, sợ tiếng máy sấy." | — |

- Buttons: [Lưu hồ sơ bé] [Hủy]
- No photo upload (YAGNI). The species avatar is used instead.

**Pet profile** (`…/thu-cung/:id`)
- Header: avatar, name, subtitle, tag.
- Sections on one page:
  - "Thông tin"
  - "Điều Lê Sơn nên biết" (always editable by the customer)
  - "Lịch hẹn của bé" (list)
  - "Nội trú" and "Hóa đơn" short lists, shown only when linked; otherwise a one-line lock note.
- Pets matched to the hospital record: the basic fields are read-only, with the note "Thông tin này do Lê Sơn cập nhật. Cần chỉnh sửa? Bạn báo nhân viên khi đến hoặc gọi 097 355 51 05."
- Self-added pets: [Sửa thông tin], plus a quiet text button "Xóa hồ sơ bé". It confirms with:
  - Title: "Xóa hồ sơ bé Mochi khỏi tài khoản?"
  - Body: "Các yêu cầu đã gửi vẫn được giữ nguyên."
  - Buttons: [Xóa hồ sơ] [Giữ lại]
- Hospital-matched pets cannot be deleted by the customer.

### 9.5 Lịch hẹn & yêu cầu (`#/khach-hang/lich-hen`)

**List**
- H1 "Lịch hẹn" and the button [Gửi yêu cầu đặt lịch].
- Segmented control with counts: "**Sắp tới** (1)" · "**Đang xử lý** (2)" · "**Đã qua** (5)".
  - Sắp tới: Đã xác nhận with an agreed date that is today or later.
  - Đang xử lý: Chờ xác nhận, Đang liên hệ and Không liên lạc được.
  - Đã qua: Đã xác nhận with a past date (shown with the extra grey label "Ngày hẹn đã qua"), plus Đã hủy and Từ chối.
- Row: a date block (the agreed date if there is one, otherwise the preferred date in outline style with the small label "mong muốn"), "Khám & điều trị · bé Miu", the status chip, and a one-line explanation (table below).

**Empty states**
- Sắp tới: "Chưa có lịch hẹn sắp tới" / "Khi nhân viên xác nhận yêu cầu của bạn, lịch hẹn sẽ hiện ở đây." [Gửi yêu cầu đặt lịch]
- Đang xử lý: "Không có yêu cầu nào đang chờ."
- Đã qua: "Chưa có lịch hẹn nào trước đây."

**Six statuses as the customer sees them.** The chip always uses the **locked label**, so customer and staff use the same words on the phone. The sentence under it carries the comfort.

| Chip (locked label) | Colours (text on bg, ≥ 4.5:1) | Icon | Explanation shown to the customer | Action |
|---|---|---|---|---|
| Chờ xác nhận | `#5A1E5E` on lilac `#F1E6F3` | clock | "Lê Sơn đã nhận yêu cầu. Nhân viên sẽ gọi cho bạn để trao đổi và chốt thời gian." | "Muốn đổi thông tin hoặc hủy? Gọi 097 355 51 05." |
| Đang liên hệ | `#A34803` on peach `#FDEBDD` | phone | "Nhân viên đang liên hệ với bạn. Bạn để ý điện thoại giúp Lê Sơn nhé." | same |
| Đã xác nhận | `#23706E` on teal-light `#E6F3F2` | check | "Lịch hẹn đã được chốt. Hẹn gặp bạn và bé Miu lúc 09:00, thứ Ba 21/10/2026." | [Chỉ đường] · "Cần đổi hoặc hủy lịch? Gọi 097 355 51 05." |
| Không liên lạc được | `#8E2A4F` on rose `#FBE7EE` | phone with slash | "Lê Sơn đã gọi nhưng chưa liên lạc được với bạn. Bạn có thể nhờ Lê Sơn gọi lại, hoặc gọi trực tiếp 097 355 51 05." | **[Nhờ Lê Sơn gọi lại]** · [Gọi Lê Sơn] |
| Đã hủy | `#5E4A62` on grey `#F1EEF0` | x-circle | "Yêu cầu này đã được hủy. Khi cần, bạn có thể gửi yêu cầu mới bất cứ lúc nào." | [Gửi lại yêu cầu tương tự] (opens the form prefilled from the snapshot) |
| Từ chối | `#5E4A62` on grey `#F1EEF0` (never red) | minus-circle | "Rất tiếc, lần này Lê Sơn chưa thể tiếp nhận yêu cầu của bạn. Bạn gọi 097 355 51 05 để được tư vấn thêm nhé." If staff wrote a customer message, it follows: "Lời nhắn từ Lê Sơn: …" | [Gọi Lê Sơn] |

**"Nhờ Lê Sơn gọi lại"** (applies the locked §4.2b rule)
- It re-submits the stored snapshot unchanged within the account scope. No new request is created, the status stays the same, and staff see "Khách vừa gửi lại — cần gọi lại".
- After the click, the button becomes disabled and reads "Đã gửi lời nhắc", with the line "Lê Sơn đã nhận lời nhắc của bạn lúc 10:00. Nhân viên sẽ gọi lại cho bạn."
- It stays like this until the status changes. Repeated clicks are impossible, which matches "one event per cycle".
- The staff-side flag text is **never** shown to the customer.

**Request detail** (`…/lich-hen/:id`)
- Header: "Yêu cầu **YC-1024**", the status chip, and the explanation block from the table.
- **Đã xác nhận only:** a large appointment card:
  - "Lịch hẹn của bé Miu"
  - "**09:00 · thứ Ba, 21/10/2026**"
  - "101 Khuất Duy Tiến, Nhân Chính, Thanh Xuân, Hà Nội"
  - [Chỉ đường]
  - Right under it, separately: "Ngày bạn mong muốn: 20/10/2026". The three time values are locked as distinct.
- **Timeline** (vertical, draws in once):
  - The main track has 3 nodes: "Chờ xác nhận" → "Đang liên hệ" → "Đã xác nhận".
  - Reached nodes are filled plum and show their timestamp, e.g. "19/10 · 08:12". Future nodes are outlined grey.
  - A side outcome (Không liên lạc được, Đã hủy, Từ chối) appears as an extra node in its chip colour, attached after the last reached node.
  - The customer's own reminder appears as a small event: "Bạn đã nhờ Lê Sơn gọi lại · 19/10 · 10:00".
  - The first event is always "Bạn gửi yêu cầu · 18/10 · 21:14".
  - The timeline never shows staff names or internal reasons. The actor is always "Lê Sơn".
- **"Thông tin bạn đã gửi"** (snapshot card, read-only): Họ và tên · Số điện thoại · Bé · Loài · Dịch vụ · Ngày mong muốn · Ghi chú. Footnote: "Đây là thông tin tại thời điểm gửi. Sửa hồ sơ bé sau này không làm thay đổi yêu cầu này."
- There is no customer-side Hủy button (locked: cancellation is recorded by staff).

### 9.6 Nội trú, diary and videos (linked only)

**List** (`#/khach-hang/noi-tru`)
- Current stay first, as a large card like the overview card.
- Past stays below: "Bé Miu · 02/09 – 05/09/2026 · Bé đã về nhà".
- Empty (linked, never admitted): house-paw illustration, "Hiện không có bé nào đang nội trú" / "Khi bé ở lại Lê Sơn, nhật ký chăm sóc và video của bé sẽ hiện ở đây."

**Stay detail** (`…/noi-tru/:stayId`)

Header:
- Avatar.
- "**Bé Miu** · nội trú từ 18/10/2026 · ngày thứ 2"
- Overall-status chip with the line "Cập nhật lúc 08:30 hôm nay".

Overall-status chips (staff pick one, written for customers):

| Chip | Colours | Extra |
|---|---|---|
| "Ổn định" | teal | — |
| "Đang theo dõi" | lilac | — |
| "Lê Sơn muốn trao đổi với bạn" | peach | "Lê Sơn muốn trao đổi thêm với bạn về bé. Bạn gọi 097 355 51 05 khi có thể nhé." [Gọi Lê Sơn] |

- A "**Lời nhắn từ Lê Sơn**" card (optional, staff-written), e.g. "Bé hơi nhát trong ngày đầu nhưng đã quen chỗ. Bạn yên tâm nhé."
- Tabs: "**Nhật ký**" · "**Video (3)**".
- Bottom help line: "Muốn hỏi thêm về bé? Gọi 097 355 51 05."

**Nhật ký tab**
- A day-grouped timeline, newest first. Day headers read "Hôm nay", "Hôm qua", "Thứ Bảy, 18/10".
- Each entry shows:
  - **Part of day only:** "Sáng" / "Chiều" / "Tối". There is no exact clock time, so customers cannot infer treatment times.
  - A category icon and label: "Ăn uống" (bowl), "Nghỉ ngơi" (moon), "Tinh thần" (heart), "Lời nhắn" (speech bubble).
  - The staff text written for customers, e.g. "Sáng nay bé ăn hết nửa phần, uống nước tốt và ngủ khá lâu."
  - Optional inline video thumbnails.
- Entries are attributed only to "Lê Sơn". There is no staff name.
- Empty: "Nhật ký của bé sẽ được cập nhật tại đây."

**Video tab**
- Grid of 16:9 thumbnails: 3 columns on desktop, 2 on tablet, 1 on mobile.
- Each card has a play glyph, "Chiều 19/10", the duration "0:42", a chip "**Không có âm thanh**", and an expiry chip:
  - more than 14 days left: neutral grey, "Còn 45 ngày"
  - 4–14 days: peach, "Còn 10 ngày"
  - 3 days or fewer: rose, "Còn 2 ngày"
- Under the grid: "Video được lưu 60 ngày kể từ ngày đăng, sau đó tự động xóa."
- **Player** (modal on desktop, full screen on mobile):
  - `muted`, `playsinline`, native controls; autoplays muted.
  - Previous / next arrows; Esc closes and returns focus.
  - Title: "Bé Miu · chiều 19/10".
  - Caption: "Video không có âm thanh · Lưu đến hết ngày 18/12/2026 (còn 60 ngày)".
  - Demo tag: "Video minh họa".
- No download button (owner decides, Q2).
- Expired video referenced in the diary: a grey placeholder tile with "Video này đã hết thời gian lưu (60 ngày)."
- Empty: "Video của bé sẽ hiện ở đây khi được đăng."
- The customer sees **only their own pet's videos**. The query is scoped to pet ownership, not filtered in the UI.

### 9.7 Hóa đơn (linked only)

**List** (`#/khach-hang/hoa-don`)
- H1 "Hóa đơn".
- When something is unpaid, a peach summary banner (never red): "Bạn có **1 hóa đơn chưa thanh toán** (1.250.000 ₫). Bạn thanh toán tại quầy khi đến Lê Sơn nhé."
- Filter chips: "Tất cả" · "Chưa thanh toán" · "Đã thanh toán".
- Rows are grouped by month ("Tháng 10/2026"). Each row: "HĐ-2026-0142" · "20/10/2026" · "Bé Miu · Nội trú", the amount on the right in bold, and the status chip.
- Chips:
  - "**Đã thanh toán**": teal, check icon.
  - "**Chưa thanh toán**": peach `#A34803` on `#FDEBDD`, clock icon.
- Empty: "Bạn chưa có hóa đơn nào." / "Hóa đơn sẽ hiện ở đây sau mỗi lần bé sử dụng dịch vụ tại Lê Sơn."

**Detail** (`…/hoa-don/:id`). A paper-style card, max 720 px, white, with a hairline border.

1. Header:
   - Logo, "Bệnh Viện Thú Y Lê Sơn", the address, "097 355 51 05".
   - On the right: "**HÓA ĐƠN**", "Số: HĐ-2026-0142", "Ngày lập: 20/10/2026".
2. "Khách hàng: Nguyễn Thị Lan · 098 ••• ••34" · "Bé: Miu (mèo)".
3. Table: "Nội dung" · "SL" · "Đơn giá" · "Thành tiền". Service lines are named, e.g. "Khám & điều trị", "Nội trú (2 ngày)", "Spa & grooming".
   - **Medicines and supplies appear only as one aggregated line, "Thuốc và vật tư điều trị"**, with SL "—" and its total. The sub-note reads "Nhân viên sẽ giải thích chi tiết khi bạn cần."
4. "Tạm tính", an optional "Giảm giá", then "**Tổng cộng: 1.250.000 ₫**".
5. Status block:
   - Paid: "**Đã thanh toán** · 20/10/2026 · Chuyển khoản" (or "Tiền mặt", "Quét mã QR").
   - Unpaid: "**Chưa thanh toán** · Bạn thanh toán tại quầy khi đến Lê Sơn."
   - The customer zone never shows a QR code or online payment (binding).
6. Footer line: "Cảm ơn bạn đã tin tưởng gửi gắm bé cho Lê Sơn."
7. Demo: a diagonal watermark "Dữ liệu mẫu".

Actions: [In hóa đơn] runs `window.print()` with a print stylesheet (A5 portrait, black on white, logo kept, app chrome hidden). [← Danh sách hóa đơn] goes back.

### 9.8 Tài khoản (`#/khach-hang/tai-khoan`)

Sections are stacked cards.

1. **"Thông tin cá nhân"**
   - "Họ và tên" (editable). Helper when linked: "Đổi tên ở đây không thay đổi hồ sơ tại bệnh viện."
   - "Lê Sơn nên gọi bạn là": Anh / Chị / Bạn.
   - "Email (không bắt buộc)".
   - [Lưu thay đổi] → toast "Đã lưu thay đổi."
2. **"Đăng nhập"**
   - "Số điện thoại: 0912 345 678". Read-only, with the helper "Số điện thoại dùng để đăng nhập. Muốn đổi số? Bạn gọi 097 355 51 05 để Lê Sơn hỗ trợ đổi an toàn." (No OTP, so a self-service change would be unsafe.)
   - "Tên đăng nhập: nguyenlan", with the helper "Tên đăng nhập không thay đổi được."
   - [Đổi mật khẩu] expands three fields: "Mật khẩu hiện tại", "Mật khẩu mới", "Nhập lại mật khẩu mới".
     - Success: toast "Đã đổi mật khẩu."
     - Wrong current password: "Mật khẩu hiện tại chưa đúng."
3. **"Liên kết hồ sơ"**
   - Linked: a teal check and "Đã liên kết với hồ sơ khách hàng tại Lê Sơn từ 15/10/2026."
   - Not linked: the short banner from §9.3 with the username and [Sao chép].
4. [Đăng xuất] as an outline button in danger red `#9C2A2A`.
   - A text line below it: "Muốn xóa tài khoản? Bạn gọi 097 355 51 05 để được hỗ trợ."
   - There is no self-delete in v1. The policy is not approved.

### 9.9 What the customer must NEVER see

This is enforced **by data shape, not by hiding fields**. The customer views read only from customer-facing records, through `customerApi.*` functions in the data layer that never return internal fields.

- Drug names, doses, routes, and injection or administration times.
- Treatment schedules and internal orders (y lệnh).
- Internal clinical notes or test results that staff have not explicitly shared.
- Internal invoice lines (item names, cost prices, stock codes). Only the customer-facing lines are shown.
- Exact clock times on diary entries. Part of day only.
- Staff names and who changed a status. The actor is always "Lê Sơn".
- Internal reasons for cancellation or refusal, unless staff wrote a "Lời nhắn cho khách".
- Staff-side flags such as "Khách vừa gửi lại — cần gọi lại", duplicate-detection results and version numbers.
- Cage or kennel numbers, the cage board, other customers, other pets, and videos of other pets.
- Guest (not-logged-in) requests, even when they carry the same phone number. They are never pulled into the account.
- Anything that reveals whether a phone number has an account, except the locked sign-up "already registered" message.
- Unpublished diary entries or videos, and anything past the 60-day expiry.

### 9.10 Icon list for this lens

All icons share the approved style: thin rounded line icons, uniform stroke, dark plum, on stronger pastel round badges where a badge is used. No fills, sparkles, stars or leaves. Hand-built as SVG and sized at 22, 24 or 26–28 px.

- Navigation: house-heart, paw, calendar-check, house-paw, receipt, person-circle.
- Actions: phone, phone-slash, map pin, directions arrow, print, copy, eye / eye-off, plus, lock, chevron.
- Status: clock, check, x-circle, minus-circle.
- Diary: bowl, moon, heart, speech bubble.
- Media and links: play (rounded rectangle), Facebook glyph in line style, link.
- Species avatars: cat face, dog face, generic paw.

---

## 10. Tone-of-voice guide (Vietnamese copy)

### 10.1 Who speaks to whom

- **Customer: "bạn"** everywhere in generic copy.
  - Greetings use the chosen form: "Chào chị Lan" / "Chào anh Khoa" / "Xin chào, Lan".
  - Never "quý khách" (feels like an advert, and distant). Never "anh/chị" with a slash.
- **Hospital: "Lê Sơn"** as the subject of messages ("Lê Sơn đã nhận…"). Use "chúng tôi" only in longer prose, such as Giới thiệu.
- **Staff: "nhân viên"**, and "bác sĩ" only in a medical context. **Never "lễ tân"**, because the hospital has no dedicated receptionist.
- **Pets: "bé" + name** ("bé Miu"), plural "các bé".
  - Never "con vật", "thú", "bệnh nhân", "ca", or "chủ nuôi" (say "bạn").

### 10.2 Style rules

- Short sentences, one idea each, active voice.
- **Status and wait messages:** what is happening, then what you can do.
- **Error messages, four parts:** (1) what happened, in plain words; (2) whether their data is safe or kept; (3) the next step; (4) the hotline as a fallback.
- "nhé" at most once per message, and never in a serious message (a locked account, a medical prompt).
- "vui lòng" at most once per message. Prefer "Bạn …".
- "!" only in greetings and success messages, at most one.
- No emoji in the product UI.
- Sentence case for headings and buttons ("Gửi yêu cầu đặt lịch", not "Gửi Yêu Cầu Đặt Lịch"). ALL CAPS only for small eyebrow labels.
- Buttons start with a verb: "Gửi yêu cầu", "Thêm bé", "Xem hóa đơn", "Gọi Lê Sơn", "In hóa đơn".
- **Money:** "1.250.000 ₫", with dots as thousands separators and a narrow non-breaking space before ₫. Say "Tổng cộng", "Chưa thanh toán", "Đã thanh toán ngày 20/10/2026 · Tiền mặt". Never use red for unpaid.
- **Dates and times:**
  - 24-hour clock, "09:00, thứ Ba 21/10/2026".
  - "Thứ" is capitalised only at the start of a phrase.
  - Use "Hôm nay", "Hôm qua", "Sáng nay".
  - Greetings use "19 tháng 10".
- **Phone:** always "097 355 51 05", always as a tel link. Masked customer phone: "098 ••• ••34".
- **Waiting:** never promise a time ("trong 15 phút", "ngay lập tức"). Say "Nhân viên sẽ gọi cho bạn…" and "Bạn để ý điện thoại giúp Lê Sơn nhé."

### 10.3 Words to avoid

| Avoid | Use instead | Why |
|---|---|---|
| quý khách | bạn | Warmer, not salesy |
| đặt lịch thành công / đã đặt lịch | Lê Sơn đã nhận yêu cầu | A request is not a confirmed booking (locked) |
| đã khám / hoàn thành (for Đã xác nhận) | lịch hẹn đã được chốt | Locked: Đã xác nhận ≠ visited |
| Lỗi! / Thất bại / Có lỗi xảy ra | Chưa … được (e.g. "Chưa gửi được yêu cầu") | Softer, implies a retry |
| không hợp lệ | chưa đúng | Less judgemental |
| bắt buộc (as a field label) | mark optional fields "(không bắt buộc)" instead | Less pressure |
| chưa xác minh / chưa xác thực / bị hạn chế | chưa liên kết hồ sơ | Customers must not feel suspected |
| nợ / công nợ / quá hạn | chưa thanh toán | Money without shame |
| hệ thống (as the actor) | Lê Sơn | Human voice |
| lễ tân | nhân viên | There is no receptionist |
| con vật / thú / bệnh nhân / ca | bé | Affection |
| OTP / mã xác thực | (not needed; at most "Bạn không cần nhập mã xác minh") | There is no OTP |
| hiện đại nhất / hàng đầu / uy tín số 1 / cam kết / tốt nhất | (do not use) | Unverifiable claims |
| tử vong, nguy kịch, medical jargon | (never in customer UI; staff speak by phone) | Comfort and safety |
| booking, pet, check-in, invoice | đặt lịch, thú cưng, hóa đơn | Vietnamese UI. Exceptions: "Spa & grooming" (locked service name) and "video" |
| Từ chối (in sentences) | chưa thể tiếp nhận | Use "Từ chối" only as the locked chip label |

### 10.4 Microcopy examples

| # | Context | Vietnamese copy |
|---|---|---|
| 1 | Booking success | "Lê Sơn đã nhận yêu cầu của bạn. Nhân viên sẽ gọi đến số 0912 345 678 để trao đổi và xác nhận lịch cho bé." |
| 2 | Booking save failed | "Chưa gửi được yêu cầu. Kết nối đang gặp trục trặc nên yêu cầu của bạn chưa được lưu. Bạn thử lại sau ít phút, hoặc gọi 097 355 51 05 để Lê Sơn ghi nhận giúp." |
| 3 | Emergency nudge | "Bé cần cấp cứu? Xin đừng gửi form. Gọi ngay 097 355 51 05, Lê Sơn tiếp nhận cấp cứu 24/24." |
| 4 | Date helper | "Giờ cụ thể sẽ được thống nhất khi nhân viên gọi cho bạn." |
| 5 | Phone helper | "Lê Sơn sẽ gọi số này để xác nhận lịch." |
| 6 | Status: Đang liên hệ | "Nhân viên đang liên hệ với bạn. Bạn để ý điện thoại giúp Lê Sơn nhé." |
| 7 | Status: Đã xác nhận | "Lịch hẹn đã được chốt. Hẹn gặp bạn và bé Miu lúc 09:00, thứ Ba 21/10/2026." |
| 8 | Status: Không liên lạc được | "Lê Sơn đã gọi nhưng chưa liên lạc được với bạn. Bạn có thể nhờ Lê Sơn gọi lại, hoặc gọi trực tiếp 097 355 51 05." |
| 9 | After "Nhờ Lê Sơn gọi lại" | "Lê Sơn đã nhận lời nhắc của bạn lúc 10:00. Nhân viên sẽ gọi lại cho bạn." |
| 10 | Status: Từ chối | "Rất tiếc, lần này Lê Sơn chưa thể tiếp nhận yêu cầu của bạn. Bạn gọi 097 355 51 05 để được tư vấn thêm nhé." |
| 11 | Not linked (short) | "Tài khoản của bạn chưa liên kết với hồ sơ tại Lê Sơn. Lần tới khi đến bệnh viện, bạn báo nhân viên tên đăng nhập của mình để được liên kết." |
| 12 | Just linked | "Đã liên kết hồ sơ. Từ nay bạn xem được hóa đơn, nhật ký nội trú và video của bé ngay tại đây." |
| 13 | Unpaid invoice | "Bạn có 1 hóa đơn chưa thanh toán (1.250.000 ₫). Bạn thanh toán tại quầy khi đến Lê Sơn nhé." |
| 14 | Paid invoice | "Đã thanh toán · 20/10/2026 · Chuyển khoản" |
| 15 | Medicine line on invoice | "Thuốc và vật tư điều trị — Nhân viên sẽ giải thích chi tiết khi bạn cần." |
| 16 | Video expiry | "Video được lưu 60 ngày, đến hết ngày 18/12/2026 (còn 45 ngày)." |
| 17 | Video, no sound | "Video không có âm thanh." |
| 18 | Expired video | "Video này đã hết thời gian lưu (60 ngày)." |
| 19 | Inpatient overall status: wants a call | "Lê Sơn muốn trao đổi thêm với bạn về bé. Bạn gọi 097 355 51 05 khi có thể." |
| 20 | Login wrong credentials | "Thông tin đăng nhập chưa đúng. Bạn kiểm tra lại rồi thử lần nữa nhé." |
| 21 | Login throttled | "Bạn đã thử khá nhiều lần. Để bảo vệ tài khoản, bạn đợi 30 giây rồi thử lại nhé." |
| 22 | Username looks like a phone | "Tên đăng nhập không được giống số điện thoại. Bạn thêm ít nhất một chữ cái nhé." |
| 23 | Phone already registered | "Số điện thoại này đã có tài khoản. Nếu là bạn, hãy đăng nhập. Nếu bạn chưa từng đăng ký, xin gọi 097 355 51 05 để Lê Sơn hỗ trợ." |
| 24 | Forgot password | "Để giữ an toàn cho hồ sơ của bé, mật khẩu chỉ được đặt lại sau khi nhân viên Lê Sơn xác nhận bạn là chủ tài khoản." |
| 25 | Page load error | "Chưa tải được thông tin. Có thể kết nối đang chậm. Bạn thử lại nhé, dữ liệu của bạn vẫn an toàn." |
| 26 | Delete pet confirm | "Xóa hồ sơ bé Mochi khỏi tài khoản? Các yêu cầu đã gửi vẫn được giữ nguyên." |
| 27 | Empty pets | "Bạn chưa thêm bé nào. Thêm hồ sơ để lần sau đặt lịch nhanh hơn." |
| 28 | Logout toast | "Bạn đã đăng xuất. Hẹn gặp lại bạn và bé!" |
| 29 | Change phone | "Số điện thoại dùng để đăng nhập. Muốn đổi số? Bạn gọi 097 355 51 05 để Lê Sơn hỗ trợ đổi an toàn." |
| 30 | Copied username | "Đã sao chép tên đăng nhập." |

---

## 11. Dependencies on the staff lens (so the customer views have data)

The customer zone reads only these **customer-facing** records. Staff screens must let staff author them separately from internal records.

1. **Account link:** `linkedCustomerId` and `linkedAt`, set only by staff.
2. **Pet match:** a mapping from an account pet to a hospital pet, which drives the "Hồ sơ tại Lê Sơn" tag.
3. **Request:**
   - The status history: append-only entries of status + timestamp. The actor is hidden from the customer.
   - The agreed date and time, stored apart from the preferred date.
   - An optional "Lời nhắn cho khách".
4. **Inpatient stay:**
   - The overall status, one of: Ổn định / Đang theo dõi / Lê Sơn muốn trao đổi với bạn.
   - An optional "Lời nhắn từ Lê Sơn".
   - Customer diary entries: date, part of day, category, text, published flag. These are separate from the internal care log.
   - Videos: pet, posted time, duration, `expiresAt` = posted + 60 days, audio removed.
5. **Invoice:**
   - Customer-facing lines: services named, medicines aggregated as "Thuốc và vật tư điều trị".
   - Status (paid or unpaid), payment date and method.
6. **Demo accounts:** usernames, passwords and display names for the "Quản lý / Bác sĩ / Nhân viên Spa" chips.

---

## 12. Open questions for owner

1. **"Dịch vụ" in the header nav:** add it back as a link that scrolls to the homepage Dịch vụ section? *Default: yes* (Trang chủ · Dịch vụ · Giới thiệu · Liên hệ). The 17/10 removal was about the separate page.
2. **Downloading inpatient videos:** may customers download a video before the 60-day auto-delete? *Default: no, view only*, because of privacy (other pets or staff may appear in a video).
3. **Medicines on customer invoices:** OK to show them as one line, "Thuốc và vật tư điều trị", with no drug names? *Default: yes*, to honour the rule that customers never see drug names. The counter can still explain the details.
4. **Reasons for Đã hủy / Từ chối:** show them to the customer only when staff write a separate "Lời nhắn cho khách"? *Default: yes.* Otherwise only the generic sentence is shown.
