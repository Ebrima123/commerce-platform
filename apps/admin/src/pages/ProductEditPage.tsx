import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Loader2, Plus, ShoppingBag, Star, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError, fmtDalasi, productImages } from '@cp/shared';
import { Badge, Button, Skeleton, cn } from '@cp/ui';
import { PageHeader } from '../components/AdminLayout';
import { Panel, SaveBar, Sheet, BarButton } from '../components/ios';
import { MultiImageInput } from '../design/FieldControls';
import { ALFUDI_STATUS, type ProductChannel, type SellerProduct, type Variant } from '../commerce';
import { useProductChannels, useUpdateProductChannel } from '../platform';

interface Form {
  name: string; description: string; images: string[];
  price: string; cost: string; sku: string; stock_quantity: string; min_stock_level: string;
  category: string; product_type: string; published: boolean; variants: Variant[];
}

const toForm = (p: SellerProduct, visible: boolean): Form => ({
  name: p.name ?? '', description: p.description ?? '', images: productImages(p),
  price: String(p.price ?? ''), cost: p.cost == null ? '' : String(p.cost), sku: p.sku ?? '',
  stock_quantity: String(p.stock_quantity ?? 0), min_stock_level: String(p.min_stock_level ?? ''),
  category: p.category ?? '', product_type: p.product_type ?? '', published: visible,
  variants: (p.variants ?? []).map(v => ({ ...v, price_override: v.price_override ?? '' })),
});

const input = 'h-11 w-full rounded-xl border-0 bg-muted px-3.5 text-base placeholder:text-muted-foreground focus:bg-card focus:outline-none focus:ring-2 focus:ring-brand/35';
const label = 'mb-1.5 block text-[13px] font-medium text-muted-foreground';

export default function ProductEditPage() {
  const { id } = useParams();
  const { data: channels, isLoading: channelsLoading } = useProductChannels();
  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', id],
    queryFn: () => api<SellerProduct>(`/api/seller/products/${id}/`, { auth: true }),
  });

  if (isLoading || channelsLoading) {
    return (
      <>
        <PageHeader title="Product" back={{ to: '/products', label: 'Products' }} />
        <div className="grid gap-4 lg:grid-cols-[1fr_300px]"><Skeleton className="h-96 rounded-2xl" /><Skeleton className="h-48 rounded-2xl" /></div>
      </>
    );
  }
  if (isError || !product) {
    return (
      <>
        <PageHeader title="Product not found" back={{ to: '/products', label: 'Products' }} />
        <p className="text-muted-foreground">It may have been deleted.</p>
      </>
    );
  }
  const channel = channels?.[product.id] ?? { visible: !!product.published, alfudi_status: 'alfudi' as const, review_note: '' };
  return <Editor key={product.id} product={product} channel={channel} />;
}

function Editor({ product, channel }: { product: SellerProduct; channel: ProductChannel }) {
  const updateChannel = useUpdateProductChannel();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const initial = useMemo(() => toForm(product, channel.visible), [product, channel.visible]);
  const [form, setForm] = useState<Form>(initial);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm(f => ({ ...f, [k]: v }));
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const save = useMutation({
    mutationFn: async () => {
      const variants = form.variants
        .filter(v => v.size.trim() || v.color.trim())
        .map(v => ({ ...v, stock_quantity: Number(v.stock_quantity) || 0, price_override: v.price_override === '' ? null : v.price_override }));
      // Active/Draft is the Mariseh switch — it never changes the Alfudi marketplace listing.
      if (form.published !== initial.published) await updateChannel.mutateAsync({ id: product.id, visible: form.published });
      return api<SellerProduct>(`/api/seller/products/${product.id}/`, {
        method: 'PATCH', auth: true,
        body: {
          name: form.name.trim(), description: form.description.trim(), price: form.price,
          cost: form.cost === '' ? null : form.cost, sku: form.sku.trim(),
          stock_quantity: Number(form.stock_quantity) || 0, min_stock_level: Number(form.min_stock_level) || 0,
          category: form.category.trim(), product_type: form.product_type.trim(),
          image_url: form.images[0] ?? '', image_urls: form.images,
          // Only send variants when they changed — the backend replaces them all.
          ...(JSON.stringify(form.variants) !== JSON.stringify(initial.variants) ? { variants } : {}),
        },
      });
    },
    onSuccess: p => {
      // Re-read from what the server stored (it normalises e.g. "5200" → "5200.00").
      setForm(toForm(p, form.published));
      qc.setQueryData(['product', product.id], p);
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Product saved');
    },
    onError: e => toast.error(e instanceof ApiError ? e.message : 'Could not save the product'),
  });

  const remove = useMutation({
    mutationFn: () => api(`/api/seller/products/${product.id}/`, { method: 'DELETE', auth: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Product deleted');
      navigate('/products');
    },
    onError: e => toast.error(e instanceof ApiError ? e.message : 'Could not delete the product'),
  });

  const price = Number(form.price) || 0;
  const cost = Number(form.cost) || 0;
  const profit = price - cost;
  const margin = price > 0 && form.cost !== '' ? Math.round((profit / price) * 100) : null;
  const valid = form.name.trim() && price > 0;

  const setVariant = (i: number, patch: Partial<Variant>) => set('variants', form.variants.map((v, n) => (n === i ? { ...v, ...patch } : v)));
  const variantStock = form.variants.reduce((n, v) => n + (Number(v.stock_quantity) || 0), 0);

  return (
    <>
      <SaveBar show={dirty} saving={save.isPending} onDiscard={() => setForm(initial)} onSave={() => (valid ? save.mutate() : toast.error('Add a name and a price above 0'))} />
      <PageHeader title={form.name || 'Product'} back={{ to: '/products', label: 'Products' }}
        description={<span className="inline-flex items-center gap-2"><Badge tone={form.published ? 'green' : 'neutral'}>{form.published ? 'Active' : 'Draft'}</Badge>{product.sku && <span>SKU {product.sku}</span>}</span>} />

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <Panel>
            <label htmlFor="p-title" className={label}>Title</label>
            <input id="p-title" value={form.name} onChange={e => set('name', e.target.value)} maxLength={500} className={input} />
            <label htmlFor="p-desc" className={cn(label, 'mt-4')}>Description</label>
            <textarea id="p-desc" rows={6} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Size, colour, material, how to use…"
              className="w-full resize-y rounded-xl border-0 bg-muted px-3.5 py-3 text-base leading-relaxed placeholder:text-muted-foreground focus:bg-card focus:outline-none focus:ring-2 focus:ring-brand/35" />
          </Panel>

          <Panel title="Photos">
            <MultiImageInput id="p-images" values={form.images} onChange={v => set('images', v)} />
          </Panel>

          <Panel title="Pricing">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="p-price" className={label}>Price (D)</label>
                <input id="p-price" inputMode="decimal" type="number" min="0" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} className={input} />
              </div>
              <div>
                <label htmlFor="p-cost" className={label}>What it costs you (D)</label>
                <input id="p-cost" inputMode="decimal" type="number" min="0" step="0.01" value={form.cost} onChange={e => set('cost', e.target.value)} placeholder="Optional" className={input} />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-muted/60 p-3 text-[15px]">
              <div><p className="text-[13px] text-muted-foreground">Profit per sale</p><p className="font-semibold tabular-nums">{form.cost === '' ? '—' : fmtDalasi(profit)}</p></div>
              <div><p className="text-[13px] text-muted-foreground">Margin</p><p className={cn('font-semibold tabular-nums', margin !== null && margin < 0 && 'text-destructive')}>{margin === null ? '—' : `${margin}%`}</p></div>
            </div>
            <p className="mt-2 text-[13px] text-muted-foreground">Customers never see what it costs you.</p>
          </Panel>

          <Panel title="Inventory">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="p-qty" className={label}>Quantity in stock</label>
                <input id="p-qty" inputMode="numeric" type="number" min="0" value={form.variants.length ? String(variantStock) : form.stock_quantity}
                  onChange={e => set('stock_quantity', e.target.value)} disabled={form.variants.length > 0} className={cn(input, 'disabled:opacity-60')} />
                {form.variants.length > 0 && <p className="mt-1 text-[12px] text-muted-foreground">Added up from the options below.</p>}
              </div>
              <div>
                <label htmlFor="p-low" className={label}>Warn me when below</label>
                <input id="p-low" inputMode="numeric" type="number" min="0" value={form.min_stock_level} onChange={e => set('min_stock_level', e.target.value)} placeholder="e.g. 3" className={input} />
              </div>
              <div>
                <label htmlFor="p-sku" className={label}>SKU (optional)</label>
                <input id="p-sku" value={form.sku} onChange={e => set('sku', e.target.value)} className={input} />
              </div>
            </div>
          </Panel>

          <Panel title="Options (sizes and colours)" action={
            <Button size="sm" variant="tinted" onClick={() => set('variants', [...form.variants, { size: '', color: '', sku: '', stock_quantity: 0, price_override: '' }])}><Plus /> Add option</Button>
          }>
            {form.variants.length === 0 ? (
              <p className="text-[15px] text-muted-foreground">Sell this in different sizes or colours? Add each one with its own stock — and its own price if it costs more.</p>
            ) : (
              <div className="space-y-2">
                <div className="hidden grid-cols-[1fr_1fr_110px_90px_36px] gap-2 px-1 text-[12px] font-medium text-muted-foreground sm:grid">
                  <span>Size</span><span>Colour</span><span>Price (if different)</span><span>In stock</span><span />
                </div>
                {form.variants.map((v, i) => (
                  <div key={i} className="grid grid-cols-2 gap-2 rounded-xl bg-muted/50 p-2 sm:grid-cols-[1fr_1fr_110px_90px_36px] sm:bg-transparent sm:p-0">
                    <input aria-label="Size" value={v.size} onChange={e => setVariant(i, { size: e.target.value })} placeholder="e.g. M" className={cn(input, 'h-10')} />
                    <input aria-label="Colour" value={v.color} onChange={e => setVariant(i, { color: e.target.value })} placeholder="e.g. Blue" className={cn(input, 'h-10')} />
                    <input aria-label="Price if different" inputMode="decimal" type="number" min="0" value={v.price_override ?? ''} onChange={e => setVariant(i, { price_override: e.target.value })} placeholder={form.price || '0'} className={cn(input, 'h-10')} />
                    <input aria-label="In stock" inputMode="numeric" type="number" min="0" value={v.stock_quantity} onChange={e => setVariant(i, { stock_quantity: Number(e.target.value) })} className={cn(input, 'h-10')} />
                    <button type="button" onClick={() => set('variants', form.variants.filter((_, n) => n !== i))} aria-label="Remove option"
                      className="col-span-2 flex h-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-destructive sm:col-span-1"><X className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Status">
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1" role="radiogroup" aria-label="Status">
              {([[true, 'Active'], [false, 'Draft']] as const).map(([v, l]) => (
                <button key={l} type="button" role="radio" aria-checked={form.published === v} onClick={() => set('published', v)}
                  className={cn('h-9 rounded-lg text-[15px] font-medium transition-colors', form.published === v ? 'bg-card shadow-sm' : 'text-muted-foreground')}>{l}</button>
              ))}
            </div>
            <p className="mt-2 text-[13px] text-muted-foreground">{form.published ? 'Customers can see and order it on your Mariseh store.' : 'Hidden from your Mariseh store until you make it active.'}</p>
          </Panel>

          <Panel title="Alfudi marketplace">
            <Badge tone={ALFUDI_STATUS[channel.alfudi_status].tone}>{ALFUDI_STATUS[channel.alfudi_status].label}</Badge>
            <p className="mt-2 text-[13px] leading-snug text-muted-foreground">{ALFUDI_STATUS[channel.alfudi_status].help}</p>
            {channel.alfudi_status === 'rejected' && (
              <>
                {channel.review_note && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-900">Alfudi said: {channel.review_note}</p>}
                <Button size="sm" variant="tinted" className="mt-3" disabled={updateChannel.isPending}
                  onClick={() => updateChannel.mutate({ id: product.id, resubmit: true }, { onSuccess: () => toast.success('Sent to Alfudi for another look') })}>
                  Ask Alfudi again
                </Button>
              </>
            )}
          </Panel>

          <Panel title="Organisation">
            <label htmlFor="p-cat" className={label}>Category</label>
            <input id="p-cat" value={form.category} onChange={e => set('category', e.target.value)} placeholder="e.g. Dresses" className={input} />
            <label htmlFor="p-type" className={cn(label, 'mt-4')}>Product type</label>
            <input id="p-type" value={form.product_type} onChange={e => set('product_type', e.target.value)} placeholder="e.g. Clothing" className={input} />
          </Panel>

          <Panel title="Performance">
            <ul className="space-y-2.5 text-[15px]">
              <li className="flex items-center gap-2.5"><ShoppingBag className="h-4 w-4 text-muted-foreground" /> <span className="flex-1">Sold</span><span className="font-semibold tabular-nums">{product.sales_count ?? 0}</span></li>
              <li className="flex items-center gap-2.5"><Eye className="h-4 w-4 text-muted-foreground" /> <span className="flex-1">Views</span><span className="font-semibold tabular-nums">{product.view_count ?? 0}</span></li>
              <li className="flex items-center gap-2.5"><Star className="h-4 w-4 text-muted-foreground" /> <span className="flex-1">Rating</span><span className="font-semibold tabular-nums">{product.average_rating ? `${Number(product.average_rating).toFixed(1)} (${product.total_reviews ?? 0})` : '—'}</span></li>
            </ul>
          </Panel>

          <Button variant="outline" className="w-full text-destructive" onClick={() => setConfirmDelete(true)}><Trash2 /> Delete product</Button>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2 pb-4">
        <Button size="lg" onClick={() => save.mutate()} disabled={!dirty || !valid || save.isPending}>
          {save.isPending && <Loader2 className="animate-spin" />} Save
        </Button>
      </div>

      <Sheet open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete product?" leading={<BarButton onClick={() => setConfirmDelete(false)}>Cancel</BarButton>}>
        <p className="mb-5 text-[15px] text-muted-foreground">“{product.name}” will be removed from your store for good. To hide it for a while instead, set it to Draft.</p>
        <Button size="lg" variant="destructive" className="mb-2 w-full" disabled={remove.isPending} onClick={() => remove.mutate()}>
          {remove.isPending && <Loader2 className="animate-spin" />} Delete for good
        </Button>
      </Sheet>
    </>
  );
}
