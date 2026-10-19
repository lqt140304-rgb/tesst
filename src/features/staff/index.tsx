import { ZoneContent } from '@/app/layouts/ZoneContent';
import { Placeholder } from '@/features/shared/Placeholder';

export function StaffLayout() {
  return <ZoneContent distance={4} />;
}
export const StaffHome = () => <Placeholder title="Tổng quan hôm nay" />;
export const StaffRequests = () => <Placeholder title="Yêu cầu đặt lịch" />;
export const StaffCalendar = () => <Placeholder title="Lịch hẹn" />;
export const StaffCustomers = () => <Placeholder title="Khách hàng" />;
export const StaffCustomer = () => <Placeholder title="Hồ sơ khách hàng" />;
export const StaffAccounts = () => <Placeholder title="Tài khoản web" />;
export const StaffBoard = () => <Placeholder title="Nội trú" />;
export const StaffStay = () => <Placeholder title="Hồ sơ nội trú" />;
export const StaffInvoices = () => <Placeholder title="Hóa đơn" />;
export const StaffInvoiceNew = () => <Placeholder title="Lập hóa đơn" />;
export const StaffInvoice = () => <Placeholder title="Chi tiết hóa đơn" />;
export const StaffInvoicePrint = () => <Placeholder title="Bản in hóa đơn" />;
export const StaffPrices = () => <Placeholder title="Bảng giá" />;
export const StaffRevenue = () => <Placeholder title="Doanh thu" />;
