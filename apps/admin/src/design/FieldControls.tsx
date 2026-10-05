import { useRef, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp, ImagePlus, Loader2, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { FEATURE_ICONS, type Field, type ListField, type ListItem, type SettingValue } from '@cp/shared';
import { Button, Input, Label, cn } from '@cp/ui';
import { uploadImage, uploadsEnabled } from '../upload';
import { FEATURE_ICONS_MAP } from './icons';

const textareaCls = 'w-full resize-y rounded-md border border-input bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40';
const selectCls = 'h-9 w-full rounded-md border border-input bg-card px-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40';

export function FieldRow({ id, label, help, children }: { id?: string; label: string; help?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
    </div>
  );
}

// ─── Image picker (upload or URL) ─────────────────────────────────────────────

export function ImageInput({ id, value, onChange, compact }: { id: string; value: string; onChange: (url: string) => void; compact?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  const upload = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try { onChange(await uploadImage(file)); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Upload failed'); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); upload(e.dataTransfer.files?.[0]); }}
        className={cn('relative overflow-hidden rounded-lg border border-dashed transition-colors',
          compact ? 'h-20' : 'h-28', dragging ? 'border-foreground/50 bg-muted' : 'border-border bg-muted/40')}
      >
        {value ? (
          <>
            <img src={value} alt="" className="h-full w-full object-cover" />
            <button type="button" onClick={() => onChange('')} aria-label="Remove image"
              className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-md bg-black/60 text-white hover:bg-black/75">
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <button type="button" disabled={!uploadsEnabled || busy} onClick={() => inputRef.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:cursor-default disabled:hover:text-muted-foreground">
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
            {busy ? 'Uploading…' : uploadsEnabled ? 'Upload or drop an image' : 'Paste an image URL below'}
          </button>
        )}
        <input ref={inputRef} id={id} type="file" accept="image/*" className="sr-only" onChange={e => { upload(e.target.files?.[0]); e.target.value = ''; }} />
      </div>
      <Input value={value} onChange={e => onChange(e.target.value)} placeholder="https://…" className="h-8 text-xs" aria-label="Image URL" />
    </div>
  );
}

// ─── Icon picker ──────────────────────────────────────────────────────────────

function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-6 gap-1" role="radiogroup" aria-label="Icon">
      {FEATURE_ICONS.map(name => {
        const Icon = FEATURE_ICONS_MAP[name];
        return (
          <button key={name} type="button" role="radio" aria-checked={value === name} aria-label={name} onClick={() => onChange(name)}
            className={cn('flex h-8 items-center justify-center rounded-md border transition-colors',
              value === name ? 'border-foreground bg-foreground text-background' : 'border-border hover:bg-muted')}>
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}

// ─── List editor (highlights, testimonials, gallery images) ───────────────────

function ListEditor({ field, items, onChange }: { field: Extract<Field, { type: 'list' }>; items: ListItem[]; onChange: (items: ListItem[]) => void }) {
  const [open, setOpen] = useState<number | null>(0);
  const update = (i: number, key: string, v: string) => onChange(items.map((it, j) => (j === i ? { ...it, [key]: v } : it)));
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    setOpen(j);
  };

  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const title = item.title || item.author || item.caption || `${field.itemLabel} ${i + 1}`;
        const expanded = open === i;
        return (
          <div key={i} className="rounded-lg border border-border/70 bg-card">
            <div className="flex items-center gap-1 pl-3 pr-1">
              <button type="button" className="flex h-9 min-w-0 flex-1 items-center text-left text-sm font-medium" onClick={() => setOpen(expanded ? null : i)} aria-expanded={expanded}>
                <span className="truncate">{title}</span>
              </button>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><ChevronUp /></Button>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move down"><ChevronDown /></Button>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label={`Remove ${title}`}><Trash2 /></Button>
            </div>
            {expanded && (
              <div className="space-y-3 border-t border-border/60 p-3">
                {field.fields.map((f: ListField) => {
                  const id = `${field.key}-${i}-${f.key}`;
                  const v = item[f.key] ?? '';
                  return (
                    <FieldRow key={f.key} id={id} label={f.label}>
                      {f.type === 'textarea' ? <textarea id={id} rows={3} className={textareaCls} value={v} onChange={e => update(i, f.key, e.target.value)} />
                        : f.type === 'image' ? <ImageInput id={id} value={v} onChange={url => update(i, f.key, url)} compact />
                        : f.type === 'icon' ? <IconPicker value={v} onChange={val => update(i, f.key, val)} />
                        : <Input id={id} value={v} onChange={e => update(i, f.key, e.target.value)} className="h-8" />}
                    </FieldRow>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
      {items.length < field.max && (
        <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => { onChange([...items, { ...field.newItem }]); setOpen(items.length); }}>
          <Plus /> Add {field.itemLabel.toLowerCase()}
        </Button>
      )}
    </div>
  );
}

// ─── One settings field ───────────────────────────────────────────────────────

export function SettingField({ field, value, onChange, categories, sectionId }: {
  field: Field; value: SettingValue | undefined; onChange: (v: SettingValue) => void; categories: string[]; sectionId: string;
}) {
  const id = `${sectionId}-${field.key}`;
  const str = typeof value === 'string' ? value : value == null ? '' : String(value);

  switch (field.type) {
    case 'text':
      return <FieldRow id={id} label={field.label}><Input id={id} value={str} placeholder={field.placeholder} onChange={e => onChange(e.target.value)} /></FieldRow>;
    case 'url':
      return <FieldRow id={id} label={field.label} help={field.help}><Input id={id} value={str} placeholder={field.placeholder ?? '/ or https://…'} onChange={e => onChange(e.target.value)} /></FieldRow>;
    case 'textarea':
      return <FieldRow id={id} label={field.label}><textarea id={id} rows={4} className={textareaCls} value={str} placeholder={field.placeholder} onChange={e => onChange(e.target.value)} /></FieldRow>;
    case 'image':
      return <FieldRow id={id} label={field.label}><ImageInput id={id} value={str} onChange={onChange} /></FieldRow>;
    case 'select':
      return (
        <FieldRow id={id} label={field.label}>
          <select id={id} className={selectCls} value={str} onChange={e => onChange(e.target.value)}>
            {field.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </FieldRow>
      );
    case 'category':
      return (
        <FieldRow id={id} label={field.label} help={categories.length ? undefined : 'Categories appear once you add products.'}>
          <select id={id} className={selectCls} value={str} onChange={e => onChange(e.target.value)}>
            <option value="">All products</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </FieldRow>
      );
    case 'number': {
      const n = Number(value) || field.min;
      return (
        <FieldRow id={id} label={`${field.label}: ${n}`}>
          <input id={id} type="range" min={field.min} max={field.max} value={n} onChange={e => onChange(Number(e.target.value))} className="w-full accent-foreground" />
        </FieldRow>
      );
    }
    case 'toggle':
      return (
        <label htmlFor={id} className="flex cursor-pointer items-center justify-between gap-3 py-1">
          <span className="text-sm">{field.label}</span>
          <input id={id} type="checkbox" checked={value !== false} onChange={e => onChange(e.target.checked)} className="peer sr-only" />
          <span className="relative h-5 w-9 shrink-0 rounded-full bg-border transition-colors peer-checked:bg-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring/40 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-background after:shadow after:transition-transform peer-checked:after:translate-x-4" />
        </label>
      );
    case 'list':
      return (
        <FieldRow label={field.label}>
          <ListEditor field={field} items={Array.isArray(value) ? (value as ListItem[]) : []} onChange={onChange} />
        </FieldRow>
      );
  }
}
