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

/** Public address of a store: slug.<platform domain> in production, slug.localhost in dev. */
export function storefrontUrl(slug: string) {
  const domain = import.meta.env.VITE_PLATFORM_DOMAIN as string | undefined;
  if (domain) return `https://${slug}.${domain}`;
  const u = new URL(STOREFRONT_ORIGIN);
  return `${u.protocol}//${slug}.${u.host}`;
}

/** Storefront URL the theme editor embeds; it then streams the draft design in via postMessage. */
export const previewUrl = (slug: string) => `${STOREFRONT_ORIGIN}/?store=${encodeURIComponent(slug)}&preview=1`;
