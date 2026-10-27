'use client';

import { useEffect, useRef, useState } from 'react';

// Muted looping tour video that fills its frame (object-fit: cover). Autoplays unless the
// visitor prefers reduced motion; then the poster stays, with a play button if `playButton`.
export default function TourVideo({
  src,
  poster,
  label,
  playButton = false
}: {
  src: string;
  poster?: string;
  label: string;
  playButton?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(true);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.muted = true; // React does not reliably set the attribute, and autoplay needs it.
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      video.play().catch(() => {});
    }
  }, []);

  return (
    <>
      <video
        ref={ref}
        src={src}
        poster={poster}
        muted
        playsInline
        loop
        preload="metadata"
        aria-label={label}
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
        className="absolute inset-0 w-full h-full object-cover"
      />
      {playButton && paused && (
        <button
          type="button"
          onClick={() => ref.current?.play().catch(() => {})}
          aria-label={label}
          className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-black/50 text-cream flex items-center justify-center hover:bg-black/65 transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-7 h-7 ml-1" fill="currentColor" aria-hidden>
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      )}
    </>
  );
}
