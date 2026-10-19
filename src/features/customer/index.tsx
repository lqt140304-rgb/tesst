import { Placeholder } from '@/features/shared/Placeholder';

export { CustomerShell as CustomerLayout } from './shell/CustomerShell';
export { OverviewPage as CustomerHome } from './overview/OverviewPage';
export { PetsPage as CustomerPets } from './pets/PetsPage';
export { PetPage as CustomerPet } from './pets/PetPage';
export { AppointmentsPage as CustomerAppointments } from './appointments/AppointmentsPage';
export { RequestPage as CustomerRequest } from './appointments/RequestPage';
export { BookPage as CustomerBook } from './BookPage';

// Task 17b replaces these.
export const CustomerStays = () => <Placeholder title="Nội trú" />;
export const CustomerStay = () => <Placeholder title="Nhật ký nội trú" />;
export const CustomerInvoices = () => <Placeholder title="Hóa đơn" />;
export const CustomerInvoice = () => <Placeholder title="Chi tiết hóa đơn" />;
export const CustomerInvoicePrint = () => <Placeholder title="Bản in hóa đơn" />;
export const CustomerAccount = () => <Placeholder title="Tài khoản" />;
