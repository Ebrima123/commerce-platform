import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, ChevronDown, Copy, ExternalLink, Globe, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError, type StoreDomain } from '@cp/shared';
import { Button, Skeleton } from '@cp/ui';
import { PageHeader } from '../components/AdminLayout';
import { Panel } from '../components/ios';
import { storefrontUrl, useMyStore } from '../platform';

// Connect a domain the merchant already owns (awafashion.com). Mariseh adds
// it to the storefront; the merchant points their DNS here; HTTPS is automatic.

interface DomainsResponse { configured: boolean; domains: StoreDomain[] }

const REGISTRAR_HELP: { name: string; steps: string[] }[] = [
  { name: 'Namecheap', steps: ['Domain List → Manage next to your domain', 'Open the Advanced DNS tab', 'Delete any existing A record for @ and CNAME for www (e.g. parking pages)', 'Add new record for each row above, then save with the ✓'] },
  { name: 'GoDaddy', steps: ['My Products → your domain → DNS', 'Edit the existing A record for @ (and CNAME for www) or add them', 'Use the values above and save'] },
  { name: 'Cloudflare', steps: ['Your domain → DNS → Records', 'Add the records above', 'Important: set Proxy status to "DNS only" (grey cloud), not proxied'] },
  { name: 'Other registrars', steps: ['Find "DNS", "DNS settings" or "Manage DNS" for your domain', 'Add each record above (Type, Name/Host, Value/Points to)', '"@" means the domain itself — some registrars want it left blank'] },
];

/** "3 minutes ago" */
function timeAgo(iso: string) {
  const secs = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  if (secs < 60) return rtf.format(-secs, 'second');
  if (secs < 3600) return rtf.format(-Math.round(secs / 60), 'minute');
  if (secs < 86400) return rtf.format(-Math.round(secs / 3600), 'hour');
  return rtf.format(-Math.round(secs / 86400), 'day');
}

function copy(text: string) {
  navigator.clipboard?.writeText(text).then(() => toast.success('Copied'), () => toast.error("Couldn't copy"));
}

function StatusBadge({ status }: { status: StoreDomain['status'] }) {
  return status === 'active' ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[12px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
      <CheckCircle2 className="h-3.5 w-3.5" /> Connected
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[12px] font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Waiting for DNS
    </span>
  );
}

function RecordsTable({ d }: { d: StoreDomain }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="hidden grid-cols-[70px_110px_1fr] gap-3 bg-muted/60 px-3 py-2 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground sm:grid">
        <span>Type</span><span>Name / Host</span><span>Value / Points to</span>
      </div>
      {d.records.map((r, i) => (
        <div key={i} className="grid grid-cols-1 gap-1 border-t border-border px-3 py-3 first:border-t-0 sm:grid-cols-[70px_110px_1fr] sm:items-center sm:gap-3 sm:first:border-t">
          <span className="text-[13px] font-semibold"><span className="text-muted-foreground sm:hidden">Type: </span>{r.type}</span>
          <button type="button" onClick={() => copy(r.name)} className="flex items-center gap-1.5 text-left font-mono text-[13px]" title="Copy">
            <span className="font-sans text-muted-foreground sm:hidden">Name: </span>{r.name}<Copy className="h-3 w-3 shrink-0 text-muted-foreground" />
          </button>
          <div className="min-w-0">
            <button type="button" onClick={() => copy(r.value)} className="flex max-w-full items-center gap-1.5 text-left font-mono text-[13px]" title="Copy">
              <span className="font-sans text-muted-foreground sm:hidden">Value: </span><span className="break-all">{r.value}</span><Copy className="h-3 w-3 shrink-0 text-muted-foreground" />
            </button>
            {r.purpose && <p className="mt-0.5 text-[12px] text-muted-foreground">{r.purpose}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function RegistrarHelp() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="divide-y divide-border rounded-xl border border-border">
      {REGISTRAR_HELP.map(r => (
        <div key={r.name}>
          <button type="button" onClick={() => setOpen(o => o === r.name ? null : r.name)}
            className="flex w-full items-center justify-between px-3 py-2.5 text-left text-[15px] font-medium">
            {r.name}<ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open === r.name ? 'rotate-180' : ''}`} />
          </button>
          {open === r.name && (
            <ol className="list-decimal space-y-1 px-3 pb-3 pl-8 text-[14px] text-muted-foreground">
              {r.steps.map(s => <li key={s}>{s}</li>)}
            </ol>
          )}
        </div>
      ))}
    </div>
  );
}

export function DomainsPage() {
  const qc = useQueryClient();
  const { data: store } = useMyStore();
  const [input, setInput] = useState('');
  const key = ['store-domains', store?.id];

  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: () => api<DomainsResponse>(`/api/platform/stores/${store!.id}/domains/`, { auth: true }),
    enabled: !!store,
    // Keep checking while waiting for the merchant's DNS change to take effect.
    refetchInterval: q => (q.state.data?.domains.some(d => d.status !== 'active') ? 30_000 : false),
  });
  const domain = data?.domains[0];

  const setDomains = (domains: StoreDomain[]) => {
    qc.setQueryData<DomainsResponse>(key, old => ({ configured: old?.configured ?? true, domains }));
    qc.invalidateQueries({ queryKey: ['my-stores'] });
  };
  const errorMessage = (e: unknown) => (e instanceof ApiError ? e.message : 'Something went wrong. Please try again.');

  const connect = useMutation({
    mutationFn: (name: string) => api<StoreDomain>(`/api/platform/stores/${store!.id}/domains/`, { method: 'POST', body: { domain: name }, auth: true }),
    onSuccess: d => { setDomains([d]); setInput(''); toast.success(`${d.domain} added — now update its DNS`); },
    onError: e => toast.error(errorMessage(e)),
  });
  const check = useMutation({
    mutationFn: (id: number) => api<StoreDomain>(`/api/platform/stores/${store!.id}/domains/${id}/check/`, { method: 'POST', auth: true }),
    onSuccess: d => {
      setDomains([d]);
      if (d.status === 'active') toast.success(`${d.domain} is connected 🎉`);
      else toast.info("Not connected yet. DNS changes can take a while — we'll keep checking.");
    },
    onError: e => toast.error(errorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: (id: number) => api(`/api/platform/stores/${store!.id}/domains/${id}/`, { method: 'DELETE', auth: true }),
    onSuccess: () => { setDomains([]); toast.success('Domain disconnected'); },
    onError: e => toast.error(errorMessage(e)),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim()) connect.mutate(input.trim());
  };
  const freeUrl = store ? storefrontUrl(store.slug) : '';

  return (
    <>
      <PageHeader title="Domains" description="Where customers find your store." back={{ to: '/more', label: 'More' }} />
      <div className="space-y-5">
        <Panel title="Your free Mariseh address">
          <div className="flex items-center justify-between gap-3">
            <a href={freeUrl} target="_blank" rel="noopener noreferrer" className="min-w-0 truncate text-[15px] font-medium text-brand">
              {freeUrl.replace(/^https?:\/\//, '')}
            </a>
            <button type="button" onClick={() => copy(freeUrl)} className="shrink-0 rounded-full p-2 text-muted-foreground hover:bg-muted" aria-label="Copy address"><Copy className="h-4 w-4" /></button>
          </div>
          {domain?.status === 'active' && (
            <p className="mt-1 text-[13px] text-muted-foreground">Visitors to this address are sent to {domain.domain} automatically.</p>
          )}
        </Panel>

        {isLoading || !store ? (
          <Skeleton className="h-40 w-full rounded-2xl" />
        ) : !domain ? (
          <Panel title="Connect a domain you own">
            <p className="mb-3 text-[15px] text-muted-foreground">
              Already have a domain like <span className="font-medium text-foreground">yourshop.com</span>? Connect it and customers can reach your store there. Secure HTTPS is set up for you.
            </p>
            {data && !data.configured ? (
              <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-[14px] text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
                Connecting domains isn't switched on yet. Please check back soon.
              </p>
            ) : (
              <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input value={input} onChange={e => setInput(e.target.value)} placeholder="yourshop.com" autoCapitalize="none" autoCorrect="off" spellCheck={false} inputMode="url"
                    className="h-11 w-full rounded-xl bg-muted pl-9 pr-3 text-base outline-none focus:ring-2 focus:ring-brand/40" aria-label="Your domain" />
                </div>
                <Button type="submit" disabled={!input.trim() || connect.isPending} className="h-11">
                  {connect.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Connect domain'}
                </Button>
              </form>
            )}
            <p className="mt-3 text-[13px] text-muted-foreground">Don't have a domain yet? Buying one right here in Mariseh is coming soon.</p>
          </Panel>
        ) : (
          <>
            <Panel
              title={<span className="flex items-center gap-2 break-all">{domain.domain}</span>}
              action={<StatusBadge status={domain.status} />}
            >
              {domain.status === 'active' ? (
                <div className="space-y-3">
                  <p className="text-[15px]">Your store is live at your own domain{domain.is_apex ? ` (www.${domain.domain} works too)` : ''}.</p>
                  <a href={domain.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[15px] font-medium text-brand">
                    Open {domain.domain} <ExternalLink className="h-4 w-4" />
                  </a>
                  {domain.connected_at && <p className="text-[13px] text-muted-foreground">Connected {timeAgo(domain.connected_at)}</p>}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-[15px] font-semibold">Point your domain to Mariseh</p>
                    <p className="mt-1 text-[14px] text-muted-foreground">
                      Sign in where you bought <span className="font-medium text-foreground">{domain.domain}</span> (Namecheap, GoDaddy…), open its DNS settings and add these records. Tap a value to copy it.
                    </p>
                  </div>
                  {domain.records.length ? <RecordsTable d={domain} /> : <Skeleton className="h-24 w-full rounded-xl" />}
                  <p className="text-[13px] text-muted-foreground">
                    Remove any other record for the same name (like a parking page). Changes usually work within an hour but can take up to 48 hours — this page keeps checking on its own.
                  </p>
                  <div>
                    <p className="mb-2 text-[13px] font-medium uppercase tracking-wide text-muted-foreground">Step-by-step for your registrar</p>
                    <RegistrarHelp />
                  </div>
                </div>
              )}
              {domain.last_error && <p className="mt-3 text-[13px] text-destructive">{domain.last_error}</p>}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                <p className="text-[13px] text-muted-foreground">
                  {domain.last_checked_at ? `Checked ${timeAgo(domain.last_checked_at)}` : 'Not checked yet'}
                </p>
                <div className="flex gap-2">
                  {domain.status !== 'active' && (
                    <Button variant="outline" size="sm" onClick={() => check.mutate(domain.id)} disabled={check.isPending}>
                      {check.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Check now
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="text-destructive" disabled={remove.isPending}
                    onClick={() => { if (window.confirm(`Disconnect ${domain.domain}? Your store will only be reachable at ${freeUrl.replace(/^https?:\/\//, '')}.`)) remove.mutate(domain.id); }}>
                    <Trash2 className="h-4 w-4" /> Remove
                  </Button>
                </div>
              </div>
            </Panel>
          </>
        )}
      </div>
    </>
  );
}

export default DomainsPage;
