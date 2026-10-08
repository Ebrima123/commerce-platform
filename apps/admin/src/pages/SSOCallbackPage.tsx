import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../auth';
import { handleCallback } from '../sso';

// Back from alfudi.com/sso/authorize. Handled once per page load (React may
// run effects twice in development; the hand-off data is single-use).
let once: ReturnType<typeof handleCallback> | null = null;

export default function SSOCallbackPage() {
  const { startSession } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    once ??= handleCallback();
    once.then(result => {
      if (result.kind === 'signed-in') {
        startSession(result.session);
        navigate(result.returnTo.startsWith('/login') ? '/' : result.returnTo, { replace: true });
      } else if (result.kind === 'nothing' && result.message) {
        navigate(`/login?error=${encodeURIComponent(result.message)}`, { replace: true });
      } else {
        navigate(result.returnTo, { replace: true });
      }
    }).catch(e => {
      navigate(`/login?error=${encodeURIComponent(e instanceof Error ? e.message : 'Could not sign you in with Alfudi.')}`, { replace: true });
    }).finally(() => { once = null; });
  }, [navigate, startSession]);

  return <div className="flex min-h-screen items-center justify-center bg-muted/40"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
}
