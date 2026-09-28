'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import Section from '@/components/ui/Section';
import FadeIn from '@/components/ui/FadeIn';

export default function RtveliVideo({ src, bookingAnchor }: { src: string; bookingAnchor: string }) {
  const t = useTranslations('rtveli');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  // Play only while at least half the video is on screen; pause when scrolled away.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.5 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  function toggleSound() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    if (!video.muted) video.play().catch(() => {});
  }

  return (
    <Section>
      <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center max-w-5xl mx-auto">
        <FadeIn>
          <div className="text-center md:text-left">
            <h2 className="font-serif text-3xl md:text-4xl text-forest font-semibold">
              {t('videoTitle')}
            </h2>
            <p className="mt-4 text-forest/70 leading-relaxed">{t('videoSubtitle')}</p>
            <a
              href={`#${bookingAnchor}`}
              className="mt-8 inline-flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-cream font-semibold px-6 py-3 rounded-full transition-colors"
            >
              🍇 {t('videoCta')}
            </a>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="relative w-full max-w-[380px] mx-auto aspect-[9/16] rounded-3xl overflow-hidden shadow-xl ring-1 ring-amber-200/60 bg-forest">
            <video
              ref={videoRef}
              src={src}
              muted
              playsInline
              loop
              controls
              preload="metadata"
              onVolumeChange={(e) => setMuted(e.currentTarget.muted)}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={toggleSound}
              aria-pressed={!muted}
              className="absolute top-3 right-3 bg-black/55 hover:bg-black/70 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
            >
              {muted ? `🔊 ${t('soundOn')}` : `🔇 ${t('soundOff')}`}
            </button>
          </div>
        </FadeIn>
      </div>
    </Section>
  );
}
