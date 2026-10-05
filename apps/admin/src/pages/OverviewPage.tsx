import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Wallet, ShoppingCart, Package, Clock, ArrowRight, ExternalLink, Copy, Paintbrush, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { api, fmtDalasi } from '@cp/shared';
import { Badge, Button, Card, Skeleton } from '@cp/ui';
import { PageHeader } from '../components/AdminLayout';
import { storefrontUrl, useMyStore } from '../platform';

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

export default function OverviewPage() {
  const { data: store } = useMyStore();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api<DashboardStats>('/api/seller/dashboard/?range=30d', { auth: true }),
  });
  const url = store ? storefrontUrl(store.slug) : '';
  const noProducts = !isLoading && (data?.products.total ?? 0) === 0;

  return (
    <>
      <PageHeader
        title={store ? `Welcome back, ${store.name}` : 'Overview'}
        description="Your store at a glance."
        actions={url && (
          <Button asChild variant="outline"><a href={url} target="_blank" rel="noopener noreferrer">View store <ExternalLink /></a></Button>
        )}
      />

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
