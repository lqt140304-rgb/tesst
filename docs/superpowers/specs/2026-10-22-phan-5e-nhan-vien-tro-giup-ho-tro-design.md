# Phần 5E: Trợ giúp và hỗ trợ (khu nhân viên)

Ngày 22/10/2026. Nhánh `claude/giao-dien`. Làm tiếp sau 5D (quyết định R46). Số quyết định tiếp theo: R47.

## 1. Mục tiêu

Nhân viên tự tìm được cách làm, biết vì sao một mục bị chặn, và hỏi hoặc báo được cho người quản lý khi bí; Quản lý nhận và trả lời được. Ba việc:

- **A. Trợ giúp:** các bài hướng dẫn ngắn (tìm được, chỉ hiện bài hợp quyền người xem) và giải thích khi bị chặn.
- **B. Việc đầu tiên:** danh sách vài việc làm quen ở Tổng quan, tự đánh dấu khi người dùng làm thật, ẩn được.
- **C. Hỏi và góp ý:** gửi phiếu (hỏi cách dùng, báo lỗi, góp ý), xem phiếu của mình và câu trả lời; người có quyền `support.inbox` có hộp thư để xem và trả lời.

Chỉ làm giao diện. Dữ liệu (`staff.help`, `staff.support`, `staff.prefs`) đã sẵn từ nhánh dữ liệu; **không đổi `src/data/**`**. Hướng nhìn R43 (Linear 85% + Stripe 15%). Mọi bài trợ giúp mang nhãn "Nội dung mẫu"; chữ bài do nhánh dữ liệu giữ và chờ chủ dự án duyệt.

## 2. Đã có sẵn ở phía dữ liệu (không làm lại)

- `staff.help.articles()` (14 bài đúng quyền), `search(q)` (không phân biệt dấu và hoa thường), `whyNot(feature)` (trả `{ allowed, missing, missingLabels, hint }`, `hint` là câu hoàn chỉnh), `checklist()` (các việc hợp quyền, `done`, `doneCount`, `total`, `hidden`), `markDone(key)` (thêm một mục, không thay danh sách).
- `staff.support.submit/mine/inbox/setStatus/reply`; phiếu trùng đang chờ bị từ chối ("Bạn vừa gửi phiếu này rồi, đang chờ trả lời."); trạng thái Mới, Đang xem, Đã trả lời; trả lời lại được, phiếu đã trả lời không đổi trạng thái tay.
- `staff.prefs`: `onboarding_hidden` (ẩn danh sách). `prefs.save({ onboarding_done })` thay cả danh sách nên giao diện **không bao giờ** gửi khóa này; chỉ `markDone` và `onboarding_hidden`.
- Chưa có bài cho Báo cáo, Cài đặt (hồ sơ, tùy chọn, tài khoản, hệ thống) và Trợ giúp/Góp ý: ghi yêu cầu sang nhánh dữ liệu (mục 9), không chặn 5E.

## 3. Lối vào

Mục **Trợ giúp** (biểu tượng mới `lifebuoy`) ở cuối menu, sau Cài đặt, cho mọi nhân viên: `#/nv/tro-giup`, bí danh `nv-tro-giup`. Trên điện thoại nằm trong tờ "Thêm". Menu tài khoản có thêm dòng **Hỏi hoặc góp ý** đi thẳng tới tab Góp ý. Một trang, các thẻ chuyển (địa chỉ giữ thẻ đang mở, `?tab=`): **Hướng dẫn** · **Góp ý của tôi** · **Hộp thư** (chỉ khi `can('support.inbox')`).

## 4. Tab Hướng dẫn (A)

- Ô tìm (`searchbox` "Tìm trong hướng dẫn"), tìm khi gõ (chờ ngắn, `staff.help.search`), danh sách bài dạng thẻ phẳng: tiêu đề, một dòng tóm tắt, nhãn "Nội dung mẫu".
- Bấm một bài mở nó ngay trong trang (danh sách trái, bài phải ≥ 900 px; điện thoại: bài thay danh sách, có nút quay lại; `?bai=<id>` trên địa chỉ): tiêu đề, tóm tắt, các bước đánh số, nhãn "Nội dung mẫu".
- Không có bài khớp: "Chưa có bài nào khớp. Thử từ khác, hoặc hỏi Quản lý ở tab Góp ý." kèm nút sang tab Góp ý.
- **Khi bị chặn:** màn "Mục này dành cho người có quyền phù hợp" (khi vào một trang thiếu quyền) hiện thêm câu `hint` từ `help.whyNot` của quyền trang đó (và `missingLabels`), cùng liên kết tới bài "Quyền của tôi và vì sao có nút bị ẩn". Nút bị ẩn vẫn là **ẩn, không làm mờ** (quy định đã có); `whyNot` chỉ phục vụ màn bị chặn và bài trợ giúp.

## 5. Việc đầu tiên (B)

- Khối nhỏ ở Tổng quan (dưới "Nhắc việc"), chỉ khi `checklist().hidden === false` và chưa làm hết: tiêu đề "Việc đầu tiên", dòng "Đã làm 3/8", mỗi việc một dòng (dấu tích hoặc vòng tròn rỗng, tên việc, mô tả một câu; việc chưa làm là liên kết tới màn đó), nút **Ẩn danh sách**.
- Khi làm hết: một dòng "Bạn đã làm hết các việc đầu tiên." và nút Ẩn danh sách.
- **Tự đánh dấu khi làm thật:** mỗi việc được gọi `markDone(key)` đúng lúc người dùng làm việc tương ứng, một lần mỗi phiên cho mỗi việc: xem Tổng quan (mở Tổng quan), xem lịch (mở Lịch hẹn), xử lý yêu cầu (bắt đầu liên hệ thành công), mở hồ sơ khách, xem bảng nội trú, viết nhật ký (lưu thành công), lập hóa đơn nháp (tạo thành công), thu tiền (ghi nhận thành công), xem bảng giá. Việc không thuộc danh sách của người đó thì bỏ qua. Hook dùng chung `useMarkDone(key)`/hàm `markDone(key)` không chặn việc chính khi lỗi (lỗi nuốt, không báo).
- **Ẩn:** nút gọi `prefs.save({ onboarding_hidden: true })`. Bật lại ở **Tùy chọn của tôi** (công tắc mới "Hiện danh sách việc đầu tiên" ở khung Màn hình làm việc). Nút "Về mặc định" của Tùy chọn cũng đưa danh sách về như lúc đầu (dữ liệu xóa luôn `onboarding_done`); câu hỏi xác nhận được thêm vế "và danh sách việc đầu tiên".

## 6. Tab Góp ý của tôi (C)

- **Form gửi phiếu:** Loại (nhóm nút: Hỏi cách dùng, Báo lỗi, Góp ý), Tiêu đề (đếm "x/80"), Nội dung (đếm "x/1000"), Màn hình (không bắt buộc, đếm "x/100", điền sẵn tên trang đang xem khi vào từ menu tài khoản hoặc từ một trang bằng `?man=`). Lỗi từ API hiện đúng ô (`kind`, `title`, `body`, `screen`); trùng phiếu hiện dưới form. Gửi được: thông báo "Đã gửi phiếu HT-0005." và form trống.
- **Phiếu của tôi:** danh sách mới nhất trước: mã, loại, tiêu đề, trạng thái (Mới, Đang xem, Đã trả lời bằng nhãn có chữ), ngày gửi; bấm mở chi tiết (nội dung, màn hình, và nếu đã trả lời: "Câu trả lời của {tên người trả lời}", ngày). Phiếu chưa có phiếu nào: "Bạn chưa gửi phiếu nào."

## 7. Tab Hộp thư (`support.inbox`)

- Bộ lọc nhóm nút: Tất cả, Mới, Đang xem, Đã trả lời (`inbox({ status })`); danh sách bảng chung (`DataTable`): mã, loại, tiêu đề, người gửi, ngày, trạng thái. Thứ tự do dữ liệu quyết định (Mới, Đang xem, Đã trả lời; cũ trước).
- Bấm một phiếu mở hộp thoại: nội dung, màn hình, người gửi; nút **Đánh dấu đang xem** (khi Mới); ô **Trả lời** (đếm "x/500") và nút **Gửi trả lời** (trả lời lại được). Gửi `version` đã đọc lúc mở; `ConflictError` → thông báo chuẩn rồi đóng và tải lại. Phiếu đã trả lời không có nút đổi trạng thái.
- Nhãn thẻ: "Hộp thư" kèm số phiếu Mới khi có.

## 8. Quyền, lỗi, trợ năng

- Hướng dẫn và Góp ý: mọi nhân viên. Hộp thư: `support.inbox` (kiểm ở API và ẩn ở giao diện; địa chỉ `?tab=hop-thu` của người không có quyền rơi về Hướng dẫn).
- Tìm kiếm: `role="search"` cho vùng tìm; kết quả thông báo bằng `aria-live` ("Có 3 bài." hoặc "Chưa có bài nào khớp."). Thẻ chuyển là `tablist` có bàn phím. Các ô có nhãn, bộ đếm ký tự đọc được. Điện thoại 320 px không cuộn ngang, cả ở cỡ chữ Lớn và bảng Gọn. Chuyển động theo hệ chung.
- Bài và phiếu là chữ thường, không chèn HTML (hiện bằng văn bản).

## 9. Yêu cầu gửi nhánh dữ liệu (ghi vào `PROGRESS.md`)

Thêm bài trợ giúp (chữ chờ chủ dự án duyệt, nhãn "Nội dung mẫu") cho: Báo cáo vận hành; Cài đặt (Hồ sơ của tôi và đổi mật khẩu, Tùy chọn của tôi, Tài khoản nhân viên và cấp quyền, Cài đặt hệ thống và ngày lễ); Trợ giúp và Góp ý (cách gửi phiếu và xem trả lời, hộp thư cho người có quyền). Không chặn việc của 5E.

## 10. Cấu trúc tệp (dự kiến)

- `src/features/staff/help/`: `HelpPage.tsx`, `ArticlesTab.tsx`, `ArticleView.tsx`, `SupportTab.tsx`, `SupportForm.tsx`, `MyTickets.tsx`, `InboxTab.tsx`, `TicketDialog.tsx`, `ChecklistCard.tsx`, `useMarkDone.ts`, `helpView.ts` (+ test), `Help.module.css`.
- Sửa: `routes.ts` (+ bí danh), `router.tsx`, `staff/index.tsx`, `shell/StaffShell.tsx` (mục menu, dòng trong menu tài khoản), `src/app/system/System.tsx` (màn bị chặn nhận câu giải thích), `dashboard/DashboardPage.tsx` (khối việc đầu tiên), `settings/PrefsPage.tsx` (công tắc, câu hỏi xác nhận), các điểm gọi `markDone` (Lịch hẹn, Khách hàng, Nội trú, Bảng giá, bắt đầu liên hệ, nhật ký, tạo hóa đơn nháp, ghi thanh toán), `src/ui/icons/names.ts` + `scripts/duotone-icons.mjs` (`lifebuoy`), `e2e/manifest.ts`.
- E2E: `e2e/giao-dien-nhan-vien-i.spec.ts` (ba cỡ màn hình).

## 11. Kiểm thử

- Đơn vị `helpView`: đếm ký tự và giới hạn từng ô, nhãn và tông trạng thái, câu "Đã làm x/y", đường dẫn khi vào từ một màn (`?man=`).
- E2E: tìm có dấu và không dấu ra cùng bài; Spa không thấy bài hóa đơn, Quản lý thấy; mở bài, nhãn "Nội dung mẫu"; không khớp có lối sang Góp ý; vào trang thiếu quyền thấy câu giải thích và liên kết bài; việc đầu tiên: tự tích khi làm thật (mở Lịch hẹn, tạo nháp, v.v.), số đếm tăng, ẩn rồi bật lại ở Tùy chọn, Về mặc định đưa về; gửi phiếu (đủ ba loại, lỗi từng ô, đếm ký tự, trùng phiếu), Phiếu của tôi hiện mã mới, Quản lý thấy phiếu trong Hộp thư, đánh dấu đang xem, trả lời, người gửi thấy câu trả lời; hai tab cùng trả lời một phiếu thì tab sau báo xung đột; người không có quyền không thấy tab Hộp thư; axe trên ba thẻ và hộp thoại phiếu; 320 px ở cỡ Lớn và bảng Gọn; bàn phím đi hết các điều khiển.

## 12. Chưa làm trong 5E

Gửi tệp đính kèm hoặc ảnh chụp màn hình trong phiếu; thông báo đẩy khi có trả lời; bài trợ giúp tự viết trong giao diện (chữ do nhánh dữ liệu giữ); nhãn "Mới" nổi trên menu khi có phiếu; trợ giúp cho khách hàng.

## 13. Cần chủ dự án chọn (đề xuất mặc định, nói "ok" là làm theo)

1. **Hộp thư góp ý nằm cùng trang Trợ giúp (một thẻ riêng)** thay vì một mục menu riêng. Đề xuất: cùng trang, vì chỉ vài người dùng và đỡ chật menu.
2. **Việc đầu tiên tự đánh dấu khi làm thật** (không cần bấm tay). Đề xuất: tự đánh dấu.
3. **"Về mặc định" ở Tùy chọn cũng đưa danh sách việc đầu tiên về như lúc đầu** (hiện lại những việc đã làm). Đề xuất: giữ như phía dữ liệu đã làm, và nói rõ trong câu hỏi xác nhận.
