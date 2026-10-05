import { apiUrl } from './config';
import { getAccessToken, refreshAccessToken } from './session';

export class ApiError extends Error {
  constructor(public status: number, public body: unknown) {
    super(ApiError.messageFrom(status, body));
  }

  static messageFrom(status: number, body: unknown) {
    if (body && typeof body === 'object') {
      const b = body as Record<string, unknown>;
      if (typeof b.detail === 'string') return b.detail;
      if (typeof b.error === 'string') return b.error;
    }
    return `Request failed (${status})`;
  }
}

type Options = { method?: string; body?: unknown; auth?: boolean; signal?: AbortSignal };

async function send(path: string, { method = 'GET', body, auth = false, signal }: Options, token?: string | null) {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  return fetch(apiUrl(path), { method, headers, signal, body: body === undefined ? undefined : JSON.stringify(body) });
}

/** JSON request against the platform backend. `auth: true` attaches the JWT and refreshes it once on 401. */
export async function api<T>(path: string, opts: Options = {}): Promise<T> {
  let res = await send(path, opts, opts.auth ? getAccessToken() : null);
  if (res.status === 401 && opts.auth) {
    const fresh = await refreshAccessToken();
    if (fresh) res = await send(path, opts, fresh);
  }
  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) throw new ApiError(res.status, data);
  return data as T;
}

function safeJson(text: string) {
  try { return JSON.parse(text); } catch { return text; }
}

/** DRF endpoints return either a bare array or a paginated `{ results }` object. */
export function listOf<T>(data: T[] | { results: T[] } | null | undefined): T[] {
  if (!data) return [];
  return Array.isArray(data) ? data : data.results ?? [];
}
