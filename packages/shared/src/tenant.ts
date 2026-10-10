// Which store is this storefront request for?
//
//   ?store=mystore              → "mystore"   (editor preview / explicit override)
//   mystore.<PLATFORM_DOMAIN>   → "mystore"   (custom wildcard domain, when configured)
//   mystore.localhost:5174      → "mystore"   (local dev subdomains)
//   /@mystore/...               → "mystore"   (canonical shareable path)
//   /mystore/...                → "mystore"   (short link — redirected to /@mystore/...)
//
//   awafashion.com              → looked up by hostname (customHost) against the
//                                  backend — a merchant's own connected domain

const RESERVED_HOST_LABELS = new Set(['www', 'app', 'admin', 'api', 'dashboard', 'mail']);
// First path segments that are never store names (static files etc.).
const RESERVED_PATHS = new Set(['assets', 'favicon.ico', 'robots.txt', 'sitemap.xml', 'manifest.json']);

export interface StoreLocation {
  slug: string | null;
  /** Router basename for path-based stores ("/@mystore"), otherwise "". */
  basePath: string;
  /** Set when the URL is the short form (/mystore/...) and should become /@mystore/... */
  canonicalPath?: string;
  /**
   * With store subdomains on (VITE_PLATFORM_DOMAIN), a path-based visit on the
   * main domain (mariseh.com/@shop/...) belongs on shop.mariseh.com/... — this is
   * that full URL; the caller redirects.
   */
  subdomainUrl?: string;
  /** A merchant's own domain (awafashion.com): the store is looked up by this host. */
  customHost?: string;
}

/** Hosts that belong to the platform itself (never a merchant's own domain). */
function isPlatformHost(host: string, platformDomain?: string) {
  if (host === 'localhost' || host.endsWith('.localhost') || /^\d+\.\d+\.\d+\.\d+$/.test(host) || host === '[::1]') return true;
  if (host.endsWith('.vercel.app')) return true;
  const roots = ['mariseh.com', 'mariseh.shop', ...(platformDomain ? [platformDomain] : [])];
  return roots.some(r => host === r || host.endsWith(`.${r}`));
}

const sanitize = (s: string) => s.trim().toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_-]/g, '') || null;

export function resolveStoreLocation(location: Pick<Location, 'hostname' | 'pathname' | 'search'> = window.location): StoreLocation {
  const fromQuery = new URLSearchParams(location.search).get('store');
  if (fromQuery) return { slug: sanitize(fromQuery), basePath: '' };

  const host = location.hostname.toLowerCase();
  const platformDomain = (import.meta.env.VITE_PLATFORM_DOMAIN as string | undefined)?.trim().toLowerCase();
  if (!isPlatformHost(host, platformDomain)) return { slug: null, basePath: '', customHost: host.replace(/^www\./, '') };
  let sub: string | undefined;
  if (host.endsWith('.localhost')) sub = host.slice(0, -'.localhost'.length);
  else {
    // Store subdomains (shop.mariseh.com) resolve even before VITE_PLATFORM_DOMAIN is set.
    const root = platformDomain || 'mariseh.com';
    if (host.endsWith(`.${root}`)) sub = host.slice(0, -(root.length + 1));
  }
  if (sub && !sub.includes('.') && !RESERVED_HOST_LABELS.has(sub)) return { slug: sanitize(sub), basePath: '' };

  const [, first = '', ...rest] = location.pathname.split('/');
  const segment = decodeURIComponent(first);
  if (!segment || RESERVED_PATHS.has(segment.toLowerCase())) return { slug: null, basePath: '' };

  const slug = sanitize(segment);
  if (!slug) return { slug: null, basePath: '' };

  // Subdomains on and we're on the main domain: send the visitor to the shop's own address.
  const onMainDomain = !!platformDomain && (host === platformDomain || host === `www.${platformDomain}`);
  if (onMainDomain && /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(slug)) {
    const path = rest.length ? `/${rest.join('/')}` : '/';
    return { slug, basePath: '', subdomainUrl: `https://${slug}.${platformDomain}${path}${location.search}` };
  }

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
