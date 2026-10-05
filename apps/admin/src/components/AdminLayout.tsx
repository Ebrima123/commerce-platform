import { useState, type ReactNode } from 'react';
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useMyStore, storefrontUrl } from '../platform';
import {
  LayoutDashboard, Package, ShoppingCart, Palette, Globe, CreditCard, Settings,
  LogOut, Menu, X, Store, ExternalLink, Loader2,
} from 'lucide-react';
import { api } from '@cp/shared';
import { Button, cn } from '@cp/ui';
import { useAuth } from '../auth';

const NAV = [
  { section: 'Store', items: [
    { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/products', label: 'Products', icon: Package },
    { to: '/orders', label: 'Orders', icon: ShoppingCart },
  ] },
  { section: 'Online store', items: [
    { to: '/design', label: 'Design', icon: Palette },
    { to: '/domains', label: 'Domains', icon: Globe },
  ] },
  { section: 'Account', items: [
    { to: '/billing', label: 'Billing', icon: CreditCard },
    { to: '/settings', label: 'Settings', icon: Settings },
  ] },
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

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, signOut } = useAuth();
  const { data: store } = useMyStore();
  const name = store?.name ?? '';

  return (
    <div className="flex h-full flex-col border-r border-border/60 bg-card">
      <div className="flex h-16 items-center gap-3 border-b border-border/60 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-foreground shadow-sm">
          <Store className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight">{name || 'Your store'}</p>
          <p className="text-xs text-muted-foreground">Store Builder</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4" aria-label="Main">
        {NAV.map(group => (
          <div key={group.section}>
            <p className="px-3 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">{group.section}</p>
            {group.items.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={onNavigate}
                className={({ isActive }) => cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4 stroke-[1.75]" />
                {label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="space-y-1 border-t border-border/60 p-3">
        {store && (
          <a href={storefrontUrl(store.slug)} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
            View store <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
        <div className="flex items-center gap-3 rounded-xl p-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-medium text-background">
            {(user?.full_name || user?.username || '?').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold" title={user?.username}>{user?.full_name || `@${user?.username}`}</p>
            <p className="truncate text-[11px] capitalize text-muted-foreground">{user?.seller_staff_of ? 'Staff' : user?.role}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={signOut} aria-label="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AdminLayout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block"><Sidebar /></aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 shadow-xl">
            <Sidebar onNavigate={() => setOpen(false)} />
            <button className="absolute right-3 top-4 rounded-md p-1 text-muted-foreground hover:bg-muted" onClick={() => setOpen(false)} aria-label="Close navigation">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-sm lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu className="h-5 w-5" /></Button>
          <Link to="/" className="text-sm font-semibold">Store Builder</Link>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
