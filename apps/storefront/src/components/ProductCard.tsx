import { Link } from 'react-router-dom';
import { ImageIcon } from 'lucide-react';
import { fmtDalasi, type Product } from '@cp/shared';
import { cn } from '@cp/ui';
import { useStoreHref } from './StoreShell';

const RATIO = { square: 'aspect-square', portrait: 'aspect-[3/4]', landscape: 'aspect-[4/3]' } as const;

export function ProductCard({ product, ratio = 'square', sample = false }: {
  product: Product; ratio?: keyof typeof RATIO; sample?: boolean;
}) {
  const href = useStoreHref();
  const body = (
    <>
      <div className={cn(RATIO[ratio], 'overflow-hidden rounded-[var(--card-radius)] border border-border/60 bg-muted/40')}>
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
        ) : (
          <div className="flex h-full items-center justify-center"><ImageIcon className="h-6 w-6 text-muted-foreground/50" /></div>
        )}
      </div>
      <div className="mt-3 space-y-1">
        <p className="line-clamp-2 text-sm font-medium leading-snug group-hover:underline group-hover:underline-offset-4">{product.name}</p>
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold tabular-nums">{fmtDalasi(product.price)}</p>
          {!product.in_stock && <span className="text-xs text-muted-foreground">Sold out</span>}
        </div>
      </div>
    </>
  );
  // Sample products (editor preview only) have no product page.
  if (sample) return <div className="group block">{body}</div>;
  return <Link to={href(`/products/${product.id}`)} className="group block">{body}</Link>;
}
