import type { Cap } from './capabilities';
import type { HelpArticle } from '../contracts/staff';

/** An article and the rights it is for: any one of `needsAny` is enough, none listed = everyone. */
export type ArticleSource = HelpArticle & { needsAny: readonly Cap[] };

const sample = 'Nội dung mẫu' as const;

// Sample text ("Nội dung mẫu"), waiting for the owner's reading. Each article describes only screens and buttons the staff area has today.
// Kho, Báo cáo, Cài đặt and Hỗ trợ get articles when their screens are built.
export const ARTICLES: ArticleSource[] = [
  {
    id: 'tong-quan', needsAny: [], badge: sample, title: 'Tổng quan: việc cần làm hôm nay',
    summary: 'Trang đầu tiên sau khi đăng nhập, gom những việc cần chú ý trong ngày.',
    steps: [
      'Bấm "Tổng quan" ở thanh bên trái.',
      'Xem các thẻ số như "Lịch hẹn hôm nay", "Yêu cầu cần xử lý", "Đang nội trú". Bạn chỉ thấy thẻ của việc bạn có quyền làm; bấm vào thẻ để đi tới màn hình đó.',
      'Nếu bạn có quyền "Tiếp nhận yêu cầu đặt lịch", phần "Cần gọi lại" nhắc những yêu cầu khách vừa gửi lại hoặc đang ở "Không liên lạc được". Nếu bạn có quyền "Chia sẻ với khách", phần "Chưa gửi nhật ký hôm nay" nhắc các bé nội trú chưa có nhật ký trong ngày.',
    ],
  },
  {
    id: 'yeu-cau-dat-lich', needsAny: ['requests.handle'], badge: sample, title: 'Xử lý yêu cầu đặt lịch',
    summary: 'Từ lúc khách gửi yêu cầu trên web đến khi thành lịch hẹn.',
    steps: [
      'Vào "Yêu cầu đặt lịch". Tab "Cần xử lý" là hàng chờ chung: các yêu cầu "Chờ xác nhận", "Đang liên hệ" và "Không liên lạc được".',
      'Mở một yêu cầu rồi bấm "Bắt đầu liên hệ" để nhận xử lý.',
      'Sau mỗi cuộc gọi, chọn kết quả cuộc gọi và bấm "Lưu cuộc gọi". Gọi mấy lần không được thì chuyển sang "Không liên lạc được".',
      'Khách đồng ý thì bấm "Xác nhận lịch hẹn…", chọn ngày giờ, người phụ trách rồi bấm "Xác nhận và đưa vào lịch".',
      'Khách báo không đặt nữa thì bấm "Hủy yêu cầu…"; bệnh viện chưa thể tiếp nhận (ví dụ chưa có lịch phù hợp) thì bấm "Từ chối…". Chọn lý do rồi xác nhận.',
    ],
  },
  {
    id: 'lich-hen', needsAny: ['appointments.view'], badge: sample, title: 'Xem lịch hẹn',
    summary: 'Xem lịch theo tuần hoặc theo ngày và mở chi tiết từng lịch.',
    steps: [
      'Vào "Lịch hẹn".',
      'Ở "Kiểu xem" chọn "Tuần" hoặc "Ngày".',
      'Bấm vào một lịch để mở chi tiết ở khung bên phải. Ô "Tìm lịch hẹn" giúp tìm theo tên khách hoặc tên bé.',
      'Lịch đã hủy mặc định được ẩn; bật "Hiện lịch đã hủy" nếu cần xem lại.',
    ],
  },
  {
    id: 'sap-xep-lich', needsAny: ['appointments.manage'], badge: sample, title: 'Tạo, đổi và hủy lịch hẹn',
    summary: 'Sắp xếp lịch cho khách đến hoặc gọi điện.',
    steps: [
      'Ở "Lịch hẹn", bấm "Tạo lịch hẹn", chọn khách, bé, dịch vụ, ngày giờ và người phụ trách rồi bấm "Tạo lịch hẹn". Nếu người phụ trách đã có lịch giờ đó, hệ thống sẽ báo trùng.',
      'Muốn dời lịch: mở lịch, bấm "Đổi lịch", chọn ngày giờ mới và bấm "Lưu giờ mới".',
      'Muốn hủy: mở lịch, bấm "Hủy lịch", nhập lý do rồi bấm "Hủy lịch hẹn".',
      'Khi khách xin đổi lịch trên web, mở lịch đó sẽ thấy mục "Khách xin đổi lịch" (trên lịch có dấu "Đang chờ đổi lịch"): bấm "Dời theo mong muốn" hoặc "Đổi lịch" để dời, hoặc "Không đổi" nếu giữ nguyên.',
    ],
  },
  {
    id: 'ho-so-khach', needsAny: ['customers.view'], badge: sample, title: 'Hồ sơ khách hàng và thú cưng',
    summary: 'Tra cứu khách, xem các bé, lịch hẹn, hóa đơn và lịch sử liên hệ.',
    steps: [
      'Vào "Khách hàng" và tìm theo tên, số điện thoại hoặc tên bé.',
      'Bấm vào một khách để mở hồ sơ: thông tin khách, các bé và các tab "Lịch hẹn", "Hóa đơn", "Nội trú", "Lịch sử tương tác".',
      'Nếu bạn có quyền cập nhật hồ sơ: bấm "Chỉnh sửa" rồi "Lưu hồ sơ"; "Thêm thú cưng" rồi "Lưu thú cưng"; "Thêm khách hàng" ở danh sách để tạo khách mới.',
      'Ghi chú nội bộ chỉ nhân viên thấy, khách không bao giờ thấy.',
    ],
  },
  {
    id: 'lien-ket-tai-khoan', needsAny: ['accounts.link'], badge: sample, title: 'Liên kết tài khoản web với hồ sơ',
    summary: 'Cho khách xem lịch hẹn, nội trú và hóa đơn của bé trên web.',
    steps: [
      'Vào "Tài khoản web" (lọc "Chưa liên kết" để xem những tài khoản đang chờ) rồi bấm "Liên kết bằng mã…".',
      'Nhập mã kết nối khách đưa cho bạn, bấm "Tìm tài khoản", rồi chọn hồ sơ khách hàng (hoặc "Tạo hồ sơ mới") và ghép thú cưng nếu có.',
      'Chọn cách xác minh, đánh dấu ô xác nhận đã đối chiếu người đến quầy rồi bấm "Liên kết tài khoản". Từ lúc này khách thấy các bé của mình khi đăng nhập.',
    ],
  },
  {
    id: 'noi-tru-bang-chuong', needsAny: ['inpatient.view'], badge: sample, title: 'Bảng nội trú: nhập viện, chuyển chuồng, xuất viện',
    summary: 'Theo dõi các bé đang nội trú theo từng chuồng.',
    steps: [
      'Vào "Nội trú" để thấy các chuồng. Chuồng trống có nút để nhập viện.',
      'Nhập viện: bấm vào chuồng trống, làm lần lượt các bước (bấm "Tiếp") rồi bấm "Nhập viện".',
      'Chuyển chuồng: mở bé, bấm "Chuyển chuồng…", chọn chuồng mới và bấm "Chuyển chuồng". Nút này chỉ hiện khi bạn có quyền "Nhập viện, xuất viện".',
      'Xuất viện: mở bé, bấm "Xuất viện…", xem tiền nội trú tính đến lúc đó rồi bấm "Xác nhận xuất viện".',
      'Nhập viện, chuyển chuồng và xuất viện đều cần quyền "Nhập viện, xuất viện".',
    ],
  },
  {
    id: 'noi-tru-nhat-ky', needsAny: ['inpatient.diary_write'], badge: sample, title: 'Viết nhật ký và tải video cho chủ nuôi',
    summary: 'Cập nhật cho chủ nuôi biết bé nội trú hôm nay thế nào.',
    steps: [
      'Mở một bé trong "Nội trú", chọn tab "Nhật ký cho chủ nuôi".',
      'Ở khung "Viết nhật ký cho chủ nuôi", chọn buổi, loại, tình trạng chung và viết nội dung. Bấm "Lưu nháp"; nếu bạn có quyền "Chia sẻ với khách" thì có thêm "Chia sẻ ngay" để chủ nuôi thấy.',
      'Bấm "Xem như chủ nuôi" để xem đúng những gì khách nhìn thấy trước khi chia sẻ.',
      'Video: bấm "Tải video lên", làm theo các bước (bấm "Tiếp"), chọn video mẫu hoặc chọn từ máy (tệp tới 100 MB; video luôn không có tiếng và chỉ phát 15 giây đầu, dài hơn sẽ tự cắt). Cuối cùng lưu thành bản nháp, hoặc bấm "Tải lên và chia sẻ" nếu bạn có quyền "Chia sẻ với khách".',
      'Chủ nuôi không bao giờ thấy tên thuốc, liều, giờ thực hiện hay ghi chú nội bộ.',
    ],
  },
  {
    id: 'hoa-don-lap-phat-hanh', needsAny: ['invoices.create'], badge: sample, title: 'Lập và phát hành hóa đơn',
    summary: 'Từ hóa đơn nháp đến hóa đơn khách nhìn thấy.',
    steps: [
      'Vào "Hóa đơn" và bấm "Tạo hóa đơn" (hoặc "Tạo hóa đơn" ngay từ lịch hẹn hay hồ sơ khách), chọn khách và bé rồi bấm "Tạo hóa đơn nháp".',
      'Bấm "Thêm dịch vụ" để chọn dịch vụ, thuốc, vật tư từ bảng giá. Chỉnh số lượng; mục "nhập giá" thì nhập giá ngay trên dòng.',
      'Bấm "Lưu nháp" để lưu. Khung "Xem trước hóa đơn" cho biết khách sẽ thấy gì; sau khi phát hành, khung "Hóa đơn khách sẽ thấy" hiện đúng bản khách xem.',
      'Khi đủ, bấm "Phát hành hóa đơn" và xác nhận ở hộp "Phát hành hóa đơn?". Hóa đơn đã phát hành không sửa được nữa.',
    ],
  },
  {
    id: 'thu-tien', needsAny: ['payments.record'], badge: sample, title: 'Thu tiền tại quầy',
    summary: 'Ghi nhận khoản khách trả cho một hóa đơn đã phát hành.',
    steps: [
      'Mở hóa đơn đã phát hành, bấm "Ghi nhận thanh toán".',
      'Chọn phương thức (tiền mặt, chuyển khoản hoặc QR ngân hàng) và nhập số tiền. Khách trả một phần cũng được, hóa đơn sẽ hiện "Đã thanh toán một phần".',
      'Với tiền mặt, nhập số tiền khách đưa để thấy tiền thối lại.',
      'Bấm "Xác nhận đã nhận tiền". Thanh toán chỉ diễn ra tại quầy, không có thanh toán trực tuyến.',
    ],
  },
  {
    id: 'bang-gia', needsAny: [], badge: sample, title: 'Bảng giá',
    summary: 'Giá dịch vụ, thuốc và vật tư dùng khi lập hóa đơn.',
    steps: [
      'Vào "Bảng giá" để xem danh sách theo nhóm.',
      'Giá trong bản demo là giá minh họa, chưa phải giá thật của bệnh viện.',
      'Giá mới chỉ áp dụng cho hóa đơn lập sau; hóa đơn cũ giữ nguyên giá đã ghi.',
    ],
  },
  {
    id: 'kho', needsAny: ['stock.view'], badge: sample, title: 'Kho: xem tồn, nhập, xuất, kiểm kê',
    summary: 'Thuốc và vật tư của bệnh viện: còn bao nhiêu, món nào sắp hết hoặc sắp hết hạn.',
    steps: [
      'Vào "Kho". Bốn ô ở trên cho biết số món "Sắp hết", "Hết hàng", "Sắp hết hạn" và "Đã hết hạn"; bấm vào ô để lọc. Ô "Tìm trong kho" tìm theo mã hoặc tên món.',
      'Bấm vào một món để xem số còn lại và "Lịch sử nhập xuất" của món đó. Mọi nhân viên đều xem được kho.',
      'Nhập hàng về: bấm "Nhập thêm", điền số lượng (và hạn dùng của lô mới) rồi bấm "Nhập vào kho". Cần quyền "Nhập thêm kho".',
      'Lấy ra dùng: bấm "Xuất ra", chọn lý do rồi bấm "Xuất khỏi kho". Cần quyền "Xuất kho".',
      'Đếm lại thực tế: bấm "Kiểm kê", nhập số đếm được rồi bấm "Lưu kiểm kê"; kho ghi lại chênh lệch. Cần quyền "Kiểm kê kho".',
      'Thêm món mới ("Thêm món"), sửa thông tin hoặc "Ngừng dùng món này" cần quyền "Thêm, sửa, ngừng dùng món kho". Kho chỉ ghi nhận nhập, xuất và kiểm kê, không tự trừ khi điều trị hay lập hóa đơn.',
    ],
  },
  {
    id: 'doanh-thu', needsAny: ['reports.revenue'], badge: sample, title: 'Xem doanh thu',
    summary: 'Tiền đã thu, theo ngày, theo phương thức và theo nhóm dịch vụ.',
    steps: [
      'Vào "Doanh thu" và chọn khoảng thời gian cần xem.',
      'Các thẻ số cho biết tiền đã thu, số hóa đơn phát hành và số tiền còn phải thu.',
      'Xem thêm "Tiền thu theo ngày", "Theo phương thức", "Theo nhóm dịch vụ" và danh sách "Hóa đơn còn nợ".',
      'Số liệu trong bản demo được tính từ dữ liệu mẫu.',
    ],
  },
  {
    id: 'quyen-cua-toi', needsAny: [], badge: sample, title: 'Quyền của tôi và vì sao có nút bị ẩn',
    summary: 'Mỗi người chỉ thấy và làm những việc hợp với quyền được cấp.',
    steps: [
      'Mở menu tài khoản (bấm tên của bạn ở cuối thanh bên trái, hoặc chữ cái đầu ở thanh trên cùng; trên điện thoại bấm "Thêm"), rồi chọn "Quyền của tôi" để xem danh sách quyền hiện có.',
      'Mục nào không có trong thanh bên trái nghĩa là bạn chưa có quyền tương ứng.',
      'Cần thêm quyền thì nhờ Quản lý cấp.',
    ],
  },
];
