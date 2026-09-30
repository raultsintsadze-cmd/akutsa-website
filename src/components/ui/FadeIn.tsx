'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

// Reveal-on-scroll. The server HTML is always fully visible (crawlers and no-JS visitors
// see everything); only content still below the fold after mount is hidden and faded in.
export default function FadeIn({
  children,
  delay = 0,
  className
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduceMotion) return;
    if (el.getBoundingClientRect().top > window.innerHeight) setArmed(true);
  }, [reduceMotion]);

  const hidden = armed && !inView;

  return (
    <motion.div
      ref={ref}
      initial={false}
      animate={hidden ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
      transition={hidden ? { duration: 0 } : { duration: 0.5, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
