import FadeIn from '@/components/ui/FadeIn';

interface FaqItem {
  q: string;
  a: string;
}

// Native <details>/<summary>: every answer is in the server HTML (crawlable),
// and it opens/closes without JavaScript.
export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  return (
    <div className="max-w-3xl mx-auto divide-y divide-forest/10">
      {items.map((item, i) => (
        <FadeIn key={i} delay={i * 0.04}>
          <details className="group">
            <summary className="w-full flex items-center justify-between py-5 text-left gap-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <span className="font-medium text-forest group-hover:text-gold transition-colors">
                {item.q}
              </span>
              <span
                aria-hidden
                className="shrink-0 w-7 h-7 rounded-full border border-forest/20 flex items-center justify-center text-forest/60 transition-all duration-300 group-hover:border-gold group-hover:text-gold group-open:rotate-45 group-open:border-gold group-open:text-gold"
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                  <path d="M8 3v10M3 8h10" strokeLinecap="round" />
                </svg>
              </span>
            </summary>
            <p className="pb-5 text-forest/70 leading-relaxed text-sm pr-10">{item.a}</p>
          </details>
        </FadeIn>
      ))}
    </div>
  );
}
