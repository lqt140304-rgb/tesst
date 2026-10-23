# Phần 6C — Màn "Nội dung trang giới thiệu" cho nhân viên (thiết kế)

Ngày: 23/10/2026 · Nhánh: `claude/giao-dien` · Trạng thái: **chờ chủ dự án duyệt bản viết**.

Tiếp nối `docs/superpowers/specs/2026-10-22-phan-6-trang-gioi-thieu-design.md` (đợt 6C) và yêu cầu nhánh dữ liệu giao lại trong `PROGRESS.md` ("Nội dung nổi bật đã sẵn dữ liệu", mục (a)). Dữ liệu đã xong và nằm ở nhánh tích hợp: `staff.content.products` và `staff.content.cases` (`list`, `create`, `update`, `setVisible`, `remove`, `setImage`), quyền `content.publish` (mặc định Quản lý và Bác sĩ; cấp lẻ được), `public.featured.*` đọc lại đúng những mục đang bật. Không đổi `src/data`.

## 1. Mục tiêu

Người có quyền đăng nội dung tự thêm, sửa, ẩn hiện, xóa **sản phẩm nổi bật** và **câu chuyện điều trị** hiện ở trang giới thiệu, kể cả tải ảnh, mà không cần nhờ ai. Bấm "hiện" là mục xuất hiện ngay ở trang công khai (đoạn Sản phẩm nổi bật và đoạn Câu chuyện điều trị của phần 6A).

## 2. Quyết định tôi đề xuất (chủ dự án duyệt hoặc đổi)

1. **Một mục menu mới "Trang giới thiệu"** trong khu nhân viên (icon `image`, đặt sau "Bảng giá" và trước "Báo cáo"), chỉ hiện cho người có `content.publish`; vào thẳng địa chỉ `/nv/trang-gioi-thieu` mà không có quyền thì ra trang "Bạn chưa có quyền" như các màn khác. Tiêu đề trang: **"Nội dung trang giới thiệu"**.
2. **Hai thẻ** trên cùng một trang, thẻ nằm trong địa chỉ (`?tab=san-pham` mặc định, `?tab=cau-chuyen`): **Sản phẩm** và **Câu chuyện**. Mỗi thẻ có nút "Thêm", bộ đếm "Đã dùng x/30 mục" (kể cả mục đang ẩn), và dòng "Xem trang giới thiệu" mở trang công khai ở tab mới.
3. **Danh sách là một bảng dùng chung** (như Bảng giá). Sản phẩm: ảnh nhỏ, tên (+ ghi chú), nhóm, trạng thái hiện/ẩn, "cập nhật bởi … lúc …". Câu chuyện: ảnh nhỏ, tiêu đề, tên bé + loài, trạng thái, "chủ nuôi đồng ý: <tên người tick>, <ngày>", cập nhật. Mục mẫu có thẻ "Nội dung mẫu" (tự mất khi sửa). Mỗi dòng có: **Sửa**, **Ẩn** hoặc **Hiện lại** (làm ngay, không hỏi), **Xóa** (hỏi lại, nói rõ xóa hẳn).
4. **Hộp thoại Thêm/Sửa**: 
   - *Sản phẩm:* Tên (1–60), Nhóm (Thức ăn / Cát vệ sinh / Phụ kiện), Ghi chú (không bắt buộc, ≤120, có bộ đếm), Ảnh. **Không có ô giá** (giá lưu được nhưng chưa hiện ra ngoài, chờ bảng giá của chủ dự án; dòng nhỏ "Giá sẽ có khi Lê Sơn gửi bảng giá").
   - *Câu chuyện:* Tiêu đề (1–80), Tên bé hiển thị (1–30), Loài (Chó / Mèo / Khác), Câu chuyện (1–600, bộ đếm), ô tích **"Chủ nuôi đã đồng ý cho đăng câu chuyện này"** (bắt buộc, tích lại mỗi lần lưu), Ảnh.
   - Dòng nhắc cố định dưới các ô chữ: "Đừng ghi tên thuốc, liều dùng, họ tên khách hay số điện thoại. Hệ thống sẽ từ chối."
5. **Ảnh:** chọn tệp JPG/PNG/WebP ≤ 5 MB, xem trước ngay; "Gỡ ảnh" khi đã có. Khi bấm Lưu, nội dung chữ được lưu trước rồi ảnh được tải sau; nếu ảnh lỗi thì chữ vẫn đã lưu, hộp thoại ở lại ở chế độ Sửa và báo "Đã lưu nội dung, nhưng ảnh chưa tải được: <lý do>" (lỗi ảnh lấy nguyên văn từ hệ thống). Mục không có ảnh hiện khung "Ảnh minh họa" ở trang công khai (đã làm ở 6A).
6. **Lỗi:** mỗi ô hiện câu của hệ thống ngay dưới ô (kể cả câu riêng cho tên thuốc/liều, họ tên khách, số điện thoại); đủ 30 mục thì nút Thêm báo câu "Đã đủ 30 mục. Bạn xóa bớt một mục rồi thêm nhé."; hai người sửa cùng một mục: người sau được báo "vừa được người khác cập nhật", hộp thoại đóng, danh sách tải lại.
7. **Quyền nhóm trong màn Tài khoản nhân viên:** chuyển `content.publish` ra khỏi nhóm "Báo cáo và cài đặt" sang một nhóm mới **"Nội dung"** (chỉ một quyền) trong `settingsView.ts`.
8. **Bài trợ giúp:** ghi yêu cầu cho nhánh dữ liệu thêm bài "Đăng sản phẩm và câu chuyện lên trang giới thiệu" (chữ chờ chủ dự án duyệt, nhãn "Nội dung mẫu").

## 3. Trợ năng, chuyển động, nội dung

- Bảng có chú thích cho trình đọc màn hình; hộp thoại dùng `Dialog` hiện có (Esc, bẫy focus, trả focus); lỗi gắn `aria-describedby`; nút Ẩn/Hiện/Xóa có nhãn nói rõ mục (`aria-label`); điện thoại 320 px: bảng thành thẻ, hộp thoại là tấm trượt từ dưới, không cuộn ngang; tương phản ≥ 4,5:1; chuyển động chỉ của kit hiện có.
- Chữ tiếng Việt, gọi người dùng là "bạn"; nút làm xám thì ẩn nếu không có quyền; không gạch ngang dài; không ghi giờ hay tên nhân viên cho khách (màn này chỉ nhân viên thấy; tên người đăng chỉ hiện trong màn này).

## 4. Kiểm thử (viết trước)

- Quyền: Quản lý và Bác sĩ thấy mục menu và mở được; Spa không thấy mục menu và vào thẳng địa chỉ thì ra trang "chưa có quyền"; cấp lẻ `content.publish` cho Spa (qua màn Tài khoản nhân viên hoặc API) thì thấy.
- Danh sách: dữ liệu mẫu hiện đủ (4 sản phẩm gồm 1 đang ẩn, 2 câu chuyện), thẻ "Nội dung mẫu", bộ đếm "Đã dùng 4/30 mục"; thẻ nằm trong địa chỉ.
- Thêm sản phẩm không ảnh → hiện ở trang công khai; thêm có ảnh → ảnh hiện ở thẻ sản phẩm công khai; ghi chú "400 g" không bị coi là liều; tên thuốc, họ tên khách, số điện thoại bị từ chối đúng ô và đúng câu.
- Thêm câu chuyện: không tích đồng ý thì bị từ chối ở ô tích; tích rồi lưu → hiện ở trang công khai với tên bé, loài; sửa lại mà quên tích thì bị từ chối (tích lại mỗi lần).
- Ẩn → biến mất khỏi trang công khai (và đoạn ẩn hẳn nếu hết); Hiện lại → quay lại; Xóa có hỏi lại và xóa hẳn; sửa mục mẫu thì mất nhãn "Nội dung mẫu".
- Ảnh: tệp không phải ảnh và ảnh quá 5 MB bị từ chối đúng câu; ảnh lỗi sau khi lưu chữ: báo "Đã lưu nội dung, nhưng ảnh chưa tải được…" và mục vẫn đã lưu; "Gỡ ảnh" trả về khung "Ảnh minh họa".
- 30 mục: thêm mục thứ 31 bị từ chối với câu của hệ thống; hai tab cùng sửa một mục → tab sau được báo.
- Trợ năng và điện thoại: axe sạch (màn danh sách và mở hộp thoại), 320 px không cuộn ngang, bàn phím mở/đóng hộp thoại, Esc trả focus.
- Menu: mục "Trang giới thiệu" đúng chỗ, đúng nhãn, mục menu đang chọn đúng khi ở màn này; nhóm quyền mới "Nội dung" hiện ở màn Tài khoản nhân viên và bài kiểm tra nhóm quyền của 5C vẫn qua.

## 5. Rủi ro đưa vào Review Focus của kế hoạch

1. Lưu chữ thành công nhưng ảnh lỗi: trạng thái hộp thoại, bấm Lưu lần nữa không tạo mục thứ hai.
2. Ảnh chọn rồi đổi ý hoặc chọn nhiều lần liên tiếp; URL xem trước phải được thu hồi.
3. Mục đang ẩn có ảnh: người có quyền thấy ảnh trong danh sách, khách không thấy ảnh hay mục.
4. Người mất quyền `content.publish` giữa chừng (Quản lý rút quyền): màn đang mở không crash, thao tác tiếp theo báo lỗi quyền.
5. Câu chuyện dài 600 ký tự, tên có ký tự đặc biệt hoặc rất dài không tách từ: bảng, hộp thoại, trang công khai (đoạn Câu chuyện) không vỡ khung.
6. Bấm Hiện/Ẩn liên tiếp nhanh; xóa mục đang mở trong hộp thoại ở tab khác.

## 6. Không làm trong 6C

Giá sản phẩm và nhãn "bán chạy" (chờ bảng giá và dữ liệu bán hàng), sắp xếp hoặc ghim thứ tự, hẹn giờ đăng, nhiều ảnh cho một mục, trang chi tiết riêng cho câu chuyện hay sản phẩm, ngày đăng và mốc cập nhật kết quả của câu chuyện (đợt sau, cần nhánh dữ liệu), nhắc việc trên Tổng quan.
