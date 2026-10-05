import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, ApiError, apiUrl, AUTH_EVENT, clearSession, getAccessToken, saveTokens, setApiStoreId, type User } from '@cp/shared';

// Merchant session on the existing estore-backend JWT endpoints. Anyone can
// sign in or sign up; people without a store are sent to the store wizard.

type MerchantUser = User & { seller_staff_of?: { owner_username: string; store_name: string; permissions: string[] } | null };

export interface SignUpInput { full_name: string; username: string; email: string; password: string }

interface AuthState {
  user: MerchantUser | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<string | null>;
  /** Returns null on success, or field → message errors. */
  signUp: (input: SignUpInput) => Promise<Record<string, string> | null>;
  signOut: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

function fieldErrors(body: unknown): Record<string, string> {
  if (!body || typeof body !== 'object') return { form: 'Something went wrong. Please try again.' };
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(body as Record<string, unknown>)) {
    out[k === 'detail' || k === 'non_field_errors' ? 'form' : k] = Array.isArray(v) ? String(v[0]) : String(v);
  }
  return out;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MerchantUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try { setUser(await api<MerchantUser>('/api/users/me/', { auth: true })); }
    catch { clearSession(); setUser(null); }
  }, []);

  useEffect(() => {
    if (!getAccessToken()) { setLoading(false); return; }
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  // A failed token refresh anywhere (shared/session.ts) signs the user out here too.
  useEffect(() => {
    const onAuth = (e: Event) => { if (!(e as CustomEvent).detail) setUser(null); };
    window.addEventListener(AUTH_EVENT, onAuth);
    return () => window.removeEventListener(AUTH_EVENT, onAuth);
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    try {
      const res = await fetch(apiUrl('/api/token/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      if (!res.ok) return 'Incorrect username or password.';
      const data = await res.json();
      saveTokens(data.access, data.refresh);
      setUser(data.user);
      return null;
    } catch {
      return 'Could not reach the server. Check your connection and try again.';
    }
  }, []);

  const signUp = useCallback(async (input: SignUpInput) => {
    try {
      const data = await api<{ access: string; refresh: string; user: MerchantUser }>('/api/users/register/', {
        method: 'POST',
        body: { ...input, username: input.username.trim(), email: input.email.trim() },
      });
      saveTokens(data.access, data.refresh);
      setUser(data.user);
      return null;
    } catch (e) {
      return e instanceof ApiError ? fieldErrors(e.body) : { form: 'Could not reach the server. Check your connection and try again.' };
    }
  }, []);

  const signOut = useCallback(() => {
    clearSession();
    setApiStoreId(null);
    try { localStorage.removeItem('cp_current_store'); } catch { /* storage unavailable */ }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
