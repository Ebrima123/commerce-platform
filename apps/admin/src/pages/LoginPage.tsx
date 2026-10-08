import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button, Card, Input, Label } from '@cp/ui';
import { useAuth } from '../auth';
import { exchange, forgetAccount, goToAlfudi, rememberedAccount, shouldCheckAlfudi } from '../sso';

const ALFUDI_LOGO = 'https://res.cloudinary.com/divk8m0ff/image/upload/v1790210286/alfudi.com_png_aqe5u3.png';

export default function LoginPage() {
  const { user, loading, signIn, startSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [account, setAccount] = useState(rememberedAccount);
  const [checking, setChecking] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? params.get('next') ?? '/';
  const returnTo = `/login?next=${encodeURIComponent(from)}`;

  // Signed in on Alfudi? Quietly find out once per visit, so we can offer "Continue as …".
  useEffect(() => {
    if (loading || user || !shouldCheckAlfudi() || params.get('error')) return;
    setChecking(true);
    goToAlfudi({ silent: true, returnTo }).catch(() => setChecking(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user]);

  useEffect(() => { const e = params.get('error'); if (e) setError(e); }, [params]);

  if (user) return <Navigate to={from} replace />;
  if (checking || loading) {
    return <div className="flex min-h-screen items-center justify-center bg-muted/40"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err = await signIn(username, password);
    setBusy(false);
    if (err) setError(err); else navigate(from, { replace: true });
  };

  const continueAs = async () => {
    if (!account) return;
    setBusy(true);
    setError(null);
    try {
      startSession(await exchange(account.code, account.verifier));
      forgetAccount();
      navigate(from, { replace: true });
    } catch (e) {
      forgetAccount();
      setAccount(null);
      setBusy(false);
      setError(e instanceof Error ? e.message : 'Could not sign you in with Alfudi.');
    }
  };

  const firstName = account?.name.split(' ')[0];

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="/mariseh-logo.png" alt="Mariseh" className="mb-4 h-14 w-14" />
          <h1 className="text-[28px] font-bold tracking-tight">Sign in to your store</h1>
          <p className="mt-1 text-[15px] text-muted-foreground">Use the same account as Alfudi — or your Mariseh one.</p>
        </div>

        {account ? (
          // Meta-style "Continue as …" for the account signed in on Alfudi.
          <Card className="mb-4 p-5 text-center">
            <div className="relative mx-auto h-20 w-20">
              {account.avatar
                ? <img src={account.avatar} alt="" className="h-20 w-20 rounded-full object-cover" />
                : <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand/10 text-3xl font-semibold text-brand">{account.name.charAt(0).toUpperCase()}</span>}
              <img src={ALFUDI_LOGO} alt="" className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-white object-contain p-0.5 ring-2 ring-card" />
            </div>
            <p className="mt-3 text-[17px] font-semibold">{account.name}</p>
            {account.username && <p className="text-[15px] text-muted-foreground">@{account.username} on Alfudi</p>}
            <Button size="lg" className="mt-4 w-full" disabled={busy} onClick={continueAs}>
              {busy && <Loader2 className="animate-spin" />} Continue as {firstName}
            </Button>
            <button type="button" disabled={busy} onClick={() => { forgetAccount(); setAccount(null); }}
              className="mt-3 text-[15px] text-brand active:opacity-60">Not you? Use another account</button>
            {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
          </Card>
        ) : (
          <>
            <Button size="lg" variant="outline" className="mb-4 w-full bg-card" onClick={() => goToAlfudi({ silent: false, returnTo: from })}>
              <img src={ALFUDI_LOGO} alt="" className="h-5 w-5 rounded object-contain" /> Continue with Alfudi
            </Button>
            <div className="mb-4 flex items-center gap-3 text-[13px] text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
            </div>
          </>
        )}

        {!account && (
          <Card className="p-6">
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input id="username" autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <Button type="submit" size="lg" className="w-full" disabled={busy}>
                {busy && <Loader2 className="animate-spin" />} Sign in
              </Button>
            </form>
          </Card>
        )}

        <p className="mt-6 text-center text-[13px] text-muted-foreground">
          New here? <Link to="/start" className="font-medium text-foreground underline-offset-4 hover:underline">Create your store in a few clicks</Link>
        </p>
      </div>
    </div>
  );
}
