import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight, Camera, Check, ChevronDown, Crown, Gem, Headphones, Laptop, Layers, Link2, Menu, MessageCircle, Paintbrush,
  Search, Shirt, ShoppingBag, ShoppingCart, Smartphone, Sparkles, Store, Wallet, Watch, Wifi, X, Home, LayoutGrid,
  type LucideIcon,
} from 'lucide-react';
import { INDUSTRIES, fmtDalasi, type IndustryKey } from '@cp/shared';
import { cn } from '@cp/ui';
import { ADMIN_ORIGIN } from '../store';
import { Img, Reveal, WhatsAppIcon } from '../components/primitives';

// Marketing page for the platform itself, shown at the storefront root when
// no store is in the address. Every call to action goes to the store wizard.

const START = `${ADMIN_ORIGIN}/start`;
const SIGN_IN = `${ADMIN_ORIGIN}/login`;
const ACCENT = '#059669'; // platform accent (emerald)
const wrap = 'mx-auto w-full max-w-6xl px-5 sm:px-8';

const heroImg = (key: IndustryKey, w = 600) => {
  const hero = INDUSTRIES[key].sections.find(s => s.type === 'hero')?.settings.imageUrl;
  return typeof hero === 'string' ? hero.replace(/w=\d+/, `w=${w}`) : '';
};

function CtaButton({ children, className, light }: { children: React.ReactNode; className?: string; light?: boolean }) {
  return (
    <a href={START}
      className={cn('inline-flex h-12 items-center justify-center gap-2 rounded-full px-7 text-[15px] font-semibold shadow-sm transition-transform hover:-translate-y-0.5 active:scale-[0.98] sm:h-14 sm:px-8 sm:text-base',
        light ? 'bg-white text-zinc-900' : 'text-white', className)}
      style={light ? undefined : { background: ACCENT }}>
      {children}
    </a>
  );
}

// ─── Phone mock-up of a marketplace store ─────────────────────────────────────

// Category circles in the mock-ups: four different aisles, like a real shop.
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
    // Shrinks with its container on very narrow phones instead of overflowing.
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

// ─── Page ─────────────────────────────────────────────────────────────────────

const STEPS = [
  { icon: Store, title: 'Name your shop', text: 'Type your shop name and WhatsApp number. Your store link is made for you.' },
  { icon: Sparkles, title: 'Pick what you sell', text: 'Fashion, phones, beauty, food… We design the whole store for your kind of business.' },
  { icon: Link2, title: 'Share your link', text: 'Send it to your WhatsApp contacts and status. Customers browse and order straight away.' },
];

const FEATURES = [
  { icon: Camera, title: 'Add products from your phone', text: 'Take a photo, type a name and a price. That’s it.' },
  { icon: WhatsAppIcon, title: 'Orders come to WhatsApp', text: 'Customers tap “Order on WhatsApp” and their cart arrives in your chat.' },
  { icon: Wallet, title: 'Get paid your way', text: 'Your customers pay you directly, the way they already do. The money comes to you.' },
  { icon: Wifi, title: 'Fast on mobile data', text: 'Built for phones and slow connections, so customers don’t give up.' },
  { icon: Paintbrush, title: 'Change anything, live', text: 'Colours, photos and words — see your changes instantly. No code.' },
  { icon: Layers, title: 'More than one shop', text: 'Sell clothes and phones? Run several stores from one account.' },
];

const FAQS = [
  { q: 'Do I need a computer or tech skills?', a: 'No. You can set up and run your whole store from your phone. If you can use WhatsApp, you can use Mariseh.' },
  { q: 'How do customers pay?', a: 'Customers send their order to you on WhatsApp and pay you directly, the same way you already sell. Mariseh never touches your money.' },
  { q: 'What will my store link look like?', a: 'Something like mariseh.com/@yourshop. You can share it anywhere — WhatsApp, Facebook, Instagram, TikTok.' },
  { q: 'How much does it cost?', a: 'You can create your store and try everything first. We’ll show you the monthly price clearly before anything is charged.' },
  { q: 'Can I change the design later?', a: 'Yes, any time. Switch between the Marketplace and Boutique styles, change colours, photos and text, and see it live.' },
];

export default function LandingPage() {
  const [menu, setMenu] = useState(false);
  const [open, setOpen] = useState<number | null>(0);
  const [scrolled, setScrolled] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    document.title = 'Mariseh — Your online shop in 2 minutes';
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

  const nav = [['How it works', '#how'], ['Styles', '#styles'], ['Features', '#features'], ['FAQ', '#faq']];

  return (
    <div className="min-h-screen bg-white font-sans text-zinc-900 antialiased">
      {/* ── Nav ── */}
      <header className={cn('sticky top-0 z-40 bg-white/90 backdrop-blur-md transition-shadow', scrolled && 'shadow-[0_1px_12px_rgba(0,0,0,0.06)]')}>
        <div className={cn(wrap, 'flex h-16 items-center justify-between gap-4')}>
          <a href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <img src="/mariseh-logo.png" alt="" className="h-9 w-9" />
            Mariseh
          </a>
          <nav className="hidden items-center gap-8 text-sm font-medium text-zinc-600 md:flex">
            {nav.map(([label, href]) => <a key={href} href={href} className="hover:text-zinc-900">{label}</a>)}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <a href={SIGN_IN} className="text-sm font-medium text-zinc-600 hover:text-zinc-900">Sign in</a>
            <a href={START} className="inline-flex h-10 items-center rounded-full px-5 text-sm font-semibold text-white" style={{ background: ACCENT }}>Create your store</a>
          </div>
          <button type="button" onClick={() => setMenu(m => !m)} aria-label="Menu" aria-expanded={menu} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-zinc-100 md:hidden">
            {menu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menu && (
          <div className="border-t border-zinc-100 bg-white px-5 pb-5 md:hidden">
            {nav.map(([label, href]) => <a key={href} href={href} onClick={() => setMenu(false)} className="block border-b border-zinc-100 py-3.5 text-base font-medium">{label}</a>)}
            <a href={SIGN_IN} className="block py-3.5 text-base font-medium">Sign in</a>
            <CtaButton className="mt-2 w-full">Create your store <ArrowRight className="h-5 w-5" /></CtaButton>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section ref={heroRef} className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(70%_60%_at_80%_10%,rgba(5,150,105,0.12),transparent_70%),radial-gradient(50%_50%_at_0%_100%,rgba(234,88,12,0.08),transparent_70%)]" />
        <div className={cn(wrap, 'grid items-center gap-12 pb-16 pt-10 lg:grid-cols-[1.1fr_1fr] lg:pb-24 lg:pt-20')}>
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-800">
              ✨ Built for small businesses
            </p>
            <h1 className="mt-6 text-[2.6rem] font-extrabold leading-[1.05] tracking-tight text-balance sm:text-6xl lg:text-[4.2rem]">
              Your online shop, <span style={{ color: ACCENT }}>ready in 2 minutes.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-600 text-pretty">
              Answer three easy questions and get a beautiful store with its own link. Customers order on WhatsApp and pay you the way they already do. No tech skills needed.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <CtaButton>Create my store <ArrowRight className="h-5 w-5" /></CtaButton>
              <a href="#styles" className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-300 px-7 text-[15px] font-semibold hover:bg-zinc-50 sm:h-14 sm:px-8 sm:text-base">See example stores</a>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-600">
              {['Works on any phone', 'Orders on WhatsApp', 'Ready in minutes'].map(t => (
                <li key={t} className="flex items-center gap-1.5"><Check className="h-4 w-4" style={{ color: ACCENT }} />{t}</li>
              ))}
            </ul>
          </div>
          <div className="relative flex justify-center lg:justify-end">
            <PhoneMock className="rotate-[-3deg]" />
            <div role="presentation" className="toast-in absolute bottom-10 left-0 flex max-w-[240px] items-center gap-3 rounded-2xl bg-white p-3 pr-4 shadow-[0_12px_32px_rgba(0,0,0,0.18)] ring-1 ring-black/5 sm:bottom-16 sm:left-[-0.5rem] lg:left-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white"><WhatsAppIcon className="h-[18px] w-[18px]" /></span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-zinc-900">New order!</span>
                <span className="block truncate text-xs text-zinc-600">2 × Wax Print Wrap Dress</span>
                <span className="block whitespace-nowrap text-xs font-bold text-emerald-700">{fmtDalasi(3300)}</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="scroll-mt-16 bg-zinc-50 py-20 sm:py-28">
        <div className={wrap}>
          <Reveal>
            <p className="text-center text-sm font-semibold uppercase tracking-[0.16em]" style={{ color: ACCENT }}>How it works</p>
            <h2 className="mx-auto mt-3 max-w-2xl text-center text-3xl font-extrabold tracking-tight text-balance sm:text-5xl">Three steps. That’s really it.</h2>
          </Reveal>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <Reveal key={title} delay={i * 100}>
                <div className="h-full rounded-3xl bg-white p-7 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl text-white" style={{ background: ACCENT }}><Icon className="h-6 w-6" /></span>
                    <span className="text-5xl font-extrabold text-zinc-100">{i + 1}</span>
                  </div>
                  <h3 className="mt-6 text-xl font-bold">{title}</h3>
                  <p className="mt-2 leading-relaxed text-zinc-600">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Styles ── */}
      <section id="styles" className="scroll-mt-16 py-20 sm:py-28">
        <div className={wrap}>
          <Reveal>
            <p className="text-center text-sm font-semibold uppercase tracking-[0.16em]" style={{ color: ACCENT }}>Two looks to choose from</p>
            <h2 className="mx-auto mt-3 max-w-2xl text-center text-3xl font-extrabold tracking-tight text-balance sm:text-5xl">A shop that looks like the big apps</h2>
          </Reveal>
          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            <Reveal>
              <div className="flex h-full flex-col overflow-hidden rounded-3xl bg-gradient-to-br from-violet-50 to-orange-50 p-7 sm:p-9">
                <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700 shadow-sm">Most popular</span>
                <h3 className="mt-4 text-2xl font-bold">Marketplace</h3>
                <p className="mt-2 text-zinc-600">Like SHEIN, Temu or Alfudi — big search bar, category icons and lots of products on one screen. Great when you sell many items.</p>
                <div className="mt-8 flex flex-1 items-end justify-center"><PhoneMock industry="electronics" color="#0284c7" name="Coastal Phones" /></div>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <div className="flex h-full flex-col overflow-hidden rounded-3xl bg-[#faf6ef] p-7 sm:p-9">
                <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700 shadow-sm">Elegant</span>
                <h3 className="mt-4 text-2xl font-bold">Boutique</h3>
                <p className="mt-2 text-zinc-600">Calm and beautiful — big photos, elegant fonts and your story. Great for fashion, beauty and special products.</p>
                <div className="mt-8 flex-1 overflow-hidden rounded-2xl bg-white shadow-xl">
                  <div className="relative aspect-[4/3]">
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

      {/* ── Industries ── */}
      <section className="bg-zinc-950 py-20 text-white sm:py-28">
        <div className={wrap}>
          <Reveal>
            <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight text-balance sm:text-5xl">Designed for what you sell</h2>
            <p className="mt-4 max-w-xl text-lg text-zinc-400">Pick your business and get a store made for your customers — the right colours, words and layout from the start.</p>
          </Reveal>
          <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {(Object.keys(INDUSTRIES) as IndustryKey[]).map((key, i) => (
              <Reveal key={key} delay={i * 60}>
                <a href={`${START}?category=${key}`} aria-label={`${INDUSTRIES[key].label}: start this store`}
                  className="group relative block aspect-[4/5] overflow-hidden rounded-2xl ring-1 ring-white/10 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(0,0,0,0.45)] hover:ring-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 active:translate-y-0 active:scale-[0.98] sm:aspect-[4/3]">
                  <Img src={heroImg(key, 700)} alt="" className="transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3.5 sm:p-5">
                    <span className="min-w-0">
                      <span className="block text-[15px] font-semibold leading-snug sm:text-lg">{INDUSTRIES[key].label}</span>
                      <span className="mt-0.5 block text-xs text-white/70 transition-colors group-hover:text-white">Start this store</span>
                    </span>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-zinc-900 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:scale-110 sm:h-9 sm:w-9"><ArrowRight className="h-4 w-4" /></span>
                  </div>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="scroll-mt-16 py-20 sm:py-28">
        <div className={wrap}>
          <Reveal>
            <p className="text-center text-sm font-semibold uppercase tracking-[0.16em]" style={{ color: ACCENT }}>Everything you need</p>
            <h2 className="mx-auto mt-3 max-w-2xl text-center text-3xl font-extrabold tracking-tight text-balance sm:text-5xl">Simple for you. Easy for your customers.</h2>
          </Reveal>
          <div className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }, i) => (
              <Reveal key={title} delay={(i % 3) * 80}>
                <div className="flex gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50" style={{ color: ACCENT }}><Icon className="h-6 w-6" /></span>
                  <div>
                    <h3 className="text-lg font-bold">{title}</h3>
                    <p className="mt-1 leading-relaxed text-zinc-600">{text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-16">
            <div className="flex flex-col items-center gap-4 rounded-3xl bg-zinc-50 p-8 text-center sm:flex-row sm:text-left">
              <Smartphone className="h-10 w-10 shrink-0" style={{ color: ACCENT }} />
              <p className="flex-1 text-lg text-zinc-700"><span className="font-bold text-zinc-900">No computer? No problem.</span> Everything — setting up, adding products, changing the design — works on your phone.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="scroll-mt-16 bg-zinc-50 py-20 sm:py-28">
        <div className="mx-auto w-full max-w-3xl px-5 sm:px-8">
          <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-5xl">Questions</h2>
          <div className="mt-12 space-y-3">
            {FAQS.map((f, i) => {
              const isOpen = open === i;
              return (
                <div key={f.q} className={cn('rounded-2xl bg-white shadow-sm ring-1 transition-shadow', isOpen ? 'ring-emerald-200 shadow-md' : 'ring-transparent')}>
                  <h3>
                    <button type="button" id={`faq-q-${i}`} onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} aria-controls={`faq-a-${i}`}
                      className="flex min-h-14 w-full items-center justify-between gap-4 rounded-2xl px-5 py-4 text-left text-base font-semibold text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 sm:px-6 sm:py-5 sm:text-lg">
                      {f.q}
                      <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors', isOpen ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500')}>
                        <ChevronDown className={cn('h-5 w-5 transition-transform duration-300', isOpen && 'rotate-180')} />
                      </span>
                    </button>
                  </h3>
                  {/* Grid-rows trick animates the height without measuring it. */}
                  <div id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`}
                    className={cn('grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none', isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
                    <div className="overflow-hidden">
                      <p className="px-5 pb-5 text-[15px] leading-relaxed text-zinc-700 sm:px-6 sm:pb-6 sm:text-base">{f.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 sm:py-24">
        <div className={wrap}>
          <div className="relative overflow-hidden rounded-[2rem] px-6 py-16 text-center text-white sm:px-16 sm:py-20" style={{ background: ACCENT }}>
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-white/10" />
            <h2 className="relative mx-auto max-w-2xl text-3xl font-extrabold tracking-tight text-balance sm:text-5xl">Start selling online today</h2>
            <p className="relative mx-auto mt-4 max-w-xl text-lg text-white/85">Open your shop in minutes and start selling to your customers today.</p>
            <div className="relative mt-9"><CtaButton light>Create my store <ArrowRight className="h-5 w-5" /></CtaButton></div>
          </div>
        </div>
      </section>

      {/* ── Sticky mobile CTA (after the hero has scrolled away) ── */}
      <div aria-hidden={!pastHero} className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur-md transition duration-300 ease-out md:hidden',
        pastHero && !menu ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-full opacity-0',
      )}>
        <a href={START} tabIndex={pastHero ? undefined : -1}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full text-[15px] font-semibold text-white shadow-sm active:scale-[0.98]"
          style={{ background: ACCENT }}>
          Create my store <ArrowRight className="h-5 w-5" />
        </a>
      </div>

      <footer className="border-t border-zinc-100 pb-28 pt-10 md:pb-10">
        <div className={cn(wrap, 'flex flex-col items-center justify-between gap-4 text-sm text-zinc-500 sm:flex-row')}>
          <p className="flex items-center gap-2 font-semibold text-zinc-900"><img src="/mariseh-logo.png" alt="" className="h-6 w-6" /> Mariseh</p>
          <div className="flex gap-6">
            <a href={SIGN_IN} className="hover:text-zinc-900">Sign in</a>
            <a href={START} className="hover:text-zinc-900">Create a store</a>
            <a href="#faq" className="hover:text-zinc-900">FAQ</a>
          </div>
          <p>© {new Date().getFullYear()} Mariseh</p>
        </div>
      </footer>
    </div>
  );
}
