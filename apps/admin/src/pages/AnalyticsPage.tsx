import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { api, fmtDalasi } from '@cp/shared';
import { Skeleton, cn } from '@cp/ui';
import { PageHeader } from '../components/AdminLayout';
import { FilterPills, Panel } from '../components/ios';
import { ORDER_STATUS } from '../commerce';

interface Analytics {
  range: string;
  series: { date: string; label: string; revenue: number; orders: number }[];
  summary: { revenue: number; orders: number; units: number; prev_revenue: number; prev_orders: number; prev_units: number };
  top_products: { name: string; revenue: number; units: number }[];
  status_breakdown: Record<string, number>;
}

type Range = '7d' | '30d' | '90d' | '12m';
const RANGES: { value: Range; label: string }[] = [
  { value: '7d', label: '7 days' }, { value: '30d', label: '30 days' }, { value: '90d', label: '90 days' }, { value: '12m', label: '12 months' },
];

// One series → one hue (Mariseh green, validated ≥3:1 on the card surface), no legend.
const SERIES = 'hsl(var(--brand))';
const STATUS_COLOR: Record<string, string> = { pending: '#8e8e93', processing: '#ff9500', shipped: '#007aff', delivered: '#34c759', cancelled: '#ff3b30' };

export default function AnalyticsPage() {
  const [range, setRange] = useState<Range>('30d');
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', range],
    queryFn: () => api<Analytics>(`/api/seller/analytics/?range=${range}`, { auth: true }),
    placeholderData: prev => prev,
  });
  const s = data?.summary;
  const aov = s && s.orders ? s.revenue / s.orders : 0;
  const prevAov = s && s.prev_orders ? s.prev_revenue / s.prev_orders : 0;
  const period = RANGES.find(r => r.value === range)!.label.toLowerCase();

  return (
    <>
      <PageHeader title="Analytics" back={{ to: '/more', label: 'More' }} description={`How your store did in the last ${period}`} />
      <FilterPills value={range} onChange={setRange} options={RANGES} />

      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi label="Sales" value={s ? fmtDalasi(s.revenue) : ''} now={s?.revenue} prev={s?.prev_revenue} loading={isLoading} />
        <Kpi label="Orders" value={s ? String(s.orders) : ''} now={s?.orders} prev={s?.prev_orders} loading={isLoading} />
        <Kpi label="Items sold" value={s ? String(s.units) : ''} now={s?.units} prev={s?.prev_units} loading={isLoading} />
        <Kpi label="Average order" value={s ? fmtDalasi(aov) : ''} now={aov} prev={prevAov} loading={isLoading} />
      </div>

      <Panel title="Sales over time" className="mb-4">
        {isLoading || !data ? <Skeleton className="h-56 rounded-xl" /> : <SalesChart series={data.series} />}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Best sellers">
          {!data ? <Skeleton className="h-40 rounded-xl" /> : data.top_products.length === 0 ? (
            <p className="text-[15px] text-muted-foreground">Your best-selling products will show here after your first orders.</p>
          ) : (
            <ul className="space-y-3">
              {data.top_products.map(p => {
                const max = data.top_products[0].revenue || 1;
                return (
                  <li key={p.name}>
                    <div className="mb-1 flex items-baseline justify-between gap-3 text-[15px]">
                      <span className="truncate">{p.name}</span>
                      <span className="shrink-0 font-semibold tabular-nums">{fmtDalasi(p.revenue)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full" style={{ width: `${Math.max(2, (p.revenue / max) * 100)}%`, background: SERIES }} />
                      </div>
                      <span className="w-14 shrink-0 text-right text-[13px] text-muted-foreground tabular-nums">{p.units} sold</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Orders by status">
          {!data ? <Skeleton className="h-40 rounded-xl" /> : (
            <ul className="space-y-2.5">
              {Object.entries(data.status_breakdown).map(([k, n]) => {
                const total = Object.values(data.status_breakdown).reduce((a, b) => a + b, 0) || 1;
                return (
                  <li key={k} className="flex items-center gap-3 text-[15px]">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: STATUS_COLOR[k] ?? '#8e8e93' }} aria-hidden />
                    <span className="w-28 shrink-0">{ORDER_STATUS[k]?.label ?? k}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full" style={{ width: `${(n / total) * 100}%`, background: STATUS_COLOR[k] ?? '#8e8e93' }} />
                    </div>
                    <span className="w-8 shrink-0 text-right font-semibold tabular-nums">{n}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

function Kpi({ label, value, now, prev, loading }: { label: string; value: string; now?: number; prev?: number; loading: boolean }) {
  const change = now !== undefined && prev ? Math.round(((now - prev) / prev) * 100) : null;
  const Icon = change === null || change === 0 ? Minus : change > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="rounded-[20px] bg-card p-4">
      <p className="text-[15px] font-medium text-muted-foreground">{label}</p>
      {loading ? <Skeleton className="mt-2 h-8 w-24" /> : <p className="mt-1 truncate text-[24px] font-bold tabular-nums tracking-tight">{value}</p>}
      <p className={cn('mt-0.5 flex items-center gap-0.5 text-[13px] font-medium',
        change === null || change === 0 ? 'text-muted-foreground' : change > 0 ? 'text-[#248a3d]' : 'text-destructive')}>
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {change === null ? 'No earlier data' : `${change > 0 ? '+' : ''}${change}% vs before`}
      </p>
    </div>
  );
}

/** Column chart: one series, thin rounded columns, hover tooltip, table view. */
function SalesChart({ series }: { series: Analytics['series'] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const max = Math.max(...series.map(d => d.revenue), 0);
  const ticks = useMemo(() => niceTicks(max), [max]);
  const top = ticks[ticks.length - 1] || 1;
  const W = 640, H = 200, padL = 48, padB = 22, padT = 8;
  const plotW = W - padL, plotH = H - padB - padT;
  const band = plotW / Math.max(series.length, 1);
  const barW = Math.min(24, Math.max(2, band - 2));
  const labelEvery = Math.ceil(series.length / 6);
  const fmtTick = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1).replace(/\.0$/, '')}k` : String(v));
  const total = series.reduce((a, d) => a + d.revenue, 0);

  if (!total) return <p className="py-10 text-center text-[15px] text-muted-foreground">No sales in this period yet.</p>;

  return (
    <div>
      <div className="mb-2 flex justify-end">
        <button type="button" onClick={() => setTable(t => !t)} className="text-[13px] font-medium text-brand">{table ? 'Show chart' : 'Show as table'}</button>
      </div>
      {table ? (
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-[15px]">
            <thead><tr className="text-left text-[13px] text-muted-foreground"><th className="py-1 font-medium">Date</th><th className="py-1 text-right font-medium">Orders</th><th className="py-1 text-right font-medium">Sales</th></tr></thead>
            <tbody className="divide-y divide-border/60">
              {series.map(d => <tr key={d.date}><td className="py-1.5">{d.label}</td><td className="py-1.5 text-right tabular-nums">{d.orders}</td><td className="py-1.5 text-right tabular-nums">{fmtDalasi(d.revenue)}</td></tr>)}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Sales over time, total ${fmtDalasi(total)}`} onMouseLeave={() => setHover(null)}>
            {ticks.map(t => {
              const y = padT + plotH - (t / top) * plotH;
              return (
                <g key={t}>
                  <line x1={padL} x2={W} y1={y} y2={y} stroke="hsl(var(--border))" strokeWidth={1} />
                  <text x={padL - 8} y={y + 4} textAnchor="end" className="fill-muted-foreground text-[11px]">{fmtTick(t)}</text>
                </g>
              );
            })}
            {series.map((d, i) => {
              const h = (d.revenue / top) * plotH;
              const x = padL + i * band + (band - barW) / 2;
              const y = padT + plotH - h;
              const r = Math.min(4, barW / 2, h);
              return (
                <g key={d.date} onMouseEnter={() => setHover(i)} onTouchStart={() => setHover(i)}>
                  <rect x={padL + i * band} y={padT} width={band} height={plotH} fill="transparent" />
                  {h > 0 && (
                    <path d={`M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + barW - r} Q${x + barW},${y} ${x + barW},${y + r} V${y + h} Z`}
                      fill={SERIES} opacity={hover === null || hover === i ? 1 : 0.45} />
                  )}
                  {i % labelEvery === 0 && <text x={padL + i * band + band / 2} y={H - 6} textAnchor="middle" className="fill-muted-foreground text-[11px]">{d.label}</text>}
                </g>
              );
            })}
          </svg>
          {hover !== null && series[hover] && (
            <div className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-xl bg-zinc-900 px-3 py-2 text-[13px] text-white shadow-lg"
              style={{ left: `${((padL + hover * band + band / 2) / W) * 100}%` }}>
              <p className="font-semibold">{series[hover].label}</p>
              <p className="tabular-nums">{fmtDalasi(series[hover].revenue)} · {series[hover].orders} order{series[hover].orders !== 1 ? 's' : ''}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Clean axis ticks: 0 and three round steps covering max. */
function niceTicks(max: number) {
  if (max <= 0) return [0, 1];
  const rough = max / 3;
  const mag = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= rough) ?? 10 * mag;
  return [0, step, step * 2, step * 3].filter((t, i) => i === 0 || t - step < max);
}
