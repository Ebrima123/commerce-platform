import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Package, SearchX } from 'lucide-react';
import { INDUSTRIES, type ListItem, type Product, type Section } from '@cp/shared';
import { Skeleton, cn } from '@cp/ui';
import { useStore, useStoreProducts } from '../store';
import { container, Img, ThemeButton, useStoreHref, useWhatsAppLink, WhatsAppIcon } from '../components/primitives';
import { MarketCard } from '../components/marketplace/MarketCard';
import { FEATURE_ICON_COMPONENTS } from '../sections/icons';
import { SectionRender } from '../sections/Sections';
import { SectionFrame } from '../sections/EditorFrame';

const s = (v: unknown) => (typeof v === 'string' ? v : '');

interface Slide { id: string; image: string; title: string; text: string; textKey: string; button: string; link: string }

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
          <div key={sl.id} data-edit-id={sl.id} className="relative aspect-[16/9] w-full shrink-0 snap-center overflow-hidden sm:aspect-[21/8]">
            <Img src={sl.image} alt="" eager={i === 0} />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
            <div className="absolute inset-y-0 left-0 flex max-w-[78%] flex-col justify-center p-5 text-white sm:max-w-[55%] sm:p-10">
              <p data-field="heading" className="font-heading text-xl font-bold leading-tight sm:text-4xl">{sl.title}</p>
              {sl.text && <p data-field={sl.textKey} data-multiline="true" className="mt-1.5 line-clamp-2 text-[13px] text-white/85 sm:mt-3 sm:text-base">{sl.text}</p>}
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

/**
 * Marketplace home (SHEIN / Temu / Alfudi-like). The page follows the theme's
 * sections in order — banners, trust chips, category circles and the product
 * grid get the marketplace look; any other section renders as usual — so the
 * merchant can rearrange everything in the editor.
 */
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
  const gridSection = sections.find(x => x.type === 'featured_products');
  const gridTitle = s(gridSection?.settings.title) || 'Just for you';

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

  // ── Marketplace building blocks ──
  const categoryStrip = categories.length > 0 && (
    <div className={container}>
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
    </div>
  );

  const picks = !browsing && topPicks.length >= 3 && (
    <div className={container}>
      <section aria-label="Top picks" className="rounded-xl bg-card p-3 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-base font-bold sm:text-lg">Top picks</h2>
          <button type="button" onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })} className="text-xs font-medium text-brand">See all</button>
        </div>
        <div className="-mx-3 flex gap-2.5 overflow-x-auto px-3 pb-1 [scrollbar-width:none] sm:-mx-5 sm:px-5 [&::-webkit-scrollbar]:hidden">
          {topPicks.map(p => <div key={p.id} className="w-[136px] shrink-0 sm:w-[170px]"><MarketCard product={p} compact sample={showingSamples} /></div>)}
        </div>
      </section>
    </div>
  );

  const grid = (
    <div className={container}>
      <section id="products" aria-label={gridTitle} className="scroll-mt-20">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 data-field={browsing ? undefined : 'title'} className="font-heading text-lg font-bold sm:text-2xl">
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

  const page = 'space-y-5 py-4 sm:space-y-8 sm:py-6';

  // Searching or filtering: just the categories and the results.
  if (browsing) return <div className={page}>{categoryStrip}{grid}</div>;

  const blocks: ReactNode[] = [];
  let hasCategories = false;
  let hasGrid = false;

  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i];
    if (sec.type === 'announcement') continue; // drawn by the shell

    if (sec.type === 'hero' || sec.type === 'image_text') {
      // Consecutive banners become one swipeable carousel.
      const run: Section[] = [sec];
      while (sections[i + 1] && (sections[i + 1].type === 'hero' || sections[i + 1].type === 'image_text')) run.push(sections[++i]);
      const slides = run.map(x => ({
        id: x.id,
        image: s(x.settings.imageUrl) || store.bannerUrl,
        title: s(x.settings.heading),
        text: s(x.settings.subheading) || s(x.settings.body),
        textKey: x.type === 'hero' ? 'subheading' : 'body',
        button: s(x.settings.buttonText),
        link: s(x.settings.buttonLink) || '#products',
      })).filter(sl => sl.image && sl.title);
      if (!slides.length) continue;
      blocks.push(
        <SectionFrame key={sec.id} section={sec} label={run.length > 1 ? `Banners (${run.length})` : 'Banner'}>
          <div className={container}><BannerCarousel slides={slides} /></div>
        </SectionFrame>,
      );
      continue;
    }

    if (sec.type === 'features') {
      const trust = (sec.settings.items as ListItem[] | undefined) ?? [];
      if (!trust.length) continue;
      blocks.push(
        <SectionFrame key={sec.id} section={sec} label="Trust badges">
          <div className={cn(container, 'flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden')}>
            {trust.slice(0, 4).map((t, n) => {
              const Icon = FEATURE_ICON_COMPONENTS[t.icon] ?? FEATURE_ICON_COMPONENTS.star;
              return (
                <span key={n} className="flex shrink-0 items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-medium shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                  <Icon className="h-3.5 w-3.5 text-brand" /> {t.title}
                </span>
              );
            })}
          </div>
        </SectionFrame>,
      );
      continue;
    }

    if (sec.type === 'categories') {
      if (hasCategories || !categoryStrip) continue;
      hasCategories = true;
      blocks.push(<SectionFrame key={sec.id} section={sec} label="Category circles">{categoryStrip}</SectionFrame>);
      continue;
    }

    if (sec.type === 'featured_products') {
      if (hasGrid) continue;
      hasGrid = true;
      blocks.push(<SectionFrame key={sec.id} section={sec} label="Products"><div className="space-y-5 sm:space-y-8">{picks}{grid}</div></SectionFrame>);
      continue;
    }

    blocks.push(<SectionFrame key={sec.id} section={sec}><SectionRender section={sec} /></SectionFrame>);
  }

  // Category circles and the product grid are what a marketplace is for, so
  // they always appear (after the first banner / at the end) if not placed.
  if (!hasCategories && categoryStrip) blocks.splice(Math.min(1, blocks.length), 0, <div key="auto-categories">{categoryStrip}</div>);
  if (!hasGrid) blocks.push(<div key="auto-grid" className="space-y-5 sm:space-y-8">{picks}{grid}</div>);

  return <div className={page}>{blocks}</div>;
}
