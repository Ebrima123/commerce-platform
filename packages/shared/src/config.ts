// Development: VITE_API_URL is left empty and requests go to `/api/...`, which
// each app's Vite dev server proxies to the backend (no CORS needed).
// Production: requests go straight to the backend (the same one Alfudi uses), which allows the platform
// frontends via CORS (estore-backend settings: PLATFORM_FRONTEND_ORIGINS).
const DEFAULT_PROD_API = 'https://estore-backend-6on4.onrender.com';
const configured = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
const API_URL = (configured || (import.meta.env.PROD ? DEFAULT_PROD_API : '')).replace(/\/$/, '');

export const apiUrl = (path: string) => `${API_URL}${path}`;
