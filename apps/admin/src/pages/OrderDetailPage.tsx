import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Circle, ImageIcon, Loader2, MapPin, Phone, Truck, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError, fmtDalasi } from '@cp/shared';
import { Badge, Button, Skeleton, cn } from '@cp/ui';
import { PageHeader } from '../components/AdminLayout';
import { Panel } from '../components/ios';
import { NEXT_STEP, ORDER_STATUS, fmtDate, itemImage, itemName, itemOptions, waLink, type Order } from '../commerce';

const WhatsApp = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M12.05 2a9.9 9.9 0 0 0-8.53 14.9L2 22l5.24-1.37A9.9 9.9 0 1 0 12.05 2Zm5.4 13.98c-.23.64-1.33 1.22-1.83 1.3-.47.07-1.06.1-1.71-.11-.4-.12-.9-.29-1.55-.57-2.73-1.18-4.51-3.93-4.65-4.11-.14-.18-1.11-1.47-1.11-2.81 0-1.34.7-2 .95-2.27.25-.27.54-.34.72-.34h.52c.17 0 .39-.06.61.47.23.55.77 1.89.84 2.03.07.14.11.3.02.48-.09.18-.14.3-.27.46-.14.16-.29.36-.41.48-.14.14-.28.29-.12.56.16.27.71 1.17 1.52 1.9 1.05.93 1.93 1.22 2.2 1.36.27.14.43.11.59-.07.16-.18.68-.79.86-1.07.18-.27.36-.23.61-.14.25.09 1.59.75 1.86.89.27.14.45.2.52.32.07.11.07.66-.16 1.3Z" />
  </svg>
);

const STEPS = ['processing', 'shipped', 'delivered'] as const;

export default function OrderDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api<Order>(`/api/seller/orders/${id}/`, { auth: true }),
  });

  const advance = useMutation({
    mutationFn: (to: string) => api<Order>(`/api/seller/orders/${id}/`, { method: 'PATCH', auth: true, body: { status: to } }),
    onSuccess: o => {
      qc.setQueryData(['order', id], o);
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(o.status === 'delivered' ? 'Marked as delivered 🎉' : 'Marked as sent');
    },
    onError: e => toast.error(e instanceof ApiError ? e.message : 'Could not update the order'),
  });

  if (isLoading) {
    return (
      <>
        <PageHeader title="Order" back={{ to: '/orders', label: 'Orders' }} />
        <div className="grid gap-4 lg:grid-cols-[1fr_300px]"><Skeleton className="h-80 rounded-2xl" /><Skeleton className="h-56 rounded-2xl" /></div>
      </>
    );
  }
  if (isError || !order) {
    return <><PageHeader title="Order not found" back={{ to: '/orders', label: 'Orders' }} /><p className="text-muted-foreground">It may belong to another store.</p></>;
  }

  const st = ORDER_STATUS[order.status] ?? { label: order.status, tone: 'neutral' as const, help: '' };
  const next = NEXT_STEP[order.status];
  const customer = order.user || order.deliver_to || 'Customer';
  const items = order.items ?? [];
  const discount = Number(order.discount_amount) || 0;
  const stepIndex = STEPS.indexOf(order.status as (typeof STEPS)[number]);
  const wa = waLink(order.contact_number, `Hello ${customer}, this is about your order #${order.order_number}.`);
  const payment = order.payment_method === 'wave' ? 'Wave' : order.payment_method === 'cod' || /cash/i.test(order.payment_method) ? 'Cash on delivery' : order.payment_method || '—';

  return (
    <>
      <PageHeader title={`#${order.order_number}`} back={{ to: '/orders', label: 'Orders' }}
        description={<span className="inline-flex flex-wrap items-center gap-2"><Badge tone={st.tone}>{st.label}</Badge>{fmtDate(order.created_at, true)}</span>} />

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          {/* Progress + next step */}
          {order.status !== 'cancelled' && (
            <Panel>
              <ol className="flex items-center">
                {STEPS.map((s, i) => {
                  const done = stepIndex >= i;
                  return (
                    <li key={s} className={cn('flex items-center', i < STEPS.length - 1 && 'flex-1')}>
                      <span className="flex flex-col items-center gap-1">
                        <span className={cn('flex h-8 w-8 items-center justify-center rounded-full', done ? 'bg-[#34c759] text-white' : 'bg-muted text-muted-foreground')}>
                          {done ? <Check className="h-4 w-4" strokeWidth={3} /> : <Circle className="h-3 w-3" />}
                        </span>
                        <span className={cn('text-[12px] font-medium', done ? 'text-foreground' : 'text-muted-foreground')}>{ORDER_STATUS[s].label}</span>
                      </span>
                      {i < STEPS.length - 1 && <span className={cn('mx-2 mb-5 h-0.5 flex-1 rounded-full', stepIndex > i ? 'bg-[#34c759]' : 'bg-muted')} />}
                    </li>
                  );
                })}
              </ol>
              <p className="mt-3 text-[15px] text-muted-foreground">{st.help}</p>
              {next && (
                <Button size="lg" className="mt-3 w-full sm:w-auto" disabled={advance.isPending} onClick={() => advance.mutate(next.to)}>
                  {advance.isPending ? <Loader2 className="animate-spin" /> : next.to === 'shipped' ? <Truck /> : <Check />} {next.label}
                </Button>
              )}
            </Panel>
          )}

          <Panel title={`Items (${items.length})`}>
            <ul className="divide-y divide-border/70">
              {items.map((it, i) => {
                const qty = Number(it.quantity) || 1;
                return (
                  <li key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
                      {itemImage(it) ? <img src={itemImage(it)} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-5 w-5 text-muted-foreground" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-[15px] font-medium leading-snug">{itemName(it)}</p>
                      <p className="mt-0.5 text-[13px] text-muted-foreground">{[itemOptions(it), `${fmtDalasi(it.price)} × ${qty}`].filter(Boolean).join(' · ')}</p>
                    </div>
                    <p className="shrink-0 text-[15px] font-semibold tabular-nums">{fmtDalasi(Number(it.price) * qty)}</p>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel title="Payment">
            <dl className="space-y-2 text-[15px]">
              <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="tabular-nums">{fmtDalasi(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Delivery</dt><dd className="tabular-nums">{Number(order.shipping) ? fmtDalasi(order.shipping) : 'Free'}</dd></div>
              {discount > 0 && <div className="flex justify-between"><dt className="text-muted-foreground">Discount{order.discount_name ? ` (${order.discount_name})` : ''}</dt><dd className="tabular-nums">−{fmtDalasi(discount)}</dd></div>}
              <div className="flex justify-between border-t border-border/70 pt-2 text-[17px] font-semibold"><dt>Total</dt><dd className="tabular-nums">{fmtDalasi(order.total_amount)}</dd></div>
            </dl>
            <p className="mt-3 flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2.5 text-[15px]">
              <Wallet className="h-4 w-4 text-muted-foreground" /> {payment}{order.wave_number ? ` · ${order.wave_number}` : ''}
            </p>
            {order.refund_status && order.refund_status !== 'none' && (
              <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2.5 text-[15px] text-amber-900">
                Refund {order.refund_status.replace(/_/g, ' ')}{order.refund_amount ? ` · ${fmtDalasi(order.refund_amount)}` : ''}{order.refund_reason ? ` — ${order.refund_reason}` : ''}
              </p>
            )}
            {order.status === 'cancelled' && order.cancel_reason && <p className="mt-2 text-[15px] text-destructive">Cancelled: {order.cancel_reason}</p>}
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Customer">
            <p className="text-[17px] font-semibold">{customer}</p>
            {order.contact_number && <p className="mt-1 flex items-center gap-2 text-[15px] text-muted-foreground"><Phone className="h-4 w-4" />{order.contact_number}</p>}
            {order.delivery_location && <p className="mt-1 flex items-start gap-2 text-[15px] text-muted-foreground"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{order.delivery_location}</p>}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {wa && <Button asChild className="bg-[#25D366] text-white hover:bg-[#1fb857]"><a href={wa} target="_blank" rel="noopener noreferrer"><WhatsApp className="h-[18px] w-[18px]" /> WhatsApp</a></Button>}
              {order.contact_number && <Button asChild variant="outline"><a href={`tel:${order.contact_number.replace(/[^\d+]/g, '')}`}><Phone /> Call</a></Button>}
            </div>
          </Panel>

          <Panel title="Timeline">
            <ol className="space-y-3 text-[15px]">
              {order.updated_at && order.updated_at !== order.created_at && (
                <li className="flex gap-3"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" /><div><p>{st.label}</p><p className="text-[13px] text-muted-foreground">{fmtDate(order.updated_at, true)}</p></div></li>
              )}
              {order.cancelled_at && (
                <li className="flex gap-3"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-destructive" /><div><p>Cancelled</p><p className="text-[13px] text-muted-foreground">{fmtDate(order.cancelled_at, true)}</p></div></li>
              )}
              <li className="flex gap-3"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-zinc-300" /><div><p>Order placed</p><p className="text-[13px] text-muted-foreground">{fmtDate(order.created_at, true)}</p></div></li>
            </ol>
          </Panel>
        </div>
      </div>
    </>
  );
}
