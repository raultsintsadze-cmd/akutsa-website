'use client';

import { useState } from 'react';
import Image from 'next/image';
import FadeIn from '@/components/ui/FadeIn';
import BookingButtons from '@/components/ui/BookingButtons';

interface Vehicle {
  name: string;
  capacity: string;
  type: string;
  photos: string[];
}

function VehicleCarousel({ vehicle }: { vehicle: Vehicle }) {
  const [idx, setIdx] = useState(0);
  const prev = () => setIdx((i) => (i - 1 + vehicle.photos.length) % vehicle.photos.length);
  const next = () => setIdx((i) => (i + 1) % vehicle.photos.length);

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm h-full flex flex-col">
      {/* Photo carousel */}
      <div className="relative h-56 bg-forest/5">
        <Image
          src={vehicle.photos[idx]}
          alt={`${vehicle.name} - photo ${idx + 1}`}
          fill
          className="object-cover"
        />
        {vehicle.photos.length > 1 && (
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
              {vehicle.photos.map((_, i) => (
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

      {/* Info */}
      <div className="p-6 flex flex-col gap-2 flex-1">
        <h3 className="font-serif text-xl text-forest font-semibold">{vehicle.name}</h3>
        <p className="text-gold font-medium text-sm">{vehicle.capacity}</p>
        <p className="text-forest/70 text-sm leading-relaxed">{vehicle.type}</p>
      </div>
    </div>
  );
}

interface TransferSectionProps {
  title: string;
  description: string;
  highlights: string[];
  pricing: string;
  vehicles: Vehicle[];
}

export default function TransferSection({
  title,
  description,
  highlights,
  pricing,
  vehicles
}: TransferSectionProps) {
  return (
    <div className="space-y-10">
      {/* Description + highlights */}
      <FadeIn>
        <div className="grid md:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="font-serif text-2xl md:text-3xl text-forest font-semibold mb-4">{title}</h2>
            <p className="text-forest/70 leading-relaxed text-sm">{description}</p>
            <p className="mt-5 text-gold font-semibold">{pricing}</p>
            <div className="mt-6">
              <BookingButtons size="sm" />
            </div>
          </div>
          <ul className="space-y-3">
            {highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-forest/80">
                <span className="text-gold font-bold mt-0.5 shrink-0">✓</span>
                {h}
              </li>
            ))}
          </ul>
        </div>
      </FadeIn>

      {/* Vehicle cards */}
      <div className="grid md:grid-cols-2 gap-8">
        {vehicles.map((v, i) => (
          <FadeIn key={v.name} delay={i * 0.1}>
            <VehicleCarousel vehicle={v} />
          </FadeIn>
        ))}
      </div>
    </div>
  );
}
