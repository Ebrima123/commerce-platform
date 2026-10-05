import { useQuery } from '@tanstack/react-query';
import { api, type PlatformStore } from '@cp/shared';
import { useAuth } from './auth';

export const STOREFRONT_ORIGIN = (
  (import.meta.env.VITE_STOREFRONT_ORIGIN as string | undefined)
  || (import.meta.env.PROD ? 'https://commerce-platform-rho.vercel.app' : 'http://localhost:5174')
).replace(/\/$/, '');

/** The signed-in merchant's Store Builder store (null if they haven't created one). */
export function useMyStore() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-store', user?.id],
    queryFn: async () => (await api<PlatformStore[]>('/api/platform/stores/', { auth: true }))[0] ?? null,
    enabled: !!user,
    staleTime: 60_000,
  });
}

const PLATFORM_DOMAIN = (import.meta.env.VITE_PLATFORM_DOMAIN as string | undefined)?.trim() || '';

/**
 * Public address of a store:
 *   https://slug.<VITE_PLATFORM_DOMAIN>   once a custom wildcard domain is set up
 *   <storefront>/@slug                    otherwise (short form <storefront>/slug redirects here)
 */
export function storefrontUrl(slug: string) {
  if (PLATFORM_DOMAIN) return `https://${slug}.${PLATFORM_DOMAIN}`;
  return `${STOREFRONT_ORIGIN}/@${encodeURIComponent(slug)}`;
}

/** How the wizard displays the address around the slug input. */
export function storeAddressParts(): { prefix: string; suffix: string } {
  if (PLATFORM_DOMAIN) return { prefix: '', suffix: `.${PLATFORM_DOMAIN}` };
  return { prefix: `${new URL(STOREFRONT_ORIGIN).host}/@`, suffix: '' };
}

/** Storefront URL the theme editor embeds; it then streams the draft design in via postMessage. */
export const previewUrl = (slug: string) => `${STOREFRONT_ORIGIN}/?store=${encodeURIComponent(slug)}&preview=1`;
