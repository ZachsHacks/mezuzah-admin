'use client';

import { useState } from 'react';
import { SiteContent } from '@/types/site-content';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface Props {
  initial: SiteContent;
  onSaved: (updated: SiteContent) => void;
}

export default function AboutEditor({ initial, onSaved }: Props) {
  const [about, setAbout] = useState(initial.about);
  const [saving, setSaving] = useState(false);

  function setQuote(v: string) {
    setAbout((a) => ({ ...a, quote: v }));
  }

  function setParagraph(i: number, v: string) {
    setAbout((a) => {
      const ps = [...a.paragraphs];
      ps[i] = v;
      return { ...a, paragraphs: ps };
    });
  }

  function addParagraph() {
    setAbout((a) => ({ ...a, paragraphs: [...a.paragraphs, ''] }));
  }

  function removeParagraph(i: number) {
    setAbout((a) => ({ ...a, paragraphs: a.paragraphs.filter((_, idx) => idx !== i) }));
  }

  async function handleSave() {
    setSaving(true);
    const updated: SiteContent = { ...initial, about };
    const res = await fetch('/api/site-content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteContent: updated, page: 'About' }),
    });
    setSaving(false);

    if (res.ok) {
      onSaved(updated);
      toast.success('About page saved! Changes will go live in ~1–2 minutes.');
    } else {
      const { error } = await res.json();
      toast.error(`Save failed: ${error}`);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Quote */}
      <div className="space-y-2">
        <Label
          style={{ fontFamily: 'var(--font-playfair), serif', color: '#1e3a58', fontWeight: 700 }}
        >
          Artist Quote
        </Label>
        <p className="text-xs" style={{ color: '#3d6a96' }}>
          Displayed at the top of the About page in quotation marks.
        </p>
        <Input
          value={about.quote}
          onChange={(e) => setQuote(e.target.value)}
          placeholder="Every mezuzah I create is a prayer…"
          style={{ background: 'rgba(255,255,255,0.8)' }}
        />
      </div>

      {/* Bio paragraphs */}
      <div className="space-y-3">
        <Label
          style={{ fontFamily: 'var(--font-playfair), serif', color: '#1e3a58', fontWeight: 700 }}
        >
          Bio Paragraphs
        </Label>
        <p className="text-xs" style={{ color: '#3d6a96' }}>
          Each box is one paragraph. Add or remove as needed.
        </p>
        {about.paragraphs.map((p, i) => (
          <div key={i} className="flex gap-2 items-start">
            <div className="flex-shrink-0 text-xs pt-2.5 w-5 text-center" style={{ color: '#3d6a96' }}>
              {i + 1}
            </div>
            <Textarea
              value={p}
              onChange={(e) => setParagraph(i, e.target.value)}
              rows={3}
              className="flex-1"
              style={{ background: 'rgba(255,255,255,0.8)' }}
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => removeParagraph(i)}
              className="flex-shrink-0 text-red-400 hover:text-red-600 px-2"
              disabled={about.paragraphs.length <= 1}
            >
              ✕
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={addParagraph}
          style={{ borderColor: 'rgba(68,153,212,0.35)', color: '#2277bb', fontFamily: 'var(--font-playfair), serif' }}
        >
          + Add Paragraph
        </Button>
      </div>

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
        {saving ? 'Saving…' : 'Save About Page'}
      </Button>
    </div>
  );
}
