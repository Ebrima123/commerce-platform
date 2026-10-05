import { Link } from 'react-router-dom';
import { ImageIcon, MessageCircle, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { fmtDalasi } from '@cp/shared';
import { Button, Card, EmptyState } from '@cp/ui';
import { useCart, useStore } from '../store';
import { useStoreHref } from '../components/StoreShell';

export default function CartPage() {
  const { store } = useStore();
  const { lines, subtotal, setQty, remove } = useCart();
  const href = useStoreHref();
  const wa = store?.whatsapp.replace(/\D/g, '') ?? '';

  if (!lines.length) {
    return (
      <EmptyState className="py-24" icon={<ShoppingBag className="h-5 w-5" />} title="Your cart is empty"
        action={<Button asChild variant="outline"><Link to={href('/')}>Continue shopping</Link></Button>} />
    );
  }

  // Interim checkout: send the order to the merchant on WhatsApp. Real checkout
  // (orders API + payments to the merchant's own account) is a later phase.
  const message = [
    `Hello ${store?.name}, I'd like to order:`,
    ...lines.map(l => `• ${l.qty} × ${l.name} — ${fmtDalasi(l.price * l.qty)}`),
    `Total: ${fmtDalasi(subtotal)}`,
  ].join('\n');

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">Cart</h1>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <ul className="divide-y divide-border/60 border-y border-border/60">
          {lines.map(l => (
            <li key={l.id} className="flex gap-4 py-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-muted/40">
                {l.image ? <img src={l.image} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-5 w-5 text-muted-foreground/50" />}
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div className="flex justify-between gap-3">
                  <Link to={href(`/products/${l.id}`)} className="line-clamp-2 text-sm font-medium hover:underline">{l.name}</Link>
                  <p className="text-sm font-semibold tabular-nums">{fmtDalasi(l.price * l.qty)}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex h-9 items-center rounded-lg border border-input">
                    <button className="flex h-full w-9 items-center justify-center" onClick={() => setQty(l.id, l.qty - 1)} aria-label={`Decrease ${l.name}`}><Minus className="h-3.5 w-3.5" /></button>
                    <span className="w-7 text-center text-sm tabular-nums">{l.qty}</span>
                    <button className="flex h-full w-9 items-center justify-center" onClick={() => setQty(l.id, l.qty + 1)} aria-label={`Increase ${l.name}`}><Plus className="h-3.5 w-3.5" /></button>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => remove(l.id)} className="text-muted-foreground"><Trash2 /> Remove</Button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <Card className="h-fit p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold tabular-nums">{fmtDalasi(subtotal)}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Delivery is arranged with the store.</p>
          {wa ? (
            <Button asChild size="lg" className="mt-5 w-full rounded-[var(--btn-radius)]">
              <a href={`https://wa.me/${wa}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle /> Order on WhatsApp
              </a>
            </Button>
          ) : (
            <p className="mt-5 rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">Online checkout is coming soon for this store.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
