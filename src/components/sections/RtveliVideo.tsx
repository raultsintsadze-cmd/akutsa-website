'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import Section from '@/components/ui/Section';
import FadeIn from '@/components/ui/FadeIn';

export default function RtveliVideo({ src, bookingAnchor }: { src: string; bookingAnchor: string }) {
  const t = useTranslations('rtveli');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  // True while playing muted only because the browser refused sound; shows the big overlay.
  const [autoMuted, setAutoMuted] = useState(false);
  const inViewRef = useRef(false);
  // Set once the visitor mutes on purpose, so scrolling back doesn't force sound on again.
  const userMutedRef = useRef(false);

  // Play only while at least half the video is on screen; pause when scrolled away.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    function playMuted() {
      if (!video || !inViewRef.current) return;
      video.muted = true;
      video.play().then(() => setAutoMuted(!userMutedRef.current), () => {});
    }

    function playWithSound() {
      if (!video) return;
      if (userMutedRef.current) return playMuted();
      video.muted = false;
      // Rejected by the autoplay policy when the visitor hasn't interacted yet.
      video.play().then(
        () => {
          if (!inViewRef.current) video.pause();
          else setAutoMuted(false);
        },
        playMuted
      );
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry.isIntersecting;
        if (!entry.isIntersecting) return video.pause();
        // Browsers remember whether the visitor has already clicked/tapped/typed on the page
        // (sticky user activation); if so, sound is allowed and this plays unmuted directly.
        playWithSound();
      },
      { threshold: 0.5 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  function unmuteFromStart() {
    const video = videoRef.current;
    if (!video) return;
    userMutedRef.current = false;
    video.muted = false;
    video.currentTime = 0;
    video.play().catch(() => {});
    setAutoMuted(false);
  }

  function toggleSound() {
    const video = videoRef.current;
    if (!video) return;
    if (video.muted) {
      userMutedRef.current = false;
      video.muted = false;
      video.play().catch(() => {});
    } else {
      userMutedRef.current = true;
      video.muted = true;
    }
    setAutoMuted(false);
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
              onVolumeChange={(e) => {
                setMuted(e.currentTarget.muted);
                // Unmuted via the native controls: the overlay is no longer needed.
                if (!e.currentTarget.muted) setAutoMuted(false);
              }}
              className="absolute inset-0 w-full h-full object-cover"
            />
            {autoMuted && (
              <button
                type="button"
                onClick={unmuteFromStart}
                className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors hover:bg-black/35"
              >
                <span className="rounded-full bg-white/95 px-6 py-3 text-base font-semibold text-forest shadow-lg">
                  {t('tapForSound')}
                </span>
              </button>
            )}
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
