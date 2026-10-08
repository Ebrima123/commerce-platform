import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Phone, Users } from 'lucide-react';
import { api, fmtDalasi, type Paginated } from '@cp/shared';
import { Badge, Button, EmptyState, Skeleton } from '@cp/ui';
import { PageHeader } from '../components/AdminLayout';
import { BarButton, ListSection, SearchField, Sheet } from '../components/ios';
import { ORDER_STATUS, fmtDate, waLink, type Order } from '../commerce';

interface Customer {
  key: string;
  name: string;
  phone: string;
  location: string;
  orders: Order[];
  spent: number;
  last: string;
}

const MAX_PAGES = 5; // 500 most recent orders

/** Customers, built from orders (people who bought from you), grouped by phone number. */
function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const orders: Order[] = [];
      for (let page = 1; page <= MAX_PAGES; page++) {
        const res = await api<Paginated<Order>>(`/api/seller/orders/?page_size=100&page=${page}`, { auth: true });
        orders.push(...res.results);
        if (!res.next) break;
      }
      const map = new Map<string, Customer>();
      for (const o of orders) {
        const key = o.contact_number.replace(/\D/g, '').slice(-7) || (o.user || o.deliver_to || '').trim().toLowerCase();
        if (!key) continue;
        const c = map.get(key) ?? { key, name: o.user || o.deliver_to || 'Customer', phone: o.contact_number, location: o.delivery_location, orders: [], spent: 0, last: o.created_at };
        c.orders.push(o);
        if (o.status !== 'cancelled') c.spent += Number(o.total_amount) || 0;
        if (o.created_at > c.last) { c.last = o.created_at; c.location = o.delivery_location || c.location; }
        map.set(key, c);
      }
      return [...map.values()].sort((a, b) => b.last.localeCompare(a.last));
    },
  });
}

export default function CustomersPage() {
  const { data: customers = [], isLoading } = useCustomers();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState<Customer | null>(null);
  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter(c => !q || `${c.name} ${c.phone} ${c.location}`.toLowerCase().includes(q));
  }, [customers, search]);
  const repeat = customers.filter(c => c.orders.length > 1).length;

  return (
    <>
      <PageHeader title="Customers" back={{ to: '/more', label: 'More' }}
        description={customers.length ? `${customers.length} customer${customers.length !== 1 ? 's' : ''} · ${repeat} came back` : undefined} />
      <SearchField value={search} onChange={setSearch} placeholder="Search by name, phone or area" />

      {isLoading ? (
        <div className="space-y-px overflow-hidden rounded-2xl bg-card">{[0, 1, 2].map(i => <Skeleton key={i} className="h-[68px] rounded-none" />)}</div>
      ) : shown.length === 0 ? (
        <div className="rounded-2xl bg-card">
          <EmptyState icon={<Users className="h-6 w-6" />} title={search ? 'No one found' : 'No customers yet'}
            description={search ? 'Try another name or number.' : 'Everyone who orders from your store shows up here, with what they bought.'} />
        </div>
      ) : (
        <ListSection footer="Built from your orders. Tap someone to see what they bought or message them.">
          {shown.map(c => (
            <button key={c.key} type="button" onClick={() => setOpen(c)} className="flex w-full items-center gap-3 pl-4 text-left transition-colors hover:bg-muted/40 active:bg-muted/80">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[17px] font-semibold text-brand">{c.name.charAt(0).toUpperCase()}</span>
              <span className="ios-sep flex min-h-[68px] min-w-0 flex-1 items-center gap-3 border-b border-border/70 py-3 pr-4">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[17px] leading-snug">{c.name}</span>
                  <span className="mt-0.5 block truncate text-[15px] text-muted-foreground">{c.phone || 'No phone'} · {c.orders.length} order{c.orders.length !== 1 ? 's' : ''}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-[17px] font-semibold tabular-nums">{fmtDalasi(c.spent)}</span>
                  <span className="block text-[13px] text-muted-foreground">spent</span>
                </span>
              </span>
            </button>
          ))}
        </ListSection>
      )}

      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.name ?? ''} trailing={<BarButton bold onClick={() => setOpen(null)}>Done</BarButton>}>
        {open && <CustomerDetail c={open} />}
      </Sheet>
    </>
  );
}

function CustomerDetail({ c }: { c: Customer }) {
  const wa = waLink(c.phone, `Hello ${c.name}! 👋`);
  return (
    <>
      <div className="mb-6 grid grid-cols-3 gap-2 text-center">
        {[[String(c.orders.length), 'Orders'], [fmtDalasi(c.spent), 'Spent'], [fmtDate(c.last), 'Last order']].map(([v, l]) => (
          <div key={l} className="rounded-2xl bg-card px-2 py-3">
            <p className="truncate text-[17px] font-semibold tabular-nums">{v}</p>
            <p className="text-[13px] text-muted-foreground">{l}</p>
          </div>
        ))}
      </div>
      {(wa || c.phone) && (
        <div className="mb-6 grid grid-cols-2 gap-2">
          {wa && <Button asChild className="bg-[#25D366] text-white hover:bg-[#1fb857]"><a href={wa} target="_blank" rel="noopener noreferrer">WhatsApp</a></Button>}
          {c.phone && <Button asChild variant="outline"><a href={`tel:${c.phone.replace(/[^\d+]/g, '')}`}><Phone /> Call</a></Button>}
        </div>
      )}
      {c.location && <p className="mb-6 px-1 text-[15px] text-muted-foreground">Delivers to: <span className="text-foreground">{c.location}</span></p>}
      <ListSection header="Orders">
        {c.orders.map(o => {
          const st = ORDER_STATUS[o.status] ?? { label: o.status, tone: 'neutral' as const };
          return (
            <Link key={o.id} to={`/orders/${o.id}`} className="block pl-4 hover:bg-muted/40">
              <span className="ios-sep flex min-h-[56px] items-center gap-3 border-b border-border/70 py-2.5 pr-4">
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold">#{o.order_number}</span>
                  <span className="block text-[13px] text-muted-foreground">{fmtDate(o.created_at)}</span>
                </span>
                <Badge tone={st.tone}>{st.label}</Badge>
                <span className="w-24 text-right text-[15px] font-semibold tabular-nums">{fmtDalasi(o.total_amount)}</span>
              </span>
            </Link>
          );
        })}
      </ListSection>
    </>
  );
}
