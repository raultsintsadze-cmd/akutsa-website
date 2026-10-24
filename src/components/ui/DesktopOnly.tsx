'use client';

import { useEffect, useState } from 'react';

// Mounts children only on screens ≥ 768 px, so phones don't run (or download data for)
// desktop-only widgets. Use only for content with no SEO value.
export default function DesktopOnly({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setShow(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return show ? <>{children}</> : null;
}
