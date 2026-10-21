# Phần 3 — Khu khách hàng (thiết kế)

Ngày: 21/10/2026 · Chủ dự án duyệt Đoạn A và Đoạn B trong hội thoại; duyệt bản viết 21/10/2026. Thuộc `2026-10-20-lam-lai-giao-dien-design.md` §4 mục 3.

## 1. Mục tiêu

Làm lại toàn bộ khu khách hàng (`#/khach-hang/…`) theo bảng mẫu `docs/tham-khao/mau-giao-dien/03-khach-tong-quan-noi-tru.webp` (Tổng quan, Nội trú) và `05-thu-cung-ho-so-be.webp` (Thú cưng, Hồ sơ bé). Lịch hẹn và Hóa đơn của khách chưa có tệp mẫu: làm theo mô tả đã duyệt (§3.5, §3.7) và phong cách của 03/05. Thêm chức năng mới: **yêu cầu đổi lịch**, **chuông cập nhật**, **tình trạng chung của bé**, **chọn ngày** ở nội trú.

**Thành công khi:** mỗi màn của 03/05 có màn tương ứng, giống bố cục và phong cách mẫu; chức năng cũ của khu khách vẫn chạy (bộ kiểm thử hiện có xanh); các quy tắc bảo vệ khách (R7, R8, R20, QUYET-DINH §3.1 của thiết kế làm lại) đúng trên mọi màn mới, kể cả chuông.

**Chủ dự án quyết định (21/10/2026):**
- Đổi lịch: khách gửi yêu cầu, Lê Sơn gọi lại để chốt; lịch cũ giữ đến khi nhân viên đổi.
- "Tình trạng chung của bé": lấy từ nhật ký nội trú đã chia sẻ gần nhất của từng mục + cân nặng trong hồ sơ; chưa có thì không hiện khối.
- Chuông: các cập nhật mới chưa xem; mở chuông = đã xem.
- Ảnh thú cưng: chưa cho khách tải ảnh; bé có khóa ảnh thì hiện ảnh, không có thì biểu tượng loài.

## 2. Ngoài phạm vi

- Khách tải ảnh bé; xem/sửa ngày sinh đầy đủ (dữ liệu chỉ có năm sinh).
- Màn nhân viên cho yêu cầu đổi lịch ngoài mức tối thiểu ở §4 mục 3 (làm đẹp ở phần 4).
- Thanh toán trực tuyến, tải PDF thật (dùng bản in của trình duyệt).

## 3. Màn hình

### 3.1 Khung khu khách (mọi trang)

- **≥ 993 px:** thanh ngang trên cùng: logo · Tổng quan · Thú cưng · Lịch hẹn · Nội trú · Hóa đơn (mục đang mở có gạch chân, trượt 180 ms) · chuông · ảnh đại diện (chữ cái đầu) + tên → menu "Tài khoản", "Đăng xuất". Bỏ thanh bên hiện tại.
- **< 993 px:** thanh trên: logo · chuông · ảnh đại diện; thanh dưới 5 mục như hiện nay.
- Nội trú, Hóa đơn: giữ khóa khi tài khoản chưa liên kết (`locked`, nhãn "mở sau khi liên kết hồ sơ").
- **Chuông** (`aria-label` "Cập nhật mới", kèm số chưa xem cho trình đọc màn hình): có chấm cam khi có mục chưa xem. Bấm mở bảng nổi (Esc / bấm ngoài để đóng, trả tiêu điểm về nút) liệt kê tối đa 10 cập nhật mới nhất trong 30 ngày: biểu tượng · một dòng · ngày và buổi (ví dụ "Hôm nay · Sáng", "18/10"). Không bao giờ có giờ, tên thuốc, tên nhân viên. Mỗi mục là liên kết đến trang tương ứng. Mở bảng = đánh dấu tất cả đã xem (`updates.markAllSeen`). Không có cập nhật: "Chưa có cập nhật mới."

Ví dụ dòng: "Bé Miu có nhật ký mới" · "Bé Miu có video mới" · "Yêu cầu YC-0241: Đã xác nhận" · "Hóa đơn HD-1031 mới".

### 3.2 Tổng quan `#/khach-hang`

- **Dải chào** (nền kem, vòng quỹ đạo mảnh như mẫu): "Chào chị Lan." (giữ xưng hô `salutation`; "bạn" → "Chào bạn, Lan.") + dòng "Cảm ơn bạn đã tin tưởng Lê Sơn đồng hành cùng các bé." + ảnh chó và mèo, nhãn "Ảnh minh họa".
- Lưới 2 cột (≥ 960 px), 1 cột trên điện thoại:
  1. **"Bé Miu hôm nay"** — chỉ khi có bé đang nội trú, mỗi bé một thẻ: ảnh, nhãn tình trạng chung, lời nhắn mới nhất (`latestText`), liên kết "Xem nhật ký →" (trang Nội trú của bé).
  2. **"Lịch hẹn sắp tới"** — lịch gần nhất: ảnh bé, tên bé, dịch vụ, ngày giờ, nhãn "Đã hẹn"; không có lịch nhưng có yêu cầu đang xử lý: hiện yêu cầu, nhãn trạng thái yêu cầu ("Chờ xác nhận"…); không có gì: "Chưa có lịch hẹn nào." Nút "Đặt lịch mới". Liên kết "Xem tất cả →".
  3. **"Thú cưng của bạn"** — tối đa 3 bé (ảnh, tên, loài · tuổi, nhãn "Đang nội trú" nếu có) + ô viền nét đứt "+ Thêm thú cưng". Liên kết "Quản lý thú cưng →".
  4. **"Hóa đơn gần đây"** — 3 hóa đơn mới nhất (mã, dịch vụ · bé, ngày, số tiền) + ô "Thanh toán tại quầy". Chưa liên kết: thay bằng lời nhắc liên kết kèm mã liên kết. Liên kết "Xem tất cả →".
- Thẻ một lần ("welcome", "linked") giữ như hiện nay, đặt trên lưới.

### 3.3 Thú cưng `#/khach-hang/thu-cung`

- Đường dẫn nhỏ "Trang chủ › Thú cưng". Tiêu đề "Thú cưng của bạn", dòng phụ, nút "+ Thêm thú cưng" (mở biểu mẫu thêm bé hiện có).
- Ô tìm "Tìm theo tên, loài hoặc giống…" — lọc ngay trên máy, không phân biệt dấu/hoa thường.
- Mỗi bé một thẻ ngang: ảnh 104 px · tên (Lora) · "giống • tuổi" · hàng nhãn nhỏ có biểu tượng (loài, giống, tuổi, giới tính) · nút "Xem hồ sơ".
- Cuối danh sách: ô viền nét đứt có hình nhà + bàn chân, "Thêm bé mới để quản lý thông tin và đặt lịch thuận tiện." + nút "+ Thêm thú cưng".
- Tìm không thấy: "Không có bé nào khớp với “…”." + nút "Xóa tìm kiếm".

### 3.4 Hồ sơ bé `#/khach-hang/thu-cung/:id`

- Đường dẫn nhỏ "Trang chủ › Thú cưng › Hồ sơ của Miu". Tiêu đề "Hồ sơ của Miu", dòng phụ.
- Nút: **"Đặt lịch cho Miu"** (→ `#/khach-hang/dat-lich` chọn sẵn bé); **"Chỉnh sửa"** chỉ với bé khách tự thêm (`source: 'web'`, mở biểu mẫu sửa hiện có). Bé từ bệnh viện: dòng "Thông tin do Lê Sơn cập nhật. Cần sửa, gọi 097 355 51 05." (liên kết `tel:`).
- **Thẻ thông tin:** ảnh lớn · Tên · Loài · Giống · Giới tính · Năm sinh "2021 (3 tuổi)" · Cân nặng "4,2 kg". Trường trống → "—" (Cân nặng trống → không hiện dòng). Bé web có "Điều Lê Sơn nên biết" → thêm dòng.
- **"Lịch hẹn đã qua"** — bảng Ngày · Dịch vụ · Trạng thái ("Đã qua" / "Đã hủy"; không "Hoàn thành"), tối đa 5 dòng mới nhất; liên kết "Xem tất cả" → Lịch hẹn tab Lịch sử. Chưa có: "Bé chưa có lịch hẹn nào đã qua."
- **"Tình trạng chung của Miu"** — tối đa 5 dòng có biểu tượng: Ăn uống · Nghỉ ngơi · Tinh thần · Vận động (nhật ký đã chia sẻ gần nhất của mục đó, kèm ngày "20/10") · Cân nặng (từ hồ sơ). Không dòng nào → không hiện khối.

### 3.5 Lịch hẹn `#/khach-hang/lich-hen`, `#/khach-hang/lich-hen/:id`

- Tiêu đề "Lịch hẹn của bạn", nút "Đặt lịch mới".
- Tab **Sắp tới · Đang xử lý · Lịch sử** (kèm số). Mẫu chỉ có 2 tab; giữ "Đang xử lý" để yêu cầu chưa chốt không lẫn với lịch đã hẹn.
- **≥ 993 px:** danh sách trái (dòng: ảnh bé · tên bé · dịch vụ · ngày giờ · nhãn trạng thái), chi tiết phải (`MasterDetail`); dòng chọn nền tím nhạt; mặc định chọn dòng đầu. **< 993 px:** bấm dòng → trang chi tiết.
- **Chi tiết:** bé, dịch vụ, ngày giờ hẹn (hoặc ngày + khung giờ mong muốn khi chưa chốt), trạng thái, địa chỉ + "Chỉ đường", các mốc (`timeline`), nút:
  - **"Yêu cầu đổi lịch"** — chỉ lịch "Đã hẹn" còn ở tương lai và chưa có yêu cầu đổi đang chờ.
  - "Gọi Lê Sơn" (`tel:`), "Nhờ Lê Sơn gọi lại" (giữ như hiện nay, khi `canCallBack`).
- **Hộp "Yêu cầu đổi lịch"** (`Dialog`): Ngày mong muốn (bắt buộc, từ ngày mai) · Khung giờ (không bắt buộc, `TIME_SLOTS`) · Lý do (không bắt buộc, ≤ 200 ký tự). Gửi thành công → đóng hộp, báo "Lê Sơn sẽ gọi cho bạn để đổi lịch."; lỗi → giữ dữ liệu, báo tại chỗ.
- Lịch có yêu cầu đổi đang chờ: nhãn **"Đang chờ đổi lịch"** + dòng "Bạn muốn đổi sang 25/10 · 14:00–16:00"; nút đổi lịch ẩn. Khi nhân viên dời lịch, nhãn hết, lịch mới hiện như hiện nay (`rescheduledFrom`).

### 3.6 Nội trú `#/khach-hang/noi-tru`, `#/khach-hang/noi-tru/:id` — "Hôm nay của Miu"

- Dải tiêu đề "Hôm nay của Miu" + dòng phụ + ảnh bé (nhãn "Ảnh minh họa" nếu là ảnh mẫu).
- **Thanh chọn:** "Chọn thú cưng" (các bé có lượt nội trú; bé đang nội trú trước; đổi bé → lượt nội trú gần nhất của bé đó) · "Chọn ngày" (ô ngày + nút ‹ ›, giới hạn từ ngày nhập viện đến hôm nay hoặc ngày xuất viện; mặc định hôm nay / ngày cuối).
- **Video của ngày:** video lớn + hàng ảnh nhỏ các video khác cùng ngày. Không tự phát, luôn tắt tiếng, không nút loa. Dòng "Video được lưu trong 60 ngày · còn N ngày" (giữ màu cảnh báo cam/hồng hiện có). Ngày không có video: không hiện khung video (nhật ký chiếm cả hàng).
- **"Nhật ký hôm nay"** (hoặc "Nhật ký ngày 19/10"): mốc Sáng / Chiều / Tối, **không có giờ**, mỗi mục: buổi · nhãn tình trạng chung · nội dung. Trống: "Lê Sơn chưa cập nhật nhật ký ngày này."
- Thẻ **"Luôn đồng hành cùng bé"**: ảnh + "Nếu bạn có bất kỳ thắc mắc nào về tình trạng của bé, đừng ngần ngại liên hệ với Lê Sơn." + nút "Liên hệ bệnh viện" (`tel:+84973555105`).
- Liên kết "Các lần nội trú trước" (danh sách lượt đã xong). Không có bé đang nội trú: trang hiện "Hiện không có bé nào đang nội trú." + danh sách lượt trước (nếu có).
- `?ngay=YYYY-MM-DD` giữ ngày đang xem trong đường dẫn (tải lại không mất).

### 3.7 Hóa đơn `#/khach-hang/hoa-don`, `#/khach-hang/hoa-don/:id`

- Tiêu đề "Hóa đơn của bạn"; ô "Thanh toán tại quầy".
- **≥ 993 px:** danh sách trái (mã · ngày · bé · tổng · nhãn trạng thái), chi tiết phải; **< 993 px:** trang chi tiết.
- **Chi tiết:** mã, ngày, bé, các dòng (tên · SL · đơn giá · thành tiền), tạm tính, giảm giá, tổng, đã trả, còn lại, các lần thanh toán (ngày · hình thức). Nút **"Tải hóa đơn"** → bản in hiện có (`#/khach-hang/hoa-don/:id/ban-in`; người dùng chọn "Lưu thành PDF").
- Đổi hóa đơn: chi tiết chuyển mờ tại chỗ 180 ms; vùng tổng tiền và nút giữ vị trí; không chạy số.

### 3.8 Tài khoản, Đặt lịch của khách

Giữ chức năng; đổi khung theo §3.1 và thẻ phẳng (`SectionCard`). `#/khach-hang/dat-lich` giữ phiếu "Phiếu khám" (R32) trong khung mới; nhận `?thu-cung=<id>` để chọn sẵn bé (từ Hồ sơ bé).

### 3.9 Chuyển động

Theo `de-xuat-animation-tung-man-2026-10-20.md` §2: danh sách thú cưng hiện từ dưới 8 px, lệch 60 ms, tối đa 5 dòng, 280 ms; hồ sơ bé: ảnh mờ dần 300 ms, thông tin 220 ms; lịch hẹn: gạch chân tab 180 ms, chi tiết từ phải 12 px 220 ms; hóa đơn: mờ tại chỗ 180 ms; bảng chuông mở 150–180 ms. Chạy một lần mỗi lần vào màn; `prefers-reduced-motion` → hiện ngay.

## 4. Dữ liệu — yêu cầu gửi nhánh `claude/du-lieu`

Nhánh dữ liệu chốt tên cuối và ghi vào "Thay đổi hợp đồng" của `PROGRESS.md`; dưới đây là đề xuất.

1. **Cân nặng:** `CustomerPetCard.weightKg?: number` (lấy từ hồ sơ bệnh viện; bé web không có).
2. **Tình trạng chung:** `pets.get(id)` trả thêm `condition: { category: 'an_uong' | 'nghi_ngoi' | 'tinh_than' | 'van_dong'; text: string; dateLabel: string }[]` — mục nhật ký **đã chia sẻ** gần nhất của mỗi mục cho bé đó (mọi lượt nội trú), `dateLabel` dạng "20/10". Không lấy `loi_nhan`.
3. **Đổi lịch:**
   - `appointments.requestReschedule(appointmentId, { desired_date: string; preferred_slot?: TimeSlot; reason?: string }): Promise<void>` — chỉ lịch của khách, trạng thái đã hẹn, ở tương lai; `desired_date` ≥ ngày mai; `reason` ≤ 200 ký tự; đã có yêu cầu đang chờ → `ValidationError`.
   - `CustomerBookingRow.rescheduleRequest?: { desiredDate: string; preferredSlot?: TimeSlot; createdAt: string }` khi đang chờ.
   - Nhân viên: yêu cầu hiện trong danh sách "Yêu cầu đặt lịch" (đánh dấu "Đổi lịch", kèm lịch hiện tại và ngày mong muốn mới). Nhân viên dời lịch (`appointments.reschedule`) → yêu cầu tự xong; thêm cách đóng "Không đổi" (khách giữ lịch cũ). Ghi vào nhật ký thao tác như các yêu cầu khác.
4. **Chuông:** `updates: { list(): Promise<CustomerUpdate[]>; markAllSeen(): Promise<void> }` với `CustomerUpdate = { id: string; kind: 'diary' | 'video' | 'request' | 'invoice'; text: string; dateLabel: string; partOfDay?: PartOfDay; target: { kind: 'stay' | 'request' | 'invoice'; id: string }; unseen: boolean }` — tối đa 10, trong 30 ngày, mới nhất trước; chưa xem dựa trên `account_seen` (R28). `text` không chứa giờ, tên thuốc, tên nhân viên, ghi chú nội bộ (thêm vào kiểm thử rò rỉ hiện có).
5. **Ngày cụ thể:** `CustomerDiaryEntry.date: string` và `CustomerVideo.date: string` (`YYYY-MM-DD`, giờ Việt Nam) để lọc theo "Chọn ngày".

Trong lúc chờ: cờ trong `src/features/data-ready.ts` (`petWeight`, `petCondition`, `reschedule`, `updates`, `diaryDate`) — chưa có thì ẩn dòng/khối/nút tương ứng, không hiện điều khiển không chạy.

## 5. Ảnh

Dùng ảnh đã có: dải chào Tổng quan dùng ảnh chó + mèo sẵn có (`cho-vang`, hoặc ảnh thẻ hero), nhãn "Ảnh minh họa"; thẻ "Luôn đồng hành cùng bé" dùng `meo-trang-ngu`. Không thêm ảnh mới.

## 6. Quyết định cần ghi vào `docs/thiet-ke/QUYET-DINH.md` (R35)

Khung khu khách thanh ngang; chuông cập nhật; yêu cầu đổi lịch (khách gửi, nhân viên gọi và dời); tình trạng chung của bé từ nhật ký đã chia sẻ; tab Lịch hẹn giữ "Đang xử lý"; khách chưa tải ảnh bé; "Tải hóa đơn" = bản in.

## 7. Kiểm thử

- e2e mới `e2e/giao-dien-khach.spec.ts`: khung (thanh ngang ≥ 993, thanh dưới < 993, menu tài khoản, khóa khi chưa liên kết); Tổng quan (4 khối, khối "Bé … hôm nay" chỉ khi có nội trú); Thú cưng (tìm, không khớp, xem hồ sơ); Hồ sơ bé (thông tin, lịch đã qua không có "Hoàn thành", tình trạng chung, nút sửa chỉ bé web, "Đặt lịch cho …" chọn sẵn bé); Lịch hẹn (tab, chi tiết bên phải, gửi đổi lịch → nhãn "Đang chờ đổi lịch" → nhân viên thấy và dời → nhãn hết); Nội trú (chọn bé, chọn ngày, ‹ ›, nhật ký không có giờ, video không có nút loa, `?ngay=`); Hóa đơn (chọn, chi tiết, "Tải hóa đơn" mở bản in); chuông (chấm, danh sách, mở → hết chấm, không có giờ).
- Kiểm thử nội dung: không có "Hoàn thành", "Quý khách", "quý khách", giờ "hh:mm" trong nhật ký/chuông của khách.
- axe trên mọi màn khu khách; điện thoại 320 px không cuộn ngang (`fitsDevice`); bàn phím: tab, bảng chuông, hộp đổi lịch.
- Unit: hàm lọc tìm kiếm thú cưng (bỏ dấu), hàm giới hạn ngày nội trú.
- `npm run shots` so với mẫu 03/05 ở 1440 và 390; `npm run verify` xanh; đăng lại bản xem trước.
