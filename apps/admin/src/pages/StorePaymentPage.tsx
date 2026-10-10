import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { api } from '@cp/shared';
import { Button, Card } from '@cp/ui';

// Back from ModemPay after paying to unlock another store. Mariseh asks
// ModemPay whether the payment went through (each poll of the purchase does
// that check on the server) — the ?status in the URL is never trusted. Once
// it's confirmed, the store form opens.

interface Purchase { id: string; status: 'pending' | 'paid' | 'completed' | 'cancelled'; unlocked: boolean }

const GIVE_UP_AFTER = 3 * 60_000;

function Shell({ children }: { children: ReactNode }) {
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
    refetchInterval: q => (q.state.data?.status === 'pending' && !gaveUp ? 2500 : q.state.data ? false : 2500),
    // Keep checking even if the merchant switched apps (e.g. back from the Wave app).
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    const a = setTimeout(() => setSlowly(true), 45_000);
    const b = setTimeout(() => setGaveUp(true), GIVE_UP_AFTER);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);

  // Paid → open the store form.
  useEffect(() => {
    if (p?.status !== 'paid') return;
    qc.removeQueries({ queryKey: ['store-unlocks'] });
    const t = setTimeout(() => navigate('/start?new=1', { replace: true }), 1200);
    return () => clearTimeout(t);
  }, [p?.status, qc, navigate]);

  if (!id || isError) {
    return (
      <Shell>
        <XCircle className="mx-auto h-10 w-10 text-destructive" />
        <h1 className="mt-4 text-xl font-semibold">We couldn't find this payment</h1>
        <p className="mt-2 text-sm text-muted-foreground">If you were charged, you can create your new store from My stores.</p>
        <Button asChild className="mt-6"><Link to="/stores">Go to My stores</Link></Button>
      </Shell>
    );
  }

  if (p?.status === 'paid') {
    return (
      <Shell>
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
        <h1 className="mt-4 text-xl font-semibold">Payment received</h1>
        <p className="mt-2 text-sm text-muted-foreground">Opening the form for your new store…</p>
      </Shell>
    );
  }

  if (p?.status === 'completed') {
    return (
      <Shell>
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
        <h1 className="mt-4 text-xl font-semibold">This payment was already used</h1>
        <p className="mt-2 text-sm text-muted-foreground">Its store has been created.</p>
        <Button asChild className="mt-6"><Link to="/stores">Go to My stores</Link></Button>
      </Shell>
    );
  }

  // Cancelled on ModemPay (or ModemPay reports it cancelled) and nothing was paid.
  if (p?.status === 'cancelled' || (cancelled && (!p || p.status === 'pending'))) {
    return (
      <Shell>
        <XCircle className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold">Payment cancelled</h1>
        <p className="mt-2 text-sm text-muted-foreground">You weren't charged.</p>
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
      <h1 className="mt-4 text-xl font-semibold">Confirming your payment…</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {gaveUp
          ? "ModemPay hasn't confirmed the payment yet. If you paid, it will show up shortly — then you can create your store from My stores."
          : slowly ? 'This is taking a little longer than usual. Please keep this page open.' : 'This usually takes a few seconds.'}
      </p>
      {gaveUp && <Button asChild variant="outline" className="mt-6"><Link to="/stores">Go to My stores</Link></Button>}
    </Shell>
  );
}
