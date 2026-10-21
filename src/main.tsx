import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { browserStore, isDeviceFrame, readMode } from './app/device/devices';
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
function mountApp() {
  const router = canUseHistory() ? createHashRouter(routes) : createMemoryRouter(routes);
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
  // Inside the "Xem như" frame: tell the page outside we are up and where we are (it keeps the place across a reload).
  if (isDeviceFrame()) {
    const tell = (msg: object) => { try { parent.postMessage({ ...msg }, '*'); } catch { /* not framed after all */ } };
    tell({ leson: 'device-frame-ready' });
    window.addEventListener('hashchange', () => tell({ leson: 'device-frame-hash', hash: location.hash }));
  }
}

// "Xem như máy tính / điện thoại": a remembered size shows the app in a frame of that size; the frame itself runs the plain app.
const mode = isDeviceFrame() ? ({ kind: 'auto' } as const) : readMode(browserStore());
if (mode.kind === 'auto') {
  mountApp();
} else {
  void import('./app/device/DevicePreview').then(({ DevicePreview }) => {
    createRoot(document.getElementById('root')!).render(<StrictMode><DevicePreview presetId={mode.presetId} /></StrictMode>);
  });
}
