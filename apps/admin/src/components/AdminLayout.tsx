import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { normalizeTheme, type PlatformStore } from '@cp/shared';
import { useMyStore, useMyStores, useSwitchStore, storefrontUrl } from '../platform';
import {
  Package, Palette, Globe, CreditCard, Settings, LogOut, ExternalLink, Loader2,
  ChevronsUpDown, ChevronLeft, Check, Plus, LayoutGrid, House, ReceiptText, Paintbrush, CircleEllipsis, Users, ChartColumn,
} from 'lucide-react';
import { api } from '@cp/shared';
import { Button, cn } from '@cp/ui';
import { useAuth } from '../auth';
import { BarButton, ListRow, ListSection, Sheet } from './ios';

// iOS-style shell: a tab bar and large titles on phones, an iPad-style sidebar
// on wide screens. Every page starts with <PageHeader>.

const NAV = [
  { section: 'Store', items: [
    { to: '/', label: 'Home', icon: House, end: true },
    { to: '/orders', label: 'Orders', icon: ReceiptText },
    { to: '/products', label: 'Products', icon: Package },
    { to: '/customers', label: 'Customers', icon: Users },
    { to: '/analytics', label: 'Analytics', icon: ChartColumn },
  ] },
  { section: 'Online store', items: [
    { to: '/design', label: 'Design', icon: Palette },
    { to: '/domains', label: 'Domains', icon: Globe },
  ] },
  { section: 'Account', items: [
    { to: '/stores', label: 'My stores', icon: LayoutGrid },
    { to: '/billing', label: 'Billing', icon: CreditCard },
    { to: '/settings', label: 'Store details', icon: Settings },
  ] },
];

const TABS = [
  { to: '/', label: 'Home', icon: House, match: (p: string) => p === '/' },
  { to: '/products', label: 'Products', icon: Package, match: (p: string) => p.startsWith('/products') },
  { to: '/orders', label: 'Orders', icon: ReceiptText, match: (p: string) => p.startsWith('/orders') },
  { to: '/design', label: 'Design', icon: Paintbrush, match: (p: string) => p.startsWith('/design') },
  { to: '/more', label: 'More', icon: CircleEllipsis, match: (p: string) => ['/more', '/settings', '/stores', '/billing', '/domains', '/customers', '/analytics'].some(x => p.startsWith(x)) },
];

export interface StoreProfile {
  username: string;
  store_name: string;
  store_description: string;
  store_whatsapp: string;
  store_location: string;
  store_banner_url: string;
  avatar_url: string;
  full_name: string;
  store_is_complete: boolean;
}

export const useStoreProfile = () =>
  useQuery({ queryKey: ['store-profile'], queryFn: () => api<StoreProfile>('/api/seller/profile/', { auth: true }) });


const FullPageSpinner = () => (
  <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
);

/** Signed in, or off to /login (remembering where they were going). */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}

/** Signed in AND has a store — otherwise straight into the store wizard. */
export function RequireStore({ children }: { children: ReactNode }) {
  const { data: store, isLoading, isError } = useMyStore();
  if (isLoading) return <FullPageSpinner />;
  if (!isError && !store) return <Navigate to="/start" replace />;
  return <>{children}</>;
}

// ─── Store avatar + switcher ──────────────────────────────────────────────────

/** The store's logo, or its first letter on its brand colour. */
export function StoreAvatar({ store, className }: { store?: PlatformStore; className?: string }) {
  const theme = store ? normalizeTheme(store.theme, store.name) : null;
  if (theme?.brand.logoUrl) {
    return <img src={theme.brand.logoUrl} alt="" className={cn('h-9 w-9 shrink-0 rounded-full bg-white object-contain p-0.5 ring-1 ring-black/5', className)} />;
  }
  return (
    <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[15px] font-semibold text-white', className)}
      style={{ background: theme?.brand.primaryColor ?? 'hsl(var(--brand))' }}>
      {(store?.name || '?').charAt(0).toUpperCase()}
    </span>
  );
}

/** Pick which store to manage — a bottom sheet on phones. */
function StoreSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: store } = useMyStore();
  const { data: stores = [] } = useMyStores();
  const switchStore = useSwitchStore();
  const navigate = useNavigate();

  return (
    <Sheet open={open} onClose={onClose} title="Your stores" trailing={<BarButton bold onClick={onClose}>Done</BarButton>}>
      <ListSection>
        {stores.map(s => (
          <ListRow key={s.id} leading={<StoreAvatar store={s} />} title={s.name}
            subtitle={storefrontUrl(s.slug, s.custom_domain).replace(/^https?:\/\//, '')}
            trailing={s.id === store?.id ? <Check className="h-5 w-5 shrink-0 text-brand" strokeWidth={2.5} /> : <span />}
            onClick={() => { switchStore(s.id); onClose(); navigate('/'); }} />
        ))}
      </ListSection>
      <ListSection>
        <ListRow icon={LayoutGrid} iconColor="#007aff" title="Manage all stores" to="/stores" onClick={onClose} />
        <ListRow icon={Plus} iconColor="#34c759" title="Create another store" to="/start?new=1" />
      </ListSection>
    </Sheet>
  );
}

/** Desktop: store name + dropdown at the top of the sidebar. */
function StoreSwitcher() {
  const { data: store } = useMyStore();
  const { data: stores = [] } = useMyStores();
  const switchStore = useSwitchStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);

  return (
    <div ref={ref} className="relative px-3 pt-4">
      <button type="button" onClick={() => setOpen(o => !o)} aria-haspopup="menu" aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-2xl bg-card p-2.5 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-transform active:scale-[0.98]">
        <StoreAvatar store={store} className="h-10 w-10 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold tracking-tight">{store?.name || 'Your store'}</p>
          <p className="text-[13px] text-muted-foreground">{stores.length > 1 ? `${stores.length} stores` : 'Mariseh'}</p>
        </div>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>
      {open && (
        <div role="menu" className="animate-pop absolute inset-x-3 top-full z-50 mt-2 overflow-hidden rounded-2xl bg-card/95 shadow-[0_10px_40px_rgba(0,0,0,0.18)] ring-1 ring-black/5 backdrop-blur-xl">
          <ul className="max-h-72 overflow-y-auto p-1.5">
            {stores.map(s => (
              <li key={s.id}>
                <button type="button" role="menuitem"
                  onClick={() => { switchStore(s.id); setOpen(false); navigate('/'); }}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-muted/70">
                  <StoreAvatar store={s} className="h-8 w-8 text-[13px]" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium">{s.name}</span>
                    <span className="block truncate text-[13px] text-muted-foreground">/@{s.slug}</span>
                  </span>
                  {s.id === store?.id && <Check className="h-4 w-4 shrink-0 text-brand" strokeWidth={2.5} />}
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-border/70 p-1.5">
            <Link to="/stores" role="menuitem" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-2 py-2 text-[15px] hover:bg-muted/70">
              <LayoutGrid className="h-5 w-5 text-brand" /> Manage all stores
            </Link>
            <Link to="/start?new=1" role="menuitem" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-2 py-2 text-[15px] hover:bg-muted/70">
              <Plus className="h-5 w-5 text-brand" /> Create another store
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/** iPad-style sidebar (wide screens). */
function Sidebar() {
  const { user, signOut } = useAuth();
  const { data: store } = useMyStore();

  return (
    <div className="flex h-full flex-col border-r border-border/60 bg-background">
      <StoreSwitcher />

      <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Main">
        {NAV.map(group => (
          <div key={group.section}>
            <p className="px-3 pb-1.5 pt-6 text-[13px] font-semibold text-muted-foreground">{group.section}</p>
            <div className="space-y-0.5">
              {group.items.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end}
                  className={({ isActive }) => cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2 text-[15px] transition-colors',
                    isActive ? 'bg-brand font-semibold text-brand-foreground' : 'text-foreground hover:bg-black/[0.04]',
                  )}>
                  {({ isActive }) => <><Icon className={cn('h-5 w-5', !isActive && 'text-brand')} />{label}</>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-1 p-3">
        {store && (
          <a href={storefrontUrl(store.slug, store.custom_domain)} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-between rounded-xl px-3 py-2 text-[15px] text-brand hover:bg-black/[0.04]">
            View my store <ExternalLink className="h-4 w-4" />
          </a>
        )}
        <div className="flex items-center gap-3 rounded-2xl bg-card p-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[15px] font-semibold text-zinc-600">
            {(user?.full_name || user?.username || '?').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-medium" title={user?.username}>{user?.full_name || `@${user?.username}`}</p>
            <p className="truncate text-[13px] capitalize text-muted-foreground">{user?.seller_staff_of ? 'Staff' : user?.role}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={signOut} aria-label="Sign out">
            <LogOut className="h-[18px] w-[18px]" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Translucent iOS tab bar (phones and tablets). */
function TabBar() {
  const { pathname } = useLocation();
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t-[0.5px] border-black/20 bg-card/85 pb-safe backdrop-blur-xl backdrop-saturate-150 lg:hidden">
      <div className="mx-auto grid h-[50px] max-w-xl grid-cols-5">
        {TABS.map(({ to, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link key={to} to={to} aria-current={active ? 'page' : undefined}
              className={cn('flex flex-col items-center justify-center gap-[3px] pt-0.5 transition-colors active:opacity-60', active ? 'text-brand' : 'text-zinc-500')}>
              <Icon className="h-[24px] w-[24px]" strokeWidth={active ? 2.3 : 1.8} />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function AdminLayout() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-72 lg:block"><Sidebar /></aside>
      <div className="lg:pl-72">
        {/* Keyed by path so each page slides in like a pushed screen. */}
        <main key={pathname} className="animate-page mx-auto max-w-5xl px-4 pb-[calc(84px+env(safe-area-inset-bottom))] sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">
          <Outlet />
        </main>
      </div>
      <TabBar />
    </div>
  );
}

/**
 * iOS large title. On phones it also renders the navigation bar: store
 * avatar (or a back button) on the left, the page's actions on the right, and
 * a small centred title that fades in once the large title scrolls away.
 */
export function PageHeader({ title, description, actions, back }: {
  title: string; description?: ReactNode; actions?: ReactNode; back?: { to: string; label: string };
}) {
  const { data: store } = useMyStore();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [compact, setCompact] = useState(false);
  const [storesOpen, setStoresOpen] = useState(false);

  useEffect(() => {
    const el = titleRef.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => setCompact(!e.isIntersecting), { rootMargin: '-52px 0px 0px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <div className={cn('sticky top-0 z-30 -mx-4 pt-safe transition-[background-color,box-shadow] duration-200 sm:-mx-6 lg:hidden',
        compact ? 'bg-background/80 shadow-[0_0.5px_0_rgba(0,0,0,0.2)] backdrop-blur-xl backdrop-saturate-150' : 'bg-background')}>
        <div className="relative flex h-[52px] items-center justify-between gap-2 px-3 sm:px-5">
          <div className="flex min-w-0 items-center">
            {back ? (
              <Link to={back.to} className="-ml-1.5 flex h-11 items-center text-[17px] text-brand active:opacity-50">
                <ChevronLeft className="h-7 w-7" strokeWidth={2.2} />{back.label}
              </Link>
            ) : (
              <button type="button" onClick={() => setStoresOpen(true)} aria-label="Switch store" className="rounded-full transition-transform active:scale-95">
                <StoreAvatar store={store} />
              </button>
            )}
          </div>
          <p aria-hidden className={cn('pointer-events-none absolute inset-x-28 truncate text-center text-[17px] font-semibold transition-opacity duration-200', compact ? 'opacity-100' : 'opacity-0')}>
            {title}
          </p>
          <div className="flex shrink-0 items-center gap-1">{actions}</div>
        </div>
      </div>

      <div className="mb-5 flex items-end justify-between gap-4 pt-1 lg:mb-8 lg:pt-0">
        <div className="min-w-0">
          <h1 ref={titleRef} className="text-[34px] font-bold leading-[1.15] tracking-[-0.02em]">{title}</h1>
          {description && <p className="mt-1 text-[15px] text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="hidden shrink-0 items-center gap-2 lg:flex">{actions}</div>}
      </div>

      {!back && <StoreSheet open={storesOpen} onClose={() => setStoresOpen(false)} />}
    </>
  );
}

