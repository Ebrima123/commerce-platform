import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Check, Copy, ExternalLink, Eye, EyeOff, Loader2, Paintbrush, Pencil, Plus, Store, X,
} from 'lucide-react';
import { api, ApiError, INDUSTRIES, normalizeTheme, type IndustryKey, type PlatformStore } from '@cp/shared';
import { Badge, Button, Card, Input, Skeleton, cn } from '@cp/ui';
import { PageHeader } from '../components/AdminLayout';
import { storefrontUrl, useMyStore, useMyStores, useSwitchStore } from '../platform';

const MAX_STORES = 10; // mirrors MAX_STORES_PER_OWNER in estore-backend/platform_stores/views.py

/** Small visual of the store: its hero photo (if any) washed in its brand colour. */
function StorePreview({ store }: { store: PlatformStore }) {
  const theme = normalizeTheme(store.theme, store.name);
  const hero = theme.sections.find(s => s.type === 'hero');
  const image = typeof hero?.settings.imageUrl === 'string' ? hero.settings.imageUrl.replace(/w=\d+/, 'w=600') : '';
  return (
    <div className="relative aspect-[16/9] overflow-hidden rounded-t-xl" style={{ background: theme.brand.primaryColor }}>
      {image && <img src={image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 p-4">
        {theme.brand.logoUrl ? (
          <img src={theme.brand.logoUrl} alt="" className="h-10 w-10 rounded-lg bg-white object-contain p-1" />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-semibold text-white" style={{ background: theme.brand.primaryColor }}>
            {store.name.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="text-xs font-medium text-white/85">
          {INDUSTRIES[store.industry as IndustryKey]?.label ?? 'Store'}
        </span>
      </div>
    </div>
  );
}

function StoreCard({ store, current }: { store: PlatformStore; current: boolean }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const switchStore = useSwitchStore();
  const url = storefrontUrl(store.slug);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(store.name);

  const update = useMutation({
    mutationFn: (body: Partial<Pick<PlatformStore, 'name' | 'published'>>) =>
      api<PlatformStore>(`/api/platform/stores/${store.id}/`, { method: 'PATCH', auth: true, body }),
    onSuccess: (s, body) => {
      qc.invalidateQueries({ queryKey: ['my-stores'] });
      if ('published' in body) toast.success(s.published ? `${s.name} is live` : `${s.name} is hidden — visitors see "Coming soon"`);
      if ('name' in body) { toast.success('Store renamed'); setRenaming(false); }
    },
    onError: e => toast.error(e instanceof ApiError ? e.message : 'Could not update the store'),
  });

  const open = (to: string) => { switchStore(store.id); navigate(to); };
  const rename = (e: FormEvent) => { e.preventDefault(); if (name.trim() && name.trim() !== store.name) update.mutate({ name: name.trim() }); else setRenaming(false); };

  return (
    <Card className={cn('flex flex-col overflow-hidden', current && 'ring-2 ring-foreground')}>
      <StorePreview store={store} />
      <div className="flex flex-1 flex-col p-4">
        {renaming ? (
          <form onSubmit={rename} className="flex gap-2">
            <Input autoFocus value={name} onChange={e => setName(e.target.value)} maxLength={200} aria-label="Store name" />
            <Button type="submit" size="icon" disabled={update.isPending} aria-label="Save name">{update.isPending ? <Loader2 className="animate-spin" /> : <Check />}</Button>
            <Button type="button" size="icon" variant="ghost" onClick={() => { setName(store.name); setRenaming(false); }} aria-label="Cancel"><X /></Button>
          </form>
        ) : (
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="flex items-center gap-2 truncate text-base font-semibold">
                {store.name}
                <button type="button" onClick={() => setRenaming(true)} aria-label={`Rename ${store.name}`} className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </p>
              <a href={url} target="_blank" rel="noopener noreferrer" className="block truncate text-xs text-muted-foreground hover:underline">
                {url.replace(/^https?:\/\//, '')}
              </a>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <Badge tone={store.published ? 'green' : 'neutral'}>{store.published ? 'Live' : 'Hidden'}</Badge>
              {current && <span className="text-[11px] font-medium text-muted-foreground">Managing now</span>}
            </div>
          </div>
        )}
        <p className="mt-2 text-xs text-muted-foreground">Created {new Date(store.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>

        <div className="mt-4 flex flex-1 flex-col justify-end gap-2">
          <Button onClick={() => open('/')} variant={current ? 'outline' : 'primary'} className="w-full">
            <Store /> {current ? 'Go to dashboard' : 'Manage this store'}
          </Button>
          <div className="grid grid-cols-4 gap-1.5">
            <Button variant="outline" size="icon" className="w-full" onClick={() => open('/design')} aria-label="Open designer" title="Open designer"><Paintbrush /></Button>
            <Button asChild variant="outline" size="icon" className="w-full" title="View store">
              <a href={url} target="_blank" rel="noopener noreferrer" aria-label="View store"><ExternalLink /></a>
            </Button>
            <Button variant="outline" size="icon" className="w-full" title="Copy link" aria-label="Copy store link"
              onClick={() => navigator.clipboard.writeText(url).then(() => toast.success('Store link copied'))}><Copy /></Button>
            <Button variant="outline" size="icon" className="w-full" disabled={update.isPending}
              title={store.published ? 'Hide store' : 'Make store live'} aria-label={store.published ? 'Hide store' : 'Make store live'}
              onClick={() => update.mutate({ published: !store.published })}>
              {store.published ? <EyeOff /> : <Eye />}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function StoresPage() {
  const { data: stores, isLoading } = useMyStores();
  const { data: current } = useMyStore();
  // Oldest first reads naturally as "my first store, my second store…".
  const ordered = [...(stores ?? [])].reverse();
  const atLimit = (stores?.length ?? 0) >= MAX_STORES;

  return (
    <>
      <PageHeader
        title="My stores"
        description={stores ? `You have ${stores.length} store${stores.length !== 1 ? 's' : ''}. Pick one to manage, or open a new one.` : 'All your stores in one place.'}
        actions={!atLimit && <Button asChild><Link to="/start?new=1"><Plus /> Add a new store</Link></Button>}
      />

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map(i => <Skeleton key={i} className="h-80 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {ordered.map(s => <StoreCard key={s.id} store={s} current={s.id === current?.id} />)}
          {atLimit ? (
            <Card className="flex min-h-[200px] flex-col items-center justify-center p-6 text-center text-sm text-muted-foreground">
              You've reached the limit of {MAX_STORES} stores.
            </Card>
          ) : (
            <Link to="/start?new=1"
              className="group flex min-h-[320px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-6 text-center transition-colors hover:border-foreground/40 hover:bg-muted/40">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted transition-transform group-hover:scale-105"><Plus className="h-6 w-6" /></span>
              <span className="mt-4 text-base font-semibold">Add a new store</span>
              <span className="mt-1 max-w-[220px] text-sm text-muted-foreground">Sell something different? Open another shop in a few clicks.</span>
            </Link>
          )}
        </div>
      )}
    </>
  );
}
