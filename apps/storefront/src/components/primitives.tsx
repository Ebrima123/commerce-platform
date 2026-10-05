import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ImageIcon } from 'lucide-react';
import { safeHref } from '@cp/shared';
import { cn } from '@cp/ui';
import { useStore } from '../store';

export const container = 'mx-auto w-full max-w-6xl px-5 sm:px-8';

/** Store WhatsApp link ("" when the store has no number). */
export function useWhatsAppLink(message?: string) {
  const { store } = useStore();
  const wa = store?.whatsapp.replace(/\D/g, '') ?? '';
  if (!wa) return '';
  return `https://wa.me/${wa}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
}

/** Link targets from settings: "whatsapp" opens a chat with the store; everything else must be a safe URL. */
export function useResolveHref() {
  const wa = useWhatsAppLink();
  return (href: unknown) => (href === 'whatsapp' ? (wa || undefined) : safeHref(href));
}

/** Photo that fades in once loaded (no harsh pop-in on slow connections). */
export function Img({ src, alt, className, eager, zoom }: { src: string; alt: string; className?: string; eager?: boolean; zoom?: boolean }) {
  const [loaded, setLoaded] = useState(false);
  if (!src) {
    return <div className={cn('flex h-full w-full items-center justify-center bg-muted', className)}><ImageIcon className="h-8 w-8 text-muted-foreground/40" /></div>;
  }
  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={() => setLoaded(true)}
      ref={el => { if (el?.complete && el.naturalWidth) setLoaded(true); }}
      className={cn('img-fade h-full w-full object-cover', loaded && 'is-loaded', zoom && loaded && 'hero-zoom', className)}
    />
  );
}

/** Fades its content up the first time it scrolls into view. */
export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { setVisible(true); return; }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); io.disconnect(); }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={cn('reveal', visible && 'is-visible', className)} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </div>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('text-xs font-semibold uppercase tracking-[0.18em] text-brand', className)}>{children}</p>;
}

/** Consistent section header: small label, title, optional subtitle and "view all" link. */
export function SectionHeading({ eyebrow, title, subtitle, action, align = 'left', className }: {
  eyebrow?: string; title?: string; subtitle?: string; action?: ReactNode; align?: 'left' | 'center'; className?: string;
}) {
  if (!eyebrow && !title && !subtitle && !action) return null;
  return (
    <div className={cn('mb-8 flex flex-col gap-3 sm:mb-10', align === 'center' ? 'items-center text-center' : 'sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow && <Eyebrow className="mb-2">{eyebrow}</Eyebrow>}
        {title && <h2 className="font-heading text-[1.75rem] font-semibold leading-tight tracking-tight text-balance sm:text-4xl">{title}</h2>}
        {subtitle && <p className="mt-3 text-base text-muted-foreground text-pretty">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function ViewAllLink({ onClick, children = 'View all' }: { onClick: () => void; children?: ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-foreground underline-offset-4 hover:underline">
      {children} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

/** Theme-aware button (brand colour + the store's corner style). */
export function ThemeButton({ href, children, variant = 'solid', className, onClick }: {
  href?: string; children: ReactNode; variant?: 'solid' | 'outline' | 'light' | 'ghost-light'; className?: string; onClick?: () => void;
}) {
  const resolve = useResolveHref();
  const cls = cn(
    'inline-flex h-12 items-center justify-center gap-2 px-7 text-[15px] font-semibold transition-all duration-200 rounded-[var(--btn-radius)] active:scale-[0.98]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 ring-offset-background',
    variant === 'solid' && 'bg-brand text-brand-foreground shadow-sm hover:brightness-110 hover:shadow-md',
    variant === 'outline' && 'border border-foreground/20 text-foreground hover:border-foreground/40 hover:bg-foreground/[0.03]',
    variant === 'light' && 'bg-white text-zinc-900 shadow-sm hover:bg-white/90',
    variant === 'ghost-light' && 'border border-white/40 text-white backdrop-blur-sm hover:bg-white/10',
    className,
  );
  if (onClick) return <button type="button" onClick={onClick} className={cls}>{children}</button>;
  const safe = resolve(href);
  if (!safe) return <span className={cls}>{children}</span>;
  if (safe.startsWith('#')) {
    return (
      <a href={safe} className={cls} onClick={e => {
        const target = document.getElementById(safe.slice(1));
        if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      }}>{children}</a>
    );
  }
  if (safe.startsWith('/')) return <Link to={safe} className={cls}>{children}</Link>;
  const external = /^https?:/.test(safe);
  return <a href={safe} className={cls} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{children}</a>;
}

/** WhatsApp glyph (the brand customers recognise for ordering). */
export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn('h-4 w-4', className)} fill="currentColor">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.04 21.5h-.01a9.45 9.45 0 0 1-4.82-1.32l-.35-.2-3.58.94.96-3.49-.23-.36a9.43 9.43 0 0 1-1.45-5.03c0-5.22 4.25-9.47 9.48-9.47 2.53 0 4.91.99 6.7 2.78a9.4 9.4 0 0 1 2.77 6.7c0 5.22-4.25 9.46-9.47 9.46zm8.06-17.53A11.33 11.33 0 0 0 12.04.63C5.76.63.66 5.73.66 12.01c0 2 .52 3.96 1.52 5.69L.57 23.37l5.81-1.52a11.36 11.36 0 0 0 5.66 1.44h.01c6.28 0 11.38-5.11 11.38-11.38 0-3.04-1.18-5.9-3.33-8.05z" />
    </svg>
  );
}

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
