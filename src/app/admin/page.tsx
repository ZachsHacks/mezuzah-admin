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

  async function saveAll(updated: Mezuzah[]) {
    setSaving(true);
    const res = await fetch('/api/mezuzahs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mezuzahs: updated }),
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
    // New arrivals go to the front of the list
    saveAll([m, ...mezuzahs]);
  }

  function handleEdit(index: number, m: Mezuzah) {
    const updated = [...mezuzahs];
    updated[index] = m;
    saveAll(updated);
  }

  function handleDelete(index: number) {
    const updated = mezuzahs.filter((_, i) => i !== index);
    saveAll(updated);
  }

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/');
  }

  const editingMezuzah = mode.type === 'edit' ? mezuzahs[mode.index] : undefined;
  const deletingMezuzah = mode.type === 'delete' ? mezuzahs[mode.index] : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-slate-800 text-lg leading-tight">
              ✡ Made in Heaven Mezuzahs
            </h1>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
          <div className="flex gap-2 items-center">
            <Button size="sm" onClick={() => setMode({ type: 'add' })}>
              + Add Mezuzah
            </Button>
            <Button size="sm" variant="ghost" onClick={handleLogout} className="text-slate-500">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-24 text-muted-foreground">Loading collection…</div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-6">
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Mezuzah</DialogTitle>
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Mezuzah</DialogTitle>
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
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Mezuzah</DialogTitle>
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
