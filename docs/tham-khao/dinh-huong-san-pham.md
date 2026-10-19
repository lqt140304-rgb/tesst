# Định hướng sản phẩm: hệ thống Bệnh viện thú y Lê Sơn

**Ngày:** 14/10/2026 · **Người soạn:** Claude, ghi lại yêu cầu do chủ dự án nêu · **Trạng thái:** tài liệu định hướng, **không phải kế hoạch triển khai**. Mục đích: lưu yêu cầu của hệ thống tổng thể để không mất, trong khi giai đoạn 1 chỉ làm một phần nhỏ.

**Quy ước nhãn:** **[Đã chốt]** yêu cầu do chủ dự án nêu · **[Đề xuất]** / **[Lưu ý]** của Claude, cần phản biện · **[Cần chốt]** quyết định còn thiếu · **[Giả định]** chưa xác nhận.

Tài liệu liên quan: [kế hoạch phiên bản đầu](https://github.com/lqt140304-rgb/web-b-nh-vi-n/blob/claude/optimistic-mccarthy-d1d15i/docs/ke-hoach-phien-ban-dau.md) · [tài liệu rà soát tài khoản và form đặt lịch](https://github.com/lqt140304-rgb/web-b-nh-vi-n/blob/claude/optimistic-mccarthy-d1d15i/docs/rasoat-tai-khoan-va-form-dat-lich.md).

---

## 1. Phạm vi: giai đoạn 1 và hệ thống tổng thể

**Nguyên tắc [Đã chốt]:** các chức năng ngoài giai đoạn 1 được ghi là **chưa triển khai trong giai đoạn này**. Chúng **không bị loại bỏ vĩnh viễn**.

| | Nội dung | Tình trạng |
|---|---|---|
| **Giai đoạn 1** | Website giới thiệu; tài khoản khách hàng; hồ sơ thú cưng; form yêu cầu đặt lịch (cùng trang xử lý yêu cầu cho nhân viên) | Đang lập kế hoạch, **chưa được phê duyệt để lập trình** |
| **Hệ thống tổng thể (tương lai)** | Bệnh án, nội trú, chăm sóc, điều trị, video, quản lý công việc, kho, thanh toán và các phân hệ khác | **Chưa triển khai trong giai đoạn 1**; yêu cầu ở mục 3 được lưu tại đây |

Giai đoạn 1 vẫn giữ nguyên các quyết định đã chốt (đặt lịch là gửi yêu cầu, nhân viên gọi xác nhận; không OTP; chống trùng theo phạm vi; sáu trạng thái; dấu nhắc gọi lại). GPet vẫn là hệ thống vận hành chính trong giai đoạn 1. Nhập hoặc đồng bộ dữ liệu GPet là việc của giai đoạn sau.

---

## 2. Cơ cấu nhân sự và phân quyền

**[Đã chốt] Thực tế của bệnh viện:**
- **Không có lễ tân riêng.** Quản lý **kiêm tiếp nhận khách hàng và điều hành**.
- **Bác sĩ kiêm** nhân viên khám, điều trị và chăm sóc.
- **Nhân viên Spa** làm theo nhiệm vụ được phân công.

**Hệ quả cho thiết kế [Đề xuất, theo chỉ đạo của chủ dự án]:**
- Phân quyền theo **khả năng (capability)**, không mặc định "mỗi vai trò là một nhân sự riêng". Một người có thể giữ **nhiều khả năng**, và khả năng có thể thay đổi theo ca, nhiệm vụ.
- Mỗi người dùng **một tài khoản cá nhân** (không dùng chung), để nhật ký truy vết đúng người.
- Các nhóm khả năng gợi ý cho giai đoạn 1 (tên và ranh giới là **[Đề xuất]**, chưa duyệt):
  - Xem và xử lý yêu cầu đặt lịch (tiếp nhận).
  - Quản lý nội dung website (giới thiệu, dịch vụ, bảng giá).
  - Quản lý tài khoản nhân viên và gán khả năng.
  - Thao tác nhạy cảm trên tài khoản khách (đặt lại mật khẩu, giải phóng số, khóa tài khoản).
  - Cấu hình hệ thống (quản trị).
- "Vai trò" như Quản lý, Bác sĩ, Nhân viên Spa chỉ là **bộ khả năng soạn sẵn** để gán nhanh, người dùng có thể giữ nhiều bộ, và bộ có thể chỉnh. Khi hệ thống mở rộng, thêm khả năng mới (xem y lệnh, thực hiện điều trị, giao việc…) mà không đổi cấu trúc phân quyền.
- **[Lưu ý]** Quản lý vừa tiếp nhận vừa giữ quyền thao tác nhạy cảm nghĩa là không có người thứ hai kiểm tra. Giảm bằng nhật ký thao tác, và chủ dự án quyết định ai khác (ví dụ một bác sĩ) giữ khả năng dự phòng.
- **[Cần chốt]** Ai giữ khả năng tiếp nhận yêu cầu ngoài quản lý; ai dự phòng khi quản lý vắng; ai được làm thao tác nhạy cảm.

---

## 3. Yêu cầu của hệ thống tổng thể (chưa triển khai ở giai đoạn 1)

**[Đã chốt]** Các yêu cầu sau do chủ dự án nêu. Chúng **chưa nhất thiết triển khai ở giai đoạn 1** nhưng phải lưu trong tài liệu định hướng.

### 3.1. Phía khách hàng
- Xem **hồ sơ thú cưng**.
- Xem **lịch sử mua sắm**.
- Xem **báo cáo sức khỏe được chia sẻ** (chỉ những báo cáo nhân viên chọn chia sẻ).
- Xem **lịch hẹn**.
- Xem **nhật ký nội trú**.
- Xem **tình trạng chăm sóc chung** và **video**.
- **Không** xem: tên thuốc đã tiêm, liều lượng, giờ tiêm, y lệnh nội bộ.

### 3.2. Phía nhân viên và quản lý
- Nhân viên và quản lý xem **lịch điều trị, thuốc đã thực hiện, giờ thực hiện và y lệnh tiếp theo**, theo phân quyền.
- **Quản lý giao nhiệm vụ**, lập **lịch làm việc** và **lịch trực nhật**.
- Nhân viên có **bảng công việc hôm nay**, **checklist**, **cảnh báo** và **bàn giao ca**.

### 3.3. Video nội trú
- **Mặc định loại bỏ âm thanh.**
- **Tự động xóa sau 60 ngày.**

### 3.4. Điều không làm
- **Không sử dụng chức năng quét QR chuồng.** (Lý do chưa được ghi nhận; không suy đoán.)

---

## 4. Lưu ý của Claude cho các giai đoạn sau [Đề xuất, không chặn giai đoạn 1]

Đây là điều nên nhớ khi tới lúc thiết kế các phân hệ tương lai, để không phải đảo ngược quyết định của giai đoạn 1.

1. **Tách hai lớp dữ liệu từ đầu.** Yêu cầu ở 3.1 đòi hỏi có thông tin khách xem được và thông tin chỉ nhân viên thấy (thuốc, liều, giờ tiêm, y lệnh). Nên thiết kế **bản ghi nội bộ** và **bản trình bày cho khách** tách nhau, mặc định ẩn và chia sẻ có chủ đích, thay vì giấu từng trường bằng giao diện. Quyền phải kiểm tra ở máy chủ và cơ sở dữ liệu.
2. **Điều kiện tiên quyết trước khi khách xem bất kỳ hồ sơ hay lịch sử nào.** Số điện thoại tài khoản **chưa được xác minh** (không OTP). Nếu gắn tự động tài khoản web với hồ sơ khách của bệnh viện theo số điện thoại thì người đăng ký bằng số của người khác sẽ xem được hồ sơ bệnh, mua sắm, nội trú. Vì vậy: **liên kết tài khoản với hồ sơ khách hàng chỉ do nhân viên tạo sau khi xác minh đủ mạnh**, không tự động. Cơ chế này đã nằm trong thiết kế giai đoạn 1 (tách tài khoản web khỏi hồ sơ khách hàng; không tự ghép) và là nền cho các giai đoạn sau.
3. **Video nội trú.**
   - **Dung lượng và chi phí:** video lớn hơn nhiều so với dữ liệu khác. Hạn mức Storage của gói hiện tại (1 GB, theo trang giá Codex đối chiếu) và mục tiêu khoảng 300.000 đồng mỗi tháng cho giai đoạn 1 **không đủ cơ sở để suy ra** có chứa nổi video. Cần ước lượng riêng trước khi cam kết.
   - **Xóa sau 60 ngày** cần cơ chế xóa tự động có kiểm tra; bản sao lưu cơ sở dữ liệu **không** chứa tệp thực trong Storage (đã nêu ở tài liệu rà soát), nên video và dữ liệu xóa cần chính sách sao lưu riêng.
   - **Loại bỏ âm thanh mặc định:** cần quyết định loại bỏ lúc ghi hay lúc xử lý sau, vì khác nhau về quyền riêng tư (âm thanh có thể đã được ghi trước khi xóa).
   - **Quyền riêng tư:** video có thể chứa thú cưng của nhiều khách và cả nhân viên. Khách chỉ nên xem video của thú cưng của mình. Cần xem xét thông báo và đồng ý của khách, và của nhân viên được quay. Chưa có kết luận pháp lý.
4. **Nhật ký nội trú, tình trạng chăm sóc chung:** nội dung "chung" cần quy tắc ai viết, ai duyệt trước khi hiện cho khách, để không lộ y lệnh nội bộ.
5. **Giao việc, lịch làm việc, lịch trực, bàn giao ca:** phụ thuộc mô hình khả năng ở mục 2 (người nhận việc có thể kiêm nhiều nhiệm vụ). Nên thiết kế tập trung vào "nhiệm vụ gán cho người" thay vì "việc của vai trò".
6. **Nhập dữ liệu GPet** (khách, hàng hóa, và dữ liệu khác) vẫn cần vùng đệm, truy vết nguồn, đối soát và chống nhập lặp như đã định hướng từ đầu.

---

## 5. Kiến trúc và chi phí: phạm vi áp dụng

**[Đã chốt, cập nhật 14/10]** Trong phát triển và kiểm thử nội bộ của **website giai đoạn 1** dùng **Vercel Hobby + Supabase Free**, ưu tiên **Next.js**. Chưa mua Vercel Pro hay nâng Supabase khi đang phát triển; **không tự nâng cấp hay phát sinh chi phí khi chưa được chủ dự án đồng ý.** Phương án Cloudflare Workers Paid ở bản trước **đã được thay**.

- Con số này **không được suy rộng** thành chi phí vận hành toàn bộ phần mềm bệnh viện. Nền tảng, gói dịch vụ và chi phí của các phân hệ sau (bệnh án, nội trú, video, kho, thanh toán…) **chưa được ước lượng** và sẽ cần quyết định riêng.
- Phạm vi dự toán 300.000 đồng: dịch vụ vận hành web (hosting, phần cơ sở dữ liệu và email còn trong hạn mức, tên miền phân bổ theo năm, dự phòng nhỏ). Chưa gồm công phát triển, bảo trì, phí AI. Là mục tiêu, không phải trần hóa đơn.
- **Môi trường phát triển khác môi trường vận hành thương mại.** Trước khi đưa website vào hoạt động thương mại phải đánh giá và chọn gói triển khai phù hợp điều khoản sử dụng (Codex nêu Vercel Hobby dành cho mục đích cá nhân, phi thương mại; Claude chưa tự đọc điều khoản). Khi website hoàn thiện, căn cứ lượng truy cập, mức dùng tài nguyên, chi phí và yêu cầu ổn định để đề xuất nâng cấp.
- **Mục tiêu 300.000 đồng mỗi tháng** được đặt khi nền tảng là Cloudflare Workers Paid; **cần xác nhận lại cho vận hành thương mại** vì gói trả phí của Vercel và Supabase có thể cao hơn nhiều (ước tính của Codex, Claude chưa kiểm chứng).
- Kiểm chứng OpenNext/Cloudflare **không còn bắt buộc**; chỉ cần nếu sau này cân nhắc chuyển nền tảng.

---

## 6. Chưa quyết định cho tương lai

- Thứ tự và thời điểm các phân hệ sau giai đoạn 1.
- Nền tảng và chi phí cho video, bệnh án, kho, thanh toán.
- Mức pháp lý và đồng ý liên quan tới video, hồ sơ sức khỏe và dữ liệu nhân viên.
- Cách xác minh mạnh để liên kết tài khoản web với hồ sơ khách hàng.

---

## 7. Danh sách phát triển sau (giao diện)

Các mục dưới đây **tạm hoãn, chưa triển khai trong giai đoạn 1**; không bị loại bỏ vĩnh viễn.

### 7.1. Mèo chuyển đổi ba tư thế giữa các trang

- **Trạng thái [Đã chốt, chủ dự án 14/10]:** tạm hoãn sang giai đoạn phát triển sau. Không triển khai animation hay logic chuyển đổi tư thế mèo trong Hero/Header phiên bản đầu.
- **Tài nguyên:** toàn bộ tài nguyên SVG đã tạo được **giữ lại** để dùng trong tương lai. Hình mèo nếu cần trong Hero hiện tại chỉ dùng **phiên bản tĩnh**.
- **Ưu tiên hiện tại:** hoàn thiện giao diện **Minimal Creative** đã chọn (bố cục gọn, không chồng lấn, responsive, trải nghiệm người dùng). Tính năng này không được làm chậm tiến độ Hero/Header.
- **Khi xem xét lại [Đề xuất của Claude, chưa duyệt]:** nên sau khi Hero/Header được duyệt và phiên bản đầu ổn định; cần cân nhắc hiệu năng (không ảnh hưởng thời gian hiển thị nội dung chính), tùy chọn giảm chuyển động của người dùng, tiếp cận (hình trang trí, không truyền tải thông tin cần thiết), kiểm thử trên điện thoại cấu hình thấp, và cách giữ trạng thái tư thế khi chuyển giữa các trang (phụ thuộc kiến trúc ứng dụng).
- **Cần chốt khi đến lúc:** thứ tự ưu tiên so với các hạng mục khác; ba tư thế tương ứng với những trang hay sự kiện nào.

