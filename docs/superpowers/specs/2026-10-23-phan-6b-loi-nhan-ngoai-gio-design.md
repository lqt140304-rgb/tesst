# Phần 6B — Lời nhắn, đặt lịch ngoài giờ, ngày lễ (thiết kế)

Ngày: 23/10/2026 · Nhánh: `claude/giao-dien` · Trạng thái: **chờ chủ dự án duyệt bản viết**.

Tiếp nối `docs/superpowers/specs/2026-10-22-phan-6-trang-gioi-thieu-design.md` (đợt 6B, đã duyệt về phạm vi) và các yêu cầu nhánh dữ liệu giao lại trong `PROGRESS.md` ("Lời nhắn đã sẵn dữ liệu"). Dữ liệu đã xong và đã nằm ở nhánh tích hợp: `public.inquiries.submit`, `staff.inquiries.list/markCalled`, `holidays()`, quy tắc `slotsOn`, `OUT_OF_HOURS_SLOT`. Không đổi `src/data`.

## 1. Mục tiêu

1. Khách để lại **lời nhắn** cho Lê Sơn (ngoài giờ, hoặc khi muốn hỏi mua một sản phẩm) mà không phải gọi.
2. Trang **đặt lịch** nói thật về giờ làm việc: chọn giờ ngoài 08:00–21:00 thì không gửi được mà chỉ dẫn gọi hotline; ngày lễ chỉ còn các khung đến 19:00 và có ghi chú.
3. Nhân viên có quyền xử lý yêu cầu **thấy lời nhắn** và bấm "Đã gọi lại".

## 2. Quyết định tôi đề xuất (chủ dự án duyệt hoặc đổi)

1. **Ô lời nhắn là một hộp thoại** ("Để lại lời nhắn") dùng chung, không phải khung dựng sẵn trên trang: gọn, dùng được ở ba nơi, đã có bẫy focus và Esc.
2. **Chọn "Giờ khác (ngoài giờ làm việc)" trên trang đặt lịch** thì: hiện ngay câu cố định của hệ thống ("Ngoài giờ làm việc (08:00–21:00), bạn cần gọi hotline 097 355 51 05 trước nhé."), nút "Gửi yêu cầu" đổi thành **"Gọi 097 355 51 05"** kèm nút phụ **"Để lại lời nhắn"**; mọi thứ khách đã điền được giữ nguyên. Chọn lại khung trong giờ thì nút trở lại như cũ.
3. **Ngày lễ trên trang đặt lịch:** khi ngày khách chọn là ngày lễ, danh sách khung giờ chỉ còn các khung kết thúc trước 19:00 (theo `slotsOn`) và có dòng "Ngày này Lê Sơn làm đến 19:00." Không nói gì về phụ phí.
4. **Lời nhắn cho nhân viên:** một khối "Lời nhắn của khách" ở đầu trang **Yêu cầu đặt lịch**, dưới khối "Khách xin đổi lịch", chỉ hiện cho người có quyền xử lý yêu cầu (Spa không thấy). Mỗi dòng: tên, số điện thoại (bấm để gọi), nội dung, "Hỏi mua: <tên sản phẩm>" nếu có, thời điểm, thẻ "Quá hạn" khi `overdue`, nút **"Đã gọi lại"**. Lọc "Chờ gọi lại" / "Đã gọi lại". Khối ẩn khi không có lời nhắn nào chờ và người dùng không mở danh sách đã gọi.
5. **Khách đã đăng nhập** mở hộp thoại thì tên được điền sẵn từ tài khoản; số điện thoại vẫn phải gõ (tài khoản chỉ lưu số đã che).

## 3. Hộp thoại "Để lại lời nhắn"

- Tiêu đề "Để lại lời nhắn"; lời dẫn "Lê Sơn sẽ gọi lại cho bạn trong giờ làm việc (08:00–21:00)." Khi có `about`: dòng "Bạn hỏi về: <tên sản phẩm>" (chỉ đọc).
- Ô: **Tên của bạn** (1–60), **Số điện thoại** (hợp lệ, ví dụ 0912 345 678), **Lời nhắn** (1–500, có bộ đếm "x/500"). Lỗi theo ô lấy từ `ValidationError.fields` (`name`, `phone`, `text`, `about`); lỗi ở `text` do quá 3 lời nhắn mỗi ngày đã kèm câu nhắc hotline thì hiện nguyên văn.
- Nút "Gửi lời nhắn" (chống bấm đúp, "Đang gửi…"); thành công: nội dung hộp thoại đổi thành "Đã gửi. Lê Sơn sẽ gọi lại cho bạn." và nút "Đóng"; gửi trùng cũng báo "Đã gửi" (dữ liệu trả ok). Tài khoản nhân viên gửi thì thấy câu của hệ thống ("Bạn đang đăng nhập bằng tài khoản nhân viên. Lời nhắn này dành cho khách.") ở dạng lỗi chung của form.
- Không giữ bản nháp sau khi đóng; mở lại là ô trống (trừ tên điền sẵn của khách đăng nhập).
- Dùng `Dialog` hiện có (Esc, bẫy focus, trả focus về nút đã mở); điện thoại là tấm trượt từ dưới.

## 4. Chỗ dùng hộp thoại (6A đã chừa)

- **Đoạn Sản phẩm nổi bật:** nút "Hỏi mua" đổi từ gọi hotline sang mở hộp thoại với `about = tên sản phẩm`; `inquiryAction` trong `Products.tsx` trả `{ kind: 'message', about }`.
- **Đoạn Đặt lịch và liên hệ:** ngoài giờ có thêm nút phụ "Để lại lời nhắn" cạnh "Gọi 097 355 51 05".
- **Đoạn Dịch vụ (CTA):** ngoài giờ, dòng nhỏ có thêm liên kết "hoặc để lại lời nhắn".
- **Trang đặt lịch:** như quyết định 2.

## 5. Trang đặt lịch (`/dat-lich`, `/khach-hang/dat-lich`)

- Ô "Khung giờ" thêm lựa chọn cuối **"Giờ khác (ngoài giờ làm việc)"** (`OUT_OF_HOURS_SLOT`). Hiện ngay (không đợi bấm Gửi) câu cố định ở quyết định 2 dưới ô, vai trò gợi ý; nút Gửi đổi như đã nói. Lỗi của máy chủ về khung giờ vẫn hiện như hiện nay.
- Ngày lễ: truy vấn `bookings.holidays()` khi mở form; chọn ngày lễ thì lọc khung giờ và hiện dòng ghi chú; nếu khách đã chọn một khung không còn hợp lệ sau khi đổi sang ngày lễ thì đưa ô về "Không chọn" và nói rõ một câu ("Khung giờ đã được bỏ chọn vì ngày này Lê Sơn làm đến 19:00.").
- Giữ nguyên toàn bộ phần còn lại của form (chống gửi trùng, đăng nhập, bé đã lưu).

## 6. Trợ năng, chuyển động, nội dung

- Hộp thoại và nút theo kit hiện có; lỗi gắn `aria-describedby`; trang thái gửi thông báo qua vùng `role="status"`.
- Không chuyển động mới ngoài của `Dialog`.
- Chữ tiếng Việt, "bạn", "Lê Sơn"; không "quý khách", không "lễ tân"; giờ 08:00–21:00 và 097 355 51 05 nguyên văn; không nhắc phụ phí lễ.

## 7. Kiểm thử (viết trước)

- Hộp thoại: mở từ ba nơi; tên khách đăng nhập được điền sẵn; trống tên/số/nội dung báo lỗi đúng ô; số sai báo lỗi ở `phone`; quá 500 ký tự bị chặn bởi bộ đếm và lỗi; thành công đổi nội dung và gửi trùng vẫn báo đã gửi; quá 3 lần một ngày báo lỗi ở `text` có hotline; nhân viên bị từ chối với câu của hệ thống; Esc đóng và trả focus; 320 px không cuộn ngang; axe sạch.
- "Hỏi mua": mở hộp thoại có "Bạn hỏi về: <tên>", gửi xong nhân viên thấy lời nhắn kèm tên sản phẩm.
- Trang đặt lịch: chọn "Giờ khác" hiện câu cố định, nút thành "Gọi 097 355 51 05" + "Để lại lời nhắn", dữ liệu đã điền còn nguyên, chọn lại khung trong giờ thì có lại "Gửi yêu cầu"; ngày lễ chỉ còn khung đến 19:00 và có ghi chú; khung đang chọn bị bỏ khi đổi sang ngày lễ.
- Nhân viên: Quản lý và Bác sĩ thấy khối lời nhắn, Spa không; "Đã gọi lại" chuyển dòng sang "Đã gọi lại" với tên người gọi; hai tab bấm cùng lúc thì tab sau được báo "vừa được người khác cập nhật"; quá hạn có thẻ; lọc hai trạng thái; số điện thoại là liên kết `tel:`; 320 px không cuộn ngang; axe sạch.
- Giờ: dùng đồng hồ demo (`setClock`, `openDuringHours` có sẵn) cho ca trong/ngoài giờ.

## 8. Rủi ro đưa vào Review Focus của kế hoạch

1. Gửi lời nhắn hai lần (bấm đúp, Enter hai lần) hoặc mở hộp thoại hai lần chồng nhau.
2. Chọn "Giờ khác" rồi đổi ngày/dịch vụ/bé: nút và câu cố định phải theo đúng lựa chọn hiện tại, không kẹt ở trạng thái gọi.
3. Đổi sang ngày lễ khi đã chọn khung 18–20 hoặc 20–21; đổi lại ngày thường.
4. Khối lời nhắn của nhân viên: danh sách rỗng, rất dài, tên/nội dung rất dài không tách từ, hai người cùng bấm "Đã gọi lại".
5. Hộp thoại ở "Hỏi mua" với tên sản phẩm 60 ký tự trở lên hoặc có ký tự đặc biệt.
6. Nhân viên đăng nhập mở hộp thoại ở trang giới thiệu (bị từ chối đúng câu).

## 9. Không làm trong 6B

Tin nhắn trực tiếp (chat), lịch sử lời nhắn cho khách, phụ phí lễ, thông báo đẩy cho nhân viên, nhắc việc "lời nhắn chờ" trên Tổng quan (có thể làm sau nếu chủ dự án muốn).
