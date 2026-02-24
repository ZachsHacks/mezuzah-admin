'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function LoginForm() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push('/admin');
    } else {
      setError('Incorrect password. Try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div
        className="w-full max-w-sm rounded-2xl p-8 shadow-2xl"
        style={{
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.88)',
        }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3" style={{ filter: 'drop-shadow(0 2px 8px rgba(30,120,220,0.25))' }}>✡</div>
          <h1
            className="text-2xl font-bold mb-1"
            style={{ fontFamily: 'var(--font-caveat), cursive', color: '#1e3a58', letterSpacing: '0.02em' }}
          >
            Made in <span style={{ color: '#1a7fd4' }}>Heaven</span> Mezuzahs
          </h1>
          <p
            className="text-sm font-semibold tracking-widest uppercase"
            style={{ fontFamily: 'var(--font-playfair), serif', color: '#3d6a96' }}
          >
            Admin Panel
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password" style={{ fontFamily: 'var(--font-playfair), serif', color: '#1e3a58' }}>
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              autoFocus
              style={{ background: 'rgba(255,255,255,0.7)', borderColor: 'rgba(68,153,212,0.3)' }}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 text-center font-medium">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full font-bold tracking-wider uppercase text-sm"
            disabled={loading || !password}
            style={{
              fontFamily: 'var(--font-playfair), serif',
              background: 'linear-gradient(135deg, #4499d4, #2277bb)',
              border: 'none',
              boxShadow: '0 4px 14px rgba(34,119,187,0.35)',
            }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  );
}
