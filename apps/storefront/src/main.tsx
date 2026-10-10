import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ADMIN_ORIGIN } from './store';
import './index.css';

// Back from ModemPay after paying for a store but landed on the storefront
// (mariseh.com) instead of the admin: forward to the admin's payment page.
const here = new URL(window.location.href);
if (/^\/start(\/|$)/.test(here.pathname) || here.searchParams.has('purchase')) {
  window.location.replace(`${ADMIN_ORIGIN}/start/paid${here.search}`);
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
