import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  api, ApiError, normalizeTheme, resolveStoreLocation,
  type PreviewMessage, type Product, type PublicPlatformStore, type PublicStore, type Theme,
} from '@cp/shared';

// ─── Current store (tenant) ───────────────────────────────────────────────────
// Platform stores (created in the Store Builder) are looked up first; existing
// Alfudi sellers without a platform store still render with a default design.

export interface StoreView {
  source: 'platform' | 'legacy';
  slug: string;
  name: string;
  published: boolean;
  theme: Theme;
  ownerId: string;
  avatarUrl: string;
  description: string;
  bannerUrl: string;
  whatsapp: string;
  location: string;
}

async function loadStore(slug: string): Promise<StoreView> {
  try {
    const s = await api<PublicPlatformStore>(`/api/platform/public/${encodeURIComponent(slug)}/`);
    return {
      source: 'platform', slug: s.slug, name: s.name, published: s.published,
      theme: normalizeTheme(s.theme, s.name), ownerId: s.owner_id, avatarUrl: s.avatar_url,
      description: s.description, bannerUrl: s.banner_url, whatsapp: s.whatsapp, location: s.location,
    };
  } catch (platformError) {
    // Not a platform store (404) — or the platform API is unavailable — so try
    // an existing Alfudi seller with this username before giving up.
    try {
      return await loadLegacyStore(slug);
    } catch {
      throw platformError;
    }
  }
}

async function loadLegacyStore(slug: string): Promise<StoreView> {
  const s = await api<PublicStore>(`/api/sellers/${encodeURIComponent(slug)}/`);
  const name = s.store_name || s.name;
  return {
    source: 'legacy', slug, name, published: true, theme: normalizeTheme(null, name), ownerId: s.id,
    avatarUrl: s.avatar_url, description: s.store_description, bannerUrl: s.store_banner_url,
    whatsapp: s.store_whatsapp, location: s.store_location,
  };
}

const ADMIN_ORIGIN = ((import.meta.env.VITE_ADMIN_ORIGIN as string | undefined)
  || (import.meta.env.PROD ? 'https://commerce-platform-syp7.vercel.app' : 'http://localhost:5173')).replace(/\/$/, '');

interface StoreState {
  slug: string | null;
  /** Router basename for path-based stores ("/@slug"), "" otherwise. */
  basePath: string;
  store: StoreView | undefined;
  isLoading: boolean;
  isError: boolean;
  /** Rendering inside the admin's theme editor. */
  preview: boolean;
  /** Section currently selected in the editor (preview only). */
  highlightId: string | null;
  selectSection: (id: string) => void;
}

const StoreContext = createContext<StoreState | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  // Resolve once per page load; short links (/mystore/...) become /@mystore/...
  const { slug, basePath } = useMemo(() => {
    const loc = resolveStoreLocation();
    if (loc.canonicalPath) window.history.replaceState(null, '', loc.canonicalPath + window.location.search + window.location.hash);
    return loc;
  }, []);
  const preview = useMemo(() => new URLSearchParams(window.location.search).get('preview') === '1' && window.parent !== window, []);
  const [draft, setDraft] = useState<Theme | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['store', slug],
    queryFn: () => loadStore(slug!),
    enabled: !!slug,
    staleTime: 5 * 60_000,
    retry: (count, e) => !(e instanceof ApiError && e.status === 404) && count < 1,
  });

  // Editor link: receive the unsaved draft + selection, report clicks back.
  useEffect(() => {
    if (!preview) return;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== ADMIN_ORIGIN) return;
      const msg = e.data as PreviewMessage;
      if (msg?.type === 'cp:theme') setDraft(normalizeTheme(msg.theme));
      if (msg?.type === 'cp:highlight') setHighlightId(msg.id);
    };
    window.addEventListener('message', onMessage);
    window.parent.postMessage({ type: 'cp:ready' } satisfies PreviewMessage, ADMIN_ORIGIN);
    return () => window.removeEventListener('message', onMessage);
  }, [preview]);

  useEffect(() => {
    if (data) document.title = data.name;
  }, [data]);

  const store = data && draft ? { ...data, theme: draft } : data;
  const selectSection = (id: string) => {
    if (preview) window.parent.postMessage({ type: 'cp:select', id } satisfies PreviewMessage, ADMIN_ORIGIN);
  };

  return (
    <StoreContext.Provider value={{ slug, basePath, store, isLoading: !!slug && isLoading, isError, preview, highlightId, selectSection }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}

const listOfProducts = (data: Product[] | { results: Product[] }) => (Array.isArray(data) ? data : data.results);

/** The current store's published products. */
export function useStoreProducts() {
  const { store } = useStore();
  return useQuery({
    queryKey: ['store-products', store?.source, store?.slug],
    queryFn: async () => listOfProducts(await api<Product[] | { results: Product[] }>(
      store!.source === 'platform'
        ? `/api/platform/public/${encodeURIComponent(store!.slug)}/products/`
        : `/api/products/?seller_id=${store!.ownerId}&page_size=100`,
    )),
    enabled: !!store,
  });
}

export function useStoreProduct(id: string | undefined) {
  const { store } = useStore();
  return useQuery({
    queryKey: ['product', store?.slug, id],
    queryFn: () => api<Product>(
      store!.source === 'platform'
        ? `/api/platform/public/${encodeURIComponent(store!.slug)}/products/${id}/`
        : `/api/products/${id}/`,
    ),
    enabled: !!store && !!id,
  });
}

// ─── Cart (per store, in this browser) ────────────────────────────────────────

export interface CartLine { id: string; name: string; price: number; image: string; qty: number }

interface CartState {
  lines: CartLine[];
  count: number;
  subtotal: number;
  add: (p: Product, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartState | null>(null);

const cartKey = (slug: string | null) => `cp_cart:${slug ?? 'none'}`;

function readCart(slug: string | null): CartLine[] {
  try { return JSON.parse(localStorage.getItem(cartKey(slug)) ?? '[]'); } catch { return []; }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { slug, preview } = useStore();
  const [lines, setLines] = useState<CartLine[]>(() => (preview ? [] : readCart(slug)));

  useEffect(() => {
    if (preview) return;
    try { localStorage.setItem(cartKey(slug), JSON.stringify(lines)); } catch { /* storage unavailable */ }
  }, [slug, lines, preview]);

  const value = useMemo<CartState>(() => ({
    lines,
    count: lines.reduce((n, l) => n + l.qty, 0),
    subtotal: lines.reduce((s, l) => s + l.qty * l.price, 0),
    add: (p, qty = 1) => setLines(prev => {
      const existing = prev.find(l => l.id === p.id);
      if (existing) return prev.map(l => (l.id === p.id ? { ...l, qty: l.qty + qty } : l));
      return [...prev, { id: p.id, name: p.name, price: Number(p.price) || 0, image: p.image_url, qty }];
    }),
    setQty: (id, qty) => setLines(prev => (qty <= 0 ? prev.filter(l => l.id !== id) : prev.map(l => (l.id === id ? { ...l, qty } : l)))),
    remove: id => setLines(prev => prev.filter(l => l.id !== id)),
    clear: () => setLines([]),
  }), [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
