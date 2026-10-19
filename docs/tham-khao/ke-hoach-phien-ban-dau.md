# Kế hoạch đề xuất: giai đoạn 1 website Bệnh viện thú y Lê Sơn (bản 6)

**Ngày:** 14/10/2026 · **Người soạn:** Claude, đã chỉnh theo phản biện của Codex và rà soát của chủ dự án · **Trạng thái:** **bản nháp đề xuất**. Chủ dự án đã chấp nhận sáu nội dung chỉnh sửa của bản 2 nhưng **chưa phê duyệt toàn bộ kế hoạch để bắt đầu lập trình**. Chưa có mã, chưa mua dịch vụ nào, **chưa merge vào main**, không bắt đầu triển khai chính thức khi chủ dự án chưa phê duyệt.

**Thuật ngữ:** "**giai đoạn 1**" là phạm vi sản phẩm (website, tài khoản khách, thú cưng, form yêu cầu). "**Bước 1–6**" là các bước thực hiện bên trong giai đoạn 1. Hệ thống tổng thể tương lai: xem [định hướng sản phẩm](https://github.com/lqt140304-rgb/web-b-nh-vi-n/blob/claude/optimistic-mccarthy-d1d15i/docs/dinh-huong-san-pham.md).

**Quy ước nhãn:** **[Đã chốt]** chủ dự án quyết định · **[Đề xuất]** của Claude hoặc Codex, cần phản biện · **[Giả định]** chưa xác nhận · **[Cần chốt]** quyết định còn thiếu · **[Chờ kiểm chứng]** chưa có bằng chứng.

Nguồn chi tiết: [tài liệu rà soát](https://github.com/lqt140304-rgb/web-b-nh-vi-n/blob/claude/optimistic-mccarthy-d1d15i/docs/rasoat-tai-khoan-va-form-dat-lich.md) (số mục dẫn bên dưới là mục của tài liệu đó) và [brief Hero/Header cho Antigravity](https://github.com/lqt140304-rgb/web-b-nh-vi-n/blob/claude/optimistic-mccarthy-d1d15i/docs/antigravity-brief-hero.md).

**Thay đổi bản 6 (quyết định phạm vi thiết kế của chủ dự án, 14/10):** tạm hoãn tính năng **mèo chuyển đổi ba tư thế giữa các trang** sang giai đoạn phát triển sau; không triển khai animation hay logic chuyển tư thế trong Hero/Header phiên bản đầu; giữ lại toàn bộ tài nguyên SVG đã tạo; nếu cần hình mèo thì chỉ dùng phiên bản tĩnh; ưu tiên hoàn thiện giao diện **Minimal Creative** đã chọn (bố cục gọn, không chồng lấn, responsive, trải nghiệm); tính năng này không được làm chậm Hero/Header. Ghi vào danh sách phát triển sau của tài liệu định hướng sản phẩm.

**Bổ sung (14/10, phân công QA):** từ Services V1, Claude là QA chính các bản thiết kế/demo của Antigravity, Codex là QA kỹ thuật dự phòng, Antigravity chỉ thiết kế và sửa theo danh sách đã được chủ dự án duyệt; chi tiết ở [quy-trinh-qa-ui-ux.md](quy-trinh-qa-ui-ux.md).

**Thay đổi bản 5 (quyết định phân công của chủ dự án, 14/10):** **Google Antigravity thay Gemini** đảm nhiệm thiết kế UI/UX và dựng giao diện trực quan (responsive, hiệu ứng, bản demo với dữ liệu giả). Claude: phân tích nghiệp vụ, tài liệu, tiêu chí nghiệm thu, rà soát. Codex: lập trình chính thức, tích hợp Supabase, kiểm thử, triển khai Vercel. ChatGPT: hỗ trợ điều phối và đánh giá phương án. Antigravity dùng logo Lê Sơn do chủ dự án cung cấp và kế thừa nhận diện tím, kem, cam, xanh ngọc; ưu tiên Hero/Header; chủ dự án duyệt giao diện trước khi Codex triển khai chính thức. Các quyết định nghiệp vụ đã chốt không đổi.

**Thay đổi bản 4 (quyết định hạ tầng của chủ dự án, 14/10):** Vercel Hobby + Supabase Free trong phát triển và kiểm thử nội bộ, ưu tiên Next.js; chưa mua Vercel Pro hay nâng Supabase; **phân biệt môi trường phát triển miễn phí với môi trường vận hành thương mại** (mục 6); trước hoạt động thương mại phải đánh giá và chọn gói phù hợp điều khoản; khi hoàn thiện căn cứ số liệu để đề xuất nâng cấp; không tự nâng cấp hay phát sinh chi phí. **Bỏ yêu cầu bắt buộc kiểm chứng OpenNext/Cloudflare** cho phương án chính. Giữ Supabase Free và yêu cầu sao lưu, khôi phục, bảo mật.

**Thay đổi bản 3 (theo rà soát của chủ dự án, 14/10):** (1) làm rõ giai đoạn 1 và hệ thống tổng thể; chức năng ngoài giai đoạn 1 là "chưa triển khai trong giai đoạn này", không loại bỏ vĩnh viễn; (2) điều chỉnh cơ cấu nhân sự: không có lễ tân riêng, phân quyền theo khả năng kiêm nhiệm (đã đổi thuật ngữ "lễ tân" thành "người tiếp nhận" trong các tài liệu); (3) yêu cầu hệ thống tổng thể lưu ở tài liệu định hướng sản phẩm; (4) nền tảng và chi phí chỉ áp dụng cho website giai đoạn 1 (bản 3 ghi Cloudflare + Supabase Free; **đã thay ở bản 4**); (5) tiếp tục hoàn thiện quyết định nghiệp vụ, thiết kế giao diện và mô hình dữ liệu trước khi viết mã.

**Thay đổi bản 2 (theo phản biện của Codex):** sửa thứ tự phụ thuộc giữa kiểm chứng, thiết kế và xây dựng (không còn coi mọi kiểm thử là điều kiện phải đạt trước khi thiết kế); bổ sung hồ sơ khách và thú cưng; bổ sung độ tin cậy của email; ngân sách là mỗi tháng; phương án A ghi đúng là đề xuất chưa chốt; Antigravity mới có brief Hero/Header, chưa có mockup được duyệt.

---

## 1. Phạm vi và nguyên tắc

**[Đã chốt] Giai đoạn 1 gồm:** website giới thiệu bệnh viện và dịch vụ; tài khoản khách hàng; hồ sơ thú cưng; form yêu cầu đặt lịch; trang quản trị cho nhân viên xử lý yêu cầu; email báo nhân viên.

**[Đã chốt] Chưa triển khai trong giai đoạn 1** (không phải bị loại bỏ vĩnh viễn): nhập hoặc đồng bộ dữ liệu GPet; bệnh án, nội trú, chăm sóc, điều trị, video, quản lý công việc, kho, bán hàng, thanh toán, hóa đơn điện tử và các phân hệ khác; trạng thái "đã đến/đã khám"; tính năng mèo chuyển đổi ba tư thế giữa các trang (giao diện, tạm hoãn ngày 14/10, xem danh sách phát triển sau trong tài liệu định hướng sản phẩm). GPet vẫn là hệ thống vận hành chính trong giai đoạn 1. Yêu cầu của hệ thống tổng thể được lưu trong [định hướng sản phẩm](https://github.com/lqt140304-rgb/web-b-nh-vi-n/blob/claude/optimistic-mccarthy-d1d15i/docs/dinh-huong-san-pham.md).

**[Đã chốt] Quy tắc đã khóa:**
- **Môi trường phát triển:** Vercel Hobby + Supabase Free, ưu tiên Next.js; chưa mua Vercel Pro hay nâng Supabase; dữ liệu giả. **Môi trường vận hành thương mại** tách riêng, chọn gói phù hợp điều khoản trước khi hoạt động (mục 6). Không tự nâng cấp hay phát sinh chi phí khi chưa được chủ dự án đồng ý. Không OTP cho khách.
- Mục tiêu dự toán khoảng **300.000 đồng mỗi tháng** (chốt khi nền tảng là Cloudflare; **cần xác nhận lại cho vận hành thương mại**, mục 6) cho dịch vụ vận hành **website giai đoạn 1** (**không được suy rộng** thành chi phí vận hành toàn bộ phần mềm bệnh viện): hosting, phần dùng cơ sở dữ liệu và email còn trong hạn mức, tên miền phân bổ theo năm, dự phòng nhỏ. **Chưa gồm** công phát triển, bảo trì, phí AI. Đây là mục tiêu dự toán, **không phải trần hóa đơn** khi vượt hạn mức.
- Khách vãng lai và khách đăng nhập đều gửi được form; không tự gắn yêu cầu vãng lai vào tài khoản theo số điện thoại.
- Chống trùng theo phạm vi (mục 4.2); sáu trạng thái và luồng chính (mục 4.2a); dấu nhắc "cần gọi lại" khi Không liên lạc được (mục 4.2b).
- Giữ bản chụp thông tin tại thời điểm gửi; nhân viên gọi xác nhận; gửi form chưa phải đã có lịch.

**[Đề xuất của Codex, chưa chốt] Phương án A** (điện thoại + mật khẩu không OTP): đã đăng ký và đăng nhập được với số giả. Chủ dự án **chưa duyệt** lựa chọn này; bằng chứng mới tối thiểu, chưa đủ cho sản xuất.

**Nguyên tắc làm việc [Đề xuất]:** dữ liệu giả cho mọi thử nghiệm; chưa đưa dữ liệu khách thật vào cho đến Cổng 5 (Bước 5); điều chưa chốt là điều kiện chặn có nhãn rõ, không tự quyết; **không dùng kiểm thử còn thiếu để chặn việc viết bản thiết kế nháp**; nội dung nháp có nhãn dùng để đánh giá nhưng **không đưa chỗ giữ chỗ lên bản công khai**; không thêm biểu mẫu hay vòng duyệt cho chi tiết triển khai thông thường.

---

## 2. Vai trò

| Bên | Việc chính |
|---|---|
| Chủ dự án | Quyết định nghiệp vụ; cung cấp logo và nội dung chính thức; **duyệt giao diện trước khi Codex triển khai chính thức**; duyệt thiết kế và kế hoạch; chạy công cụ cần quyền bí mật trên dự án thử |
| **Antigravity** (Google Antigravity, thay Gemini) | Thiết kế UI/UX, responsive, hiệu ứng, bản demo giao diện **với dữ liệu giả**. Dùng logo Lê Sơn do chủ dự án cung cấp; kế thừa nhận diện tím, kem, cam, xanh ngọc. Ưu tiên Hero/Header (có [brief](https://github.com/lqt140304-rgb/web-b-nh-vi-n/blob/claude/optimistic-mccarthy-d1d15i/docs/antigravity-brief-hero.md)); hướng đã chọn **Minimal Creative**, bản hoàn thiện chưa được duyệt; ưu tiên bố cục gọn, không chồng lấn, responsive, trải nghiệm; **không** triển khai mèo ba tư thế (hoãn), nếu cần hình mèo chỉ dùng bản tĩnh. Không tích hợp dữ liệu khách thật |
| Claude | Phân tích nghiệp vụ, tài liệu, **tiêu chí nghiệm thu**, rà soát (nghiệp vụ, mô hình dữ liệu, phân quyền, chất lượng mã); soạn kịch bản kiểm thử |
| Codex | Lập trình chính thức, tích hợp Supabase, kiểm thử, triển khai Vercel; kiểm chứng kỹ thuật trên môi trường thử |
| ChatGPT | Hỗ trợ điều phối và đánh giá phương án |

**Quy tắc phối hợp [Đã chốt]:** Antigravity chỉ dựng bản demo giao diện với dữ liệu giả; **chủ dự án duyệt giao diện trước khi Codex triển khai chính thức**. Mã của bản demo là tham chiếu giao diện, không mặc định là mã chính thức (Codex quyết định có tái sử dụng hay không) [Đề xuất].

Phân công có thể điều chỉnh.

**Cơ cấu nhân sự của bệnh viện [Đã chốt]:** không có lễ tân riêng. Quản lý kiêm tiếp nhận khách hàng và điều hành; bác sĩ kiêm nhân viên khám, điều trị và chăm sóc; nhân viên Spa theo nhiệm vụ được phân công. **Thiết kế phân quyền theo khả năng kiêm nhiệm** (một người giữ nhiều khả năng, mỗi người một tài khoản cá nhân), không mặc định mỗi vai trò là một nhân sự riêng (xem [định hướng sản phẩm](https://github.com/lqt140304-rgb/web-b-nh-vi-n/blob/claude/optimistic-mccarthy-d1d15i/docs/dinh-huong-san-pham.md), mục 2). Trong các tài liệu, "người tiếp nhận" chỉ **khả năng** xử lý yêu cầu đặt lịch, không phải một chức danh riêng.

---

## 3. Thứ tự các bước

Mỗi bước có một cổng ngắn. Các bước có thể gối nhau khi không phụ thuộc.

### Bước 1: chốt brief, quyết định nghiệp vụ ảnh hưởng bản đầu, chọn hướng giao diện

- Antigravity nộp thiết kế Hero/Header và **bản demo với dữ liệu giả** theo [brief](https://github.com/lqt140304-rgb/web-b-nh-vi-n/blob/claude/optimistic-mccarthy-d1d15i/docs/antigravity-brief-hero.md), dùng logo do chủ dự án cung cấp và nhận diện tím, kem, cam, xanh ngọc; Claude rà soát theo tiêu chí nghiệm thu trong brief (mục 7); chủ dự án chọn hướng. Có thể dùng nội dung nháp có nhãn để đánh giá, **không đưa chỗ giữ chỗ lên bản công khai**.
- Chủ dự án chốt các quyết định nghiệp vụ thật sự còn thiếu (mục 5 dưới đây) và cung cấp nội dung chính thức dần: nhận diện, ảnh, địa chỉ, số điện thoại, giờ làm việc, danh sách dịch vụ, bảng giá (có hiển thị công khai không), câu giới thiệu.

**Cổng 1:** hướng giao diện Hero/Header được **chủ dự án duyệt**; các quyết định nghiệp vụ bắt buộc cho thiết kế đã chốt hoặc ghi tạm thời có nhãn.

### Bước 2: chọn hướng Auth bằng bằng chứng tối thiểu

- **Bằng chứng đã có:** A đăng ký và đăng nhập được với số giả, không OTP, không nhà cung cấp SMS (mục 2).
- Nếu cần: kiểm chứng bằng **probe có phạm vi cụ thể** cách chạy ứng dụng Next.js trên Vercel Hobby trong phát triển và các rủi ro cấu hình chưa rõ (độ bền cấu hình Phone khi dùng dashboard).
- Chỉ thử B nếu A không đáp ứng.
- **Không coi bằng chứng tối thiểu là đạt mọi điều kiện sản xuất.**

**Cổng 2:** chủ dự án duyệt chọn A (hoặc B nếu A không đáp ứng). Kiểm chứng OpenNext/Cloudflare **không còn bắt buộc**; chỉ làm nếu sau này cân nhắc chuyển nền tảng cho vận hành thương mại.

### Bước 3: thiết kế mô hình dữ liệu, quyền, luồng form và vận hành

- Claude + Codex: mô hình dữ liệu và **phân quyền theo khả năng** (một người có thể giữ nhiều khả năng: tiếp nhận yêu cầu, quản lý nội dung, quản lý tài khoản nhân viên, thao tác nhạy cảm, quản trị; vai trò chỉ là bộ khả năng soạn sẵn), và mô hình dữ liệu: tài khoản web tách khỏi hồ sơ khách hàng; thú cưng thuộc tài khoản; bản chụp yêu cầu; lịch sử đổi trạng thái chỉ ghi thêm; ba mốc thời gian; dấu nhắc; khóa chống trùng theo phạm vi; bản ghi thông báo email; nhật ký thao tác nhạy cảm.
- Antigravity (thiết kế và demo dữ liệu giả, không tích hợp dữ liệu thật): luồng đăng ký, đăng nhập, form (vãng lai và đăng nhập), xem lại yêu cầu, hồ sơ và thú cưng, thông báo "Chờ nhân viên xác nhận", màn hình tiếp nhận, các phần còn lại của trang. Quy trình hỗ trợ tài khoản chỉ vẽ sau khi được duyệt.
- Vận hành: sao lưu, giám sát, ứng phó khi dự án bị tạm dừng (mục 6a).

**Cổng 3:** **chủ dự án duyệt giao diện và bản thiết kế (mô hình dữ liệu, phân quyền) và kế hoạch trước khi Codex triển khai chính thức.** Claude rà soát phản hồi công khai theo mục 4.4.

### Bước 4: xây một luồng hoàn chỉnh trên môi trường thử, kiểm thử song song

Chọn một luồng đầu-cuối nhỏ nhất có ý nghĩa, ví dụ: khách đăng ký, đăng nhập, thêm thú cưng, gửi yêu cầu; người tiếp nhận thấy, đổi trạng thái; email báo nhân viên. Mở rộng dần.

**Hạng mục xây dựng:**
- Website giới thiệu và dịch vụ; nội dung do chủ dự án quản lý.
- Đăng ký, đăng nhập (điện thoại hoặc tên đăng nhập), xem lại yêu cầu.
- **Hồ sơ tài khoản** (tên, số liên hệ tự điền) và **danh sách thú cưng thuộc tài khoản**; chọn thú cưng đã có hoặc thêm và lưu thú cưng mới từ form; **kiểm tra quyền** (không chọn được thú cưng của tài khoản khác); **bản chụp** thông tin tại thời điểm gửi (sửa thú cưng sau không sửa ngược yêu cầu cũ). Không mở rộng sang bệnh án hay nhập GPet.
- Form cho khách vãng lai và khách đăng nhập; chống trùng theo phạm vi; dấu nhắc gọi lại; giới hạn tần suất và chống bot.
- Trang quản trị: danh sách yêu cầu, đổi trạng thái có lý do, lịch sử, kiểm tra phiên bản; tài khoản nhân viên do quản lý tạo; xác thực hai bước cho quản lý.
- **Email báo nhân viên có độ tin cậy:** lưu yêu cầu và bản ghi thông báo chờ gửi **trong cùng một giao dịch**, gửi email sau; có thử lại, giới hạn số lần, hiển thị hoặc cảnh báo khi lỗi; chưa cần dịch vụ hàng đợi riêng. Ví dụ: Lan gửi form lúc dịch vụ email lỗi: yêu cầu vẫn lưu và hiện cho người tiếp nhận, hệ thống thử lại email, Lan không phải gửi lại. Nếu cơ sở dữ liệu lỗi thì **không báo đã nhận**. Sao lưu và giám sát không thay cho cơ chế này. Email khi khách gửi lại **chưa chốt**.

**Kiểm thử song song** theo phần đã có: tên đăng nhập, số di động Việt Nam, quyền dữ liệu, chuyển IP khách trên Vercel, chống trùng, email, theo danh sách mục 10 của tài liệu rà soát.

**Cổng 4:** luồng chạy đúng trên môi trường thử với dữ liệu giả; các kịch bản kiểm thử của phần đã làm đạt; Claude rà soát phân quyền.

### Bước 5: kiểm thử tích hợp, xuất và khôi phục, kiểm thử tải, chuẩn bị vận hành

- Hoàn thiện các luồng còn lại; kiểm thử tích hợp.
- **Thử xuất và khôi phục:** có thể thử khả năng xuất/nhập sớm với dữ liệu giả nhỏ, nhưng **phải thử lại với mô hình cuối.**
- Kiểm thử tải ở mức phù hợp (hạn mức dịch vụ không phải bằng chứng chịu tải).
- Sao lưu hằng ngày, mã hóa, lưu riêng (bản sao có mật khẩu đã băm và dữ liệu cá nhân nên phải bảo vệ); giám sát và cảnh báo; quy trình khi Supabase bị tạm dừng; thông báo "thử lại hoặc gọi bệnh viện" khi lưu thất bại.
- Chính sách quyền riêng tư, thông báo đồng ý, chính sách lưu trữ và xóa dữ liệu; rà soát pháp lý về lưu dữ liệu cá nhân (chưa có kết luận).
- Hướng dẫn người tiếp nhận và quản lý; quy trình hỗ trợ tài khoản; tên miền và cấu hình triển khai; kiểm tra chi phí thực tế.

**Cổng 5 (bắt buộc trước dữ liệu thật):** khôi phục thử đạt với mô hình cuối; chủ dự án duyệt quy trình vận hành và rủi ro còn lại. **Cổng thương mại (cùng Cổng 5):** đã đánh giá và chọn gói triển khai phù hợp điều khoản sử dụng, và chủ dự án đồng ý chi phí (mục 6).

### Bước 6: chạy hạn chế rồi mở rộng

- Chạy với nhóm nhỏ hoặc trong thời gian ngắn, nhân viên theo dõi sát; sửa lỗi; xem lại cảnh báo và tải thực tế.
- Mở rộng khi chủ dự án chấp nhận kết quả.
- Xem lại các quyết định tạm thời (OTP, gói trả phí, chặn mật khẩu rò rỉ) theo số liệu thực tế. **Không tự nâng gói hay mua dịch vụ khi chưa được chủ dự án duyệt.**

---

## 4. Rủi ro chính

| Rủi ro | Giảm thiểu |
|---|---|
| Số điện thoại chưa xác minh, có thể bị chiếm đăng ký | Quy trình tranh chấp số; không chuyển lịch sử cũ; thông báo công khai giống nhau |
| Gói Free không có sao lưu tự động | Sao lưu tự làm hằng ngày; cổng khôi phục thử trước dữ liệu thật |
| Dự án Free bị tạm dừng khi ít hoạt động | Cảnh báo, quy trình ứng phó; không báo "đã nhận" khi lưu thất bại; Free không bảo đảm luôn nhận lịch |
| Quản lý là một người giữ mọi quyền | Người dự phòng; xác thực hai bước; ghi nhật ký |
| Giới hạn IP của Auth khi đi qua máy chủ | Kiểm thử trên Vercel trong Bước 4 |
| Cấu hình Phone chỉ đặt được qua Management API | Kiểm thử độ bền; không bấm lưu mục Phone trong dashboard cho tới khi rõ hậu quả |
| Điều khoản gói miễn phí không cho phép dùng thương mại | Đánh giá và chọn gói phù hợp trước khi hoạt động thương mại (Cổng 5, mục 6) [Chờ kiểm chứng điều khoản] |
| Chi phí gói thương mại vượt mục tiêu 300.000 đồng/tháng | Xác nhận lại mục tiêu hoặc xem lại nền tảng khi đến cổng; không tự nâng cấp |
| Kỹ thuật xã hội vào quy trình khôi phục tài khoản | Quy trình có bằng chứng, nhật ký, không lộ dữ liệu qua điện thoại |
| Email lỗi làm người tiếp nhận bỏ sót yêu cầu | Yêu cầu luôn hiện trên trang quản trị; thử lại có giới hạn; cảnh báo |
| Nội dung chính thức chậm | Nội dung nháp chỉ ở môi trường thử; không đưa chỗ giữ chỗ lên bản công khai |
| Phạm vi phình ra | Giữ danh sách "ngoài phạm vi" (mục 1; mục 8 của tài liệu rà soát) |

## 5. Quyết định nghiệp vụ thật sự còn thiếu (cho chủ dự án)

Chỉ liệt kê điều chủ dự án mới quyết định được. Các chi tiết kỹ thuật thông thường để Codex đề xuất, không cần thêm vòng duyệt.

1. **Duyệt chọn phương án A** cho tài khoản (đề xuất của Codex).
2. **Chuyển trạng thái và quyền:** ai được hủy, mở lại yêu cầu đã hủy hoặc từ chối, chuyển ngược từ Đã xác nhận; trạng thái nào còn chặn tạo trùng (đề xuất ở mục 4.2a).
3. **Ai giữ khả năng nào** (bệnh viện không có lễ tân riêng): ai ngoài quản lý tiếp nhận và xử lý yêu cầu đặt lịch (ví dụ bác sĩ nào); ai được làm thao tác nhạy cảm (đặt lại mật khẩu, giải phóng số, khóa tài khoản); **ai dự phòng khi quản lý vắng.**
4. **Bằng chứng đủ để khôi phục tài khoản cũ** và ai quyết định (mục 5.1 của tài liệu rà soát).
5. **Thời gian gọi lại và số lần liên hệ tối đa** trước khi đóng yêu cầu.
6. **Lý do hủy/từ chối:** văn bản tự do hay danh mục; có hiện cho khách không.
7. **Có nhận số cố định không**; khách đăng nhập có được sửa số liên hệ trong từng yêu cầu không (đề xuất mặc định: khóa).
8. **Chính sách lưu trữ và xóa dữ liệu**, nội dung thông báo đồng ý.
9. **Email báo nhân viên:** ai nhận; có gửi email khi khách gửi lại không.
10. **Chấp nhận rủi ro gói Free:** dự án có thể bị tạm dừng khi ít dùng; mất tối đa dữ liệu từ lần sao lưu cuối khi có sự cố.
11. **Nội dung chính thức:** logo (chủ dự án cung cấp trực tiếp cho Antigravity; Claude chưa nhận tệp), mã màu cụ thể cho hướng tím, kem, cam, xanh ngọc, ảnh, liên hệ, danh sách dịch vụ, có hiển thị bảng giá công khai không.
12. **Vận hành thương mại:** định nghĩa "hoạt động thương mại" để áp dụng cổng; mục tiêu chi phí vận hành thương mại (300.000 đồng/tháng được đặt khi nền tảng là Cloudflare; gói thương mại của Vercel và Supabase có thể cao hơn nhiều); chấp nhận hay không việc nâng cấp khi đến cổng. Không cần quyết định ngay; cần trước Cổng 5.

## 6. Môi trường phát triển và vận hành thương mại

| | Phát triển và kiểm thử nội bộ | Vận hành thương mại |
|---|---|---|
| Nền tảng web | Vercel Hobby, ưu tiên Next.js | **Chọn sau**, phải phù hợp điều khoản sử dụng |
| Cơ sở dữ liệu | Supabase Free | Đánh giá lại khi đến cổng |
| Dữ liệu | Chỉ dữ liệu giả | Dữ liệu khách thật chỉ sau Cổng 5 |
| Chi phí | Không mua Vercel Pro, không nâng Supabase | Chủ dự án đồng ý trước khi phát sinh; **mục tiêu 300.000 đồng/tháng cần xác nhận lại** |
| Sao lưu, khôi phục, bảo mật | Vẫn bắt buộc (mục 6a tài liệu rà soát) | Bắt buộc |
| Điều khoản | Hobby dành cho phát triển; Claude chưa tự đọc điều khoản (Codex nêu Hobby là cá nhân, phi thương mại) | Phải kiểm tra và chọn gói phù hợp |

Khi website hoàn thiện, căn cứ **lượng truy cập, mức dùng tài nguyên, chi phí và yêu cầu ổn định** để đề xuất phương án nâng cấp; chủ dự án quyết định. Chi tiết: mục 6b tài liệu rà soát.

## 7. Điều kế hoạch này không nói

- **Chưa có mốc ngày hoặc ước lượng giờ công**; sẽ chỉ báo khi Codex đánh giá được.
- Chưa là phê duyệt thiết kế, cơ chế tài khoản hay quy trình khôi phục.
- Chưa bảo đảm gói Free đáp ứng vận hành liên tục hoặc mục tiêu dự toán ở mọi mức tải.
