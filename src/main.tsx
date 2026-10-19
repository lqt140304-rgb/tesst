import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createHashRouter, createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from './app/router';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';

/** Hash routing needs history.replaceState; fall back to an in-memory router if the host sandbox forbids it. */
function canUseHistory() {
  try {
    history.replaceState(history.state, '', location.href);
    return true;
  } catch {
    return false;
  }
}
const router = canUseHistory() ? createHashRouter(routes) : createMemoryRouter(routes);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
