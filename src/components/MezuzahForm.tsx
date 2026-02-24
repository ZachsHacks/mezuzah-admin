'use client';

import { useState, useRef, useEffect } from 'react';
import { Mezuzah, ALL_CATEGORIES, SIZE_CATEGORIES } from '@/types/mezuzah';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface Props {
  initial?: Mezuzah;
  onSave: (m: Mezuzah) => void;
  onCancel: () => void;
  saving: boolean;
  sizeCategories?: string[];
  specialCategories?: string[];
}

const GITHUB_RAW = `https://raw.githubusercontent.com/${process.env.NEXT_PUBLIC_GITHUB_OWNER}/${process.env.NEXT_PUBLIC_GITHUB_REPO}/main/`;

const EMPTY: Mezuzah = {
  images: [],
  name: '',
  tagline: '',
  price: 0,
  categories: [],
  description: '',
};

function isVideo(src: string) {
  return /\.(mp4|mov|webm|ogg|m4v)$/i.test(src);
}

// Preview item tracks the display URL plus whether it's a video
// (blob: URLs don't have extensions, so we carry the flag explicitly)
type PreviewItem = { url: string; isVid: boolean };

export default function MezuzahForm({ initial, onSave, onCancel, saving, sizeCategories, specialCategories }: Props) {
  const activeSizes    = sizeCategories    ?? (SIZE_CATEGORIES as readonly string[]);
  const activeSpecials = specialCategories ?? ALL_CATEGORIES.filter((c) => !(SIZE_CATEGORIES as readonly string[]).includes(c));
  const [form, setForm] = useState<Mezuzah>(initial ?? EMPTY);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isDropZoneOver, setIsDropZoneOver] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Previews track display URL + video flag (parallel to form.images)
  const [previews, setPreviews] = useState<PreviewItem[]>(
    (initial?.images ?? []).map((img) => ({
      url: img.startsWith('http') ? img : `${GITHUB_RAW}${img}`,
      isVid: isVideo(img),
    }))
  );

  const fileRef = useRef<HTMLInputElement>(null);

  // Warn user before navigating away while upload is in progress
  useEffect(() => {
    if (!uploading) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [uploading]);

  function set<K extends keyof Mezuzah>(key: K, value: Mezuzah[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleCategory(cat: string) {
    setForm((f) => {
      const cats = f.categories.includes(cat)
        ? f.categories.filter((c) => c !== cat)
        : [...f.categories, cat];
      return { ...f, categories: cats };
    });
  }

  function removeImage(index: number) {
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  }

  function moveMedia(from: number, to: number) {
    const newPreviews = [...previews];
    const newImages   = [...form.images];
    const [p]   = newPreviews.splice(from, 1);
    const [img] = newImages.splice(from, 1);
    newPreviews.splice(to, 0, p);
    newImages.splice(to, 0, img);
    setPreviews(newPreviews);
    setForm((f) => ({ ...f, images: newImages }));
  }

  async function handleFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter(
      (f) => f.type.startsWith('image/') || f.type.startsWith('video/')
    );
    if (!arr.length) return;

    setUploading(true);
    setUploadError('');

    for (const file of arr) {
      const localUrl = URL.createObjectURL(file);
      const isVid = file.type.startsWith('video/');
      // Optimistically add the preview with the correct video flag
      setPreviews((prev) => [...prev, { url: localUrl, isVid }]);

      const fd = new FormData();
      fd.append('file', file);

      const res = await fetch('/api/upload', { method: 'POST', body: fd });

      if (res.ok) {
        const { path } = await res.json() as { path: string };
        setForm((f) => ({ ...f, images: [...f.images, path] }));
      } else {
        // Remove the optimistic preview on failure
        setPreviews((prev) => prev.filter((p) => p.url !== localUrl));
        const body = await res.json().catch(() => ({}));
        setUploadError((body as { error?: string }).error ?? 'Upload failed');
      }
    }

    setUploading(false);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSave(form);
  }

  const sizeSelected = form.categories.find((c) => activeSizes.includes(c));
  const isValid = form.name && form.tagline && form.images.length > 0 && form.price > 0 && !!sizeSelected;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Media upload */}
      <div className="space-y-2">
        <Label>
          Photos &amp; Videos{' '}
          {previews.length > 0 && (
            <span className="text-muted-foreground font-normal text-xs">
              ({previews.length} added — drag to reorder)
            </span>
          )}
        </Label>

        {/* Upload in-progress warning */}
        {uploading && (
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium" style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.4)', color: '#92400e' }}>
            <span className="animate-spin">⏳</span>
            Uploading… please don&apos;t close or navigate away until complete.
          </div>
        )}

        <div
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
            isDropZoneOver ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-400'
          }`}
          onClick={() => fileRef.current?.click()}
          onDrop={(e) => {
            e.preventDefault();
            setIsDropZoneOver(false);
            handleFiles(e.dataTransfer.files);
          }}
          onDragOver={(e) => { e.preventDefault(); setIsDropZoneOver(true); }}
          onDragLeave={() => setIsDropZoneOver(false)}
        >
          {previews.length > 0 ? (
            <div className="flex flex-wrap gap-2 justify-center">
              {previews.map((preview, i) => (
                <div
                  key={i}
                  className={`relative group cursor-grab transition-opacity ${
                    dragIdx === i ? 'opacity-40' : dragOverIdx === i ? 'ring-2 ring-blue-400 rounded-lg' : ''
                  }`}
                  draggable
                  onDragStart={(e) => { e.stopPropagation(); setDragIdx(i); }}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverIdx(i); }}
                  onDragLeave={() => setDragOverIdx(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (dragIdx !== null && dragIdx !== i) moveMedia(dragIdx, i);
                    setDragIdx(null);
                    setDragOverIdx(null);
                  }}
                  onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                >
                  {preview.isVid ? (
                    <video
                      src={preview.url}
                      className="h-24 w-20 object-cover rounded-lg border border-slate-200 pointer-events-none"
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={preview.url}
                      alt={`Media ${i + 1}`}
                      className="h-24 w-20 object-cover rounded-lg border border-slate-200 pointer-events-none"
                    />
                  )}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity leading-none"
                  >
                    ×
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1 left-0 right-0 text-center text-white text-[9px] bg-black/40 rounded-b-md leading-4">
                      Main
                    </span>
                  )}
                  {preview.isVid && (
                    <span className="absolute top-1 left-1 bg-black/50 text-white text-[9px] rounded px-1 leading-4">
                      ▶
                    </span>
                  )}
                </div>
              ))}
              {/* Add more */}
              <div className="h-24 w-20 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 text-xs gap-1">
                <span className="text-xl leading-none">+</span>
                <span>Add more</span>
              </div>
            </div>
          ) : (
            <div className="py-6 text-muted-foreground text-sm">
              <div className="text-2xl mb-1">📷</div>
              <div>Drag &amp; drop or click to add photos or videos</div>
              <div className="text-xs mt-1 text-slate-400">Multiple files supported</div>
            </div>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="e.g. The Garden Rose"
          required
        />
      </div>

      {/* Tagline */}
      <div className="space-y-2">
        <Label htmlFor="tagline">Tagline *</Label>
        <Input
          id="tagline"
          value={form.tagline}
          onChange={(e) => set('tagline', e.target.value)}
          placeholder="e.g. Blooming at Your Door"
          required
        />
      </div>

      {/* Price */}
      <div className="space-y-2">
        <Label htmlFor="price">Price ($) *</Label>
        <Input
          id="price"
          type="number"
          min={1}
          value={form.price || ''}
          onChange={(e) => set('price', parseInt(e.target.value) || 0)}
          placeholder="e.g. 125"
          required
        />
      </div>

      {/* Categories */}
      <div className="space-y-2">
        <Label>Size * <span className="text-muted-foreground font-normal text-xs">(pick one)</span></Label>
        <div className="grid grid-cols-2 gap-2">
          {activeSizes.map((cat) => (
            <label key={cat} className="flex items-center gap-2 cursor-pointer text-sm">
              <Checkbox
                checked={form.categories.includes(cat)}
                onCheckedChange={() => toggleCategory(cat)}
              />
              {cat}
            </label>
          ))}
        </div>
        {!sizeSelected && (
          <p className="text-xs text-amber-600">Please select a size</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Special Tags</Label>
        <div className="flex flex-col gap-2">
          {activeSpecials.map((cat) => (
            <label key={cat} className="flex items-center gap-2 cursor-pointer text-sm">
              <Checkbox
                checked={form.categories.includes(cat)}
                onCheckedChange={() => toggleCategory(cat)}
              />
              {cat}
            </label>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="desc">Description</Label>
        <Textarea
          id="desc"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Write a poetic description of this piece…"
          rows={5}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={!isValid || saving || uploading}
          className="flex-1"
        >
          {saving ? 'Saving…' : uploading ? 'Upload in progress…' : 'Save'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  );
}
