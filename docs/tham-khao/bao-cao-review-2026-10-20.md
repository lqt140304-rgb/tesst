# Báo cáo review website Bệnh viện Thú y Lê Sơn

- **Ngày review:** 20/10/2026.
- **Vai trò:** reviewer độc lập về chức năng và thiết kế.
- **Repository:** https://github.com/lqt140304-rgb/tesst
- **Nhánh được kiểm tra:** `claude/focused-pascal-rfxnnp`.
- **Commit được kiểm tra:** `8f013448d043c87767d664eb53879a08805ea3ec`.
- **Phạm vi sản phẩm:** bản demo đầy đủ luồng tương tác, dùng dữ liệu mẫu lưu trong trình duyệt; backend thật triển khai sau.
- **Thao tác thực hiện:** đọc tài liệu yêu cầu và mã nguồn, chạy kiểm tra kỹ thuật, dựng bản web và tái hiện lỗi. Không sửa mã nguồn sản phẩm, không tạo commit.

> Báo cáo phản ánh phiên bản tại commit trên. Nhận xét thiết kế là đánh giá chuyên môn mang tính định tính; lỗi chức năng bên dưới đã có kiểm chứng tái hiện.

## 1. Kết luận reviewer

**Giao diện có nền tảng tốt, nhưng cần sửa 4 lỗi chức năng trước khi chốt bản demo.**

Màu sắc, kiểu chữ và các thành phần khá nhất quán; nút đặt lịch rõ; khu nhân viên có bố cục dễ theo dõi. Những lỗi tìm thấy chủ yếu nằm ở xử lý dữ liệu và các tình huống chưa được bộ kiểm thử hiện tại bao phủ.

Về định hướng hình ảnh, thiết kế hiện thiên về thương hiệu chăm sóc thú cưng cao cấp hơn là một bệnh viện thú y có chuyên môn mạnh. Nếu muốn hướng đến phong cách bệnh viện quốc tế, nên giảm một phần trang trí và tăng bằng chứng chuyên môn, đồng thời giữ sự thân thiện hiện có.

## 2. Phạm vi và kết quả kiểm tra

### 2.1. Căn cứ đánh giá

- README và tài liệu quyết định trong repo, đặc biệt `docs/thiet-ke/QUYET-DINH.md`.
- Phạm vi P0/P1 đã chốt trong repo.
- Mã nguồn tại commit được nêu ở đầu báo cáo.
- Bản build chạy tại môi trường kiểm tra.
- Các màn đã quan sát: trang chủ máy tính và điện thoại, phần dịch vụ, khu nhân viên và trình sửa hóa đơn.

Các tính năng đã được xác định dành cho đợt P1 không bị tính thành lỗi chỉ vì chưa xuất hiện trong bản P0.

### 2.2. Kết quả kỹ thuật được xác nhận

| Hạng mục | Kết quả |
|---|---|
| TypeScript — `npm run typecheck` | Đạt |
| ESLint — `npm run lint` | Đạt |
| Unit test sẵn có — `npm test` | 238/238 đạt |
| Build web — `npm run build` | Đạt |
| Build Artifact — `npm run build:artifact` | Đạt |
| Giới hạn dung lượng — `npm run budgets` | Đạt |
| Nhóm E2E Chromium được xác nhận hoàn tất | 17/17 đạt |
| Kiểm chứng bổ sung của reviewer | Tái hiện được 4 lỗi chức năng bên dưới |

Nhóm 17 E2E được xác nhận gồm `boot.spec.ts`, `staff-b.spec.ts` và `customer-b.spec.ts` trên cấu hình desktop Chromium. Các luồng được kiểm tra bao gồm nội trú, nhật ký, hóa đơn, thanh toán, trạng thái chưa liên kết và phân quyền.

**Giới hạn xác nhận:** chưa có kết quả hoàn tất được xác nhận cho toàn bộ bộ E2E; không suy rộng 17 bài đạt thành toàn bộ hệ thống không có lỗi. Cấu hình máy chủ thử nghiệm được điều chỉnh tạm sang `127.0.0.1` để trình duyệt kết nối được trong môi trường review. Chưa kiểm tra Safari trên iPhone thật hoặc bản Artifact đang đăng. Kiểm tra video trong E2E không thay thế việc xác nhận phát video thực tế trên từng thiết bị.

## 3. Lỗi chức năng đã kiểm chứng

Cả bốn lỗi được xếp mức **trung bình trong phạm vi bản demo**. Thứ tự dưới đây là thứ tự đề xuất xử lý; đây không phải danh sách đầy đủ mọi lỗi có thể tồn tại.

### F01 — Mở lại hóa đơn nháp làm mất ô sửa đơn giá

**Mức độ:** trung bình.

**Cách tái hiện:**

1. Đăng nhập bằng tài khoản có quyền lập hóa đơn.
2. Tạo hóa đơn nháp, thêm dịch vụ “Thủ thuật theo chỉ định”.
3. Nhập đơn giá, ví dụ 123.000 ₫, rồi lưu nháp.
4. Tải lại trang hoặc mở lại hóa đơn nháp.

**Kết quả thực tế:** giá đã lưu vẫn còn, nhưng ô nhập đơn giá biến mất. Không thể sửa đơn giá trực tiếp trên dòng đó dù hóa đơn vẫn là bản nháp.

**Kết quả mong muốn:** dịch vụ nhập giá thủ công vẫn cho sửa đơn giá khi mở lại bản nháp.

**Nguyên nhân:** hàm `linesOf()` gán `price_mode: 'fixed'` cho mọi dòng hóa đơn được nạp lại, làm mất phân biệt giữa giá cố định và giá nhập thủ công.

**Vị trí:** [src/features/staff/invoices/DraftEditor.tsx, dòng 18–20](https://github.com/lqt140304-rgb/tesst/blob/8f013448d043c87767d664eb53879a08805ea3ec/src/features/staff/invoices/DraftEditor.tsx#L18-L20).

**Hướng sửa:** giữ hoặc khôi phục đúng loại giá của dịch vụ khi dựng lại dòng hóa đơn. Bổ sung bài kiểm thử lưu → tải lại → sửa đơn giá → lưu tiếp.

### F02 — Lịch hẹn thú cưng được ghép theo tên thay vì ID

**Mức độ:** trung bình.

**Cách tái hiện:**

- Trong tài khoản có lịch hẹn cho bé Miu, tạo thêm một bé khác cũng tên “Miu”; mở hồ sơ bé mới.
- Với thú cưng tự thêm có yêu cầu đặt lịch, đổi tên bé rồi mở lại lịch hẹn trong hồ sơ bé.

**Kết quả thực tế:** bé mới trùng tên có thể hiển thị lịch hẹn của bé cũ trong cùng tài khoản; đổi tên bé khiến lịch hẹn không còn xuất hiện trong trang hồ sơ của bé đó.

**Kết quả mong muốn:** lịch hẹn luôn thuộc đúng thú cưng, độc lập với tên hiển thị.

**Nguyên nhân:** `customer.pets.get()` lọc bằng `r.petName === pet.name`.

**Vị trí:** [src/data/mock/api/customer/index.ts, dòng 139–146](https://github.com/lqt140304-rgb/tesst/blob/8f013448d043c87767d664eb53879a08805ea3ec/src/data/mock/api/customer/index.ts#L139-L146).

**Hướng sửa:** liên kết và lọc bằng `pet_id` hoặc `account_pet_id`, xử lý ánh xạ khi hồ sơ web được ghép với hồ sơ bệnh viện. Bổ sung kiểm thử hai bé trùng tên và đổi tên sau khi đặt lịch.

**Phạm vi ảnh hưởng đã xác nhận:** nhầm lịch giữa các bé trong cùng tài khoản; chưa có bằng chứng từ lỗi này về truy cập lịch của tài khoản khác.

### F03 — Y lệnh chấp nhận giờ không hợp lệ

**Mức độ:** trung bình.

**Cách tái hiện:**

1. Mở hồ sơ nội trú bằng tài khoản có quyền điều trị.
2. Chọn “Thêm y lệnh”.
3. Nhập chỉ định và giờ thực hiện `25:99`.
4. Lưu y lệnh.

**Kết quả thực tế:** lưu thành công, `25:99` xuất hiện trong danh sách giờ thực hiện. Với chuỗi không khớp mẫu, phần nhập sai còn có thể bị bỏ qua âm thầm.

**Kết quả mong muốn:** từ chối thời gian không tồn tại và chỉ rõ phần cần sửa.

**Nguyên nhân:** biểu thức kiểm tra chỉ xác nhận hình thức số và dấu hai chấm, không kiểm tra giới hạn giờ/phút. API tạo y lệnh cũng chưa chặn giá trị này.

**Vị trí giao diện:** [src/features/staff/inpatient/InternalTab.tsx, dòng 168–174](https://github.com/lqt140304-rgb/tesst/blob/8f013448d043c87767d664eb53879a08805ea3ec/src/features/staff/inpatient/InternalTab.tsx#L168-L174).

**Hướng sửa:** dùng chung bộ xác thực giờ ở giao diện và API; giới hạn giờ 00–23, phút 00–59; không âm thầm loại bỏ phần nhập sai. Bổ sung các trường hợp `25:99`, `08:60` và chuỗi sai định dạng.

### F04 — Đăng ký đồng thời có thể tạo tài khoản trùng username

**Mức độ:** trung bình.

**Cách tái hiện đã kiểm chứng:** gửi hai yêu cầu đăng ký đồng thời, cùng username hợp lệ và hai số điện thoại khác nhau.

**Kết quả thực tế:** cả hai yêu cầu thành công, tạo hai bản ghi cùng tên đăng nhập.

**Kết quả mong muốn:** chỉ một yêu cầu được tạo tài khoản; yêu cầu còn lại nhận thông báo tên đăng nhập đã được dùng.

**Nguyên nhân:** kiểm tra trùng diễn ra trước bước `await hashPassword()`, nhưng không được thực hiện lại trong giao dịch ghi dữ liệu. Hai yêu cầu có thể cùng vượt qua lần kiểm tra ban đầu.

**Vị trí:** [src/data/mock/api/auth.ts, dòng 80–99](https://github.com/lqt140304-rgb/tesst/blob/8f013448d043c87767d664eb53879a08805ea3ec/src/data/mock/api/auth.ts#L80-L99).

**Ảnh hưởng:** định danh đăng nhập không còn duy nhất, có thể khiến việc tìm đúng tài khoản khi đăng nhập bị sai.

**Hướng sửa:** kiểm tra lại username và số điện thoại trên dữ liệu hiện hành ngay trong giao dịch tạo tài khoản. Khi làm backend thật, cần ràng buộc duy nhất ở cơ sở dữ liệu. Bổ sung kiểm thử đăng ký đồng thời.

## 4. Nhận xét thiết kế và trải nghiệm

### 4.1. Tổng thể

**Điểm tốt:**

- Bảng màu kem–tím–cam hài hòa và có nhận diện riêng.
- Kiểu chữ và cách trình bày tiêu đề tương đối nhất quán.
- Hình ảnh thú cưng tạo cảm xúc, phù hợp với người nuôi.
- Nút đặt lịch nổi bật; khu nhân viên có cấu trúc rõ ràng.

**Điểm cần cân bằng:** thiết kế hiện giàu cảm xúc và trang trí hơn cảm giác chuyên môn, điềm tĩnh của một bệnh viện. Đây là nhận xét về định vị thị giác, không phải lỗi chức năng.

### 4.2. Hero: có dấu ấn, nhưng nhiều yếu tố cùng thu hút mắt

**Điểm tốt:** quỹ đạo tạo nét riêng; tiêu đề phân cấp rõ; nút gửi yêu cầu đặt lịch dễ nhận biết.

**Điểm cần chỉnh:**

- Quỹ đạo, ảnh bay, bóng màu, chữ lớn và khối trong suốt xuất hiện đồng thời khiến thị giác hơi bận.
- Một số ảnh nằm khá gần tiêu đề. Cần bảo đảm vị trí và chuyển động của ảnh luôn hỗ trợ thông điệp.
- Trên điện thoại, phần đầu hơi dài; nên kiểm tra để người dùng nhanh nhận biết nội dung tiếp theo.

**Đề xuất:**

- Giữ quỹ đạo làm điểm nhấn chính.
- Giảm độ đậm đường trang trí, cường độ bóng và số ảnh nổi bật cùng lúc.
- Giữ chuyển động chậm, nhẹ, ít giành sự chú ý với tiêu đề và nút đặt lịch.
- Rà soát chiều cao hero, khoảng cách và thứ tự ưu tiên nội dung trên điện thoại.

### 4.3. Dịch vụ: đồng bộ, nhưng nhiều lớp trang trí

Các thẻ có ảnh, icon và tên rõ ràng; nối tiếp phong cách hero hợp lý.

Tuy nhiên, viền trắng dày, bo góc lớn, nền màu phía sau, bóng và đường quỹ đạo cùng xuất hiện khiến tổng thể hơi “kẹo”, làm giảm sự điềm tĩnh mong muốn ở hình ảnh bệnh viện.

**Đề xuất:**

- Giữ hình dáng thẻ riêng biệt đã chọn, giảm độ dày viền và cường độ bóng.
- Thống nhất vị trí tên, mô tả và nút hành động để dễ so sánh.
- Giữ phân cấp rõ giữa dịch vụ thường và cấp cứu; hành động gọi cấp cứu cần dễ nhận biết.

### 4.4. Tăng bằng chứng tạo niềm tin

Thông điệp cảm xúc hiện nổi bật hơn bằng chứng chuyên môn. Người mới thường muốn biết ai khám, cơ sở ra sao và vì sao có thể tin tưởng giao bé.

Khi có tư liệu thật, nên ưu tiên:

- Ảnh bác sĩ và không gian bệnh viện.
- Thông tin chuyên môn đã xác nhận.
- Quy trình tiếp nhận, khám và cập nhật tình trạng.
- Đánh giá khách hàng có nguồn rõ ràng.

Ảnh minh họa phù hợp để duyệt bố cục; ảnh thật sẽ ảnh hưởng lớn đến độ tin cậy khi ra mắt. Không bổ sung tên bác sĩ, máy móc, số liệu hay thành tích chưa được xác nhận.

### 4.5. Khu nhân viên: cấu trúc thực dụng, cần tăng độ rõ của trạng thái

Thanh bên, tiêu đề, bảng và vùng tổng tiền có tổ chức tốt. Màn hóa đơn dễ phân biệt dữ liệu và hành động chính.

**Đề xuất tinh chỉnh:**

- Giảm họa tiết dấu chân ở thanh bên để nội dung công việc nổi bật hơn.
- Tăng độ rõ của chữ phụ và thông tin quan trọng.
- Phân biệt rõ trạng thái đang chọn, đang lưu và có thay đổi chưa lưu.
- Kiểm tra sự nhất quán của nút chính, nút phụ và thao tác có tính chất hủy/xóa.

Các đề xuất này cần được duyệt bằng bản xem trực quan trước khi triển khai.

## 5. Thứ tự xử lý đề xuất

| Thứ tự | Công việc | Mục tiêu |
|---|---|---|
| 1 | Sửa F01: khôi phục đúng loại giá khi mở lại hóa đơn nháp | Hoàn thiện thao tác chỉnh hóa đơn |
| 2 | Sửa F02: liên kết lịch hẹn bằng ID thú cưng | Tránh nhầm lịch hoặc mất lịch trong hồ sơ bé |
| 3 | Sửa F03: xác thực giờ y lệnh | Ngăn dữ liệu thời gian không hợp lệ |
| 4 | Sửa F04: kiểm tra trùng trong giao dịch đăng ký | Bảo đảm định danh tài khoản duy nhất |
| 5 | Giảm bóng, viền và lớp trang trí trên hero/dịch vụ | Tăng độ tinh gọn và tập trung |
| 6 | Tăng độ rõ trạng thái thao tác ở khu nhân viên | Giúp nhân viên nhận biết kết quả hành động |
| 7 | Thay dần ảnh minh họa bằng tư liệu thật đã xác nhận | Tăng niềm tin và cảm giác chuyên môn |
| 8 | Kiểm tra lại trên Safari iPhone thật và bản Artifact đang đăng | Xác nhận trải nghiệm trong môi trường sử dụng thực tế |

## 6. Tiêu chí kiểm tra lại sau khi sửa

- Hóa đơn nháp có dịch vụ nhập giá thủ công vẫn sửa được đơn giá sau khi tải lại.
- Hai thú cưng trùng tên có lịch sử riêng; đổi tên không làm mất liên kết lịch hẹn.
- Giờ y lệnh sai bị từ chối với thông báo rõ; giờ hợp lệ được lưu đúng.
- Hai đăng ký đồng thời không tạo username hoặc số điện thoại trùng.
- Các kiểm tra TypeScript, lint, unit và nhóm E2E liên quan tiếp tục đạt.
- Mọi thay đổi thiết kế được xem lại ở desktop và điện thoại; hiệu ứng không làm giảm khả năng đọc hoặc thao tác.

**Định hướng hoàn thiện:** giữ bản sắc hiện tại, giảm trang trí và tăng bằng chứng chuyên môn. Chưa có cơ sở từ lần review này để yêu cầu thiết kế lại toàn bộ.

