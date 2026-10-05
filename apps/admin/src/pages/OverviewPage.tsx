import { useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Wallet, ShoppingCart, Package, Clock, ArrowRight, ExternalLink, Copy, Paintbrush, Plus,
  Camera, Check, ImagePlus, Loader2, PartyPopper, Share2, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, fmtDalasi, normalizeTheme, type PlatformStore } from '@cp/shared';
import { Badge, Button, Card, Skeleton, cn } from '@cp/ui';
import { PageHeader } from '../components/AdminLayout';
import { storefrontUrl, useMyStore } from '../platform';
import { uploadImage } from '../upload';

interface DashboardStats {
  products: { total: number; published: number; draft: number; low_stock: number };
  orders: { total: number; pending: number; last_30d: number };
  revenue: { total: number; last_30d: number };
}

function Stat({ label, value, sub, icon: Icon, loading }: {
  label: string; value: string; sub: string; icon: typeof Wallet; loading: boolean;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className="rounded-lg bg-muted/60 p-2"><Icon className="h-4 w-4 text-muted-foreground" /></div>
      </div>
      {loading ? <Skeleton className="mt-2 h-8 w-28" /> : <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>}
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </Card>
  );
}

// ─── Launch checklist (first-time merchants) ──────────────────────────────────

const SHARED_KEY = (id: string) => `cp_shared_${id}`;
const DISMISSED_KEY = (id: string) => `cp_launch_dismissed_${id}`;
const readFlag = (k: string) => { try { return localStorage.getItem(k) === '1'; } catch { return false; } };
const writeFlag = (k: string) => { try { localStorage.setItem(k, '1'); } catch { /* storage unavailable */ } };

function LaunchChecklist({ store, productCount, welcome }: { store: PlatformStore; productCount: number; welcome: boolean }) {
  const qc = useQueryClient();
  const url = storefrontUrl(store.slug);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [shared, setShared] = useState(() => readFlag(SHARED_KEY(store.id)));
  const [dismissed, setDismissed] = useState(() => readFlag(DISMISSED_KEY(store.id)));

  const hasProduct = productCount > 0;
  const hasLogo = !!store.theme?.brand?.logoUrl;
  const done = [hasProduct, hasLogo, shared].filter(Boolean).length;
  if (dismissed || done === 3) return null;

  const uploadLogo = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const logoUrl = await uploadImage(file);
      const theme = normalizeTheme(store.theme, store.name);
      await api(`/api/platform/stores/${store.id}/`, { method: 'PATCH', auth: true, body: { theme: { ...theme, brand: { ...theme.brand, logoUrl } } } });
      await qc.invalidateQueries({ queryKey: ['my-stores'] });
      toast.success('Logo added to your store');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not upload your logo');
    } finally {
      setUploading(false);
    }
  };

  const markShared = () => { writeFlag(SHARED_KEY(store.id)); setShared(true); };
  const shareText = `Visit my online store, ${store.name}: ${url}`;

  const Step = ({ n, doneStep, title, text, children }: { n: number; doneStep: boolean; title: string; text: string; children: React.ReactNode }) => (
    <li className={cn('flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:p-5', doneStep ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border/70 bg-card')}>
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold', doneStep ? 'bg-emerald-600 text-white' : 'bg-muted text-foreground')}>
        {doneStep ? <Check className="h-5 w-5" /> : n}
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn('text-base font-semibold', doneStep && 'text-muted-foreground line-through decoration-1')}>{title}</p>
        {!doneStep && <p className="mt-0.5 text-sm text-muted-foreground">{text}</p>}
      </div>
      {!doneStep && <div className="flex shrink-0 flex-wrap gap-2">{children}</div>}
    </li>
  );

  return (
    <Card className="mb-6 overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-border/60 bg-muted/30 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <PartyPopper className="h-5 w-5 text-emerald-600" />
            {welcome ? 'Your store is live!' : 'Finish setting up your store'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Three quick steps and you're ready for your first customers. <span className="font-medium text-foreground">{done} of 3 done.</span></p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><a href={url} target="_blank" rel="noopener noreferrer">See my store <ExternalLink /></a></Button>
          <Button variant="ghost" size="icon" aria-label="Hide checklist" onClick={() => { writeFlag(DISMISSED_KEY(store.id)); setDismissed(true); }}><X /></Button>
        </div>
      </div>
      <ol className="space-y-3 p-4 sm:p-6">
        <Step n={1} doneStep={hasProduct} title="Add your first product" text="Take a photo with your phone, type a name and price — it takes about a minute.">
          <Button asChild size="lg"><Link to="/products?new=1"><Camera /> Add a product</Link></Button>
        </Step>
        <Step n={2} doneStep={hasLogo} title="Add your logo" text="Upload your logo or a photo of your shop sign. It appears at the top of your store.">
          <Button size="lg" variant="outline" disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? <Loader2 className="animate-spin" /> : <ImagePlus />} Upload logo
          </Button>
          <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={e => { uploadLogo(e.target.files?.[0]); e.target.value = ''; }} />
        </Step>
        <Step n={3} doneStep={shared} title="Share your store" text="Send your store link to your WhatsApp contacts and status so customers can start shopping.">
          <Button asChild size="lg" className="bg-[#25D366] text-white hover:bg-[#1fb857]">
            <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" onClick={markShared}>
              <Share2 /> Share on WhatsApp
            </a>
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigator.clipboard.writeText(url).then(() => { toast.success('Store link copied'); markShared(); })}>
            <Copy /> Copy link
          </Button>
        </Step>
      </ol>
    </Card>
  );
}

export default function OverviewPage() {
  const { data: store } = useMyStore();
  const [params] = useSearchParams();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api<DashboardStats>('/api/seller/dashboard/?range=30d', { auth: true }),
  });
  const url = store ? storefrontUrl(store.slug) : '';
  const noProducts = !isLoading && (data?.products.total ?? 0) === 0;

  return (
    <>
      <PageHeader
        title={store ? (params.get('welcome') === '1' ? `Welcome to ${store.name}` : `Welcome back, ${store.name}`) : 'Overview'}
        description="Your store at a glance."
        actions={url && (
          <Button asChild variant="outline"><a href={url} target="_blank" rel="noopener noreferrer">View store <ExternalLink /></a></Button>
        )}
      />

      {store && !isLoading && (
        <LaunchChecklist store={store} productCount={data?.products.total ?? 0} welcome={params.get('welcome') === '1'} />
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Card className="flex items-start gap-4 p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted"><Paintbrush className="h-5 w-5" /></div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold">Customize your store</h2>
            <p className="mt-1 text-sm text-muted-foreground">Change colours, fonts and sections, and see it live as you edit.</p>
            <Button asChild size="sm" className="mt-3"><Link to="/design">Open designer <ArrowRight /></Link></Button>
          </div>
        </Card>
        <Card className="flex items-start gap-4 p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted"><Package className="h-5 w-5" /></div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold">{noProducts ? 'Add your first product' : 'Manage products'}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{noProducts ? 'Your store is ready — add products so customers can order.' : 'Update prices, stock and photos.'}</p>
            <Button asChild size="sm" variant={noProducts ? 'primary' : 'outline'} className="mt-3">
              <Link to="/products?new=1">{noProducts ? <><Plus /> Add product</> : <>Go to products <ArrowRight /></>}</Link>
            </Button>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Revenue" icon={Wallet} loading={isLoading} value={fmtDalasi(data?.revenue.last_30d)} sub="Last 30 days" />
        <Stat label="Orders" icon={ShoppingCart} loading={isLoading} value={String(data?.orders.last_30d ?? 0)} sub="Last 30 days" />
        <Stat label="Products" icon={Package} loading={isLoading} value={String(data?.products.total ?? 0)} sub={`${data?.products.published ?? 0} live · ${data?.products.draft ?? 0} draft`} />
        <Stat label="Pending orders" icon={Clock} loading={isLoading} value={String(data?.orders.pending ?? 0)} sub="Waiting for action" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Your store link</h2>
            {store && <Badge tone={store.published ? 'green' : 'neutral'}>{store.published ? 'Live' : 'Hidden'}</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Share it with customers on WhatsApp, Instagram or anywhere else.</p>
          {url && (
            <div className="mt-4 flex gap-2">
              <code className="flex-1 truncate rounded-md border border-border/70 bg-muted/40 px-3 py-2 text-xs">{url}</code>
              <Button variant="outline" size="sm" className="h-9" onClick={() => navigator.clipboard.writeText(url).then(() => toast.success('Link copied'))}>
                <Copy /> Copy
              </Button>
            </div>
          )}
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Plan</h2>
            <Badge tone="amber">Trial</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Subscriptions and invoices arrive with the billing release.</p>
          <Button asChild variant="ghost" size="sm" className="mt-3 -ml-3">
            <Link to="/billing">See billing <ArrowRight /></Link>
          </Button>
        </Card>
      </div>
    </>
  );
}
