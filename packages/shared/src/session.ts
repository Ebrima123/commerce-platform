// JWT session storage + refresh, shared by every app on the platform.
// Mirrors estore-shines/src/lib/session.ts: the backend rotates refresh
// tokens on every use, so concurrent callers must share one in-flight refresh.

import { apiUrl } from './config';

const KEY_ACCESS = 'cp_access';
const KEY_REFRESH = 'cp_refresh';
export const AUTH_EVENT = 'cp:auth';

export const getAccessToken = () => localStorage.getItem(KEY_ACCESS);
const getRefreshToken = () => localStorage.getItem(KEY_REFRESH);

export function saveTokens(access: string, refresh: string) {
  localStorage.setItem(KEY_ACCESS, access);
  localStorage.setItem(KEY_REFRESH, refresh);
}

export function clearSession() {
  localStorage.removeItem(KEY_ACCESS);
  localStorage.removeItem(KEY_REFRESH);
  window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: null }));
}

let refreshInFlight: Promise<string | null> | null = null;

export function refreshAccessToken(): Promise<string | null> {
  refreshInFlight ??= doRefresh().finally(() => { refreshInFlight = null; });
  return refreshInFlight;
}

async function doRefresh(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  try {
    const res = await fetch(apiUrl('/api/token/refresh/'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) { clearSession(); return null; }
    const data = await res.json();
    saveTokens(data.access, data.refresh ?? refresh);
    return data.access as string;
  } catch {
    return null;
  }
}
