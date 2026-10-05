import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import { useStoreProducts } from '../store';
import { container, Img, useStoreHref } from '../components/primitives';
import { useStoreCategories } from './MarketplaceHome';

/** Full category list (marketplace bottom-nav "Categories" tab). */
export default function CategoriesPage() {
  const { data: products = [] } = useStoreProducts();
  const categories = useStoreCategories(products);
  const href = useStoreHref();

  return (
    <div className={`${container} py-5`}>
      <h1 className="mb-4 font-heading text-xl font-bold">Categories</h1>
      {categories.length === 0 ? (
        <p className="rounded-xl bg-card p-8 text-center text-sm text-muted-foreground">Categories appear here once the store adds products.</p>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {categories.map(c => (
            <Link key={c.name} to={href(`/?c=${encodeURIComponent(c.name)}`)} className="flex flex-col items-center gap-2 rounded-xl bg-card p-3 text-center shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              <span className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-muted">
                {c.image ? <Img src={c.image} alt="" /> : <Package className="h-6 w-6 text-brand" />}
              </span>
              <span className="line-clamp-2 text-xs font-medium leading-tight">{c.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
