import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ImageIcon, Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { fmtDalasi, productImages } from '@cp/shared';
import { Button, EmptyState, Skeleton, cn } from '@cp/ui';
import { useCart, useStore, useStoreProduct } from '../store';
import { useStoreHref } from '../components/StoreShell';

export default function ProductPage() {
  const { id } = useParams();
  const { store } = useStore();
  const { add } = useCart();
  const href = useStoreHref();
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);

  const { data: product, isLoading, isError } = useStoreProduct(id);

  // Only show products that belong to this store.
  const belongsHere = product && (!product.seller_id || product.seller_id === store?.ownerId);

  if (isLoading) {
    return (
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-2">
        <Skeleton className="aspect-square rounded-xl" />
        <div className="space-y-4"><Skeleton className="h-8 w-3/4" /><Skeleton className="h-6 w-1/4" /><Skeleton className="h-24" /></div>
      </div>
    );
  }
  if (isError || !product || !belongsHere) {
    return (
      <EmptyState title="Product not found" description="It may have been removed or is no longer available."
        action={<Button asChild variant="outline"><Link to={href('/')}>Back to store</Link></Button>} />
    );
  }

  const images = productImages(product);
  const soldOut = !product.in_stock;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Link to={href('/')} className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All products
      </Link>
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-[var(--card-radius)] border border-border/60 bg-muted/40">
            {images[active] ? <img src={images[active]} alt={product.name} className="h-full w-full object-cover" />
              : <div className="flex h-full items-center justify-center"><ImageIcon className="h-8 w-8 text-muted-foreground/50" /></div>}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((src, i) => (
                <button key={src} onClick={() => setActive(i)} aria-label={`Image ${i + 1}`}
                  className={cn('h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2', i === active ? 'border-foreground' : 'border-transparent opacity-70 hover:opacity-100')}>
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {product.category && <p className="text-sm text-muted-foreground">{product.category}</p>}
          <h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">{product.name}</h1>
          <p className="mt-3 text-xl font-semibold tabular-nums">{fmtDalasi(product.price)}</p>
          <p className={cn('mt-1 text-sm', soldOut ? 'text-destructive' : 'text-muted-foreground')}>
            {soldOut ? 'Sold out' : product.stock_quantity <= 5 ? `Only ${product.stock_quantity} left` : 'In stock'}
          </p>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex h-11 items-center rounded-lg border border-input">
              <button className="flex h-full w-10 items-center justify-center disabled:opacity-40" onClick={() => setQty(q => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Decrease quantity"><Minus className="h-4 w-4" /></button>
              <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">{qty}</span>
              <button className="flex h-full w-10 items-center justify-center disabled:opacity-40" onClick={() => setQty(q => Math.min(product.stock_quantity || 99, q + 1))} disabled={soldOut || qty >= (product.stock_quantity || 99)} aria-label="Increase quantity"><Plus className="h-4 w-4" /></button>
            </div>
            <Button size="lg" className="flex-1 rounded-[var(--btn-radius)]" disabled={soldOut} onClick={() => { add(product, qty); toast.success('Added to cart'); }}>
              {soldOut ? 'Sold out' : 'Add to cart'}
            </Button>
          </div>

          {product.description && (
            <div className="mt-8 border-t border-border/60 pt-6">
              <h2 className="text-sm font-semibold">Description</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{product.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
