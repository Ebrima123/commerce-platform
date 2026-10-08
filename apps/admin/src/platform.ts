import { useSyncExternalStore } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, setApiStoreId, type PlatformStore } from '@cp/shared';
import { useAuth } from './auth';
import type { ProductChannel } from './commerce';

export const STOREFRONT_ORIGIN = (
  (import.meta.env.VITE_STOREFRONT_ORIGIN as string | undefined)
  || (import.meta.env.PROD ? 'https://mariseh.com' : 'http://localhost:5174')
).replace(/\/$/, '');

// ─── Current store selection (per browser) ────────────────────────────────────

const SELECTED_KEY = 'cp_current_store';
const listeners = new Set<() => void>();
let selectedId: string | null = (() => { try { return localStorage.getItem(SELECTED_KEY); } catch { return null; } })();

export function selectStoreId(id: string | null) {
  selectedId = id;
  try { if (id) localStorage.setItem(SELECTED_KEY, id); else localStorage.removeItem(SELECTED_KEY); } catch { /* storage unavailable */ }
  listeners.forEach(l => l());
}

const useSelectedStoreId = () => useSyncExternalStore(
  cb => { listeners.add(cb); return () => listeners.delete(cb); },
  () => selectedId,
);

/** All of the signed-in merchant's stores (newest first). */
export function useMyStores() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-stores', user?.id],
    queryFn: () => api<PlatformStore[]>('/api/platform/stores/', { auth: true }),
    enabled: !!user,
    staleTime: 60_000,
  });
}

/**
 * The store the admin is currently working on (null if they have none).
 * Also points every authenticated API call at it (X-Store-Id), so products,
 * orders and stats are that store's.
 */
export function useMyStore() {
  const query = useMyStores();
  const selected = useSelectedStoreId();
  const stores = query.data;
  // Default to the merchant's first store (it also holds their older products).
  const store = stores === undefined ? undefined : (stores.find(s => s.id === selected) ?? stores[stores.length - 1] ?? null);
  setApiStoreId(store?.id ?? null);
  return { ...query, data: store };
}

/** Switch stores: remember the choice and drop cached data from the previous store. */
export function useSwitchStore() {
  const qc = useQueryClient();
  return (id: string) => {
    if (id === selectedId) return;
    selectStoreId(id);
    setApiStoreId(id);
    qc.removeQueries({ predicate: q => q.queryKey[0] !== 'my-stores' });
  };
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

// ─── Product visibility per channel ───────────────────────────────────────────

/** {product_id: {visible on Mariseh, Alfudi review status}} for the signed-in seller. */
export const useProductChannels = () =>
  useQuery({
    queryKey: ['product-channels'],
    queryFn: () => api<Record<string, ProductChannel>>('/api/platform/product-channels/', { auth: true }),
  });

/** Show/hide a product on Mariseh only, or ask Alfudi to review it again. */
export function useUpdateProductChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; visible?: boolean; resubmit?: boolean }) =>
      api<ProductChannel>(`/api/platform/product-channels/${id}/`, { method: 'PATCH', auth: true, body }),
    onSuccess: (c, { id }) => {
      qc.setQueryData<Record<string, ProductChannel>>(['product-channels'], prev => ({ ...(prev ?? {}), [id]: c }));
      qc.invalidateQueries({ queryKey: ['public-store'] });
    },
  });
}
