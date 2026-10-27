// Simple line icons for the house rules and yoga retreat cards (24×24, stroke = currentColor).
const PATHS: Record<string, React.ReactNode> = {
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  smoke: (
    <>
      <path d="M3 15h13v3H3zM19 15v3M3 3l18 18" />
      <path d="M18 8c0-2 2-2 2-4" />
    </>
  ),
  shoe: <path d="M3 17h18v2H3zM3 17V8l5 1 2 3 6 1a5 5 0 0 1 5 4" />,
  moon: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6" />
    </>
  ),
  paw: (
    <>
      <circle cx="6" cy="10" r="2" />
      <circle cx="10" cy="5.5" r="2" />
      <circle cx="14" cy="5.5" r="2" />
      <circle cx="18" cy="10" r="2" />
      <path d="M12 11c-3 0-6 4-6 6.5S8 20 12 19s6 1.5 6-1.5S15 11 12 11z" />
    </>
  ),
  sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />,
  shield: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />,
  home: <path d="M3 11l9-7 9 7M5 9.5V20h14V9.5M10 20v-6h4v6" />,
  mountain: <path d="M2 20l7-12 4 6 3-4 6 10zM16 6.5a1.5 1.5 0 1 0 0-.01" />,
  car: (
    <>
      <path d="M3 16v-4l2-5h14l2 5v4H3zM3 12h18" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
    </>
  ),
  check: <path d="M5 12l5 5L20 7" />
};

export default function RuleIcon({ name, className = 'w-6 h-6' }: { name: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {PATHS[name] ?? PATHS.check}
    </svg>
  );
}
