import { useEffect, useId, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { cn } from '@cp/ui';

// iOS building blocks: grouped lists (like the Settings app), switches and
// bottom sheets. Kept deliberately small — pages compose them.

/** A rounded white group of rows with an optional caption above and note below. */
export function ListSection({ header, footer, children, className }: {
  header?: ReactNode; footer?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <section className={cn('mb-8', className)}>
      {header && <h2 className="mb-1.5 px-4 text-[13px] font-medium uppercase tracking-[0.02em] text-muted-foreground">{header}</h2>}
      {/* Rows draw their own inset separator; the last one hides it. */}
      <div className="overflow-hidden rounded-2xl bg-card [&>*:last-child_.ios-sep]:border-b-0">{children}</div>
      {footer && <p className="mt-1.5 px-4 text-[13px] leading-snug text-muted-foreground">{footer}</p>}
    </section>
  );
}

/** Coloured rounded-square icon, as in the Settings app. */
export function RowIcon({ icon: Icon, color }: { icon: LucideIcon | ((p: { className?: string }) => JSX.Element); color: string }) {
  return (
    <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[8px] text-white" style={{ background: color }}>
      <Icon className="h-[18px] w-[18px]" />
    </span>
  );
}

interface RowProps {
  icon?: LucideIcon | ((p: { className?: string }) => JSX.Element);
  iconColor?: string;
  /** Anything to show on the left instead of an icon (thumbnail, avatar…). */
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Grey text on the right, before the chevron. */
  value?: ReactNode;
  /** Control on the right (switch, badge…) — replaces the chevron. */
  trailing?: ReactNode;
  to?: string;
  href?: string;
  onClick?: () => void;
  destructive?: boolean;
  center?: boolean;
  className?: string;
}

/** A 44pt+ tappable row. Links and buttons get a chevron and a pressed state. */
export function ListRow({ icon, iconColor = '#8e8e93', leading, title, subtitle, value, trailing, to, href, onClick, destructive, center, className }: RowProps) {
  const interactive = !!(to || href || onClick);
  const body = (
    <>
      {leading ?? (icon && <RowIcon icon={icon} color={iconColor} />)}
      <span className={cn('ios-sep flex min-h-[44px] min-w-0 flex-1 items-center gap-3 self-stretch border-b border-border/70 py-2.5 pr-4', center && 'justify-center')}>
        <span className={cn('min-w-0', !center && 'flex-1')}>
          <span className={cn('block truncate text-[17px] leading-snug', destructive ? 'text-destructive' : 'text-foreground')}>{title}</span>
          {subtitle && <span className="mt-0.5 block truncate text-[13px] leading-snug text-muted-foreground">{subtitle}</span>}
        </span>
        {value !== undefined && <span className="shrink-0 truncate text-[17px] text-muted-foreground">{value}</span>}
        {trailing}
        {interactive && !trailing && !center && !destructive && <ChevronRight className="h-[18px] w-[18px] shrink-0 text-zinc-400" strokeWidth={2.5} />}
      </span>
    </>
  );
  const cls = cn('flex w-full items-center gap-3 pl-4 text-left transition-colors', interactive && 'active:bg-muted/80 hover:bg-muted/40', className);
  if (to) return <Link to={to} onClick={onClick} className={cls}>{body}</Link>;
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} className={cls}>{body}</a>;
  if (onClick) return <button type="button" onClick={onClick} className={cls}>{body}</button>;
  return <div className={cls}>{body}</div>;
}

/** iOS toggle. */
export function Switch({ checked, onChange, disabled, label }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled}
      onClick={e => { e.preventDefault(); e.stopPropagation(); onChange(!checked); }}
      className={cn('relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-50',
        checked ? 'bg-[#34C759]' : 'bg-zinc-300')}>
      <span className={cn('absolute left-[2px] top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.15),0_1px_1px_rgba(0,0,0,0.16)] transition-transform duration-200 ease-out',
        checked && 'translate-x-5')} />
    </button>
  );
}

/** Text button for sheet / nav bars ("Cancel", "Done"). */
export function BarButton({ children, onClick, bold, disabled, type = 'button', form }: {
  children: ReactNode; onClick?: () => void; bold?: boolean; disabled?: boolean; type?: 'button' | 'submit'; form?: string;
}) {
  return (
    <button type={type} form={form} onClick={onClick} disabled={disabled}
      className={cn('inline-flex h-11 items-center gap-1 px-1 text-[17px] text-brand transition-opacity active:opacity-50 disabled:text-muted-foreground disabled:opacity-60', bold && 'font-semibold')}>
      {children}
    </button>
  );
}

/**
 * Bottom sheet on phones, centred dialog on larger screens. Header follows the
 * iOS modal pattern: Cancel — Title — Done.
 */
export function Sheet({ open, onClose, title, leading, trailing, children, className }: {
  open: boolean; onClose: () => void; title: ReactNode; leading?: ReactNode; trailing?: ReactNode; children: ReactNode; className?: string;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div className="animate-fade absolute inset-0 bg-black/40" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby={titleId}
        className={cn('animate-sheet sm:animate-pop relative flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-[14px] bg-background shadow-2xl sm:max-w-lg sm:rounded-2xl', className)}>
        <div className="mx-auto mt-2 h-[5px] w-9 shrink-0 rounded-full bg-zinc-300 sm:hidden" aria-hidden />
        <div className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center px-3 pt-1 sm:pt-2">
          <div className="justify-self-start">{leading}</div>
          <h2 id={titleId} className="truncate px-2 text-[17px] font-semibold">{title}</h2>
          <div className="justify-self-end">{trailing}</div>
        </div>
        <div className="overflow-y-auto overscroll-contain px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3">{children}</div>
      </div>
    </div>
  );
}

/** Stacked label + borderless input inside a grouped list (like editing a contact). */
export function FieldRow({ label, htmlFor, children, hint }: { label: string; htmlFor?: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="pl-4">
      <div className="ios-sep border-b border-border/70 py-2.5 pr-4">
        <label htmlFor={htmlFor} className="block text-[13px] font-medium text-muted-foreground">{label}</label>
        {children}
        {hint && <p className="mt-1 text-[13px] text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

/** Input styling for use inside FieldRow. */
export const plainInput = 'mt-0.5 block h-9 w-full border-0 bg-transparent p-0 text-[17px] placeholder:text-zinc-400 focus:outline-none focus:ring-0';

/** Titled white card (Shopify-style layout block). */
export function Panel({ title, action, children, className }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-2xl bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-5', className)}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title && <h2 className="text-[17px] font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** Shopify's contextual save bar: appears while there are unsaved changes. */
export function SaveBar({ show, saving, onSave, onDiscard }: { show: boolean; saving?: boolean; onSave: () => void; onDiscard: () => void }) {
  if (!show) return null;
  return (
    <div className="animate-fade fixed inset-x-0 top-0 z-50 bg-zinc-900 pt-safe text-white shadow-lg">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4 lg:pl-[calc(18rem+2.5rem)]">
        <p className="flex-1 truncate text-[15px] font-medium">Unsaved changes</p>
        <button type="button" onClick={onDiscard} disabled={saving} className="h-9 rounded-lg px-3 text-[15px] font-medium text-zinc-200 hover:bg-white/10 disabled:opacity-50">Discard</button>
        <button type="button" onClick={onSave} disabled={saving} className="h-9 rounded-lg bg-white px-4 text-[15px] font-semibold text-zinc-900 active:scale-[0.97] disabled:opacity-60">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

/** Horizontal scrolling filter pills (Shopify's index tabs). */
export function FilterPills<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string; count?: number }[]; onChange: (v: T) => void }) {
  return (
    <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist">
      {options.map(o => (
        <button key={o.value || 'all'} type="button" role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)}
          className={cn('flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[15px] font-medium transition-colors',
            value === o.value ? 'bg-foreground text-background' : 'bg-card text-foreground hover:bg-muted')}>
          {o.label}
          {o.count !== undefined && <span className={cn('text-[13px] tabular-nums', value === o.value ? 'text-background/70' : 'text-muted-foreground')}>{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

/** Search field in the iOS style. */
export function SearchField({ value, onChange, placeholder = 'Search' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative mb-4">
      <svg className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
      <input type="search" enterKeyHint="search" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder}
        className="h-10 w-full rounded-xl border-0 bg-muted pl-10 pr-3 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/30" />
    </div>
  );
}
