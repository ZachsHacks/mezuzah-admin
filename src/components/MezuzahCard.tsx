'use client';

import { Mezuzah } from '@/types/mezuzah';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Props {
  mezuzah: Mezuzah;
  onEdit: () => void;
  onDelete: () => void;
}

const GITHUB_RAW = `https://raw.githubusercontent.com/${process.env.NEXT_PUBLIC_GITHUB_OWNER}/${process.env.NEXT_PUBLIC_GITHUB_REPO}/main/`;

export default function MezuzahCard({ mezuzah, onEdit, onDelete }: Props) {
  const imgSrc = mezuzah.image.startsWith('http')
    ? mezuzah.image
    : `${GITHUB_RAW}${mezuzah.image}`;

  return (
    <div
      className="overflow-hidden rounded-xl transition-all hover:-translate-y-1"
      style={{
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.85)',
        boxShadow: '0 4px 18px rgba(80,140,200,0.12)',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 10px 32px rgba(80,140,200,0.22)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 18px rgba(80,140,200,0.12)';
      }}
    >
      <div
        className="flex items-center justify-center h-48"
        style={{ background: 'rgba(235,244,252,0.55)' }}
      >
        <img
          src={imgSrc}
          alt={mezuzah.name}
          className="max-h-44 max-w-full object-contain p-2"
          loading="lazy"
        />
      </div>
      <div className="p-4 space-y-3">
        <div>
          <h3
            className="font-semibold leading-tight"
            style={{ fontFamily: 'var(--font-playfair), serif', color: '#1e3a58' }}
          >
            {mezuzah.name}
          </h3>
          <p className="text-sm italic" style={{ color: '#3d6a96' }}>{mezuzah.tagline}</p>
          <p className="font-bold mt-1" style={{ color: '#1e3a58' }}>${mezuzah.price}</p>
        </div>

        <div className="flex flex-wrap gap-1">
          {mezuzah.categories.map((cat) => (
            <Badge
              key={cat}
              variant="secondary"
              className={
                cat === 'New Arrival'
                  ? 'bg-green-100 text-green-800 border-green-200'
                  : cat === 'With Gold Leaf'
                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                  : 'bg-blue-100 text-blue-800 border-blue-200'
              }
              style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '0.7rem' }}
            >
              {cat}
            </Badge>
          ))}
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            onClick={onEdit}
            className="flex-1"
            style={{ fontFamily: 'var(--font-playfair), serif', borderColor: 'rgba(68,153,212,0.35)', color: '#2277bb' }}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onDelete}
            className="flex-1"
            style={{ fontFamily: 'var(--font-playfair), serif', borderColor: 'rgba(200,80,80,0.25)', color: '#b54040' }}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
