# Kế hoạch hoàn thiện website Lê Sơn — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hoàn thiện nền tảng demo đang có, sửa lỗi đã xác nhận, kiểm chứng nghiệp vụ và chuẩn bị có kiểm soát cho bước dùng dữ liệu thật.

**Architecture:** Tiếp tục phát triển trên cấu trúc React và lớp API demo hiện có. Tách các đợt sửa lỗi, giao diện và kiểm thử thành PR nhỏ; sau khi chốt demo mới triển khai kế hoạch backend và chuyển đổi GPet theo từng phân hệ.

**Tech Stack:** React, định tuyến ứng dụng, API giả lập và lưu trữ trong trình duyệt đang có; Phosphor Duotone; Lora và Be Vietnam Pro. Giữ công cụ build và kiểm thử của repo sau khi đối chiếu mã nguồn.

**Spec:** Bản `Le-So3n-demo.html`; báo cáo `Review_Le_So3n_demo_2026-10-21.md`; `Quy_chuan_font_chu_va_so_Le_Son.md` phiên bản có IN HOA ĐẬM; các quyết định thiết kế đã thống nhất trong phiên.

Ngày lập: **21/10/2026**.  
Đối tượng bàn giao: người triển khai trên repo `lqt140304-rgb/tesst`.  
Trạng thái: **kế hoạch đề xuất, chưa triển khai**.

## Global Constraints — Những yêu cầu phải giữ

- Hero hiện tại là chuẩn nhận diện, giữ bố cục và phong cách đã duyệt.
- Nền phần mới tím xám rất nhạt, phối kem; tím mận chủ đạo, cam nhấn tiết chế.
- Font Lora cho tiêu đề thương hiệu; Be Vietnam Pro cho nội dung, thao tác và số liệu; hỗ trợ chữ thường, **in đậm**, IN HOA và **IN HOA ĐẬM**.
- Dùng Phosphor Duotone thống nhất.
- Khung mới bo có chọn lọc: nút/ô nhập khoảng 4–6px, thẻ/ảnh khoảng 8–12px; không thay hàng loạt CSS của hero.
- Animation từng khu vực độc lập, không cản thao tác; có chế độ giảm chuyển động.
- Khách không thấy thuốc, liều, giờ tiêm, lịch tiêm, y lệnh và thông tin nội bộ.
- Video nội trú hỗ trợ clip đến 20 giây, mục tiêu nội dung 20 giây/1080p; tắt âm khi xem, lưu 60 ngày. Không ép clip ngắn phải đủ đúng 20 giây.
- Giữ giới hạn tệp 20 MB hiện có ở giai đoạn sửa demo; đánh giá lại theo video thực trước triển khai.
- Thanh toán tại quầy; không thêm cổng thanh toán trực tuyến.
- Phân quyền theo vai trò/quyền thực tế, không tạo chức danh lễ tân riêng bắt buộc.
- Mỗi người hoặc tài khoản làm trên nhánh riêng; không sửa cùng file đồng thời; merge qua PR để chủ dự án duyệt.
- Các bước kiểm thử demo không được xem là chứng minh backend đã an toàn.
- Mục tiêu cuối là đáp ứng đầy đủ nhu cầu để chuyển khỏi GPet; chốt demo không đồng nghĩa được thay GPet ngay.

## Review Focus — Năm nhóm cần kiểm tra kỹ

1. Lịch giao nhau một phần, lịch liên tiếp và lịch đã hủy: phải phát hiện đúng, không che lịch.
2. Video đúng ngưỡng, metadata lỗi và tải thất bại: không lưu bản ghi hỏng hoặc báo thành công sai.
3. Cùng tài nguyên được sửa đồng thời: không tạo trùng hoặc ghi đè thay đổi mới hơn.
4. Khách đổi tài khoản hoặc mở URL trực tiếp: không xem dữ liệu của người khác hoặc dữ liệu nội bộ.
5. Mobile, bàn phím và giảm chuyển động: thao tác hoàn thành được, nút không bị che, dữ liệu không phụ thuộc animation.

Các nhóm này được gắn vào công việc tương ứng bên dưới.

---

## 1. Căn cứ và giới hạn của kế hoạch

Kế hoạch dựa trên bản HTML mới đã review:

- Tệp: `Le-So3n-demo.html`.
- Dung lượng: **11.650.725 byte**.
- Tiền tố SHA-256: `a8da3eefbeafe616`.
- Đã mở 20 đường dẫn ở 1440 × 1000 và 390 × 844: 40 lượt kiểm tra.
- Đã kiểm tra một số API demo, quyền truy cập, lưu nháp và hồi quy lỗi cũ.
- Chưa kiểm thử đầy đủ mọi thao tác, Safari/iPhone thật, backend hoặc nhập dữ liệu GPet.

**Không đặt tỷ lệ hoàn thành toàn dự án.** Có màn hình và API demo chưa đồng nghĩa nghiệp vụ đã được nghiệm thu hoặc đã có hệ thống dữ liệu thật.

Bản HTML là bản build, không phải bản mã nguồn đầy đủ. Trước khi code, phải xác định commit nguồn tương ứng trong repo. Các tên API bên dưới đã quan sát được; tên file nguồn và lệnh kiểm thử cần lấy từ repo trong Task 0, không suy đoán từ tên hàm đã minify.

## 2. Web đã có gì và nên xử lý thế nào?

| Phân hệ | Đã có trong demo | Việc tiếp theo |
| --- | --- | --- |
| Trang công khai | Hero, giới thiệu, dịch vụ, đội ngũ, liên hệ | Giữ nền tảng; thay nội dung/ảnh minh họa khi có dữ liệu thật, tinh gọn mobile |
| Đặt lịch công khai | Form, xác thực, lưu yêu cầu | Kiểm thử gửi thành công/thất bại, gửi lại, theo dõi yêu cầu |
| Tài khoản | Đăng ký, đăng nhập, quên mật khẩu qua hỗ trợ, tài khoản mẫu | Kiểm thử vòng đời và liên kết hồ sơ; backend làm ở mốc riêng |
| Cổng khách hàng | Tổng quan, thú cưng, lịch hẹn, nội trú, hóa đơn, tài khoản | Hoàn thiện luồng và quyền, không dựng lại toàn bộ |
| Yêu cầu đặt lịch | Danh sách, xử lý/liên hệ, xác nhận/từ chối và đổi lịch | Kiểm thử chuyển trạng thái và cập nhật sang cổng khách hàng |
| Lịch hẹn nhân viên | Ngày/tuần, tạo, đổi, hủy, phân công | **Sửa lịch trùng bị che trước** |
| Hồ sơ khách hàng | Danh sách, hồ sơ, thú cưng | Kiểm thử sửa, liên kết, trùng thông tin và truy cập chéo |
| Tài khoản web | Tra cứu, liên kết tài khoản với hồ sơ bệnh viện | Kiểm thử liên kết đúng người, đổi/ngắt liên kết nếu nghiệp vụ hiện tại hỗ trợ |
| Nội trú nội bộ | Chuồng, đợt lưu trú, y lệnh, ghi nhận chăm sóc | Kiểm thử từ tiếp nhận đến xuất viện và phân quyền |
| Nội trú chia sẻ | Nhật ký, video, chia sẻ/ngừng chia sẻ | **Sửa giới hạn 15 thành 20 giây**, kiểm tra ranh giới nội bộ/khách |
| Hóa đơn | Nháp, giá cố định/linh hoạt, phát hành, ghi nhận thanh toán | Kiểm thử toàn vòng đời và đối soát số tiền |
| Bảng giá | Danh mục giá, loại giá và các API cập nhật | Kiểm thử quyền quản lý và ảnh hưởng lên hóa đơn cũ |
| Doanh thu | Tiền đã thu, phương thức, nhóm dịch vụ, công nợ | Kiểm tra kỳ báo cáo, hoàn tác khoản thu, cách tính từng chỉ số |
| Giao diện | Đã áp dụng khá nhiều nét từ hero, font và icon | Chuẩn hóa các thành phần còn lệch, không thiết kế lại từ đầu |

### Lỗi cũ đã sửa: giữ làm kiểm thử hồi quy

- Giá linh hoạt vẫn sửa được sau tải lại hóa đơn nháp.
- Hai bé cùng tên có lịch sử riêng; đổi tên không làm mất lịch sử.
- Giờ y lệnh `25:99` bị từ chối.
- Hai đăng ký đồng thời cùng tên chỉ cho một tài khoản thành công.

Không đưa các lỗi này trở lại danh sách cần viết lại; chỉ sửa nếu kiểm thử cho thấy tái phát.

## 3. Thứ tự và mốc bàn giao

| Mốc | Công việc | Điều kiện kết thúc |
| --- | --- | --- |
| M0 — Khóa bản nguồn | Task 0 | Biết commit, file phụ trách, lệnh chạy và quy chuẩn |
| M1 — Sửa lỗi xác nhận | Task 1–2 | Lịch không che nhau; nhận video 20 giây |
| M2 — Chốt demo | Task 3–5 | UI thống nhất, nghiệp vụ được kiểm tra, có bản build bàn giao |
| M3 — Dữ liệu thật | Các gói tại mục 8 | Backend, lưu trữ, quyền và vận hành nhiều thiết bị được kiểm chứng |
| M4 — Chuyển GPet | Đối chiếu phạm vi đầy đủ, nhập thử, chạy song song | Dữ liệu/luồng đầy đủ, đối soát và có phương án quay lại |

M1 là đợt làm ngay. Task 3 chỉ bắt đầu khi đã giao rõ file dùng chung. Không hứa ngày hoàn tất M3/M4 khi chưa kiểm kê nguồn dữ liệu và phạm vi nghiệp vụ.

## 4. Các công việc triển khai cho bản hiện tại

### Task 0 — Chốt mã nguồn và phạm vi file

**Phụ trách:** người điều phối/Claude A.  
**Nhánh:** `chore/baseline-review`.  
**Tài liệu:** `CLAUDE.md`, `PROGRESS.md`; kế hoạch nên đặt tại `docs/superpowers/plans/2026-10-21-ke-hoach-hoan-thien-le-son.md`.

- [ ] Kiểm tra trạng thái git, chuyển đúng nhánh, đồng bộ bằng `git pull --ff-only` khi đã có upstream.
- [ ] Đọc hướng dẫn repo và xác định commit tạo ra bản demo đã review; ghi khác biệt nếu repo mới hơn.
- [ ] Tìm file nguồn chứa lịch ngày/tuần, tạo/đổi lịch, xác nhận yêu cầu, xác thực/tải video, token UI và trình phát.
- [ ] Ghi đường dẫn file thật và chủ sở hữu từng file vào `PROGRESS.md` trước khi chạy hai tài khoản song song.
- [ ] Đọc `package.json` để ghi đúng lệnh dev, typecheck, lint, test và build. Chạy kiểm tra nền một lần, ghi lỗi có sẵn.
- [ ] Bổ sung quyết định hero, màu, font, IN HOA ĐẬM, icon và video vào `CLAUDE.md`.
- [ ] Commit tài liệu và mở PR.

**Đầu ra:** bảng file–người phụ trách, commit nguồn, lệnh kiểm tra thực tế. Không sửa trực tiếp mã minify trong HTML để làm bản chính.

### Task 1 — Lịch giao nhau không được che mất

**Ưu tiên:** cao.  
**Phụ trách:** Claude A.  
**Nhánh:** `fix/calendar-overlap`.  
**Phạm vi nguồn:** module lịch ngày/tuần; API `staff.appointments.create/reschedule`; xử lý xác nhận yêu cầu thành lịch. File cụ thể lấy từ Task 0.

**Đầu vào:** người phụ trách, thời điểm bắt đầu, thời lượng, trạng thái và ID lịch.  
**Đầu ra:** nhận diện giao nhau dùng chung, cảnh báo rõ và bố cục hiển thị đủ mọi lịch.

- [ ] Viết kiểm thử tái hiện hai lịch cùng bác sĩ 09:00–09:30; xác nhận kiểm thử hiển thị thất bại trên bản hiện tại.
- [ ] Nhận diện giao nhau bằng `startA < endB && startB < endA`, loại lịch đã hủy và loại chính lịch đang sửa.
- [ ] Dùng chung quy tắc cho tạo, xác nhận yêu cầu và đổi lịch. Đề xuất mặc định: cảnh báo và yêu cầu xác nhận chủ đích khi có trùng, không âm thầm lưu.
- [ ] Chia các lịch giao nhau thành làn cạnh nhau; nếu không đủ rộng, có nhóm hiển thị số lượng và mở được đầy đủ danh sách.
- [ ] Kiểm thử lịch 09:00–09:30 với 09:15–09:45 là giao nhau; 09:30–10:00 là liên tiếp; người phụ trách khác không báo trùng.
- [ ] Kiểm thử lịch chưa phân công và cùng lúc hai phiên thêm lịch; không coi tất cả lịch chưa phân công là một bác sĩ.
- [ ] Chạy kiểm tra nền liên quan và build, chụp bằng chứng ngày/tuần/mobile; commit và mở PR.

**Nghiệm thu:** mọi lịch tồn tại đều nhìn thấy và mở được; không còn hai lịch nằm đè hoàn toàn như Mập/Miu trong báo cáo review.

### Task 2 — Video đúng quy chuẩn 20 giây

**Ưu tiên:** trung bình, làm ngay sau hoặc độc lập Task 1 nếu không cùng file.  
**Phụ trách:** Claude A hoặc tài khoản nhận riêng module video.  
**Nhánh:** `fix/inpatient-video-20s`.  
**Phạm vi:** xác thực video, upload, UI hướng dẫn, phát video, hết hạn/xóa và kiểm thử.

**Đầu vào:** tệp video thiết bị, metadata thời lượng, thời điểm tải.  
**Đầu ra:** clip hợp lệ đến 20 giây, phát tắt âm, ngày hết hạn thống nhất.

- [ ] Viết kiểm thử video 20 giây đang bị từ chối để tái hiện lỗi trước sửa.
- [ ] Đưa ngưỡng 20 giây vào một hằng số dùng chung cho xác thực và nội dung giao diện.
- [ ] Đọc metadata thật; chặn tệp lỗi hoặc không xác định được thời lượng, không lưu bản ghi thành công giả.
- [ ] Thử clip thực 19,9 giây, 20 giây, 20,1 giây; quy tắc dung sai nếu cần phải được ghi rõ và có kiểm thử.
- [ ] Kiểm tra giới hạn 20 MB, tệp sai định dạng, upload lỗi và retry; không còn bản ghi hoặc tệp mồ côi sau thất bại.
- [ ] Giữ tắt âm khi phát, kiểm tra ngừng chia sẻ và quyền xem đúng chủ nuôi.
- [ ] Kiểm tra trước/đúng/sau thời điểm hết hạn 60 ngày theo cùng quy tắc ngày giờ; đồng hồ giả dùng cho kiểm thử.
- [ ] Chạy kiểm tra liên quan, build; commit và mở PR.

**Nghiệm thu:** clip thực 20 giây được tải/phát; trên 20 giây có phản hồi đúng; giao diện không còn thông báo giới hạn 15 giây.

### Task 3 — Hoàn thiện giao diện từ bộ hiện có

**Phụ trách:** Claude B.  
**Nhánh:** `ui/consistent-components`.  
**Phạm vi:** token UI, thành phần dùng chung và CSS các màn; không sửa logic Task 1–2.

- [ ] Lưu ảnh đối chiếu hero và các màn chính trước thay đổi.
- [ ] Chuẩn hóa góc bo phần mới: nút/ô nhập 4–6px, thẻ/ảnh 8–12px; bảo vệ hero khỏi thay đổi token ngoài ý muốn.
- [ ] Giảm dấu chân trang trí ở sidebar nhân viên; giữ nhận diện logo, màu và icon.
- [ ] Rút gọn phần dẫn/ba bước trên form đặt lịch mobile, đưa người dùng đến ô nhập sớm hơn.
- [ ] Đặt nhãn demo tại vị trí không che chữ hoặc nút, gồm cả khi bàn phím điện thoại mở.
- [ ] Áp dụng đúng Lora/Be Vietnam Pro, có đủ chữ thường, đậm, IN HOA, IN HOA ĐẬM; kiểm tra dấu và ký tự ₫.
- [ ] Dùng Phosphor Duotone nhất quán; icon thao tác có nhãn hoặc tên truy cập rõ.
- [ ] Bỏ đếm số tổng tiền/doanh thu; giữ chuyển động ngắn ở biểu đồ, tab, panel và phản hồi lưu.
- [ ] Kiểm tra 390px, 768px, 1440px, zoom 200% và giảm chuyển động; commit, mở PR kèm ảnh đối chiếu.

**Nghiệm thu:** giao diện mới ăn khớp hero, không tăng số thẻ lồng nhau, không có nút quan trọng bị che. Đây là tinh chỉnh, không phải dựng lại toàn website.

### Task 4 — Kiểm thử nghiệp vụ và quyền còn thiếu

**Phụ trách:** Claude A triển khai kiểm thử; reviewer kiểm tra kết quả.  
**Nhánh:** `test/demo-business-flows`.  
**Phạm vi:** test và các sửa lỗi được phát hiện; thay đổi nghiệp vụ lớn tách PR riêng.

| Luồng | Trường hợp phải chạy | Kết quả mong đợi |
| --- | --- | --- |
| Đặt lịch | Gửi, gửi lại, lỗi ghi, retry | Không mất thông tin; không báo thành công trước khi lưu; không tạo trùng ngoài ý muốn |
| Xử lý yêu cầu | Liên hệ, xác nhận, không liên lạc được, từ chối | Trạng thái nhân viên/khách nhất quán |
| Đổi/hủy lịch | Đổi thời điểm, hủy lịch, lịch đã hủy | Không còn giữ chỗ sai; có lịch sử và quy tắc giao nhau |
| Hồ sơ thú cưng | Hai bé cùng tên, đổi tên | Lịch sử theo ID, không lẫn hoặc mất |
| Tài khoản | Đăng ký trùng đồng thời, đăng xuất, mở lại trang | Trạng thái hợp lệ; không lộ dữ liệu phiên trước |
| Liên kết hồ sơ | Đúng/sai mã, sai chủ, liên kết lại | Không ghép nhầm hồ sơ; người không có quyền bị từ chối |
| Nội trú | Nhập, chuyển chuồng, xuất viện | Không hai ca đang ở cùng một chuồng; trạng thái và phí lưu trú nhất quán |
| Điều trị nội bộ | Giờ sai, thêm/dừng y lệnh, ghi nhận | Dữ liệu hợp lệ; khách không lấy được nội dung nội bộ |
| Nhật ký/video | Nháp, chia sẻ, ngừng chia sẻ | Khách chỉ thấy bản đã chia sẻ, đúng thú cưng và thời hạn |
| Hóa đơn | Nháp, giá mở, tải lại, phát hành | Đơn giá giữ đúng; hóa đơn đã phát hành không bị sửa âm thầm |
| Khoản thu | Thu một phần, nhiều lần, hoàn tác nếu có | Tổng thu, còn nợ và lịch sử đối soát đúng |
| Bảng giá | Sửa/ngừng dùng mục giá | Không đổi số tiền trên hóa đơn cũ đã chốt |
| Báo cáo | Qua ngày/tháng, hoàn tác khoản thu | Tiền đã thu, tiền phát hành và công nợ có định nghĩa rõ, không cộng lẫn |
| Đồng thời | Hai phiên sửa cùng hóa đơn/yêu cầu | Phát hiện phiên bản cũ, hướng dẫn tải lại, không ghi đè âm thầm |
| Truy cập chéo | Khách khác, hóa đơn nháp, Spa xem doanh thu | Bị từ chối ở lớp dữ liệu, không chỉ ẩn nút |

- [ ] Chạy lại toàn bộ lỗi hồi quy ở mục 2.
- [ ] Ghi tên test, kết quả và lỗi chưa giải quyết; giữ riêng “đã kiểm thử” và “chưa kiểm thử”.
- [ ] Chạy test liên quan sau sửa; chỉ chạy bộ đầy đủ ở mốc tích hợp hoặc khi có lý do.
- [ ] Commit và mở PR; không tuyên bố tất cả nghiệp vụ đạt chỉ dựa trên lượt mở trang.

**Nghiệm thu:** các luồng có kết quả cụ thể và không còn lỗi mức cao chưa xử lý trong phạm vi demo.

### Task 5 — Kiểm tra trình duyệt và xuất bản demo bàn giao

**Phụ trách:** Claude B chuẩn bị bản build; reviewer kiểm tra; chủ dự án duyệt.  
**Nhánh:** `qa/demo-release`.

- [ ] Ghi đúng commit đã tích hợp Task 1–4.
- [ ] Chạy typecheck/lint/test/build theo lệnh repo đã xác định.
- [ ] Kiểm tra Chromium máy tính, Safari trên iPhone thật và Firefox; mô phỏng kích thước không thay được Safari thật.
- [ ] Kiểm tra đặt lịch, đăng nhập, tải video, mở hóa đơn/in, cuộn modal và bàn phím mobile.
- [ ] Kiểm tra bàn phím, thứ tự focus, modal trả focus, thông báo lỗi và giảm chuyển động.
- [ ] Kiểm tra bản HTML offline; nếu có bản web, tối ưu ảnh/font và tải theo nhu cầu. Không lấy dung lượng HTML offline làm mục tiêu duy nhất.
- [ ] Xuất demo, changelog, danh sách lỗi còn lại, tài khoản mẫu và hướng dẫn reset dữ liệu demo.
- [ ] Mở PR và để chủ dự án duyệt trước merge; lưu mốc phiên bản có thể quay lại.

**Nghiệm thu M2:** bản demo mới có nguồn truy vết được, vượt các cổng kiểm tra đã nêu, thể hiện đúng phạm vi demo.

## 5. Chia việc cho hai tài khoản Claude

| Chủ sở hữu | Phần việc | File dùng chung cần giữ riêng |
| --- | --- | --- |
| Claude A | Logic/API demo, lịch giao nhau, video, nghiệp vụ và kiểm thử dữ liệu | Mô hình dữ liệu, API contracts, dependency/lockfile |
| Claude B | Component, CSS, responsive, font, icon, animation, kiểm tra hiển thị | Token, layout dùng chung, cấu hình font/icon |
| Người điều phối | Nhận việc, tích hợp PR, tổng hợp tiến độ | Kế hoạch, trạng thái chung và giải quyết xung đột |
| Reviewer | Kiểm tra PR và bản build, tái hiện lỗi | Không sửa cùng file với người đang triển khai |
| Chủ dự án | Duyệt thiết kế/nghiệp vụ, duyệt merge và thời điểm chuyển đổi | Quyết định phạm vi và vận hành |

- Việc chia ở đây là theo phạm vi file, không phải để A/B cùng sửa hai nửa của một file.
- Nếu lịch hoặc video và UI cùng nằm trong một file: giao một người sở hữu file đó; người kia gửi yêu cầu thay đổi trong PR/Issue.
- Nếu Task 1 và Task 2 cùng chạm một module API: làm nối tiếp hoặc một người triển khai cả hai PR.
- Các thay đổi giao diện của Task 1 do người sở hữu module lịch thực hiện; Claude B chỉ định hướng, không đồng thời sửa file.
- Dùng worktree nếu chạy hai nhánh cùng máy. Mỗi worktree có thư mục riêng.
- Issue/PR là nơi nhận việc và báo phần đang sửa giữa các nhánh; `PROGRESS.md` ở một nhánh không tự đồng bộ sang nhánh khác.
- Mỗi phiên cập nhật phần tiến độ của nhánh mình; người điều phối tổng hợp vào nhánh chính sau tích hợp. Không dùng file tiến độ như khóa chỉnh sửa tự động.
- Xác định nhánh đích thật trong repo trước mở PR; không giả định repo hiện đã dùng `main`.

## 6. Mẫu bàn giao mỗi PR

- Vấn đề cụ thể và hành vi sau sửa.
- Commit nguồn, nhánh, file đã chạm.
- Bằng chứng tái hiện trước sửa nếu là bug.
- Test đã chạy và kết quả thực tế.
- Ảnh đối chiếu nếu thay giao diện.
- Rủi ro còn lại, việc chưa kiểm tra, thay đổi dữ liệu nếu có.
- Cập nhật tiến độ và hạng mục tiếp theo.

Một PR nên giải quyết một vấn đề kiểm tra được; không gộp thay font, refactor dữ liệu và sửa lịch vào cùng một PR lớn.

## 7. Các quyết định đề xuất để triển khai ngay

| Chủ đề | Đề xuất hiện tại |
| --- | --- |
| Lịch giao nhau | Cảnh báo + xác nhận chủ đích; hiển thị đủ lịch, không âm thầm bỏ bớt |
| Video | Cho phép clip đến 20 giây; chặn trên ngưỡng; giữ giới hạn tệp riêng |
| Giao diện | Hoàn thiện bộ hiện tại theo hero; giảm góc bo và trang trí ở màn làm việc |
| Số tiền | Hiển thị giá trị ngay, căn phải; không dựa vào tabular-nums nếu font không hỗ trợ |
| Thứ tự | Baseline → lịch → video → UI → nghiệp vụ/quyền → QA → chốt demo |
| Chuyển dữ liệu thật | Có kế hoạch và cổng nghiệm thu riêng, chưa tự chọn nền tảng mới trong đợt sửa này |

Các mục này là đề xuất trong kế hoạch, không ghi là quyết định nghiệp vụ mới đã được chủ dự án xác nhận.

## 8. Sau khi chốt demo: phần dữ liệu thật cần kế hoạch riêng

Các hạng mục dưới đây chưa được chứng minh hoàn thành bằng bản HTML. Không đưa vào cùng PR sửa demo.

| Gói tiếp theo | Nội dung cần làm | Điều kiện bàn giao |
| --- | --- | --- |
| Backend và tài khoản | Lưu trữ tập trung, xác thực, quyền theo bản ghi, khóa phiên bản khi sửa | Hai thiết bị dùng cùng dữ liệu; không đọc/sửa chéo quyền |
| Kho video | Tải an toàn, quyền xem, tắt âm, giữ 60 ngày và xóa theo lịch máy chủ | Xóa đúng hạn dù người dùng không mở ứng dụng; quản lý dung lượng |
| Hóa đơn và đối soát | Giao dịch nhất quán, tránh trùng khoản thu, kiểm tra tổng và công nợ | Số liệu khớp qua nhiều phiên/người dùng |
| Sao lưu/vận hành | Sao lưu, khôi phục thử, nhật ký, xử lý lỗi và phục hồi | Khôi phục được dữ liệu thử, có người phụ trách |
| Nhập GPet | Kiểm kê tệp thật, trường dữ liệu, quan hệ, dữ liệu thiếu/trùng | Nhập thử và đối soát số lượng, lịch sử, công nợ nếu có |
| Nội dung công khai | Ảnh được phép dùng, giới thiệu, dịch vụ, thông tin liên hệ | Chủ bệnh viện duyệt, không còn nội dung minh họa ngoài ý muốn |

### Những nhu cầu toàn hệ thống cần kiểm kê trước khi thay GPet

- Bệnh án/sổ sức khỏe đầy đủ, báo cáo sức khỏe được phép chia sẻ.
- Hàng hóa, lịch sử mua sắm, kho và nghiệp vụ nhập/xuất liên quan.
- Kết nối thiết bị Mindray: kiểm tra khả năng lấy dữ liệu thực tế, không mặc định giao tiếp LAN là đã tích hợp được.
- Lịch làm việc, trực nhật, công việc/checklist và bàn giao ca nếu vẫn thuộc phạm vi chuyển đổi.
- Nhắc lịch, cảnh báo y lệnh/công việc và hỏi đáp hỗ trợ.
- Báo cáo vận hành cần thiết ngoài màn doanh thu hiện có.
- PWA/thông báo và native app là các quyết định riêng; ưu tiên web theo định hướng hiện tại.
- Không thêm QR chuồng đã loại bỏ.

Những mục này là phạm vi cần đối chiếu yêu cầu và repo; không khẳng định đã có hoặc đã bị hủy chỉ vì không thấy trong bản demo.

### Cổng chuyển khỏi GPet

- [ ] Kiểm kê và nghiệm thu đầy đủ các nghiệp vụ cần thay thế.
- [ ] Có mẫu xuất GPet thật; xác nhận định dạng và mức độ đầy đủ từng loại dữ liệu, không mặc định PDF chuyển thành dữ liệu sạch.
- [ ] Nhập thử nhiều lần, có báo cáo lỗi, đối soát và cách xử lý thiếu dữ liệu.
- [ ] Chạy thử với nhiều nhân viên và nhiều thiết bị bằng dữ liệu thử hoặc dữ liệu được phép sử dụng.
- [ ] Chạy song song, đối chiếu nghiệp vụ và số tiền.
- [ ] Có sao lưu, khôi phục thử, đào tạo và hướng dẫn vận hành.
- [ ] Chủ dự án duyệt thời điểm chuyển và phương án quay lại.

## 9. Tiến độ khởi tạo

| Hạng mục | Trạng thái tại lúc lập kế hoạch |
| --- | --- |
| Kiểm kê bản HTML mới và review ban đầu | Đã có bằng chứng review |
| Khóa commit nguồn trong repo | Chưa thực hiện |
| Sửa lịch giao nhau | Chưa thực hiện |
| Sửa giới hạn video | Chưa thực hiện |
| Chuẩn hóa giao diện còn lệch | Chưa thực hiện |
| Kiểm thử đầy đủ nghiệp vụ/quyền | Mới có kiểm tra mẫu; cần bổ sung |
| Safari/iPhone thật, Firefox, accessibility | Chưa nghiệm thu |
| Backend và dữ liệu thật | Chưa xác minh trong đợt review HTML |
| Nhập GPet và thay hệ thống cũ | Chưa nghiệm thu |

**Đợt giao Claude đầu tiên:** Task 0 → Task 1 → Task 2. Khi có bản sửa và kết quả kiểm tra, reviewer xác nhận lại trước khi mở rộng sang các hạng mục tiếp theo.

