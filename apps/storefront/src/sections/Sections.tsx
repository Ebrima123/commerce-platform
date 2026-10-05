import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Package, Quote, Search, X } from 'lucide-react';
import { INDUSTRIES, type ListItem, type Product, type Section, type SettingValue } from '@cp/shared';
import { EmptyState, Skeleton, cn } from '@cp/ui';
import { useStore, useStoreProducts } from '../store';
import { ProductCard } from '../components/ProductCard';
import {
  container, Eyebrow, Img, Reveal, SectionHeading, ThemeButton, ViewAllLink, WhatsAppIcon,
  useResolveHref, useWhatsAppLink,
} from '../components/primitives';
import { FEATURE_ICON_COMPONENTS } from './icons';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const str = (v: SettingValue | undefined) => (typeof v === 'string' ? v : v == null ? '' : String(v));
const list = (v: SettingValue | undefined) => (Array.isArray(v) ? (v as ListItem[]) : []);

/** Category tiles / "View all" → product grid: filter by name and scroll to it. */
const CATEGORY_EVENT = 'cp:category';
export function showCategory(name: string) {
  window.dispatchEvent(new CustomEvent(CATEGORY_EVENT, { detail: name }));
  document.getElementById('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const sectionY = 'py-14 sm:py-24';

// ─── Announcement ─────────────────────────────────────────────────────────────

function Announcement({ s }: { s: Section['settings'] }) {
  const href = useResolveHref()(s.link);
  const text = str(s.text);
  if (!text) return null;
  const inner = <p className="px-4 py-2.5 text-center text-[12px] font-medium tracking-wide sm:text-[13px]">{text}</p>;
  return (
    <div className="bg-brand text-brand-foreground">
      {!href ? inner
        : href.startsWith('/') ? <Link to={href} className="block hover:underline">{inner}</Link>
        : <a href={href} className="block hover:underline" {...(/^https?:/.test(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{inner}</a>}
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero({ s }: { s: Section['settings'] }) {
  const { store } = useStore();
  const wa = useWhatsAppLink(`Hello ${store?.name ?? ''}, I'd like to order.`);
  const layout = str(s.layout) || 'overlay';
  const image = str(s.imageUrl) || store?.bannerUrl || '';
  const size = str(s.height) || 'md';
  const showWa = s.showWhatsapp !== false && !!wa;
  const eyebrow = str(s.eyebrow);

  const buttons = (light: boolean) => (
    <div className="mt-8 flex flex-wrap gap-3">
      {str(s.buttonText) && <ThemeButton href={str(s.buttonLink)} variant={light ? 'light' : 'solid'}>{str(s.buttonText)}</ThemeButton>}
      {showWa && (
        <ThemeButton href={wa} variant={light ? 'ghost-light' : 'outline'}>
          <WhatsAppIcon className="h-[18px] w-[18px]" /> Order on WhatsApp
        </ThemeButton>
      )}
    </div>
  );

  const text = (light: boolean, center = false) => (
    <div className={cn(center && 'mx-auto flex max-w-3xl flex-col items-center text-center')}>
      {eyebrow && <Eyebrow className={cn('mb-4', light && 'text-white/80')}>{eyebrow}</Eyebrow>}
      <h1 className={cn('font-heading text-[2.6rem] font-semibold leading-[1.04] tracking-tight text-balance sm:text-6xl lg:text-7xl', light && 'text-white')}>
        {str(s.heading)}
      </h1>
      {str(s.subheading) && (
        <p className={cn('mt-5 max-w-xl text-[17px] leading-relaxed text-pretty sm:text-lg', light ? 'text-white/85' : 'text-muted-foreground', center && 'mx-auto')}>
          {str(s.subheading)}
        </p>
      )}
      <div className={cn(center && 'flex justify-center')}>{buttons(light)}</div>
    </div>
  );

  if (layout === 'split') {
    return (
      <section className={cn(container, 'grid items-center gap-8 pb-14 pt-5 md:grid-cols-[1.05fr_1fr] md:gap-14', size === 'lg' ? 'md:py-20' : 'md:py-14')}>
        <div className="order-2 md:order-1">{text(false)}</div>
        <div className="relative order-1 md:order-2">
          <div className="absolute -bottom-3 -right-3 hidden h-full w-full rounded-[var(--card-radius)] bg-brand/15 md:block" aria-hidden />
          <div className="relative aspect-square overflow-hidden rounded-[var(--card-radius)] sm:aspect-[4/5] md:aspect-[4/5]">
            <Img src={image} alt="" eager zoom />
          </div>
        </div>
      </section>
    );
  }

  if (layout === 'center' || !image) {
    const pad = { sm: 'py-14 sm:py-20', md: 'py-16 sm:py-28', lg: 'py-20 sm:py-36' }[size] ?? 'py-16 sm:py-28';
    return (
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,hsl(var(--brand)/0.10),transparent_70%)]" aria-hidden />
        <div className={cn(container, pad)}>{text(false, true)}</div>
      </section>
    );
  }

  const minH = { sm: 'min-h-[420px] sm:min-h-[480px]', md: 'min-h-[520px] sm:min-h-[600px]', lg: 'min-h-[600px] sm:min-h-[720px]' }[size] ?? 'min-h-[520px]';
  return (
    <section className={cn('relative isolate flex items-end overflow-hidden', minH)}>
      <div className="absolute inset-0 -z-10"><Img src={image} alt="" eager zoom /></div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/40 to-black/5 sm:bg-gradient-to-r sm:from-black/75 sm:via-black/40 sm:to-transparent" />
      <div className={cn(container, 'pb-12 pt-24 sm:pb-20')}>
        <div className="max-w-2xl">{text(true)}</div>
      </div>
    </section>
  );
}

// ─── Trust strip / highlight cards ────────────────────────────────────────────

function Features({ s }: { s: Section['settings'] }) {
  const items = list(s.items);
  if (!items.length) return null;

  if (str(s.style) === 'strip') {
    return (
      <section className="border-y border-border/60 bg-card">
        <div className={cn(container, 'grid grid-cols-1 divide-y divide-border/60 sm:grid-cols-3 sm:divide-x sm:divide-y-0')}>
          {items.slice(0, 3).map((item, i) => {
            const Icon = FEATURE_ICON_COMPONENTS[item.icon] ?? FEATURE_ICON_COMPONENTS.star;
            return (
              <div key={i} className="flex items-center gap-3.5 py-4 sm:justify-center sm:px-4 sm:py-6">
                <Icon className="h-6 w-6 shrink-0 text-brand" strokeWidth={1.6} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight">{item.title}</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{item.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className={cn(container, sectionY)}>
      <Reveal>
        <SectionHeading title={str(s.title)} align="center" />
        <div className={cn('grid gap-4 sm:grid-cols-2', items.length >= 3 && 'lg:grid-cols-3', items.length >= 4 && 'lg:grid-cols-4')}>
          {items.map((item, i) => {
            const Icon = FEATURE_ICON_COMPONENTS[item.icon] ?? FEATURE_ICON_COMPONENTS.star;
            return (
              <div key={i} className="rounded-[var(--card-radius)] border border-border/70 bg-card p-6 transition-shadow hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand"><Icon className="h-[22px] w-[22px]" strokeWidth={1.7} /></div>
                <p className="mt-5 text-base font-semibold">{item.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
              </div>
            );
          })}
        </div>
      </Reveal>
    </section>
  );
}

// ─── Products ─────────────────────────────────────────────────────────────────

function FeaturedProducts({ s }: { s: Section['settings'] }) {
  const { store, preview } = useStore();
  const { data: realProducts = [], isLoading } = useStoreProducts();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(str(s.category));
  const [expanded, setExpanded] = useState(false);
  const showSearch = s.showSearch !== false;
  const limit = Number(s.limit) || 12;
  const cols = { '2': 'lg:grid-cols-2', '3': 'lg:grid-cols-3', '4': 'lg:grid-cols-4' }[str(s.columns) || '4'];
  const ratio = (['square', 'portrait', 'landscape'] as const).find(r => r === str(s.imageRatio)) ?? 'square';

  // In the editor, an empty store shows its industry's sample products so the
  // merchant sees the finished look. Live visitors never see samples.
  const samples = useMemo<Product[]>(() => {
    const preset = store?.theme.industry ? INDUSTRIES[store.theme.industry] : null;
    return (preset?.samples ?? []).map((p, i) => ({
      id: `sample-${i}`, name: p.name, description: '', price: String(p.price), stock_quantity: 10, in_stock: true,
      category: p.category, image_url: p.imageUrl, images: [],
    }));
  }, [store?.theme.industry]);
  const showingSamples = preview && !isLoading && realProducts.length === 0 && samples.length > 0;
  const products = showingSamples ? samples : realProducts;

  const categories = useMemo(() => [...new Set(products.map(p => p.category).filter(Boolean))].sort(), [products]);

  useEffect(() => {
    const onCategory = (e: Event) => {
      const name = String((e as CustomEvent).detail ?? '');
      setCategory(categories.find(c => c.toLowerCase() === name.toLowerCase()) ?? '');
      setQuery('');
      setExpanded(true);
    };
    window.addEventListener(CATEGORY_EVENT, onCategory);
    return () => window.removeEventListener(CATEGORY_EVENT, onCategory);
  }, [categories]);

  const fixedCategory = str(s.category);
  const filtered = products.filter(p =>
    (!category || p.category === category) && (!query || p.name.toLowerCase().includes(query.toLowerCase())));
  const browsing = !!query || category !== fixedCategory || expanded;
  const visible = filtered.slice(0, browsing ? 200 : limit);
  const hasMore = !browsing && filtered.length > limit;

  return (
    <section id="products" className={cn(container, sectionY, 'scroll-mt-16')}>
      <SectionHeading eyebrow={str(s.eyebrow)} title={str(s.title)} subtitle={str(s.subtitle)}
        action={hasMore ? <ViewAllLink onClick={() => setExpanded(true)}>View all {filtered.length}</ViewAllLink> : undefined} />

      {showSearch && (products.length > 4 || categories.length > 1) && (
        <div className="mb-8 space-y-4">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products" aria-label="Search products"
              className="h-12 w-full rounded-[var(--btn-radius)] border border-border bg-card pl-11 pr-10 text-[15px] placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none focus:ring-2 focus:ring-brand/20" />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label="Clear search"
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
            )}
          </div>
          {!fixedCategory && categories.length > 1 && (
            <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="tablist" aria-label="Categories">
              {['', ...categories].map(c => (
                <button key={c || 'all'} type="button" role="tab" aria-selected={category === c} onClick={() => setCategory(c)}
                  className={cn('h-10 shrink-0 whitespace-nowrap rounded-full border px-4 text-sm font-medium transition-colors',
                    category === c ? 'border-foreground bg-foreground text-background' : 'border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground')}>
                  {c || 'All'}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {showingSamples && (
        <p className="mb-8 rounded-[var(--card-radius)] border border-dashed border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Sample products</span> — only you can see these. Add your own products in the admin and they replace these on your live store.
        </p>
      )}

      {isLoading ? (
        <div className={cn('grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6', cols)}>
          {Array.from({ length: 4 }).map((_, i) => <div key={i}><Skeleton className="aspect-square rounded-[var(--card-radius)]" /><Skeleton className="mt-4 h-4 w-3/4" /><Skeleton className="mt-2 h-4 w-1/3" /></div>)}
        </div>
      ) : visible.length === 0 ? (
        products.length ? (
          <EmptyState icon={<Search className="h-5 w-5" />} title="No products match" description="Try a different search or category." />
        ) : (
          <div className="rounded-[var(--card-radius)] border border-dashed border-border px-6 py-16 text-center">
            <Package className="mx-auto h-8 w-8 text-muted-foreground/60" strokeWidth={1.5} />
            <p className="mt-4 font-heading text-xl font-semibold">New products are on the way</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">We're adding our collection right now. Message us on WhatsApp to ask what's available today.</p>
          </div>
        )
      ) : (
        <div className={cn('grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6', cols)}>
          {visible.map((p, i) => (
            <Reveal key={p.id} delay={Math.min(i, 7) * 50}>
              <ProductCard product={p} ratio={ratio} sample={showingSamples} />
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Category tiles ───────────────────────────────────────────────────────────

function Categories({ s }: { s: Section['settings'] }) {
  const { data: products = [] } = useStoreProducts();
  const cats = useMemo(() => {
    const tiles = list(s.items).filter(t => t.name?.trim());
    if (tiles.length) return tiles.map(t => [t.name, t.imageUrl ?? ''] as [string, string]);
    const map = new Map<string, string>();
    for (const p of products) if (p.category && !map.has(p.category)) map.set(p.category, p.image_url);
    return [...map.entries()];
  }, [products, s.items]);
  if (!cats.length) return null;
  const three = cats.length === 3;

  return (
    <section className={cn(container, sectionY)}>
      <Reveal>
        <SectionHeading eyebrow={str(s.eyebrow)} title={str(s.title)} />
        <div className={cn('grid grid-cols-2 gap-3 sm:gap-5', three ? 'sm:grid-cols-3' : 'sm:grid-cols-3 lg:grid-cols-4')}>
          {cats.slice(0, 8).map(([name, img], i) => (
            <button key={name} type="button" onClick={() => showCategory(name)}
              className={cn('group relative overflow-hidden rounded-[var(--card-radius)] text-left',
                'aspect-[3/4] sm:aspect-[4/5]', three && i === 0 && 'col-span-2 aspect-[16/10] sm:col-span-1 sm:aspect-[4/5]')}>
              <Img src={img} alt="" className="object-top transition-transform duration-700 ease-out group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4 sm:p-5">
                <span className="font-heading text-lg font-semibold leading-tight text-white sm:text-xl">{name}</span>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/90 text-zinc-900 transition-transform group-hover:translate-x-0.5">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

// ─── Image with text ──────────────────────────────────────────────────────────

function ImageText({ s }: { s: Section['settings'] }) {
  const right = str(s.imagePosition) === 'right';
  return (
    <section className={cn(container, sectionY)}>
      <Reveal className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
        <div className={cn('relative', right && 'md:order-2')}>
          <div className="aspect-[4/5] overflow-hidden rounded-[var(--card-radius)] sm:aspect-[5/4] md:aspect-[4/5]"><Img src={str(s.imageUrl)} alt="" /></div>
        </div>
        <div className={cn(right && 'md:order-1')}>
          {str(s.eyebrow) && <Eyebrow className="mb-3">{str(s.eyebrow)}</Eyebrow>}
          <h2 className="font-heading text-[1.75rem] font-semibold leading-tight tracking-tight text-balance sm:text-4xl">{str(s.heading)}</h2>
          <p className="mt-5 whitespace-pre-line text-[17px] leading-relaxed text-muted-foreground text-pretty">{str(s.body)}</p>
          {str(s.buttonText) && (
            <div className="mt-8">
              <ThemeButton href={str(s.buttonLink)} variant="outline">
                {str(s.buttonLink) === 'whatsapp' && <WhatsAppIcon className="h-[18px] w-[18px]" />}
                {str(s.buttonText)}
              </ThemeButton>
            </div>
          )}
        </div>
      </Reveal>
    </section>
  );
}

// ─── Testimonials, gallery, text ──────────────────────────────────────────────

function Testimonials({ s }: { s: Section['settings'] }) {
  const items = list(s.items);
  return (
    <section className="bg-muted/50">
      <div className={cn(container, sectionY)}>
        <Reveal>
          <SectionHeading title={str(s.title)} align="center" />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {items.map((t, i) => (
              <figure key={i} className="flex flex-col rounded-[var(--card-radius)] bg-card p-7 shadow-sm">
                <Quote className="h-6 w-6 text-brand" strokeWidth={1.6} />
                <blockquote className="mt-4 flex-1 font-heading text-lg leading-relaxed">“{t.quote}”</blockquote>
                <figcaption className="mt-6 flex items-center gap-3 text-sm">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 font-semibold text-brand">{(t.author || '?').charAt(0)}</span>
                  <span><span className="font-semibold">{t.author}</span>{t.role && <span className="block text-muted-foreground">{t.role}</span>}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Gallery({ s }: { s: Section['settings'] }) {
  const images = list(s.images);
  return (
    <section className={cn(container, sectionY)}>
      <Reveal>
        <SectionHeading title={str(s.title)} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {images.map((img, i) => (
            <figure key={i} className={cn('overflow-hidden rounded-[var(--card-radius)]', i === 0 && images.length >= 5 && 'col-span-2 row-span-2')}>
              <div className={cn('aspect-square', i === 0 && images.length >= 5 && 'h-full')}><Img src={img.imageUrl} alt={img.caption || ''} /></div>
              {img.caption && <figcaption className="mt-2 text-sm text-muted-foreground">{img.caption}</figcaption>}
            </figure>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

function RichText({ s }: { s: Section['settings'] }) {
  const center = str(s.align) !== 'left';
  return (
    <section className={cn(container, sectionY)}>
      <Reveal className={cn('max-w-2xl', center && 'mx-auto text-center')}>
        {str(s.heading) && <h2 className="font-heading text-[1.75rem] font-semibold leading-tight tracking-tight text-balance sm:text-4xl">{str(s.heading)}</h2>}
        {str(s.body) && <p className="mt-5 whitespace-pre-line text-[17px] leading-relaxed text-muted-foreground text-pretty">{str(s.body)}</p>}
      </Reveal>
    </section>
  );
}

// ─── WhatsApp call to action ──────────────────────────────────────────────────

function WhatsAppCta({ s }: { s: Section['settings'] }) {
  const { store } = useStore();
  const wa = useWhatsAppLink(`Hello ${store?.name ?? ''}!`);
  return (
    <section className={cn(container, 'pb-14 pt-4 sm:pb-24')}>
      <Reveal>
        <div className="relative overflow-hidden rounded-[var(--card-radius)] bg-brand px-6 py-12 text-brand-foreground sm:px-14 sm:py-16">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" aria-hidden />
          <div className="pointer-events-none absolute -bottom-24 right-24 h-56 w-56 rounded-full bg-white/5" aria-hidden />
          <div className="relative flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h2 className="font-heading text-[1.75rem] font-semibold leading-tight tracking-tight text-balance sm:text-4xl">{str(s.heading)}</h2>
              {str(s.text) && <p className="mt-3 text-[17px] leading-relaxed opacity-90 text-pretty">{str(s.text)}</p>}
            </div>
            {wa ? (
              <a href={wa} target="_blank" rel="noopener noreferrer"
                className="inline-flex h-14 shrink-0 items-center gap-2.5 rounded-[var(--btn-radius)] bg-brand-foreground px-8 text-base font-semibold text-brand shadow-lg transition-transform hover:-translate-y-0.5 active:scale-[0.98]">
                <WhatsAppIcon className="h-5 w-5" /> {str(s.buttonText) || 'Message us on WhatsApp'}
              </a>
            ) : (
              <span className="text-sm opacity-80">Add a WhatsApp number in Settings to show the button.</span>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

const RENDERERS: Record<Section['type'], (p: { s: Section['settings'] }) => ReactNode> = {
  announcement: Announcement, hero: Hero, featured_products: FeaturedProducts, categories: Categories,
  image_text: ImageText, features: Features, testimonials: Testimonials, gallery: Gallery,
  rich_text: RichText, whatsapp_cta: WhatsAppCta,
};

// ─── Page renderer (+ editor selection in preview) ────────────────────────────

export function SectionList({ sections }: { sections: Section[] }) {
  const { preview, highlightId, selectSection } = useStore();

  useEffect(() => {
    if (!preview || !highlightId) return;
    document.querySelector(`[data-section-id="${highlightId}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [preview, highlightId]);

  return (
    <>
      {sections.filter(s => !s.hidden).map(section => {
        const Render = RENDERERS[section.type];
        if (!Render) return null;
        if (!preview) return <Render key={section.id} s={section.settings} />;

        const onClickCapture = (e: MouseEvent) => {
          // In the editor, clicks select the section instead of navigating.
          e.preventDefault();
          e.stopPropagation();
          selectSection(section.id);
        };
        return (
          <div key={section.id} data-section-id={section.id} onClickCapture={onClickCapture}
            className={cn('relative cursor-pointer outline-offset-[-2px] transition-[outline-color]',
              highlightId === section.id ? 'outline outline-2 outline-blue-500' : 'hover:outline hover:outline-2 hover:outline-blue-500/40')}>
            <Render s={section.settings} />
          </div>
        );
      })}
    </>
  );
}
