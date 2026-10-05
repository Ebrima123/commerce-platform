import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Package, SearchX } from 'lucide-react';
import { INDUSTRIES, type ListItem, type Product, type Section } from '@cp/shared';
import { Skeleton, cn } from '@cp/ui';
import { useStore, useStoreProducts } from '../store';
import { container, Img, ThemeButton, useStoreHref, useWhatsAppLink, WhatsAppIcon } from '../components/primitives';
import { MarketCard } from '../components/marketplace/MarketCard';
import { FEATURE_ICON_COMPONENTS } from '../sections/icons';

const s = (v: unknown) => (typeof v === 'string' ? v : '');

interface Slide { image: string; title: string; text: string; button: string; link: string }

/** Banner carousel: swipe on phones, arrows on desktop, auto-advance. */
function BannerCarousel({ slides }: { slides: Slide[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const go = (i: number) => {
    const el = ref.current;
    if (!el) return;
    const next = (i + slides.length) % slides.length;
    el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
  };
  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => go(index + 1), 5000);
    return () => clearInterval(t);
  });
  if (!slides.length) return null;

  return (
    <div className="relative">
      <div ref={ref} onScroll={e => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        className="flex snap-x snap-mandatory overflow-x-auto rounded-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {slides.map((sl, i) => (
          <div key={i} className="relative aspect-[16/9] w-full shrink-0 snap-center overflow-hidden sm:aspect-[21/8]">
            <Img src={sl.image} alt="" eager={i === 0} />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
            <div className="absolute inset-y-0 left-0 flex max-w-[78%] flex-col justify-center p-5 text-white sm:max-w-[55%] sm:p-10">
              <p className="font-heading text-xl font-bold leading-tight sm:text-4xl">{sl.title}</p>
              {sl.text && <p className="mt-1.5 line-clamp-2 text-[13px] text-white/85 sm:mt-3 sm:text-base">{sl.text}</p>}
              {sl.button && <div className="mt-3 sm:mt-6"><ThemeButton href={sl.link} variant="light" className="h-9 px-4 text-sm sm:h-11 sm:px-6">{sl.button}</ThemeButton></div>}
            </div>
          </div>
        ))}
      </div>
      {slides.length > 1 && (
        <>
          <div className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1.5">
            {slides.map((_, i) => (
              <button key={i} type="button" onClick={() => go(i)} aria-label={`Banner ${i + 1}`}
                className={cn('h-1.5 rounded-full transition-all', i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/60')} />
            ))}
          </div>
          <button type="button" onClick={() => go(index - 1)} aria-label="Previous banner" className="absolute left-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-zinc-900 shadow sm:flex"><ChevronLeft className="h-5 w-5" /></button>
          <button type="button" onClick={() => go(index + 1)} aria-label="Next banner" className="absolute right-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-zinc-900 shadow sm:flex"><ChevronRight className="h-5 w-5" /></button>
        </>
      )}
    </div>
  );
}

export function useStoreCategories(products: Product[]) {
  const { store } = useStore();
  return useMemo(() => {
    const tiles = (store?.theme.sections ?? [])
      .filter(x => x.type === 'categories' && !x.hidden)
      .flatMap(x => (Array.isArray(x.settings.items) ? (x.settings.items as ListItem[]) : []))
      .filter(t => t.name);
    const map = new Map<string, string>(tiles.map(t => [t.name, t.imageUrl ?? '']));
    for (const p of products) if (p.category && !map.has(p.category)) map.set(p.category, p.image_url);
    for (const [k, v] of map) if (!v) map.set(k, products.find(p => p.category === k)?.image_url ?? '');
    return [...map.entries()].map(([name, image]) => ({ name, image }));
  }, [store?.theme.sections, products]);
}

export default function MarketplaceHome() {
  const { store, preview } = useStore();
  const { data: realProducts = [], isLoading } = useStoreProducts();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const href = useStoreHref();
  const wa = useWhatsAppLink(store ? `Hello ${store.name}, what do you have today?` : undefined);
  const q = (params.get('q') ?? '').trim().toLowerCase();
  const category = params.get('c') ?? '';

  // Editor-only samples for empty stores (live visitors never see them).
  const samples = useMemo<Product[]>(() => {
    const preset = store?.theme.industry ? INDUSTRIES[store.theme.industry] : null;
    return (preset?.samples ?? []).map((p, i) => ({
      id: `sample-${i}`, name: p.name, description: '', price: String(p.price), stock_quantity: 10, in_stock: true,
      category: p.category, image_url: p.imageUrl, images: [],
    }));
  }, [store?.theme.industry]);
  const showingSamples = preview && !isLoading && realProducts.length === 0;
  const products = showingSamples ? samples : realProducts;
  const categories = useStoreCategories(products);

  if (!store) return null;
  const sections = store.theme.sections.filter(x => !x.hidden);
  const find = (t: Section['type']) => sections.find(x => x.type === t);

  const slides: Slide[] = sections
    .filter(x => x.type === 'hero' || x.type === 'image_text')
    .map(x => ({
      image: s(x.settings.imageUrl) || store.bannerUrl,
      title: s(x.settings.heading),
      text: s(x.settings.subheading) || s(x.settings.body),
      button: s(x.settings.buttonText),
      link: s(x.settings.buttonLink) || '#products',
    }))
    .filter(sl => sl.image && sl.title);

  const trust = (find('features')?.settings.items as ListItem[] | undefined) ?? [];
  const grid = find('featured_products');
  const gridTitle = s(grid?.settings.title) || 'Just for you';

  const topPicks = [...products]
    .filter(p => p.in_stock)
    .sort((a, b) => Number(!!b.is_hot_pick || !!b.is_best_seller) - Number(!!a.is_hot_pick || !!a.is_best_seller) || (b.sales_count ?? 0) - (a.sales_count ?? 0))
    .slice(0, 10);

  const filtered = products.filter(p => (!category || p.category === category) && (!q || `${p.name} ${p.category}`.toLowerCase().includes(q)));
  const setCategory = (c: string) => {
    const next = new URLSearchParams(params);
    if (c) next.set('c', c); else next.delete('c');
    next.delete('q');
    setParams(next, { replace: true });
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const browsing = !!q || !!category;

  return (
    <div className={cn(container, 'space-y-5 py-4 sm:space-y-8 sm:py-6')}>
      {!browsing && <BannerCarousel slides={slides} />}

      {!browsing && trust.length > 0 && (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {trust.slice(0, 4).map((t, i) => {
            const Icon = FEATURE_ICON_COMPONENTS[t.icon] ?? FEATURE_ICON_COMPONENTS.star;
            return (
              <span key={i} className="flex shrink-0 items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-medium shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                <Icon className="h-3.5 w-3.5 text-brand" /> {t.title}
              </span>
            );
          })}
        </div>
      )}

      {categories.length > 0 && (
        <section aria-label="Categories" className="rounded-xl bg-card p-3 sm:p-5">
          <div className="flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none] sm:gap-6 [&::-webkit-scrollbar]:hidden">
            {[{ name: 'All', image: '' }, ...categories].map(c => {
              const active = (c.name === 'All' && !category) || c.name === category;
              return (
                <button key={c.name} type="button" onClick={() => setCategory(c.name === 'All' ? '' : c.name)}
                  className="flex w-[68px] shrink-0 flex-col items-center gap-1.5 sm:w-20">
                  <span className={cn('flex h-[60px] w-[60px] items-center justify-center overflow-hidden rounded-full bg-muted ring-2 ring-offset-2 ring-offset-card transition sm:h-[72px] sm:w-[72px]',
                    active ? 'ring-brand' : 'ring-transparent')}>
                    {c.image ? <Img src={c.image} alt="" /> : <Package className="h-6 w-6 text-brand" />}
                  </span>
                  <span className={cn('line-clamp-2 text-center text-[11px] leading-tight sm:text-xs', active ? 'font-semibold text-brand' : 'text-foreground')}>{c.name}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {!browsing && topPicks.length >= 3 && (
        <section aria-label="Top picks" className="rounded-xl bg-card p-3 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-heading text-base font-bold sm:text-lg">Top picks</h2>
            <button type="button" onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })} className="text-xs font-medium text-brand">See all</button>
          </div>
          <div className="-mx-3 flex gap-2.5 overflow-x-auto px-3 pb-1 [scrollbar-width:none] sm:-mx-5 sm:px-5 [&::-webkit-scrollbar]:hidden">
            {topPicks.map(p => <div key={p.id} className="w-[136px] shrink-0 sm:w-[170px]"><MarketCard product={p} compact sample={showingSamples} /></div>)}
          </div>
        </section>
      )}

      <section id="products" aria-label={gridTitle} className="scroll-mt-20">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="font-heading text-lg font-bold sm:text-2xl">
            {q ? `Results for “${params.get('q')}”` : category || gridTitle}
          </h2>
          {browsing && <button type="button" onClick={() => navigate(href('/'))} className="shrink-0 text-sm font-medium text-brand">Clear</button>}
        </div>

        {showingSamples && (
          <p className="mb-3 rounded-lg border border-dashed border-border bg-card px-3 py-2.5 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Sample products</span> — only you can see these. Add your own products and they replace these.
          </p>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-lg" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl bg-card px-6 py-14 text-center">
            {products.length ? <SearchX className="mx-auto h-8 w-8 text-muted-foreground" /> : <Package className="mx-auto h-8 w-8 text-muted-foreground" />}
            <p className="mt-3 font-semibold">{products.length ? 'Nothing found' : 'New products are on the way'}</p>
            <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
              {products.length ? 'Try another word, or ask us on WhatsApp — we may have it.' : 'Message us on WhatsApp to ask what is available today.'}
            </p>
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-[#25D366] px-5 text-sm font-semibold text-white">
                <WhatsAppIcon className="h-[18px] w-[18px]" /> Ask on WhatsApp
              </a>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
            {filtered.map(p => <MarketCard key={p.id} product={p} sample={showingSamples} />)}
          </div>
        )}
      </section>
    </div>
  );
}
