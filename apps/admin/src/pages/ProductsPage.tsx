import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ImageIcon, Loader2, Package, Plus, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError, fmtDalasi, type Paginated, type Product } from '@cp/shared';
import { Badge, Button, Card, EmptyState, Input, Label, Skeleton } from '@cp/ui';
import { PageHeader } from '../components/AdminLayout';
import { ImageInput } from '../design/FieldControls';

type SellerProduct = Product & { published: boolean; sku: string };

export default function ProductsPage() {
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const creating = params.get('new') === '1';
  const setCreating = (open: boolean) => {
    if (open) params.set('new', '1'); else params.delete('new');
    setParams(params, { replace: true });
  };

  const { data, isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: () => api<Paginated<SellerProduct>>(`/api/seller/products/?page_size=50${search ? `&search=${encodeURIComponent(search)}` : ''}`, { auth: true }),
    placeholderData: prev => prev,
  });
  const products = data?.results ?? [];

  const togglePublish = useMutation({
    mutationFn: (p: SellerProduct) => api(`/api/seller/products/${p.id}/`, { method: 'PATCH', auth: true, body: { published: !p.published } }),
    onSuccess: (_, p) => { toast.success(p.published ? 'Moved to draft' : 'Product is live'); qc.invalidateQueries({ queryKey: ['products'] }); },
    onError: e => toast.error(e instanceof ApiError ? e.message : 'Could not update product'),
  });

  return (
    <>
      <PageHeader
        title="Products"
        description={data ? `${data.count} product${data.count !== 1 ? 's' : ''} in your catalog` : 'Your catalog'}
        actions={<Button onClick={() => setCreating(true)}><Plus /> Add product</Button>}
      />
      <Card className="overflow-hidden">
        <div className="border-b border-border/60 p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search products" value={search} onChange={e => setSearch(e.target.value)} aria-label="Search products" />
          </div>
        </div>
        {isLoading ? (
          <div className="space-y-3 p-4">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}</div>
        ) : products.length === 0 ? (
          <EmptyState icon={<Package className="h-5 w-5" />} title={search ? 'No products match' : 'No products yet'}
            description={search ? 'Try a different search.' : 'Add your first product and it will appear on your store.'}
            action={!search && <Button onClick={() => setCreating(true)}><Plus /> Add product</Button>} />
        ) : (
          <ul className="divide-y divide-border/60">
            {products.map(p => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/60 bg-muted/40">
                  {p.image_url ? <img src={p.image_url} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-4 w-4 text-muted-foreground" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.category || 'Uncategorized'} · {p.stock_quantity} in stock</p>
                </div>
                <button type="button" onClick={() => togglePublish.mutate(p)} disabled={togglePublish.isPending} title={p.published ? 'Click to move to draft' : 'Click to publish'}>
                  <Badge tone={p.published ? 'green' : 'neutral'}>{p.published ? 'Live' : 'Draft'}</Badge>
                </button>
                <span className="hidden w-28 text-right font-mono text-sm tabular-nums sm:block">{fmtDalasi(p.price)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {creating && <NewProductDialog onClose={() => setCreating(false)} />}
    </>
  );
}

// ─── Add product ──────────────────────────────────────────────────────────────

const EMPTY = { name: '', price: '', stock_quantity: '10', category: '', description: '', image_url: '', publish: true };

function NewProductDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const set = <K extends keyof typeof EMPTY>(k: K, v: (typeof EMPTY)[K]) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const create = useMutation({
    mutationFn: async () => {
      const product = await api<SellerProduct>('/api/seller/products/', {
        method: 'POST', auth: true,
        body: {
          name: form.name.trim(), price: form.price, stock_quantity: Number(form.stock_quantity) || 0,
          category: form.category.trim(), description: form.description.trim(), image_url: form.image_url,
          image_urls: form.image_url ? [form.image_url] : [],
        },
      });
      // New products are created as drafts; publish in a second step if asked.
      if (form.publish) await api(`/api/seller/products/${product.id}/`, { method: 'PATCH', auth: true, body: { published: true } });
      return product;
    },
    onSuccess: () => {
      toast.success(form.publish ? 'Product added to your store' : 'Product saved as draft');
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
    },
    onError: e => toast.error(e instanceof ApiError ? e.message : 'Could not add the product'),
  });

  const submit = (e: FormEvent) => { e.preventDefault(); create.mutate(); };
  const valid = form.name.trim() && Number(form.price) > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="new-product-title" onClick={e => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-card shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
          <h2 id="new-product-title" className="text-base font-semibold">Add product</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close"><X /></Button>
        </div>
        <form id="new-product" onSubmit={submit} className="space-y-4 overflow-y-auto p-5">
          <div className="space-y-1.5">
            <Label>Photo</Label>
            <ImageInput id="product-image" value={form.image_url} onChange={v => set('image_url', v)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-name">Name</Label>
            <Input id="p-name" autoFocus required value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Cotton summer dress" maxLength={500} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="p-price">Price (D)</Label>
              <Input id="p-price" required inputMode="decimal" type="number" min="0" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-stock">In stock</Label>
              <Input id="p-stock" inputMode="numeric" type="number" min="0" value={form.stock_quantity} onChange={e => set('stock_quantity', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-category">Category <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <Input id="p-category" value={form.category} onChange={e => set('category', e.target.value)} placeholder="e.g. Dresses" maxLength={200} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-desc">Description <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <textarea id="p-desc" rows={3} value={form.description} onChange={e => set('description', e.target.value)}
              className="w-full resize-none rounded-md border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40" />
          </div>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <input type="checkbox" checked={form.publish} onChange={e => set('publish', e.target.checked)} className="h-4 w-4 accent-foreground" />
            Show on my store right away
          </label>
        </form>
        <div className="flex justify-end gap-2 border-t border-border/70 px-5 py-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="new-product" disabled={!valid || create.isPending}>
            {create.isPending && <Loader2 className="animate-spin" />} Add product
          </Button>
        </div>
      </div>
    </div>
  );
}
