'use client';

import { useState, useRef } from 'react';
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
}

const EMPTY: Mezuzah = {
  image: '',
  name: '',
  tagline: '',
  price: 0,
  categories: ['New Arrival'],
  description: '',
};

export default function MezuzahForm({ initial, onSave, onCancel, saving }: Props) {
  const [form, setForm] = useState<Mezuzah>(initial ?? EMPTY);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [preview, setPreview] = useState<string>(
    initial?.image ? `https://raw.githubusercontent.com/${process.env.NEXT_PUBLIC_GITHUB_OWNER}/${process.env.NEXT_PUBLIC_GITHUB_REPO}/main/${initial.image}` : ''
  );
  const fileRef = useRef<HTMLInputElement>(null);

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

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');

    // Local preview
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    const fd = new FormData();
    fd.append('file', file);

    const res = await fetch('/api/upload', { method: 'POST', body: fd });

    if (res.ok) {
      const { path } = await res.json();
      set('image', path);
    } else {
      const { error } = await res.json();
      setUploadError(error ?? 'Upload failed');
      setPreview('');
    }
    setUploading(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form);
  }

  const sizeSelected = form.categories.find((c) => (SIZE_CATEGORIES as readonly string[]).includes(c));
  const isValid = form.name && form.tagline && form.image && form.price > 0 && !!sizeSelected;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Image upload */}
      <div className="space-y-2">
        <Label>Photo</Label>
        <div
          className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-blue-400 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className="max-h-48 mx-auto rounded-lg object-contain"
            />
          ) : (
            <div className="py-6 text-muted-foreground text-sm">
              <div className="text-2xl mb-1">📷</div>
              Click to upload photo
            </div>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
        {uploading && <p className="text-sm text-blue-600">Uploading…</p>}
        {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
        {form.image && !uploading && (
          <p className="text-xs text-muted-foreground truncate">{form.image}</p>
        )}
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
          {SIZE_CATEGORIES.map((cat) => (
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
          {ALL_CATEGORIES.filter((c) => !(SIZE_CATEGORIES as readonly string[]).includes(c)).map((cat) => (
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
          {saving ? 'Saving…' : 'Save'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  );
}
