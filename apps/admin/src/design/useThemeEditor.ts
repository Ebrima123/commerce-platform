import { useCallback, useMemo, useRef, useState } from 'react';
import { createSection, SECTION_DEFINITIONS, type Brand, type Section, type SectionType, type SettingValue, type TemplateKey, type Theme } from '@cp/shared';

const MAX_HISTORY = 60;
const MERGE_WINDOW_MS = 600;

/**
 * Theme editor state with undo/redo. Consecutive edits to the same field
 * within ~600ms merge into one history step, so undo doesn't rewind one
 * keystroke at a time. History lives in refs (computed outside React's state
 * updaters, which may run twice in StrictMode).
 */
export function useThemeEditor(initial: Theme) {
  const [theme, setThemeState] = useState<Theme>(initial);
  const [saved, setSaved] = useState(() => JSON.stringify(initial));
  const current = useRef(theme);
  const past = useRef<Theme[]>([]);
  const future = useRef<Theme[]>([]);
  const lastEdit = useRef<{ key: string; at: number } | null>(null);

  const show = (t: Theme) => { current.current = t; setThemeState(t); };

  const commit = useCallback((update: (t: Theme) => Theme, mergeKey?: string) => {
    const prev = current.current;
    const next = update(prev);
    if (next === prev) return;
    const now = Date.now();
    const merge = !!mergeKey && lastEdit.current?.key === mergeKey && now - lastEdit.current.at < MERGE_WINDOW_MS;
    if (!merge) past.current = [...past.current.slice(-(MAX_HISTORY - 1)), prev];
    lastEdit.current = mergeKey ? { key: mergeKey, at: now } : null;
    future.current = [];
    show(next);
  }, []);

  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (!prev) return;
    future.current = [current.current, ...future.current];
    lastEdit.current = null;
    show(prev);
  }, []);

  const redo = useCallback(() => {
    const [next, ...rest] = future.current;
    if (!next) return;
    past.current = [...past.current, current.current];
    future.current = rest;
    lastEdit.current = null;
    show(next);
  }, []);

  const actions = useMemo(() => {
    const mapSections = (fn: (sections: Section[]) => Section[]) => (t: Theme) => ({ ...t, sections: fn(t.sections) });
    return {
      setTemplate: (template: TemplateKey) => commit(t => ({ ...t, template })),

      setBrand: (patch: Partial<Brand>, mergeKey?: string) =>
        commit(t => ({ ...t, brand: { ...t.brand, ...patch } }), mergeKey),

      setSetting: (id: string, key: string, value: SettingValue) =>
        commit(mapSections(ss => ss.map(s => (s.id === id ? { ...s, settings: { ...s.settings, [key]: value } } : s))), `${id}:${key}`),

      toggleHidden: (id: string) =>
        commit(mapSections(ss => ss.map(s => (s.id === id ? { ...s, hidden: !s.hidden } : s)))),

      remove: (id: string) => commit(mapSections(ss => ss.filter(s => s.id !== id))),

      duplicate: (id: string): string | null => {
        const source = current.current.sections.find(s => s.id === id);
        if (!source) return null;
        const copy: Section = { ...structuredClone(source), id: createSection(source.type).id };
        commit(mapSections(ss => {
          const next = [...ss];
          next.splice(ss.findIndex(s => s.id === id) + 1, 0, copy);
          return next;
        }));
        return copy.id;
      },

      move: (from: number, to: number) => commit(t => {
        if (to < 0 || to >= t.sections.length || from === to) return t;
        const sections = [...t.sections];
        const [item] = sections.splice(from, 1);
        sections.splice(to, 0, item);
        return { ...t, sections };
      }),

      /** Insert a new section at a position (0 = top of the page). */
      insertAt: (type: SectionType, index: number): Section => {
        const section = createSection(type);
        commit(mapSections(ss => {
          const next = [...ss];
          next.splice(Math.max(0, Math.min(index, ss.length)), 0, section);
          return next;
        }));
        return section;
      },

      add: (type: SectionType, afterId?: string | null): Section => {
        const section = createSection(type);
        commit(mapSections(ss => {
          const next = [...ss];
          const i = afterId ? ss.findIndex(s => s.id === afterId) : -1;
          next.splice(i >= 0 ? i + 1 : ss.length, 0, section);
          return next;
        }));
        return section;
      },
    };
  }, [commit]);

  const canAdd = (type: SectionType) => {
    const limit = SECTION_DEFINITIONS[type].limit;
    return !limit || theme.sections.filter(s => s.type === type).length < limit;
  };

  return {
    theme,
    dirty: JSON.stringify(theme) !== saved,
    markSaved: (t: Theme) => setSaved(JSON.stringify(t)),
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
    undo, redo, canAdd,
    ...actions,
  };
}
