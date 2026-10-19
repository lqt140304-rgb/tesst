import { Placeholder } from '@/features/shared/Placeholder';
import { StaffShell } from './shell/StaffShell';

export { DashboardPage as StaffHome } from './dashboard/DashboardPage';
export { RequestsPage as StaffRequests } from './requests/RequestsPage';
export { CalendarPage as StaffCalendar } from './appointments/CalendarPage';
export { CustomersPage as StaffCustomers } from './customers/CustomersPage';
export { CustomerPage as StaffCustomer } from './customers/CustomerPage';
export { AccountsPage as StaffAccounts } from './web-accounts/AccountsPage';

export function StaffLayout() {
  return <StaffShell />;
}
export const StaffBoard = () => <Placeholder title="Nội trú" />;
export const StaffStay = () => <Placeholder title="Hồ sơ nội trú" />;
export const StaffInvoices = () => <Placeholder title="Hóa đơn" />;
export const StaffInvoiceNew = () => <Placeholder title="Lập hóa đơn" />;
export const StaffInvoice = () => <Placeholder title="Chi tiết hóa đơn" />;
export const StaffInvoicePrint = () => <Placeholder title="Bản in hóa đơn" />;
export const StaffPrices = () => <Placeholder title="Bảng giá" />;
export const StaffRevenue = () => <Placeholder title="Doanh thu" />;
