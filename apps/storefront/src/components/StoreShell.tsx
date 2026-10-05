import { Link, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { MapPin, MessageCircle, ShoppingBag } from 'lucide-react';
import { useCart, useStore } from '../store';
import { SectionList } from '../sections/Sections';

/** Keeps ?store= (and preview mode) on internal links when the store was picked by query. */
export function useStoreHref() {
  const params = new URLSearchParams(window.location.search);
  const keep = new URLSearchParams();
  const store = params.get('store');
  if (store) keep.set('store', store);
  if (params.get('preview') === '1') keep.set('preview', '1');
  const qs = keep.toString();
  return (path: string) => (qs ? `${path}${path.includes('?') ? '&' : '?'}${qs}` : path);
}

export function StoreShell() {
  const { store } = useStore();
  const { count } = useCart();
  const href = useStoreHref();
  const { pathname } = useLocation();

  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  if (!store) return null;
  const { brand, sections } = store.theme;
  const logo = brand.logoUrl || store.avatarUrl;
  const wa = store.whatsapp.replace(/\D/g, '');
  const announcement = sections.filter(s => s.type === 'announcement');

  return (
    <div className="flex min-h-screen flex-col">
      <SectionList sections={announcement} />

      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to={href('/')} className="flex min-w-0 items-center gap-3">
            {logo ? (
              <img src={logo} alt="" className="h-9 w-9 rounded-[var(--btn-radius)] object-cover" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-[var(--btn-radius)] bg-brand text-sm font-semibold text-brand-foreground">
                {store.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="truncate font-heading text-lg font-semibold tracking-tight">{store.name}</span>
          </Link>
          <Link to={href('/cart')} className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted" aria-label={`Cart, ${count} item${count !== 1 ? 's' : ''}`}>
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-semibold text-brand-foreground">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </Link>
        </div>
      </header>

      <main className="flex-1"><Outlet /></main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="font-medium text-foreground">{store.name}</span>
            {store.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{store.location}</span>}
            {wa && (
              <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </a>
            )}
          </div>
          <span className="text-xs">Powered by Store Builder</span>
        </div>
      </footer>
    </div>
  );
}
