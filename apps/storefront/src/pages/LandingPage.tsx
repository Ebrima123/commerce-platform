import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ArrowRight, BarChart3, Camera, Check, ChevronDown, Crown, Gem, Headphones, Laptop, Layers, Link2, Menu, MessageCircle,
  Paintbrush, Plus, Search, Share2, Shirt, ShoppingBag, ShoppingCart, Smartphone, Store, Wallet, Watch, Wifi, X, Home,
  LayoutGrid, type LucideIcon,
} from 'lucide-react';
import { INDUSTRIES, fmtDalasi, type IndustryKey } from '@cp/shared';
import { cn } from '@cp/ui';
import { ADMIN_ORIGIN } from '../store';
import { Img, Reveal, WhatsAppIcon } from '../components/primitives';

// Marketing page for the platform itself, shown at the storefront root when
// no store is in the address. Every call to action goes to the store wizard.
// Look: bold black-and-white with the Mariseh green as the accent.

const START = `${ADMIN_ORIGIN}/start`;
// Example store addresses: shopname.mariseh.com once store subdomains are on, else mariseh.com/@shopname.
const PLATFORM_DOMAIN = (import.meta.env.VITE_PLATFORM_DOMAIN as string | undefined)?.trim();
const storeLink = (name: string) => (PLATFORM_DOMAIN ? `${name}.${PLATFORM_DOMAIN}` : `mariseh.com/@${name}`);
const SIGN_IN = `${ADMIN_ORIGIN}/login`;
const GREEN = '#1bc152';       // logo green — highlights on dark
const wrap = 'mx-auto w-full max-w-7xl px-5 sm:px-8';

const heroImg = (key: IndustryKey, w = 600) => {
  const hero = INDUSTRIES[key].sections.find(s => s.type === 'hero')?.settings.imageUrl;
  return typeof hero === 'string' ? hero.replace(/w=\d+/, `w=${w}`) : '';
};

function StartButton({ children = 'Start your store', className, variant = 'dark' }: { children?: ReactNode; className?: string; variant?: 'dark' | 'light' | 'green' }) {
  return (
    <a href={START}
      className={cn('inline-flex h-12 items-center justify-center gap-2 rounded-full px-7 text-[15px] font-semibold transition-[transform,background-color] hover:-translate-y-0.5 active:scale-[0.98] sm:h-14 sm:px-8 sm:text-base',
        variant === 'dark' && 'bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200',
        variant === 'light' && 'bg-white text-zinc-950 hover:bg-zinc-100',
        variant === 'green' && 'bg-[#1bc152] text-zinc-950 hover:bg-[#33d167]',
        className)}>
      {children} <ArrowRight className="h-5 w-5" />
    </a>
  );
}

const Eyebrow = ({ children, dark }: { children: ReactNode; dark?: boolean }) => (
  <p className={cn('text-sm font-semibold uppercase tracking-[0.18em]', dark ? 'text-[#1bc152]' : 'text-[#047857] dark:text-[#1bc152]')}>{children}</p>
);

// ─── Phone mock-up of a marketplace store ─────────────────────────────────────

const MOCK_CATEGORIES: Partial<Record<IndustryKey, [LucideIcon, string][]>> = {
  fashion: [[Shirt, 'Kaftans'], [ShoppingBag, 'Bags & Shoes'], [Gem, 'Jewelry'], [Crown, 'Headwraps']],
  electronics: [[Smartphone, 'Phones'], [Laptop, 'Laptops'], [Watch, 'Watches'], [Headphones, 'Audio']],
};

function PhoneMock({ industry = 'fashion' as IndustryKey, color = '#6b21a8', name = 'Awa Fashion House', className }: {
  industry?: IndustryKey; color?: string; name?: string; className?: string;
}) {
  const preset = INDUSTRIES[industry];
  const items = preset.samples.slice(0, 4);
  const categories = MOCK_CATEGORIES[industry] ?? MOCK_CATEGORIES.fashion!;
  return (
    <div className={cn('relative w-full max-w-[270px] shrink-0 rounded-[2.6rem] border-[10px] border-zinc-900 bg-zinc-900 shadow-2xl sm:max-w-[300px]', className)}>
      <div className="absolute left-1/2 top-1.5 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-zinc-900" />
      <div className="overflow-hidden rounded-[1.9rem] bg-zinc-100">
        <div className="px-3 pb-2 pt-7 text-white" style={{ background: color }}>
          <p className="text-[13px] font-bold">{name}</p>
          <div className="mt-1.5 flex h-7 items-center gap-1.5 rounded-full bg-white px-2.5 text-[10px] text-zinc-400"><Search className="h-3 w-3" /> Search products</div>
        </div>
        <div className="space-y-2 p-2">
          <div className="relative h-24 overflow-hidden rounded-lg" style={{ background: color }}>
            <Img src={heroImg(industry, 500)} alt="" eager />
            <div className="absolute inset-0 bg-gradient-to-r from-black/65 to-transparent" />
            <p className="absolute left-2.5 top-1/2 max-w-[60%] -translate-y-1/2 text-[12px] font-bold leading-tight text-white">New arrivals every week</p>
          </div>
          <div className="flex justify-between rounded-lg bg-white p-1.5">
            {categories.map(([Icon, label]) => (
              <div key={label} className="flex min-w-0 flex-1 flex-col items-center gap-0.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: `${color}14`, color }}><Icon className="h-4 w-4" /></span>
                <span className="w-full truncate text-center text-[8px] text-zinc-600">{label}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {items.map((p, i) => (
              <div key={p.name} className="min-w-0 overflow-hidden rounded-md bg-white">
                <div className="aspect-square bg-zinc-200"><Img src={p.imageUrl.replace('w=600', 'w=240')} alt="" eager /></div>
                <div className="p-1.5">
                  <p className="truncate text-[9px] text-zinc-700">{p.name}</p>
                  <p className="truncate whitespace-nowrap text-[11px] font-bold tabular-nums" style={{ color }}>{fmtDalasi(p.price)}</p>
                  {i < 2 && <p className="truncate whitespace-nowrap text-[8px] text-zinc-400"><span className="text-amber-500">★</span> 4.{8 - i} · {i ? 86 : '1.2k'} sold</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-4 border-t border-zinc-200 bg-white py-1.5 text-[8px] text-zinc-500">
          {[[Home, 'Home'], [LayoutGrid, 'Categories'], [MessageCircle, 'Chat'], [ShoppingCart, 'Cart']].map(([Icon, label], i) => {
            const I = Icon as typeof Home;
            return <span key={i} className="flex flex-col items-center gap-0.5" style={i === 0 ? { color } : undefined}><I className="h-3.5 w-3.5" />{label as string}</span>;
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Small UI illustrations (pure markup — no screenshots) ────────────────────

const Float = ({ className, children }: { className?: string; children: ReactNode }) => (
  <div className={cn('absolute rounded-2xl bg-white p-3 text-zinc-900 shadow-[0_18px_40px_rgba(0,0,0,0.35)] ring-1 ring-black/5', className)}>{children}</div>
);

/** WhatsApp chat with an order arriving. */
function ChatMock() {
  return (
    <div className="mx-auto w-full max-w-sm overflow-hidden rounded-3xl bg-[#efeae2] shadow-xl ring-1 ring-black/5">
      <div className="flex items-center gap-2.5 bg-[#075e54] px-4 py-3 text-white">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-semibold">F</span>
        <div><p className="text-sm font-semibold">Fatou (customer)</p><p className="text-[11px] text-white/70">online</p></div>
      </div>
      <div className="space-y-2 p-4 text-[13px]">
        <div className="max-w-[85%] rounded-xl rounded-tl-none bg-white p-3 shadow-sm">
          <p className="font-medium">Hello Awa Fashion House, I&apos;d like to order:</p>
          <p className="mt-1">• 1 × Embroidered Grand Boubou — {fmtDalasi(4850)}</p>
          <p>• 2 × Printed Headwrap Set — {fmtDalasi(1900)}</p>
          <p className="mt-1 font-semibold">Total: {fmtDalasi(6750)}</p>
        </div>
        <div className="ml-auto max-w-[75%] rounded-xl rounded-tr-none bg-[#d9fdd3] p-3 shadow-sm">
          Thank you! 🙏 Your order will be delivered tomorrow.
        </div>
      </div>
    </div>
  );
}

/** The merchant app's home screen. */
function AdminMock() {
  const bars = [32, 54, 41, 68, 59, 83, 74];
  return (
    <div className="mx-auto w-full max-w-sm rounded-[2rem] bg-[#f2f2f7] p-4 shadow-xl ring-1 ring-black/5">
      <p className="px-1 text-[26px] font-bold tracking-tight">Home</p>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {[['Sales', fmtDalasi(12450), '#34c759'], ['Orders', '38', '#ff9500']].map(([label, value, c]) => (
          <div key={label} className="rounded-2xl bg-white p-3">
            <p className="text-[13px] font-semibold" style={{ color: c }}>{label}</p>
            <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-2.5 rounded-2xl bg-white p-3">
        <p className="text-[13px] font-semibold">This week</p>
        <div className="mt-3 flex h-20 items-end gap-1.5">
          {bars.map((h, i) => <span key={i} className="flex-1 rounded-t-[4px] bg-[#047857]" style={{ height: `${h}%` }} />)}
        </div>
      </div>
      <div className="mt-2.5 divide-y divide-zinc-100 rounded-2xl bg-white">
        {[['#1042 · Fatou J.', 'To ship'], ['#1041 · Lamin C.', 'Delivered']].map(([o, s]) => (
          <div key={o} className="flex items-center justify-between px-3 py-2.5 text-[13px]">
            <span>{o}</span><span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', s === 'Delivered' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800')}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** The page editor. */
function DesignerMock() {
  return (
    <div className="flex h-full overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
      <div className="w-[38%] space-y-1.5 border-r border-zinc-100 p-2.5">
        {['Banner', 'Categories', 'Products', 'Reviews'].map((s, i) => (
          <div key={s} className={cn('rounded-md px-2 py-1.5 text-[10px] font-medium', i === 0 ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-300' : 'bg-zinc-50 text-zinc-600')}>{s}</div>
        ))}
      </div>
      <div className="flex-1 space-y-1.5 p-2.5">
        <div className="relative h-14 overflow-hidden rounded-md ring-2 ring-blue-500">
          <Img src={heroImg('beauty', 400)} alt="" eager />
          <span className="absolute left-1/2 top-0 -translate-x-1/2 rounded-b bg-blue-600 px-1.5 text-[8px] font-semibold text-white">BANNER</span>
        </div>
        <div className="grid grid-cols-3 gap-1">{[0, 1, 2].map(i => <span key={i} className="h-10 rounded bg-zinc-100" />)}</div>
      </div>
    </div>
  );
}

/** Follows the visitor's light/dark setting, live (also keeps the page edge in the right colour). */
function usePrefersDark() {
  const query = '(prefers-color-scheme: dark)';
  const [dark, setDark] = useState(() => typeof window !== 'undefined' && window.matchMedia?.(query).matches);
  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return;
    const onChange = () => setDark(mq.matches);
    // 'change' covers live switches; older Safari only has addListener. Re-check on
    // returning to the tab too, in case a change happened while it was hidden.
    if (mq.addEventListener) mq.addEventListener('change', onChange); else mq.addListener?.(onChange);
    window.addEventListener('focus', onChange);
    document.addEventListener('visibilitychange', onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange); else mq.removeListener?.(onChange);
      window.removeEventListener('focus', onChange);
      document.removeEventListener('visibilitychange', onChange);
    };
  }, []);
  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = dark ? '#09090b' : '#ffffff';
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    return () => { document.body.style.background = prev; document.documentElement.style.colorScheme = ''; };
  }, [dark]);
  return dark;
}

// ─── Content ──────────────────────────────────────────────────────────────────

const SELLS = ['Fashion', 'Phones & gadgets', 'Beauty & care', 'Food & groceries', 'Home & living', 'Shoes', 'Jewelry', 'Baby & kids', 'Bags', 'Electronics', 'Perfumes', 'Fabrics'];

const FAQS = [
  { q: 'Do I need a computer or tech skills?', a: 'No. You can set up and run your whole store from your phone. If you can use WhatsApp, you can use Mariseh.' },
  { q: 'How do customers pay?', a: 'Customers send their order to you on WhatsApp and pay you directly, the same way you already sell. Mariseh never touches your money.' },
  { q: 'What will my store link look like?', a: `Something like ${storeLink('yourshop')}. You can share it anywhere — WhatsApp, Facebook, Instagram, TikTok.` },
  { q: 'How much does it cost?', a: 'You can create your store and try everything first. We’ll show you the monthly price clearly before anything is charged.' },
  { q: 'Can I change the design later?', a: 'Yes, any time. Drag in new sections, click any text to change it, switch between the Marketplace and Boutique styles — and see it live.' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [menu, setMenu] = useState(false);
  const [open, setOpen] = useState<number | null>(0);
  const [scrolled, setScrolled] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const isDark = usePrefersDark();

  useEffect(() => {
    document.title = 'Mariseh — Start your online store';
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Show the sticky mobile button only once the hero's own button is gone.
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([entry]) => setPastHero(!entry.isIntersecting && entry.boundingClientRect.top < 0));
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  const nav = [['Features', '#features'], ['Store styles', '#styles'], ['How it works', '#how'], ['FAQ', '#faq']];
  const onDark = !scrolled && !menu;

  return (
    <div className={cn(isDark && 'dark')}>
    <div className="min-h-screen bg-white font-sans text-zinc-950 antialiased dark:bg-zinc-950 dark:text-white">
      {/* ── Header (transparent over the dark hero, white once you scroll) ── */}
      <header className={cn('fixed inset-x-0 top-0 z-40 transition-colors duration-300',
        onDark ? 'bg-transparent text-white' : 'bg-white/95 text-zinc-950 shadow-[0_1px_0_rgba(0,0,0,0.06)] backdrop-blur-md dark:bg-zinc-950/90 dark:text-white dark:shadow-[0_1px_0_rgba(255,255,255,0.08)]')}>
        <div className={cn(wrap, 'flex h-16 items-center justify-between gap-4 sm:h-[72px]')}>
          <a href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <img src="/mariseh-logo.png" alt="" className="h-9 w-9" />
            Mariseh
          </a>
          <nav className={cn('hidden items-center gap-8 text-[15px] font-medium md:flex', onDark ? 'text-white/80' : 'text-zinc-600 dark:text-zinc-300')}>
            {nav.map(([label, href]) => <a key={href} href={href} className={onDark ? 'hover:text-white' : 'hover:text-zinc-950 dark:hover:text-white'}>{label}</a>)}
          </nav>
          <div className="hidden items-center gap-5 md:flex">
            <a href={SIGN_IN} className={cn('text-[15px] font-medium', onDark ? 'text-white/80 hover:text-white' : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white')}>Log in</a>
            <a href={START} className={cn('inline-flex h-11 items-center rounded-full px-5 text-[15px] font-semibold transition-colors',
              onDark ? 'bg-white text-zinc-950 hover:bg-zinc-100' : 'bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200')}>Start your store</a>
          </div>
          <button type="button" onClick={() => setMenu(m => !m)} aria-label="Menu" aria-expanded={menu}
            className={cn('flex h-11 w-11 items-center justify-center rounded-full md:hidden', onDark ? 'hover:bg-white/10' : 'hover:bg-zinc-100 dark:hover:bg-white/10')}>
            {menu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {menu && (
          <div className="border-t border-zinc-100 bg-white px-5 pb-6 text-zinc-950 dark:border-white/10 dark:bg-zinc-950 dark:text-white md:hidden">
            {nav.map(([label, href]) => <a key={href} href={href} onClick={() => setMenu(false)} className="block border-b border-zinc-100 py-4 text-lg font-medium dark:border-white/10">{label}</a>)}
            <a href={SIGN_IN} className="block py-4 text-lg font-medium">Log in</a>
            <StartButton className="mt-2 w-full" />
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section ref={heroRef} className="relative overflow-hidden bg-zinc-950 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_55%_at_75%_35%,rgba(27,193,82,0.22),transparent_70%),radial-gradient(40%_40%_at_10%_90%,rgba(27,193,82,0.10),transparent_70%)]" aria-hidden />
        <div className={cn(wrap, 'relative grid items-center gap-14 pb-20 pt-28 sm:pt-36 lg:grid-cols-[1.15fr_1fr] lg:pb-28 lg:pt-40')}>
          <div>
            <h1 className="text-[3rem] font-extrabold leading-[0.98] tracking-[-0.035em] text-balance sm:text-7xl lg:text-[5.6rem]">
              Your shop.<br /><span style={{ color: GREEN }}>Online today.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-zinc-300 text-pretty sm:text-xl">
              Answer three easy questions and get a beautiful online store with its own link. Customers order on WhatsApp — you just pack and deliver.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <StartButton variant="green" />
              <a href="#styles" className="inline-flex h-12 items-center justify-center gap-2 rounded-full px-7 text-[15px] font-semibold text-white ring-1 ring-white/25 transition-colors hover:bg-white/10 sm:h-14 sm:text-base">See example stores</a>
            </div>
            <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-[15px] text-zinc-400">
              {['No tech skills needed', 'Works on any phone', 'Ready in minutes'].map(t => (
                <li key={t} className="flex items-center gap-2"><Check className="h-4 w-4" style={{ color: GREEN }} />{t}</li>
              ))}
            </ul>
          </div>

          {/* Product composition: the store + floating UI cards */}
          <div className="relative mx-auto flex w-full max-w-md justify-center py-6 lg:max-w-none">
            <PhoneMock className="relative z-10" />
            <Float className="toast-in left-0 top-16 z-20 hidden w-52 sm:block lg:-left-20">
              <p className="text-[12px] font-semibold text-zinc-500">Sales today</p>
              <p className="mt-0.5 text-2xl font-bold tabular-nums">{fmtDalasi(12450)}</p>
              <div className="mt-2 flex h-8 items-end gap-1">{[30, 45, 38, 60, 52, 80, 70].map((h, i) => <span key={i} className="flex-1 rounded-t-[3px] bg-[#047857]" style={{ height: `${h}%` }} />)}</div>
            </Float>
            <Float className="toast-in bottom-12 left-0 z-20 flex items-center gap-3 pr-4 sm:-left-2 lg:-left-10">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white"><WhatsAppIcon className="h-[18px] w-[18px]" /></span>
              <span>
                <span className="block text-sm font-bold">New order!</span>
                <span className="block text-xs text-zinc-600">2 items · <span className="font-semibold text-zinc-900">{fmtDalasi(6750)}</span></span>
              </span>
            </Float>
            <Float className="toast-in right-0 top-24 z-20 hidden items-center gap-2 sm:flex lg:-right-4">
              <Paintbrush className="h-4 w-4 text-blue-600" />
              <span className="text-[13px] font-semibold">Editing: Banner</span>
            </Float>
          </div>
        </div>
      </section>

      {/* ── What you can sell (scrolling strip) ── */}
      <section aria-label="What you can sell" className="overflow-hidden border-b border-zinc-100 py-6 dark:border-white/10">
        <div className="flex w-max animate-[marquee_40s_linear_infinite] gap-3 motion-reduce:animate-none">
          {[...SELLS, ...SELLS].map((s, i) => (
            <span key={i} className="whitespace-nowrap rounded-full bg-zinc-100 px-5 py-2.5 text-[15px] font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">{s}</span>
          ))}
        </div>
      </section>

      {/* ── Everything you need (bento grid) ── */}
      <section id="features" className="scroll-mt-20 py-20 sm:py-28">
        <div className={wrap}>
          <Reveal className="max-w-3xl">
            <Eyebrow>Everything in one place</Eyebrow>
            <h2 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] text-balance sm:text-6xl">Everything you need to sell online.</h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">A beautiful store, orders straight to WhatsApp, and a simple app to run it all — from your phone.</p>
          </Reveal>

          <div className="mt-14 grid gap-4 md:grid-cols-6">
            <Reveal className="md:col-span-4">
              <div className="flex h-full flex-col overflow-hidden rounded-3xl bg-zinc-100 p-7 dark:bg-zinc-900 sm:p-9">
                <Paintbrush className="h-7 w-7 text-[#047857] dark:text-[#1bc152]" />
                <h3 className="mt-4 text-2xl font-bold tracking-tight">Design it your way</h3>
                <p className="mt-2 max-w-md text-zinc-600 dark:text-zinc-400">Drag in sections, click any text to change it, pick your colours. See every change live — no code.</p>
                <div className="mt-7 h-44 sm:h-52"><DesignerMock /></div>
              </div>
            </Reveal>
            <Reveal className="md:col-span-2" delay={80}>
              <div className="flex h-full flex-col rounded-3xl bg-[#075e54] p-7 text-white sm:p-9">
                <WhatsAppIcon className="h-7 w-7 text-[#25D366]" />
                <h3 className="mt-4 text-2xl font-bold tracking-tight">Orders on WhatsApp</h3>
                <p className="mt-2 text-white/75">Customers tap “Order on WhatsApp” and their full cart lands in your chat.</p>
                <div className="mt-auto pt-7">
                  <div className="rounded-xl bg-white p-3 text-[12px] text-zinc-800 shadow">
                    <p className="font-semibold">New order · {fmtDalasi(6750)}</p>
                    <p className="text-zinc-500">1 × Grand Boubou, 2 × Headwrap</p>
                  </div>
                </div>
              </div>
            </Reveal>
            <Reveal className="md:col-span-2">
              <div className="flex h-full flex-col rounded-3xl bg-zinc-950 p-7 text-white ring-1 ring-transparent dark:bg-zinc-900 dark:ring-white/10 sm:p-9">
                <Camera className="h-7 w-7" style={{ color: GREEN }} />
                <h3 className="mt-4 text-2xl font-bold tracking-tight">Add products in seconds</h3>
                <p className="mt-2 text-zinc-400">Take a photo, type a name and a price. Sizes and colours when you need them.</p>
                <div className="mt-auto flex items-center gap-2 pt-7">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10"><Plus className="h-5 w-5" /></span>
                  <span className="text-sm text-zinc-400">New product</span>
                </div>
              </div>
            </Reveal>
            <Reveal className="md:col-span-2" delay={80}>
              <div className="flex h-full flex-col rounded-3xl bg-[#ecfdf3] p-7 dark:bg-emerald-950/60 sm:p-9">
                <BarChart3 className="h-7 w-7 text-[#047857] dark:text-[#1bc152]" />
                <h3 className="mt-4 text-2xl font-bold tracking-tight">See what sells</h3>
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">Sales, orders and best sellers at a glance — so you know what to stock next.</p>
                <div className="mt-auto flex h-16 items-end gap-1.5 pt-7">{[40, 55, 35, 70, 60, 90, 75].map((h, i) => <span key={i} className="flex-1 rounded-t-[4px] bg-[#047857]" style={{ height: `${h}%` }} />)}</div>
              </div>
            </Reveal>
            <Reveal className="md:col-span-2" delay={160}>
              <div className="flex h-full flex-col rounded-3xl bg-zinc-100 p-7 dark:bg-zinc-900 sm:p-9">
                <Layers className="h-7 w-7 text-[#047857] dark:text-[#1bc152]" />
                <h3 className="mt-4 text-2xl font-bold tracking-tight">More than one shop</h3>
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">Sell clothes and phones? Run several stores from one account and switch in a tap.</p>
                <div className="mt-auto flex -space-x-2 pt-7">
                  {['#6b21a8', '#0284c7', '#be185d', '#15803d'].map(c => <span key={c} className="h-10 w-10 rounded-full ring-4 ring-zinc-100 dark:ring-zinc-900" style={{ background: c }} />)}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Start / Sell / Share / Manage (alternating) ── */}
      <section id="how" className="scroll-mt-20 bg-zinc-50 py-20 dark:bg-zinc-900/50 sm:py-28">
        <div className={cn(wrap, 'space-y-24 sm:space-y-32')}>
          <Feature eyebrow="Start" title="Your store, ready in two minutes"
            text="Type your shop name, pick what you sell and choose a look. Mariseh builds the whole store for your kind of business — photos, words and layout included."
            points={['Its own link to share', 'Designed for your products', 'Change anything later']}
            visual={
              <div className="grid grid-cols-2 gap-3">
                {(['fashion', 'electronics', 'beauty', 'food'] as IndustryKey[]).map((k, i) => (
                  <div key={k} className={cn('relative aspect-[4/5] overflow-hidden rounded-2xl', i % 2 === 1 && 'translate-y-6')}>
                    <Img src={heroImg(k, 500)} alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <span className="absolute bottom-3 left-3 text-sm font-semibold text-white">{INDUSTRIES[k].label}</span>
                  </div>
                ))}
              </div>
            } />
          <Feature reverse eyebrow="Sell" title="Orders come straight to your WhatsApp"
            text="Customers browse, add to cart and tap “Order on WhatsApp”. Their order arrives in your chat with every item and the total — ready for you to confirm."
            points={['No app for customers to install', 'They pay you directly', 'Works on slow connections']}
            visual={<ChatMock />} />
          <Feature eyebrow="Share" title="One link. Everywhere you sell."
            text="Put your store link in your WhatsApp status, Instagram bio, TikTok and Facebook. Every visit is a chance to sell."
            points={[storeLink('yourshop'), 'Looks great on every phone', 'Fast to open, even on mobile data']}
            visual={
              <div className="mx-auto max-w-sm rounded-3xl bg-white p-5 shadow-xl ring-1 ring-black/5">
                <p className="text-[13px] font-semibold text-zinc-500">Your store link</p>
                <div className="mt-2 flex items-center gap-2 rounded-xl bg-zinc-100 px-3 py-3 text-[15px] font-semibold"><Link2 className="h-4 w-4 text-zinc-500" /> {storeLink('awa')}</div>
                <div className="mt-4 grid grid-cols-4 gap-2 text-center text-[11px] font-medium text-zinc-600">
                  {[['WhatsApp', '#25D366'], ['Instagram', '#e1306c'], ['TikTok', '#111111'], ['Facebook', '#1877f2']].map(([n, c]) => (
                    <div key={n}><span className="mx-auto mb-1.5 flex h-11 w-11 items-center justify-center rounded-2xl text-white" style={{ background: c }}><Share2 className="h-5 w-5" /></span>{n}</div>
                  ))}
                </div>
              </div>
            } />
          <Feature reverse eyebrow="Manage" title="Run everything from your phone"
            text="A simple app for your business: products, orders, customers and sales — all in one place, built to be as easy as the apps you already use."
            points={['Mark orders as sent and delivered', 'Know your best sellers', 'Add a product in seconds']}
            visual={<AdminMock />} />
        </div>
      </section>

      {/* ── Store styles ── */}
      <section id="styles" className="scroll-mt-20 py-20 sm:py-28">
        <div className={wrap}>
          <Reveal className="max-w-3xl">
            <Eyebrow>Store styles</Eyebrow>
            <h2 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] text-balance sm:text-6xl">Looks like the big apps. From day one.</h2>
          </Reveal>
          <div className="mt-14 grid gap-5 lg:grid-cols-2">
            <Reveal>
              <div className="flex h-full flex-col overflow-hidden rounded-3xl bg-gradient-to-br from-sky-50 to-violet-50 dark:from-sky-950/50 dark:to-violet-950/50 p-7 sm:p-10">
                <h3 className="text-2xl font-bold tracking-tight">Marketplace</h3>
                <p className="mt-2 max-w-md text-zinc-600 dark:text-zinc-400">A big search bar, category icons and lots of products on one screen. Great when you sell many items.</p>
                <div className="mt-10 flex flex-1 items-end justify-center"><PhoneMock industry="electronics" color="#0284c7" name="Coastal Phones" /></div>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <div className="flex h-full flex-col overflow-hidden rounded-3xl bg-[#faf6ef] p-7 dark:bg-[#1f1b16] sm:p-10">
                <h3 className="text-2xl font-bold tracking-tight">Boutique</h3>
                <p className="mt-2 max-w-md text-zinc-600 dark:text-zinc-400">Big photos, elegant fonts and your story. Great for fashion, beauty and special products.</p>
                <div className="mt-10 flex-1 overflow-hidden rounded-2xl bg-white shadow-xl">
                  <div className="relative aspect-[4/3] h-full">
                    <Img src={heroImg('beauty', 900)} alt="Example boutique store" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <div className="absolute bottom-0 p-6 text-white">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">Natural skin & hair care</p>
                      <p className="mt-2 font-serif text-2xl font-semibold leading-tight sm:text-3xl">Glowing skin, naturally</p>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Designed for what you sell ── */}
      <section className="bg-zinc-950 py-20 text-white sm:py-28">
        <div className={wrap}>
          <Reveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <Eyebrow dark>Made for your business</Eyebrow>
              <h2 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] text-balance sm:text-6xl">Designed for what you sell.</h2>
            </div>
            <p className="max-w-sm text-lg text-zinc-400">Pick your business and get a store made for your customers.</p>
          </Reveal>
          <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {(Object.keys(INDUSTRIES) as IndustryKey[]).map((key, i) => (
              <Reveal key={key} delay={i * 60}>
                <a href={`${START}?category=${key}`} aria-label={`${INDUSTRIES[key].label}: start this store`}
                  className="group relative block aspect-[4/5] overflow-hidden rounded-2xl ring-1 ring-white/10 transition duration-300 hover:-translate-y-1 hover:ring-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1bc152] active:scale-[0.98] sm:aspect-[4/3]">
                  <Img src={heroImg(key, 700)} alt="" className="transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3.5 sm:p-5">
                    <span className="min-w-0">
                      <span className="block text-[15px] font-semibold leading-snug sm:text-lg">{INDUSTRIES[key].label}</span>
                      <span className="mt-0.5 block text-xs text-white/70 group-hover:text-white">Start this store</span>
                    </span>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-zinc-900 transition-transform duration-300 group-hover:translate-x-0.5 sm:h-9 sm:w-9"><ArrowRight className="h-4 w-4" /></span>
                  </div>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Small promises ── */}
      <section className="border-b border-zinc-100 py-16 dark:border-white/10 sm:py-20">
        <div className={cn(wrap, 'grid gap-10 sm:grid-cols-2 lg:grid-cols-4')}>
          {[
            [Smartphone, 'Phone first', 'Set up and run everything without a computer.'],
            [Wifi, 'Fast on mobile data', 'Built for phones and slow connections.'],
            [Wallet, 'Get paid your way', 'Customers pay you directly — Mariseh never touches your money.'],
            [Store, 'Your own link', 'A store address that’s yours to share anywhere.'],
          ].map(([Icon, title, text]) => {
            const I = Icon as LucideIcon;
            return (
              <div key={title as string}>
                <I className="h-7 w-7 text-[#047857] dark:text-[#1bc152]" />
                <p className="mt-4 text-lg font-bold">{title as string}</p>
                <p className="mt-1 leading-relaxed text-zinc-600 dark:text-zinc-400">{text as string}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="scroll-mt-20 py-20 sm:py-28">
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_1.5fr]">
          <div>
            <Eyebrow>FAQ</Eyebrow>
            <h2 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-5xl">Questions, answered.</h2>
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">Anything else? Start your store and look around — it only takes a minute.</p>
          </div>
          <div className="divide-y divide-zinc-200 border-y border-zinc-200 dark:divide-white/10 dark:border-white/10">
            {FAQS.map((f, i) => {
              const isOpen = open === i;
              return (
                <div key={f.q}>
                  <h3>
                    <button type="button" id={`faq-q-${i}`} onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} aria-controls={`faq-a-${i}`}
                      className="flex min-h-16 w-full items-center justify-between gap-4 py-5 text-left text-lg font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#047857] sm:text-xl">
                      {f.q}
                      <ChevronDown className={cn('h-6 w-6 shrink-0 text-zinc-400 transition-transform duration-300', isOpen && 'rotate-180')} />
                    </button>
                  </h3>
                  <div id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`}
                    className={cn('grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none', isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
                    <div className="overflow-hidden"><p className="pb-6 pr-8 text-[17px] leading-relaxed text-zinc-600 dark:text-zinc-400">{f.a}</p></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Final call to action ── */}
      <section className="relative overflow-hidden bg-zinc-950 py-24 text-center text-white sm:py-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_100%,rgba(27,193,82,0.25),transparent_70%)]" aria-hidden />
        <div className={cn(wrap, 'relative')}>
          <h2 className="mx-auto max-w-4xl text-4xl font-extrabold leading-[1.02] tracking-[-0.035em] text-balance sm:text-7xl">
            Your shop could be live <span style={{ color: GREEN }}>in two minutes.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-zinc-300">Start now — it takes three easy questions.</p>
          <div className="mt-10"><StartButton variant="green" /></div>
        </div>
      </section>

      {/* ── Sticky mobile CTA (after the hero has scrolled away) ── */}
      <div aria-hidden={!pastHero} className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 dark:border-white/10 dark:bg-zinc-950/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur-md transition duration-300 ease-out md:hidden',
        pastHero && !menu ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-full opacity-0',
      )}>
        <a href={START} tabIndex={pastHero ? undefined : -1}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-zinc-950 text-[15px] font-semibold text-white active:scale-[0.98] dark:bg-white dark:text-zinc-950">
          Start your store <ArrowRight className="h-5 w-5" />
        </a>
      </div>

      {/* ── Footer ── */}
      <footer className="bg-zinc-950 pb-28 pt-16 text-zinc-400 md:pb-12">
        <div className={cn(wrap, 'grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]')}>
          <div>
            <p className="flex items-center gap-2 text-xl font-bold text-white"><img src="/mariseh-logo.png" alt="" className="h-8 w-8" /> Mariseh</p>
            <p className="mt-4 max-w-xs leading-relaxed">The easiest way for small businesses to sell online — from your phone.</p>
          </div>
          {[
            ['Product', [['Features', '#features'], ['Store styles', '#styles'], ['How it works', '#how']]],
            ['Get started', [['Start your store', START], ['Log in', SIGN_IN]]],
            ['Help', [['FAQ', '#faq']]],
          ].map(([title, links]) => (
            <div key={title as string}>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-white">{title as string}</p>
              <ul className="mt-4 space-y-3">
                {(links as string[][]).map(([label, href]) => <li key={label}><a href={href} className="hover:text-white">{label}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className={cn(wrap, 'mt-14 border-t border-white/10 pt-6 text-sm')}>© {new Date().getFullYear()} Mariseh</div>
      </footer>
    </div>
    </div>
  );
}

/** Alternating "eyebrow / big title / text / ticks" + visual row. */
function Feature({ eyebrow, title, text, points, visual, reverse }: {
  eyebrow: string; title: string; text: string; points: string[]; visual: ReactNode; reverse?: boolean;
}) {
  return (
    <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
      <Reveal className={cn(reverse && 'lg:order-2')}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] text-balance sm:text-5xl">{title}</h2>
        <p className="mt-5 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">{text}</p>
        <ul className="mt-7 space-y-3">
          {points.map(p => (
            <li key={p} className="flex items-center gap-3 text-[17px] font-medium">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ecfdf3] dark:bg-emerald-950"><Check className="h-4 w-4 text-[#047857] dark:text-[#1bc152]" strokeWidth={3} /></span>{p}
            </li>
          ))}
        </ul>
        <a href={START} className="mt-8 inline-flex items-center gap-2 text-[17px] font-semibold text-zinc-950 underline-offset-4 hover:underline dark:text-white">
          Start your store <ArrowRight className="h-5 w-5" />
        </a>
      </Reveal>
      <Reveal className={cn(reverse && 'lg:order-1')} delay={120}>{visual}</Reveal>
    </div>
  );
}
