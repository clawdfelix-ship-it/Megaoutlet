'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';

interface Props {
  name: string;
  images: string[];
}

export function ProductImageGalleryClient({ name, images }: Props) {
  const normalized = useMemo(() => {
    const out: string[] = [];
    const seen = new Set<string>();
    for (const v of images || []) {
      if (typeof v !== 'string') continue;
      const u = v.trim();
      if (!u) continue;
      const base = u.split('?', 1)[0];
      if (seen.has(base)) continue;
      seen.add(base);
      out.push(u);
    }
    return out;
  }, [images]);

  const [active, setActive] = useState(0);
  const main =
    normalized[active] || normalized[0] || 'https://via.placeholder.com/600x600?text=No+Image';

  return (
    <div>
      <div className="relative aspect-square bg-white rounded-xl overflow-hidden shadow-sm mb-4">
        <Image
          src={main}
          alt={name}
          fill
          className="object-contain"
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      {normalized.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {normalized.map((img, i) => (
            <button
              key={`${img}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              className={`relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                i === active ? 'border-primary' : 'border-transparent hover:border-gray-300'
              }`}
            >
              <Image src={img} alt={`${name} ${i + 1}`} fill className="object-contain" sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

