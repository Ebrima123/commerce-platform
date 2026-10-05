import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Plus, Star } from 'lucide-react';
import { toast } from 'sonner';
import { fmtDalasi, type Product } from '@cp/shared';
import { cn } from '@cp/ui';
import { useCart } from '../../store';
import { Img, useStoreHref } from '../primitives';

/** "1234" → "1.2k". */
export const compactCount = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, '')}k` : String(n));

/** Dense marketplace card: big price, real sold count / rating, quick add. Only real data — no invented discounts. */
export function MarketCard({ product, sample = false, compact = false }: { product: Product; sample?: boolean; compact?: boolean }) {
  const href = useStoreHref();
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const soldOut = !product.in_stock;
  const low = !soldOut && product.stock_quantity > 0 && product.stock_quantity <= 3;
  const sold = product.sales_count ?? 0;
  const rating = product.average_rating ?? 0;
  const reviews = product.total_reviews ?? 0;
  const badge = soldOut ? { text: 'Sold out', cls: 'bg-zinc-900/85 text-white' }
    : product.is_best_seller ? { text: 'Best seller', cls: 'bg-amber-400 text-zinc-900' }
    : product.is_hot_pick ? { text: 'Hot', cls: 'bg-brand text-brand-foreground' }
    : low ? { text: `Only ${product.stock_quantity} left`, cls: 'bg-white text-zinc-900' }
    : null;

  const quickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (sample || soldOut) return;
    add(product, 1);
    setAdded(true);
    toast.success('Added to cart');
    setTimeout(() => setAdded(false), 1400);
  };

  const body = (
    <div className="flex h-full flex-col overflow-hidden rounded-lg bg-card shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-md">
      <div className="relative aspect-square bg-muted">
        <Img src={product.image_url} alt={product.name} className="transition-transform duration-500 group-hover:scale-[1.03]" />
        {badge && <span className={cn('absolute left-0 top-2 rounded-r-full px-2 py-0.5 text-[10px] font-bold shadow-sm', badge.cls)}>{badge.text}</span>}
        {!soldOut && !sample && (
          <button type="button" onClick={quickAdd} aria-label={`Add ${product.name} to cart`}
            className={cn('absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full shadow-md transition-colors',
              added ? 'bg-emerald-600 text-white' : 'bg-white/95 text-zinc-900 hover:bg-brand hover:text-brand-foreground')}>
            {added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </button>
        )}
      </div>
      <div className={cn('flex flex-1 flex-col p-2', !compact && 'sm:p-2.5')}>
        <p className={cn('line-clamp-2 leading-snug text-foreground', compact ? 'text-[12px]' : 'text-[13px]')}>{product.name}</p>
        <div className="mt-auto pt-1.5">
          <p className={cn('font-bold tabular-nums', compact ? 'text-[15px]' : 'text-base', soldOut ? 'text-muted-foreground' : 'text-brand')}>
            {fmtDalasi(product.price)}
          </p>
          {(sold > 0 || rating > 0) && (
            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              {rating > 0 && (
                <span className="inline-flex items-center gap-0.5 text-foreground">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />{rating.toFixed(1)}{reviews > 0 && <span className="text-muted-foreground">({compactCount(reviews)})</span>}
                </span>
              )}
              {sold > 0 && <span>{compactCount(sold)} sold</span>}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  if (sample) return <div className="group h-full">{body}</div>;
  return <Link to={href(`/products/${product.id}`)} className="group block h-full">{body}</Link>;
}
