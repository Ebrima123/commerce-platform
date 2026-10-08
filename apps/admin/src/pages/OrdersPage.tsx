import { useQuery } from '@tanstack/react-query';
import { ReceiptText } from 'lucide-react';
import { api, fmtDalasi, type Paginated } from '@cp/shared';
import { Badge, EmptyState, Skeleton } from '@cp/ui';
import { PageHeader } from '../components/AdminLayout';
import { ListSection } from '../components/ios';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: string | number;
  deliver_to: string;
  created_at: string;
}

const TONE: Record<string, 'neutral' | 'green' | 'amber' | 'red'> = {
  delivered: 'green', processing: 'amber', payment_pending: 'amber', cancelled: 'red',
};

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default function OrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api<Paginated<Order>>('/api/seller/orders/?page_size=50', { auth: true }),
  });
  const orders = data?.results ?? [];

  return (
    <>
      <PageHeader title="Orders" description={data ? `${data.count} order${data.count !== 1 ? 's' : ''}` : undefined} />
      {isLoading ? (
        <div className="space-y-px overflow-hidden rounded-2xl bg-card">{[0, 1, 2].map(i => <Skeleton key={i} className="h-[68px] rounded-none" />)}</div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl bg-card">
          <EmptyState icon={<ReceiptText className="h-6 w-6" />} title="No orders yet" description="When customers order from your store, you'll see them here." />
        </div>
      ) : (
        <ListSection>
          {orders.map(o => (
            <div key={o.id} className="pl-4">
              <div className="ios-sep flex min-h-[68px] items-center gap-3 border-b border-border/70 py-3 pr-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[17px] leading-snug">{o.deliver_to || 'Customer'}</p>
                  <p className="mt-0.5 truncate text-[15px] text-muted-foreground">#{o.order_number} · {fmtDate(o.created_at)}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-[17px] font-semibold tabular-nums">{fmtDalasi(o.total_amount)}</span>
                  <Badge tone={TONE[o.status] ?? 'neutral'} className="capitalize">{o.status.replace(/_/g, ' ')}</Badge>
                </div>
              </div>
            </div>
          ))}
        </ListSection>
      )}
    </>
  );
}
