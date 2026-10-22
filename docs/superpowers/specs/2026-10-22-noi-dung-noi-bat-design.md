# Nội dung nổi bật trên trang giới thiệu — thiết kế (phần dữ liệu)

Ngày 22/10/2026. Chủ dự án đã duyệt hướng đi trong cuộc trò chuyện cùng ngày ("duyệt"). Đây là yêu cầu số 4 trong bốn yêu cầu chuyển từ nhánh giao diện. Bản này chỉ nói **lớp dữ liệu và quyền** (nhánh `claude/du-lieu`); màn hình đăng bài và hai mục trên trang giới thiệu do nhánh giao diện làm sau, theo mục "Yêu cầu gửi nhánh kia" trong `PROGRESS.md`.

## 1. Việc cần làm

Trang giới thiệu có hai mục do nhân viên tự đăng, khách vãng lai chỉ xem:

- **Sản phẩm nổi bật:** hàng bán lẻ (thức ăn, cát vệ sinh, phụ kiện), không thuốc. Quản lý và Bác sĩ chọn tay, không tự tính từ hóa đơn. Chỉ để xem, không giỏ hàng.
- **Ca bệnh nổi bật:** tiêu đề, câu chuyện ngắn, ảnh. Bắt buộc tick xác nhận chủ nuôi đồng ý. Không tên chủ nuôi, không thuốc, không liều.

## 2. Quyết định

1. **Hai danh sách riêng**, không nối với bảng giá (bảng giá chưa có nhóm "hàng bán lẻ"). Mỗi sản phẩm là một mục tự nhập.
2. **Sản phẩm:** tên (1–60 ký tự), loại (`food` Thức ăn · `litter` Cát vệ sinh · `accessory` Phụ kiện), ghi chú ngắn (0–120, không bắt buộc), giá (số nguyên đồng, 0–100.000.000, không bắt buộc), ảnh (không bắt buộc), bật/tắt hiển thị.
3. **Giá chỉ lưu, chưa hiện công khai.** Hằng `FEATURED_SHOW_PRICE = false` trong `rules/content.ts`; khi chủ dự án gửi bảng giá chỉ cần đổi thành `true` (và nhánh giao diện hiện ô giá). Nhân viên có quyền đăng thấy giá đã nhập.
4. **Ca bệnh:** tiêu đề (1–80), câu chuyện (1–600), tên bé hiển thị (1–30, được đặt tên khác tên thật, **không nối với hồ sơ bé**), loài (Chó · Mèo · Khác), ảnh (không bắt buộc), xác nhận chủ nuôi đồng ý (bắt buộc `true`; không tick thì không lưu được, cả khi tạo lẫn khi sửa). Hệ thống ghi ai tick và lúc nào, chỉ nhân viên có quyền đăng thấy.
5. **Ảnh:** tải từ máy, tối đa 5 MB, tệp ảnh (`image/*`). Lưu trong trình duyệt như video nội trú (khóa `local:img-…`); trình duyệt không lưu được thì báo "Trình duyệt này không lưu được ảnh." Không có ảnh thì giao diện hiện khung "Ảnh minh họa". Ảnh chỉ đọc được khi mục đang hiển thị công khai, hoặc bởi nhân viên có quyền đăng.
6. **Chặn nội dung nhạy cảm tự động** trên mọi chữ nhập (tên, ghi chú, tiêu đề, câu chuyện, tên bé): dùng lại bộ lọc tên thuốc và liều của nhật ký nội trú (`lintCustomerText`), thêm (a) họ tên đầy đủ của bất kỳ khách trong hệ thống (không phân biệt hoa thường, dấu), (b) bất kỳ dãy từ 9 chữ số trở lên (bỏ khoảng trắng, chấm, gạch, ngoặc) — chặn cả số hotline của bệnh viện, vì số đó có sẵn trên trang. Gặp thì từ chối ở đúng ô và nói rõ lý do, không lưu gì.
7. **Quyền mới `content.publish`** — "Đăng nội dung trang giới thiệu": Quản lý và Bác sĩ có sẵn, Spa không; cấp lẻ được. Xem danh sách quản lý và mọi việc ghi cần quyền này.
8. **Giới hạn:** tối đa 30 mục mỗi loại (tính cả mục đang tắt). Có nhật ký thao tác (không ghi nội dung câu chuyện) và kiểm tra phiên bản như các màn khác (hai người sửa cùng lúc → một bên nhận "đã có người sửa").
9. **Công khai (khách vãng lai, khách, nhân viên đều đọc được):** chỉ mục đang bật, mới nhất trước. Trả về: sản phẩm `id, name, category, note, imageKey, sample`; ca bệnh `id, title, story, petName, species, imageKey, sample`. **Không** trả giá (khi còn tắt), xác nhận đồng ý, người đăng, thời gian, phiên bản.
10. **Dữ liệu mẫu:** 4 sản phẩm và 2 ca bệnh, `sample = true` (giao diện ghi nhãn "Nội dung mẫu"), tên có hậu tố "(mẫu)", không thương hiệu thật, không số liệu bịa, không thuốc, chưa có ảnh.

Hai điểm tự quyết (đã nêu khi xin duyệt): ảnh ca bệnh không bắt buộc; mục chưa có ảnh hiện khung "Ảnh minh họa". Thêm một điểm nhỏ: thứ tự hiển thị là mục mới nhất trước, chưa có kéo thả sắp xếp.

## 3. Hợp đồng (chỉ thêm)

- `contracts/enums.ts`: `FEATURED_CATEGORIES`, `FeaturedCategory`, `FEATURED_CATEGORY_LABEL`.
- `contracts/staff.ts`: `StaffFeaturedProductRow`, `StaffFeaturedCaseRow`, `FeaturedProductInput`, `FeaturedCaseInput`, `StaffContentApi` (`staff.content.products` / `staff.content.cases`: `list`, `create`, `update`, `setVisible`, `remove`, `setImage`).
- `contracts/public.ts`: `PublicFeaturedProduct`, `PublicFeaturedCase`, `PublicApi.featured: { products(); cases() }`; facade `featured` trong `src/data/public.ts`.
- `rules/capabilities.ts`: `content.publish`.

## 4. Ngoài phạm vi

Màn hình đăng bài và hai mục trên trang giới thiệu (nhánh giao diện); hiện giá (chờ bảng giá); kéo thả sắp xếp; tự xóa ảnh theo hạn; gắn sản phẩm với món kho.
