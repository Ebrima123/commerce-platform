import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, CheckCircle2, Loader2, X, XCircle } from 'lucide-react';
import { api, ApiError, type PlatformStore } from '@cp/shared';
import { Button, Card, Label } from '@cp/ui';
import { selectStoreId, storeAddressParts } from '../platform';
import { useSlugCheck } from './StartPage';

// Back from ModemPay after paying for an extra store. The store is created by
// the payment webhook (never by this page), so we wait for it here.

interface Purchase {
  id: string;
  status: 'pending' | 'paid' | 'completed' | 'cancelled';
  slug: string;
  name: string;
  amount: number;
  error: string;
  store: PlatformStore | null;
}

const GIVE_UP_AFTER = 3 * 60_000;

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 text-center">
      <Card className="w-full max-w-md p-8">{children}</Card>
    </div>
  );
}

export default function StorePaymentPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const id = params.get('purchase');
  const cancelled = params.get('cancelled') === '1';
  const [slowly, setSlowly] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);

  const { data: p, isError } = useQuery({
    queryKey: ['store-purchase', id],
    queryFn: () => api<Purchase>(`/api/platform/store-purchases/${id}/`, { auth: true }),
    enabled: !!id,
    // Poll until ModemPay's confirmation has created the store.
    refetchInterval: q => {
      const s = q.state.data?.status;
      return s === 'completed' || s === 'cancelled' || (s === 'paid' && q.state.data?.error) || gaveUp ? false : 2500;
    },
    // Keep checking even if the merchant switched apps (e.g. back from the Wave app).
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    const a = setTimeout(() => setSlowly(true), 45_000);
    const b = setTimeout(() => setGaveUp(true), GIVE_UP_AFTER);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);

  // Done: open the new store.
  useEffect(() => {
    if (p?.status !== 'completed' || !p.store) return;
    selectStoreId(p.store.id);
    qc.removeQueries({ predicate: q => q.queryKey[0] !== 'my-stores' });
    qc.invalidateQueries({ queryKey: ['my-stores'] }).then(() => navigate('/?welcome=1', { replace: true }));
  }, [p, qc, navigate]);

  if (!id || isError) {
    return (
      <Shell>
        <XCircle className="mx-auto h-10 w-10 text-destructive" />
        <h1 className="mt-4 text-xl font-semibold">We couldn't find this payment</h1>
        <p className="mt-2 text-sm text-muted-foreground">If you were charged, your store will appear in My stores shortly.</p>
        <Button asChild className="mt-6"><Link to="/stores">Go to My stores</Link></Button>
      </Shell>
    );
  }

  if (p?.status === 'completed') {
    return (
      <Shell>
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
        <h1 className="mt-4 text-xl font-semibold">{p.name} is ready</h1>
        <p className="mt-2 text-sm text-muted-foreground">Opening your new store…</p>
      </Shell>
    );
  }

  if (p?.status === 'paid' && p.error === 'slug_taken') return <PickNewAddress purchase={p} onDone={() => qc.invalidateQueries({ queryKey: ['store-purchase', id] })} />;

  // Came back via ModemPay's cancel link and nothing was paid.
  if ((cancelled && (!p || p.status === 'pending')) || p?.status === 'cancelled') {
    return (
      <Shell>
        <XCircle className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold">Payment cancelled</h1>
        <p className="mt-2 text-sm text-muted-foreground">You weren't charged, and no store was created.</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild><Link to="/start?new=1">Try again</Link></Button>
          <Button asChild variant="outline"><Link to="/">Back to my store</Link></Button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <Loader2 className="mx-auto h-10 w-10 animate-spin text-brand" />
      <h1 className="mt-4 text-xl font-semibold">{p?.status === 'paid' ? 'Payment received — creating your store…' : 'Confirming your payment…'}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {gaveUp
          ? "ModemPay hasn't confirmed the payment yet. If you paid, your store will be created as soon as it does — check My stores in a few minutes."
          : slowly ? 'This is taking a little longer than usual. Please keep this page open.' : 'This usually takes a few seconds.'}
      </p>
      {gaveUp && <Button asChild variant="outline" className="mt-6"><Link to="/stores">Go to My stores</Link></Button>}
    </Shell>
  );
}

/** Paid, but someone else took the address meanwhile — choose another (no new payment). */
function PickNewAddress({ purchase, onDone }: { purchase: Purchase; onDone: () => void }) {
  const [slug, setSlug] = useState(`${purchase.slug}-shop`);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { checking, result } = useSlugCheck(slug);
  const ok = !!result?.available && result.slug === slug;
  const address = storeAddressParts();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api(`/api/platform/store-purchases/${purchase.id}/complete/`, { method: 'POST', auth: true, body: { slug } });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Shell>
      <form onSubmit={submit} className="text-left">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
        <h1 className="mt-4 text-center text-xl font-semibold">Payment received</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Someone took <span className="font-medium text-foreground">{purchase.slug}{address.suffix}</span> while you were paying. Pick another address — no extra charge.
        </p>
        <div className="mt-6 space-y-1.5">
          <Label htmlFor="new-slug">Store address</Label>
          <div className="flex h-11 items-center rounded-md border border-input bg-card focus-within:ring-2 focus-within:ring-ring/40">
            <input id="new-slug" value={slug} maxLength={40} autoFocus
              onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              className="h-full min-w-0 flex-1 bg-transparent pl-3 text-sm outline-none" />
            {address.suffix && <span className="truncate pr-3 text-sm text-muted-foreground">{address.suffix}</span>}
          </div>
          <p className="flex items-center gap-1.5 text-xs" aria-live="polite">
            {checking ? <><Loader2 className="h-3 w-3 animate-spin" /> Checking…</>
              : ok ? <><Check className="h-3.5 w-3.5 text-emerald-600" /> Available</>
              : result ? <><X className="h-3.5 w-3.5 text-destructive" /><span className="text-destructive">{result.reason}</span></> : null}
          </p>
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
        <Button type="submit" className="mt-6 w-full" disabled={!ok || saving}>
          {saving ? <Loader2 className="animate-spin" /> : `Create ${purchase.name}`}
        </Button>
      </form>
    </Shell>
  );
}
