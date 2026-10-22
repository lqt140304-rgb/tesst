import type { ComponentType } from 'react';
import { Navigate, type RouteObject } from 'react-router';
import HomePage from '@/features/public/home/HomePage';
import IconSheetPage from '@/features/public/IconSheetPage';
import { BookingPage } from '@/features/public/booking/BookingPage';
import { RequireCustomer, RequireGuest, RequireStaff } from './guards';
import type { RouteHandle } from './handle';
import { PrintLayout } from './layouts/PrintLayout';
import { PublicLayout } from './layouts/PublicLayout';
import { RootLayout } from './layouts/RootLayout';
import { NotFoundOrAlias, RouteError } from './system/System';

type Mod = Record<string, unknown>;
const auth = () => import('@/features/auth');
const kh = () => import('@/features/customer');
const nv = () => import('@/features/staff');

/** Lazy page from a zone chunk (one chunk per zone). */
const page = (load: () => Promise<Mod>, name: string) => async () => ({ Component: (await load())[name] as ComponentType });
const h = (x: RouteHandle) => x;

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <RouteError />,
    hydrateFallbackElement: <p style={{ padding: 24 }}>Đang mở…</p>,
    children: [
      {
        element: <PublicLayout />,
        handle: h({ zone: 'public' }),
        children: [
          { index: true, element: <HomePage />, handle: h({ pageKey: 'home' }) },
          { path: 'dich-vu', element: <HomePage />, handle: h({ pageKey: 'home', title: 'Dịch vụ', section: 'dich-vu' }) },
          { path: 'dat-lich', element: <BookingPage />, handle: h({ pageKey: 'book', title: 'Gửi yêu cầu đặt lịch' }) },
          { path: 'gioi-thieu', element: <HomePage />, handle: h({ pageKey: 'home', title: 'Giới thiệu', section: 'gioi-thieu' }) },
          { path: 'lien-he', element: <HomePage />, handle: h({ pageKey: 'home', title: 'Liên hệ', section: 'lien-he' }) },
          { path: '_bo-icon', element: <IconSheetPage />, handle: h({ pageKey: 'icons', title: 'Bộ icon' }) },
          { path: '_giao-dien', lazy: page(() => import('@/features/gallery'), 'GalleryPage'), handle: h({ pageKey: 'gallery', title: 'Bộ giao diện' }) },
          { path: '*', element: <NotFoundOrAlias />, handle: h({ pageKey: '404', title: 'Không tìm thấy trang' }) },
        ],
      },
      {
        path: 'dang-nhap',
        handle: h({ zone: 'auth', pageKey: 'login', title: 'Đăng nhập' }),
        lazy: async () => { const m = await auth(); return { element: <RequireGuest><m.AuthLayout /></RequireGuest> }; },
        children: [
          { index: true, lazy: page(auth, 'LoginPage') },
          { path: 'nhan-vien', lazy: page(auth, 'LoginPage') },
          { path: 'quen-mat-khau', lazy: page(auth, 'LoginPage'), handle: h({ title: 'Quên mật khẩu' }) },
        ],
      },
      {
        path: 'dang-ky',
        handle: h({ zone: 'auth', pageKey: 'signup', title: 'Tạo tài khoản' }),
        lazy: async () => { const m = await auth(); return { element: <RequireGuest><m.AuthLayout /></RequireGuest> }; },
        children: [{ index: true, lazy: page(auth, 'SignupPage') }],
      },
      {
        path: 'khach-hang',
        handle: h({ zone: 'customer' }),
        lazy: async () => { const m = await kh(); return { element: <RequireCustomer><m.CustomerLayout /></RequireCustomer> }; },
        children: [
          { index: true, lazy: page(kh, 'CustomerHome'), handle: h({ pageKey: 'kh.home', title: 'Tổng quan' }) },
          { path: 'thu-cung', lazy: page(kh, 'CustomerPets'), handle: h({ pageKey: 'kh.pets', title: 'Thú cưng' }) },
          { path: 'thu-cung/:petId', lazy: page(kh, 'CustomerPet'), handle: h({ pageKey: 'kh.pet', title: 'Hồ sơ bé' }) },
          { path: 'lich-hen', lazy: page(kh, 'CustomerAppointments'), handle: h({ pageKey: 'kh.appts', title: 'Lịch hẹn' }) },
          { path: 'lich-hen/:id', lazy: page(kh, 'CustomerRequest'), handle: h({ pageKey: 'kh.appt', title: 'Lịch hẹn' }) },
          { path: 'dat-lich', lazy: page(kh, 'CustomerBook'), handle: h({ pageKey: 'kh.book', title: 'Gửi yêu cầu đặt lịch' }) },
          { path: 'noi-tru', lazy: page(kh, 'CustomerStays'), handle: h({ pageKey: 'kh.stays', title: 'Nội trú', linkedOnly: true }) },
          { path: 'noi-tru/:stayId', lazy: page(kh, 'CustomerStay'), handle: h({ pageKey: 'kh.stay', title: 'Nhật ký nội trú', linkedOnly: true }) },
          { path: 'hoa-don', lazy: page(kh, 'CustomerInvoices'), handle: h({ pageKey: 'kh.invoices', title: 'Hóa đơn', linkedOnly: true }) },
          { path: 'hoa-don/:id', lazy: page(kh, 'CustomerInvoice'), handle: h({ pageKey: 'kh.invoice', title: 'Hóa đơn', linkedOnly: true }) },
          { path: 'tai-khoan', lazy: page(kh, 'CustomerAccount'), handle: h({ pageKey: 'kh.account', title: 'Tài khoản' }) },
        ],
      },
      {
        path: 'khach-hang/hoa-don/:id/ban-in',
        handle: h({ zone: 'print', pageKey: 'kh.print', title: 'Bản in hóa đơn', linkedOnly: true }),
        element: <RequireCustomer><PrintLayout /></RequireCustomer>,
        children: [{ index: true, lazy: page(kh, 'CustomerInvoicePrint') }],
      },
      {
        path: 'nv',
        handle: h({ zone: 'staff' }),
        lazy: async () => { const m = await nv(); return { element: <RequireStaff><m.StaffLayout /></RequireStaff> }; },
        children: [
          { index: true, lazy: page(nv, 'StaffHome'), handle: h({ pageKey: 'nv.home', title: 'Tổng quan' }) },
          { path: 'yeu-cau', lazy: page(nv, 'StaffRequests'), handle: h({ pageKey: 'nv.requests', title: 'Yêu cầu đặt lịch', cap: 'requests.handle' }) },
          { path: 'yeu-cau/:id', lazy: page(nv, 'StaffRequests'), handle: h({ pageKey: 'nv.requests', title: 'Yêu cầu đặt lịch', cap: 'requests.handle' }) },
          { path: 'lich-hen', lazy: page(nv, 'StaffCalendar'), handle: h({ pageKey: 'nv.calendar', title: 'Lịch hẹn', cap: 'appointments.view' }) },
          { path: 'khach-hang', lazy: page(nv, 'StaffCustomers'), handle: h({ pageKey: 'nv.customers', title: 'Khách hàng', cap: 'customers.view' }) },
          { path: 'khach-hang/:id', lazy: page(nv, 'StaffCustomer'), handle: h({ pageKey: 'nv.customer', title: 'Hồ sơ khách hàng', cap: 'customers.view' }) },
          { path: 'tai-khoan-web', lazy: page(nv, 'StaffAccounts'), handle: h({ pageKey: 'nv.accounts', title: 'Tài khoản web', cap: 'accounts.link' }) },
          { path: 'noi-tru', lazy: page(nv, 'StaffBoard'), handle: h({ pageKey: 'nv.board', title: 'Nội trú', cap: 'inpatient.view' }) },
          { path: 'noi-tru/:stayId', lazy: page(nv, 'StaffStay'), handle: h({ pageKey: 'nv.stay', title: 'Hồ sơ nội trú', cap: 'inpatient.view' }) },
          { path: 'hoa-don', lazy: page(nv, 'StaffInvoices'), handle: h({ pageKey: 'nv.invoices', title: 'Hóa đơn', cap: ['invoices.create', 'payments.record'] }) },
          { path: 'hoa-don/moi', lazy: page(nv, 'StaffInvoiceNew'), handle: h({ pageKey: 'nv.invoice-new', title: 'Lập hóa đơn', cap: 'invoices.create' }) },
          { path: 'hoa-don/:id', lazy: page(nv, 'StaffInvoice'), handle: h({ pageKey: 'nv.invoice', title: 'Hóa đơn', cap: ['invoices.create', 'payments.record'] }) },
          { path: 'kho', lazy: page(nv, 'StaffStock'), handle: h({ pageKey: 'nv.stock', title: 'Kho', cap: 'stock.view' }) },
          { path: 'kho/:id', lazy: page(nv, 'StaffStockItem'), handle: h({ pageKey: 'nv.stock-item', title: 'Chi tiết kho', cap: 'stock.view' }) },
          { path: 'bang-gia', lazy: page(nv, 'StaffPrices'), handle: h({ pageKey: 'nv.prices', title: 'Bảng giá' }) },
          { path: 'bao-cao', lazy: page(nv, 'StaffReports'), handle: h({ pageKey: 'nv.reports', title: 'Báo cáo vận hành', cap: 'reports.operations' }) },
          { path: 'doanh-thu', lazy: page(nv, 'StaffRevenue'), handle: h({ pageKey: 'nv.revenue', title: 'Doanh thu', cap: 'reports.revenue' }) },
          {
            // One page key for the whole area: the side list stays put while the pages inside it change.
            path: 'cai-dat',
            lazy: page(nv, 'StaffSettings'),
            handle: h({ pageKey: 'nv.settings', title: 'Cài đặt' }),
            children: [
              { index: true, element: <Navigate to="ho-so" replace /> },
              { path: 'ho-so', lazy: page(nv, 'StaffSettingsProfile'), handle: h({ title: 'Hồ sơ của tôi' }) },
              { path: 'tuy-chon', lazy: page(nv, 'StaffSettingsPrefs'), handle: h({ title: 'Tùy chọn của tôi' }) },
              { path: 'tai-khoan', lazy: page(nv, 'StaffSettingsTeam'), handle: h({ title: 'Tài khoản nhân viên', cap: 'staff.manage' }) },
              { path: 'he-thong', lazy: page(nv, 'StaffSettingsSystem'), handle: h({ title: 'Cài đặt hệ thống' }) },
              { path: 'benh-vien', lazy: page(nv, 'StaffSettingsHospital'), handle: h({ title: 'Thông tin bệnh viện' }) },
            ],
          },
        ],
      },
      {
        path: 'nv/hoa-don/:id/ban-in',
        handle: h({ zone: 'print', pageKey: 'nv.print', title: 'Bản in hóa đơn', cap: ['invoices.create', 'payments.record'] }),
        element: <RequireStaff><PrintLayout /></RequireStaff>,
        children: [{ index: true, lazy: page(nv, 'StaffInvoicePrint') }],
      },
    ],
  },
];
