'use client';

import { Mezuzah } from '@/types/mezuzah';
import { Card, CardContent } from '@/components/ui/card';
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
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="bg-slate-50 flex items-center justify-center h-48">
        <img
          src={imgSrc}
          alt={mezuzah.name}
          className="max-h-44 max-w-full object-contain p-2"
          loading="lazy"
        />
      </div>
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-slate-800 leading-tight">{mezuzah.name}</h3>
          <p className="text-sm text-muted-foreground italic">{mezuzah.tagline}</p>
          <p className="font-bold text-slate-900 mt-1">${mezuzah.price}</p>
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
            >
              {cat}
            </Badge>
          ))}
        </div>

        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="outline" onClick={onEdit} className="flex-1">
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onDelete}
            className="flex-1 text-red-600 hover:text-red-700 hover:border-red-300"
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
