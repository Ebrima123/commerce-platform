import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ReceiptText } from 'lucide-react';
import { api, fmtDalasi, type Paginated } from '@cp/shared';
import { Badge, EmptyState, Skeleton } from '@cp/ui';
import { PageHeader } from '../components/AdminLayout';
import { FilterPills, ListSection, SearchField } from '../components/ios';
import { ORDER_STATUS, fmtDate, type Order } from '../commerce';

type OrdersResponse = Paginated<Order> & { facets?: { total: number; status: Record<string, number> } };

const TABS = ['', 'processing', 'shipped', 'delivered', 'payment_pending', 'cancelled'] as const;

export default function OrdersPage() {
  const [status, setStatus] = useState<(typeof TABS)[number]>('');
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['orders', status, search],
    queryFn: () => api<OrdersResponse>(`/api/seller/orders/?page_size=50${status ? `&status=${status}` : ''}${search ? `&search=${encodeURIComponent(search)}` : ''}`, { auth: true }),
    placeholderData: prev => prev,
  });
  const orders = data?.results ?? [];
  const counts = data?.facets?.status ?? {};

  return (
    <>
      <PageHeader title="Orders" description={data?.facets ? `${data.facets.total} order${data.facets.total !== 1 ? 's' : ''}` : undefined} />

      <FilterPills value={status} onChange={setStatus} options={TABS.map(t => ({
        value: t, label: t ? ORDER_STATUS[t].label : 'All', count: t ? counts[t] ?? 0 : data?.facets?.total,
      }))} />
      <SearchField value={search} onChange={setSearch} placeholder="Search by order number, name or phone" />

      {isLoading ? (
        <div className="space-y-px overflow-hidden rounded-2xl bg-card">{[0, 1, 2].map(i => <Skeleton key={i} className="h-[68px] rounded-none" />)}</div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl bg-card">
          <EmptyState icon={<ReceiptText className="h-6 w-6" />} title={search || status ? 'No orders here' : 'No orders yet'}
            description={search || status ? 'Try another filter or search.' : 'When customers order from your store, you’ll see them here.'} />
        </div>
      ) : (
        <ListSection>
          {orders.map(o => {
            const st = ORDER_STATUS[o.status] ?? { label: o.status, tone: 'neutral' as const };
            const count = (o.items ?? []).reduce((n, i) => n + (Number(i.quantity) || 1), 0);
            return (
              <Link key={o.id} to={`/orders/${o.id}`} className="block pl-4 transition-colors hover:bg-muted/40 active:bg-muted/80">
                <div className="ios-sep flex min-h-[68px] items-center gap-3 border-b border-border/70 py-3 pr-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[17px] leading-snug">
                      <span className="font-semibold">#{o.order_number}</span> · {o.user || o.deliver_to || 'Customer'}
                    </p>
                    <p className="mt-0.5 truncate text-[15px] text-muted-foreground">{fmtDate(o.created_at)} · {count} item{count !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-[17px] font-semibold tabular-nums">{fmtDalasi(o.total_amount)}</span>
                    <Badge tone={st.tone}>{st.label}</Badge>
                  </div>
                </div>
              </Link>
            );
          })}
        </ListSection>
      )}
    </>
  );
}
