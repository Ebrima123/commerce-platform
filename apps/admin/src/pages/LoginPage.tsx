import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, Store } from 'lucide-react';
import { Button, Card, Input, Label } from '@cp/ui';
import { useAuth } from '../auth';

export default function LoginPage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? '/';
  if (user) return <Navigate to={from} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err = await signIn(username, password);
    setBusy(false);
    if (err) setError(err); else navigate(from, { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-brand-foreground shadow-sm">
            <Store className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Sign in to your store</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage products, orders and your online store.</p>
        </div>
        <Card className="p-6">
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input id="username" autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} required autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy && <Loader2 className="animate-spin" />} Sign in
            </Button>
          </form>
        </Card>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          New here? <Link to="/start" className="font-medium text-foreground underline-offset-4 hover:underline">Create your store in a few clicks</Link>
        </p>
      </div>
    </div>
  );
}
