'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Mezuzah } from '@/types/mezuzah';
import MezuzahCard from '@/components/MezuzahCard';
import MezuzahForm from '@/components/MezuzahForm';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

type Mode = { type: 'idle' } | { type: 'add' } | { type: 'edit'; index: number } | { type: 'delete'; index: number };

export default function AdminPage() {
  const [mezuzahs, setMezuzahs] = useState<Mezuzah[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<Mode>({ type: 'idle' });
  const router = useRouter();

  const loadMezuzahs = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/mezuzahs');
    if (res.status === 401) {
      router.push('/');
      return;
    }
    if (res.ok) {
      const { mezuzahs: data } = await res.json();
      setMezuzahs(data);
    } else {
      toast.error('Failed to load mezuzahs');
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadMezuzahs();
  }, [loadMezuzahs]);

  async function saveAll(updated: Mezuzah[], changeDescription?: string) {
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
    } else {
      const { error } = await res.json();
      toast.error(`Save failed: ${error}`);
    }
  }

  function handleAdd(m: Mezuzah) {
    saveAll([m, ...mezuzahs], `Added "${m.name}" ($${m.price})`);
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

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/');
  }

  const editingMezuzah = mode.type === 'edit' ? mezuzahs[mode.index] : undefined;
  const deletingMezuzah = mode.type === 'delete' ? mezuzahs[mode.index] : undefined;

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
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div
            className="text-center py-24"
            style={{ fontFamily: 'var(--font-playfair), serif', color: '#3d6a96' }}
          >
            Loading collection…
          </div>
        ) : (
          <>
            <p
              className="text-sm mb-6"
              style={{ fontFamily: 'var(--font-playfair), serif', color: '#3d6a96' }}
            >
              {mezuzahs.length} mezuzah{mezuzahs.length !== 1 ? 's' : ''} in the collection.
              Changes go live on the website within ~1–2 minutes of saving.
            </p>
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
          </DialogHeader>
          <MezuzahForm
            onSave={handleAdd}
            onCancel={() => setMode({ type: 'idle' })}
            saving={saving}
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
