# Rà soát của Claude: tài khoản khách và form đặt lịch (bản 15, sau quyết định hoãn tính năng mèo ba tư thế)

**Ngày:** 13/10/2026, cập nhật 14/10/2026 · **Người soạn:** Claude · **Trạng thái:** bản nháp để Codex, Antigravity và chủ dự án phản biện. Chủ dự án đã chốt: phạm vi chống trùng (mục 4.2), sáu trạng thái yêu cầu (mục 4.2a), xử lý khách gửi lại khi Không liên lạc được (mục 4.2b), cơ cấu nhân sự (mục 6) và, từ bản 13, hạ tầng phát triển (mục 6b). Bằng chứng chạy thật hiện có rất hẹp: phương án A (điện thoại + mật khẩu, không OTP) đăng ký và đăng nhập thành công trên dự án thử với số giả (mục 2); ứng dụng chưa được xây. Các quyết định trên **không** duyệt toàn bộ thiết kế, cơ chế đăng nhập, quy trình khôi phục hay mọi chuyển trạng thái, và **chưa phê duyệt để lập trình**; các mục khác giữ nguyên nhãn.

**Ghi chú về nền tảng triển khai [Đã chốt, chủ dự án 14/10, bản 13]:** trong thời gian phát triển và kiểm thử nội bộ dùng **Vercel Hobby + Supabase Free**, ưu tiên **Next.js**; chưa mua Vercel Pro hay nâng Supabase; trước khi hoạt động thương mại phải đánh giá và chọn gói phù hợp điều khoản sử dụng (mục 6b). Hướng Cloudflare Workers Paid ở bản 9–12 **đã được thay**. Trong tài liệu này, chữ "Next.js" hoặc "máy chủ Next.js" chỉ tầng máy chủ ứng dụng nói chung.

**Quy ước nhãn**
- **[Đã chốt]**: do chủ dự án quyết định.
- **[Đề xuất]**: ý kiến của Claude hoặc Codex, cần phản biện.
- **[Chờ kiểm chứng]**: chưa có căn cứ đủ để khẳng định, phải thử hoặc đọc tài liệu hiện hành.
- **[Cần chốt]**: quyết định còn thiếu.

Không có dữ liệu cá nhân thật. Chưa có mã, chưa mua dịch vụ nào.

---

## 0. Thay đổi so với các bản trước

Các bản trước nằm ở lịch sử git của nhánh. Bản 2 tiếp thu phản hồi của Codex, bản 3 ghi nhận quyết định chống trùng, bản 4 ghi nhận sáu trạng thái yêu cầu, bản 5 ghi nhận cách xử lý khách gửi lại khi Không liên lạc được, bản 6 ghi nhận kết quả Codex xác minh tài liệu Supabase, bản 7 ghi nhận kết quả thử Phone không OTP trên dashboard, bản 8 ghi nhận kết quả Codex kết nối dự án thử và đọc cấu hình Auth công khai, bản 9 ghi nhận kết quả kiểm chứng phương án A, bản 10 ghi nhận Codex xác minh tài liệu Supabase Free và đề xuất vận hành, bản 11 ghi nhận Codex phản biện kế hoạch phiên bản đầu, bản 12 ghi nhận rà soát của chủ dự án về phạm vi và cơ cấu nhân sự, bản 13 ghi nhận quyết định đổi hạ tầng phát triển, bản 14 ghi nhận quyết định phân công, bản 15 ghi nhận quyết định hoãn tính năng mèo ba tư thế, như sau.

| Điểm Codex nêu | Claude xử lý |
|---|---|
| Email nội bộ không phải bí mật; trình duyệt có thể thấy nó (JWT chứa email) | **Chấp nhận.** Bỏ câu "trình duyệt không bao giờ thấy". Chỉ giữ ý: danh tính ngẫu nhiên, không suy ra từ số điện thoại, là lớp phụ chứ không phải bảo vệ chính (mục 3.2). |
| Giới hạn ở đường dẫn Next.js không áp dụng cho API Auth của Supabase | **Chấp nhận.** Phải kiểm tra việc gọi trực tiếp Auth (mục 3.3). |
| Chưa đủ căn cứ loại phương án điện thoại + mật khẩu | **Chấp nhận.** Giữ cả A và B ở trạng thái chờ kiểm chứng; bỏ lời khuyến nghị B (mục 3.1). |
| Gọi lại số đang lưu không chứng minh quyền với tài khoản cũ (số có thể đã cấp lại) | **Chấp nhận.** Tách ba việc: khôi phục tài khoản cũ, giải phóng số, đặt lại mật khẩu (mục 5). |
| Mật khẩu tạm không tự hết hạn; thu hồi phiên chưa chắc có hiệu lực ngay | **Chấp nhận.** Chuyển sang [Chờ kiểm chứng], bỏ lời hứa "mọi phiên mất hiệu lực ngay" (mục 5.3). |
| Câu "bảng không bật RLS là bảng mở" chưa chính xác | **Chấp nhận.** Diễn đạt lại (mục 6). |
| Chống trùng theo phạm vi tài khoản là ngoại lệ so với điều đã chốt | **Chấp nhận.** Bản 2 ghi là ngoại lệ cần duyệt. **Cập nhật bản 3:** chủ dự án đã chọn phương án 1, chống trùng trong từng phạm vi, và chấp nhận ngoại lệ (mục 4.2, **[Đã chốt]**). |
| Giữ phạm vi nhỏ: chưa gộp yêu cầu, đặt hộ, form hỗ trợ riêng, nhiều tầng cảnh báo | **Chấp nhận.** Gỡ các mục này khỏi thiết kế chính, chuyển sang mục 8 "chưa duyệt". |
| Bộ đếm lưu trong PostgreSQL, không mua Redis | **Đồng ý.** |
| **Bản 4:** chủ dự án chốt sáu trạng thái yêu cầu và luồng chính Chờ xác nhận → Đang liên hệ → Đã xác nhận | **Ghi nhận [Đã chốt] ở mục 4.2a.** Thay tập trạng thái gợi ý ở bản trước (Mới, Khách hủy, Nhân viên từ chối…) bằng tên chính thức. Tách ba mốc thời gian, thêm lịch sử thay đổi. Các chuyển trạng thái cụ thể, quyền, mở lại, trạng thái nào giữ khóa chống trùng vẫn **chưa duyệt** và được ghi là [Đề xuất]/[Cần chốt]. |
| **Bản 5:** chủ dự án chọn, cho yêu cầu ở Không liên lạc được mà khách gửi lại giống hệt trong cùng phạm vi: không tạo yêu cầu mới, giữ nguyên trạng thái, **hiện dấu nhắc "Khách vừa gửi lại — cần gọi lại"** kèm thời điểm gửi lại; khi nhân viên bắt đầu liên hệ thì chuyển Đang liên hệ và xóa dấu nhắc | **Ghi nhận [Đã chốt] ở mục 4.2b**, thay hai lựa chọn (a)/(b) ở bản 4. Gỡ khỏi danh sách quyết định còn thiếu và khỏi mục ý tưởng chưa duyệt. **Không thêm trạng thái thứ bảy**: dấu nhắc nằm trên yêu cầu hiện có. Chi tiết kỹ thuật (giới hạn tần suất, email, xử lý đồng thời) là [Đề xuất]/[Cần chốt]. |
| **Bản 6:** Codex báo kết quả xác minh trên tài liệu chính thức (14/10): điện thoại + mật khẩu được hỗ trợ; Auth có giới hạn tần suất riêng theo IP; TOTP cho quản lý không cần SMS; chặn mật khẩu rò rỉ từ gói Pro; đăng xuất không làm token còn hạn mất hiệu lực ngay. Codex đồng ý cách xử lý màn hình cũ bằng số phiên bản và đánh giá hai cách đặt lại mật khẩu. Chủ dự án đã tạo dự án thử, chưa chạy kiểm chứng | **Cập nhật mục 2, 3.3, 3.5, 4.2b, 5.3, 9, 10.** Đây là xác minh tài liệu, **không phải bằng chứng kiểm thử**; Claude chưa tự đọc được các trang tài liệu. Phương án A/B vẫn **chưa chọn**. Ghi nhận điểm mới cần kiểm tra: giới hạn theo IP khi đăng nhập đi qua máy chủ. Cách đặt lại mật khẩu vẫn **chưa duyệt**. |
| **Bản 7:** Codex thử trên dashboard dự án thử `leson-test` (14/10, chủ dự án cho phép): bật Phone provider, tắt Phone confirmations, giữ trống thông tin SMS, bấm Save. **Form không cho lưu**, báo cần Twilio Account SID, Auth Token và Message Service SID. Không nhập thông tin giả, không cấu hình hay gửi SMS; đã hủy thay đổi, cấu hình về như cũ | **Ghi nhận ở mục 2, 3.1, 3.3.** Phương án A **gặp trở ngại ở dashboard**, nhưng **chưa được coi là thử API thất bại** và chưa kết luận A bất khả thi. Phương án B cũng **chưa chạy thử hoặc chọn chính thức**. Không yêu cầu bật lại OTP, không yêu cầu đăng ký Twilio chỉ để vượt qua form. |
| **Bản 8:** Codex kết nối được dự án `leson-test` (trạng thái ACTIVE_HEALTHY; đếm người dùng Auth bằng 0, không đọc mật khẩu hay thông tin cá nhân) và đọc cấu hình Auth công khai bằng khóa công khai: Phone tắt, tự xác nhận điện thoại tắt, Email bật, tự xác nhận email tắt, đăng ký công khai **chưa tắt**. Tiện ích Supabase hiện có **không** có thao tác đọc/ghi cấu hình Auth qua Management API hay API quản trị người dùng. Chưa gọi PATCH, chưa tạo tài khoản thử | **Ghi nhận ở mục 2, 3.3, 9, 10.** Đây là bằng chứng cấu hình hiện tại, **không phải kiểm thử tạo tài khoản hay đăng nhập**. Không kết luận A thất bại; B cũng chưa thử. Bước kế tiếp của A cần cơ chế xác thực Management API do chủ dự án quyết định. |
| **Bản 9:** chủ dự án chạy công cụ kiểm chứng bản 3 và gửi file kết quả cho Codex: cấu hình được chấp nhận, tạo người dùng thành công, đăng ký đạt, đăng nhập đạt, đã hoàn nguyên. Đăng nhập trả về cùng ID với đăng ký; không có nhà cung cấp SMS, không gọi endpoint OTP; số thử là dải số hư cấu. Hai lần thử trước lỗi do đọc Auth trước khi Auth nhận cấu hình (sau chờ 5 giây thì thấy bật). Codex đề xuất A làm hướng chính | **Chuyển "đăng ký và đăng nhập điện thoại + mật khẩu không OTP" từ Chờ kiểm chứng sang Đã kiểm chứng với số giả** (mục 2, 3.1, 3.3, 9, 10). Hướng A là **đề xuất của Codex**, chưa phải phê duyệt toàn bộ cơ chế tài khoản. Các kiểm tra còn lại **giữ chưa chạy**. **Không đổi quyết định đã chốt:** không OTP khách, cả vãng lai và tài khoản gửi form, chống trùng theo phạm vi, sáu trạng thái cùng dấu nhắc gọi lại. Nền tảng khi đó là Cloudflare Workers Paid + Supabase Free (**đã thay ở bản 13** bằng Vercel Hobby + Supabase Free). **Điểm cần kiểm tra lại theo nền tảng/gói** [Đề xuất]: IP khách mà Auth thấy khi đăng nhập đi qua máy chủ (mục 3.5); tính năng theo gói Supabase Free (sao lưu, dung lượng, trạng thái tạm dừng khi không dùng, chặn mật khẩu rò rỉ, TOTP, giới hạn Auth); chỗ lưu bộ đếm giới hạn tần suất; khả năng khôi phục khi mất dữ liệu. |
| **Bản 10:** Codex xác minh tài liệu Supabase Free (14/10): không có sao lưu tự động; có thể bị tạm dừng sau 7 ngày ít hoạt động; hạn mức 500 MB cơ sở dữ liệu, 1 GB Storage, 50.000 người dùng hoạt động/tháng; MFA TOTP có sẵn; chặn mật khẩu rò rỉ không có; chuyển IP khách cho Auth cần khóa bí mật phía máy chủ. Nền tảng khi đó: Cloudflare Workers Paid + Supabase Free (đã thay ở bản 13) | **Ghi nhận ở mục 2, 4.4, 6a, 9, 10.** Đây là **xác minh tài liệu**; **chưa thiết lập sao lưu, thử khôi phục, hay kiểm thử IP trên nền tảng triển khai**. Thêm mục vận hành 6a (sao lưu hằng ngày, cổng "khôi phục thử đạt mới nhận dữ liệu thật", ứng phó khi dự án bị tạm dừng, không báo "đã nhận" khi lưu thất bại). Mục tiêu dự toán khoảng 300.000 đồng mỗi tháng cho dịch vụ vận hành web (không gồm công phát triển, bảo trì, phí AI; không phải trần hóa đơn). Bản này **không bảo đảm** Free đáp ứng vận hành liên tục hay ngân sách ở mọi mức tải. |
| **Bản 11:** Codex phản biện kế hoạch (14/10): ngân sách là khoảng 300.000 đồng **mỗi tháng** (không hỏi lại kỳ tính); sửa thứ tự phụ thuộc giữa kiểm chứng, thiết kế và xây dựng; bổ sung hồ sơ khách và thú cưng vào hạng mục xây dựng; bổ sung độ tin cậy của email; sửa tiêu chí "bản sao không chứa bí mật"; giữ trạng thái quyết định nhất quán | **Chấp nhận cả sáu điểm.** Sửa mục 6a (ngân sách, tính nhạy cảm của bản sao), mục 4.5 (thú cưng, email), mục 9 (phần Management API đã đạt), mục 10 (kịch bản 37d–37h). Kế hoạch được viết lại theo thứ tự mới (`ke-hoach-phien-ban-dau.md`). Phương án A vẫn là **đề xuất của Codex**, chưa phải đã chốt. Brief Hero/Header của Antigravity chưa phải mockup được duyệt. |
| **Bản 12:** chủ dự án rà soát kế hoạch bản 2 và tài liệu bản 11 (14/10): chấp nhận sáu nội dung chỉnh sửa, chưa phê duyệt để lập trình. Yêu cầu: (1) tách rõ giai đoạn 1 và hệ thống tổng thể, chức năng ngoài giai đoạn 1 là chưa triển khai chứ không loại bỏ; (2) không có lễ tân riêng, phân quyền theo khả năng kiêm nhiệm; (3) lưu yêu cầu hệ thống tổng thể vào tài liệu định hướng; (4) nền tảng và chi phí chỉ cho website giai đoạn 1 (khi đó là Cloudflare + Supabase Free, 300.000 đồng/tháng; **đã thay ở bản 13**); (5) hoàn thiện quyết định nghiệp vụ, thiết kế giao diện, mô hình dữ liệu trước khi viết mã | **Chấp nhận cả năm điểm.** Thêm tài liệu mới `dinh-huong-san-pham.md`; đổi thuật ngữ "lễ tân" thành "người tiếp nhận" (khả năng, không phải chức danh) trong các tài liệu; viết lại mục 6 theo khả năng kiêm nhiệm; cập nhật kế hoạch bản 3. Tài liệu này vẫn chỉ phủ **giai đoạn 1**. Không merge vào main, không bắt đầu triển khai chính thức. |
| **Bản 13:** chủ dự án đổi hướng hạ tầng giai đoạn 1 (14/10): (1) Vercel Hobby + Supabase Free trong phát triển và kiểm thử nội bộ; (2) ưu tiên Next.js để triển khai trực tiếp trên Vercel, giảm độ phức tạp; (3) chưa mua Vercel Pro hay nâng Supabase khi đang phát triển; (4) trước hoạt động thương mại phải đánh giá và chọn gói phù hợp điều khoản sử dụng; (5) khi hoàn thiện, căn cứ truy cập, tài nguyên, chi phí, yêu cầu ổn định để đề xuất nâng cấp; (6) không tự nâng cấp hay phát sinh chi phí khi chưa được đồng ý | **Thay Cloudflare Workers Paid bằng Vercel Hobby cho môi trường phát triển** trong mọi tài liệu. **Bỏ yêu cầu bắt buộc kiểm chứng OpenNext/Cloudflare** cho phương án chính (chỉ làm nếu sau này cân nhắc chuyển nền tảng thương mại). Giữ Supabase Free và yêu cầu sao lưu, khôi phục, bảo mật (mục 6a). Thêm **mục 6b** phân biệt môi trường phát triển miễn phí và vận hành thương mại. Các kiểm thử chuyển IP đổi sang Vercel. **Điểm Claude nêu:** mục tiêu 300.000 đồng/tháng được đặt khi nền tảng là Cloudflare; với gói thương mại của Vercel và Supabase, ước tính trước đó của Codex (Claude chưa kiểm chứng) cao hơn nhiều, nên mục tiêu này cần xác nhận lại cho giai đoạn thương mại. Các quyết định nghiệp vụ và yêu cầu hệ thống đã thống nhất giữ nguyên. |
| **Bản 14:** chủ dự án cập nhật phân công (14/10): **Google Antigravity thay Gemini** đảm nhiệm thiết kế UI/UX và dựng giao diện trực quan (responsive, hiệu ứng, demo dữ liệu giả); Claude: phân tích nghiệp vụ, tài liệu, tiêu chí nghiệm thu, rà soát; Codex: lập trình chính thức, tích hợp Supabase, kiểm thử, triển khai Vercel; ChatGPT: điều phối và đánh giá phương án. Antigravity dùng logo do chủ dự án cung cấp, kế thừa nhận diện tím, kem, cam, xanh ngọc, ưu tiên Hero/Header; chủ dự án duyệt giao diện trước khi Codex triển khai chính thức | **Thay "Gemini" bằng "Antigravity"** trong mọi tài liệu; đổi tên brief thành `antigravity-brief-hero.md` và viết lại (logo, nhận diện, demo dữ liệu giả, tiêu chí nghiệm thu mục 7). Cập nhật bảng vai trò trong kế hoạch. **Không đổi quyết định nghiệp vụ.** Tài liệu này không bị ảnh hưởng ngoài việc đổi tên bên thiết kế. |
| **Bản 15:** chủ dự án tạm hoãn tính năng mèo chuyển đổi ba tư thế giữa các trang (14/10): không animation hay logic chuyển tư thế trong Hero/Header bản đầu; giữ toàn bộ tài nguyên SVG; nếu cần hình mèo chỉ dùng bản tĩnh; ưu tiên hoàn thiện giao diện Minimal Creative | **Ghi vào danh sách phát triển sau** (`dinh-huong-san-pham.md` mục 7), cập nhật brief Antigravity và kế hoạch. Tính năng này thuộc giao diện, **không ảnh hưởng** tài khoản, form, trạng thái, phân quyền hay hạ tầng nên tài liệu này không đổi thêm. |

**Điều Claude giữ lại một phần:** danh tính nội bộ ngẫu nhiên vẫn nên dùng nếu chọn B, vì nếu suy ra được từ số điện thoại thì kẻ tấn công đoán được danh tính của người khác. Nó không thay cho việc kiểm tra gọi trực tiếp.

**Lưu ý kiểm chứng:** môi trường của Claude không truy cập được `supabase.com` (lỗi mạng), nên Claude **chưa tự đọc** các trang tài liệu Codex dẫn. Các khẳng định về Supabase trong tài liệu này dựa trên đoạn trích tìm kiếm và phản hồi của Codex, đều cần xác minh trên tài liệu hiện hành.

---

## 1. Những gì đã chốt

- **[Đã chốt]** Đăng ký bắt buộc: tên đăng nhập, số điện thoại, mật khẩu; hồ sơ có tên khách.
- **[Đã chốt]** Tên đăng nhập duy nhất; mỗi số điện thoại một tài khoản; đăng nhập bằng số điện thoại hoặc tên đăng nhập + mật khẩu; tên đăng nhập không có dạng số điện thoại; chuẩn hóa số điện thoại trước khi kiểm tra trùng và đăng nhập.
- **[Đã chốt]** Email không bắt buộc. Không OTP ở bản đầu.
- **[Đã chốt]** Khách vãng lai và khách đăng nhập đều gửi form. Khách vãng lai không bị tự gắn vào tài khoản theo số điện thoại và không tra cứu lịch sử chỉ bằng số điện thoại.
- **[Đã chốt]** Yêu cầu giữ bản chụp thông tin tại thời điểm gửi. Khác thông tin thì tiếp nhận; giống toàn bộ thông tin sau chuẩn hóa thì chống tạo trùng; không dùng riêng số điện thoại để chặn. Gửi form chưa phải đã duyệt lịch.
- **[Đã chốt]** Có trang quản trị và email báo nhân viên. Giữ giới hạn tần suất và kiểm tra dữ liệu phía máy chủ.
- **[Đã chốt]** Chống trùng **trong từng phạm vi**: mỗi tài khoản một phạm vi, mọi khách vãng lai chung một phạm vi (chi tiết mục 4.2). Cùng nội dung gửi ở hai phạm vi khác nhau có thể thành hai yêu cầu; chủ dự án đã hiểu và chấp nhận.
- **[Đã chốt]** Sáu trạng thái yêu cầu: Chờ xác nhận, Đang liên hệ, Đã xác nhận, Không liên lạc được, Đã hủy, Từ chối. Luồng chính: Chờ xác nhận → Đang liên hệ → Đã xác nhận. **Đã xác nhận chỉ nghĩa là đã chốt lịch, không phải khách đã đến, đã khám hay hoàn thành dịch vụ** (mục 4.2a).
- **[Đã chốt]** Khi yêu cầu ở **Không liên lạc được** và khách gửi lại toàn bộ thông tin giống nhau trong cùng phạm vi: không tạo yêu cầu mới, trạng thái giữ nguyên, trang tiếp nhận hiện "Khách vừa gửi lại — cần gọi lại" kèm thời điểm; nhân viên bắt đầu liên hệ thì chuyển Đang liên hệ và xóa dấu nhắc. Thông tin khác thì tiếp nhận yêu cầu mới như quy tắc đã chốt (mục 4.2b).
- **Giới hạn cần ghi rõ:** số điện thoại **chưa được xác minh quyền sở hữu**. Chưa có quy trình được duyệt cho đăng ký nhầm, tranh chấp số, quên mật khẩu.

---

## 2. Tình trạng kiểm chứng Supabase

| Nội dung | Tình trạng |
|---|---|
| Đăng nhập bằng điện thoại cần nhà cung cấp SMS khi muốn xác nhận điện thoại lúc đăng ký | Hai bên cùng thấy trong tài liệu (qua đoạn trích). |
| Đăng nhập bằng điện thoại + mật khẩu; API quản trị tạo tài khoản có tham số xác nhận điện thoại | Codex xác minh tài liệu (14/10): có hỗ trợ; cần nhà cung cấp SMS **nếu muốn xác nhận điện thoại** lúc đăng ký. Có căn cứ ưu tiên thử phương án A trước. **Bản 9: đã chạy thành công trên dự án thử với số giả qua Management API** (dòng "Phương án A" bên dưới). |
| Đăng ký điện thoại + mật khẩu **không gửi SMS** và không cần nhà cung cấp SMS trên bản hosted | **Bản 9: Đã kiểm chứng với số giả, qua Management API (xem dòng "Phương án A" bên dưới).** Trước đó, **đã thử trên dashboard (14/10, dự án thử):** bật Phone provider, tắt confirmations, để trống SMS, bấm Save thì **form từ chối lưu**, yêu cầu Twilio Account SID, Auth Token, Message Service SID. (Phần "chưa kiểm chứng" của lần thử dashboard đã được bản 9 trả lời: lỗi form không có nghĩa A bất khả thi; qua Management API, A chạy được.) |
| Phương án A: đăng ký và đăng nhập Phone không SMS | **Đã kiểm chứng với số giả (14/10, dự án thử `leson-test`).** Chủ dự án chạy công cụ kiểm chứng bản 3 và gửi file kết quả cho Codex: giai đoạn đạt `login_verified`; cấu hình được chấp nhận; tạo người dùng thành công; đăng ký đạt; đăng nhập đạt; đã hoàn nguyên. Management API đọc lại được bật Phone và tự xác nhận. Auth ban đầu vẫn báo hai tùy chọn tắt, **sau khoảng chờ 5 giây thì báo bật**; công cụ chỉ đăng ký khi Auth đã báo bật. Đăng nhập trả về cùng ID với đăng ký. **Không có nhà cung cấp SMS, không gọi endpoint gửi hay kiểm tra OTP.** Số thử thuộc dải số hư cấu NANP, không phải số khách hàng. Hai lần thử trước lỗi do đọc Auth trước khi Auth nhận cấu hình. **Phạm vi:** chỉ chứng minh xác thực điện thoại + mật khẩu không OTP; chưa có tra cứu tên đăng nhập, chưa có số di động Việt Nam, chưa có ứng dụng. |
| Hoàn nguyên cấu hình thử | Theo file kết quả, hai cấu hình Management API đã trở lại giá trị ban đầu và đọc lại thành công. Hoàn nguyên **không xóa tài khoản thử**. Mật khẩu và token phiên không ghi vào báo cáo. Không chạy lại bài đăng ký cùng số thử sau khi đã thành công. |
| Còn **chưa kiểm chứng** sau bản 9 | Số di động Việt Nam và chuẩn hóa 0/+84; tên đăng nhập qua tra cứu phía máy chủ; đăng ký số trùng, khóa đăng ký trực tiếp, tạo tài khoản qua máy chủ; đổi số, đổi hoặc khôi phục mật khẩu, tranh chấp số, thu hồi phiên; giới hạn theo IP khi đi qua máy chủ và khả năng đi vòng tầng ứng dụng; quyền dữ liệu khách/nhân viên, chống trùng form, kiểm thử tải; **khả năng lưu hoặc chỉnh cấu hình Phone không SMS bền vững khi dùng dashboard.** |
| Cấu hình Auth hiện tại của dự án thử `leson-test` | **Đã đọc trực tiếp (14/10)** bằng yêu cầu GET tới điểm cuối cài đặt Auth, dùng khóa công khai: Phone **tắt**; tự xác nhận điện thoại **tắt**; Email **bật**; tự xác nhận email **tắt**; đăng ký công khai **chưa tắt**. Dự án ở trạng thái ACTIVE_HEALTHY; đếm người dùng Auth bằng 0. Đây là cấu hình hiện tại, **không phải kiểm thử tạo tài khoản hay đăng nhập**. Đọc của Claude [Đề xuất]: vì đăng ký công khai chưa tắt, mọi cấu hình cuối cùng phải tắt nó trước khi mở thật (mục 3.3, bước 3); với phương án B, cần xử lý tự xác nhận email cho danh tính nội bộ. |
| Quyền cấu hình Auth qua Management API | Codex xác định: tiện ích Supabase hiện dùng được chỉ gồm truy vấn cơ sở dữ liệu, quản lý dự án, Edge Functions và tra tài liệu; **không có** đọc/ghi cấu hình Auth hay API quản trị người dùng. Management API chính thức có thao tác cập nhật cấu hình Auth với hai trường bật điện thoại và tự xác nhận không SMS; cần xác thực Management API phù hợp, **khóa công khai không thay được quyền này**. Chưa gọi. Không dùng SQL sửa trực tiếp bảng người dùng của Auth, không triển khai hàm quyền cao chỉ để vượt giới hạn. |
| Không có đăng nhập bằng tên đăng nhập có sẵn; dùng tra cứu phía máy chủ | Xác nhận theo đoạn trích. |
| Token truy cập (JWT) được ký chứ không mã hóa mặc định; có thể chứa email | Codex dẫn tài liệu. Claude chấp nhận. |
| Quản trị viên đổi mật khẩu bằng API quản trị (cần khóa quyền cao, chỉ ở máy chủ) | Xác nhận theo đoạn trích. |
| Mật khẩu tạm có hết hạn riêng; ép đổi mật khẩu ở mọi đường truy cập | **Không có sẵn** theo Codex. Phải tự thiết kế và kiểm chứng. |
| Thu hồi phiên có hiệu lực ngay, kể cả token truy cập còn hạn | Codex xác minh tài liệu: **đăng xuất không làm token truy cập còn hạn mất hiệu lực ngay.** Với thao tác cần bảo đảm mạnh, tài liệu mô tả kiểm tra mã phiên với bảng phiên của Auth; thiết kế phải xét cả đường máy chủ và truy cập dữ liệu trực tiếp. Chưa kiểm thử. |
| Giới hạn tần suất của Auth | Codex xác minh tài liệu: Auth có giới hạn riêng; bảng hiện hành nêu endpoint token mặc định **150 yêu cầu/5 phút theo IP**, có dung lượng cho burst. Cần đọc **cấu hình dự án thật** và kiểm tra cách chuyển IP khi đăng nhập qua máy chủ; không mặc định giới hạn của Next.js bảo vệ API Auth trực tiếp. Chưa kiểm thử. |
| Chặn mật khẩu bị rò rỉ | Codex xác minh tài liệu (Password security): tính năng **gói Pro trở lên**. **Bản 10: đối chiếu trang giá, không có trong Free.** Không phải lý do để tự mua Pro; thay bằng chính sách mật khẩu ở mục 3.5. |
| Sao lưu trên Supabase Free | **Bản 10, Codex xác minh tài liệu:** Free **không có sao lưu tự động** do nền tảng cung cấp như Pro. Supabase khuyến nghị Free xuất dữ liệu định kỳ bằng CLI và giữ bản sao ngoài nền tảng. Bản sao cơ sở dữ liệu **không chứa tệp thực của Storage**, chỉ có metadata; ảnh cần sao lưu riêng nếu dùng. Nguồn: https://supabase.com/docs/guides/platform/backups. **Chưa thử xuất rồi khôi phục.** |
| Tạm dừng dự án Free khi ít hoạt động | **Bản 10, Codex xác minh tài liệu:** Free có thể bị tạm dừng khi quá ít hoạt động cơ sở dữ liệu trong 7 ngày; Supabase gửi email trước và sau; mức hoạt động thấp chưa chắc đủ để tránh bị dừng. Nền tảng chạy web (Vercel) không đổi chính sách này của Supabase. Truy cập trang giới thiệu, kiểm tra sức khỏe hay tác vụ sao lưu **không phải bảo đảm** dự án không bị dừng. Nguồn: https://supabase.com/docs/guides/platform/free-project-pausing |
| Hạn mức Supabase Free (trang giá hiện hành) | Codex đối chiếu: cơ sở dữ liệu 500 MB; Storage 1 GB; 50.000 người dùng hoạt động mỗi tháng; MFA cơ bản có sẵn (ứng dụng TOTP); chặn mật khẩu rò rỉ **không** có. Đây là hạn mức dịch vụ, **không phải bằng chứng ứng dụng đã bảo mật hay chịu được tải.** Nguồn: https://supabase.com/pricing |
| Chuyển IP khách cho Auth khi đăng nhập qua máy chủ | **Bản 10, Codex xác minh tài liệu:** Auth giới hạn theo IP và nhận IP chuyển tiếp qua một tiêu đề chuyên dụng cùng khóa bí mật phía máy chủ; phải bật chuyển tiếp IP. Khóa công khai và khóa cũ **không** hỗ trợ cơ chế này; khóa bí mật không được đưa ra trình duyệt. Nguồn: https://supabase.com/docs/guides/auth/rate-limits. **Chưa kiểm thử trên Vercel** (cách Vercel cung cấp IP khách cho tầng máy chủ; nhận IP khách từ hạ tầng tin cậy, không tin tiêu đề do khách giả mạo, Auth nhận đúng IP, khách không làm cạn giới hạn dùng chung); chỉ kiểm tra được khi có phần máy chủ và môi trường thử. |
| Xác thực hai bước không dùng SMS cho tài khoản quản lý | Codex xác minh tài liệu: Supabase hỗ trợ ứng dụng **TOTP**, không cần SMS. **Không thay quyết định bỏ OTP cho khách.** |

Nguồn đã dẫn (Claude chưa đọc toàn văn được):
- https://supabase.com/docs/guides/auth/passwords
- https://supabase.com/docs/guides/auth/jwts
- https://supabase.com/docs/guides/auth/sessions
- https://supabase.com/docs/guides/database/secure-data
- https://supabase.com/docs/reference/javascript/auth-admin-createuser
- https://supabase.com/docs/reference/javascript/auth-admin-updateuserbyid
- https://supabase.com/docs/guides/auth/rate-limits
- https://supabase.com/docs/guides/auth/auth-mfa/totp
- https://supabase.com/docs/guides/auth/password-security
- https://supabase.com/docs/reference/javascript/auth-signout

---

## 3. Mô hình tài khoản [Đề xuất, chờ kiểm chứng]

### 3.1. Hai phương án nền, chưa chọn

Cả hai đều để Supabase Auth lưu và băm mật khẩu. **Chúng ta không tự xây hệ thống lưu mật khẩu.**

- **Phương án A: danh tính là số điện thoại + mật khẩu của Supabase, không gửi SMS.** Đơn giản nếu chạy được. Tên đăng nhập vẫn cần tra cứu phía máy chủ ra số điện thoại. **Cập nhật bản 9 (14/10): A đã chạy được trên dự án thử `leson-test` với số giả**, qua Management API: bật Phone, tự xác nhận, đăng ký và đăng nhập bằng điện thoại + mật khẩu, không OTP, không có nhà cung cấp SMS (chi tiết mục 2). Dashboard vẫn từ chối lưu cấu hình Phone khi để trống Twilio, nên cấu hình này hiện chỉ đặt được qua Management API. **Codex đề xuất dùng A làm hướng triển khai chính** vì đã có bằng chứng chạy được và ít tầng bổ sung hơn B. **Đây là đề xuất của Codex, chưa phải phê duyệt toàn bộ cơ chế tài khoản và chưa phải cam kết vận hành sản xuất.** Không cần thử B chỉ để lặp lại điều đã chứng minh, trừ khi các kiểm tra còn lại phát hiện A không đáp ứng. Đọc của Claude [Đề xuất]: vì dashboard và Management API không thống nhất, cần kiểm tra cấu hình có bền khi ai đó mở hoặc lưu trang Phone trong dashboard (mục 10, kịch bản 37), và nên ghi vào quy trình vận hành là không bấm lưu mục Phone trong dashboard cho đến khi biết hậu quả. Không đăng ký Twilio chỉ để vượt qua form.
- **Phương án B: danh tính nội bộ + tra cứu phía máy chủ.** Mỗi tài khoản có danh tính nội bộ trong Supabase Auth (ví dụ email ngẫu nhiên không suy ra từ số hay tên). Đường dẫn máy chủ nhận "số điện thoại hoặc tên đăng nhập", tra hồ sơ rồi đăng nhập bằng mật khẩu. Không phụ thuộc SMS, nhưng email nội bộ **không phải bí mật** và phải chịu được việc gọi trực tiếp Auth.

**Hướng ưu tiên [Đề xuất của Codex, Claude không phản đối, chưa duyệt chủ dự án]:** A. B giữ làm phương án dự phòng nếu các kiểm tra còn lại ở mục 3.3 phát hiện A không đáp ứng. Không yêu cầu chủ dự án bật lại OTP.

### 3.2. Thực thể (mức khái niệm, chưa phải schema)

- **Danh tính đăng nhập** (Supabase Auth): chỉ danh tính và mật khẩu băm. Không chứa dữ liệu nghiệp vụ. Nếu chọn B, danh tính nội bộ nên ngẫu nhiên và không suy ra từ số điện thoại hay tên đăng nhập, như lớp phụ, **không** coi là bí mật.
- **Hồ sơ tài khoản web** (bảng của ta): tên khách; tên đăng nhập đã chuẩn hóa (duy nhất không phân biệt hoa thường); số điện thoại dạng chuẩn quốc tế (duy nhất trong các tài khoản đang hoạt động); trạng thái số điện thoại (`chưa_xác_minh` là mặc định); email tùy chọn chưa xác minh; trạng thái tài khoản; cờ "phải đổi mật khẩu" nếu giữ cơ chế mật khẩu tạm.
- **Hồ sơ khách hàng** (bản ghi chuẩn của bệnh viện, dùng khi nhập GPet): **chưa tạo ở bản đầu.** Sau này liên kết giữa tài khoản web và hồ sơ khách hàng do nhân viên tạo sau khi xác minh, **không bao giờ tự động theo số điện thoại.**
- **Thú cưng** thuộc tài khoản. **Yêu cầu đặt lịch** giữ bản chụp riêng nên không đổi khi sửa hoặc xóa thú cưng.
- **Nhật ký thao tác nhạy cảm** (đặt lại mật khẩu, giải phóng số, khóa tài khoản): ai, lúc nào, tài khoản nào. **Không ghi mật khẩu hay token.**

### 3.3. Kế hoạch kiểm chứng trước khi chọn A hay B (Codex đề xuất, Claude đồng ý)

Làm trên **dự án thử, dữ liệu giả, cấu hình không gửi SMS**. Chủ dự án đã tạo dự án thử. **[Cần chốt]** dự án thử có phát sinh chi phí không (chủ dự án kiểm tra trên trang thanh toán); không mua thêm gì khi chưa duyệt.

1. Tạo tài khoản bằng điện thoại + mật khẩu mà không gửi SMS: có được không, có cần nhà cung cấp SMS không.
2. Đăng nhập, đổi số, đổi mật khẩu.
3. Tắt đăng ký trực tiếp: có còn tạo được tài khoản từ trình duyệt không.
4. **Gọi trực tiếp API Auth từ ngoài, đi vòng qua đường dẫn Next.js:** giới hạn tần suất nào còn hiệu lực; có thể dò danh tính hay thử mật khẩu bao nhiêu lần.
5. Nội dung token trình duyệt nhận (có email, số điện thoại không).
6. Thu hồi phiên: token truy cập còn hạn dùng được bao lâu sau khi đổi mật khẩu hay đăng xuất.
7. Hành vi khi cùng số điện thoại đăng ký hai lần hoặc hai định dạng khác nhau.
8. **Giới hạn theo IP khi đăng nhập đi qua máy chủ:** Supabase thấy IP nào (IP máy chủ hay IP khách); giới hạn mặc định theo IP có chặn nhầm khách thật hoặc để kẻ tấn công làm cạn giới hạn của mọi khách không; cách chuyển IP khách ra sao.

**Tình trạng (14/10):** chủ dự án đã tạo dự án thử `leson-test`. Codex mới thử đúng một thao tác trên dashboard (bật Phone, tắt confirmations, Save với SMS trống): form không cho lưu, đã hủy thay đổi. **Cập nhật bản 9:** bước 1 đã chạy một phần thành công: tạo tài khoản bằng điện thoại + mật khẩu không gửi SMS **với số giả** và đăng nhập đạt (mục 2). Chưa chạy với số di động Việt Nam. **Các bước 2–8 và phần còn lại của bước 1 vẫn chưa chạy.** Codex đã đọc cấu hình Auth công khai (mục 2) nhưng chưa có công cụ để đọc/ghi cấu hình Auth hay tạo tài khoản thử. **Kế hoạch tiếp tục kiểm chứng A (Codex đề xuất, chỉ trên dự án thử):** đọc cấu hình ban đầu; thử bật Phone và tự xác nhận không SMS qua Management API; đọc lại hai giá trị; nếu chấp nhận thì kiểm thử tài khoản giả; nếu không đáp ứng thì trả cấu hình ban đầu. Không nhập thông tin Twilio giả, không gửi SMS. **Không gửi mã truy cập bí mật vào chat hoặc GitHub.** Nếu thử tiếp B, vẫn giữ yêu cầu tên đăng nhập hoặc số điện thoại + mật khẩu, email khách không bắt buộc, danh tính email nội bộ không coi là bí mật. Cũng cần ghi nhớ: **Không gửi khóa bí mật hoặc mật khẩu trong chat.** Chỉ dùng tài khoản và số điện thoại giả; không gửi SMS, không mua dịch vụ, không sửa dự án sản xuất. Nếu phương án A không đáp ứng thì mới thử B.

### 3.4. Quy tắc tên đăng nhập và số điện thoại [Đề xuất]

**Tên đăng nhập:** khoảng 4–30 ký tự; ASCII, chữ thường, số và vài dấu nối; **phải có ít nhất một chữ cái**; nếu bỏ khoảng trắng, dấu nối và dấu `+` mà thành số điện thoại hợp lệ thì từ chối; chặn từ dành riêng; không phân biệt hoa thường. Nhờ đó một chuỗi nhập luôn thuộc đúng một loại: số điện thoại hoặc tên đăng nhập.

**Số điện thoại:** chuẩn hóa về dạng quốc tế (`0900000001`, `84900000001`, `+84900000001` cùng một khóa); dùng thư viện số điện thoại đã kiểm chứng; **[Cần chốt]** có nhận số cố định không. Chuẩn hóa dùng chung cho đăng ký, đăng nhập, form đặt lịch và chống trùng.

### 3.5. Chống đoán mật khẩu và dò tài khoản

- Thông báo đăng nhập sai chung chung.
- Làm chậm lũy tiến và kiểm tra chống bot sau vài lần sai, thay vì khóa cứng (khóa cứng cho phép kẻ xấu khóa tài khoản người khác).
- **Giới hạn phải đặt ở nơi áp dụng thật**: giới hạn ở đường dẫn Next.js không tự áp dụng cho API Auth của Supabase (mục 3.3, bước 4). Kết quả kiểm chứng quyết định cần thêm biện pháp nào.
- **Giới hạn theo IP của Auth khi đăng nhập qua máy chủ** (Codex nêu): nếu máy chủ Next.js gọi Auth thì Auth có thể chỉ thấy IP của máy chủ, nên mọi khách dùng chung một giới hạn, hoặc kẻ tấn công làm cạn giới hạn của khách thật. Cần kiểm tra cách chuyển IP khách và cấu hình dự án thật trước khi chọn A hay B (mục 3.3, bước 8).
- Đăng ký phải báo "số/tên đã dùng", nên người ngoài dò được số nào đã có tài khoản. Không tránh được khi không có OTP. Giảm bằng chống bot và giới hạn tần suất; ghi nhận đây là rủi ro chấp nhận có chủ đích.
- Mật khẩu: độ dài tối thiểu hợp lý (từ 8, nên 10), cho phép dài, chặn mật khẩu rất phổ biến; chặn mật khẩu bị rò rỉ nếu gói hỗ trợ [chờ kiểm chứng]. Dùng thư viện chính thức của Supabase cho Next.js để quản lý phiên.
- Bộ đếm giới hạn tần suất lưu **trong PostgreSQL** bằng cập nhật nguyên tử, chưa cần dịch vụ riêng.

---

## 4. Form đặt lịch và chống trùng

### 4.1. Bất biến cần giữ và kiểm thử

1. Khách chỉ đọc được yêu cầu thuộc tài khoản của mình. Yêu cầu không có chủ sở hữu tài khoản thì **không khách nào đọc được**.
2. Không có truy vấn dành cho khách nối số điện thoại trong yêu cầu với số điện thoại của tài khoản.
3. Khách vãng lai không có cách xem, tìm hay đoán trạng thái của bất kỳ yêu cầu nào.
4. **Chủ thể của yêu cầu (tài khoản hay vãng lai) chỉ lấy từ phiên đăng nhập đã kiểm tra phía máy chủ.** Không bao giờ tin mã tài khoản hay cờ "vãng lai" do trình duyệt gửi lên. Nếu không có phiên hợp lệ thì chủ thể là vãng lai.

### 4.2. Phạm vi chống trùng **[Đã chốt: phương án 1, chống trùng trong từng phạm vi]**

Chủ dự án đã chọn (xác nhận trong chat Codex ngày 13/10/2026):

- Mỗi tài khoản là một phạm vi riêng. Tất cả khách vãng lai dùng chung một phạm vi.
- Trong cùng phạm vi, nếu toàn bộ thông tin đặt lịch giống nhau sau chuẩn hóa thì **không tạo thêm yêu cầu**, theo các trạng thái được phép áp dụng (trạng thái nào còn giữ khóa: xem mục 4.2a, **chưa duyệt**).
- Khác thông tin thì vẫn tiếp nhận để nhân viên xét duyệt; không tự xác nhận lịch.
- **Ngoại lệ đã được chấp nhận:** cùng nội dung gửi khi vãng lai rồi gửi lại sau khi đăng nhập có thể thành hai yêu cầu.
- Nhân viên kiểm tra khi liên hệ xác nhận. **Không tự gộp, không chuyển chủ sở hữu, không đưa yêu cầu vãng lai vào lịch sử tài khoản.**
- Khách chỉ thấy yêu cầu thuộc tài khoản của mình. Khách vãng lai không tra cứu lịch sử bằng số điện thoại.

**Ví dụ đã được chủ dự án đồng ý** (dữ liệu giả): khách Lan đặt khám cho mèo Miu ngày 20/10.

| Bước | Hành động | Kết quả |
|---|---|---|
| 1 | Chưa đăng nhập, gửi form | Tạo yêu cầu A (phạm vi vãng lai) |
| 2 | Vẫn chưa đăng nhập, gửi lại nội dung giống hệt | Không tạo thêm |
| 3 | Đăng nhập, gửi lại cùng nội dung | Tạo yêu cầu B (phạm vi tài khoản) |
| 4 | Đang đăng nhập, gửi lại giống B | Không tạo thêm |
| 5 | Đổi ngày mong muốn sang 21/10 | Tạo yêu cầu mới |

Nhân viên thấy A và B. Khách chỉ thấy B trong tài khoản.

**Hệ quả thiết kế:** khóa chống trùng gồm **phạm vi** (mã tài khoản đã kiểm tra phía máy chủ, hoặc giá trị cố định "vãng lai") cộng các trường đã chuẩn hóa. Chống trùng không bao giờ vượt qua ranh giới giữa các phạm vi, nên không lộ chéo và không gắn yêu cầu vãng lai vào tài khoản.

**Phạm vi của quyết định này:** chỉ chốt phạm vi chống trùng. Chưa duyệt toàn bộ thiết kế, cơ chế đăng nhập (phương án A/B) hay quy trình khôi phục tài khoản. Phạm vi chống trùng không đổi sau khi chốt trạng thái ở mục 4.2a: từng tài khoản riêng, khách vãng lai chung một phạm vi, không tự ghép chủ sở hữu.

### 4.2a. Trạng thái yêu cầu **[Đã chốt: sáu trạng thái và luồng chính]**

| Trạng thái | Ý nghĩa |
|---|---|
| Chờ xác nhận | Khách vừa gửi yêu cầu, nhân viên chưa xử lý. |
| Đang liên hệ | Nhân viên đang gọi hoặc trao đổi với khách để xác nhận. |
| Đã xác nhận | Khách và nhân viên đã thống nhất ngày, giờ hẹn; nhân viên ghi nhận vào hệ thống. |
| Không liên lạc được | Nhân viên đã liên hệ nhưng chưa gặp được khách; có thể liên hệ lại. |
| Đã hủy | Khách báo không đến hoặc yêu cầu hủy; nhân viên ghi nhận. |
| Từ chối | Bệnh viện không thể tiếp nhận yêu cầu; nhân viên ghi lý do. |

**Luồng chính [Đã chốt]:** Chờ xác nhận → Đang liên hệ → Đã xác nhận. Nếu chưa liên lạc được thì chuyển sang Không liên lạc được; khi liên hệ lại có thể tiếp tục xử lý để xác nhận. Hủy và từ chối phải ghi lý do.

**Đã xác nhận chỉ nghĩa là đã chốt lịch.** Không có trạng thái "đã đến", "đã khám", "hoàn thành" hay bệnh án trong bản đầu; không thêm qua quyết định này. Giao diện và thông báo không được dùng từ ngụ ý khách đã được khám.

Ví dụ (dữ liệu giả, khách Lan đặt khám cho mèo Miu ngày 20/10): gửi form → Chờ xác nhận; người tiếp nhận bắt đầu liên hệ → Đang liên hệ; thống nhất 09:00 ngày 20/10 → Đã xác nhận; gọi không nghe → Không liên lạc được, gọi lại được; khách báo không đến → Đã hủy; bệnh viện không có dịch vụ yêu cầu → Từ chối, ghi lý do.

**Ba mốc thời gian phải tách riêng [Đã chốt về nguyên tắc, Đề xuất về tên trường]:**
1. **Ngày khách mong muốn:** khách nhập khi gửi, nằm trong bản chụp, không bao giờ bị nhân viên sửa đè.
2. **Ngày và giờ hẹn đã thống nhất:** nhân viên nhập khi chuyển sang Đã xác nhận, **bắt buộc đủ cả ngày lẫn giờ**. Có thể khác ngày khách mong muốn.
3. **Thời điểm nhân viên thực hiện xác nhận:** hệ thống tự ghi, cùng người thực hiện. Không nhập tay.

**Lịch sử thay đổi trạng thái [Đề xuất theo yêu cầu của chủ dự án]:** chỉ ghi thêm, không sửa. Mỗi lần đổi ghi: người thực hiện, thời điểm, trạng thái cũ, trạng thái mới, lý do (**bắt buộc khi chuyển sang Đã hủy hoặc Từ chối**). Chống hai người tiếp nhận ghi đè nhau: kiểm tra số phiên bản khi lưu; người đến sau nhận thông báo tải lại.

**[Cần chốt]** lý do hủy/từ chối là văn bản tự do, danh mục có sẵn, hay cả hai; có hiện lý do cho khách không.

#### Những điều **chưa được duyệt** (không coi là đã chốt)

Chủ dự án nêu rõ quyết định trạng thái không tự duyệt các mục sau:

- **Bảng chuyển trạng thái hợp lệ.** Đề xuất của Claude để phản biện:

  | Từ | Được chuyển sang |
  |---|---|
  | Chờ xác nhận | Đang liên hệ, Đã hủy, Từ chối |
  | Đang liên hệ | Đã xác nhận, Không liên lạc được, Đã hủy, Từ chối |
  | Không liên lạc được | Đang liên hệ, Đã hủy, Từ chối |
  | Đã xác nhận | Đã hủy |
  | Đã hủy, Từ chối | (trạng thái cuối trong bản đầu) |

  Chuyển ngược từ Đã xác nhận và mở lại yêu cầu đã hủy hoặc từ chối: **[Cần chốt]**, kèm quyền thực hiện (người tiếp nhận hay quản lý).
- **Trạng thái nào còn giữ khóa chống trùng** (trong cùng phạm vi). Riêng **Không liên lạc được đã chốt ở mục 4.2b**; các trạng thái còn lại dưới đây vẫn là đề xuất để duyệt, phù hợp đề xuất ban đầu của Codex:
  - **Giữ khóa** (gửi lại giống hệt thì không tạo thêm): Chờ xác nhận, Đang liên hệ, Đã xác nhận.
  - **Giải phóng khóa** (gửi lại giống hệt thì tạo yêu cầu mới): Đã hủy, Từ chối.
  - **Không liên lạc được: [Đã chốt] giữ khóa kèm dấu nhắc cần gọi lại** (mục 4.2b).
  - Nếu cho phép mở lại yêu cầu đã giải phóng khóa, có thể xung đột khi khóa đã bị yêu cầu mới chiếm; cần quy tắc xử lý khi mở lại.
- **Thời gian gọi lại, số lần liên hệ tối đa, người dự phòng** khi người tiếp nhận vắng: **[Cần chốt]**.

### 4.2b. Khách gửi lại khi yêu cầu ở Không liên lạc được **[Đã chốt: giữ một yêu cầu, hiện dấu nhắc cần gọi lại]**

Chủ dự án chọn kết hợp: **không tạo yêu cầu mới, nhưng đánh dấu yêu cầu cũ cần gọi lại.** Quyết định này thay lựa chọn giữ khóa đơn thuần trước đó.

**Quy tắc [Đã chốt].** Yêu cầu đang ở **Không liên lạc được**, khách gửi lại toàn bộ thông tin giống nhau sau chuẩn hóa, **trong cùng phạm vi chống trùng**:
1. Giữ đúng một yêu cầu; không tạo thêm bản ghi đặt lịch.
2. Trạng thái vẫn là **Không liên lạc được**.
3. Trang tiếp nhận hiện **"Khách vừa gửi lại — cần gọi lại"** cùng **thời điểm gửi lại**.
4. Khi nhân viên bắt đầu liên hệ, yêu cầu chuyển sang **Đang liên hệ** và **dấu nhắc đang hiển thị được xóa**.
5. Lịch sử đã ghi **không bị xóa** khi xóa dấu nhắc.
6. Thông tin khác (ngày, dịch vụ, thú cưng…) thì tiếp nhận yêu cầu mới theo quy tắc đã chốt.
7. **Không có trạng thái thứ bảy.** "Cần gọi lại" là dấu nhắc trên yêu cầu hiện có.
8. Phạm vi chống trùng giữ nguyên: từng tài khoản riêng, khách vãng lai chung một phạm vi; không ghép yêu cầu vãng lai vào tài khoản theo số điện thoại; không gộp hay chuyển chủ sở hữu.

**Ví dụ (dữ liệu giả, khách Lan, mèo Miu, ngày 20/10):**

| Bước | Sự kiện | Kết quả |
|---|---|---|
| 1 | Lan gửi form; người tiếp nhận gọi nhưng không gặp | Yêu cầu chuyển sang Không liên lạc được |
| 2 | Lan gửi lại nội dung giống hệt, cùng phạm vi | Không tạo yêu cầu mới; yêu cầu cũ có dấu "Khách vừa gửi lại — cần gọi lại" và thời điểm gửi lại |
| 3 | Người tiếp nhận bắt đầu gọi | Chuyển Đang liên hệ; xóa dấu nhắc đang hiển thị |
| 4 | Hai bên thống nhất giờ | Chuyển Đã xác nhận; lưu ngày giờ hẹn |

Nếu Lan đổi ngày hoặc dịch vụ thì tạo yêu cầu mới. Nếu Lan chuyển từ vãng lai sang đăng nhập, hai lần gửi thuộc hai phạm vi khác nhau nên vẫn có thể có hai yêu cầu theo ngoại lệ ở mục 4.2.

**Đề xuất kỹ thuật của Claude (chưa coi là đã duyệt, Codex phản biện):**
- **Dữ liệu tối thiểu:** một dấu nhắc kèm thời điểm gửi lại trên yêu cầu. Chưa cần bộ đếm số lần gửi, chưa cần dịch vụ hàng đợi. Dấu nhắc chỉ có thể tồn tại khi trạng thái là Không liên lạc được; nên ép bằng ràng buộc ở cơ sở dữ liệu.
- **Xóa dấu nhắc chỉ qua chuyển trạng thái:** không có thao tác "xóa nhắc" độc lập. Mọi chuyển khỏi Không liên lạc được (không chỉ sang Đang liên hệ) phải xóa dấu nhắc trong cùng thao tác, để dấu nhắc không bao giờ lệch trạng thái.
- **Cập nhật nguyên tử, có điều kiện:** lần gửi lại đặt dấu nhắc bằng một câu lệnh cập nhật chỉ khớp khi yêu cầu vẫn đang ở Không liên lạc được. Nếu người tiếp nhận đã chuyển trạng thái trước đó thì không có dòng nào bị đổi, nên không ghi đè trạng thái và không dựng lại dấu nhắc không phù hợp; khách vẫn nhận phản hồi chung như thường.
- **Hai thứ tự đồng thời đều đúng:** gửi lại trước rồi người tiếp nhận chuyển → dấu nhắc được đặt rồi bị xóa theo quy tắc (nhân viên đang bắt đầu gọi); người tiếp nhận chuyển trước rồi gửi lại → không đặt dấu nhắc.
- **Màn hình cũ của người tiếp nhận [Đề xuất của Claude và Codex thống nhất, chưa duyệt chủ dự án]:** dùng số phiên bản của yêu cầu, đã có trong mô hình chống ghi đè. Khi đặt dấu nhắc **lần đầu của chu kỳ**, tăng phiên bản. Chuyển trạng thái chỉ thành công nếu phiên bản đang lưu bằng phiên bản trên màn hình; nếu khác thì báo "đã được cập nhật, hãy tải lại". Không cần dịch vụ trả phí. Ví dụ giả lập: người tiếp nhận mở yêu cầu Lan/Miu ở phiên bản 4; Lan gửi lại, hệ thống đặt dấu nhắc và tăng lên 5; người tiếp nhận bấm lưu từ màn hình phiên bản 4 thì không ghi đè, tải lại để thấy phiên bản 5 rồi bắt đầu liên hệ. Lần gửi lại vẫn nằm trong lịch sử dù dấu nhắc sau đó bị xóa, nên không mất dữ liệu.
- **Tránh bấm nhiều lần tạo lịch sử hoặc thông báo liên tục [Đề xuất của Claude và Codex thống nhất, chưa duyệt chủ dự án]:** khi dấu nhắc đang hiển thị, các lần gửi lại giống hệt tiếp theo **không ghi thêm sự kiện, không tăng phiên bản và không đổi thời điểm**. Mỗi chu kỳ nhắc tối đa một sự kiện lịch sử; thời điểm hiển thị là lần gửi lại đầu của chu kỳ (ví dụ gửi 10:00, bấm lại 10:01 và 10:02 vẫn giữ 10:00). Sau khi dấu nhắc bị xóa, lần gửi lại mới sẽ đặt dấu mới. Cách này tránh danh sách dao động khi khách bấm liên tục. Nếu chủ dự án muốn thời điểm theo lần gần nhất thì đổi lại.
- **Giới hạn tần suất là lớp riêng:** vẫn áp dụng giới hạn theo địa chỉ mạng, số điện thoại và phạm vi để chống bot. **Chưa có ngưỡng được chốt.**
- **Email:** quyết định hiện tại chỉ yêu cầu hiển thị nhắc trên trang tiếp nhận. **Chưa chốt** có gửi thêm email khi khách gửi lại hay không. Nếu sau này thêm, không đưa dữ liệu cá nhân vào thư và không gửi mỗi lần bấm.
- **Phản hồi công khai** giống hệt mọi trường hợp: tạo mới, trùng, hay trùng kèm đặt dấu nhắc. Không tiết lộ yêu cầu cũ, trạng thái hay chủ tài khoản. Thời gian phản hồi giữa các nhánh nên gần nhau.

**Giới hạn cần ghi rõ (theo lưu ý của chủ dự án):**
- Với khách vãng lai chưa xác minh, dấu nhắc chỉ có nghĩa **đã nhận một lần gửi lại trùng nội dung**. Nó không chứng minh chính chủ tài khoản hay chủ số đã gửi. **Không dùng dấu nhắc để khôi phục tài khoản hay xác minh số điện thoại.**
- Rủi ro còn lại: người biết đầy đủ nội dung một yêu cầu có thể bấm gửi lại để nhân viên gọi lại số đó. Hậu quả là cuộc gọi không mong muốn tới số trong yêu cầu. Giảm bằng giới hạn tần suất và việc mỗi chu kỳ nhắc chỉ có một sự kiện; chấp nhận như một phần rủi ro của việc không có OTP.

### 4.3. Cơ chế chống trùng chịu được hai lần gửi đồng thời [Đề xuất]

Cơ sở dữ liệu là nơi phân xử, không phải đoạn kiểm tra trong ứng dụng:
1. Máy chủ chuẩn hóa các trường (Unicode NFC, cắt và gộp khoảng trắng, không phân biệt hoa thường, **không bỏ dấu tiếng Việt**; điện thoại về dạng quốc tế; email viết thường) rồi tạo **một khóa trùng gồm phạm vi (mục 4.2) và các trường đã chuẩn hóa**, lưu cùng yêu cầu, kèm số phiên bản của cách tạo khóa.
2. Ràng buộc duy nhất cho khóa này, **chỉ áp dụng khi yêu cầu còn ở nhóm trạng thái giữ khóa**. **Không liên lạc được giữ khóa chống trùng theo quyết định đã chốt tại mục 4.2b; khách gửi lại giống hệt thì đặt dấu nhắc trên yêu cầu hiện có, không tạo yêu cầu mới.** Nhóm giữ khóa của các trạng thái còn lại là **[Chưa duyệt]**, xem bảng đề xuất ở mục 4.2a (Chờ xác nhận, Đang liên hệ, Đã xác nhận giữ khóa; Đã hủy và Từ chối giải phóng khóa).
3. Máy chủ thử ghi; nếu cơ sở dữ liệu báo trùng thì bỏ qua việc tạo mới. Hai lần gửi đồng thời: một lần ghi được, lần kia nhận "đã có".
4. Ngày mong muốn bắt buộc và không được là ngày đã qua, nên yêu cầu "đã xác nhận" chỉ chặn tạo trùng trong giới hạn tự nhiên.
5. Chỉ gửi email cho nhân viên khi tạo mới.
6. Nút gửi bị vô hiệu sau khi bấm; trình duyệt coi phản hồi "trùng" như thành công.
7. Trạng thái "Không liên lạc được" khi khách gửi lại giống hệt trong cùng phạm vi: **[Đã chốt]** không tạo yêu cầu mới, giữ nguyên trạng thái, đặt dấu nhắc "cần gọi lại" (mục 4.2b).

### 4.4. Phản hồi giống hệt cho mọi trường hợp

- Mọi lần gửi hợp lệ (tạo mới hay bị chống trùng) trả cùng một thông báo, ví dụ: "Chúng tôi đã nhận yêu cầu. Nhân viên sẽ gọi xác nhận."
- Không bao giờ hiển thị nội dung, trạng thái hay thời gian của yêu cầu có sẵn.
- **Chỉ hiện "đã nhận yêu cầu" khi yêu cầu đã được lưu thành công.** Nếu lưu thất bại (ví dụ cơ sở dữ liệu bị tạm dừng hoặc lỗi), hiện thông báo thử lại hoặc gọi bệnh viện, không báo đã nhận (mục 6a).
- **Không nhắc "số này đã có tài khoản, hãy đăng nhập"** khi khách vãng lai gửi form: đó là bộ dò số điện thoại. Lời mời đăng ký, nếu có, phải giống nhau cho mọi khách vãng lai.
- Không gửi email xác nhận tới email do khách nhập. Email báo nhân viên không chứa tên chủ, số điện thoại hay thông tin thú cưng, chỉ có "có yêu cầu mới" và liên kết đăng nhập.

### 4.5. Các điểm khác của form

- Khách đăng nhập: điền sẵn tên và số điện thoại; chọn thú cưng đã lưu hoặc thêm mới; chọn dịch vụ và ngày mong muốn.
- Khách đăng nhập có sửa số liên hệ trong từng yêu cầu không: **[Cần chốt]**. Đề xuất mặc định khóa, vì "đặt hộ" nằm ngoài phạm vi chưa duyệt (mục 8).
- Kiểm tra dữ liệu phía máy chủ: độ dài, định dạng, danh sách giá trị cho loài và dịch vụ.
- Ghi nhận đồng ý xử lý dữ liệu cá nhân (phiên bản nội dung, thời điểm).
- **Hồ sơ tài khoản và thú cưng [Đã chốt về chức năng]:** hồ sơ có tên và số liên hệ để tự điền form; danh sách thú cưng thuộc tài khoản; chọn thú cưng đã có hoặc thêm và lưu thú cưng mới từ form. **Kiểm tra quyền phía máy chủ:** không chọn được thú cưng của tài khoản khác. Yêu cầu giữ bản chụp thông tin tại thời điểm gửi, nên sửa thông tin thú cưng sau này **không sửa ngược** yêu cầu đã gửi. Ví dụ: Lan đăng nhập, chọn Miu đã lưu hoặc thêm chó Bông; sau này sửa Miu không đổi yêu cầu cũ. Không mở rộng sang bệnh án hay nhập GPet.
- **Độ tin cậy của email báo nhân viên [Đề xuất của Codex, Claude đồng ý]:** lưu yêu cầu và bản ghi thông báo chờ gửi **trong cùng một giao dịch**, gửi email sau; có thử lại, giới hạn số lần thử, và hiển thị hoặc cảnh báo khi lỗi. Chưa cần mua dịch vụ hàng đợi riêng. Ví dụ: Lan gửi form lúc dịch vụ email lỗi thì yêu cầu vẫn lưu và hiện cho người tiếp nhận, hệ thống thử lại, Lan không phải gửi lại; nếu cơ sở dữ liệu lỗi thì không báo đã nhận. Sao lưu và giám sát **không thay** cho cơ chế này. Email cho yêu cầu mới và email khi khách gửi lại là hai quyết định khác nhau; email khi gửi lại **chưa chốt**.
- Chống spam là lớp riêng với chống trùng: giới hạn tần suất theo địa chỉ mạng, số điện thoại và tài khoản; chống bot. Ngưỡng và cách xử lý khi vượt: **[Cần chốt]**.

---

## 5. Hỗ trợ tài khoản tối thiểu [Đề xuất, chưa duyệt]

Phạm vi thu hẹp: **không mở form hỗ trợ riêng**. Khách liên hệ bệnh viện qua thông tin liên hệ sẵn có (điện thoại, tại quầy); quản lý xử lý và ghi nhận trên trang quản trị. Cần quản lý và người tiếp nhận duyệt quy trình này.

### 5.1. Ba việc phải tách riêng

Một cuộc gọi chứng minh người đó **hiện nhận được cuộc gọi ở số này**, không chứng minh họ **có quyền với tài khoản và lịch sử cũ** (số có thể đã được nhà mạng cấp cho người khác).

1. **Khôi phục quyền vào tài khoản cũ.** Cần bằng chứng mạnh hơn việc giữ số. Tên thú cưng hay ngày yêu cầu **không đủ** làm bằng chứng duy nhất. Nếu không đủ bằng chứng: **không giao tài khoản hay dữ liệu cũ.** Chứng cứ nào được coi là đủ (ví dụ gặp trực tiếp tại bệnh viện kèm thú cưng và nhân viên nhận ra) là **[Cần chốt]** của quản lý.
2. **Giải phóng số để đăng ký tài khoản mới.** Quản lý quyết định, tách khỏi việc 1. Tài khoản cũ bị khóa, không xóa. **Không sao chép lịch sử cũ sang tài khoản mới.**
3. **Đặt lại mật khẩu cho người đã chứng minh được quyền ở việc 1.**

### 5.2. Đăng ký nhầm, số cấp lại

Chủ số thật báo số đã bị đăng ký: quản lý liên hệ, xét theo 5.1, và nếu quyết định giải phóng thì khóa tài khoản cũ và ghi nhật ký. Nếu hai bên cùng nhận và không đủ bằng chứng, quản lý quyết định; không thể giải quyết hoàn toàn bằng kỹ thuật.

### 5.3. Đặt lại mật khẩu [Chờ kiểm chứng]

**Quy trình này chưa được phê duyệt.** Codex (14/10) đánh giá hai cách; cả hai chưa được chọn và cần thử trên môi trường thử:

- **Mật khẩu tạm.** Không có phí SMS nếu nhân viên giao trực tiếp, nhưng **không đơn giản chỉ bằng một API đổi mật khẩu**. Phải xây và kiểm tra: hạn dùng, ép đổi mật khẩu, chặn truy cập dữ liệu trước khi đổi (kiểm tra **ở máy chủ cho mọi thao tác dữ liệu**, không chỉ chuyển hướng giao diện), và xử lý phiên cũ. Mật khẩu tạm phải ngẫu nhiên, hiện một lần.
- **Quyền đặt lại dùng một lần.** Nhân viên xác minh trước, khách tự chọn mật khẩu mới; nhân viên không biết mật khẩu của khách. Phải thiết kế lưu dấu xác minh, quyền đặt lại có hạn, chỉ dùng một lần, và giới hạn số lần thử. Không gửi SMS tự động; không thay quyết định bỏ OTP đăng ký và đăng nhập.
- **Chi phí:** cả hai không có phí tin nhắn nếu xử lý trực tiếp, nhưng có công phát triển, thao tác của nhân viên và mức dùng dịch vụ. **Chưa đủ thông tin để báo số giờ hoặc chi phí tiền chính xác.**
- **Phiên cũ:** không hứa mọi phiên cũ mất hiệu lực ngay (đăng xuất không làm token còn hạn mất hiệu lực, mục 2). Mô tả đúng hành vi sau khi chạy kiểm chứng ở mục 3.3.
- **Bằng chứng khôi phục tài khoản cũ:** việc nhận được cuộc gọi hay biết tên thú cưng **không phải bằng chứng duy nhất**. Tranh chấp số và cấp lại số **không được chuyển lịch sử tài khoản** (mục 5.1).
- Khôi phục qua email chỉ nên có khi email đã xác minh. Chưa đưa vào bản đầu.

### 5.4. Xóa tài khoản

Xóa mềm: giải phóng số và tên đăng nhập, giữ yêu cầu đã gửi theo chính sách lưu trữ. **[Cần chốt]** thời gian lưu, nội dung chính sách.

---

## 6. Phân quyền [Đề xuất]

**Cơ cấu nhân sự [Đã chốt, chủ dự án 14/10]:** bệnh viện **không có lễ tân riêng**. Quản lý kiêm tiếp nhận khách hàng và điều hành; bác sĩ kiêm nhân viên khám, điều trị và chăm sóc; nhân viên Spa theo nhiệm vụ được phân công. Các tài liệu dùng "**người tiếp nhận**" để chỉ **khả năng** xử lý yêu cầu đặt lịch, không phải một chức danh hay một người riêng.

**Phân quyền theo khả năng kiêm nhiệm [Đề xuất]:**
- Quyền gắn với **khả năng**, không gắn mỗi vai trò với một nhân sự. Một người giữ nhiều khả năng; mỗi người một tài khoản cá nhân (không dùng chung).
- Khả năng gợi ý cho giai đoạn 1 (chưa duyệt): xem và xử lý yêu cầu đặt lịch (tiếp nhận); quản lý nội dung website; quản lý tài khoản nhân viên và gán khả năng; thao tác nhạy cảm trên tài khoản khách; cấu hình hệ thống. "Quản lý", "bác sĩ", "nhân viên Spa" chỉ là **bộ khả năng soạn sẵn**, chỉnh được. Phân hệ sau thêm khả năng mới mà không đổi cấu trúc (xem [định hướng sản phẩm](https://github.com/lqt140304-rgb/web-b-nh-vi-n/blob/claude/optimistic-mccarthy-d1d15i/docs/dinh-huong-san-pham.md), mục 2).
- Quản lý vừa tiếp nhận vừa giữ quyền thao tác nhạy cảm nghĩa là **không có người thứ hai kiểm tra**; giảm bằng nhật ký thao tác. **[Cần chốt]** ai ngoài quản lý giữ khả năng tiếp nhận, ai dự phòng, ai được thao tác nhạy cảm.
- Khả năng và phân quyền lưu ở nơi người dùng không tự sửa được, kiểm tra ở máy chủ cho mọi thao tác.

**Quy tắc kỹ thuật:**
- Khách chỉ đọc và thêm dữ liệu thuộc tài khoản mình; không bao giờ sửa trạng thái hay trường của nhân viên.
- Khả năng truy cập dữ liệu qua API của Supabase phụ thuộc **cả hai**: schema nào được đưa ra qua API, quyền đã cấp cho từng vai trò, và chính sách RLS. Kiểm tra cả quyền lẫn RLS cho từng bảng, không dựa vào riêng một lớp.
- Khóa có quyền cao có thể bỏ qua RLS; chỉ dùng ở máy chủ, không có trong biến môi trường công khai, và **mọi thao tác dùng khóa này phải kiểm tra người dùng và vai trò ở máy chủ**.
- Vai trò nhân viên lưu ở nơi người dùng không tự sửa được. Tài khoản nhân viên do quản lý tạo; khách tự đăng ký không bao giờ có vai trò nhân viên.
- Thao tác nhạy cảm (đặt lại mật khẩu, giải phóng số, khóa tài khoản) qua máy chủ, kiểm tra vai trò, ghi nhật ký. **[Cần chốt]** ai giữ khả năng thao tác nhạy cảm; quản lý chỉ một người nên cần phương án dự phòng.
- Quản lý bật xác thực hai bước không dùng SMS [chờ kiểm chứng cách Supabase hỗ trợ].
- Môi trường thử dùng dữ liệu giả, tách khỏi dữ liệu thật.

---

## 6a. Vận hành bản đầu trên Supabase Free [Đề xuất của Codex, Claude đồng ý; chưa duyệt chủ dự án]

Môi trường phát triển: Vercel Hobby + Supabase Free (bản 13; xem mục 6b cho vận hành thương mại). Codex xác minh tài liệu Supabase Free (14/10) và nêu các hệ quả vận hành sau; chúng áp dụng nguyên cho Supabase Free dù nền tảng web đổi. Đây là đề xuất, chưa thiết lập gì.

**Sao lưu và khôi phục**
- Sao lưu cơ sở dữ liệu **mỗi ngày**, mã hóa, lưu ở nơi riêng, giới hạn quyền. Phải bao gồm **dữ liệu tài khoản Auth, hồ sơ, thú cưng, yêu cầu và lịch sử**, không chỉ xuất vài bảng ra CSV. Phạm vi Auth và cách xuất, nhập cần kiểm tra theo công cụ thực tế trước khi xây lịch sao lưu.
- Cấu trúc dữ liệu (migration) và cấu hình triển khai có kiểm soát phiên bản. Bí mật nằm ở nơi quản lý bí mật, **không** trong GitHub hay tệp báo cáo.
- Giữ 7–14 bản gần nhất là đề xuất. Một bản mỗi ngày **không bảo đảm** không mất dữ liệu: ví dụ bản sao lúc 02:00 mà dữ liệu mất lúc 15:00 thì dữ liệu sau 02:00 chưa chắc khôi phục được. Chủ dự án cần biết và chấp nhận mức mất tối đa này.
- Ảnh trong Storage (nếu dùng) sao lưu riêng.
- **Cổng bắt buộc:** chỉ nhận dữ liệu khách thật sau khi một lần **khôi phục thử** đạt (xuất, khôi phục sang môi trường tách biệt, đối chiếu số bản ghi, đăng nhập được bằng tài khoản giả cũ, đúng quyền đọc, thấy đúng yêu cầu). Không khôi phục đè dự án đang dùng chỉ để thử.
- Kiểm tra dung lượng, băng thông và chỗ giữ bản sao có nằm trong ngân sách hay không. **[Đã chốt trước bản 13, Codex xác nhận; cần xác nhận lại cho vận hành thương mại, mục 6b]** mục tiêu dự toán khoảng **300.000 đồng mỗi tháng**, phạm vi là dịch vụ vận hành web: hosting, phần dùng cơ sở dữ liệu và email còn trong hạn mức, tên miền phân bổ theo năm, dự phòng nhỏ. **Chưa gồm** công phát triển, bảo trì hay phí dùng các AI. Đây là **mục tiêu dự toán, không phải trần hóa đơn** khi vượt hạn mức. Nếu muốn gộp hạng mục khác thì cần hỏi hạng mục cụ thể đó.
- **Bản sao lưu là dữ liệu nhạy cảm:** bản sao đủ để khôi phục tài khoản có thể chứa **mật khẩu đã băm và dữ liệu cá nhân**, nên phải mã hóa và giới hạn quyền, không phải tệp được phép công khai. Không đưa mã truy cập, khóa quyền cao (service-role/secret), mật khẩu dạng rõ hay bí mật triển khai vào báo cáo, nhật ký hay GitHub. Cấu hình và bí mật vận hành cần cơ chế lưu và khôi phục riêng.

**Tạm dừng dự án khi ít hoạt động**
- Nếu Supabase tạm dừng, trang giới thiệu trên Vercel vẫn mở được nhưng **đăng nhập và gửi yêu cầu có thể không hoạt động**.
- Hệ thống **không được báo "đã nhận yêu cầu" khi lưu thất bại.** Phải hiện thông báo thử lại hoặc gọi bệnh viện; người vận hành nhận cảnh báo và biết cách khôi phục.
- Không thiết kế truy vấn giả chỉ để lách hạn mức. Nếu bệnh viện yêu cầu luôn nhận được lịch tự động kể cả lúc ít dùng, Free không bảo đảm điều đó; nâng cấp chỉ khi chủ dự án chấp nhận chi phí. **[Cần chốt]** mức chấp nhận rủi ro này và người nhận cảnh báo.

**Bộ đếm giới hạn tần suất:** lưu trong PostgreSQL bằng cập nhật nguyên tử và dọn dữ liệu cũ; chưa cần Redis. Giới hạn theo tài khoản và IP phải xét mạng dùng chung (nhiều khách cùng mạng). Không thử vượt giới hạn bằng hàng loạt yêu cầu trên dự án thật.

---

## 6b. Môi trường phát triển và vận hành thương mại [Đã chốt về nguyên tắc 14/10; chi tiết gói là Cần chốt]

**Môi trường phát triển và kiểm thử nội bộ [Đã chốt]:**
- Vercel Hobby + Supabase Free; ưu tiên Next.js để triển khai trực tiếp trên Vercel và giảm độ phức tạp kỹ thuật.
- Chưa mua Vercel Pro hay nâng cấp Supabase trong giai đoạn phát triển. Dữ liệu giả.
- Giữ yêu cầu sao lưu, khôi phục và bảo mật dữ liệu (mục 6a) dù đang dùng gói miễn phí.

**Môi trường vận hành thương mại [Đã chốt về nguyên tắc]:**
- Trước khi đưa website vào hoạt động thương mại, **phải đánh giá và chọn gói triển khai phù hợp điều khoản sử dụng.** Tài liệu chi phí trước đó của Codex ghi Vercel Hobby dành cho mục đích cá nhân, phi thương mại; Claude chưa tự đọc điều khoản nên **[Chờ kiểm chứng]**. Không giả định gói miễn phí đủ điều kiện cho website của bệnh viện.
- **[Cần chốt]** định nghĩa "hoạt động thương mại" để áp dụng cổng. Đề xuất [Đề xuất]: coi là bắt đầu khi website được công khai cho khách thật hoặc bắt đầu nhận yêu cầu và dữ liệu khách thật; từ lúc đó phải qua cổng chọn gói (Cổng 5 trong kế hoạch).
- Khi website hoàn thiện, căn cứ **lượng truy cập, mức dùng tài nguyên, chi phí và yêu cầu ổn định** để đề xuất phương án nâng cấp. Đề xuất [Đề xuất] ghi nhận trong giai đoạn thử: lượt truy cập, số yêu cầu, băng thông, dung lượng cơ sở dữ liệu, lỗi, thời gian phản hồi, số lần Supabase bị tạm dừng.
- **Không tự động nâng cấp hay phát sinh chi phí khi chưa được chủ dự án đồng ý.** Đề xuất [Đề xuất]: đặt cảnh báo hoặc giới hạn chi tiêu nếu nền tảng hỗ trợ [Chờ kiểm chứng]; mọi dịch vụ trả phí chỉ bật khi được duyệt.

**Chi phí [Cần chốt]:** mục tiêu khoảng 300.000 đồng mỗi tháng được đặt khi nền tảng là Cloudflare Workers Paid. Ước tính trước đó của Codex (Claude chưa kiểm chứng): Vercel Pro từ 20 USD mỗi tháng và Supabase Pro từ 25 USD mỗi tháng, tổng cơ bản khoảng 45 USD, tương đương khoảng 1,17 triệu đồng với tỷ giá dự toán 26.000 đồng/USD, chưa gồm tên miền, thuế, email, OTP và phần dùng vượt hạn mức. Nếu cả hai đều cần gói trả phí khi thương mại, chi phí vượt xa mục tiêu 300.000 đồng. Chủ dự án cần xác nhận lại mục tiêu cho giai đoạn thương mại, hoặc chấp nhận mức cao hơn, hoặc xem lại nền tảng. Con số này không được suy rộng thành chi phí vận hành toàn bộ phần mềm bệnh viện.

**Về OpenNext/Cloudflare:** không còn là yêu cầu bắt buộc cho phương án chính. Chỉ cần kiểm chứng nếu sau này cân nhắc chuyển nền tảng cho vận hành thương mại.

**Khả chuyển [Đề xuất]:** giữ mã ứng dụng ít dính vào tính năng riêng của Vercel khi không cần, để lựa chọn nâng cấp hoặc chuyển nền tảng còn mở.

---

## 7. Rủi ro còn lại do bỏ OTP (ghi nhận)

1. Số điện thoại chưa xác minh: có thể bị chiếm đăng ký, nhân viên có thể gọi nhầm người.
2. Dò số điện thoại qua thông báo "số đã đăng ký".
3. Kỹ thuật xã hội vào quy trình hỗ trợ tài khoản qua điện thoại.
4. Quản lý là điểm nghẽn cho thao tác nhạy cảm.
5. Đăng ký rác và hàng loạt.
6. Chưa có kênh thông báo cho khách ngoài cuộc gọi.

---

## 8. Ý tưởng Claude từng nêu, nay NGOÀI phạm vi cho đến khi chủ dự án duyệt

Gộp yêu cầu; đặt hộ (sửa số liên hệ trong từng yêu cầu); form "Cần hỗ trợ tài khoản" riêng; nhiều tầng cảnh báo và cờ "cần xem xét"; trạng thái "nhân viên đã xác minh số điện thoại" sau cuộc gọi đầu tiên; sự kiện "khách gửi lại" cho các trạng thái khác ngoài Không liên lạc được, và bộ đếm số lần gửi lại (cách xử lý riêng cho Không liên lạc được đã chốt ở mục 4.2b); cảnh báo mềm khi lưu thú cưng trùng; trạng thái "Spam/Không hợp lệ" riêng; các trạng thái "đã đến", "đã khám", "hoàn thành" và quy trình bệnh án (chủ dự án nêu rõ không thêm vào bản đầu). Chỉ làm khi chủ dự án chọn.

---

## 9. Quyết định còn thiếu

**Đã chốt, không còn trong danh sách:** phạm vi chống trùng (mục 4.2); sáu trạng thái và luồng chính (mục 4.2a); xử lý khách gửi lại khi Không liên lạc được (mục 4.2b).

**Chủ dự án:** (1) bảng chuyển trạng thái hợp lệ và quyền thực hiện; mở lại yêu cầu đã hủy/từ chối; chuyển ngược từ Đã xác nhận; trạng thái nào còn giữ khóa chống trùng; danh mục lý do hủy/từ chối và có hiện cho khách không (mục 4.2a); (2) bằng chứng nào đủ để khôi phục tài khoản cũ, và ai quyết định; (3) người tiếp nhận được làm thao tác nhạy cảm nào, ai dự phòng quản lý; (4) có nhận số cố định không; (5) thời gian gọi lại, số lần liên hệ và người dự phòng; có gửi thêm email khi khách gửi lại không (mục 4.2b); (6) khách có sửa số liên hệ trong yêu cầu không; (7) ngưỡng giới hạn tần suất; (8) chính sách lưu trữ, xóa và nội dung đồng ý; (9) dự án thử đã tạo; **bản 9: chủ dự án đã tự chạy công cụ kiểm chứng A và gửi file kết quả, nên cơ chế xác thực Management API cho lần thử này đã được giải quyết** (không gửi mã bí mật qua chat hoặc GitHub; cấu hình đã hoàn nguyên). Nếu cần chạy thêm, vẫn theo cách đó. **Cần duyệt riêng:** có chọn A làm hướng triển khai chính không (đề xuất của Codex), và chạy các điểm kiểm tra theo nền tảng/gói (Vercel Hobby + Supabase Free trong phát triển) ở mục 0, dòng Bản 9, và đánh giá gói cho vận hành thương mại (mục 6b). Đề xuất của Claude [Đề xuất]: ưu tiên cách để chủ dự án giữ mã bí mật, ví dụ chủ dự án tự chạy đúng lệnh Codex soạn trên dự án thử, hoặc cấp mã tạm thời có thể thu hồi ngay sau khi thử; chủ dự án chọn.

**Codex (bản 10):** (10c) kiểm thử chuyển IP khách trên Vercel khi có môi trường thử; (10d) công cụ và phạm vi xuất sao lưu (có gồm Auth không), thử khôi phục tách biệt; (10e) cảnh báo khi dự án bị tạm dừng; (10f) bộ đếm trong PostgreSQL. **Codex:** (10) tiếp tục kiểm chứng hosted mục 3.3 trên dự án thử `leson-test` (không gửi khóa bí mật hay mật khẩu trong chat): **phần Management API, tạo tài khoản và đăng nhập với số giả đã đạt (bản 9); không yêu cầu chủ dự án chạy lại**; còn lại là các kiểm thử chưa chạy ở mục 2 (dòng "Còn chưa kiểm chứng sau bản 9"); nếu A không đáp ứng thì mới thử B; (11) xác minh tài liệu đã xong, còn kiểm thử API thật cho các mục ở mục 2; (12) chọn cách đặt lại mật khẩu (mật khẩu tạm hay quyền đặt lại dùng một lần) sau khi thử, và báo công sức; (12b) kiểm tra giới hạn theo IP khi đăng nhập qua máy chủ.

**Antigravity:** (13) luồng đăng ký và đăng nhập (một ô cho "số điện thoại hoặc tên đăng nhập"), thông báo lỗi chung, thông báo thành công thống nhất, và cách trình bày giới hạn "số điện thoại chưa xác minh" cho khách. Khoan vẽ màn hình hỗ trợ tài khoản cho đến khi quy trình mục 5 được duyệt.

---

## 10. Kịch bản kiểm thử gợi ý (dữ liệu giả)

| # | Tình huống | Kết quả mong đợi |
|---|---|---|
| 1 | Tên đăng nhập toàn số hoặc dạng số điện thoại | Từ chối |
| 2 | Đăng ký cùng số ở hai định dạng (`0900000001`, `+84900000001`) | Lần hai bị từ chối |
| 3 | Tên đăng nhập `Khach.A` và `khach.a` | Coi là trùng |
| 4 | Đăng nhập bằng số ở các định dạng khác nhau | Cùng một tài khoản |
| 5 | Không có tài khoản và sai mật khẩu | Cùng một thông báo, thời gian gần nhau |
| 6 | Sai mật khẩu nhiều lần | Làm chậm, chống bot; chủ thật vẫn vào được sau đó |
| 7 | Gọi trực tiếp API Auth đi vòng đường dẫn Next.js | Vẫn bị giới hạn theo kết quả kiểm chứng; ghi nhận hành vi thật |
| 8 | Khách vãng lai gửi form với số đã có tài khoản | Phản hồi như mọi khách vãng lai; không có gợi ý riêng; yêu cầu không xuất hiện trong tài khoản nào |
| 9 | Hai lần gửi đồng thời giống hệt, **cùng phạm vi** | Đúng một yêu cầu, cả hai thấy thành công |
| 9b | Hai lần gửi đồng thời giống hệt nhưng **khác phạm vi** (một vãng lai, một đã đăng nhập) | Có thể có hai yêu cầu; không lỗi, không gắn chéo |
| 10a | Ví dụ Lan/Miu bước 1–2: vãng lai gửi, rồi gửi lại giống hệt | Một yêu cầu A |
| 10b | Bước 3–4: đăng nhập gửi cùng nội dung, rồi gửi lại | Yêu cầu B riêng, sau đó không tạo thêm |
| 10c | Bước 5: đổi ngày mong muốn | Tạo yêu cầu mới |
| 10d | Sau 10a–10c, khách xem danh sách trong tài khoản | Chỉ thấy B (và yêu cầu mới của tài khoản); không thấy A |
| 10e | Nhân viên xem trang quản trị | Thấy cả A và B, không tự gộp hay chuyển chủ |
| 10f | Trình duyệt gửi kèm mã tài khoản hoặc cờ chủ thể giả | Bỏ qua; chủ thể lấy từ phiên đã kiểm tra phía máy chủ |
| 16 | Gửi form hợp lệ | Yêu cầu tạo ở **Chờ xác nhận**; khách thấy "Chờ nhân viên xác nhận", không thấy chữ ngụ ý đã có lịch |
| 17 | Người tiếp nhận bắt đầu liên hệ | Chuyển sang **Đang liên hệ**; lịch sử ghi người, thời điểm, cũ/mới |
| 18 | Chuyển sang **Đã xác nhận** thiếu ngày hoặc thiếu giờ hẹn | Từ chối thao tác |
| 19 | Chuyển sang Đã xác nhận với đủ ngày và giờ (ví dụ 09:00 ngày 20/10) | Lưu ngày giờ hẹn; hệ thống tự ghi thời điểm và người xác nhận; **ngày khách mong muốn không đổi** |
| 20 | Ngày giờ hẹn khác ngày khách mong muốn | Ba mốc thời gian vẫn là ba giá trị riêng |
| 21 | Đang liên hệ → Không liên lạc được → Đang liên hệ (gọi lại) → Đã xác nhận | Hợp lệ; lịch sử ghi đủ từng bước |
| 22 | Chuyển sang **Đã hủy** hoặc **Từ chối** không nhập lý do | Từ chối thao tác; có lý do thì lưu và ghi lịch sử |
| 23 | Hai người tiếp nhận đổi trạng thái cùng một yêu cầu đồng thời | Một thành công; người kia nhận thông báo tải lại, không ghi đè |
| 24 | Khách (đã đăng nhập hay vãng lai) cố đặt trạng thái hoặc ngày giờ hẹn qua dữ liệu gửi lên | Bị bỏ qua hoặc từ chối; khách không đổi được trạng thái |
| 25 | Chuyển trạng thái ngoài bảng hợp lệ (áp dụng **sau khi** chủ dự án duyệt bảng ở 4.2a) | Bị từ chối |
| 26 | Gửi lại giống hệt (cùng phạm vi) khi yêu cầu ở Chờ xác nhận, Đang liên hệ hoặc Đã xác nhận (theo nhóm giữ khóa được duyệt) | Không tạo thêm |
| 27 | Gửi lại giống hệt khi yêu cầu cũ ở Đã hủy hoặc Từ chối (theo nhóm được duyệt) | Tạo yêu cầu mới |
| 28 | Gửi lại giống hệt, cùng phạm vi, khi yêu cầu cũ ở **Không liên lạc được** | Vẫn **một** yêu cầu, trạng thái giữ nguyên; trang tiếp nhận hiện "Khách vừa gửi lại — cần gọi lại" và thời điểm gửi lại; khách nhận phản hồi chung |
| 28a | Nhân viên chuyển yêu cầu đó sang Đang liên hệ | Dấu nhắc bị xóa; lịch sử của lần gửi lại và các thay đổi trước đó vẫn còn |
| 28b | Gửi lại khác thông tin (đổi ngày hoặc dịch vụ) khi có yêu cầu ở Không liên lạc được | Tạo yêu cầu mới; yêu cầu cũ không bị đặt dấu nhắc |
| 28c | Bấm gửi lại giống hệt nhiều lần liên tiếp khi dấu nhắc đang hiển thị | Không ghi thêm sự kiện lịch sử, không tạo thông báo liên tục; thời điểm hiển thị giữ lần gửi lại đầu của chu kỳ (**theo đề xuất kỹ thuật ở 4.2b, chưa duyệt**; kỳ vọng này chỉ áp dụng sau khi chủ dự án hoặc Codex chốt cách giữ thời điểm). Ví dụ giả lập: Lan gửi lại 10:00 đặt dấu nhắc; bấm lại 10:01, 10:02 vẫn một yêu cầu, một dấu nhắc, thời điểm giữ 10:00 |
| 28d | Người tiếp nhận chuyển sang Đang liên hệ **ngay trước** khi lần gửi lại được xử lý | Không dựng lại dấu nhắc, không ghi đè trạng thái; khách nhận phản hồi chung |
| 28e | Lần gửi lại đến **ngay trước** khi người tiếp nhận chuyển trạng thái | Dấu nhắc được đặt rồi bị xóa theo chuyển trạng thái; lần gửi lại vẫn có trong lịch sử |
| 28f | Người tiếp nhận thao tác trên màn hình cũ (chưa thấy dấu nhắc mới) | Không mất lần gửi lại; thao tác báo cập nhật hoặc xử lý an toàn theo cách xử lý màn hình cũ mà Codex chọn (đề xuất ở 4.2b, chưa duyệt) |
| 28g | Khách vãng lai gửi lại nội dung giống yêu cầu của một tài khoản ở Không liên lạc được | Không đặt dấu nhắc cho yêu cầu của tài khoản (khác phạm vi); không lộ, không gắn chéo |
| 28h | So sánh phản hồi công khai giữa gửi mới, gửi trùng thường và gửi trùng có đặt dấu nhắc | Cùng nội dung thông báo, không phân biệt được |
| 28i | Dùng dấu nhắc để khôi phục tài khoản hoặc đánh dấu số đã xác minh | Không có chức năng nào như vậy |
| 29 | Đọc lại toàn bộ giao diện khách và email nhân viên | Không có chữ "đã đến", "đã khám", "hoàn thành" gắn với Đã xác nhận |
| 30 | Nhiều khách khác nhau đăng nhập qua máy chủ Next.js (dự án thử, tài khoản giả) | Ghi nhận Auth thấy IP nào; giới hạn theo IP có chặn nhầm khách thật hoặc bị làm cạn chung không |
| 31 | Gọi endpoint token trực tiếp vượt ngưỡng (dự án thử, tài khoản giả) | Ghi nhận ngưỡng thực tế và phản hồi; so với mặc định Codex nêu (150 yêu cầu/5 phút/IP) và cấu hình dự án |
| 32 | Dùng token truy cập cũ còn hạn sau khi đăng xuất hoặc đổi mật khẩu | Thao tác cần bảo đảm mạnh bị từ chối nhờ kiểm tra phiên; thao tác thường: ghi nhận hành vi thật, không giả định mất hiệu lực ngay |
| 33 | Người tiếp nhận lưu từ màn hình phiên bản 4 sau khi lần gửi lại đặt dấu nhắc (phiên bản 5) | Không ghi đè; báo tải lại; thấy dấu nhắc rồi mới bắt đầu liên hệ (đề xuất 4.2b) |
| 34 | Khách bấm gửi lại lần hai, ba khi dấu nhắc đang bật | Không tăng phiên bản, không thêm sự kiện, thời điểm vẫn là lần đầu (đề xuất 4.2b, chưa duyệt) |
| 35 | Quản lý đăng nhập có bật TOTP | Thao tác nhạy cảm yêu cầu bước xác thực hai; không có SMS nào được gửi |
| 36 | Cấu hình Phone không SMS qua Management API (dự án thử, tài khoản giả) | **Đã thực hiện (14/10, số giả): API chấp nhận; tạo tài khoản, đăng ký và đăng nhập bằng điện thoại + mật khẩu đạt; không gửi SMS nào.** Chưa lặp với số di động Việt Nam |
| 36d | Đăng ký và đăng nhập sau khi cấu hình Phone, đọc Auth ngay sau khi PATCH | Chờ vài giây cho đến khi Auth báo bật mới đăng ký (bản 9 ghi nhận độ trễ khoảng 5 giây); đăng ký sớm có thể lỗi |
| 36a | Đọc cấu hình Auth ban đầu trước khi đổi bất kỳ giá trị nào (Management API, dự án thử) | Ghi lại giá trị gốc để hoàn nguyên: Phone tắt, tự xác nhận điện thoại tắt, Email bật, tự xác nhận email tắt, đăng ký công khai chưa tắt |
| 36b | Sau khi thử A, trả cấu hình về giá trị ban đầu nếu không đáp ứng | Đọc lại: khớp với giá trị gốc |
| 36c | Đăng ký công khai tắt (điều kiện cho mọi phương án cuối cùng) | Đăng ký trực tiếp từ trình duyệt bị từ chối; đăng ký chỉ qua đường dẫn máy chủ |
| 37a | Khôi phục thử từ bản sao sang môi trường tách biệt (dữ liệu giả) | Số bản ghi khớp; đăng nhập được bằng tài khoản giả cũ; đúng quyền đọc; khách thấy đúng yêu cầu của mình. Chỉ khi đạt mới nhận dữ liệu thật |
| 37b | Cơ sở dữ liệu không phản hồi hoặc dự án bị tạm dừng (môi trường thử) | Form không báo "đã nhận"; hiện thông báo thử lại hoặc gọi bệnh viện; cảnh báo tới người vận hành |
| 37c | Chuyển IP khách cho Auth trên Vercel (môi trường thử) | Auth nhận đúng IP khách; tiêu đề IP do khách giả mạo bị bỏ qua; một khách không làm cạn giới hạn dùng chung |
| 37d | Bản sao lưu có đủ dữ liệu Auth, hồ sơ, thú cưng, yêu cầu và lịch sử | Đối chiếu đủ các bảng. Bản sao **có thể chứa mật khẩu đã băm và dữ liệu cá nhân** nên được mã hóa và giới hạn quyền; **không** chứa mã truy cập, khóa quyền cao hay mật khẩu dạng rõ; không đưa vào GitHub hay nhật ký. Ảnh trong Storage (nếu dùng) sao lưu riêng |
| 37e | Chọn hoặc thêm thú cưng khi gửi form | Chỉ chọn được thú cưng của chính tài khoản; thử chọn thú cưng của tài khoản khác bị chặn |
| 37f | Sửa hoặc xóa thú cưng sau khi đã gửi yêu cầu | Bản chụp trong yêu cầu cũ không đổi |
| 37g | Dịch vụ email lỗi khi khách gửi form | Yêu cầu vẫn được lưu và hiện cho người tiếp nhận; hệ thống thử lại email có giới hạn số lần; khách không phải gửi lại; có cảnh báo cho người vận hành khi hết lần thử |
| 37h | Cơ sở dữ liệu lỗi khi khách gửi form | Không báo "đã nhận"; hiện thông báo thử lại hoặc gọi bệnh viện |
| 37 | Cấu hình A (nếu chạy được) có bền qua các thao tác thông thường trên dashboard | Ghi nhận cấu hình không bị ghi đè hay báo lỗi; dùng để đánh giá mức hỗ trợ ổn định của A |
| 11 | Khách đọc yêu cầu của tài khoản khác hoặc yêu cầu vãng lai | Bị chặn ở tầng cơ sở dữ liệu |
| 12 | Truy cập dữ liệu bằng khóa công khai với bảng thiếu quyền hoặc RLS | Bị chặn; kiểm tra cả quyền được cấp lẫn RLS |
| 13 | Token trình duyệt nhận có chứa thông tin gì | Ghi nhận đúng, không giả định là bí mật |
| 14 | Đổi mật khẩu rồi dùng token cũ còn hạn | Ghi nhận hành vi thật, không hứa mất hiệu lực ngay |
| 15 | Giải phóng số sau tranh chấp | Tài khoản cũ khóa, giữ dữ liệu; số đăng ký lại được; **không** chuyển lịch sử cũ; có nhật ký |

---

*Tài liệu này chưa chốt kiến trúc hay công nghệ và chưa phê duyệt quy trình khôi phục tài khoản nào.*
