'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

function Counter({ to, duration = 1.5 }: { to: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const steps = 50;
    const interval = (duration * 1000) / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setCount(Math.round((to * step) / steps));
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, [inView, to, duration]);

  return <span ref={ref}>{count}</span>;
}

interface Stat {
  value: number;
  suffix: string;
  label: string;
}

export default function StatsCounter({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
      {stats.map((stat, i) => (
        <div key={i} className="text-center">
          <div className="font-serif text-5xl md:text-6xl text-gold font-semibold leading-none">
            <Counter to={stat.value} />
            {stat.suffix}
          </div>
          <p className="mt-3 text-cream/80 text-sm leading-snug">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
