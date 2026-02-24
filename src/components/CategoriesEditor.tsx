'use client';

import { useState, useRef } from 'react';
import { SiteContent } from '@/types/site-content';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface Props {
  initial: SiteContent;
  onSaved: (updated: SiteContent, renames: [string, string][]) => void;
}

function CategoryList({
  title,
  hint,
  items,
  onAdd,
  onRemove,
  onMove,
  onEdit,
}: {
  title: string;
  hint: string;
  items: string[];
  onAdd: (v: string) => void;
  onRemove: (i: number) => void;
  onMove: (i: number, dir: -1 | 1) => void;
  onEdit: (i: number, oldVal: string, newVal: string) => void;
}) {
  const [draft, setDraft] = useState('');
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editVal, setEditVal] = useState('');
  const [editingOld, setEditingOld] = useState('');
  const editRef = useRef<HTMLInputElement>(null);

  function handleAdd() {
    const v = draft.trim();
    if (!v) return;
    onAdd(v);
    setDraft('');
  }

  function startEdit(i: number) {
    setEditIdx(i);
    setEditVal(items[i]);
    setEditingOld(items[i]);
    setTimeout(() => editRef.current?.focus(), 0);
  }

  function commitEdit() {
    if (editIdx === null) return;
    const newVal = editVal.trim();
    if (newVal && newVal !== editingOld) {
      onEdit(editIdx, editingOld, newVal);
    }
    setEditIdx(null);
    setEditVal('');
    setEditingOld('');
  }

  function cancelEdit() {
    setEditIdx(null);
    setEditVal('');
    setEditingOld('');
  }

  return (
    <div className="space-y-3">
      <div>
        <Label style={{ fontFamily: 'var(--font-playfair), serif', color: '#1e3a58', fontWeight: 700 }}>
          {title}
        </Label>
        <p className="text-xs mt-0.5" style={{ color: '#3d6a96' }}>{hint}</p>
      </div>

      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            {editIdx === i ? (
              /* ── Inline edit mode ── */
              <>
                <Input
                  ref={editRef}
                  value={editVal}
                  onChange={(e) => setEditVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitEdit();
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  onBlur={commitEdit}
                  style={{ background: 'rgba(255,255,255,0.95)', border: '1.5px solid #4499d4' }}
                  className="flex-1"
                />
                <button
                  onMouseDown={(e) => { e.preventDefault(); commitEdit(); }}
                  className="text-green-600 hover:text-green-800 px-1.5 text-sm font-bold transition-colors"
                  title="Save"
                >
                  ✓
                </button>
                <button
                  onMouseDown={(e) => { e.preventDefault(); cancelEdit(); }}
                  className="text-slate-400 hover:text-slate-600 px-1.5 text-sm font-bold transition-colors"
                  title="Cancel"
                >
                  ✕
                </button>
              </>
            ) : (
              /* ── Display mode ── */
              <>
                <div
                  className="flex-1 rounded-lg px-3 py-1.5 text-sm"
                  style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(68,153,212,0.25)', color: '#1e3a58' }}
                >
                  {item}
                </div>
                <button
                  onClick={() => startEdit(i)}
                  className="text-xs px-1.5 py-1 rounded hover:bg-blue-50 transition-colors"
                  style={{ color: '#4499d4' }}
                  title="Rename"
                >
                  ✏
                </button>
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => onMove(i, -1)}
                    disabled={i === 0}
                    className="text-xs px-1 disabled:opacity-30 hover:text-blue-600 transition-colors"
                    style={{ color: '#3d6a96' }}
                    title="Move up"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => onMove(i, 1)}
                    disabled={i === items.length - 1}
                    className="text-xs px-1 disabled:opacity-30 hover:text-blue-600 transition-colors"
                    style={{ color: '#3d6a96' }}
                    title="Move down"
                  >
                    ▼
                  </button>
                </div>
                <button
                  onClick={() => onRemove(i)}
                  disabled={items.length <= 1}
                  className="text-red-400 hover:text-red-600 px-1.5 disabled:opacity-30 transition-colors text-sm font-bold"
                  title="Remove"
                >
                  ✕
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder={`Add ${title.toLowerCase()}…`}
          style={{ background: 'rgba(255,255,255,0.8)' }}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={!draft.trim()}
          style={{ borderColor: 'rgba(68,153,212,0.35)', color: '#2277bb', fontFamily: 'var(--font-playfair), serif', whiteSpace: 'nowrap' }}
        >
          + Add
        </Button>
      </div>
    </div>
  );
}

export default function CategoriesEditor({ initial, onSaved }: Props) {
  const [categories, setCategories] = useState(initial.categories);
  const [saving, setSaving] = useState(false);
  const [renames, setRenames] = useState<[string, string][]>([]);

  function updateSizes(fn: (prev: string[]) => string[]) {
    setCategories((c) => ({ ...c, sizes: fn(c.sizes) }));
  }

  function updateSpecials(fn: (prev: string[]) => string[]) {
    setCategories((c) => ({ ...c, specials: fn(c.specials) }));
  }

  function move(arr: string[], i: number, dir: -1 | 1): string[] {
    const j = i + dir;
    if (j < 0 || j >= arr.length) return arr;
    const next = [...arr];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  }

  function handleEdit(which: 'sizes' | 'specials', i: number, oldVal: string, newVal: string) {
    const update = which === 'sizes' ? updateSizes : updateSpecials;
    update((prev) => {
      const next = [...prev];
      next[i] = newVal;
      return next;
    });
    setRenames((r) => [...r, [oldVal, newVal]]);
  }

  async function handleSave() {
    setSaving(true);
    const updated: SiteContent = { ...initial, categories };
    const res = await fetch('/api/site-content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteContent: updated, page: 'Categories' }),
    });
    setSaving(false);

    if (res.ok) {
      onSaved(updated, renames);
      setRenames([]);
      toast.success('Categories saved! Changes will go live in ~1–2 minutes.');
    } else {
      const { error } = await res.json();
      toast.error(`Save failed: ${error}`);
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <CategoryList
        title="Size Categories"
        hint="Shown as filter options on the website. Each mezuzah is assigned one size."
        items={categories.sizes}
        onAdd={(v) => updateSizes((prev) => [...prev, v])}
        onRemove={(i) => updateSizes((prev) => prev.filter((_, idx) => idx !== i))}
        onMove={(i, dir) => updateSizes((prev) => move(prev, i, dir))}
        onEdit={(i, oldVal, newVal) => handleEdit('sizes', i, oldVal, newVal)}
      />

      <div style={{ borderTop: '1px solid rgba(68,153,212,0.20)' }} />

      <CategoryList
        title="Special Tags"
        hint='Shown as highlighted filter toggles. Tags containing "gold" show in amber, "new" in green.'
        items={categories.specials}
        onAdd={(v) => updateSpecials((prev) => [...prev, v])}
        onRemove={(i) => updateSpecials((prev) => prev.filter((_, idx) => idx !== i))}
        onMove={(i, dir) => updateSpecials((prev) => move(prev, i, dir))}
        onEdit={(i, oldVal, newVal) => handleEdit('specials', i, oldVal, newVal)}
      />

      {renames.length > 0 && (
        <div
          className="rounded-lg px-4 py-2.5 text-sm"
          style={{ background: 'rgba(68,153,212,0.08)', border: '1px solid rgba(68,153,212,0.22)', color: '#2d5070', fontFamily: 'var(--font-playfair), serif' }}
        >
          <strong style={{ color: '#1e3a58' }}>Pending renames:</strong>{' '}
          {renames.map(([a, b], i) => (
            <span key={i}>
              {i > 0 && ', '}
              <em>{a}</em> → <em>{b}</em>
            </span>
          ))}
          <span style={{ color: '#6699cc' }}> — will cascade to all products on save</span>
        </div>
      )}

      <Button
        onClick={handleSave}
        disabled={saving}
        style={{
          fontFamily: 'var(--font-playfair), serif',
          background: 'linear-gradient(135deg, #4499d4, #2277bb)',
          border: 'none',
          boxShadow: '0 2px 10px rgba(34,119,187,0.30)',
          fontWeight: 700,
          letterSpacing: '0.06em',
        }}
      >
        {saving ? 'Saving…' : 'Save Categories'}
      </Button>
    </div>
  );
}
