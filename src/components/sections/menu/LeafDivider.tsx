export default function LeafDivider() {
  return (
    <div className="flex items-center justify-center gap-3 my-4" aria-hidden="true">
      <span className="h-px w-12 sm:w-20 bg-gold/40" />
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-gold shrink-0" fill="currentColor">
        <path d="M12 2C12 2 4 6 4 13a8 8 0 0 0 16 0c0-7-8-11-8-11zm0 3.7c2.4 2 4.3 4.8 4.3 7.3a4.3 4.3 0 0 1-8.6 0c0-2.5 1.9-5.3 4.3-7.3z" />
      </svg>
      <span className="h-px w-12 sm:w-20 bg-gold/40" />
    </div>
  );
}
