import { Link } from 'react-router-dom';
import { ImageIcon } from 'lucide-react';
import { fmtDalasi, type Product } from '@cp/shared';
import { useStoreHref } from './StoreShell';

export function ProductCard({ product }: { product: Product }) {
  const href = useStoreHref();
  return (
    <Link to={href(`/products/${product.id}`)} className="group block">
      <div className="aspect-square overflow-hidden rounded-[var(--card-radius)] border border-border/60 bg-muted/40">
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
    </Link>
  );
}
