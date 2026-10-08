import { Link } from 'react-router-dom';
import { ImageIcon, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { fmtDalasi } from '@cp/shared';
import { Button, EmptyState } from '@cp/ui';
import { useCart, useStore } from '../store';
import { useStoreHref } from '../components/StoreShell';
import { WhatsAppIcon } from '../components/primitives';

export default function CartPage() {
  const { store } = useStore();
  const { lines, count, subtotal, setQty, remove } = useCart();
  const href = useStoreHref();
  const wa = store?.whatsapp.replace(/\D/g, '') ?? '';

  if (!lines.length) {
    return (
      <EmptyState className="py-24" icon={<ShoppingBag className="h-6 w-6" />} title="Your cart is empty"
        description="Tap + on any product to add it here."
        action={<Button asChild size="lg"><Link to={href('/')}>Start shopping</Link></Button>} />
    );
  }

  // Interim checkout: send the order to the merchant on WhatsApp. Real checkout
  // (orders API + payments to the merchant's own account) is a later phase.
  const message = [
    `Hello ${store?.name}, I'd like to order:`,
    ...lines.map(l => `• ${l.qty} × ${l.name} — ${fmtDalasi(l.price * l.qty)}`),
    `Total: ${fmtDalasi(subtotal)}`,
  ].join('\n');
  const orderUrl = `https://wa.me/${wa}?text=${encodeURIComponent(message)}`;
  const step = 'flex h-full w-9 items-center justify-center transition-opacity active:opacity-50';

  return (
    <div className="mx-auto max-w-5xl px-4 pb-32 pt-5 sm:px-6 md:pb-12 md:pt-10">
      <h1 className="font-heading text-[34px] font-bold leading-tight tracking-tight">Cart</h1>
      <p className="mt-0.5 text-[15px] text-muted-foreground">{count} item{count !== 1 ? 's' : ''}</p>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_340px]">
        <ul className="overflow-hidden rounded-2xl bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          {lines.map(l => (
            <li key={l.id} className="flex gap-3 pl-4">
              <Link to={href(`/products/${l.id}`)} className="my-3 flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
                {l.image ? <img src={l.image} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-5 w-5 text-muted-foreground/50" />}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 border-b border-border/70 py-3 pr-4 [li:last-child_&]:border-b-0">
                <div className="flex justify-between gap-3">
                  <Link to={href(`/products/${l.id}`)} className="line-clamp-2 text-[16px] leading-snug">{l.name}</Link>
                  <p className="shrink-0 text-[16px] font-semibold tabular-nums">{fmtDalasi(l.price * l.qty)}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex h-9 items-center rounded-full bg-zinc-500/[0.12]">
                    <button type="button" className={step} onClick={() => setQty(l.id, l.qty - 1)} aria-label={`One less ${l.name}`}>
                      {l.qty === 1 ? <Trash2 className="h-4 w-4 text-destructive" /> : <Minus className="h-4 w-4" strokeWidth={2.5} />}
                    </button>
                    <span className="w-6 text-center text-[15px] font-semibold tabular-nums">{l.qty}</span>
                    <button type="button" className={step} onClick={() => setQty(l.id, l.qty + 1)} aria-label={`One more ${l.name}`}><Plus className="h-4 w-4" strokeWidth={2.5} /></button>
                  </div>
                  <button type="button" onClick={() => remove(l.id)} className="text-[15px] text-destructive active:opacity-50">Remove</button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="h-fit rounded-2xl bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between text-[17px]">
            <span>Total</span>
            <span className="font-bold tabular-nums">{fmtDalasi(subtotal)}</span>
          </div>
          <p className="mt-1 text-[13px] text-muted-foreground">Delivery and payment are arranged with {store?.name} on WhatsApp.</p>
          {wa ? (
            <Button asChild size="lg" className="mt-4 hidden w-full bg-[#25D366] text-white hover:bg-[#1fb857] md:flex">
              <a href={orderUrl} target="_blank" rel="noopener noreferrer"><WhatsAppIcon className="h-5 w-5" /> Order on WhatsApp</a>
            </Button>
          ) : (
            <p className="mt-4 rounded-xl bg-muted p-3 text-[15px] text-muted-foreground">Online checkout is coming soon for this store.</p>
          )}
        </div>
      </div>

      {/* Phones: checkout bar above the tab bar. */}
      {wa && (
        <div className="fixed inset-x-0 z-30 border-t-[0.5px] border-black/15 bg-card/85 px-4 py-3 backdrop-blur-xl backdrop-saturate-150 md:hidden"
          style={{ bottom: 'calc(50px + env(safe-area-inset-bottom))' }}>
          <Button asChild size="lg" className="w-full bg-[#25D366] text-white hover:bg-[#1fb857]">
            <a href={orderUrl} target="_blank" rel="noopener noreferrer"><WhatsAppIcon className="h-5 w-5" /> Order on WhatsApp</a>
          </Button>
        </div>
      )}
    </div>
  );
}
