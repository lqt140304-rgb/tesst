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
export { StockItemPage as StaffStockItem } from './stock/StockItemPage';
export { PricesPage as StaffPrices } from './pricelist/PricesPage';
export { ContentPage as StaffContent } from './content/ContentPage';
export { ReportsPage as StaffReports } from './reports/ReportsPage';
export { RevenuePage as StaffRevenue } from './revenue/RevenuePage';
export { HelpPage as StaffHelp } from './help/HelpPage';
export { SettingsLayout as StaffSettings } from './settings/SettingsLayout';
export { ProfilePage as StaffSettingsProfile } from './settings/ProfilePage';
export { PrefsPage as StaffSettingsPrefs } from './settings/PrefsPage';
export { TeamPage as StaffSettingsTeam } from './settings/TeamPage';
export { SystemPage as StaffSettingsSystem } from './settings/SystemPage';
export { HospitalPage as StaffSettingsHospital } from './settings/HospitalPage';

export function StaffLayout() {
  return <StaffShell />;
}
