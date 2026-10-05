import { useEffect, useState, type FormEvent } from 'react';
import { Link, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Home, LayoutGrid, MapPin, Search, ShoppingCart, Truck, Wallet, X } from 'lucide-react';
import { cn } from '@cp/ui';
import { useCart, useStore } from '../../store';
import { SectionList } from '../../sections/Sections';
import { container, useStoreHref, useWhatsAppLink, WhatsAppIcon } from '../primitives';

/**
 * Marketplace-style frame (think SHEIN / Temu / Alfudi): brand-coloured header
 * with a big search bar, and a thumb-friendly bottom tab bar on phones.
 * Search and category live in the URL (?q=, ?c=) so every page can use them.
 */
export function MarketplaceShell() {
  const { store } = useStore();
  const { count } = useCart();
  const href = useStoreHref();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const wa = useWhatsAppLink(store ? `Hello ${store.name}, I have a question.` : undefined);

  useEffect(() => { setQuery(params.get('q') ?? ''); }, [params]);
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  if (!store) return null;
  const { brand, sections } = store.theme;
  const announcement = sections.filter(s => s.type === 'announcement');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(href(q ? `/?q=${encodeURIComponent(q)}` : '/'));
    setTimeout(() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const tab = (to: string) => pathname === to;

  return (
    <div className="flex min-h-screen flex-col bg-muted/40 pb-[68px] md:pb-0">
      <SectionList sections={announcement} />

      <header className="sticky top-0 z-30 bg-brand text-brand-foreground shadow-sm">
        {/* Phones: name on top, full-width search below. Desktop: one row. */}
        <div className={cn(container, 'flex flex-wrap items-center gap-x-5 gap-y-2 pb-2.5 pt-2.5 md:h-16 md:flex-nowrap md:py-0')}>
          <Link to={href('/')} className="order-1 flex min-w-0 flex-1 items-center gap-2 md:flex-none" aria-label={`${store.name} home`}>
            {brand.logoUrl && <img src={brand.logoUrl} alt="" className="h-8 w-auto max-w-[96px] rounded bg-white/95 object-contain p-0.5" />}
            <span className="truncate font-heading text-lg font-bold tracking-tight md:max-w-[240px] md:text-xl">{store.name}</span>
          </Link>

          <form onSubmit={submit} role="search" className="relative order-3 min-w-0 basis-full md:order-2 md:basis-auto md:flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-zinc-500" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products" aria-label="Search products"
              enterKeyHint="search"
              className="h-10 w-full rounded-full border-0 bg-white pl-10 pr-20 text-[15px] text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/60 sm:h-11" />
            {query && (
              <button type="button" onClick={() => { setQuery(''); navigate(href('/')); }} aria-label="Clear search"
                className="absolute right-[60px] top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100"><X className="h-4 w-4" /></button>
            )}
            <button type="submit" className="absolute right-1 top-1/2 h-8 -translate-y-1/2 rounded-full bg-brand px-3.5 text-sm font-semibold text-brand-foreground sm:h-9 sm:px-4">Search</button>
          </form>

          <div className="order-2 hidden items-center gap-1 md:order-3 md:flex">
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="flex h-11 items-center gap-2 rounded-full px-3 text-sm font-medium hover:bg-white/10">
                <WhatsAppIcon className="h-5 w-5" /> Chat
              </a>
            )}
            <Link to={href('/cart')} className="relative flex h-11 items-center gap-2 rounded-full px-3 text-sm font-medium hover:bg-white/10" aria-label={`Cart, ${count} items`}>
              <ShoppingCart className="h-5 w-5" /> Cart
              {count > 0 && <span className="absolute left-6 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-brand">{count > 99 ? '99+' : count}</span>}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1"><Outlet /></main>

      <footer id="contact" className="mt-8 border-t border-border/70 bg-card">
        <div className={cn(container, 'grid gap-8 py-10 sm:grid-cols-3')}>
          <div>
            <p className="font-heading text-lg font-bold">{store.name}</p>
            {store.description && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{store.description}</p>}
          </div>
          <ul className="space-y-2.5 text-sm">
            {store.location && <li className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />{store.location}</li>}
            <li className="flex gap-2"><Truck className="h-4 w-4 shrink-0 text-muted-foreground" />Delivery arranged on WhatsApp</li>
            <li className="flex gap-2"><Wallet className="h-4 w-4 shrink-0 text-muted-foreground" />Pay with Wave or cash on delivery</li>
          </ul>
          {wa && (
            <div>
              <a href={wa} target="_blank" rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-[#25D366] px-5 text-sm font-semibold text-white">
                <WhatsAppIcon className="h-[18px] w-[18px]" /> Order on WhatsApp
              </a>
            </div>
          )}
        </div>
        <p className="border-t border-border/70 py-4 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} {store.name} · Powered by Store Builder</p>
      </footer>

      {/* Bottom tab bar (phones) */}
      <nav aria-label="Store" className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="grid h-[60px] grid-cols-4">
          <Link to={href('/')} className={cn('flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium', tab('/') ? 'text-brand' : 'text-muted-foreground')}>
            <Home className="h-[22px] w-[22px]" /> Home
          </Link>
          <Link to={href('/categories')} className={cn('flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium', tab('/categories') ? 'text-brand' : 'text-muted-foreground')}>
            <LayoutGrid className="h-[22px] w-[22px]" /> Categories
          </Link>
          {wa ? (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground">
              <WhatsAppIcon className="h-[22px] w-[22px] text-[#25D366]" /> Chat
            </a>
          ) : <span />}
          <Link to={href('/cart')} className={cn('relative flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium', tab('/cart') ? 'text-brand' : 'text-muted-foreground')}>
            <ShoppingCart className="h-[22px] w-[22px]" /> Cart
            {count > 0 && <span className="absolute left-1/2 top-1.5 ml-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-brand-foreground">{count > 99 ? '99+' : count}</span>}
          </Link>
        </div>
      </nav>
    </div>
  );
}
