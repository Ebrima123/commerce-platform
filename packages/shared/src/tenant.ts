// Which store is this storefront request for?
//
//   mystore.<PLATFORM_DOMAIN>   → "mystore"   (production subdomains)
//   mystore.localhost:5174      → "mystore"   (local dev; browsers resolve *.localhost)
//   ?store=mystore              → "mystore"   (fallback for previews / plain localhost)
//
// Custom domains (mystore.gm) come later: they'll be looked up by full hostname
// against the backend instead of parsed here.

const RESERVED = new Set(['www', 'app', 'admin', 'api', 'dashboard', 'mail']);

export function resolveStoreSlug(location: Pick<Location, 'hostname' | 'search'> = window.location): string | null {
  const fromQuery = new URLSearchParams(location.search).get('store');
  if (fromQuery) return sanitize(fromQuery);

  const host = location.hostname.toLowerCase();
  const platformDomain = (import.meta.env.VITE_PLATFORM_DOMAIN as string | undefined)?.toLowerCase();

  let sub: string | undefined;
  if (host.endsWith('.localhost')) sub = host.slice(0, -'.localhost'.length);
  else if (platformDomain && host.endsWith(`.${platformDomain}`)) sub = host.slice(0, -(platformDomain.length + 1));

  if (!sub || sub.includes('.') || RESERVED.has(sub)) return null;
  return sanitize(sub);
}

const sanitize = (s: string) => s.trim().toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_-]/g, '') || null;
