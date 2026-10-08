import { useEffect, useState, type FormEvent } from 'react';
import { Link, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Search, ShoppingBag, Truck, Wallet, X } from 'lucide-react';
import { cn } from '@cp/ui';
import { useCart, useStore } from '../../store';
import { SectionList } from '../../sections/Sections';
import { container, useStoreHref, useWhatsAppLink, WhatsAppIcon } from '../primitives';
import { TabBar } from '../TabBar';

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

  return (
    <div className="flex min-h-screen flex-col bg-muted/40 pb-[calc(50px+env(safe-area-inset-bottom))] md:pb-0">
      <SectionList sections={announcement} />

      {/* iOS-style translucent bar: store name on top, search field below (one row on desktop). */}
      <header className="sticky top-0 z-30 border-b-[0.5px] border-black/15 bg-card/85 pt-safe backdrop-blur-xl backdrop-saturate-150">
        <div className={cn(container, 'flex flex-wrap items-center gap-x-5 gap-y-2 pb-2.5 pt-2 md:h-16 md:flex-nowrap md:py-0')}>
          <Link to={href('/')} className="order-1 flex min-w-0 flex-1 items-center gap-2 md:flex-none" aria-label={`${store.name} home`}>
            {brand.logoUrl && <img src={brand.logoUrl} alt="" className="h-8 w-auto max-w-[96px] rounded-lg object-contain" />}
            <span className="truncate font-heading text-[22px] font-bold tracking-tight md:max-w-[240px] md:text-xl">{store.name}</span>
          </Link>

          <form onSubmit={submit} role="search" className="relative order-3 min-w-0 basis-full md:order-2 md:basis-auto md:flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
            <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products" aria-label="Search products"
              enterKeyHint="search"
              className="h-9 w-full rounded-[10px] border-0 bg-zinc-500/[0.12] pl-9 pr-9 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/30 md:h-10 [&::-webkit-search-cancel-button]:hidden" />
            {query && (
              <button type="button" onClick={() => { setQuery(''); navigate(href('/')); }} aria-label="Clear search"
                className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-zinc-400 text-white"><X className="h-3 w-3" strokeWidth={3} /></button>
            )}
          </form>

          <div className="order-2 hidden items-center gap-1 md:order-3 md:flex">
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="flex h-10 items-center gap-2 rounded-full px-3 text-[15px] font-medium text-brand hover:bg-brand/10">
                <WhatsAppIcon className="h-5 w-5 text-[#25D366]" /> Chat
              </a>
            )}
            <Link to={href('/cart')} className="relative flex h-10 items-center gap-2 rounded-full px-3 text-[15px] font-medium text-brand hover:bg-brand/10" aria-label={`Cart, ${count} items`}>
              <ShoppingBag className="h-5 w-5" /> Cart
              {count > 0 && <span className="absolute left-6 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#ff3b30] px-1 text-[11px] font-semibold text-white">{count > 99 ? '99+' : count}</span>}
            </Link>
          </div>
        </div>
      </header>

      <main key={pathname} className="animate-page flex-1"><Outlet /></main>

      <footer id="contact" className="mt-8 border-t border-border/70 bg-card">
        <div className={cn(container, 'grid gap-8 py-10 sm:grid-cols-3')}>
          <div>
            <p className="font-heading text-lg font-bold">{store.name}</p>
            {store.description && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{store.description}</p>}
          </div>
          <ul className="space-y-2.5 text-sm">
            {store.location && <li className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />{store.location}</li>}
            <li className="flex gap-2"><Truck className="h-4 w-4 shrink-0 text-muted-foreground" />Delivery arranged on WhatsApp</li>
            <li className="flex gap-2"><Wallet className="h-4 w-4 shrink-0 text-muted-foreground" />Pay on delivery or as agreed on WhatsApp</li>
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
        <p className="border-t border-border/70 py-4 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} {store.name} · Powered by Mariseh</p>
      </footer>

      <TabBar storeName={store.name} variant="marketplace" />
    </div>
  );
}
