import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, ArrowRight, Check, Loader2, Shirt, Smartphone, Flower2, ShoppingBasket, Sofa, Store,
  Sparkles, X, type LucideIcon,
} from 'lucide-react';
import {
  api, ApiError, BRAND_SWATCHES, FONTS, INDUSTRIES, TEMPLATES, generateTheme, slugify,
  type IndustryKey, type PlatformStore, type SlugCheck, type TemplateKey,
} from '@cp/shared';
import { Button, Card, Input, Label, cn } from '@cp/ui';
import { useAuth } from '../auth';
import { toast } from 'sonner';
import { useMyStore, selectStoreId, storeAddressParts, EXTRA_STORE_PRICE } from '../platform';

const INDUSTRY_ICONS: Record<string, LucideIcon> = {
  shirt: Shirt, smartphone: Smartphone, flower: Flower2, 'shopping-basket': ShoppingBasket, sofa: Sofa, store: Store,
};

type Step = 'name' | 'industry' | 'look' | 'account' | 'creating';

// ─── Slug availability (debounced) ────────────────────────────────────────────

export function useSlugCheck(slug: string) {
  const [state, setState] = useState<{ checking: boolean; result: SlugCheck | null; failed: boolean }>({ checking: false, result: null, failed: false });
  useEffect(() => {
    if (slug.length < 3) { setState({ checking: false, result: null, failed: false }); return; }
    setState(s => ({ ...s, checking: true, failed: false }));
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      api<SlugCheck>(`/api/platform/slug-check/?slug=${encodeURIComponent(slug)}`, { signal: ctrl.signal })
        .then(result => setState({ checking: false, result, failed: false }))
        .catch(() => { if (!ctrl.signal.aborted) setState({ checking: false, result: null, failed: true }); });
    }, 350);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [slug]);
  return state;
}

// ─── Template mini-mockup ─────────────────────────────────────────────────────

/** Mini marketplace store: coloured header + search, category circles, dense product grid. */
function MarketplaceMock({ industry, color }: { industry: IndustryKey; color: string }) {
  const preset = INDUSTRIES[industry];
  const hero = preset.sections.find(s => s.type === 'hero')?.settings ?? {};
  const banner = String(hero.imageUrl ?? '').replace('w=1200', 'w=400');
  const thumbs = preset.samples.map(p => p.imageUrl.replace('w=600', 'w=120'));
  return (
    <div className="aspect-[4/3] w-full overflow-hidden rounded-lg border border-border/60 bg-zinc-100">
      <div className="flex items-center gap-1.5 px-2 py-1.5" style={{ background: color }}>
        <div className="h-1.5 w-7 rounded-full bg-white/90" />
        <div className="h-3.5 flex-1 rounded-full bg-white" />
      </div>
      <div className="space-y-1.5 p-1.5">
        <div className="relative h-[34%] overflow-hidden rounded-md" style={{ height: 52, background: color }}>
          {banner && <img src={banner} alt="" className="h-full w-full object-cover" loading="lazy" />}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
          <div className="absolute left-1.5 top-3 h-1.5 w-12 rounded-full bg-white/90" />
        </div>
        <div className="flex gap-1.5 rounded-md bg-white p-1">
          {thumbs.slice(0, 5).map((t, i) => <img key={i} src={t} alt="" className="h-5 w-5 rounded-full object-cover" loading="lazy" />)}
        </div>
        <div className="grid grid-cols-4 gap-1">
          {[...thumbs, ...thumbs].slice(0, 4).map((t, i) => (
            <div key={i} className="overflow-hidden rounded bg-white">
              <img src={t} alt="" className="aspect-square w-full object-cover" loading="lazy" />
              <div className="m-0.5 h-1 w-2/3 rounded-full" style={{ background: color }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Mini version of the industry's hand-designed store: real hero photo, fonts, colour and corners. */
function RecommendedMock({ industry, color }: { industry: IndustryKey; color: string }) {
  const preset = INDUSTRIES[industry];
  const hero = preset.sections.find(s => s.type === 'hero')?.settings ?? {};
  const image = String(hero.imageUrl ?? '').replace('w=1200', 'w=400');
  const layout = String(hero.layout ?? 'overlay');
  const radius = { none: '0px', md: '4px', xl: '8px', full: '999px' }[preset.brand.radius];
  const surface = { white: '#ffffff', warm: '#faf6ef', dark: '#18181b' }[preset.brand.surface];
  const headingFamily = FONTS[preset.brand.headingFont].family;
  const heading = String(hero.heading ?? preset.label);
  const ink = preset.brand.surface === 'dark' ? '#fafafa' : '#18181b';

  return (
    <div className="aspect-[4/3] w-full overflow-hidden rounded-lg border border-border/60" style={{ background: surface }}>
      <div className="h-2.5" style={{ background: color }} />
      {layout === 'overlay' ? (
        <div className="relative h-[58%]">
          <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/10" />
          <p className="absolute bottom-2 left-2 right-8 line-clamp-2 text-[9px] font-semibold leading-tight text-white" style={{ fontFamily: headingFamily }}>{heading}</p>
        </div>
      ) : layout === 'split' ? (
        <div className="grid h-[58%] grid-cols-2 items-center gap-1.5 p-2">
          <div>
            <p className="line-clamp-3 text-[9px] font-semibold leading-tight" style={{ fontFamily: headingFamily, color: ink }}>{heading}</p>
            <div className="mt-1.5 h-2 w-10" style={{ background: color, borderRadius: radius }} />
          </div>
          <img src={image} alt="" className="h-full w-full object-cover" style={{ borderRadius: radius }} loading="lazy" />
        </div>
      ) : (
        <div className="flex h-[58%] flex-col items-center justify-center gap-1.5 px-3 text-center">
          <p className="line-clamp-2 text-[9px] font-semibold leading-tight" style={{ fontFamily: headingFamily, color: ink }}>{heading}</p>
          <div className="h-2 w-10" style={{ background: color, borderRadius: radius }} />
        </div>
      )}
      <div className="grid grid-cols-4 gap-1 px-2">
        {preset.samples.slice(0, 4).map(p => (
          <img key={p.name} src={p.imageUrl.replace('w=600', 'w=120')} alt="" className="aspect-square w-full object-cover" style={{ borderRadius: radius }} loading="lazy" />
        ))}
      </div>
    </div>
  );
}

function TemplateMock({ template, color }: { template: TemplateKey; color: string }) {
  const warm = template === 'boutique';
  const radius = template === 'bold' ? 'rounded-md' : template === 'minimal' ? 'rounded-sm' : 'rounded-none';
  return (
    <div className={cn('aspect-[4/3] w-full overflow-hidden rounded-lg border border-border/60 p-2', warm ? 'bg-[#faf6ef]' : 'bg-white')}>
      <div className="flex items-center justify-between">
        <div className="h-1.5 w-8 rounded-full bg-zinc-800/70" />
        <div className="h-1.5 w-3 rounded-full bg-zinc-300" />
      </div>
      {template === 'bold' ? (
        <div className={cn('mt-2 flex h-[45%] flex-col justify-end p-1.5', radius)} style={{ background: color }}>
          <div className="h-2 w-3/4 rounded-sm bg-white/90" />
          <div className="mt-1 h-1 w-1/2 rounded-sm bg-white/60" />
        </div>
      ) : template === 'boutique' ? (
        <div className="mt-2 grid h-[45%] grid-cols-2 gap-1.5">
          <div className="flex flex-col justify-center gap-1">
            <div className="h-2 w-full bg-zinc-800" style={{ fontFamily: 'serif' }} />
            <div className="h-1 w-2/3 bg-zinc-400" />
            <div className="mt-0.5 h-1.5 w-1/2" style={{ background: color }} />
          </div>
          <div className="bg-zinc-200" />
        </div>
      ) : (
        <div className="mt-3 flex h-[40%] flex-col items-center justify-center gap-1">
          <div className="h-2 w-2/3 rounded-sm bg-zinc-800" />
          <div className="h-1 w-1/2 rounded-sm bg-zinc-300" />
          <div className={cn('mt-0.5 h-1.5 w-1/4', radius)} style={{ background: color }} />
        </div>
      )}
      <div className="mt-2 grid grid-cols-4 gap-1">
        {[0, 1, 2, 3].map(i => <div key={i} className={cn('aspect-square bg-zinc-200', radius)} />)}
      </div>
    </div>
  );
}

// ─── Idle sign-out ────────────────────────────────────────────────────────────

const IDLE_MS = 2 * 60 * 1000;
const WARN_MS = 20 * 1000;

/**
 * Someone who signed in (e.g. "Continue with Alfudi") but has no store and
 * stops using the store wizard is signed out after 2 minutes of inactivity,
 * instead of being left stuck on this page. Any tap, key or scroll restarts
 * the countdown; a warning shows 20 seconds before.
 */
function useIdleSignOut(enabled: boolean, onTimeout: () => void) {
  const timeoutRef = useRef(onTimeout);
  timeoutRef.current = onTimeout;

  useEffect(() => {
    if (!enabled) return;
    let warn: ReturnType<typeof setTimeout>;
    let out: ReturnType<typeof setTimeout>;
    let warned = false;
    const reset = () => {
      clearTimeout(warn); clearTimeout(out);
      if (warned) { toast.dismiss('idle-signout'); warned = false; }
      warn = setTimeout(() => {
        warned = true;
        toast.warning("Still there? You'll be signed out in 20 seconds unless you continue creating your store.", { id: 'idle-signout', duration: WARN_MS });
      }, IDLE_MS - WARN_MS);
      out = setTimeout(() => timeoutRef.current(), IDLE_MS);
    };
    const events = ['pointerdown', 'keydown', 'input', 'scroll', 'touchstart'] as const;
    events.forEach(e => window.addEventListener(e, reset, { passive: true, capture: true }));
    reset();
    return () => {
      clearTimeout(warn); clearTimeout(out);
      events.forEach(e => window.removeEventListener(e, reset, { capture: true }));
    };
  }, [enabled]);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StartPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, loading: authLoading, signUp, signOut } = useAuth();
  const { data: existing, isLoading: storeLoading } = useMyStore();
  // /start?new=1 — an existing merchant opening another store.
  const [params] = useSearchParams();
  const addingAnother = params.get('new') === '1';
  // /start?category=fashion — chosen on the landing page, so it's already picked here.
  const [preselected] = useState(() => {
    const c = params.get('category');
    return c && Object.prototype.hasOwnProperty.call(INDUSTRIES, c) ? c as IndustryKey : null;
  });

  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [whatsapp, setWhatsapp] = useState('');
  const [industry, setIndustry] = useState<IndustryKey | null>(preselected);
  const [template, setTemplate] = useState<TemplateKey>('marketplace');
  const [color, setColor] = useState(INDUSTRIES[preselected ?? 'general'].brand.primaryColor);
  const [colorPicked, setColorPicked] = useState(false);
  // Each industry has a designed brand colour — use it until the merchant picks their own.
  const chooseIndustry = (key: IndustryKey) => {
    setIndustry(key);
    if (!colorPicked) setColor(INDUSTRIES[key].brand.primaryColor);
  };
  const pickColor = (c: string) => { setColor(c); setColorPicked(true); };
  const swatches = [...new Set([...(industry ? INDUSTRIES[industry].colors : []), ...BRAND_SWATCHES])].slice(0, 12);
  const [account, setAccount] = useState({ full_name: '', username: '', email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Extra stores need a paid unlock first (the first store is free).
  const unlocks = useQuery({
    queryKey: ['store-unlocks', user?.id],
    queryFn: () => api<{ price: number; unlocks_available: number }>('/api/platform/store-purchases/', { auth: true }),
    enabled: !!user && !!existing,
  });

  useEffect(() => { if (!slugEdited) setSlug(slugify(name)); }, [name, slugEdited]);
  const { checking, result, failed: checkFailed } = useSlugCheck(slug);
  const address = storeAddressParts();
  const slugOk = !!result?.available && result.slug === slug;

  // Signed in with no store yet and not using the wizard → sign out after 2 idle minutes.
  useIdleSignOut(!!user && !storeLoading && !existing && step !== 'creating', () => {
    toast.dismiss('idle-signout');
    signOut();
    qc.clear();
    toast.info('You were signed out because the store setup was left idle. Sign in again whenever you are ready.');
    navigate('/login', { replace: true });
  });

  if (authLoading || (user && storeLoading)) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }
  if (existing && !addingAnother && step !== 'creating') return <Navigate to="/design" replace />;
  // Adding another store: pay to unlock it first — the form only opens once it's paid for.
  if (existing && step !== 'creating') {
    if (unlocks.isLoading) {
      return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
    }
    if ((unlocks.data?.unlocks_available ?? 0) < 1) {
      return <UnlockStore currentStore={existing.name} price={unlocks.data?.price ?? EXTRA_STORE_PRICE} onUnlocked={() => unlocks.refetch()} />;
    }
  }

  const steps: Step[] = user ? ['name', 'industry', 'look'] : ['name', 'industry', 'look', 'account'];
  const stepIndex = steps.indexOf(step);

  const create = async () => {
    setStep('creating');
    setErrors({});
    try {
      const theme = generateTheme({ storeName: name.trim(), industry: industry ?? 'general', template, primaryColor: color });
      const details = { name: name.trim(), slug, industry: industry ?? 'general', theme, whatsapp: whatsapp.trim() };
      const created = await api<PlatformStore>('/api/platform/stores/', { method: 'POST', auth: true, body: details });
      qc.removeQueries({ queryKey: ['store-unlocks'] });
      selectStoreId(created.id);
      qc.removeQueries({ predicate: q => q.queryKey[0] !== 'my-stores' });
      await qc.invalidateQueries({ queryKey: ['my-stores'] });
      navigate('/?welcome=1', { replace: true });
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Could not create your store. Please try again.';
      const field = e instanceof ApiError && (e.body as { field?: string } | null)?.field;
      setErrors({ form: msg });
      setStep(field === 'slug' ? 'name' : steps[steps.length - 1]);
    }
  };

  const next = async (e?: FormEvent) => {
    e?.preventDefault();
    if (step === 'account') {
      const errs = await signUp(account);
      if (errs) { setErrors(errs); return; }
      await create();
      return;
    }
    const i = steps.indexOf(step);
    if (i < steps.length - 1) setStep(steps[i + 1]);
    else await create();
  };
  const back = () => { setErrors({}); setStep(steps[Math.max(0, stepIndex - 1)]); };

  const canContinue =
    step === 'name' ? name.trim().length >= 2 && slugOk :
    step === 'industry' ? !!industry :
    step === 'look' ? true :
    step === 'account' ? !!(account.username && account.email && account.password.length >= 6) : false;

  if (step === 'creating') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <div className="relative mb-6 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg" style={{ background: color }}>
          <Sparkles className="h-6 w-6 animate-pulse" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Building {name.trim() || 'your store'}…</h1>
        <p className="mt-2 text-sm text-muted-foreground">Setting up your pages, sections and colours.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="flex h-16 items-center justify-between px-4 sm:px-8">
        <Link to="/" className="flex items-center gap-2 text-sm font-semibold">
          <img src="/mariseh-logo.png" alt="" className="h-8 w-8" />
          Mariseh
        </Link>
        {!user ? <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">Sign in</Link>
          : existing ? <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">Back to {existing.name}</Link> : null}
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-16 pt-4 sm:pt-10">
        {/* Progress */}
        <div className="mb-8 flex items-center gap-2" aria-label={`Step ${stepIndex + 1} of ${steps.length}`}>
          {steps.map((s, i) => (
            <div key={s} className={cn('h-1.5 flex-1 rounded-full transition-colors', i <= stepIndex ? 'bg-foreground' : 'bg-border')} />
          ))}
        </div>

        <form onSubmit={next}>
          {step === 'name' && (
            <StepCard title="Let's name your store" subtitle="You can change the name any time.">
              <div className="space-y-1.5">
                <Label htmlFor="store-name">Store name</Label>
                <Input id="store-name" autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Fatou's Fashion House" maxLength={200} className="h-11 text-base" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="store-slug">Store address</Label>
                <div className="flex h-11 items-center rounded-md border border-input bg-card focus-within:ring-2 focus-within:ring-ring/40">
                  {address.prefix && <span className="max-w-[55%] truncate pl-3 text-sm text-muted-foreground">{address.prefix}</span>}
                  <input id="store-slug" value={slug} maxLength={40}
                    onChange={e => { setSlugEdited(true); setSlug(slugify(e.target.value)); }}
                    className={cn('h-full min-w-0 flex-1 bg-transparent text-sm outline-none', address.prefix ? 'pl-0.5' : 'pl-3')} placeholder="your-store" aria-describedby="slug-status" />
                  {address.suffix && <span className="truncate pr-3 text-sm text-muted-foreground">{address.suffix}</span>}
                </div>
                <p id="slug-status" className="flex items-center gap-1.5 text-xs" aria-live="polite">
                  {slug.length < 3 ? <span className="text-muted-foreground">At least 3 letters or numbers.</span>
                    : checking ? <><Loader2 className="h-3 w-3 animate-spin text-muted-foreground" /><span className="text-muted-foreground">Checking…</span></>
                    : slugOk ? <><Check className="h-3.5 w-3.5 text-emerald-600" /><span className="text-emerald-700 dark:text-emerald-400">Available</span></>
                    : result ? <><X className="h-3.5 w-3.5 text-destructive" /><span className="text-destructive">{result.reason}</span></>
                    : checkFailed ? <><X className="h-3.5 w-3.5 text-destructive" /><span className="text-destructive">Couldn't check this address — the server isn't responding. Try again in a moment.</span></>
                    : null}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="store-wa">WhatsApp number <span className="font-normal text-muted-foreground">(optional)</span></Label>
                <Input id="store-wa" inputMode="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="220 XXX XXXX" className="h-11" />
                <p className="text-xs text-muted-foreground">Customers send their orders here.</p>
              </div>
            </StepCard>
          )}

          {step === 'industry' && (
            <StepCard title="What do you sell?" subtitle="We'll write starter text and pick highlights for you.">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Industry">
                {(Object.keys(INDUSTRIES) as IndustryKey[]).map(key => {
                  const Icon = INDUSTRY_ICONS[INDUSTRIES[key].icon] ?? Store;
                  const active = industry === key;
                  return (
                    <button key={key} type="button" role="radio" aria-checked={active} onClick={() => chooseIndustry(key)}
                      className={cn('flex flex-col items-start gap-3 rounded-xl border bg-card p-4 text-left transition-all',
                        active ? 'border-foreground ring-1 ring-foreground' : 'border-border hover:border-foreground/40')}>
                      <Icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{INDUSTRIES[key].label}</span>
                    </button>
                  );
                })}
              </div>
            </StepCard>
          )}

          {step === 'look' && (
            <StepCard title="Pick a look" subtitle="Every part of it can be changed later in the designer.">
              <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Template">
                {(Object.keys(TEMPLATES) as TemplateKey[]).map(key => {
                  const active = template === key;
                  const featured = key === 'marketplace' || key === 'recommended';
                  return (
                    <button key={key} type="button" role="radio" aria-checked={active} onClick={() => setTemplate(key)}
                      className={cn('rounded-xl border bg-card p-3 text-left transition-all',
                        featured && 'sm:col-span-3 sm:grid sm:grid-cols-[1.3fr_1fr] sm:items-center sm:gap-5',
                        active ? 'border-foreground ring-1 ring-foreground' : 'border-border hover:border-foreground/40')}>
                      {key === 'marketplace' ? <MarketplaceMock industry={industry ?? 'general'} color={color} />
                        : key === 'recommended' ? <RecommendedMock industry={industry ?? 'general'} color={color} />
                        : <TemplateMock template={key} color={color} />}
                      <div>
                        <p className="mt-3 flex flex-wrap items-center gap-2 text-sm font-medium sm:mt-0">
                          {key === 'marketplace' ? 'Marketplace' : key === 'recommended' ? 'Boutique' : TEMPLATES[key].label}
                          {key === 'marketplace' && (
                            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">Most popular</span>
                          )}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {key === 'marketplace'
                            ? 'Like SHEIN, Temu or Alfudi: big search bar, category icons, banners and lots of products on one screen. Best if you sell many items.'
                            : key === 'recommended'
                              ? `A calm, elegant shop designed for ${INDUSTRIES[industry ?? 'general'].label.toLowerCase()} — big photos and your story. Best if you sell fewer, special items.`
                              : TEMPLATES[key].description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div>
                <Label>Brand colour</Label>
                <div className="mt-2 flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Brand colour">
                  {swatches.map(c => (
                    <button key={c} type="button" role="radio" aria-checked={color === c} aria-label={c} onClick={() => pickColor(c)}
                      className={cn('h-8 w-8 rounded-full ring-offset-2 ring-offset-background transition-shadow', color === c && 'ring-2 ring-foreground')}
                      style={{ background: c }} />
                  ))}
                  <label className="relative h-8 w-8 cursor-pointer overflow-hidden rounded-full border border-dashed border-border" title="Custom colour">
                    <input type="color" value={color} onChange={e => pickColor(e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" aria-label="Custom colour" />
                    <span className="flex h-full items-center justify-center text-xs text-muted-foreground">+</span>
                  </label>
                </div>
              </div>
            </StepCard>
          )}

          {step === 'account' && (
            <StepCard title="Create your account" subtitle="Last step — then your store goes live.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="full_name" label="Your name" error={errors.full_name}>
                  <Input id="full_name" autoComplete="name" value={account.full_name} onChange={e => setAccount(a => ({ ...a, full_name: e.target.value }))} />
                </Field>
                <Field id="username" label="Username" error={errors.username}>
                  <Input id="username" autoComplete="username" value={account.username} onChange={e => setAccount(a => ({ ...a, username: e.target.value }))} required />
                </Field>
              </div>
              <Field id="email" label="Email" error={errors.email}>
                <Input id="email" type="email" autoComplete="email" value={account.email} onChange={e => setAccount(a => ({ ...a, email: e.target.value }))} required />
              </Field>
              <Field id="password" label="Password" error={errors.password}>
                <Input id="password" type="password" autoComplete="new-password" minLength={6} value={account.password} onChange={e => setAccount(a => ({ ...a, password: e.target.value }))} required />
              </Field>
            </StepCard>
          )}

          {!!existing && stepIndex === 0 && (
            <p className="mt-4 flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-400">
              <Check className="h-4 w-4" /> Payment received — set up your new store.
            </p>
          )}

          {errors.form && <p role="alert" className="mt-4 text-sm text-destructive">{errors.form}</p>}

          <div className="mt-6 flex items-center justify-between">
            {stepIndex > 0 ? (
              <Button type="button" variant="ghost" onClick={back}><ArrowLeft /> Back</Button>
            ) : <span />}
            <Button type="submit" size="lg" disabled={!canContinue}>
              {stepIndex === steps.length - 1 ? <>Create my store <Sparkles /></> : <>Continue <ArrowRight /></>}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}

/** Adding another store: pay the one-off fee first; the store form opens once it's paid. */
function UnlockStore({ currentStore, price, onUnlocked }: { currentStore: string; price: number; onUnlocked: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pay = async () => {
    setBusy(true);
    setError('');
    try {
      const back = `${window.location.origin}/start/paid`;
      const { checkout_url } = await api<{ id: string; checkout_url: string }>('/api/platform/store-purchases/', {
        method: 'POST', auth: true, body: { return_url: back, cancel_url: back },
      });
      window.location.href = checkout_url; // ModemPay → back to /start/paid?purchase=…
    } catch (e) {
      // Already paid (e.g. in another tab)? Then the form is unlocked.
      if (e instanceof ApiError && (e.body as { unlocked?: boolean } | null)?.unlocked) { onUnlocked(); return; }
      setError(e instanceof ApiError ? e.message : 'Could not start the payment. Please try again.');
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="flex h-16 items-center justify-between px-4 sm:px-8">
        <Link to="/" className="flex items-center gap-2 text-sm font-semibold">
          <img src="/mariseh-logo.png" alt="" className="h-8 w-8" />
          Mariseh
        </Link>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">Back to {currentStore}</Link>
      </header>
      <main className="mx-auto max-w-lg px-4 pb-16 pt-6 sm:pt-12">
        <Card className="p-6 text-center sm:p-8">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand"><Store className="h-7 w-7" /></span>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">Add another store</h1>
          <p className="mt-2 text-muted-foreground">
            Your first store is free. Each extra store is a one-off <span className="font-semibold text-foreground">D{price.toLocaleString()}</span>. Pay first, then set up your new store straight away.
          </p>
          <ul className="mx-auto mt-6 max-w-xs space-y-2 text-left text-sm">
            {['Its own address: yourname.mariseh.com', 'Separate products, orders and design', 'Manage every store from one account'].map(t => (
              <li key={t} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{t}</li>
            ))}
          </ul>
          {error && <p role="alert" className="mt-5 text-sm text-destructive">{error}</p>}
          <Button size="lg" className="mt-7 w-full" onClick={pay} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <>Pay D{price.toLocaleString()} to unlock</>}
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">Secure payment with ModemPay (Wave, cards and more). You'll come straight back here to set up your store.</p>
        </Card>
      </main>
    </div>
  );
}

function StepCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <Card className="p-6 sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      <div className="mt-6 space-y-5">{children}</div>
    </Card>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
