import { StaffShell } from './shell/StaffShell';

export { DashboardPage as StaffHome } from './dashboard/DashboardPage';
export { RequestsPage as StaffRequests } from './requests/RequestsPage';
export { CalendarPage as StaffCalendar } from './appointments/CalendarPage';
export { CustomersPage as StaffCustomers } from './customers/CustomersPage';
export { CustomerPage as StaffCustomer } from './customers/CustomerPage';
export { AccountsPage as StaffAccounts } from './web-accounts/AccountsPage';
export { BoardPage as StaffBoard } from './inpatient/BoardPage';
export { StayPage as StaffStay } from './inpatient/StayPage';
export { InvoicesPage as StaffInvoices } from './invoices/InvoicesPage';
export { InvoiceNewPage as StaffInvoiceNew } from './invoices/InvoiceNewPage';
export { InvoicePage as StaffInvoice } from './invoices/InvoicePage';
export { InvoicePrintPage as StaffInvoicePrint } from './invoices/InvoicePrintPage';
export { StockPage as StaffStock } from './stock/StockPage';
export { PricesPage as StaffPrices } from './pricelist/PricesPage';
export { RevenuePage as StaffRevenue } from './revenue/RevenuePage';

export function StaffLayout() {
  return <StaffShell />;
}
