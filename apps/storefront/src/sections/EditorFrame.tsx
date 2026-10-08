import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, Copy, EyeOff, Plus, Trash2 } from 'lucide-react';
import {
  DRAG_PREFIX, SECTION_DEFINITIONS, SPACING, hexToHslTriplet, readableOn, sectionStyle,
  type Section, type SectionAction, type SectionType,
} from '@cp/shared';
import { cn } from '@cp/ui';
import { useStore } from '../store';

// Elementor-style canvas editing inside the storefront preview, plus the
// per-section style (background, spacing, responsive visibility) that also
// applies on the live store.

/** CSS for a section's Style / Advanced settings. */
function sectionCss(section: Section) {
  const st = sectionStyle(section.settings);
  const style: Record<string, string> = {};
  if (st.background) {
    const bg = hexToHslTriplet(st.background);
    const fg = readableOn(st.background);
    const lightText = fg.startsWith('0 0% 100%');
    // Re-point the theme variables so everything inside the section follows.
    Object.assign(style, {
      '--background': bg, '--card': bg, '--muted': bg, '--foreground': fg,
      '--muted-foreground': lightText ? '0 0% 88%' : '240 4% 32%',
      '--border': lightText ? '0 0% 72%' : '240 6% 72%',
      background: st.background, color: `hsl(${fg})`,
    });
  }
  if (st.marginTop) style.marginTop = SPACING[st.marginTop].value;
  if (st.marginBottom) style.marginBottom = SPACING[st.marginBottom].value;
  return { st, style: style as CSSProperties };
}

/** Wraps a rendered section: live → style only; editor preview → selection, toolbar, inline text editing. */
export function SectionFrame({ section, children, label, editId }: {
  section: Section; children: ReactNode; label?: string; editId?: string;
}) {
  const { preview, highlightId, selectSection, postToEditor, store } = useStore();
  const { st, style } = sectionCss(section);

  if (!preview) {
    return (
      <div id={st.anchor || undefined} style={style}
        className={cn(st.hideMobile && 'max-md:hidden', st.hideDesktop && 'md:hidden', st.anchor && 'scroll-mt-20')}>
        {children}
      </div>
    );
  }

  const id = editId ?? section.id;
  const selected = highlightId === id;
  const all = store?.theme.sections ?? [];
  const index = all.findIndex(s => s.id === id);
  const name = label ?? SECTION_DEFINITIONS[section.type].label;
  const act = (action: SectionAction) => postToEditor({ type: 'cp:action', id, action });

  const onClickCapture = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-editor-ui]') || target.isContentEditable) return;
    // In the editor, clicks select (and edit text) instead of navigating.
    e.preventDefault();
    e.stopPropagation();
    const field = target.closest<HTMLElement>('[data-field]');
    const fieldOwner = field?.closest<HTMLElement>('[data-edit-id]')?.dataset.editId ?? id;
    if (field && selected) startInlineEdit(field, fieldOwner, postToEditor);
    else selectSection(id);
  };

  return (
    <div data-section-id={id} onClickCapture={onClickCapture} style={style}
      className={cn('group/sec relative cursor-pointer',
        st.hideMobile && 'max-md:opacity-40', st.hideDesktop && 'md:opacity-40')}>
      {children}

      {/* Outline */}
      <div aria-hidden className={cn('pointer-events-none absolute inset-0 z-20 outline outline-2 -outline-offset-2 transition-[outline-color]',
        selected ? 'outline-[#2563eb]' : 'outline-transparent group-hover/sec:outline-[#2563eb]/60')} />

      {/* Toolbar (Elementor's blue handle) */}
      <div data-editor-ui className={cn('absolute left-1/2 top-0 z-30 -translate-x-1/2 items-stretch overflow-hidden rounded-b-lg bg-[#2563eb] text-white shadow-lg',
        selected ? 'flex' : 'hidden group-hover/sec:flex')}>
        <ToolButton label={`Add above ${name}`} onClick={() => postToEditor({ type: 'cp:add', index })}><Plus /></ToolButton>
        <button type="button" onClick={() => selectSection(id)} className="max-w-[160px] truncate px-2 text-[11px] font-semibold uppercase tracking-wide hover:bg-white/15">{name}</button>
        <ToolButton label="Move up" onClick={() => act('up')} disabled={index <= 0}><ArrowUp /></ToolButton>
        <ToolButton label="Move down" onClick={() => act('down')} disabled={index >= all.length - 1}><ArrowDown /></ToolButton>
        {!SECTION_DEFINITIONS[section.type].limit && <ToolButton label="Duplicate" onClick={() => act('duplicate')}><Copy /></ToolButton>}
        <ToolButton label="Hide" onClick={() => act('hide')}><EyeOff /></ToolButton>
        <ToolButton label="Delete" onClick={() => act('delete')}><Trash2 /></ToolButton>
      </div>

      {/* "+" to insert below */}
      <button type="button" data-editor-ui onClick={() => postToEditor({ type: 'cp:add', index: index + 1 })} aria-label={`Add below ${name}`}
        className={cn('absolute bottom-0 left-1/2 z-30 h-7 w-7 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full bg-[#2563eb] text-white shadow-lg ring-2 ring-white transition-transform hover:scale-110',
          selected ? 'flex' : 'hidden group-hover/sec:flex')}>
        <Plus className="h-4 w-4" strokeWidth={3} />
      </button>

      {selected && (
        <p data-editor-ui className="pointer-events-none absolute bottom-2 right-2 z-30 rounded-md bg-zinc-900/80 px-2 py-1 text-[11px] font-medium text-white">
          Click any text to change it
        </p>
      )}
    </div>
  );
}

function ToolButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label}
      className="flex h-7 w-7 items-center justify-center hover:bg-white/15 disabled:opacity-40 [&_svg]:h-3.5 [&_svg]:w-3.5">
      {children}
    </button>
  );
}

/** Make a [data-field] element editable in place; send the new text on blur / Enter. */
function startInlineEdit(el: HTMLElement, id: string, post: ReturnType<typeof useStore>['postToEditor']) {
  if (el.isContentEditable) return;
  const key = el.dataset.field!;
  const multiline = el.dataset.multiline === 'true';
  const before = el.innerText;
  el.contentEditable = 'true';
  el.classList.add('cp-inline-editing');
  el.focus();
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);

  const finish = (save: boolean) => {
    el.removeEventListener('keydown', onKey);
    el.removeEventListener('blur', onBlur);
    el.contentEditable = 'false';
    el.classList.remove('cp-inline-editing');
    const value = el.innerText.replace(/ /g, ' ').trim();
    if (!save) { el.innerText = before; return; }
    if (value !== before.trim()) post({ type: 'cp:edit', id, key, value });
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); finish(false); el.blur(); }
    if (e.key === 'Enter' && (!multiline || e.ctrlKey || e.metaKey)) { e.preventDefault(); el.blur(); }
  };
  const onBlur = () => finish(true);
  el.addEventListener('keydown', onKey);
  el.addEventListener('blur', onBlur);
}

/**
 * Drop target for elements dragged from the editor panel: shows a blue line
 * where the element will land and tells the editor on drop.
 */
export function CanvasDropZone() {
  const { preview, postToEditor, store } = useStore();
  const [line, setLine] = useState<{ top: number; index: number } | null>(null);
  const latest = useRef({ store, postToEditor });
  latest.current = { store, postToEditor };

  useEffect(() => {
    if (!preview) return;
    const isOurs = (e: DragEvent) => !!e.dataTransfer && [...e.dataTransfer.types].includes('text/plain');
    const target = (y: number) => {
      const sections = latest.current.store?.theme.sections ?? [];
      const els = [...document.querySelectorAll<HTMLElement>('[data-section-id]')];
      if (!els.length) return { top: 120, index: sections.length };
      for (const el of els) {
        const r = el.getBoundingClientRect();
        if (y < r.top + r.height / 2) {
          return { top: r.top, index: Math.max(0, sections.findIndex(s => s.id === el.dataset.sectionId)) };
        }
      }
      const last = els[els.length - 1];
      const lastIndex = sections.findIndex(s => s.id === last.dataset.sectionId);
      return { top: last.getBoundingClientRect().bottom, index: lastIndex < 0 ? sections.length : lastIndex + 1 };
    };
    const over = (e: DragEvent) => {
      if (!isOurs(e)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
      setLine(target(e.clientY));
    };
    const leave = (e: DragEvent) => { if (!e.relatedTarget) setLine(null); };
    const drop = (e: DragEvent) => {
      const data = e.dataTransfer?.getData('text/plain') ?? '';
      setLine(null);
      if (!data.startsWith(DRAG_PREFIX)) return;
      e.preventDefault();
      const type = data.slice(DRAG_PREFIX.length) as SectionType;
      if (!(type in SECTION_DEFINITIONS)) return;
      latest.current.postToEditor({ type: 'cp:drop', sectionType: type, index: target(e.clientY).index });
    };
    const end = () => setLine(null);
    document.addEventListener('dragover', over);
    document.addEventListener('dragleave', leave);
    document.addEventListener('drop', drop);
    document.addEventListener('dragend', end);
    return () => {
      document.removeEventListener('dragover', over);
      document.removeEventListener('dragleave', leave);
      document.removeEventListener('drop', drop);
      document.removeEventListener('dragend', end);
    };
  }, [preview]);

  if (!line) return null;
  return (
    <div className="pointer-events-none fixed inset-x-3 z-[60] -translate-y-1/2" style={{ top: line.top }}>
      <div className="relative h-1 rounded-full bg-[#2563eb] shadow-[0_0_0_3px_rgba(37,99,235,0.25)]">
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2563eb] px-2.5 py-0.5 text-[11px] font-semibold text-white">Drop here</span>
      </div>
    </div>
  );
}
