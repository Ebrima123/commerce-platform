import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ImageIcon, Minus, Plus, Star } from 'lucide-react';
import { toast } from 'sonner';
import { fmtDalasi, productImages } from '@cp/shared';
import { Button, EmptyState, Skeleton, cn } from '@cp/ui';
import { useCart, useStore, useStoreProduct } from '../store';
import { useStoreHref } from '../components/StoreShell';

/** iOS-style − 1 + stepper. */
function Stepper({ value, onChange, max }: { value: number; onChange: (n: number) => void; max: number }) {
  const btn = 'flex h-full w-11 items-center justify-center transition-opacity active:opacity-50 disabled:opacity-30';
  return (
    <div className="flex h-12 shrink-0 items-center rounded-[14px] bg-zinc-500/[0.12]">
      <button type="button" className={btn} onClick={() => onChange(Math.max(1, value - 1))} disabled={value <= 1} aria-label="Fewer"><Minus className="h-[18px] w-[18px]" strokeWidth={2.5} /></button>
      <span className="w-7 text-center text-[17px] font-semibold tabular-nums" aria-live="polite">{value}</span>
      <button type="button" className={btn} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="More"><Plus className="h-[18px] w-[18px]" strokeWidth={2.5} /></button>
    </div>
  );
}

export default function ProductPage() {
  const { id } = useParams();
  const { store } = useStore();
  const { add } = useCart();
  const href = useStoreHref();
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const gallery = useRef<HTMLDivElement>(null);

  const { data: product, isLoading, isError } = useStoreProduct(id);

  // Only show products that belong to this store.
  const belongsHere = product && (!product.seller_id || product.seller_id === store?.ownerId);

  if (isLoading) {
    return (
      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 md:gap-10 md:px-6 md:py-10">
        <Skeleton className="aspect-square rounded-none md:rounded-2xl" />
        <div className="space-y-4 px-4 md:px-0"><Skeleton className="h-8 w-3/4" /><Skeleton className="h-6 w-1/4" /><Skeleton className="h-24" /></div>
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
  const max = product.stock_quantity || 99;
  const rating = product.average_rating ?? 0;
  const sold = product.sales_count ?? 0;
  const addToBag = () => { add(product, qty); toast.success(qty > 1 ? `${qty} added to your cart` : 'Added to your cart'); };
  const back = () => (window.history.length > 1 ? navigate(-1) : navigate(href('/')));
  const showImage = (i: number) => {
    setActive(i);
    const el = gallery.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <div className="mx-auto max-w-6xl pb-28 md:px-6 md:py-10 md:pb-10">
      <button type="button" onClick={back} className="mb-6 hidden items-center text-[17px] text-brand active:opacity-50 md:inline-flex">
        <ChevronLeft className="h-6 w-6" strokeWidth={2.2} /> Back
      </button>

      <div className="grid gap-5 md:grid-cols-2 md:gap-10">
        {/* Photos: swipe on phones (edge to edge), thumbnails on desktop. */}
        <div className="relative">
          <div ref={gallery} onScroll={e => setActive(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
            className="no-scrollbar flex aspect-square snap-x snap-mandatory overflow-x-auto bg-muted md:rounded-2xl">
            {images.length ? images.map((src, i) => (
              <img key={src} src={src} alt={i === 0 ? product.name : ''} loading={i === 0 ? 'eager' : 'lazy'} className="h-full w-full shrink-0 snap-center object-cover" />
            )) : <div className="flex h-full w-full items-center justify-center"><ImageIcon className="h-8 w-8 text-muted-foreground/50" /></div>}
          </div>
          <button type="button" onClick={back} aria-label="Back"
            className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/75 text-zinc-900 shadow-sm backdrop-blur-md active:scale-95 md:hidden">
            <ChevronLeft className="h-6 w-6" strokeWidth={2.2} />
          </button>
          {images.length > 1 && (
            <>
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/25 px-2 py-1.5 backdrop-blur-sm md:hidden">
                {images.map((_, i) => <span key={i} className={cn('h-1.5 w-1.5 rounded-full transition-colors', i === active ? 'bg-white' : 'bg-white/50')} />)}
              </div>
              <div className="mt-3 hidden gap-2 overflow-x-auto md:flex">
                {images.map((src, i) => (
                  <button key={src} type="button" onClick={() => showImage(i)} aria-label={`Photo ${i + 1}`}
                    className={cn('h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-2 transition-opacity', i === active ? 'ring-brand' : 'opacity-70 ring-transparent hover:opacity-100')}>
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="px-4 md:px-0">
          {product.category && <p className="text-[15px] font-medium text-brand">{product.category}</p>}
          <h1 className="mt-1 font-heading text-[26px] font-bold leading-tight tracking-tight sm:text-3xl">{product.name}</h1>
          <p className="mt-2 text-[24px] font-bold tabular-nums">{fmtDalasi(product.price)}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px]">
            {rating > 0 && <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{rating.toFixed(1)}</span>}
            {sold > 0 && <span className="text-muted-foreground">{sold} sold</span>}
            <span className={soldOut ? 'text-destructive' : product.stock_quantity <= 5 ? 'text-[#ff9500]' : 'text-[#34c759]'}>
              {soldOut ? 'Sold out' : product.stock_quantity <= 5 ? `Only ${product.stock_quantity} left` : 'In stock'}
            </span>
          </div>

          {/* Desktop: inline. Phones: the fixed bar below. */}
          <div className="mt-6 hidden items-center gap-3 md:flex">
            {!soldOut && <Stepper value={qty} onChange={setQty} max={max} />}
            <Button size="lg" className="flex-1" disabled={soldOut} onClick={addToBag}>{soldOut ? 'Sold out' : 'Add to cart'}</Button>
          </div>

          {product.description && (
            <div className="mt-6 rounded-2xl bg-muted/60 p-4">
              <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">About this item</h2>
              <p className="mt-1.5 whitespace-pre-line text-[16px] leading-relaxed">{product.description}</p>
            </div>
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t-[0.5px] border-black/15 bg-card/85 px-4 pt-3 backdrop-blur-xl backdrop-saturate-150 md:hidden"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        <div className="flex items-center gap-3">
          {!soldOut && <Stepper value={qty} onChange={setQty} max={max} />}
          <Button size="lg" className="min-w-0 flex-1" disabled={soldOut} onClick={addToBag}>
            {soldOut ? 'Sold out' : 'Add to cart'}
          </Button>
        </div>
      </div>
    </div>
  );
}
