# Phần 4 — Dữ liệu khu nhân viên: khách hàng, bảng giá, doanh thu (thiết kế)

Ngày: 21/10/2026 · Nhánh `claude/du-lieu` · Chờ chủ dự án duyệt. Thuộc phần 4 của `2026-10-20-lam-lai-giao-dien-design.md` (§4 mục "Khách hàng", "Quản lý bảng giá", "Doanh thu"). Màn hình do nhánh giao diện làm; tài liệu này chỉ là **dữ liệu và chức năng** (hợp đồng `api` + bản cài đặt dữ liệu mẫu).

## 1. Mục tiêu

Để màn hình khu nhân viên làm được các thao tác mẫu yêu cầu mà hiện chưa chạy được:

- **Khách hàng:** sửa hồ sơ khách và thú cưng (kể cả cân nặng), thêm thú cưng đủ thông tin, báo khi số điện thoại đã có ở hồ sơ khác, và có "lịch sử tương tác" của khách.
- **Bảng giá:** thêm và sửa mục giá, tắt/bật mục, giá cố định hoặc giá linh hoạt (kèm giá tham khảo).
- **Doanh thu theo danh mục:** số liệu đúng và khớp tổng khi hóa đơn có giảm giá.

**Thành công khi:** mỗi thao tác chạy trọn trong demo, tab khác không bị ghi đè (kiểm tra phiên bản), người không đủ quyền bị chặn ở API, và hóa đơn đã lập không đổi khi bảng giá đổi.

Nguồn ràng buộc: `docs/thiet-ke/QUYET-DINH.md` (R1–R33) → thiết kế làm lại → tài liệu này. Mẫu giao diện "bảng giá & doanh thu" và "khách hàng & hồ sơ khách" **chưa có tệp** (§7 thiết kế làm lại), nên tài liệu này theo chữ trong thiết kế làm lại, không theo hình.

## 2. Hiện trạng (đã đọc mã)

| Mảng | Đã có | Thiếu |
|---|---|---|
| Khách | `list(q)`, `get(id)`, `create`, `createPet` (tên, loài, giống, giới, năm sinh, cảnh báo) | sửa khách, sửa bé, cân nặng/màu/triệt sản/ghi chú nội bộ của bé, phiên bản, cảnh báo trùng số, lịch sử tương tác |
| Bảng giá | `prices.list()` (chỉ đọc) | thêm, sửa, tắt/bật, giá tham khảo, phiên bản |
| Doanh thu | `revenue({from,to})`: thu trong kỳ, theo phương thức, theo danh mục, theo ngày, còn nợ | `byCategory` cộng tiền dòng **trước** giảm giá nên không khớp tổng hóa đơn; chưa có tổng "đã lập hóa đơn" |

Phân trang: `DataTable` (nhánh giao diện) đã phân trang phía giao diện; danh sách khách ~18 dòng, hóa đơn ~35 dòng. **Quyết định:** không đổi hợp đồng `list` để phân trang phía dữ liệu (xem §7, câu hỏi 2).

## 3. Quyết định thiết kế

### 3.1 Khách hàng

`Customer` và `Pet` thêm `version` (bắt đầu 1, tăng mỗi lần sửa); `StaffCustomerDetail.version` và `StaffPet.version` đưa ra giao diện để kiểm tra phiên bản như các thao tác khác.

- **Sửa khách** `customers.update(id, version, CustomerInput)` — quyền `customers.edit`. Trường: họ tên (bắt buộc), số điện thoại (bắt buộc, chuẩn hóa +84), địa chỉ, ghi chú nội bộ. Giá trị mới thay hoàn toàn giá trị cũ (trường để trống = xóa). Lỗi giữ câu có sẵn ("Vui lòng nhập họ tên khách hàng.", `MSG.phoneInvalid`). Ghi nhật ký thao tác `customer.update`.
- **Sửa bé** `customers.updatePet(petId, version, PetInput)` — quyền `customers.edit`. `PetInput` thêm: `weight_kg?` (số > 0 và ≤ 120, tối đa 1 chữ số thập phân), `color?`, `neutered?`, `note_internal?` (đều không bắt buộc). Năm sinh trong khoảng 1990 đến năm nay + 1 (cùng luật với bé khách tự thêm). Tên bắt buộc ("Vui lòng nhập tên thú cưng."). Lỗi cân nặng: "Cân nặng chưa đúng. Bạn nhập số kg, ví dụ 4,2."; lỗi năm sinh: "Năm sinh chưa đúng. Bạn kiểm tra lại giúp nhé.". Ghi nhật ký `pet.update`.
- `createPet` nhận thêm các trường mới của `PetInput` và dùng chung luật kiểm tra với `updatePet` (một hàm `validatePetInput` ở `rules/`, có test).
- **Ảnh bé** (`photo_key`) **không** sửa được ở bản demo: ảnh là ảnh mẫu của chủ dự án, không có tải ảnh lên. `updatePet` giữ nguyên `photo_key`.
- Sửa cân nặng **không** đổi lượt nội trú đang có (dòng tiền ngày đã chọn lúc nhập viện giữ nguyên).
- **Trùng số điện thoại** `customers.findByPhone(phone, excludeId?)` → `{ id, code, full_name }[]` — quyền `customers.view`. **Chỉ cảnh báo, không chặn**: một nhà có thể để chung số, và liên kết tài khoản web vốn đã xử lý nhiều hồ sơ cùng số (`phoneMatches`). Giao diện hiện "Số này đã có ở KH-0002 · Phạm Thu Thủy" trước khi lưu và cho nhân viên tiếp tục. Số không hợp lệ → mảng rỗng.
- **Hàng trong bảng khách** `StaffCustomerRow` thêm `pets: { id, name, species, photoKey? }[]` (giữ `petNames` để không phá giao diện cũ) — mẫu có ảnh bé trong bảng.
- **Lịch sử tương tác** `StaffCustomerDetail.interactions: StaffInteraction[]`, mới nhất trước, tối đa 50, **dựng từ các bảng có mốc thời gian** (không phụ thuộc nhật ký thao tác nên dữ liệu mẫu cũ cũng có):

```ts
export type StaffInteractionKind = 'customer' | 'request' | 'appointment' | 'stay' | 'invoice' | 'payment' | 'link';
export type StaffInteraction = { at: string; kind: StaffInteractionKind; label: string; actorName?: string; refId?: string };
```

  Nguồn: tạo hồ sơ · yêu cầu đặt lịch của khách (gửi, đổi trạng thái, cuộc gọi — khớp theo mã khách hoặc số điện thoại) · tạo lịch hẹn · nhập/xuất viện · hóa đơn tạo/phát hành/hủy · phiếu thu (và thu nhầm đã hủy) · liên kết tài khoản web. Không dựng lại lịch sử dời/hủy lịch (xem ở tab Lịch hẹn). Câu chữ cho nhân viên: không có "quý khách"; có thể gồm tên nhân viên (chỉ nhân viên thấy). Quyền: `customers.view`; mục thanh toán và hóa đơn chỉ hiện với người có `invoices.create` hoặc `payments.record`; mục nội trú chỉ với `inpatient.view` (không lộ nội dung y lệnh vì không lấy ghi chú, chỉ lấy "nhập viện/xuất viện").

### 3.2 Bảng giá

`PriceItem` thêm `version` (1) và `reference_price?: number`. Chỉ **Quản lý** (`pricelist.edit`) thêm/sửa; mọi nhân viên vẫn xem như hiện nay.

- **Giá cố định** (`price_mode: 'fixed'`): `price` ≥ 1, số nguyên đồng; hóa đơn tự lấy giá này (như hiện nay).
- **Giá linh hoạt** (`'open'`): không có giá cố định (`price = 0`); nhân viên nhập giá khi lập hóa đơn (như hiện nay). **Giá tham khảo** `reference_price` (không bắt buộc, số nguyên đồng ≥ 1) chỉ là gợi ý: giao diện điền sẵn vào ô giá của dòng, nhân viên sửa được; API **không** tự áp giá tham khảo vào hóa đơn. Mục cố định không có giá tham khảo (lưu `undefined`).
- **Thêm** `prices.create(PriceInput)` → id. `PriceInput = { category, name, unit, price_mode, price?, reference_price?, customer_group?, active? }`. Mã tự sinh: tiền tố theo danh mục (KB khám & điều trị · SP spa · LT nội trú · TH thuốc · VT vật tư) + số tiếp theo, hai chữ số trở lên (ví dụ `KB10`); không cho nhập tay để khỏi trùng. `customer_group` mặc định theo danh mục (thuốc và vật tư → `treatment`, còn lại → `itemized`); chọn được cho danh mục khám & điều trị (R7: thủ thuật/thuốc gộp một dòng cho khách).
- **Sửa** `prices.update(id, version, PriceInput)`: đổi tên, đơn vị, giá, chế độ giá, giá tham khảo, nhóm hiển thị cho khách. **Không đổi danh mục** (mã gắn với danh mục). Giá mới chỉ áp cho dòng **thêm sau**; dòng đã có trên hóa đơn (nháp hay đã phát hành) giữ tên, đơn vị, đơn giá lúc thêm (ảnh chụp sẵn trong `invoice_lines`).
- **Tắt/bật** `prices.setActive(id, version, active)`. Mục tắt: không thêm được vào hóa đơn mới; hóa đơn nháp đã có dòng đó vẫn lưu lại được. `updateDraft` từ chối dòng mới thuộc mục đã tắt: "Mục "{tên}" đã ngừng dùng. Bạn chọn mục khác nhé."
- **Mục tiền nội trú LT01–LT03 không đổi được danh mục/chế độ giá và không tắt được** (nhập viện và xuất viện dựa vào chúng): "Mục này dùng để tính tiền nội trú nên không tắt được." Sửa tên và giá của chúng vẫn được.
- **Kiểm tra:** tên bắt buộc ("Vui lòng nhập tên mục."), không trùng tên trong cùng danh mục (so sánh không dấu, không phân biệt hoa thường: "Mục này đã có trong bảng giá."), đơn vị bắt buộc ("Vui lòng nhập đơn vị, ví dụ: lần, mũi, ngày."), giá cố định bắt buộc và ≥ 1 ("Giá cần là số từ 1 ₫ trở lên."), giá tham khảo hợp lệ nếu có.
- Ghi nhật ký `price.create` / `price.update` / `price.deactivate` / `price.activate` (`updated_at`, `updated_by` cập nhật).
- Bảng giá vẫn là "giá minh họa" (quy tắc nội dung trong `CLAUDE.md`): các mục thêm trong demo cũng thuộc nội dung mẫu; giao diện giữ dải "giá minh họa".

### 3.3 Doanh thu theo danh mục

`RevenueReport` thêm `invoiced: number` — tổng `total` của hóa đơn **đã phát hành** trong kỳ (không tính nháp, đã hủy).

`byCategory` đổi cách tính để **cộng lại đúng bằng `invoiced`**: mỗi hóa đơn phát hành trong kỳ phân bổ tiền sau giảm giá cho các dòng theo tỉ lệ `line_total / subtotal`, làm tròn đồng theo cộng dồn (tổng chia ra luôn bằng `total` của hóa đơn). Hóa đơn không giảm giá: không đổi. Hóa đơn có `subtotal = 0`: bỏ qua.

Nhãn trên giao diện nên ghi rõ: "Theo danh mục — tính trên hóa đơn đã phát hành trong kỳ, sau giảm giá"; "Đã thu" (phiếu thu) vẫn là số khác. Không đổi tên trường cũ (`collected`, `byMethod`, `daily`, `outstanding`…).

## 4. Hợp đồng (chỉ thêm, ghi vào "Thay đổi hợp đồng" của `PROGRESS.md`)

`contracts/staff.ts`:
- `CustomerInput`, `PetInput`: thêm trường như §3.1 (tất cả tùy chọn).
- `StaffPet`: thêm `version`, `weight_kg?`, `color?`. `StaffCustomerDetail`: thêm `version`, `interactions`. `StaffCustomerRow`: thêm `pets`.
- `StaffCustomersApi`: thêm `update`, `updatePet`, `findByPhone`.
- `StaffPriceItem`: thêm `version`, `reference_price?`. `StaffPricesApi`: thêm `create`, `update`, `setActive`. Kiểu `PriceInput`.
- `RevenueReport`: thêm `invoiced`.

Không đổi tên hay xóa trường nào đã có. `list(q)` giữ nguyên. Dữ liệu đã lưu trong trình duyệt của người dùng: `version` mới thiếu ở bản cũ → khi nạp tài liệu, hàng thiếu `version` được coi là `1` (chuẩn hóa ngay lúc nạp, cạnh chỗ bảng mới được thêm rỗng ở `db.ts`).

## 5. Dữ liệu mẫu

- Mọi khách, bé, mục giá: `version: 1`.
- `reference_price` cho 3 mục giá linh hoạt đang có (giá minh họa): KB09 Thủ thuật theo chỉ định 200.000 ₫ · TH06 Thuốc theo đơn khác 100.000 ₫ · VT05 Vật tư khác 50.000 ₫.
- Bé có màu lông/triệt sản/ghi chú nội bộ: để trống (hiện đã trống), trừ cân nặng đã có từ đợt nội trú.
- Không thêm khách/bé mới.

## 6. Kiểm thử

**Unit (Vitest), viết trước:**
- `validatePetInput` (cân nặng: 0, âm, 121, 4,25, "abc", rỗng hợp lệ; năm sinh ngoài khoảng; tên rỗng).
- Sửa khách: đổi tên/số, xóa địa chỉ bằng chuỗi rỗng, số sai → lỗi, **phiên bản cũ → `ConflictError`**, không đủ quyền (Spa, khách web) → `ForbiddenError`, không ghi gì khi lỗi.
- Sửa bé: cân nặng lưu và hiện lại ở `get`; `photo_key` giữ nguyên; lượt nội trú đang có không đổi; bé của khách khác id → `NotFoundError`.
- `findByPhone`: khớp mọi cách viết số; loại trừ chính hồ sơ đang sửa; số sai → rỗng.
- `interactions`: đủ nguồn, mới nhất trước, tối đa 50, người chỉ có `customers.view` không thấy mục hóa đơn/thanh toán/nội trú; **không lộ tên thuốc/ghi chú nội bộ**.
- Bảng giá: thêm (mã tự sinh `KB10`, tiếp theo `KB11`), tên trùng không dấu/hoa thường, giá cố định < 1, đơn vị rỗng, mục linh hoạt không lưu `price`, giá tham khảo chỉ cho mục linh hoạt; sửa giá **không đổi dòng hóa đơn nháp/đã phát hành đã có**; tắt mục → `updateDraft` từ chối dòng mới nhưng lưu được hóa đơn nháp có sẵn dòng đó; LT01–LT03 không tắt/không đổi chế độ giá; phiên bản cũ → `ConflictError`; chỉ `pricelist.edit`.
- Doanh thu: hóa đơn Lucky (giảm 10%): tổng `byCategory` = `invoiced`; hóa đơn không giảm giá: số cũ không đổi; hóa đơn giảm số tiền lẻ (ví dụ chia 3 danh mục) không lệch 1 đồng; chỉ tính hóa đơn phát hành trong kỳ.
- Dữ liệu cũ: tài liệu đã lưu thiếu `version` được nạp thành `1`.
- Rò rỉ: không có thay đổi cho khách (không đụng `contracts/customer.ts`); chạy lại kiểm thử chống lộ hiện có.

**E2E (Playwright):** màn hình chưa có ở nhánh dữ liệu, nên chỉ thêm kiểm tra trình duyệt thật cho nạp tài liệu cũ thiếu `version` (một bài ngắn, cạnh `e2e/du-lieu-*.spec.ts`). Kiểm tra màn hình do nhánh giao diện viết khi dựng phần 4.

## 7. Câu hỏi cần chủ dự án chốt

1. **"Giá tham khảo"** — tôi hiểu là giá gợi ý cho mục có giá linh hoạt (điền sẵn khi lập hóa đơn, nhân viên sửa được). Nếu ý bạn khác (ví dụ khách nhìn thấy giá tham khảo trên web), báo để sửa. Mẫu "bảng giá & doanh thu" chưa gửi nên tôi chưa đối chiếu được.
2. **Phân trang** — giữ ở giao diện (không đổi hợp đồng `list`) vì dữ liệu mẫu nhỏ. Bản chạy thật (Supabase) sẽ cần phân trang phía máy chủ; khi đó thêm hàm mới, không đổi hàm cũ. Đồng ý chứ?
3. **Trùng số điện thoại** — chỉ cảnh báo, không chặn. Đồng ý chứ?
4. **So sánh với kỳ trước** (ví dụ "+12% so với tuần trước" trên thẻ doanh thu) — **chưa làm**, vì chưa có mẫu cho thấy có thẻ này. Nếu mẫu có, thêm sau (một trường `previous` trong `RevenueReport`).

## 8. Ngoài phạm vi

Xóa khách/bé/mục giá (chỉ tắt mục giá); gộp hồ sơ khách trùng; tải ảnh bé lên; nhập/xuất CSV; hủy hóa đơn và giảm giá (nhóm P1 khác); dữ liệu mẫu cho Khám bệnh, Dịch vụ, Kho, Báo cáo, Cài đặt (phần 5, chờ danh sách dịch vụ); màn hình (nhánh giao diện).

## 9. Đầu ra

Code + test trên `claude/du-lieu`, `npm run verify` xanh, gộp vào nhánh tích hợp; `PROGRESS.md` (mục nhánh dữ liệu + "Thay đổi hợp đồng" + "Yêu cầu gửi nhánh kia" cho giao diện: màn khách hàng, bảng giá, doanh thu); ghi quyết định vào `QUYET-DINH.md` (R36).
