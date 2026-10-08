import { apiUrl } from '@cp/shared';

// "Continue with Alfudi": Alfudi and Mariseh share one account system, but
// live on different domains, so the sign-in is handed over with a one-time
// code + PKCE (see estore-backend/users/sso.py and estore-shines
// src/pages/SSOAuthorizePage.tsx).

export const ALFUDI_ORIGIN = ((import.meta.env.VITE_ALFUDI_ORIGIN as string | undefined)
  || (import.meta.env.PROD ? 'https://alfudi.com' : 'http://localhost:3000')).replace(/\/$/, '');

const PENDING = 'cp_sso_pending';   // {verifier, state, returnTo, silent} for the trip to Alfudi
const ACCOUNT = 'cp_sso_account';   // result of the silent check: who is signed in on Alfudi
const CHECKED = 'cp_sso_checked';   // silent check already done this browser session
const CODE_TTL_MS = 9 * 60_000;     // backend accepts codes for 10 minutes

export interface AlfudiAccount { code: string; verifier: string; name: string; username: string; avatar: string; at: number }

const store = {
  get: <T>(k: string): T | null => { try { return JSON.parse(sessionStorage.getItem(k) ?? 'null'); } catch { return null; } },
  set: (k: string, v: unknown) => { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  del: (k: string) => { try { sessionStorage.removeItem(k); } catch { /* storage unavailable */ } },
};

const base64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function pkce() {
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  return { verifier, challenge: base64url(digest) };
}

export const callbackUrl = () => `${window.location.origin}/sso/callback`;

/** Go to Alfudi. silent=true: just find out who's signed in there (no screen shown). */
export async function goToAlfudi({ silent, returnTo }: { silent: boolean; returnTo: string }) {
  const { verifier, challenge } = await pkce();
  const state = base64url(crypto.getRandomValues(new Uint8Array(16)));
  store.set(PENDING, { verifier, state, returnTo, silent });
  if (silent) store.set(CHECKED, true);
  const q = new URLSearchParams({ redirect_uri: callbackUrl(), state, code_challenge: challenge, prompt: silent ? 'none' : 'consent' });
  window.location.assign(`${ALFUDI_ORIGIN}/sso/authorize?${q}`);
}

/** Should the sign-in page quietly check Alfudi first? (once per browser session) */
export const shouldCheckAlfudi = () => !store.get(CHECKED) && !rememberedAccount();

/** The Alfudi account found by the silent check, while its code is still valid. */
export function rememberedAccount(): AlfudiAccount | null {
  const a = store.get<AlfudiAccount>(ACCOUNT);
  return a && Date.now() - a.at < CODE_TTL_MS ? a : null;
}

export const forgetAccount = () => store.del(ACCOUNT);

/** Trade a code for a Mariseh session (same shape as /api/token/). */
export async function exchange(code: string, verifier: string) {
  const res = await fetch(apiUrl('/api/auth/sso/exchange/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, code_verifier: verifier, redirect_uri: callbackUrl() }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || 'Could not sign you in with Alfudi. Please try again.');
  return data as { access: string; refresh: string; user: unknown };
}

/**
 * Back from Alfudi (/sso/callback#code=…&state=…). Silent check → remember the
 * account so the sign-in page can offer "Continue as …". Button flow → sign in now.
 */
export async function handleCallback(): Promise<
  | { kind: 'account'; returnTo: string }
  | { kind: 'signed-in'; returnTo: string; session: Awaited<ReturnType<typeof exchange>> }
  | { kind: 'nothing'; returnTo: string; message?: string }
> {
  const pending = store.get<{ verifier: string; state: string; returnTo: string; silent: boolean }>(PENDING);
  store.del(PENDING);
  const p = new URLSearchParams(window.location.hash.slice(1));
  const returnTo = pending?.returnTo || '/login';
  if (!pending || p.get('state') !== pending.state) return { kind: 'nothing', returnTo, message: 'That sign-in link has expired. Please try again.' };

  const code = p.get('code');
  if (!code) {
    const err = p.get('error');
    return { kind: 'nothing', returnTo, message: pending.silent || err === 'access_denied' ? undefined : 'Could not sign you in with Alfudi.' };
  }
  if (pending.silent) {
    store.set(ACCOUNT, { code, verifier: pending.verifier, name: p.get('name') || p.get('username') || 'your account', username: p.get('username') || '', avatar: p.get('avatar') || '', at: Date.now() });
    return { kind: 'account', returnTo };
  }
  return { kind: 'signed-in', returnTo, session: await exchange(code, pending.verifier) };
}
