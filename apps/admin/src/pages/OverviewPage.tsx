import { useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Wallet, ReceiptText, Package, Clock, ExternalLink, Copy, Paintbrush, Plus,
  Camera, Check, ImagePlus, Loader2, Share2, X, CreditCard, Link2,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, fmtDalasi, normalizeTheme, type PlatformStore } from '@cp/shared';
import { Button, Skeleton, cn } from '@cp/ui';
import { PageHeader } from '../components/AdminLayout';
import { ListRow, ListSection } from '../components/ios';
import { storefrontUrl, useMyStore, useProductChannels } from '../platform';
import { uploadImage } from '../upload';

interface DashboardStats {
  products: { total: number; published: number; draft: number; low_stock: number };
  orders: { total: number; pending: number; last_30d: number };
  revenue: { total: number; last_30d: number };
}

/** Widget-style stat tile. */
function Stat({ label, value, sub, icon: Icon, color, loading, to }: {
  label: string; value: string; sub: string; icon: typeof Wallet; color: string; loading: boolean; to: string;
}) {
  return (
    <Link to={to} className="block rounded-[20px] bg-card p-4 transition-transform active:scale-[0.97]">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full text-white" style={{ background: color }}><Icon className="h-4 w-4" /></span>
        <p className="text-[15px] font-semibold" style={{ color }}>{label}</p>
      </div>
      {loading ? <Skeleton className="mt-3 h-8 w-24" /> : <p className="mt-2.5 truncate text-[26px] font-bold tabular-nums tracking-tight">{value}</p>}
      <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{sub}</p>
    </Link>
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
    <li className="flex gap-3.5 border-b border-border/70 py-4 last:border-b-0">
      <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[15px] font-semibold',
        doneStep ? 'bg-[#34c759] text-white' : 'bg-muted text-foreground')}>
        {doneStep ? <Check className="h-[18px] w-[18px]" strokeWidth={3} /> : n}
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn('text-[17px] font-semibold leading-snug', doneStep && 'text-muted-foreground line-through decoration-1')}>{title}</p>
        {!doneStep && (
          <>
            <p className="mt-0.5 text-[15px] leading-snug text-muted-foreground">{text}</p>
            <div className="mt-3 flex flex-wrap gap-2">{children}</div>
          </>
        )}
      </div>
    </li>
  );

  return (
    <div className="mb-8 rounded-[20px] bg-card px-4 pt-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[20px] font-bold leading-tight">{welcome ? 'Your store is live! 🎉' : 'Finish setting up'}</p>
          <p className="mt-1 text-[15px] text-muted-foreground">{done} of 3 done — then you're ready for customers.</p>
        </div>
        <button type="button" aria-label="Hide checklist" onClick={() => { writeFlag(DISMISSED_KEY(store.id)); setDismissed(true); }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground active:opacity-60">
          <X className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuemin={0} aria-valuemax={3} aria-valuenow={done}>
        <div className="h-full rounded-full bg-[#34c759] transition-[width] duration-500" style={{ width: `${(done / 3) * 100}%` }} />
      </div>
      <ol className="mt-1">
        <Step n={1} doneStep={hasProduct} title="Add your first product" text="Take a photo, type a name and a price. About a minute.">
          <Button asChild><Link to="/products?new=1"><Camera /> Add a product</Link></Button>
        </Step>
        <Step n={2} doneStep={hasLogo} title="Add your logo" text="Your logo or a photo of your shop sign — it shows at the top of your store.">
          <Button variant="tinted" disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? <Loader2 className="animate-spin" /> : <ImagePlus />} Upload logo
          </Button>
          <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={e => { uploadLogo(e.target.files?.[0]); e.target.value = ''; }} />
        </Step>
        <Step n={3} doneStep={shared} title="Share your store" text="Send your link to your WhatsApp contacts and status.">
          <Button asChild className="bg-[#25D366] text-white hover:bg-[#1fb857]">
            <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" onClick={markShared}>
              <Share2 /> WhatsApp
            </a>
          </Button>
          <Button variant="tinted" onClick={() => navigator.clipboard.writeText(url).then(() => { toast.success('Store link copied'); markShared(); })}>
            <Copy /> Copy link
          </Button>
        </Step>
      </ol>
    </div>
  );
}

export default function OverviewPage() {
  const { data: store } = useMyStore();
  const { data: channels } = useProductChannels();
  const onMariseh = channels ? Object.values(channels).filter(c => c.visible).length : null;
  const [params] = useSearchParams();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api<DashboardStats>('/api/seller/dashboard/?range=30d', { auth: true }),
  });
  const url = store ? storefrontUrl(store.slug) : '';
  const welcome = params.get('welcome') === '1';
  const noProducts = !isLoading && (data?.products.total ?? 0) === 0;
  const copy = () => navigator.clipboard.writeText(url).then(() => toast.success('Store link copied'));

  return (
    <>
      <PageHeader
        title="Home"
        description={store ? (welcome ? `Welcome to ${store.name}` : `Welcome back, ${store.name}`) : undefined}
        actions={url && (
          <Button asChild variant="tinted" size="sm"><a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink /> View store</a></Button>
        )}
      />

      {store && !isLoading && <LaunchChecklist store={store} productCount={data?.products.total ?? 0} welcome={welcome} />}

      <h2 className="mb-2 px-1 text-[20px] font-bold">Last 30 days</h2>
      <div className="mb-8 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="Sales" icon={Wallet} color="#34c759" loading={isLoading} value={fmtDalasi(data?.revenue.last_30d)} sub="Money from orders" to="/orders" />
        <Stat label="Orders" icon={ReceiptText} color="#ff9500" loading={isLoading} value={String(data?.orders.last_30d ?? 0)} sub={`${data?.orders.pending ?? 0} waiting for you`} to="/orders" />
        <Stat label="Products" icon={Package} color="#007aff" loading={isLoading} value={String(data?.products.total ?? 0)} sub={`${onMariseh ?? data?.products.published ?? 0} in your store`} to="/products" />
        <Stat label="Low stock" icon={Clock} color="#af52de" loading={isLoading} value={String(data?.products.low_stock ?? 0)} sub="Products running out" to="/products" />
      </div>

      <ListSection header="Quick actions">
        <ListRow icon={Plus} iconColor="#34c759" title={noProducts ? 'Add your first product' : 'Add a product'} to="/products?new=1" />
        <ListRow icon={Paintbrush} iconColor="#ff2d55" title="Change how my store looks" to="/design" />
        {url && <ListRow icon={Share2} iconColor="#25d366" title="Share on WhatsApp" href={`https://wa.me/?text=${encodeURIComponent(`Visit my online store, ${store?.name}: ${url}`)}`} />}
        {url && <ListRow icon={Link2} iconColor="#007aff" title="Copy my store link" subtitle={url.replace(/^https?:\/\//, '')} onClick={copy} trailing={<Copy className="h-[18px] w-[18px] shrink-0 text-zinc-400" />} />}
      </ListSection>

      <ListSection header="Plan" footer="Monthly plans arrive soon. You'll see the price before anything is charged.">
        <ListRow icon={CreditCard} iconColor="#5856d6" title="Your plan" value="Trial" to="/billing" />
      </ListSection>
    </>
  );
}
