'use client';

import Image from 'next/image';
import { useScroll, useTransform, motion } from 'framer-motion';
import { useRef, useCallback } from 'react';

export default function HeroParallax({
  src,
  alt,
  video,
  children
}: {
  src: string;
  alt: string;
  video?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleCanPlay = useCallback(() => {
    const v = videoRef.current;
    if (v) v.style.opacity = '1';
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start']
  });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '40%']);

  return (
    <section
      ref={ref}
      className="relative h-[90vh] min-h-[600px] flex items-center justify-center overflow-hidden"
    >
      <motion.div className="absolute inset-0 w-full h-full" style={{ y }}>
        {video ? (
          <>
            {/* Poster image always visible underneath */}
            <Image
              src={src}
              alt={alt}
              fill
              priority
              className="object-cover"
            />
            {/* Video fades in over the poster once it can play */}
            <video
              ref={videoRef}
              src={video}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              onCanPlay={handleCanPlay}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ opacity: 0, transition: 'opacity 0.8s ease' }}
            />
          </>
        ) : (
          <Image src={src} alt={alt} fill priority className="object-cover" />
        )}
      </motion.div>
      <div className="absolute inset-0 bg-forest/50" />
      <div className="relative z-10 text-center text-cream container-px max-w-3xl w-full">
        {children}
      </div>
    </section>
  );
}
