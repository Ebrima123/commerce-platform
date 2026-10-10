import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ImageIcon, Loader2, Package, Plus, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError, fmtDalasi, type Paginated, type Product } from '@cp/shared';
import { Button, EmptyState, Skeleton } from '@cp/ui';
import { PageHeader } from '../components/AdminLayout';
import { BarButton, FieldRow, FilterPills, ListSection, Sheet, Switch, plainInput } from '../components/ios';
import { MultiImageInput } from '../design/FieldControls';
import { useProductChannels, useUpdateProductChannel } from '../platform';

type SellerProduct = Product & { published: boolean; sku: string };

export default function ProductsPage() {
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
  const all = data?.results ?? [];
  // Shown on Mariseh — its own switch, separate from the Alfudi marketplace.
  const { data: channels } = useProductChannels();
  const live = (p: SellerProduct) => channels?.[p.id]?.visible ?? p.published;
  const [status, setStatus] = useState<'' | 'active' | 'draft'>('');
  const products = all.filter(p => !status || (status === 'active') === live(p));

  const updateChannel = useUpdateProductChannel();
  const toggle = (p: SellerProduct) => updateChannel.mutate({ id: p.id, visible: !live(p) }, {
    onSuccess: c => toast.success(c.visible ? 'Now showing in your store' : 'Hidden from your store'),
    onError: e => toast.error(e instanceof ApiError ? e.message : 'Could not update product'),
  });


  return (
    <>
      <PageHeader
        title="Products"
        description={data ? `${data.count} product${data.count !== 1 ? 's' : ''}` : undefined}
        actions={<Button size="sm" variant="tinted" onClick={() => setCreating(true)}><Plus /> Add</Button>}
      />

      <FilterPills value={status} onChange={setStatus} options={[
        { value: '', label: 'All', count: all.length },
        { value: 'active', label: 'Active', count: all.filter(live).length },
        { value: 'draft', label: 'Draft', count: all.filter(p => !live(p)).length },
      ]} />

      <div className="relative mb-5">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
        <input type="search" enterKeyHint="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search" aria-label="Search products"
          className="h-10 w-full rounded-xl border-0 bg-muted pl-10 pr-9 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/30 [&::-webkit-search-cancel-button]:hidden" />
        {search && (
          <button type="button" onClick={() => setSearch('')} aria-label="Clear search"
            className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-zinc-400 text-white">
            <X className="h-3 w-3" strokeWidth={3} />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-px overflow-hidden rounded-2xl bg-card">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-[72px] rounded-none" />)}</div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl bg-card">
          <EmptyState icon={<Package className="h-6 w-6" />} title={search ? 'No products match' : 'No products yet'}
            description={search ? 'Try a different word.' : 'Add your first product and it will appear in your store.'}
            action={!search && <Button size="lg" onClick={() => setCreating(true)}><Plus /> Add product</Button>} />
        </div>
      ) : (
        <ListSection footer="Switch a product off to hide it from your store without deleting it.">
          {products.map(p => (
            <div key={p.id} className="flex items-center gap-3 pl-4 transition-colors hover:bg-muted/40">
              <Link to={`/products/${p.id}`} className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
                {p.image_url ? <img src={p.image_url} alt="" loading="lazy" className="h-full w-full object-cover" /> : <ImageIcon className="h-5 w-5 text-muted-foreground" />}
              </Link>
              <div className="ios-sep flex min-h-[76px] min-w-0 flex-1 items-center gap-3 border-b border-border/70 py-3 pr-4">
                <Link to={`/products/${p.id}`} className="min-w-0 flex-1">
                  <p className="truncate text-[17px] leading-snug">{p.name}</p>
                  <p className="mt-0.5 truncate text-[15px] text-muted-foreground">
                    <span className="font-medium text-foreground tabular-nums">{fmtDalasi(p.price)}</span> · {p.stock_quantity} in stock
                  </p>
                </Link>
                <Switch checked={live(p)} onChange={() => toggle(p)} disabled={updateChannel.isPending}
                  label={live(p) ? `Hide ${p.name} from store` : `Show ${p.name} in store`} />
              </div>
            </div>
          ))}
        </ListSection>
      )}

      <NewProductSheet open={creating} onClose={() => setCreating(false)} />
    </>
  );
}

// ─── Add product ──────────────────────────────────────────────────────────────

const EMPTY = { name: '', price: '', stock_quantity: '10', category: '', description: '', images: [] as string[], publish: true };

function NewProductSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const set = <K extends keyof typeof EMPTY>(k: K, v: (typeof EMPTY)[K]) => setForm(f => ({ ...f, [k]: v }));
  const close = () => { setForm(EMPTY); onClose(); };

  const create = useMutation({
    mutationFn: async () => {
      const product = await api<SellerProduct>('/api/seller/products/', {
        method: 'POST', auth: true,
        body: {
          name: form.name.trim(), price: form.price, stock_quantity: Number(form.stock_quantity) || 0,
          category: form.category.trim(), description: form.description.trim(),
          image_url: form.images[0] ?? '', image_urls: form.images,
          // Live on Mariseh straight away (if asked); Alfudi reviews it before it goes on their marketplace.
          channel: 'mariseh', visible: form.publish,
        },
      });
      return product;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['product-channels'] });
      toast.success(form.publish ? 'Product added to your store' : 'Product saved (hidden)');
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      close();
    },
    onError: e => toast.error(e instanceof ApiError ? e.message : 'Could not add the product'),
  });

  const submit = (e: FormEvent) => { e.preventDefault(); if (valid) create.mutate(); };
  const valid = !!form.name.trim() && Number(form.price) > 0;

  return (
    <Sheet open={open} onClose={close} title="New product"
      leading={<BarButton onClick={close}>Cancel</BarButton>}
      trailing={<BarButton bold type="submit" form="new-product" disabled={!valid || create.isPending}>
        {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Add
      </BarButton>}>
      <form id="new-product" onSubmit={submit}>
        <ListSection header="Photos" footer="The first photo is the one customers see first.">
          <div className="p-3"><MultiImageInput id="product-images" values={form.images} onChange={v => set('images', v)} /></div>
        </ListSection>

        <ListSection>
          <FieldRow label="Name" htmlFor="p-name">
            <input id="p-name" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Cotton summer dress" maxLength={500} className={plainInput} />
          </FieldRow>
          <FieldRow label="Price (Dalasi)" htmlFor="p-price">
            <input id="p-price" required inputMode="decimal" type="number" min="0" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} placeholder="0.00" className={plainInput} />
          </FieldRow>
          <FieldRow label="How many do you have?" htmlFor="p-stock">
            <input id="p-stock" inputMode="numeric" type="number" min="0" value={form.stock_quantity} onChange={e => set('stock_quantity', e.target.value)} className={plainInput} />
          </FieldRow>
        </ListSection>

        <ListSection header="Optional">
          <FieldRow label="Category" htmlFor="p-category">
            <input id="p-category" value={form.category} onChange={e => set('category', e.target.value)} placeholder="e.g. Dresses" maxLength={200} className={plainInput} />
          </FieldRow>
          <FieldRow label="Description" htmlFor="p-desc">
            <textarea id="p-desc" rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Size, colour, material…"
              className={`${plainInput} h-auto resize-none py-1 leading-snug`} />
          </FieldRow>
        </ListSection>

        <ListSection>
          <div className="flex min-h-[52px] items-center justify-between gap-3 px-4">
            <span className="text-[17px]">Show in my store now</span>
            <Switch checked={form.publish} onChange={v => set('publish', v)} label="Show in my store now" />
          </div>
        </ListSection>

        <Button type="submit" size="lg" className="mb-2 w-full" disabled={!valid || create.isPending}>
          {create.isPending && <Loader2 className="animate-spin" />} Add product
        </Button>
      </form>
    </Sheet>
  );
}
