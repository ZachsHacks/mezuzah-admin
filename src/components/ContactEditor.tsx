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

export default function ContactEditor({ initial, onSaved }: Props) {
  const [contact, setContact] = useState(initial.contact);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof SiteContent['contact']>(key: K, value: string) {
    setContact((c) => ({ ...c, [key]: value }));
  }

  // When the display phone changes, auto-update the href too
  function handlePhoneChange(display: string) {
    const digits = display.replace(/\D/g, '');
    set('phone', display);
    set('phoneHref', digits ? `tel:+1${digits}` : contact.phoneHref);
  }

  async function handleSave() {
    setSaving(true);
    const updated: SiteContent = { ...initial, contact };
    const res = await fetch('/api/site-content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteContent: updated, page: 'Contact' }),
    });
    setSaving(false);

    if (res.ok) {
      onSaved(updated);
      toast.success('Contact page saved! Changes will go live in ~1–2 minutes.');
    } else {
      const { error } = await res.json();
      toast.error(`Save failed: ${error}`);
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Intro */}
      <div className="space-y-2">
        <Label style={{ fontFamily: 'var(--font-playfair), serif', color: '#1e3a58', fontWeight: 700 }}>
          Intro Text
        </Label>
        <p className="text-xs" style={{ color: '#3d6a96' }}>
          The paragraph shown above the phone number on the Contact page.
        </p>
        <Textarea
          value={contact.intro}
          onChange={(e) => set('intro', e.target.value)}
          rows={3}
          style={{ background: 'rgba(255,255,255,0.8)' }}
        />
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label style={{ fontFamily: 'var(--font-playfair), serif', color: '#1e3a58', fontWeight: 700 }}>
          Phone Number
        </Label>
        <p className="text-xs" style={{ color: '#3d6a96' }}>
          Displayed as a tap-to-call link. The link will update automatically.
        </p>
        <Input
          value={contact.phone}
          onChange={(e) => handlePhoneChange(e.target.value)}
          placeholder="(224) 645-2752"
          style={{ background: 'rgba(255,255,255,0.8)' }}
        />
        <p className="text-xs" style={{ color: '#8aacc8' }}>
          Link: <code>{contact.phoneHref}</code>
        </p>
      </div>

      {/* Subtext */}
      <div className="space-y-2">
        <Label style={{ fontFamily: 'var(--font-playfair), serif', color: '#1e3a58', fontWeight: 700 }}>
          Tagline Below Phone
        </Label>
        <Input
          value={contact.subtext}
          onChange={(e) => set('subtext', e.target.value)}
          placeholder="Custom orders &amp; inquiries welcome"
          style={{ background: 'rgba(255,255,255,0.8)' }}
        />
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
        {saving ? 'Saving…' : 'Save Contact Page'}
      </Button>
    </div>
  );
}
