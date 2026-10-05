import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ImageIcon, MessageCircle, Package, Quote, Search } from 'lucide-react';
import { safeHref, type ListItem, type Section, type SettingValue } from '@cp/shared';
import { EmptyState, Input, Skeleton, cn } from '@cp/ui';
import { useStore, useStoreProducts } from '../store';
import { ProductCard } from '../components/ProductCard';
import { FEATURE_ICON_COMPONENTS } from './icons';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const str = (v: SettingValue | undefined) => (typeof v === 'string' ? v : v == null ? '' : String(v));
const list = (v: SettingValue | undefined) => (Array.isArray(v) ? (v as ListItem[]) : []);

/** Theme-aware button (brand colour + the store's corner style). */
export function ThemeButton({ href, children, variant = 'solid', className }: {
  href?: string; children: ReactNode; variant?: 'solid' | 'outline' | 'light'; className?: string;
}) {
  const cls = cn(
    'inline-flex h-11 items-center justify-center gap-2 px-6 text-sm font-semibold transition-opacity hover:opacity-90 rounded-[var(--btn-radius)]',
    variant === 'solid' && 'bg-brand text-brand-foreground',
    variant === 'outline' && 'border border-foreground/20 text-foreground hover:bg-foreground/5',
    variant === 'light' && 'bg-white text-zinc-900',
    className,
  );
  const safe = safeHref(href);
  if (!safe) return <span className={cls}>{children}</span>;
  if (safe.startsWith('/')) return <Link to={safe} className={cls}>{children}</Link>;
  const external = /^https?:/.test(safe);
  return <a href={safe} className={cls} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{children}</a>;
}

function Heading({ children, className, as: Tag = 'h2' }: { children: ReactNode; className?: string; as?: 'h1' | 'h2' | 'h3' }) {
  return <Tag className={cn('font-heading font-semibold tracking-tight', className)}>{children}</Tag>;
}

function Img({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return src
    ? <img src={src} alt={alt} loading="lazy" className={cn('h-full w-full object-cover', className)} />
    : <div className={cn('flex h-full w-full items-center justify-center bg-muted', className)}><ImageIcon className="h-8 w-8 text-muted-foreground/40" /></div>;
}

const container = 'mx-auto max-w-6xl px-4 sm:px-6';

// ─── Sections ─────────────────────────────────────────────────────────────────

function Announcement({ s }: { s: Section['settings'] }) {
  const href = safeHref(s.link);
  const text = str(s.text);
  if (!text) return null;
  const inner = <p className="px-4 py-2 text-center text-xs font-medium sm:text-sm">{text}</p>;
  return (
    <div className="bg-brand text-brand-foreground">
      {href ? <a href={href} className="block hover:underline">{inner}</a> : inner}
    </div>
  );
}

function Hero({ s }: { s: Section['settings'] }) {
  const { store } = useStore();
  const layout = str(s.layout) || 'overlay';
  const image = str(s.imageUrl) || store?.bannerUrl || '';
  const height = { sm: 'py-12 sm:py-16', md: 'py-16 sm:py-24', lg: 'py-24 sm:py-36' }[str(s.height) || 'md'];
  const content = (light: boolean) => (
    <>
      <Heading as="h1" className="text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">{str(s.heading)}</Heading>
      {str(s.subheading) && <p className={cn('mt-4 max-w-xl text-base sm:text-lg', light ? 'text-white/85' : 'text-muted-foreground')}>{str(s.subheading)}</p>}
      {str(s.buttonText) && <div className="mt-8"><ThemeButton href={str(s.buttonLink)} variant={light ? 'light' : 'solid'}>{str(s.buttonText)}</ThemeButton></div>}
    </>
  );

  if (layout === 'split') {
    return (
      <section className={cn(container, 'grid items-center gap-10 md:grid-cols-2', height)}>
        <div>{content(false)}</div>
        <div className="aspect-[4/3] overflow-hidden rounded-[var(--card-radius)]"><Img src={image} alt="" /></div>
      </section>
    );
  }
  if (layout === 'center' || !image) {
    return (
      <section className={cn('border-b border-border/60', height)}>
        <div className={cn(container, 'flex flex-col items-center text-center [&_p]:mx-auto')}>{content(false)}</div>
      </section>
    );
  }
  return (
    <section className="relative isolate overflow-hidden">
      <img src={image} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/70 via-black/45 to-black/10" />
      <div className={cn(container, 'text-white', height)}>{content(true)}</div>
    </section>
  );
}

function FeaturedProducts({ s }: { s: Section['settings'] }) {
  const { data: products = [], isLoading } = useStoreProducts();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(str(s.category));
  const showSearch = s.showSearch !== false;
  const limit = Number(s.limit) || 12;
  const cols = { '2': 'lg:grid-cols-2', '3': 'lg:grid-cols-3', '4': 'lg:grid-cols-4' }[str(s.columns) || '4'];

  const categories = useMemo(() => [...new Set(products.map(p => p.category).filter(Boolean))].sort(), [products]);
  const fixedCategory = str(s.category);
  const visible = products
    .filter(p => (!category || p.category === category) && (!query || p.name.toLowerCase().includes(query.toLowerCase())))
    .slice(0, query || category !== fixedCategory ? 200 : limit);

  return (
    <section id="products" className={cn(container, 'scroll-mt-20 py-14 sm:py-20')}>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {str(s.title) && <Heading className="text-2xl sm:text-3xl">{str(s.title)}</Heading>}
          {str(s.subtitle) && <p className="mt-2 text-muted-foreground">{str(s.subtitle)}</p>}
        </div>
        {showSearch && (
          <div className="relative sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search products" value={query} onChange={e => setQuery(e.target.value)} aria-label="Search products" />
          </div>
        )}
      </div>
      {showSearch && !fixedCategory && categories.length > 1 && (
        <div className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" role="tablist" aria-label="Categories">
          {['', ...categories].map(c => (
            <button key={c || 'all'} role="tab" aria-selected={category === c} onClick={() => setCategory(c)}
              className={cn('whitespace-nowrap rounded-[var(--btn-radius)] border px-3.5 py-1.5 text-sm transition-colors',
                category === c ? 'border-brand bg-brand text-brand-foreground' : 'border-border text-muted-foreground hover:text-foreground')}>
              {c || 'All'}
            </button>
          ))}
        </div>
      )}
      {isLoading ? (
        <div className={cn('grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3', cols)}>
          {Array.from({ length: 4 }).map((_, i) => <div key={i}><Skeleton className="aspect-square rounded-[var(--card-radius)]" /><Skeleton className="mt-3 h-4 w-3/4" /></div>)}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState icon={<Package className="h-5 w-5" />} title={products.length ? 'No products match' : 'Products coming soon'}
          description={products.length ? 'Try a different search or category.' : 'Add products in your admin and they will appear here.'} />
      ) : (
        <div className={cn('grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3', cols)}>
          {visible.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </section>
  );
}

function Categories({ s }: { s: Section['settings'] }) {
  const { data: products = [] } = useStoreProducts();
  const cats = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products) if (p.category && !map.has(p.category)) map.set(p.category, p.image_url);
    return [...map.entries()];
  }, [products]);
  if (!cats.length) return null;
  return (
    <section className={cn(container, 'py-14 sm:py-20')}>
      {str(s.title) && <Heading className="mb-8 text-2xl sm:text-3xl">{str(s.title)}</Heading>}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {cats.slice(0, 8).map(([name, img]) => (
          <a key={name} href="#products" className="group relative aspect-[4/3] overflow-hidden rounded-[var(--card-radius)]">
            <Img src={img} alt="" className="transition-transform duration-300 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <span className="absolute bottom-3 left-3 text-sm font-semibold text-white">{name}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

function ImageText({ s }: { s: Section['settings'] }) {
  const right = str(s.imagePosition) === 'right';
  return (
    <section className={cn(container, 'grid items-center gap-10 py-14 sm:py-20 md:grid-cols-2')}>
      <div className={cn('aspect-[4/3] overflow-hidden rounded-[var(--card-radius)]', right && 'md:order-2')}><Img src={str(s.imageUrl)} alt="" /></div>
      <div>
        <Heading className="text-2xl sm:text-3xl">{str(s.heading)}</Heading>
        <p className="mt-4 whitespace-pre-line leading-relaxed text-muted-foreground">{str(s.body)}</p>
        {str(s.buttonText) && <div className="mt-6"><ThemeButton href={str(s.buttonLink)} variant="outline">{str(s.buttonText)}</ThemeButton></div>}
      </div>
    </section>
  );
}

function Features({ s }: { s: Section['settings'] }) {
  const items = list(s.items);
  return (
    <section className="border-y border-border/60 bg-muted/40">
      <div className={cn(container, 'py-12 sm:py-16')}>
        {str(s.title) && <Heading className="mb-8 text-center text-2xl sm:text-3xl">{str(s.title)}</Heading>}
        <div className={cn('grid gap-8 sm:grid-cols-2', items.length >= 3 && 'lg:grid-cols-3', items.length >= 4 && 'lg:grid-cols-4')}>
          {items.map((item, i) => {
            const Icon = FEATURE_ICON_COMPONENTS[item.icon] ?? FEATURE_ICON_COMPONENTS.star;
            return (
              <div key={i} className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--btn-radius)] bg-brand/10 text-brand"><Icon className="h-5 w-5" /></div>
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Testimonials({ s }: { s: Section['settings'] }) {
  const items = list(s.items);
  return (
    <section className={cn(container, 'py-14 sm:py-20')}>
      {str(s.title) && <Heading className="mb-10 text-center text-2xl sm:text-3xl">{str(s.title)}</Heading>}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((t, i) => (
          <figure key={i} className="rounded-[var(--card-radius)] border border-border/70 bg-card p-6">
            <Quote className="h-5 w-5 text-brand" />
            <blockquote className="mt-3 leading-relaxed">“{t.quote}”</blockquote>
            <figcaption className="mt-4 text-sm"><span className="font-semibold">{t.author}</span>{t.role && <span className="text-muted-foreground"> · {t.role}</span>}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function Gallery({ s }: { s: Section['settings'] }) {
  const images = list(s.images);
  return (
    <section className={cn(container, 'py-14 sm:py-20')}>
      {str(s.title) && <Heading className="mb-8 text-2xl sm:text-3xl">{str(s.title)}</Heading>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((img, i) => (
          <figure key={i} className="overflow-hidden rounded-[var(--card-radius)]">
            <div className="aspect-square"><Img src={img.imageUrl} alt={img.caption || ''} /></div>
            {img.caption && <figcaption className="mt-2 text-sm text-muted-foreground">{img.caption}</figcaption>}
          </figure>
        ))}
      </div>
    </section>
  );
}

function RichText({ s }: { s: Section['settings'] }) {
  const center = str(s.align) !== 'left';
  return (
    <section className={cn(container, 'py-14 sm:py-20')}>
      <div className={cn('max-w-2xl', center && 'mx-auto text-center')}>
        {str(s.heading) && <Heading className="text-2xl sm:text-3xl">{str(s.heading)}</Heading>}
        {str(s.body) && <p className="mt-4 whitespace-pre-line leading-relaxed text-muted-foreground">{str(s.body)}</p>}
      </div>
    </section>
  );
}

function WhatsAppCta({ s }: { s: Section['settings'] }) {
  const { store } = useStore();
  const wa = store?.whatsapp.replace(/\D/g, '') ?? '';
  return (
    <section className={cn(container, 'py-14 sm:py-20')}>
      <div className="flex flex-col items-start gap-6 rounded-[var(--card-radius)] bg-brand px-6 py-10 text-brand-foreground sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <div className="max-w-xl">
          <Heading className="text-2xl">{str(s.heading)}</Heading>
          {str(s.text) && <p className="mt-2 opacity-85">{str(s.text)}</p>}
        </div>
        {wa ? (
          <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer"
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-[var(--btn-radius)] bg-brand-foreground px-6 text-sm font-semibold text-brand transition-opacity hover:opacity-90">
            <MessageCircle className="h-4 w-4" /> {str(s.buttonText) || 'Message us'}
          </a>
        ) : (
          <span className="text-sm opacity-75">Add a WhatsApp number in Settings to show the button.</span>
        )}
      </div>
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
