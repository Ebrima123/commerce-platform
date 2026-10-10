import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft, ChevronLeft, Copy, Eye, EyeOff, ExternalLink, GripVertical, Loader2, Monitor, Paintbrush,
  Plus, Redo2, Smartphone, Tablet, Trash2, Undo2, X, ChevronUp, ChevronDown, PartyPopper, Layers,
  Search, PenLine, Settings2, MousePointerClick,
} from 'lucide-react';
import {
  api, ApiError, BRAND_SWATCHES, DRAG_PREFIX, FONTS, RADII, SECTION_DEFINITIONS, SPACING, SURFACES, normalizeTheme, sectionStyle,
  type Brand, type FontKey, type PlatformStore, type PreviewMessage, type PublicPlatformStore, type RadiusKey,
  type Section, type SectionType, type SpacingKey, type SurfaceKey, type Theme,
} from '@cp/shared';
import { Button, cn } from '@cp/ui';
import { useMyStore, previewUrl, storefrontUrl, STOREFRONT_ORIGIN } from '../platform';
import { useThemeEditor } from '../design/useThemeEditor';
import { FieldRow, ImageInput, SettingField } from '../design/FieldControls';
import { sectionIcon } from '../design/icons';
import { Switch } from '../components/ios';

// Elementor-style page builder: element panel on the left (drag onto the page
// or tap to add), the live page in the middle (hover a section for its
// toolbar, click text to edit it in place), and a floating Layers panel.

type Device = 'desktop' | 'tablet' | 'mobile';
const DEVICE_WIDTH: Record<Device, string> = { desktop: '100%', tablet: '820px', mobile: '390px' };
type Panel = { kind: 'elements' } | { kind: 'site' } | { kind: 'layers' } | { kind: 'section'; id: string };
type Tab = 'content' | 'style' | 'advanced';

const ELEMENT_GROUPS: { title: string; types: SectionType[] }[] = [
  { title: 'Basic', types: ['hero', 'rich_text', 'image_text', 'announcement'] },
  { title: 'Shop', types: ['featured_products', 'categories'] },
  { title: 'Trust & social', types: ['features', 'testimonials', 'whatsapp_cta'] },
  { title: 'Media', types: ['gallery'] },
];

export default function DesignPage() {
  const { data: store, isLoading } = useMyStore();
  if (isLoading || !store) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }
  return <Editor key={store.id} store={store} />;
}

function Editor({ store }: { store: PlatformStore }) {
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const editor = useThemeEditor(normalizeTheme(store.theme, store.name));
  const { theme } = editor;
  const [panel, setPanel] = useState<Panel>({ kind: 'elements' });
  const [tab, setTab] = useState<Tab>('content');
  const [device, setDevice] = useState<Device>('desktop');
  const [mobileView, setMobileView] = useState<'edit' | 'preview'>('preview');
  const [layersOpen, setLayersOpen] = useState(true);
  /** Where the next element goes (set by a "+" on the page). */
  const [insertAt, setInsertAt] = useState<number | null>(null);
  const [welcome, setWelcome] = useState(params.get('welcome') === '1');
  const selectedId = panel.kind === 'section' ? panel.id : null;
  const selected = theme.sections.find(s => s.id === selectedId) ?? null;

  const select = (id: string) => { setPanel({ kind: 'section', id }); setTab('content'); setInsertAt(null); };

  // Categories for the "Product grid" category picker.
  const { data: publicStore } = useQuery({
    queryKey: ['public-store', store.slug],
    queryFn: () => api<PublicPlatformStore>(`/api/platform/public/${store.slug}/`),
  });
  const categories = publicStore?.categories ?? [];

  // ── Save / publish ──
  const save = useMutation({
    mutationFn: (t: Theme) => api<PlatformStore>(`/api/platform/stores/${store.id}/`, { method: 'PATCH', auth: true, body: { theme: t } }),
    onSuccess: (_, t) => { editor.markSaved(t); qc.invalidateQueries({ queryKey: ['my-stores'] }); toast.success('Published — your store is updated'); },
    onError: e => toast.error(e instanceof ApiError ? e.message : 'Could not save. Please try again.'),
  });
  const publish = useMutation({
    mutationFn: (published: boolean) => api<PlatformStore>(`/api/platform/stores/${store.id}/`, { method: 'PATCH', auth: true, body: { published } }),
    onSuccess: s => { qc.invalidateQueries({ queryKey: ['my-stores'] }); toast.success(s.published ? 'Store is live' : 'Store hidden — visitors see "Coming soon"'); },
  });
  const doSave = useCallback(() => { if (editor.dirty && !save.isPending) save.mutate(theme); }, [editor.dirty, save, theme]);

  // ── Section actions (from the panel or the page toolbar) ──
  const removeSection = useCallback((s: Section) => {
    editor.remove(s.id);
    setPanel(p => (p.kind === 'section' && p.id === s.id ? { kind: 'elements' } : p));
    toast(`${SECTION_DEFINITIONS[s.type].label} deleted`, { action: { label: 'Undo', onClick: () => editor.undo() } });
  }, [editor]);

  const addElement = (type: SectionType, index?: number) => {
    if (!editor.canAdd(type)) { toast.error(`${SECTION_DEFINITIONS[type].label} is already on the page`); return; }
    const at = index ?? insertAt ?? (selectedId ? theme.sections.findIndex(s => s.id === selectedId) + 1 : theme.sections.length);
    const s = editor.insertAt(type, at);
    select(s.id);
  };

  // ── Keyboard shortcuts + leave warning ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const k = e.key.toLowerCase();
      if (k === 's') { e.preventDefault(); doSave(); }
      const typing = (e.target as HTMLElement)?.closest('input, textarea, select');
      if (typing) return;
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); editor.undo(); }
      if ((k === 'z' && e.shiftKey) || k === 'y') { e.preventDefault(); editor.redo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [doSave, editor]);

  useEffect(() => {
    if (!editor.dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [editor.dirty]);

  // ── Live preview link ──
  const frame = useRef<HTMLIFrameElement>(null);
  const [frameReady, setFrameReady] = useState(false);
  const send = useCallback((msg: PreviewMessage) => frame.current?.contentWindow?.postMessage(msg, STOREFRONT_ORIGIN), []);
  // Latest values for the message handler (the preview can (re)load at any time).
  const latest = useRef({ theme, selectedId, editor, removeSection, addElement, select });
  latest.current = { theme, selectedId, editor, removeSection, addElement, select };

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== STOREFRONT_ORIGIN || e.source !== frame.current?.contentWindow) return;
      const msg = e.data as PreviewMessage;
      const L = latest.current;
      switch (msg?.type) {
        case 'cp:ready':
          setFrameReady(true);
          send({ type: 'cp:theme', theme: L.theme });
          send({ type: 'cp:highlight', id: L.selectedId });
          break;
        case 'cp:select':
          // Phones: first tap selects on the page; tapping it again opens its settings.
          if (msg.id === L.selectedId) setMobileView('edit');
          L.select(msg.id);
          break;
        case 'cp:add':
          setInsertAt(msg.index);
          setPanel({ kind: 'elements' });
          setMobileView('edit');
          break;
        case 'cp:drop':
          L.addElement(msg.sectionType, msg.index);
          break;
        case 'cp:edit':
          L.editor.setSetting(msg.id, msg.key, msg.value);
          break;
        case 'cp:action': {
          const i = L.theme.sections.findIndex(s => s.id === msg.id);
          const s = L.theme.sections[i];
          if (!s) break;
          if (msg.action === 'up') L.editor.move(i, i - 1);
          if (msg.action === 'down') L.editor.move(i, i + 1);
          if (msg.action === 'hide') { L.editor.toggleHidden(s.id); toast(`${SECTION_DEFINITIONS[s.type].label} hidden — show it again from Layers`); }
          if (msg.action === 'delete') L.removeSection(s);
          if (msg.action === 'duplicate') { const id = L.editor.duplicate(s.id); if (id) L.select(id); }
          break;
        }
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [send]);

  useEffect(() => {
    if (!frameReady) return;
    const t = setTimeout(() => send({ type: 'cp:theme', theme }), 60);
    return () => clearTimeout(t);
  }, [frameReady, theme, send]);

  useEffect(() => { if (frameReady) send({ type: 'cp:highlight', id: selectedId }); }, [frameReady, selectedId, send]);

  const dismissWelcome = () => { setWelcome(false); params.delete('welcome'); setParams(params, { replace: true }); };
  const openPanel = (p: Panel) => { setPanel(p); setMobileView('edit'); if (p.kind !== 'elements') setInsertAt(null); };

  const topButton = (active: boolean) => cn('flex h-9 items-center gap-2 rounded-lg px-2.5 text-[13px] font-medium transition-colors',
    active ? 'bg-white/15 text-white' : 'text-zinc-300 hover:bg-white/10 hover:text-white');

  return (
    <div className="flex h-[100dvh] flex-col bg-zinc-100">
      {/* ── Top bar ── */}
      <header className="flex h-14 shrink-0 items-center gap-1 bg-zinc-900 px-2 text-white sm:gap-2 sm:px-3">
        <Link to="/" aria-label="Back to admin" className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-300 hover:bg-white/10 hover:text-white"><ArrowLeft className="h-5 w-5" /></Link>
        <img src="/mariseh-logo.png" alt="" className="hidden h-7 w-7 sm:block" />
        <div className="hidden h-6 w-px bg-white/15 sm:block" />
        <button type="button" onClick={() => openPanel({ kind: 'elements' })} className={topButton(panel.kind === 'elements')} aria-label="Add elements">
          <Plus className="h-[18px] w-[18px]" /><span className="hidden md:inline">Elements</span>
        </button>
        <button type="button" onClick={() => (window.innerWidth >= 1024 ? setLayersOpen(o => !o) : openPanel({ kind: 'layers' }))}
          className={topButton(layersOpen || panel.kind === 'layers')} aria-label="Layers">
          <Layers className="h-[18px] w-[18px]" /><span className="hidden md:inline">Layers</span>
        </button>
        <button type="button" onClick={() => openPanel({ kind: 'site' })} className={topButton(panel.kind === 'site')} aria-label="Site style">
          <Paintbrush className="h-[18px] w-[18px]" /><span className="hidden md:inline">Site style</span>
        </button>

        <div className="flex-1" />

        <div className="hidden items-center rounded-lg bg-white/10 p-0.5 lg:flex" role="group" aria-label="Preview size">
          {([['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]] as const).map(([d, Icon]) => (
            <button key={d} type="button" onClick={() => setDevice(d)} aria-pressed={device === d} aria-label={`${d} preview`} title={`${d[0].toUpperCase()}${d.slice(1)}`}
              className={cn('flex h-8 w-9 items-center justify-center rounded-md transition-colors', device === d ? 'bg-white text-zinc-900' : 'text-zinc-300 hover:text-white')}>
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <div className="flex rounded-lg bg-white/10 p-0.5 lg:hidden" role="group" aria-label="Editor view">
          {(['edit', 'preview'] as const).map(v => (
            <button key={v} type="button" onClick={() => setMobileView(v)} aria-pressed={mobileView === v}
              className={cn('h-8 rounded-md px-2.5 text-xs font-medium capitalize', mobileView === v ? 'bg-white text-zinc-900' : 'text-zinc-300')}>
              {v === 'edit' ? 'Panel' : 'Page'}
            </button>
          ))}
        </div>

        <div className="hidden items-center sm:flex">
          <button type="button" onClick={editor.undo} disabled={!editor.canUndo} aria-label="Undo (Ctrl+Z)" title="Undo (Ctrl+Z)"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-300 hover:bg-white/10 hover:text-white disabled:opacity-30"><Undo2 className="h-[18px] w-[18px]" /></button>
          <button type="button" onClick={editor.redo} disabled={!editor.canRedo} aria-label="Redo (Ctrl+Shift+Z)" title="Redo (Ctrl+Shift+Z)"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-300 hover:bg-white/10 hover:text-white disabled:opacity-30"><Redo2 className="h-[18px] w-[18px]" /></button>
        </div>

        <label className="hidden cursor-pointer items-center gap-2 px-1 text-xs font-medium text-zinc-300 md:flex" title="Visitors can see your store when it's live">
          <Switch checked={store.published} disabled={publish.isPending} onChange={v => publish.mutate(v)} label="Store is live" />
          {store.published ? 'Live' : 'Hidden'}
        </label>
        <a href={storefrontUrl(store.slug, store.custom_domain)} target="_blank" rel="noopener noreferrer" aria-label="View store" title="View store"
          className="hidden h-9 w-9 items-center justify-center rounded-lg text-zinc-300 hover:bg-white/10 hover:text-white sm:flex"><ExternalLink className="h-[18px] w-[18px]" /></a>
        <Button size="sm" className="h-9 px-4" onClick={doSave} disabled={!editor.dirty || save.isPending}>
          {save.isPending ? <Loader2 className="animate-spin" /> : null}
          {editor.dirty ? 'Publish' : 'Published'}
        </Button>
      </header>

      <div className="relative flex min-h-0 flex-1">
        {/* ── Left panel ── */}
        <aside className={cn('w-full shrink-0 flex-col border-r border-zinc-200 bg-white lg:flex lg:w-[320px]', mobileView === 'edit' ? 'flex' : 'hidden')}>
          {panel.kind === 'section' && selected ? (
            <SectionEditor
              section={selected} tab={tab} onTab={setTab} categories={categories}
              onBack={() => setPanel({ kind: 'elements' })}
              onChange={(key, v) => editor.setSetting(selected.id, key, v)}
              onToggleHidden={() => editor.toggleHidden(selected.id)}
              onDuplicate={() => { const id = editor.duplicate(selected.id); if (id) select(id); }}
              onRemove={() => removeSection(selected)}
              brandColor={theme.brand.primaryColor}
            />
          ) : panel.kind === 'site' ? (
            <>
              <PanelHeader title="Site style" onBack={() => setPanel({ kind: 'elements' })} />
              <div className="min-h-0 flex-1 overflow-y-auto">
                <BrandSettings brand={theme.brand} onChange={editor.setBrand} marketplace={theme.template === 'marketplace'} onStyle={m => editor.setTemplate(m ? 'marketplace' : 'recommended')} />
              </div>
            </>
          ) : panel.kind === 'layers' ? (
            <>
              <PanelHeader title="Layers" onBack={() => setPanel({ kind: 'elements' })} />
              <div className="min-h-0 flex-1 overflow-y-auto">
                <LayersList sections={theme.sections} selectedId={selectedId} onSelect={id => { select(id); setMobileView('preview'); }}
                  onToggleHidden={editor.toggleHidden} onMove={editor.move} />
              </div>
            </>
          ) : (
            <ElementsPanel
              canAdd={editor.canAdd}
              insertAt={insertAt}
              onCancelInsert={() => setInsertAt(null)}
              onAdd={t => { addElement(t); setMobileView('preview'); }}
              welcome={welcome}
              onDismissWelcome={dismissWelcome}
            />
          )}
        </aside>

        {/* ── Canvas ── */}
        <main className={cn('min-w-0 flex-1 overflow-auto p-0 lg:block lg:p-5', mobileView === 'preview' ? 'block' : 'hidden')}>
          <div className="mx-auto h-full overflow-hidden bg-white shadow-sm transition-[width] duration-300 lg:rounded-xl lg:shadow-[0_1px_3px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.06)]"
            style={{ width: DEVICE_WIDTH[device], maxWidth: '100%' }}>
            <iframe ref={frame} src={previewUrl(store.slug)} title="Store page" className="h-full w-full" />
          </div>
        </main>

        {/* ── Floating Layers (desktop) ── */}
        {layersOpen && (
          <div className="absolute bottom-5 right-5 top-5 hidden w-[260px] flex-col overflow-hidden rounded-xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.15)] ring-1 ring-black/5 lg:flex">
            <div className="flex h-11 shrink-0 items-center gap-2 bg-zinc-900 px-3 text-white">
              <Layers className="h-4 w-4" />
              <p className="flex-1 text-[13px] font-semibold">Layers</p>
              <button type="button" onClick={() => setLayersOpen(false)} aria-label="Close layers" className="rounded p-1 text-zinc-300 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <LayersList sections={theme.sections} selectedId={selectedId} onSelect={select} onToggleHidden={editor.toggleHidden} onMove={editor.move} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PanelHeader({ title, onBack, children }: { title: string; onBack?: () => void; children?: ReactNode }) {
  return (
    <div className="flex h-12 shrink-0 items-center gap-1 border-b border-zinc-200 px-2">
      {onBack && <button type="button" onClick={onBack} aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"><ChevronLeft className="h-5 w-5" /></button>}
      <p className={cn('flex-1 truncate text-[15px] font-semibold', !onBack && 'pl-2')}>{title}</p>
      {children}
    </div>
  );
}

// ─── Elements panel ───────────────────────────────────────────────────────────

function ElementsPanel({ canAdd, insertAt, onCancelInsert, onAdd, welcome, onDismissWelcome }: {
  canAdd: (t: SectionType) => boolean; insertAt: number | null; onCancelInsert: () => void; onAdd: (t: SectionType) => void;
  welcome: boolean; onDismissWelcome: () => void;
}) {
  const [query, setQuery] = useState('');
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ELEMENT_GROUPS.map(g => ({
      ...g,
      types: g.types.filter(t => !q || `${SECTION_DEFINITIONS[t].label} ${SECTION_DEFINITIONS[t].description}`.toLowerCase().includes(q)),
    })).filter(g => g.types.length);
  }, [query]);

  const onDragStart = (e: DragEvent, type: SectionType) => {
    e.dataTransfer.setData('text/plain', `${DRAG_PREFIX}${type}`);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <>
      <PanelHeader title="Elements" />
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {welcome && (
          <div className="mb-3 rounded-xl bg-emerald-50 p-3 text-[13px] ring-1 ring-emerald-200">
            <div className="flex items-start gap-2">
              <PartyPopper className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              <div className="flex-1 text-emerald-900">
                <p className="font-semibold">Your store is ready!</p>
                <p className="mt-0.5 text-emerald-900/80">Click anything on the page to change it. Drag elements from here onto the page to add more. Press Publish when you're happy.</p>
              </div>
              <button type="button" onClick={onDismissWelcome} aria-label="Dismiss" className="text-emerald-800/70 hover:text-emerald-900"><X className="h-4 w-4" /></button>
            </div>
          </div>
        )}

        {insertAt !== null && (
          <div className="mb-3 flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2.5 text-[13px] text-blue-900 ring-1 ring-blue-200">
            <MousePointerClick className="h-4 w-4 shrink-0" />
            <p className="flex-1">Pick an element to add at the spot you chose.</p>
            <button type="button" onClick={onCancelInsert} className="font-semibold hover:underline">Cancel</button>
          </div>
        )}

        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search elements" aria-label="Search elements"
            className="h-10 w-full rounded-lg border-0 bg-zinc-100 pl-9 pr-3 text-[15px] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand/30" />
        </div>

        {groups.map(g => (
          <div key={g.title} className="mb-5">
            <p className="mb-2 px-0.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{g.title}</p>
            <div className="grid grid-cols-2 gap-2">
              {g.types.map(type => {
                const def = SECTION_DEFINITIONS[type];
                const Icon = sectionIcon(def.icon);
                const allowed = canAdd(type);
                return (
                  <button key={type} type="button" draggable={allowed} disabled={!allowed}
                    onDragStart={e => onDragStart(e, type)} onClick={() => onAdd(type)}
                    title={allowed ? `${def.description} — drag onto the page, or click to add` : 'Already on the page'}
                    className="group flex aspect-[5/4] cursor-grab flex-col items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white p-2 text-center transition-all hover:border-brand/50 hover:shadow-md active:cursor-grabbing active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-zinc-200 disabled:hover:shadow-none">
                    <Icon className="h-6 w-6 text-zinc-600 transition-colors group-hover:text-brand" strokeWidth={1.6} />
                    <span className="text-[12px] font-medium leading-tight text-zinc-700">{def.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <p className="px-1 pb-2 text-[12px] leading-snug text-zinc-500">Tip: drag an element onto the page — a blue line shows where it will go. On a phone, tap to add it.</p>
      </div>
    </>
  );
}

// ─── Layers (drag to reorder) ─────────────────────────────────────────────────

function LayersList({ sections, selectedId, onSelect, onToggleHidden, onMove }: {
  sections: Section[]; selectedId: string | null; onSelect: (id: string) => void; onToggleHidden: (id: string) => void;
  onMove: (from: number, to: number) => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const onDrop = (e: DragEvent, i: number) => {
    e.preventDefault();
    if (dragIndex !== null) onMove(dragIndex, i);
    setDragIndex(null);
    setOverIndex(null);
  };

  return (
    <div className="p-2">
      <div className="rounded-md px-2.5 py-1.5 text-[12px] text-zinc-400">Header</div>
      <ul className="space-y-0.5" aria-label="Page sections">
        {sections.map((s, i) => {
          const def = SECTION_DEFINITIONS[s.type];
          const Icon = sectionIcon(def.icon);
          const title = String(s.settings.heading || s.settings.title || s.settings.text || '');
          return (
            <li key={s.id} draggable
              onDragStart={e => { setDragIndex(i); e.dataTransfer.effectAllowed = 'move'; }}
              onDragOver={e => { e.preventDefault(); setOverIndex(i); }}
              onDragLeave={() => setOverIndex(o => (o === i ? null : o))}
              onDrop={e => onDrop(e, i)}
              onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
              className={cn('group flex items-center rounded-lg pr-1 transition-colors',
                selectedId === s.id ? 'bg-blue-50 ring-1 ring-blue-300' : 'hover:bg-zinc-100',
                overIndex === i && dragIndex !== i && 'ring-2 ring-blue-500',
                dragIndex === i && 'opacity-50')}>
              <span className="flex h-9 w-6 shrink-0 cursor-grab items-center justify-center text-zinc-300 active:cursor-grabbing" aria-hidden><GripVertical className="h-4 w-4" /></span>
              <button type="button" onClick={() => onSelect(s.id)} className={cn('flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left', s.hidden && 'opacity-45')}>
                <Icon className="h-4 w-4 shrink-0 text-zinc-500" />
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium">{def.label}</span>
                  {title && <span className="block truncate text-[11px] text-zinc-500">{title}</span>}
                </span>
              </button>
              <div className="flex items-center opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 max-lg:opacity-100">
                <button type="button" onClick={() => onMove(i, i - 1)} disabled={i === 0} aria-label={`Move ${def.label} up`} className="rounded p-1 text-zinc-400 hover:text-zinc-900 disabled:opacity-30"><ChevronUp className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => onMove(i, i + 1)} disabled={i === sections.length - 1} aria-label={`Move ${def.label} down`} className="rounded p-1 text-zinc-400 hover:text-zinc-900 disabled:opacity-30"><ChevronDown className="h-3.5 w-3.5" /></button>
              </div>
              <button type="button" onClick={() => onToggleHidden(s.id)} aria-label={s.hidden ? `Show ${def.label}` : `Hide ${def.label}`}
                className="rounded p-1 text-zinc-400 hover:text-zinc-900">{s.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
            </li>
          );
        })}
      </ul>
      <div className="rounded-md px-2.5 py-1.5 text-[12px] text-zinc-400">Footer</div>
    </div>
  );
}

// ─── Section editor: Content / Style / Advanced ───────────────────────────────

const BG_PRESETS = ['#ffffff', '#f4f4f5', '#faf6ef', '#18181b'];

function SectionEditor({ section, tab, onTab, categories, onBack, onChange, onToggleHidden, onDuplicate, onRemove, brandColor }: {
  section: Section; tab: Tab; onTab: (t: Tab) => void; categories: string[]; onBack: () => void;
  onChange: (key: string, v: Section['settings'][string]) => void; onToggleHidden: () => void; onDuplicate: () => void; onRemove: () => void;
  brandColor: string;
}) {
  const def = SECTION_DEFINITIONS[section.type];
  const st = sectionStyle(section.settings);
  const iconBtn = 'flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900';

  return (
    <>
      <PanelHeader title={`Edit ${def.label}`} onBack={onBack}>
        {!def.limit && <button type="button" onClick={onDuplicate} aria-label="Duplicate" title="Duplicate" className={iconBtn}><Copy className="h-4 w-4" /></button>}
        <button type="button" onClick={onRemove} aria-label="Delete" title="Delete" className={cn(iconBtn, 'hover:text-red-600')}><Trash2 className="h-4 w-4" /></button>
      </PanelHeader>

      <div className="grid shrink-0 grid-cols-3 border-b border-zinc-200" role="tablist">
        {([['content', 'Content', PenLine], ['style', 'Style', Paintbrush], ['advanced', 'Advanced', Settings2]] as const).map(([k, label, Icon]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => onTab(k)}
            className={cn('flex flex-col items-center gap-1 border-b-2 py-2.5 text-[12px] font-medium transition-colors',
              tab === k ? 'border-brand text-brand' : 'border-transparent text-zinc-500 hover:text-zinc-900')}>
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
        {tab === 'content' && (
          <>
            <p className="text-[13px] text-zinc-500">{def.description} You can also click text on the page to change it there.</p>
            {def.fields.map(f => (
              <SettingField key={f.key} field={f} value={section.settings[f.key]} onChange={v => onChange(f.key, v)} categories={categories} sectionId={section.id} />
            ))}
          </>
        )}

        {tab === 'style' && (
          <>
            <FieldRow label="Background colour">
              <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Background colour">
                <button type="button" role="radio" aria-checked={!st.background} onClick={() => onChange('_bg', '')} title="Default"
                  className={cn('relative h-8 w-8 overflow-hidden rounded-full border border-zinc-300 bg-white ring-offset-2', !st.background && 'ring-2 ring-brand')}>
                  <span className="absolute left-1/2 top-[-4px] h-10 w-[2px] -translate-x-1/2 rotate-45 bg-red-500" aria-hidden />
                </button>
                {[brandColor, ...BG_PRESETS].map(c => (
                  <button key={c} type="button" role="radio" aria-checked={st.background.toLowerCase() === c.toLowerCase()} onClick={() => onChange('_bg', c)} aria-label={c}
                    className={cn('h-8 w-8 rounded-full border border-zinc-300 ring-offset-2', st.background.toLowerCase() === c.toLowerCase() && 'ring-2 ring-brand')} style={{ background: c }} />
                ))}
                <label className="relative flex h-8 items-center gap-1.5 rounded-full border border-zinc-300 pl-1 pr-2.5 text-xs" title="Any colour">
                  <span className="h-6 w-6 rounded-full bg-[conic-gradient(red,yellow,lime,cyan,blue,magenta,red)]" />
                  Custom
                  <input type="color" value={st.background || '#ffffff'} onChange={e => onChange('_bg', e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Custom background colour" />
                </label>
              </div>
              <p className="mt-1.5 text-xs text-zinc-500">Text turns white or dark automatically so it's always easy to read.</p>
            </FieldRow>
            <FieldRow label="Space above">
              <Segmented label="Space above" value={st.marginTop} onChange={(v: SpacingKey) => onChange('_mt', v)} options={spacingOptions} />
            </FieldRow>
            <FieldRow label="Space below">
              <Segmented label="Space below" value={st.marginBottom} onChange={(v: SpacingKey) => onChange('_mb', v)} options={spacingOptions} />
            </FieldRow>
          </>
        )}

        {tab === 'advanced' && (
          <>
            <div className="divide-y divide-zinc-100 rounded-xl ring-1 ring-zinc-200">
              <ToggleRow label="Show on the page" hint="Turn off to hide it without deleting." checked={!section.hidden} onChange={() => onToggleHidden()} />
              <ToggleRow label="Show on phones" checked={!st.hideMobile} onChange={v => onChange('_hideMobile', !v)} />
              <ToggleRow label="Show on computers" checked={!st.hideDesktop} onChange={v => onChange('_hideDesktop', !v)} />
            </div>
            <FieldRow id="anchor" label="Link name (optional)">
              <input id="anchor" value={String(section.settings._anchor ?? '')} onChange={e => onChange('_anchor', e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                placeholder="e.g. new-arrivals" maxLength={40}
                className="h-10 w-full rounded-lg border-0 bg-zinc-100 px-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-brand/30" />
              <p className="mt-1.5 text-xs text-zinc-500">{st.anchor ? <>Buttons linking to <code className="rounded bg-zinc-100 px-1">#{st.anchor}</code> jump here.</> : 'Give it a name so a button can jump straight to this section.'}</p>
            </FieldRow>
          </>
        )}
      </div>
    </>
  );
}

const spacingOptions: { value: SpacingKey; label: string }[] = [
  { value: '', label: 'None' },
  ...(Object.keys(SPACING) as Exclude<SpacingKey, ''>[]).map(k => ({ value: k, label: SPACING[k].label })),
];

function ToggleRow({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5">
      <div>
        <p className="text-[14px] font-medium">{label}</p>
        {hint && <p className="text-xs text-zinc-500">{hint}</p>}
      </div>
      <Switch checked={checked} onChange={onChange} label={label} />
    </div>
  );
}

// ─── Site style (brand) ───────────────────────────────────────────────────────

function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="grid gap-1 rounded-lg bg-zinc-100 p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }} role="radiogroup" aria-label={label}>
      {options.map(o => (
        <button key={o.value || 'none'} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}
          className={cn('h-8 rounded-md text-xs font-medium transition-colors', value === o.value ? 'bg-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900')}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function BrandSettings({ brand, onChange, marketplace, onStyle }: {
  brand: Brand; onChange: (patch: Partial<Brand>, mergeKey?: string) => void; marketplace: boolean; onStyle: (marketplace: boolean) => void;
}) {
  const fontOptions = (Object.keys(FONTS) as FontKey[]).map(k => ({ value: k, label: FONTS[k].label }));
  const select = 'h-10 w-full rounded-lg border-0 bg-zinc-100 px-2.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-brand/30';
  return (
    <div className="space-y-6 p-4">
      <FieldRow label="Store style">
        <Segmented label="Store style" value={marketplace ? 'marketplace' : 'boutique'} onChange={(v: 'marketplace' | 'boutique') => onStyle(v === 'marketplace')}
          options={[{ value: 'marketplace', label: 'Marketplace' }, { value: 'boutique', label: 'Boutique' }]} />
        <p className="mt-1.5 text-xs text-zinc-500">{marketplace ? 'Like SHEIN, Temu or Alfudi: search, category icons and lots of products.' : 'Calm and elegant: big photos and your story.'}</p>
      </FieldRow>

      <FieldRow id="brand-logo" label="Logo">
        <ImageInput id="brand-logo" value={brand.logoUrl} onChange={logoUrl => onChange({ logoUrl })} compact />
      </FieldRow>

      <FieldRow label="Brand colour">
        <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Brand colour">
          {BRAND_SWATCHES.map(c => (
            <button key={c} type="button" role="radio" aria-checked={brand.primaryColor === c} aria-label={c} onClick={() => onChange({ primaryColor: c })}
              className={cn('h-7 w-7 rounded-full ring-offset-2', brand.primaryColor === c && 'ring-2 ring-zinc-900')} style={{ background: c }} />
          ))}
          <label className="relative flex h-7 items-center gap-1.5 rounded-full border border-zinc-300 pl-1 pr-2.5 text-xs" title="Custom colour">
            <span className="h-5 w-5 rounded-full" style={{ background: brand.primaryColor }} />
            {brand.primaryColor}
            <input type="color" value={brand.primaryColor} onChange={e => onChange({ primaryColor: e.target.value }, 'brand:color')} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Custom brand colour" />
          </label>
        </div>
      </FieldRow>

      <FieldRow id="brand-heading-font" label="Heading font">
        <select id="brand-heading-font" value={brand.headingFont} onChange={e => onChange({ headingFont: e.target.value as FontKey })} className={select}>
          {fontOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </FieldRow>
      <FieldRow id="brand-body-font" label="Body font">
        <select id="brand-body-font" value={brand.font} onChange={e => onChange({ font: e.target.value as FontKey })} className={select}>
          {fontOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </FieldRow>

      <FieldRow label="Corners">
        <Segmented label="Corner style" value={brand.radius} onChange={(radius: RadiusKey) => onChange({ radius })}
          options={(Object.keys(RADII) as RadiusKey[]).map(k => ({ value: k, label: RADII[k].label }))} />
      </FieldRow>

      <FieldRow label="Background">
        <Segmented label="Background" value={brand.surface} onChange={(surface: SurfaceKey) => onChange({ surface })}
          options={(Object.keys(SURFACES) as SurfaceKey[]).map(k => ({ value: k, label: SURFACES[k].label.split(' ').pop()! }))} />
      </FieldRow>
    </div>
  );
}

