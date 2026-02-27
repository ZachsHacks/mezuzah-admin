'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Mezuzah } from '@/types/mezuzah';
import { SiteContent } from '@/types/site-content';
import MezuzahCard from '@/components/MezuzahCard';
import MezuzahForm from '@/components/MezuzahForm';
import AboutEditor from '@/components/AboutEditor';
import ContactEditor from '@/components/ContactEditor';
import CategoriesEditor from '@/components/CategoriesEditor';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

type FontSize = 'normal' | 'large' | 'larger';
const FONT_SIZES: { key: FontSize; label: string; px: string; scale: string }[] = [
  { key: 'normal', label: 'A', px: '0.72rem', scale: '100%' },
  { key: 'large',  label: 'A', px: '0.88rem', scale: '112%' },
  { key: 'larger', label: 'A', px: '1.05rem', scale: '125%' },
];

type Mode =
  | { type: 'idle' }
  | { type: 'add' }
  | { type: 'edit'; index: number }
  | { type: 'editDraft'; draftId: string }
  | { type: 'delete'; index: number };

type Tab = 'collection' | 'about' | 'contact' | 'categories';

const TAB_LABELS: { id: Tab; label: string }[] = [
  { id: 'collection',  label: 'Collection' },
  { id: 'about',       label: 'About Page' },
  { id: 'contact',     label: 'Contact Page' },
  { id: 'categories',  label: 'Categories' },
];

export default function AdminPage() {
  const [mezuzahs, setMezuzahs]       = useState<Mezuzah[]>([]);
  const [drafts, setDrafts]           = useState<Mezuzah[]>([]);
  const [siteContent, setSiteContent] = useState<SiteContent | null>(null);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [mode, setMode]               = useState<Mode>({ type: 'idle' });
  const [tab, setTab]                 = useState<Tab>('collection');
  const [fontSize, setFontSize]       = useState<FontSize>('normal');
  const router = useRouter();

  // Restore + persist font size
  useEffect(() => {
    const saved = (localStorage.getItem('admin_fontsize') as FontSize) ?? 'normal';
    setFontSize(saved);
  }, []);

  useEffect(() => {
    const scale = FONT_SIZES.find((f) => f.key === fontSize)?.scale ?? '100%';
    document.documentElement.style.fontSize = scale;
    localStorage.setItem('admin_fontsize', fontSize);
  }, [fontSize]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [mRes, cRes, dRes] = await Promise.all([
      fetch('/api/mezuzahs'),
      fetch('/api/site-content'),
      fetch('/api/drafts'),
    ]);

    if (mRes.status === 401 || cRes.status === 401) {
      router.push('/');
      return;
    }

    if (mRes.ok) {
      const { mezuzahs: data } = await mRes.json();
      setMezuzahs(data);
    } else {
      toast.error('Failed to load collection');
    }

    if (cRes.ok) {
      const { siteContent: data } = await cRes.json();
      setSiteContent(data);
    } else {
      toast.error('Failed to load page content');
    }

    if (dRes.ok) {
      const { drafts: data } = await dRes.json();
      setDrafts(data ?? []);
    }

    setLoading(false);
  }, [router]);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function saveAll(updated: Mezuzah[], changeDescription?: string): Promise<boolean> {
    setSaving(true);
    const res = await fetch('/api/mezuzahs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mezuzahs: updated, changeDescription }),
    });
    setSaving(false);

    if (res.ok) {
      setMezuzahs(updated);
      setMode({ type: 'idle' });
      toast.success('Saved! Changes will go live in ~1–2 minutes.');
      return true;
    } else {
      const { error } = await res.json();
      toast.error(`Save failed: ${error}`);
      return false;
    }
  }

  async function saveDrafts(updated: Mezuzah[]) {
    const res = await fetch('/api/drafts', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drafts: updated }),
    });
    if (res.ok) setDrafts(updated);
    return res.ok;
  }

  // Called by MezuzahForm after each image upload — persists a draft to GitHub
  async function handleAutoSave(form: Mezuzah): Promise<Mezuzah> {
    const id = form.id ?? Date.now().toString(36);
    const draft: Mezuzah = { ...form, id, draft: true };

    const updatedDrafts = drafts.some((d) => d.id === id)
      ? drafts.map((d) => (d.id === id ? draft : d))
      : [draft, ...drafts];

    await saveDrafts(updatedDrafts);
    toast.success('Draft saved — finish it any time on any device.', { duration: 3000 });
    return draft;
  }

  async function handleAdd(m: Mezuzah) {
    const draftId = m.id;
    const { id: _id, draft: _draft, ...cleanMezuzah } = m;
    const ok = await saveAll([cleanMezuzah, ...mezuzahs], `Added "${cleanMezuzah.name}" ($${cleanMezuzah.price})`);
    if (ok && draftId) {
      await saveDrafts(drafts.filter((d) => d.id !== draftId));
    }
  }

  // Completes a draft: publishes it to the live collection and removes it from drafts
  async function handleDraftComplete(m: Mezuzah) {
    const draftId = m.id;
    const { id: _id, draft: _draft, ...cleanMezuzah } = m;
    const ok = await saveAll([cleanMezuzah, ...mezuzahs], `Added "${cleanMezuzah.name}" ($${cleanMezuzah.price})`);
    if (ok && draftId) {
      await saveDrafts(drafts.filter((d) => d.id !== draftId));
    }
  }

  async function handleDeleteDraft(id: string) {
    await saveDrafts(drafts.filter((d) => d.id !== id));
    toast.success('Draft deleted.');
  }

  function handleEdit(index: number, m: Mezuzah) {
    const updated = [...mezuzahs];
    updated[index] = m;
    saveAll(updated, `Updated "${m.name}" ($${m.price})`);
  }

  function handleDelete(index: number) {
    const name = mezuzahs[index].name;
    const updated = mezuzahs.filter((_, i) => i !== index);
    saveAll(updated, `Removed "${name}" from collection`);
  }

  // Called after categories are saved — cascade renames + deletions to all mezuzahs
  function handleCategoriesSaved(updated: SiteContent, renames: [string, string][]) {
    if (siteContent) {
      const oldAll = [...siteContent.categories.sizes, ...siteContent.categories.specials];
      const newSet = new Set([...updated.categories.sizes, ...updated.categories.specials]);
      const removed = oldAll.filter((c) => !newSet.has(c));

      let cascaded = mezuzahs;

      if (renames.length > 0) {
        const renameMap = new Map(renames);
        cascaded = cascaded.map((m) => ({
          ...m,
          categories: m.categories.map((c) => renameMap.get(c) ?? c),
        }));
      }

      if (removed.length > 0) {
        cascaded = cascaded.map((m) => ({
          ...m,
          categories: m.categories.filter((c) => !removed.includes(c)),
        }));
      }

      const anyChanged =
        JSON.stringify(mezuzahs.map((m) => m.categories)) !==
        JSON.stringify(cascaded.map((m) => m.categories));

      if (anyChanged) {
        saveAll(cascaded, `Updated categories across collection`);
      }
    }
    setSiteContent(updated);
  }

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/');
  }

  const editingMezuzah  = mode.type === 'edit'      ? mezuzahs[mode.index] : undefined;
  const editingDraft    = mode.type === 'editDraft'  ? drafts.find((d) => d.id === mode.draftId) : undefined;
  const deletingMezuzah = mode.type === 'delete'     ? mezuzahs[mode.index] : undefined;

  return (
    <div className="min-h-screen">
      {/* Glass header */}
      <header
        className="sticky top-0 z-10 border-b"
        style={{
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderColor: 'rgba(255,255,255,0.85)',
          boxShadow: '0 2px 12px rgba(30,100,180,0.10)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1
              className="text-xl leading-tight"
              style={{ fontFamily: 'var(--font-caveat), cursive', color: '#1e3a58', fontWeight: 700 }}
            >
              ✡ Made in <span style={{ color: '#1a7fd4' }}>Heaven</span> Mezuzahs
            </h1>
            <p
              className="text-xs tracking-widest uppercase"
              style={{ fontFamily: 'var(--font-playfair), serif', color: '#3d6a96' }}
            >
              Admin Panel
            </p>
          </div>
          <div className="flex gap-2 items-center">
            {tab === 'collection' && (
              <Button
                size="sm"
                onClick={() => setMode({ type: 'add' })}
                style={{
                  fontFamily: 'var(--font-playfair), serif',
                  background: 'linear-gradient(135deg, #4499d4, #2277bb)',
                  border: 'none',
                  boxShadow: '0 2px 10px rgba(34,119,187,0.30)',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                }}
              >
                + Add Mezuzah
              </Button>
            )}

            {/* Font size toggle */}
            <div
              className="flex items-center gap-0.5 rounded-lg px-1 py-0.5"
              style={{ border: '1px solid rgba(68,153,212,0.25)', background: 'rgba(255,255,255,0.5)' }}
              title="Adjust text size"
            >
              {FONT_SIZES.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFontSize(f.key)}
                  style={{
                    fontSize: f.px,
                    fontFamily: 'var(--font-playfair), serif',
                    fontWeight: 700,
                    background: fontSize === f.key ? 'rgba(68,153,212,0.15)' : 'transparent',
                    border: fontSize === f.key ? '1px solid rgba(68,153,212,0.40)' : '1px solid transparent',
                    borderRadius: '4px',
                    color: fontSize === f.key ? '#1a7fd4' : '#8aacc8',
                    cursor: 'pointer',
                    padding: '1px 5px',
                    lineHeight: '1.4',
                    transition: 'all 0.15s',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={handleLogout}
              className="text-slate-500"
              style={{ fontFamily: 'var(--font-playfair), serif' }}
            >
              Sign Out
            </Button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="max-w-6xl mx-auto px-4 flex gap-1">
          {TAB_LABELS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                fontFamily: 'var(--font-playfair), serif',
                fontSize: '0.85rem',
                fontWeight: tab === id ? 700 : 500,
                color: tab === id ? '#1a7fd4' : '#3d6a96',
                background: 'transparent',
                border: 'none',
                borderBottom: tab === id ? '2px solid #1a7fd4' : '2px solid transparent',
                padding: '8px 16px',
                marginBottom: '-1px',
                cursor: 'pointer',
                transition: 'color 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div
            className="text-center py-24"
            style={{ fontFamily: 'var(--font-playfair), serif', color: '#3d6a96' }}
          >
            Loading…
          </div>
        ) : (
          <>
            {/* ── Collection tab ─────────────────────────────────────────── */}
            {tab === 'collection' && (
              <>
                {/* Readable info pill */}
                <div
                  className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm mb-6"
                  style={{
                    background: 'rgba(255,255,255,0.80)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.90)',
                    fontFamily: 'var(--font-playfair), serif',
                    color: '#2d5070',
                    boxShadow: '0 2px 8px rgba(30,100,180,0.10)',
                  }}
                >
                  <span style={{ color: '#1a7fd4' }}>✡</span>
                  <strong>{mezuzahs.length}</strong>&nbsp;mezuzah{mezuzahs.length !== 1 ? 's' : ''} in the collection
                  {drafts.length > 0 && (
                    <>
                      <span style={{ color: '#8aacc8', margin: '0 2px' }}>·</span>
                      <strong style={{ color: '#b45309' }}>{drafts.length}</strong>&nbsp;draft{drafts.length !== 1 ? 's' : ''}
                    </>
                  )}
                  <span style={{ color: '#8aacc8', margin: '0 2px' }}>·</span>
                  Changes go live in ~1–2 min after saving
                </div>

                {/* Drafts section */}
                {drafts.length > 0 && (
                  <div className="mb-8">
                    <h2
                      className="text-sm font-semibold uppercase tracking-widest mb-3"
                      style={{ fontFamily: 'var(--font-playfair), serif', color: '#b45309' }}
                    >
                      Drafts — tap to complete
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                      {drafts.map((draft) => (
                        <MezuzahCard
                          key={`draft-${draft.id}`}
                          mezuzah={draft}
                          onEdit={() => setMode({ type: 'editDraft', draftId: draft.id! })}
                          onDelete={() => handleDeleteDraft(draft.id!)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {mezuzahs.map((m, i) => (
                    <MezuzahCard
                      key={`${m.name}-${i}`}
                      mezuzah={m}
                      onEdit={() => setMode({ type: 'edit', index: i })}
                      onDelete={() => setMode({ type: 'delete', index: i })}
                    />
                  ))}
                </div>
              </>
            )}

            {/* ── About tab ──────────────────────────────────────────────── */}
            {tab === 'about' && siteContent && (
              <div
                className="rounded-2xl p-6 sm:p-8"
                style={{
                  background: 'rgba(255,255,255,0.80)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.90)',
                  boxShadow: '0 4px 24px rgba(30,100,180,0.10)',
                }}
              >
                <h2
                  className="text-lg font-bold mb-1"
                  style={{ fontFamily: 'var(--font-playfair), serif', color: '#1e3a58' }}
                >
                  About Page
                </h2>
                <p className="text-sm mb-6" style={{ color: '#3d6a96' }}>
                  Edit the text that appears on the About page of the website.
                </p>
                <AboutEditor
                  initial={siteContent}
                  onSaved={(updated) => setSiteContent(updated)}
                />
              </div>
            )}

            {/* ── Contact tab ────────────────────────────────────────────── */}
            {tab === 'contact' && siteContent && (
              <div
                className="rounded-2xl p-6 sm:p-8"
                style={{
                  background: 'rgba(255,255,255,0.80)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.90)',
                  boxShadow: '0 4px 24px rgba(30,100,180,0.10)',
                }}
              >
                <h2
                  className="text-lg font-bold mb-1"
                  style={{ fontFamily: 'var(--font-playfair), serif', color: '#1e3a58' }}
                >
                  Contact Page
                </h2>
                <p className="text-sm mb-6" style={{ color: '#3d6a96' }}>
                  Edit the intro text and phone number shown on the Contact page.
                </p>
                <ContactEditor
                  initial={siteContent}
                  onSaved={(updated) => setSiteContent(updated)}
                />
              </div>
            )}

            {/* ── Categories tab ──────────────────────────────────────────── */}
            {tab === 'categories' && siteContent && (
              <div
                className="rounded-2xl p-6 sm:p-8"
                style={{
                  background: 'rgba(255,255,255,0.80)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.90)',
                  boxShadow: '0 4px 24px rgba(30,100,180,0.10)',
                }}
              >
                <h2
                  className="text-lg font-bold mb-1"
                  style={{ fontFamily: 'var(--font-playfair), serif', color: '#1e3a58' }}
                >
                  Categories
                </h2>
                <p className="text-sm mb-6" style={{ color: '#3d6a96' }}>
                  Manage the size and special-tag categories that appear on the website filter bar and in the mezuzah form.
                </p>
                <CategoriesEditor
                  initial={siteContent}
                  onSaved={handleCategoriesSaved}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Add Dialog */}
      <Dialog open={mode.type === 'add'} onOpenChange={(open) => !open && setMode({ type: 'idle' })}>
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto"
          style={{ background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(16px)' }}
        >
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'var(--font-playfair), serif', color: '#1e3a58' }}>
              Add New Mezuzah
            </DialogTitle>
            <DialogDescription>
              Upload photos or a video first — it auto-saves as a draft so you can finish the details later on any device.
            </DialogDescription>
          </DialogHeader>
          <MezuzahForm
            onSave={handleAdd}
            onCancel={() => setMode({ type: 'idle' })}
            saving={saving}
            sizeCategories={siteContent?.categories.sizes}
            specialCategories={siteContent?.categories.specials}
            onAutoSave={handleAutoSave}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={mode.type === 'edit'}
        onOpenChange={(open) => !open && setMode({ type: 'idle' })}
      >
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto"
          style={{ background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(16px)' }}
        >
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'var(--font-playfair), serif', color: '#1e3a58' }}>
              Edit Mezuzah
            </DialogTitle>
          </DialogHeader>
          {editingMezuzah && (
            <MezuzahForm
              initial={editingMezuzah}
              onSave={(m) => handleEdit((mode as { type: 'edit'; index: number }).index, m)}
              onCancel={() => setMode({ type: 'idle' })}
              saving={saving}
              sizeCategories={siteContent?.categories.sizes}
              specialCategories={siteContent?.categories.specials}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Complete Draft Dialog */}
      <Dialog
        open={mode.type === 'editDraft'}
        onOpenChange={(open) => !open && setMode({ type: 'idle' })}
      >
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto"
          style={{ background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(16px)' }}
        >
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'var(--font-playfair), serif', color: '#1e3a58' }}>
              Complete Your Draft
            </DialogTitle>
            <DialogDescription>
              Add the name, price, and other details to publish this mezuzah to the website.
            </DialogDescription>
          </DialogHeader>
          {editingDraft && (
            <MezuzahForm
              initial={editingDraft}
              onSave={handleDraftComplete}
              onCancel={() => setMode({ type: 'idle' })}
              saving={saving}
              sizeCategories={siteContent?.categories.sizes}
              specialCategories={siteContent?.categories.specials}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={mode.type === 'delete'}
        onOpenChange={(open) => !open && setMode({ type: 'idle' })}
      >
        <DialogContent
          className="max-w-sm"
          style={{ background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(16px)' }}
        >
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'var(--font-playfair), serif', color: '#1e3a58' }}>
              Delete Mezuzah
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{deletingMezuzah?.name}</strong> from the
              collection? This will update the live website.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => handleDelete((mode as { type: 'delete'; index: number }).index)}
              disabled={saving}
            >
              {saving ? 'Deleting…' : 'Yes, Delete'}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setMode({ type: 'idle' })}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
