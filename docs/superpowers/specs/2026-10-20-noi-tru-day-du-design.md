# Đợt 2 · Nhóm 1 — Nội trú đầy đủ (thiết kế)

Ngày: 20/10/2026 · Chủ dự án duyệt từng phần trong hội thoại (phần 1–3) · Thuộc P1 theo QUYET-DINH R13.

## 1. Mục tiêu

Bản demo hiện cho xem bảng chuồng và hồ sơ nội trú nhưng **không thay đổi được**: không nhập viện, chuyển chuồng, xuất viện, và video chỉ có các clip mẫu. Nhóm này làm cho vòng đời nội trú chạy trọn trong demo:

nhập viện → chăm sóc (đã có) → chuyển chuồng → tải video (mẫu hoặc từ máy) → chia sẻ cho chủ nuôi → xuất viện → hóa đơn đúng số ngày → chuồng trống lại.

**Thành công khi:** người xem demo làm được cả vòng trên trong một trình duyệt, tab khách thấy đúng những gì được chia sẻ, và không có chỗ nào lộ thông tin nội bộ cho khách (R7, R20).

**Nguồn ràng buộc:** `docs/thiet-ke/QUYET-DINH.md` (R1–R32, ưu tiên cao nhất) → `docs/thiet-ke/proposal-staff.md` §5.1–5.3 (màn hình, câu chữ) → tài liệu này. Chỗ nào proposal-staff khác QUYET-DINH thì theo QUYET-DINH (ví dụ: video từ máy tối đa **20 MB** theo R25, không phải 50 MB).

**Quyết định của chủ dự án trong buổi thiết kế:**
- Làm nhóm "Nội trú đầy đủ" trước các nhóm khác của đợt 2.
- Tiền nội trú theo ngày **tự cập nhật** vào hóa đơn nháp khi xuất viện.
- Video từ máy lưu bằng IndexedDB (cách 1).
- (Sau khi đọc bản viết, 20/10) Tiền nội trú tính **theo giờ**, quy ra ngày lẻ làm tròn lên 0,1 ngày (6 giờ → 0,3; 12 giờ → 0,5).
- (Sau khi đọc bản viết) Bé **chưa có cân nặng** trong hồ sơ (mọi loài) → không tự ghi dòng tiền nội trú.
- (Sau khi đọc bản viết) Nhân viên Spa được thêm quyền nội trú: nhập viện / chuyển chuồng / xuất viện và chia sẻ nhật ký, video với chủ nuôi. Hồ sơ nội bộ (thuốc, y lệnh) vẫn chỉ bác sĩ và quản lý.

## 2. Ngoài phạm vi

- Check-in / "Đã đến" cho lịch hẹn (R8 — vẫn không có).
- Sửa cấu hình chuồng/khu (chuồng là dữ liệu mẫu cố định: Khu chó C1–C6, Khu mèo M1–M4, Khu riêng R1–R2).
- Hướng dẫn dùng thuốc / chăm sóc tại nhà trên web (luôn dặn trực tiếp).
- Tải video cho khách xuống máy (mặc định: không).
- Các nhóm khác của đợt 2 (hóa đơn nâng cao, tiện ích nhân viên, hiệu ứng).

## 3. Dữ liệu & chức năng

### 3.1 Quy tắc số ngày tính tiền

`billableDays(admitted_at, until)` = số giờ nằm viện ÷ 24, **làm tròn lên 0,1 ngày**, tối thiểu 0,1. Ví dụ: 6 giờ → 0,3 · 12 giờ → 0,5 · 24 giờ → 1 · 30 giờ → 1,3 · 52 giờ → 2,2. Làm tròn tính trên số phút nguyên để tránh sai số dấu phẩy động (ví dụ đúng 24 giờ ra 1, không ra 1,1). Đặt ở `src/data/rules/` (hàm thuần, có test), dùng chung cho trang nội trú, hộp thoại xuất viện và API.

Nhãn "Ngày 3" trên bảng chuồng giữ nguyên cách đếm ngày lịch hiện có (ngày nhập viện là ngày 1) — đó là nhãn chăm sóc, không phải số tính tiền.

Số lượng lẻ hiển thị dạng Việt Nam ("2,2 ngày"). Thành tiền dòng = đơn giá × số lượng, **làm tròn đến đồng** (`lineTotal` sửa để làm tròn; với số lượng nguyên kết quả không đổi).

### 3.2 Dòng tiền ngày

- Ba mục bảng giá được dùng làm tiền ngày: `LT01` Nội trú mèo · `LT02` Nội trú chó dưới 15 kg · `LT03` Nội trú chó từ 15 kg.
- Gợi ý mặc định (chỉ khi hồ sơ bé **có cân nặng**): mèo → LT01; chó `weight_kg ≥ 15` → LT03; chó dưới 15 kg → LT02; loài "Khác" → LT02.
- Bé **chưa có cân nặng** (mọi loài) → mặc định "Chưa ghi tiền nội trú": hóa đơn nháp (nếu tạo) không có dòng tiền ngày. Nhân viên vẫn có thể tự chọn 1 trong 3 mục ở hộp thoại nhập viện, hoặc thêm sau trong hóa đơn.
- Nhân viên đổi được lựa chọn trong hộp thoại nhập viện (3 mục trên hoặc "Chưa ghi tiền nội trú").
- `Stay` thêm trường `day_price_item_id?`. Dữ liệu mẫu đặt sẵn trường này cho các lượt nội trú đang có hóa đơn nháp (khớp với dòng LT đã có trong hóa đơn).

### 3.3 Nhập viện (`inpatient.admit` — đã có, bổ sung)

Đầu vào thêm:
- `initial_status` (Ổn định / Cần theo dõi / Nặng; mặc định Cần theo dõi như hiện nay).
- `appointment_id?` khi chọn từ "Lịch hẹn hôm nay" (ghi vào `stay.appointment_id`).
- `invoice?: { day_price_item_id? }` khi tick "Tạo hóa đơn nội trú nháp" (`day_price_item_id` vắng = "Chưa ghi tiền nội trú"):
  - Nếu lịch hẹn đã chọn có sẵn hóa đơn **nháp** → thêm dòng tiền ngày (nếu có) vào hóa đơn đó và gắn `stay.invoice_id` vào nó; **không tạo hóa đơn mới**.
  - Ngược lại → tạo hóa đơn nháp mới (`source_type: 'stay'`), có 1 dòng tiền ngày nếu đã chọn.
  - Dòng tiền ngày lúc nhập viện có số lượng 0,1 (tối thiểu) và được tính lại khi xuất viện.
- Lỗi (giữ nguyên câu hiện có): chuồng đang có bé → "Chuồng này đang có bé ở."; bé đang nội trú → "Bé đang nội trú."
- Tất cả trong **một** giao dịch: lỗi ở bước nào thì không ghi gì.

Thêm truy vấn phục vụ hộp thoại:
- `admitOptions()` → chuồng trống (kèm khu và `species_hint`), bác sĩ, 3 mục tiền ngày (tên, giá), và các bé có lịch hẹn **hôm nay** còn "Đã hẹn" mà chưa nội trú.
- `findPets(q)` → tìm theo tên bé, tên chủ, số điện thoại (không dấu, như ô tìm hiện có); mỗi kết quả có loài, giống, cân nặng, chủ nuôi và cờ "đang nội trú".

### 3.4 Chuyển chuồng (mới)

`transfer(id, version, { cage_id, reason? })` — quyền `inpatient.admit`.
- Chỉ chuyển sang chuồng **trống và đang hoạt động**, khác chuồng hiện tại; ngược lại báo "Chuồng này đang có bé ở." (ValidationError ở trường `cage_id`).
- Lượt đã xuất viện → "Bé đã xuất viện."
- Kiểm tra phiên bản như các thao tác khác (tab khác vừa sửa → ConflictError, không ghi đè).
- Ghi nhật ký thao tác: "… chuyển {bé} từ chuồng C4 sang C5" (+ lý do nếu có).

### 3.5 Xuất viện (đã có, bổ sung)

Đầu vào: `{ discharged_at?, note_internal?, farewell?: { text, share } }`.
- `discharged_at` mặc định là bây giờ; không được trước lúc nhập viện, không được sau bây giờ.
- **Tiền ngày:** nếu `stay.invoice_id` trỏ tới hóa đơn còn **nháp** và hóa đơn đó có dòng mang `day_price_item_id` → đặt số lượng dòng đó = `billableDays(admitted_at, discharged_at)` và tính lại tổng. Hóa đơn đã phát hành → không đụng tới. Nhân viên đã tự xóa dòng tiền ngày → tôn trọng, không thêm lại.
- **Lời chào tạm biệt:** thành một mục nhật ký với tình trạng chung "Sẵn sàng về nhà", buổi theo giờ xuất viện, loại "tinh_than". Nếu `share` và người làm có `inpatient.share` → chia sẻ luôn; ngược lại lưu nháp. Văn bản vẫn qua kiểm tra mềm R7 (cảnh báo, không chặn) — giống ô nhật ký.
- Một giao dịch duy nhất. Trả về `{ days, invoiceUpdated }` để hiện thông báo.

### 3.6 Video tải lên (mới)

`videos.upload(stayId, input)` — quyền `inpatient.diary_write`.
- `input.source`: `{ kind: 'demo', key }` (một trong các clip mẫu) **hoặc** `{ kind: 'device', file: Blob }`.
- `caption?` (≤ 120 ký tự), `recorded_at` (mặc định bây giờ, không sau bây giờ), `duration_s`.
- `share?: VideoShareChecks` — chỉ khi người làm có `inpatient.share`; phải tick đủ 2 ô như khi chia sẻ video hiện nay.
- **Tệp từ máy:**
  - Chỉ nhận `video/*`; ngược lại: "Tệp này không phải video. Bạn chọn tệp MP4, MOV hoặc WebM nhé."
  - Tối đa 20 × 1024 × 1024 byte; quá thì: "Video lớn hơn 20 MB. Bạn cắt ngắn hoặc chọn video khác nhé."
  - Lưu vào IndexedDB (`idb-keyval`, đã có trong dependency) với khóa `local:<id>`: tệp video + ảnh bìa (khung hình đầu, JPEG, nếu trình duyệt đọc được).
  - Không đọc được thời lượng → vẫn nhận, thời lượng hiện "—".
  - Trình duyệt không cho dùng IndexedDB / hết dung lượng: "Trình duyệt này không lưu được video. Bạn dùng video mẫu nhé." — và lựa chọn "Chọn từ máy" bị tắt kèm câu này.
  - Thứ tự ghi: lưu tệp vào IndexedDB trước, rồi giao dịch dữ liệu; nếu giao dịch lỗi thì xóa tệp vừa lưu.
- Video mới: `expires_at = uploaded_at + 60 ngày`, `audio_removed: true`, trạng thái nháp hoặc đã chia sẻ.
- **Tự xóa sau 60 ngày** (`purgeExpiredVideos`, đã có): video `local:` hết hạn thì xóa luôn tệp trong IndexedDB (sau giao dịch, không chặn).
- **Xóa video** (đã có) với video `local:` cũng xóa tệp trong IndexedDB.
- **"Khôi phục dữ liệu mẫu"** xóa toàn bộ tệp `local:`.

**Phát video:** một hook dùng chung `useMediaUrls(media_key)` → `{ mp4, poster?, thumb? }`:
- `demo:` → như `mediaFor` hiện nay (đồng bộ).
- `local:` → đọc từ IndexedDB, tạo object URL, thu hồi khi rời màn hình; không còn tệp → "Không còn tệp video".

Dùng cho cả phía nhân viên và phía khách. Video `local:` mang chip "Chỉ lưu trên trình duyệt này" ở cả hai phía; phía khách biết nhờ cờ `isLocal` trong dữ liệu chiếu cho khách (không lộ gì khác).

### 3.7 Lịch sử lượt nội trú (mới)

`history(stayId)` → danh sách `{ at, label, actorName, icon }` mới nhất trước, lấy từ nhật ký thao tác:
- nhập viện, chuyển chuồng, đổi tình trạng nội bộ, xuất viện;
- nhật ký: lưu nháp / chia sẻ / thu hồi;
- video: tải lên / chia sẻ / ngừng chia sẻ / xóa / hệ thống tự xóa;
- y lệnh, thực hiện, ghi chú chăm sóc — **chỉ khi người xem có `inpatient.clinical`**.

Câu chữ không chứa tên thuốc hay liều với người không có `inpatient.clinical`.

### 3.8 Dữ liệu cho trang nội trú

`StaffStayView` thêm `billing?: { invoiceId, status, dayItemName?, dayPrice? }`. Trang và hộp thoại xuất viện tự tính `billableDays` tới bây giờ / tới thời điểm xuất viện đã chọn để hiển thị "Nội trú mèo × 2,2 ngày = 330.000 ₫". Không có hóa đơn → bỏ trống; có hóa đơn nhưng không có dòng tiền ngày → "Chưa ghi tiền nội trú".

### 3.9 Quyền

Bộ quyền mẫu "Nhân viên Spa" thêm `inpatient.admit` và `inpatient.share` (giữ `inpatient.view`, `inpatient.diary_write`; **không** thêm `inpatient.clinical`). Cập nhật `src/data/rules/capabilities.ts`, test quyền, bảng quyền trong `proposal-staff.md` §2 và ghi vào QUYET-DINH. Dữ liệu mẫu có nháp nhật ký của Ngọc Anh "chờ chia sẻ" vẫn giữ (giờ Ngọc Anh tự chia sẻ được).

## 4. Màn hình & hộp thoại

### 4.1 Bảng chuồng `#/nv/noi-tru`

- Nút "＋ Nhập viện" ở đầu trang — chỉ với `inpatient.admit`.
- Chuồng trống (viền nét đứt): với `inpatient.admit` là nút bấm mở "Nhập viện" chọn sẵn chuồng (nhãn đọc màn hình "Nhập viện vào chuồng C4"); không có quyền → chỉ xem.
- Bé mới vào chuồng: ô chuồng hiện với hiệu ứng nhẹ một lần (không lặp; giảm chuyển động → hiện ngay).

### 4.2 Trang lượt nội trú `#/nv/noi-tru/:stayId`

- Cạnh "Tình trạng nội bộ": "Chuyển chuồng…" · "Xuất viện…" (với `inpatient.admit`).
- Đã xuất viện: ẩn hai nút và ô đổi tình trạng; hiện dải "Đã xuất viện lúc 15:20, 19/10".
- Tab "Hóa đơn": hiện dòng tiền ngày và "đang tính N ngày" (hoặc "đã tính N ngày" sau xuất viện), nút "Mở hóa đơn nội trú".
- Tab mới "Lịch sử": dòng thời gian (dùng `Timeline` sẵn có).
- Tab "Video": nút "Tải video lên" với `inpatient.diary_write`.

### 4.3 Hộp thoại "Nhập viện"

Trên điện thoại hiện toàn màn hình như các hộp thoại khác. Trường:
- **Thú cưng:** ô tìm (tên bé, tên chủ, số điện thoại) + mục "Từ lịch hẹn hôm nay". Bé đang nội trú hiện mờ kèm "Đang nội trú".
- **Chuồng:** chỉ chuồng trống, nhóm theo khu, khu hợp loài lên trước.
- **Bác sĩ phụ trách** (mặc định người đang đăng nhập nếu là bác sĩ).
- **Lý do nhập viện** — nhãn "Chỉ nhân viên", bắt buộc.
- **Tình trạng ban đầu**, **Dự kiến xuất viện** (không bắt buộc, không trước hôm nay).
- **"Tạo hóa đơn nội trú nháp"** — tick sẵn; kèm ô chọn dòng tiền ngày (gợi ý theo §3.2; bé chưa có cân nặng → mặc định "Chưa ghi tiền nội trú" với chú thích "Hồ sơ bé chưa có cân nặng nên chưa ghi tiền nội trú."). Nếu lịch hẹn đã có hóa đơn nháp thì dòng chú thích đổi thành "Thêm vào hóa đơn nháp {mã} của lịch hẹn".

Lỗi hiện dưới đúng ô. Nút "Nhập viện". Thông báo: "Đã nhập viện Kem vào chuồng C4." → chuyển sang trang lượt nội trú mới.

### 4.4 Hộp thoại "Chuyển chuồng"

"Chuồng mới" (chỉ chuồng trống) · "Lý do" (không bắt buộc). Nút "Chuyển chuồng". Thông báo: "Đã chuyển Kem sang chuồng C5."

### 4.5 Hộp thoại "Xuất viện"

- "Thời điểm xuất viện" (mặc định bây giờ) · "Ghi chú nội bộ" (nhãn "Chỉ nhân viên").
- Ô tóm tắt hóa đơn: "Nội trú mèo × 2,2 ngày (52 giờ) = 330.000 ₫ · Hóa đơn đang là bản nháp" (cập nhật khi đổi thời điểm xuất viện) + nút "Mở hóa đơn"; hóa đơn đã phát hành → "Hóa đơn đã phát hành — không thay đổi"; không có hóa đơn → "Lượt nội trú này chưa có hóa đơn."; có hóa đơn nhưng chưa ghi tiền nội trú → "Chưa ghi tiền nội trú — bạn có thể thêm trong hóa đơn."
- "Lời chào tạm biệt gửi chủ nuôi" (không bắt buộc), gợi ý: "Mochi đã khỏe và sẵn sàng về nhà. Cảm ơn gia đình đã tin tưởng Lê Sơn!"; cảnh báo R7 khi gặp tên thuốc/liều; ô "Chia sẻ ngay với chủ nuôi" chỉ với `inpatient.share`.
- Dòng cố định: "Hướng dẫn dùng thuốc và chăm sóc tại nhà được dặn trực tiếp, không gửi qua web."
- Nút "Xác nhận xuất viện". Thông báo: "Đã cho Mochi xuất viện · hóa đơn tính 2,2 ngày." (bỏ vế sau nếu không cập nhật hóa đơn).

### 4.6 Hộp thoại "Tải video lên"

- Nguồn: "Chọn video mẫu" (lưới clip mẫu, nhãn "Video minh họa") · "Chọn từ máy".
- Chọn từ máy → xem trước (tắt tiếng), thời lượng, và ghi chú R25 nguyên văn: "Bản demo: video tải từ máy được phát ở chế độ tắt tiếng; bản chính thức sẽ loại bỏ âm thanh khi tải lên." + "Chỉ lưu trên trình duyệt này."
- "Lời nhắn kèm video" (≤ 120 ký tự, gợi ý "Miu sưởi nắng buổi sáng") · "Thời điểm quay".
- Chip cố định: "Âm thanh: đã loại bỏ" · "Tự xóa sau 60 ngày".
- Hai ô xác nhận (chỉ hiện với `inpatient.share`): "Video không có người hay thú cưng của khách khác" · "Không thấy tên thuốc, y lệnh hay giấy tờ nội bộ".
- Nút: có `inpatient.share` → "Lưu nháp" · "Tải lên và chia sẻ" (cần đủ 2 ô); không có → "Tải lên (bản nháp)".

### 4.7 Phía khách

Không có màn hình mới. Lời chào "Sẵn sàng về nhà" và video được chia sẻ hiện như các mục hiện có; video từ máy phát tắt tiếng, có chip "Chỉ lưu trên trình duyệt này". Lượt đã xuất viện vẫn hiện tối đa 60 ngày như quy tắc đợt 1.

## 5. Lỗi & trường hợp biên

- Hai tab cùng nhập viện vào một chuồng → tab sau nhận "Chuồng này đang có bé ở.", danh sách chuồng tải lại.
- Hộp thoại mở trên lượt đã bị tab khác xuất viện → "Bé đã xuất viện." / thông báo xung đột chuẩn, không ghi đè.
- Xuất viện khi hóa đơn đã phát hành → hóa đơn giữ nguyên, thông báo không nhắc số ngày.
- Video từ máy sau "Khôi phục dữ liệu mẫu" → bản ghi biến mất cùng dữ liệu mẫu, tệp bị xóa.
- Tệp video còn trong IndexedDB nhưng bản ghi đã mất (ví dụ tab khác khôi phục) → dọn khi tải ứng dụng.

## 6. Kiểm tra

**Unit (Vitest):**
- `billableDays`: 6 giờ → 0,3 · 12 giờ → 0,5 · đúng 24 giờ → 1 · 30 giờ → 1,3 · 52 giờ → 2,2 · vài phút → 0,1; `lineTotal` làm tròn đến đồng (150.000 × 0,3 = 45.000).
- Gợi ý dòng tiền ngày: có cân nặng theo loài/mức 15 kg; **không có cân nặng → không ghi** (cả mèo).
- Bộ quyền Spa có `inpatient.admit`, `inpatient.share`, không có `inpatient.clinical`.
- Nhập viện: có / không tạo hóa đơn; thêm vào hóa đơn nháp của lịch hẹn; lỗi chuồng bận / bé đang nội trú; không ghi gì khi lỗi.
- Chuyển chuồng: thành công; chuồng bận; đã xuất viện; xung đột phiên bản.
- Xuất viện: số lượng dòng tiền ngày; hóa đơn đã phát hành giữ nguyên; dòng đã bị xóa không thêm lại; lời chào thành nhật ký (chia sẻ / nháp theo quyền); thời điểm không hợp lệ.
- Tải video: sai loại, quá 20 MB, chia sẻ thiếu ô xác nhận, không có quyền; tự xóa và xóa video xóa luôn tệp `local:`; khôi phục dữ liệu xóa hết tệp `local:`.
- Lịch sử: người không có `inpatient.clinical` không thấy mục y lệnh.
- Dữ liệu chiếu cho khách: không có mã chuồng, tên nhân viên, ghi chú nội bộ (bổ sung vào test chống lộ hiện có).

**E2E (Playwright):**
- Hành trình: `bacsi_mai` nhập viện bé → chuyển chuồng → tải video WebM nhỏ từ máy và chia sẻ → tab khách (chủ đã liên kết) thấy video kèm chip → xuất viện có lời chào chia sẻ → hóa đơn đúng số ngày → chuồng trống lại.
- Quyền: `spa_ngocanh` nhập viện, chuyển chuồng, xuất viện, chia sẻ nhật ký và video được; vẫn **không** thấy tab "Hồ sơ nội bộ" và các mục y lệnh trong "Lịch sử". (Sửa test e2e đợt 1 đang kiểm tra Spa không có nút "Chia sẻ với chủ nuôi".)
- Tải tệp quá 20 MB / không phải video → câu lỗi đúng.
- Kiểm tra a11y (axe) cho ba hộp thoại mới và hộp thoại tải video; bổ sung route vào `e2e/manifest.ts` nếu có route mới.
- Màn 320 px: hộp thoại không cuộn ngang.

**Ngân sách:** giữ ngưỡng hiện tại (JS khởi tạo ≤ 240 KB gz, ≤ 80 tệp). Hộp thoại mới tải theo trang nhân viên (đã tách gói).

## 7. Đầu ra

- Code + test trên nhánh `claude/focused-pascal-rfxnnp`, đẩy sau mỗi task.
- `npm run verify` xanh.
- Cập nhật `docs/thiet-ke/QUYET-DINH.md` (ghi quyết định tiền ngày tự cập nhật) và README (trạng thái).
- Đăng lại bản xem trước lên cùng Artifact.
