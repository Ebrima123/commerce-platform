import { useQuery } from '@tanstack/react-query';
import { ShoppingCart } from 'lucide-react';
import { api, fmtDalasi, type Paginated } from '@cp/shared';
import { Badge, Card, EmptyState, Skeleton } from '@cp/ui';
import { PageHeader } from '../components/AdminLayout';

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

export default function OrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api<Paginated<Order>>('/api/seller/orders/?page_size=50', { auth: true }),
  });
  const orders = data?.results ?? [];

  return (
    <>
      <PageHeader title="Orders" description={data ? `${data.count} orders` : 'Orders from your store'} />
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="space-y-3 p-4">{[0, 1, 2].map(i => <Skeleton key={i} className="h-12" />)}</div>
        ) : orders.length === 0 ? (
          <EmptyState icon={<ShoppingCart className="h-5 w-5" />} title="No orders yet" description="Orders placed on your store will appear here." />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2.5">Order</th>
                <th className="hidden px-4 py-2.5 sm:table-cell">Date</th>
                <th className="px-4 py-2.5">Customer</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {orders.map(o => (
                <tr key={o.id}>
                  <td className="px-4 py-3 font-mono font-medium">#{o.order_number}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{new Date(o.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td className="max-w-[180px] truncate px-4 py-3">{o.deliver_to}</td>
                  <td className="px-4 py-3"><Badge tone={TONE[o.status] ?? 'neutral'} className="capitalize">{o.status.replace('_', ' ')}</Badge></td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">{fmtDalasi(o.total_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
