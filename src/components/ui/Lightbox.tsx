'use client';

import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';

const SWIPE_THRESHOLD = 50;

export default function Lightbox({
  images,
  index,
  alt,
  onClose,
  onIndexChange
}: {
  images: readonly string[];
  index: number | null;
  alt: string;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}) {
  const touchStartX = useRef<number | null>(null);
  const total = images.length;
  const open = index !== null;

  const step = useCallback(
    (delta: number) => {
      if (index === null) return;
      onIndexChange((index + delta + total) % total);
    },
    [index, total, onIndexChange]
  );

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
    }
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose, step]);

  if (index === null || typeof document === 'undefined') return null;

  const arrowClass =
    'absolute top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-cream text-3xl leading-none flex items-center justify-center transition-colors';

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
      onClick={onClose}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        touchStartX.current = null;
        if (Math.abs(dx) > SWIPE_THRESHOLD) step(dx < 0 ? 1 : -1);
      }}
    >
      {/* Sized to the photo itself so clicks on the dark area around it close the lightbox. */}
      <Image
        key={images[index]}
        src={images[index]}
        alt={`${alt} ${index + 1}`}
        width={1600}
        height={1200}
        sizes="92vw"
        priority
        onClick={(e) => e.stopPropagation()}
        className="w-auto h-auto max-w-[92vw] max-h-[80vh] md:max-w-[85vw] object-contain rounded-lg select-none"
      />

      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-cream/80 text-sm tabular-nums">
        {index + 1} / {total}
      </div>

      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute top-3 right-3 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-cream text-3xl leading-none flex items-center justify-center transition-colors"
      >
        &times;
      </button>

      {total > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous"
            onClick={(e) => {
              e.stopPropagation();
              step(-1);
            }}
            className={`${arrowClass} left-2 md:left-6`}
          >
            &#8249;
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={(e) => {
              e.stopPropagation();
              step(1);
            }}
            className={`${arrowClass} right-2 md:right-6`}
          >
            &#8250;
          </button>
        </>
      )}
    </div>,
    document.body
  );
}
