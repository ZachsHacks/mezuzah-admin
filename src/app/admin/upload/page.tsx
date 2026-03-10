'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

type PhotoStatus = {
  id: string;
  fileName: string;
  thumbUrl: string;
  status: 'uploading' | 'saved' | 'error';
  error?: string;
};

export default function UploadPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [photos, setPhotos] = useState<PhotoStatus[]>([]);
  const [anyUploading, setAnyUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  // Auth check via lightweight endpoint
  useEffect(() => {
    fetch('/api/drafts').then((res) => {
      if (res.status === 401) router.push('/');
      else setAuthChecked(true);
    });
  }, [router]);

  async function handleFiles(files: FileList) {
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!arr.length) return;

    setAnyUploading(true);

    // Add placeholder entries immediately so user sees feedback
    const newPhotos: PhotoStatus[] = arr.map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      fileName: f.name,
      thumbUrl: URL.createObjectURL(f),
      status: 'uploading',
    }));
    setPhotos((prev) => [...prev, ...newPhotos]);

    // Process sequentially to avoid drafts API race conditions
    for (let i = 0; i < arr.length; i++) {
      const file = arr[i];
      const photoId = newPhotos[i].id;

      try {
        // Get signed upload URL from our API route
        const signRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'sign', filename: file.name, contentType: file.type }),
        });
        if (!signRes.ok) throw new Error('Failed to get upload URL');
        const { token, path, publicUrl } = await signRes.json();

        // Upload directly from browser to Supabase Storage
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        );
        const { error: upErr } = await supabase.storage
          .from('mezuzah-images')
          .uploadToSignedUrl(path, token, file, { contentType: file.type });
        if (upErr) throw new Error(upErr.message);

        // Fetch current drafts then prepend new one
        const currentRes = await fetch('/api/drafts');
        const { drafts: currentDrafts } = await currentRes.json();

        const draftId = Date.now().toString(36) + Math.random().toString(36).slice(2);
        const newDraft = {
          id: draftId,
          draft: true,
          images: [publicUrl],
          name: '',
          tagline: '',
          price: 0,
          categories: [],
          description: '',
        };

        await fetch('/api/drafts', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ drafts: [newDraft, ...currentDrafts] }),
        });

        setPhotos((prev) =>
          prev.map((p) => (p.id === photoId ? { ...p, status: 'saved' } : p))
        );
      } catch (err) {
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photoId
              ? { ...p, status: 'error', error: err instanceof Error ? err.message : 'Upload failed' }
              : p
          )
        );
      }
    }

    setAnyUploading(false);
  }

  if (!authChecked) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #e8f4fd 0%, #dbeeff 50%, #f0e8ff 100%)' }}
      >
        <p style={{ color: '#3d6a96', fontFamily: 'var(--font-playfair), serif' }}>Loading…</p>
      </div>
    );
  }

  const savedCount = photos.filter((p) => p.status === 'saved').length;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(135deg, #e8f4fd 0%, #dbeeff 50%, #f0e8ff 100%)' }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between"
        style={{
          background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.85)',
          boxShadow: '0 2px 12px rgba(30,100,180,0.10)',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-caveat), cursive',
              color: '#1e3a58',
              fontWeight: 700,
              fontSize: '1.3rem',
              lineHeight: 1.2,
            }}
          >
            ✡ Photo Upload
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-playfair), serif',
              color: '#3d6a96',
              fontSize: '0.72rem',
              letterSpacing: '0.05em',
            }}
          >
            Each photo → a new draft
          </p>
        </div>
        <a
          href="/admin"
          style={{
            fontFamily: 'var(--font-playfair), serif',
            fontSize: '0.85rem',
            color: '#1a7fd4',
            textDecoration: 'none',
            padding: '6px 14px',
            borderRadius: '20px',
            background: 'rgba(68,153,212,0.10)',
            border: '1px solid rgba(68,153,212,0.25)',
          }}
        >
          Admin →
        </a>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center px-5 py-8 gap-5">
        {/* Upload buttons */}
        <div className="w-full max-w-sm flex flex-col gap-3">
          {/* Camera button — triggers rear camera on mobile */}
          <button
            onClick={() => cameraRef.current?.click()}
            disabled={anyUploading}
            style={{
              width: '100%',
              borderRadius: '18px',
              padding: '28px 0',
              background: anyUploading
                ? '#cbd5e1'
                : 'linear-gradient(135deg, #4499d4, #2277bb)',
              boxShadow: anyUploading ? 'none' : '0 4px 20px rgba(34,119,187,0.35)',
              border: 'none',
              color: anyUploading ? '#64748b' : '#fff',
              fontFamily: 'var(--font-playfair), serif',
              fontWeight: 700,
              fontSize: '1.1rem',
              cursor: anyUploading ? 'not-allowed' : 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: '2.2rem', lineHeight: 1 }}>📷</span>
            Take a Photo
          </button>

          {/* Library button */}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={anyUploading}
            style={{
              width: '100%',
              borderRadius: '18px',
              padding: '22px 0',
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '2px solid rgba(68,153,212,0.30)',
              color: '#1a7fd4',
              fontFamily: 'var(--font-playfair), serif',
              fontWeight: 700,
              fontSize: '1.05rem',
              cursor: anyUploading ? 'not-allowed' : 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              opacity: anyUploading ? 0.6 : 1,
              transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: '2rem', lineHeight: 1 }}>🖼️</span>
            Choose from Library
          </button>
        </div>

        {/* Hidden file inputs */}
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          // Reset so selecting the same file again fires onChange
          onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
        />

        {/* Success banner */}
        {savedCount > 0 && !anyUploading && (
          <div
            className="w-full max-w-sm rounded-2xl px-5 py-3 text-center"
            style={{
              background: 'rgba(34,197,94,0.12)',
              border: '1px solid rgba(34,197,94,0.35)',
              color: '#15803d',
              fontFamily: 'var(--font-playfair), serif',
              fontSize: '0.9rem',
            }}
          >
            ✓ {savedCount} draft{savedCount !== 1 ? 's' : ''} created — finish{' '}
            {savedCount === 1 ? 'it' : 'them'} on your computer in the{' '}
            <a href="/admin" style={{ color: '#15803d', fontWeight: 700, textDecoration: 'underline' }}>
              admin panel
            </a>
          </div>
        )}

        {/* Uploading indicator */}
        {anyUploading && (
          <div
            className="w-full max-w-sm rounded-2xl px-5 py-3 text-center"
            style={{
              background: 'rgba(251,191,36,0.15)',
              border: '1px solid rgba(251,191,36,0.40)',
              color: '#92400e',
              fontFamily: 'var(--font-playfair), serif',
              fontSize: '0.9rem',
            }}
          >
            Uploading… please stay on this page
          </div>
        )}

        {/* Photo list */}
        {photos.length > 0 && (
          <div className="w-full max-w-sm flex flex-col gap-2">
            {photos.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-2xl px-4 py-3"
                style={{
                  background: 'rgba(255,255,255,0.82)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.92)',
                  boxShadow: '0 2px 8px rgba(30,100,180,0.07)',
                }}
              >
                <img
                  src={p.thumbUrl}
                  alt=""
                  className="flex-shrink-0 rounded-xl object-cover"
                  style={{ width: '52px', height: '52px' }}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className="truncate text-sm"
                    style={{ color: '#1e3a58', fontFamily: 'var(--font-playfair), serif', fontWeight: 600 }}
                  >
                    {p.fileName}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{
                      color:
                        p.status === 'saved'
                          ? '#15803d'
                          : p.status === 'error'
                          ? '#dc2626'
                          : '#3d6a96',
                      fontFamily: 'var(--font-playfair), serif',
                    }}
                  >
                    {p.status === 'uploading'
                      ? 'Uploading…'
                      : p.status === 'saved'
                      ? '✓ Draft created'
                      : `Error: ${p.error}`}
                  </p>
                </div>
                <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>
                  {p.status === 'uploading' ? '⏳' : p.status === 'saved' ? '✅' : '❌'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Empty state hint */}
        {photos.length === 0 && (
          <p
            className="text-center text-sm"
            style={{ color: '#8aacc8', fontFamily: 'var(--font-playfair), serif', maxWidth: '260px' }}
          >
            Tap a button above to upload photos. Each one will create a draft you can fill in later.
          </p>
        )}
      </main>
    </div>
  );
}
