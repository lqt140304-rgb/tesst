import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createHashRouter, createMemoryRouter, RouterProvider, type RouteObject } from 'react-router';
import { RootLayout } from './app/RootLayout';
import './styles/fonts.css';
import './styles/base.css';

const routes: RouteObject[] = [{
  path: '/', element: <RootLayout />, hydrateFallbackElement: <p>Đang mở…</p>,
  children: [
    { index: true, lazy: async () => ({ Component: (await import('./features/public/HomePage')).default }) },
    { path: 'dang-nhap', handle: { zone: 'auth' }, lazy: async () => ({ Component: (await import('./features/auth/LoginPage')).default }) },
    { path: 'nv', handle: { zone: 'staff' }, lazy: async () => ({ Component: (await import('./features/staff/StaffLayout')).default }),
      children: [
        { index: true, handle: { pageKey: 'nv.home' }, lazy: async () => ({ Component: (await import('./features/staff/StaffLayout')).StaffHome }) },
        { path: 'yeu-cau', handle: { pageKey: 'nv.yeu-cau' }, lazy: async () => ({ Component: (await import('./features/staff/StaffLayout')).StaffRequests }) },
      ] },
  ],
}];

// Hash routing needs history.pushState; fall back to an in-memory router if the host sandbox forbids it.
function canUseHistory() { try { history.replaceState(history.state, '', location.href); return true; } catch { return false; } }
const router = canUseHistory() ? createHashRouter(routes) : createMemoryRouter(routes);

createRoot(document.getElementById('root')!).render(<StrictMode><RouterProvider router={router} /></StrictMode>);
