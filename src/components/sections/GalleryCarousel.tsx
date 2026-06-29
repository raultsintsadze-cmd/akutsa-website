'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { clsx } from 'clsx';

const CLONE_COUNT = 4;
const AUTOPLAY_MS = 3000;
const TRANSITION_MS = 500;

export default function GalleryCarousel({ images, alt }: { images: string[]; alt: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const total = images.length;
  const [index, setIndex] = useState(CLONE_COUNT);
  const [animate, setAnimate] = useState(false);
  const [paused, setPaused] = useState(false);

  const rendered = [...images.slice(-CLONE_COUNT), ...images, ...images.slice(0, CLONE_COUNT)];

  const getStep = useCallback(() => {
    const track = trackRef.current;
    if (!track || !track.firstElementChild) return 0;
    const child = track.firstElementChild as HTMLElement;
    const gap = parseFloat(getComputedStyle(track).columnGap || '16');
    return child.getBoundingClientRect().width + gap;
  }, []);

  const positionAt = useCallback(
    (i: number, smooth: boolean) => {
      const track = trackRef.current;
      if (!track) return;
      track.style.scrollBehavior = smooth ? 'smooth' : 'auto';
      track.scrollLeft = i * getStep();
    },
    [getStep]
  );

  // Initial position (no animation) before paint
  useLayoutEffect(() => {
    positionAt(CLONE_COUNT, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reposition on resize since item width changes per breakpoint
  useEffect(() => {
    function handleResize() {
      positionAt(index, false);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [index, positionAt]);

  useEffect(() => {
    positionAt(index, animate);

    if (!animate) return;

    const timeout = setTimeout(() => {
      if (index < CLONE_COUNT) {
        setAnimate(false);
        setIndex(index + total);
      } else if (index >= CLONE_COUNT + total) {
        setAnimate(false);
        setIndex(index - total);
      }
    }, TRANSITION_MS);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, animate]);

  function goTo(delta: number) {
    setAnimate(true);
    setIndex((prev) => prev + delta);
  }

  function goToReal(realIndex: number) {
    setAnimate(true);
    setIndex(realIndex + CLONE_COUNT);
  }

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => goTo(1), AUTOPLAY_MS);
    return () => clearInterval(interval);
  }, [paused]);

  const activeDot = ((((index - CLONE_COUNT) % total) + total) % total);

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div ref={trackRef} className="flex gap-4 overflow-x-hidden">
        {rendered.map((src, i) => (
          <div
            key={i}
            className="shrink-0 w-full sm:w-1/2 md:w-1/3 lg:w-1/4 relative aspect-square rounded-xl overflow-hidden"
          >
            <Image src={src} alt={`${alt} ${i + 1}`} fill className="object-cover" />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => goTo(-1)}
        aria-label="Previous"
        className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 text-forest shadow-md flex items-center justify-center hover:bg-white transition-colors"
      >
        &#8249;
      </button>
      <button
        type="button"
        onClick={() => goTo(1)}
        aria-label="Next"
        className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 text-forest shadow-md flex items-center justify-center hover:bg-white transition-colors"
      >
        &#8250;
      </button>

      <div className="flex flex-wrap justify-center gap-1.5 mt-4">
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goToReal(i)}
            aria-label={`Slide ${i + 1}`}
            className={clsx(
              'w-1.5 h-1.5 rounded-full transition-colors',
              activeDot === i ? 'bg-gold' : 'bg-forest/20'
            )}
          />
        ))}
      </div>
    </div>
  );
}
