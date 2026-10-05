// Which store is this storefront request for?
//
//   ?store=mystore              → "mystore"   (editor preview / explicit override)
//   mystore.<PLATFORM_DOMAIN>   → "mystore"   (custom wildcard domain, when configured)
//   mystore.localhost:5174      → "mystore"   (local dev subdomains)
//   /@mystore/...               → "mystore"   (canonical shareable path)
//   /mystore/...                → "mystore"   (short link — redirected to /@mystore/...)
//
// Custom domains (mystore.gm) come later: they'll be looked up by full hostname
// against the backend instead of parsed here.

const RESERVED_HOST_LABELS = new Set(['www', 'app', 'admin', 'api', 'dashboard', 'mail']);
// First path segments that are never store names (static files etc.).
const RESERVED_PATHS = new Set(['assets', 'favicon.ico', 'robots.txt', 'sitemap.xml', 'manifest.json']);

export interface StoreLocation {
  slug: string | null;
  /** Router basename for path-based stores ("/@mystore"), otherwise "". */
  basePath: string;
  /** Set when the URL is the short form (/mystore/...) and should become /@mystore/... */
  canonicalPath?: string;
}

const sanitize = (s: string) => s.trim().toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_-]/g, '') || null;

export function resolveStoreLocation(location: Pick<Location, 'hostname' | 'pathname' | 'search'> = window.location): StoreLocation {
  const fromQuery = new URLSearchParams(location.search).get('store');
  if (fromQuery) return { slug: sanitize(fromQuery), basePath: '' };

  const host = location.hostname.toLowerCase();
  const platformDomain = (import.meta.env.VITE_PLATFORM_DOMAIN as string | undefined)?.trim().toLowerCase();
  let sub: string | undefined;
  if (host.endsWith('.localhost')) sub = host.slice(0, -'.localhost'.length);
  else if (platformDomain && host.endsWith(`.${platformDomain}`)) sub = host.slice(0, -(platformDomain.length + 1));
  if (sub && !sub.includes('.') && !RESERVED_HOST_LABELS.has(sub)) return { slug: sanitize(sub), basePath: '' };

  const [, first = '', ...rest] = location.pathname.split('/');
  const segment = decodeURIComponent(first);
  if (!segment || RESERVED_PATHS.has(segment.toLowerCase())) return { slug: null, basePath: '' };

  const slug = sanitize(segment);
  if (!slug) return { slug: null, basePath: '' };
  const basePath = `/@${slug}`;
  const isCanonical = segment.startsWith('@') && segment.slice(1) === slug;
  return {
    slug,
    basePath,
    canonicalPath: isCanonical ? undefined : [basePath, ...rest].join('/'),
  };
}

/** Back-compat helper: just the slug. */
export const resolveStoreSlug = (location?: Pick<Location, 'hostname' | 'pathname' | 'search'>) =>
  resolveStoreLocation(location).slug;
