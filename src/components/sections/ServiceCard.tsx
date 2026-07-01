'use client';

import { useState } from 'react';
import Image from 'next/image';
import FadeIn from '@/components/ui/FadeIn';

interface ServiceCardProps {
  title: string;
  description: string;
  photos: string[];
  delay?: number;
}

export default function ServiceCard({ title, description, photos, delay = 0 }: ServiceCardProps) {
  const [idx, setIdx] = useState(0);
  const prev = () => setIdx((i) => (i - 1 + photos.length) % photos.length);
  const next = () => setIdx((i) => (i + 1) % photos.length);

  return (
    <FadeIn delay={delay}>
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm h-full flex flex-col">
        {/* Photo carousel */}
        <div className="relative h-56 bg-forest/5 shrink-0">
          <Image
            src={photos[idx]}
            alt={`${title} - photo ${idx + 1}`}
            fill
            className="object-cover"
          />
          {photos.length > 1 && (
            <>
              <button
                onClick={prev}
                aria-label="Previous photo"
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                onClick={next}
                aria-label="Next photo"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIdx(i)}
                    aria-label={`Photo ${i + 1}`}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? 'bg-white w-3' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Text */}
        <div className="p-6 flex flex-col flex-1">
          <h3 className="font-serif text-xl text-forest font-semibold">{title}</h3>
          <p className="mt-3 text-forest/70 text-sm leading-relaxed flex-1">{description}</p>
        </div>
      </div>
    </FadeIn>
  );
}
