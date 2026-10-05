import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft, ChevronLeft, Copy, Eye, EyeOff, ExternalLink, GripVertical, Loader2, Monitor, Paintbrush,
  Plus, Redo2, Smartphone, Tablet, Trash2, Undo2, X, ChevronUp, ChevronDown, PartyPopper, LayoutList,
} from 'lucide-react';
import {
  api, ApiError, BRAND_SWATCHES, FONTS, RADII, SECTION_DEFINITIONS, SECTION_ORDER, SURFACES, normalizeTheme,
  type Brand, type FontKey, type PlatformStore, type PreviewMessage, type PublicPlatformStore, type RadiusKey,
  type Section, type SectionType, type SurfaceKey, type Theme,
} from '@cp/shared';
import { Button, cn } from '@cp/ui';
import { useMyStore, previewUrl, storefrontUrl, STOREFRONT_ORIGIN } from '../platform';
import { useThemeEditor } from '../design/useThemeEditor';
import { FieldRow, ImageInput, SettingField } from '../design/FieldControls';
import { sectionIcon } from '../design/icons';

type Device = 'desktop' | 'tablet' | 'mobile';
const DEVICE_WIDTH: Record<Device, string> = { desktop: '100%', tablet: '820px', mobile: '390px' };
type Panel = { kind: 'sections' } | { kind: 'brand' } | { kind: 'section'; id: string };

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
  const [panel, setPanel] = useState<Panel>({ kind: 'sections' });
  const [device, setDevice] = useState<Device>('desktop');
  const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit');
  const [library, setLibrary] = useState(false);
  const [welcome, setWelcome] = useState(params.get('welcome') === '1');
  const selectedId = panel.kind === 'section' ? panel.id : null;
  const selected = theme.sections.find(s => s.id === selectedId) ?? null;

  // Categories for the "Product grid" category picker.
  const { data: publicStore } = useQuery({
    queryKey: ['public-store', store.slug],
    queryFn: () => api<PublicPlatformStore>(`/api/platform/public/${store.slug}/`),
  });
  const categories = publicStore?.categories ?? [];

  // ── Save / publish ──
  const save = useMutation({
    mutationFn: (t: Theme) => api<PlatformStore>(`/api/platform/stores/${store.id}/`, { method: 'PATCH', auth: true, body: { theme: t } }),
    onSuccess: (_, t) => { editor.markSaved(t); qc.invalidateQueries({ queryKey: ['my-store'] }); toast.success('Design saved — your store is updated'); },
    onError: e => toast.error(e instanceof ApiError ? e.message : 'Could not save. Please try again.'),
  });
  const publish = useMutation({
    mutationFn: (published: boolean) => api<PlatformStore>(`/api/platform/stores/${store.id}/`, { method: 'PATCH', auth: true, body: { published } }),
    onSuccess: s => { qc.invalidateQueries({ queryKey: ['my-store'] }); toast.success(s.published ? 'Store is live' : 'Store hidden — visitors see "Coming soon"'); },
  });
  const doSave = useCallback(() => { if (editor.dirty && !save.isPending) save.mutate(theme); }, [editor.dirty, save, theme]);

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
  const latest = useRef({ theme, selectedId });
  latest.current = { theme, selectedId };

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== STOREFRONT_ORIGIN || e.source !== frame.current?.contentWindow) return;
      const msg = e.data as PreviewMessage;
      if (msg?.type === 'cp:ready') {
        setFrameReady(true);
        send({ type: 'cp:theme', theme: latest.current.theme });
        send({ type: 'cp:highlight', id: latest.current.selectedId });
      }
      if (msg?.type === 'cp:select') { setPanel({ kind: 'section', id: msg.id }); setMobileView('edit'); }
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

  // ── Section actions ──
  const addSection = (type: SectionType) => {
    const s = editor.add(type, selectedId);
    setLibrary(false);
    setPanel({ kind: 'section', id: s.id });
  };
  const removeSection = (s: Section) => {
    editor.remove(s.id);
    if (selectedId === s.id) setPanel({ kind: 'sections' });
    toast(`${SECTION_DEFINITIONS[s.type].label} removed`, { action: { label: 'Undo', onClick: () => editor.undo() } });
  };

  const dismissWelcome = () => { setWelcome(false); params.delete('welcome'); setParams(params, { replace: true }); };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* ── Top bar ── */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/70 px-2 sm:px-3">
        <Button asChild variant="ghost" size="icon" aria-label="Back to admin"><Link to="/"><ArrowLeft /></Link></Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{store.name}</p>
          <p className="text-[11px] text-muted-foreground" aria-live="polite">
            {save.isPending ? 'Saving…' : editor.dirty ? 'Unsaved changes' : 'All changes saved'}
          </p>
        </div>

        <div className="hidden items-center gap-0.5 sm:flex">
          <Button variant="ghost" size="icon" onClick={editor.undo} disabled={!editor.canUndo} aria-label="Undo (Ctrl+Z)" title="Undo (Ctrl+Z)"><Undo2 /></Button>
          <Button variant="ghost" size="icon" onClick={editor.redo} disabled={!editor.canRedo} aria-label="Redo (Ctrl+Shift+Z)" title="Redo (Ctrl+Shift+Z)"><Redo2 /></Button>
        </div>

        <div className="mx-1 hidden items-center rounded-lg bg-muted p-0.5 lg:flex" role="group" aria-label="Preview size">
          {([['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]] as const).map(([d, Icon]) => (
            <button key={d} type="button" onClick={() => setDevice(d)} aria-pressed={device === d} aria-label={`${d} preview`}
              className={cn('flex h-8 w-8 items-center justify-center rounded-md transition-colors', device === d ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>

        <div className="flex rounded-lg bg-muted p-0.5 lg:hidden" role="group" aria-label="Editor view">
          {(['edit', 'preview'] as const).map(v => (
            <button key={v} type="button" onClick={() => setMobileView(v)} aria-pressed={mobileView === v}
              className={cn('h-8 rounded-md px-3 text-xs font-medium capitalize', mobileView === v ? 'bg-background shadow-sm' : 'text-muted-foreground')}>
              {v}
            </button>
          ))}
        </div>

        <label className="hidden cursor-pointer items-center gap-2 px-2 text-xs font-medium md:flex">
          <input type="checkbox" className="peer sr-only" checked={store.published} disabled={publish.isPending} onChange={e => publish.mutate(e.target.checked)} />
          <span className="relative h-5 w-9 rounded-full bg-border transition-colors peer-checked:bg-emerald-600 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4" />
          {store.published ? 'Live' : 'Hidden'}
        </label>
        <Button asChild variant="outline" size="sm" className="hidden h-9 sm:inline-flex">
          <a href={storefrontUrl(store.slug)} target="_blank" rel="noopener noreferrer">View <ExternalLink /></a>
        </Button>
        <Button size="sm" className="h-9" onClick={doSave} disabled={!editor.dirty || save.isPending}>
          {save.isPending && <Loader2 className="animate-spin" />} Save
        </Button>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* ── Left panel ── */}
        <aside className={cn('w-full shrink-0 flex-col border-r border-border/70 bg-card lg:flex lg:w-[340px]', mobileView === 'edit' ? 'flex' : 'hidden')}>
          {panel.kind === 'section' && selected ? (
            <SectionSettings
              section={selected}
              categories={categories}
              onBack={() => setPanel({ kind: 'sections' })}
              onChange={(key, v) => editor.setSetting(selected.id, key, v)}
              onToggleHidden={() => editor.toggleHidden(selected.id)}
              onDuplicate={() => { const id = editor.duplicate(selected.id); if (id) setPanel({ kind: 'section', id }); }}
              onRemove={() => removeSection(selected)}
            />
          ) : (
            <>
              <div className="flex shrink-0 gap-1 border-b border-border/70 p-2" role="tablist">
                {([['sections', 'Sections', LayoutList], ['brand', 'Brand', Paintbrush]] as const).map(([k, label, Icon]) => (
                  <button key={k} role="tab" aria-selected={panel.kind === k} onClick={() => setPanel({ kind: k })}
                    className={cn('flex h-9 flex-1 items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors',
                      panel.kind === k ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                    <Icon className="h-4 w-4" /> {label}
                  </button>
                ))}
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {welcome && panel.kind === 'sections' && (
                  <div className="m-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm">
                    <div className="flex items-start gap-2">
                      <PartyPopper className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
                      <div className="flex-1">
                        <p className="font-medium text-emerald-800 dark:text-emerald-300">Your store is ready!</p>
                        <p className="mt-0.5 text-emerald-800/80 dark:text-emerald-300/80">Click any section in the preview to edit it, or add new ones below. Save when you're happy.</p>
                      </div>
                      <button onClick={dismissWelcome} aria-label="Dismiss" className="text-emerald-800/70 hover:text-emerald-900"><X className="h-4 w-4" /></button>
                    </div>
                  </div>
                )}
                {panel.kind === 'brand' ? (
                  <BrandSettings brand={theme.brand} onChange={editor.setBrand} />
                ) : (
                  <SectionListPanel
                    sections={theme.sections}
                    onSelect={id => setPanel({ kind: 'section', id })}
                    onToggleHidden={editor.toggleHidden}
                    onMove={editor.move}
                    onAdd={() => setLibrary(true)}
                  />
                )}
              </div>
            </>
          )}
        </aside>

        {/* ── Preview ── */}
        <main className={cn('min-w-0 flex-1 overflow-auto bg-muted/60 p-0 lg:block lg:p-4', mobileView === 'preview' ? 'block' : 'hidden')}>
          <div className="mx-auto h-full overflow-hidden bg-white shadow-sm transition-[width] duration-300 lg:rounded-lg lg:border lg:border-border/70"
            style={{ width: DEVICE_WIDTH[device], maxWidth: '100%' }}>
            <iframe ref={frame} src={previewUrl(store.slug)} title="Store preview" className="h-full w-full" />
          </div>
        </main>
      </div>

      {library && <SectionLibrary canAdd={editor.canAdd} onAdd={addSection} onClose={() => setLibrary(false)} />}
    </div>
  );
}

// ─── Section list (drag to reorder) ───────────────────────────────────────────

function SectionListPanel({ sections, onSelect, onToggleHidden, onMove, onAdd }: {
  sections: Section[]; onSelect: (id: string) => void; onToggleHidden: (id: string) => void;
  onMove: (from: number, to: number) => void; onAdd: () => void;
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
    <div className="p-3">
      <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">Home page</p>
      <div className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">Header · logo, name, cart</div>
      <ul className="my-1.5 space-y-1" aria-label="Page sections">
        {sections.map((s, i) => {
          const def = SECTION_DEFINITIONS[s.type];
          const Icon = sectionIcon(def.icon);
          const title = String(s.settings.heading || s.settings.title || s.settings.text || def.label);
          return (
            <li key={s.id}
              draggable
              onDragStart={e => { setDragIndex(i); e.dataTransfer.effectAllowed = 'move'; }}
              onDragOver={e => { e.preventDefault(); setOverIndex(i); }}
              onDragLeave={() => setOverIndex(o => (o === i ? null : o))}
              onDrop={e => onDrop(e, i)}
              onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
              className={cn('group flex items-center gap-1 rounded-lg border bg-card pr-1 transition-colors',
                overIndex === i && dragIndex !== i ? 'border-foreground/50' : 'border-border/70',
                dragIndex === i && 'opacity-50', s.hidden && 'opacity-60')}
            >
              <span className="flex h-11 w-7 shrink-0 cursor-grab items-center justify-center text-muted-foreground/60 active:cursor-grabbing" aria-hidden><GripVertical className="h-4 w-4" /></span>
              <button type="button" onClick={() => onSelect(s.id)} className="flex min-w-0 flex-1 items-center gap-2.5 py-2 text-left">
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{def.label}</span>
                  {title !== def.label && <span className="block truncate text-xs text-muted-foreground">{title}</span>}
                </span>
              </button>
              <div className="flex items-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onMove(i, i - 1)} disabled={i === 0} aria-label={`Move ${def.label} up`}><ChevronUp /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onMove(i, i + 1)} disabled={i === sections.length - 1} aria-label={`Move ${def.label} down`}><ChevronDown /></Button>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => onToggleHidden(s.id)} aria-label={s.hidden ? `Show ${def.label}` : `Hide ${def.label}`}>
                {s.hidden ? <EyeOff /> : <Eye />}
              </Button>
            </li>
          );
        })}
      </ul>
      <Button variant="outline" className="w-full border-dashed" onClick={onAdd}><Plus /> Add section</Button>
      <div className="mt-1.5 rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">Footer · contact, WhatsApp</div>
    </div>
  );
}

// ─── Section settings ─────────────────────────────────────────────────────────

function SectionSettings({ section, categories, onBack, onChange, onToggleHidden, onDuplicate, onRemove }: {
  section: Section; categories: string[]; onBack: () => void; onChange: (key: string, v: Section['settings'][string]) => void;
  onToggleHidden: () => void; onDuplicate: () => void; onRemove: () => void;
}) {
  const def = SECTION_DEFINITIONS[section.type];
  const Icon = sectionIcon(def.icon);
  return (
    <>
      <div className="flex h-[53px] shrink-0 items-center gap-1 border-b border-border/70 px-2">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back to sections"><ChevronLeft /></Button>
        <Icon className="h-4 w-4 text-muted-foreground" />
        <p className="flex-1 truncate text-sm font-semibold">{def.label}</p>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggleHidden} aria-label={section.hidden ? 'Show section' : 'Hide section'} title={section.hidden ? 'Show' : 'Hide'}>
          {section.hidden ? <EyeOff /> : <Eye />}
        </Button>
        {!def.limit && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDuplicate} aria-label="Duplicate section" title="Duplicate"><Copy /></Button>}
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onRemove} aria-label="Remove section" title="Remove"><Trash2 /></Button>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <p className="text-xs text-muted-foreground">{def.description}</p>
        {def.fields.map(f => (
          <SettingField key={f.key} field={f} value={section.settings[f.key]} onChange={v => onChange(f.key, v)} categories={categories} sectionId={section.id} />
        ))}
      </div>
    </>
  );
}

// ─── Brand settings ───────────────────────────────────────────────────────────

function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="grid gap-1 rounded-lg bg-muted p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }} role="radiogroup" aria-label={label}>
      {options.map(o => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}
          className={cn('h-8 rounded-md text-xs font-medium transition-colors', value === o.value ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function BrandSettings({ brand, onChange }: { brand: Brand; onChange: (patch: Partial<Brand>, mergeKey?: string) => void }) {
  const fontOptions = (Object.keys(FONTS) as FontKey[]).map(k => ({ value: k, label: FONTS[k].label }));
  return (
    <div className="space-y-6 p-4">
      <FieldRow id="brand-logo" label="Logo">
        <ImageInput id="brand-logo" value={brand.logoUrl} onChange={logoUrl => onChange({ logoUrl })} compact />
      </FieldRow>

      <FieldRow label="Brand colour">
        <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Brand colour">
          {BRAND_SWATCHES.map(c => (
            <button key={c} type="button" role="radio" aria-checked={brand.primaryColor === c} aria-label={c} onClick={() => onChange({ primaryColor: c })}
              className={cn('h-7 w-7 rounded-full ring-offset-2 ring-offset-card', brand.primaryColor === c && 'ring-2 ring-foreground')} style={{ background: c }} />
          ))}
          <label className="relative flex h-7 items-center gap-1.5 rounded-full border border-border pl-1 pr-2.5 text-xs" title="Custom colour">
            <span className="h-5 w-5 rounded-full" style={{ background: brand.primaryColor }} />
            {brand.primaryColor}
            <input type="color" value={brand.primaryColor} onChange={e => onChange({ primaryColor: e.target.value }, 'brand:color')} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Custom brand colour" />
          </label>
        </div>
      </FieldRow>

      <FieldRow id="brand-heading-font" label="Heading font">
        <select id="brand-heading-font" value={brand.headingFont} onChange={e => onChange({ headingFont: e.target.value as FontKey })}
          className="h-9 w-full rounded-md border border-input bg-card px-2.5 text-sm">
          {fontOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </FieldRow>
      <FieldRow id="brand-body-font" label="Body font">
        <select id="brand-body-font" value={brand.font} onChange={e => onChange({ font: e.target.value as FontKey })}
          className="h-9 w-full rounded-md border border-input bg-card px-2.5 text-sm">
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

// ─── Add-section library ──────────────────────────────────────────────────────

function SectionLibrary({ canAdd, onAdd, onClose }: { canAdd: (t: SectionType) => boolean; onAdd: (t: SectionType) => void; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="library-title" onClick={e => e.stopPropagation()}
        className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-t-2xl bg-card shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
          <div>
            <h2 id="library-title" className="text-base font-semibold">Add a section</h2>
            <p className="text-sm text-muted-foreground">Pick a building block — you can edit it right after.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close"><X /></Button>
        </div>
        <div className="grid max-h-[65vh] gap-2 overflow-y-auto p-4 sm:grid-cols-2">
          {SECTION_ORDER.map(type => {
            const def = SECTION_DEFINITIONS[type];
            const Icon = sectionIcon(def.icon);
            const allowed = canAdd(type);
            return (
              <button key={type} type="button" disabled={!allowed} onClick={() => onAdd(type)} autoFocus={type === SECTION_ORDER[0]}
                className="flex items-start gap-3 rounded-xl border border-border/70 p-4 text-left transition-colors hover:border-foreground/40 hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted"><Icon className="h-4 w-4" /></span>
                <span>
                  <span className="block text-sm font-medium">{def.label}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{allowed ? def.description : 'Already on this page.'}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
