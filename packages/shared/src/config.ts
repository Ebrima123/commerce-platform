// In development VITE_API_URL is left empty and requests go to `/api/...`,
// which each app's Vite dev server proxies to the backend (no CORS needed).
// In production set VITE_API_URL to the backend origin.
const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';

export const apiUrl = (path: string) => `${API_URL}${path}`;
