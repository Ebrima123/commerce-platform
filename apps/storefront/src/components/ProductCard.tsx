import { Link } from 'react-router-dom';
import { Check, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { fmtDalasi, productImages, type Product } from '@cp/shared';
import { cn } from '@cp/ui';
import { useCart } from '../store';
import { useStoreHref } from './primitives';
import { Img } from './primitives';

const RATIO = { square: 'aspect-square', portrait: 'aspect-[3/4]', landscape: 'aspect-[4/3]' } as const;

export function ProductCard({ product, ratio = 'square', sample = false }: {
  product: Product; ratio?: keyof typeof RATIO; sample?: boolean;
}) {
  const href = useStoreHref();
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const images = productImages(product);
  const soldOut = !product.in_stock;
  const lowStock = !soldOut && product.stock_quantity > 0 && product.stock_quantity <= 3;

  const quickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (sample || soldOut) return;
    add(product, 1);
    setAdded(true);
    toast.success(`${product.name} added to your cart`);
    setTimeout(() => setAdded(false), 1600);
  };

  const body = (
    <>
      <div className={cn(RATIO[ratio], 'relative overflow-hidden rounded-[var(--card-radius)] bg-muted')}>
        <Img src={images[0] ?? ''} alt={product.name}
          className={cn('transition-transform duration-700 ease-out group-hover:scale-[1.04]', images[1] && 'group-hover:opacity-0')} />
        {images[1] && (
          <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" aria-hidden>
            <Img src={images[1]} alt="" />
          </div>
        )}
        <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5">
          {soldOut && <span className="rounded-full bg-zinc-900/85 px-2.5 py-1 text-[11px] font-semibold text-white">Sold out</span>}
          {lowStock && <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-zinc-900 shadow-sm">Only {product.stock_quantity} left</span>}
        </div>
        {!soldOut && !sample && (
          <button type="button" onClick={quickAdd} aria-label={`Add ${product.name} to cart`}
            className={cn('absolute bottom-2.5 right-2.5 flex h-10 w-10 items-center justify-center rounded-full shadow-md transition-all duration-200',
              'sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100',
              added ? 'bg-emerald-600 text-white' : 'bg-white text-zinc-900 hover:bg-brand hover:text-brand-foreground')}>
            {added ? <Check className="h-[18px] w-[18px]" /> : <Plus className="h-[18px] w-[18px]" />}
          </button>
        )}
      </div>
      <div className="mt-3.5 space-y-1">
        {product.category && <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{product.category}</p>}
        <p className="line-clamp-2 text-[15px] font-medium leading-snug text-foreground">{product.name}</p>
        <p className={cn('text-[15px] font-semibold tabular-nums', soldOut ? 'text-muted-foreground line-through' : 'text-foreground')}>{fmtDalasi(product.price)}</p>
      </div>
    </>
  );

  // Sample products (editor preview only) have no product page.
  if (sample) return <div className="group block">{body}</div>;
  return <Link to={href(`/products/${product.id}`)} className="group block focus-visible:outline-none">{body}</Link>;
}
