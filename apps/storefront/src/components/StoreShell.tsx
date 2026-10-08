import { Link, Outlet, useLocation, useSearchParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { MapPin, Search, ShoppingBag, Truck, Wallet } from 'lucide-react';
import { cn } from '@cp/ui';
import { useCart, useStore, useStoreProducts } from '../store';
import { SectionList, showCategory } from '../sections/Sections';
import { container, useStoreHref, useWhatsAppLink, WhatsAppIcon } from './primitives';
import { TabBar } from './TabBar';

export { useStoreHref } from './primitives';

function scrollToProducts(focusSearch = false) {
  const el = document.getElementById('products');
  if (!el) return false;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  if (focusSearch) setTimeout(() => el.querySelector<HTMLInputElement>('input[aria-label="Search products"]')?.focus({ preventScroll: true }), 450);
  return true;
}

export function StoreShell() {
  const { store } = useStore();
  const { count } = useCart();
  const { data: products = [] } = useStoreProducts();
  const href = useStoreHref();
  const { pathname } = useLocation();
  const wa = useWhatsAppLink(store ? `Hello ${store.name}, I have a question.` : undefined);
  const [scrolled, setScrolled] = useState(false);
  const onHome = pathname === '/' || pathname === '';

  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  // Search tab (?search=1): jump to the product search once the list is there.
  const [params, setParams] = useSearchParams();
  useEffect(() => {
    if (params.get('search') !== '1' || !products.length) return;
    const t = setTimeout(() => { scrollToProducts(true); params.delete('search'); setParams(params, { replace: true }); }, 100);
    return () => clearTimeout(t);
  }, [params, products.length, setParams]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const categories = useMemo(() => {
    const fromTiles = store?.theme.sections
      .filter(s => s.type === 'categories' && !s.hidden)
      .flatMap(s => (Array.isArray(s.settings.items) ? s.settings.items : []))
      .map(t => t.name).filter(Boolean) ?? [];
    const fromProducts = [...new Set(products.map(p => p.category).filter(Boolean))];
    return [...new Set([...fromTiles, ...fromProducts])].slice(0, 6);
  }, [store?.theme.sections, products]);

  if (!store) return null;
  const { brand, sections } = store.theme;
  const announcement = sections.filter(s => s.type === 'announcement');
  const hero = sections.find(s => s.type === 'hero');
  const blurb = store.description || (typeof hero?.settings.subheading === 'string' ? hero.settings.subheading : '');

  const searchClick = () => { if (!scrollToProducts(true)) window.location.assign(href('/')); };

  return (
    <div className="flex min-h-screen flex-col pb-[calc(50px+env(safe-area-inset-bottom))] md:pb-0">
      <SectionList sections={announcement} />

      <header className={cn('sticky top-0 z-30 bg-background/80 pt-safe backdrop-blur-xl backdrop-saturate-150 transition-shadow duration-300',
        scrolled ? 'shadow-[0_0.5px_0_rgba(0,0,0,0.18)]' : '')}>
        <div className={cn(container, 'flex h-16 items-center justify-between gap-4 sm:h-[72px]')}>
          <Link to={href('/')} className="flex min-w-0 items-center gap-3" aria-label={`${store.name} home`}>
            {brand.logoUrl ? (
              <img src={brand.logoUrl} alt="" className="h-10 w-auto max-w-[140px] object-contain" />
            ) : store.avatarUrl ? (
              <img src={store.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
            ) : null}
            <span className="truncate font-heading text-xl font-semibold tracking-tight sm:text-[22px]">{store.name}</span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium md:flex" aria-label="Store">
            {onHome && <button type="button" onClick={() => scrollToProducts()} className="text-muted-foreground transition-colors hover:text-foreground">Shop</button>}
            {!onHome && <Link to={href('/')} className="text-muted-foreground transition-colors hover:text-foreground">Shop</Link>}
            {onHome && categories.slice(0, 3).map(c => (
              <button key={c} type="button" onClick={() => showCategory(c)} className="text-muted-foreground transition-colors hover:text-foreground">{c}</button>
            ))}
            <a href="#contact" className="text-muted-foreground transition-colors hover:text-foreground">Contact</a>
          </nav>

          <div className="flex items-center gap-1">
            <button type="button" onClick={searchClick} aria-label="Search products"
              className="flex h-11 w-11 items-center justify-center rounded-full text-foreground hover:bg-muted">
              <Search className="h-[20px] w-[20px]" strokeWidth={1.8} />
            </button>
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp"
                className="hidden h-11 w-11 items-center justify-center rounded-full text-foreground hover:bg-muted sm:flex">
                <WhatsAppIcon className="h-[20px] w-[20px]" />
              </a>
            )}
            <Link to={href('/cart')} aria-label={`Cart, ${count} item${count !== 1 ? 's' : ''}`}
              className="relative flex h-11 w-11 items-center justify-center rounded-full text-foreground hover:bg-muted">
              <ShoppingBag className="h-[21px] w-[21px]" strokeWidth={1.8} />
              {count > 0 && (
                <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-brand-foreground">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <main key={pathname} className="animate-page flex-1"><Outlet /></main>

      <footer id="contact" className="mt-auto border-t border-border/70 bg-card">
        <div className={cn(container, 'grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]')}>
          <div>
            <p className="font-heading text-2xl font-semibold tracking-tight">{store.name}</p>
            {blurb && <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">{blurb}</p>}
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer"
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-[var(--btn-radius)] bg-[#25D366] px-5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5">
                <WhatsAppIcon className="h-[18px] w-[18px]" /> Chat with us
              </a>
            )}
          </div>

          {categories.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Shop</p>
              <ul className="mt-4 space-y-2.5 text-sm">
                {categories.map(c => (
                  <li key={c}>
                    {onHome
                      ? <button type="button" onClick={() => showCategory(c)} className="hover:underline underline-offset-4">{c}</button>
                      : <Link to={href('/')} className="hover:underline underline-offset-4">{c}</Link>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Visit & pay</p>
            <ul className="mt-4 space-y-3 text-sm">
              {store.location && <li className="flex items-start gap-2.5"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />{store.location}</li>}
              <li className="flex items-start gap-2.5"><Truck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />Delivery arranged on WhatsApp</li>
              <li className="flex items-start gap-2.5"><Wallet className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex flex-wrap gap-1.5">
                  <span className="rounded-md border border-border px-2 py-0.5 text-xs font-medium">Wave</span>
                  <span className="rounded-md border border-border px-2 py-0.5 text-xs font-medium">Cash on delivery</span>
                </span>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border/70">
          <div className={cn(container, 'flex flex-col gap-2 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between')}>
            <span>© {new Date().getFullYear()} {store.name}. All rights reserved.</span>
            <span>Powered by Mariseh</span>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp button on wide screens; phones have Chat in the tab bar. */}
      {wa && pathname !== '/cart' && (
        <a href={wa} target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp"
          className="fixed bottom-6 right-6 z-40 hidden h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_rgba(37,211,102,0.45)] transition-transform hover:scale-105 active:scale-95 md:flex">
          <WhatsAppIcon className="h-7 w-7" />
        </a>
      )}

      <TabBar storeName={store.name} variant="boutique" />
    </div>
  );
}
