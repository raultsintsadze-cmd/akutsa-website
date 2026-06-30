'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FadeIn from '@/components/ui/FadeIn';

export interface Review {
  text: string;
  name?: string;
  source: 'booking' | 'google';
}

function StarRating() {
  return (
    <div className="flex gap-0.5 text-gold mb-3">
      {[...Array(5)].map((_, i) => (
        <svg key={i} viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function SourceBadge({ source }: { source: 'booking' | 'google' }) {
  if (source === 'booking') {
    return (
      <div className="flex items-center gap-1.5 mt-4">
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-[#003580] rounded px-2 py-0.5">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
            <path d="M17.156 2H6.844C4.172 2 2 4.172 2 6.844v10.312C2 19.828 4.172 22 6.844 22h10.312C19.828 22 22 19.828 22 17.156V6.844C22 4.172 19.828 2 17.156 2zM8.5 16.5H6.5v-9h2v9zm5 0h-2v-4.5c0-.828-.672-1.5-1.5-1.5s-1.5.672-1.5 1.5V16.5h-2V9.5h2v.822C9.165 9.72 9.82 9.5 10.5 9.5c1.93 0 3.5 1.57 3.5 3.5v3.5zm3 0h-2v-9h2v9z" />
          </svg>
          Booking.com
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 mt-4">
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-forest/70 border border-forest/20 rounded px-2 py-0.5">
        <svg viewBox="0 0 24 24" className="w-3 h-3" aria-hidden>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Google
      </span>
    </div>
  );
}

export default function GuestReviews({
  reviews,
  seeAllLabel,
  bookingUrl,
  googleUrl
}: {
  reviews: readonly Review[];
  seeAllLabel: string;
  bookingUrl: string;
  googleUrl: string;
}) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const next = useCallback(() => setCurrent((c) => (c + 1) % reviews.length), [reviews.length]);
  const prev = () => setCurrent((c) => (c - 1 + reviews.length) % reviews.length);

  useEffect(() => {
    timerRef.current = setInterval(next, 6000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [next]);

  function goTo(i: number) {
    if (timerRef.current) clearInterval(timerRef.current);
    setCurrent(i);
    timerRef.current = setInterval(next, 6000);
  }

  return (
    <FadeIn>
      <div className="relative max-w-3xl mx-auto">
        {/* Cards */}
        <div className="overflow-hidden rounded-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="bg-white rounded-2xl p-8 shadow-sm min-h-[200px] flex flex-col"
            >
              <StarRating />
              <p className="text-forest/80 text-sm leading-relaxed flex-1">
                &ldquo;{reviews[current].text}&rdquo;
              </p>
              <div className="flex items-end justify-between mt-4 flex-wrap gap-2">
                {reviews[current].name && (
                  <p className="font-semibold text-forest text-sm">{reviews[current].name}</p>
                )}
                <SourceBadge source={reviews[current].source} />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation arrows */}
        <button
          onClick={prev}
          aria-label="Previous review"
          className="absolute -left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-forest hover:text-gold transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          onClick={() => { if (timerRef.current) clearInterval(timerRef.current); next(); timerRef.current = setInterval(next, 6000); }}
          aria-label="Next review"
          className="absolute -right-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-forest hover:text-gold transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {reviews.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to review ${i + 1}`}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${i === current ? 'bg-gold w-5' : 'bg-forest/20'}`}
            />
          ))}
        </div>

        {/* See all links */}
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-[#003580] text-[#003580] px-5 py-2 text-sm font-medium hover:bg-[#003580] hover:text-white transition-colors"
          >
            {seeAllLabel} — Booking.com
          </a>
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-forest/30 text-forest px-5 py-2 text-sm font-medium hover:bg-forest hover:text-cream transition-colors"
          >
            {seeAllLabel} — Google
          </a>
        </div>
      </div>
    </FadeIn>
  );
}
