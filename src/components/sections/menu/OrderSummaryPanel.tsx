export interface CartLine {
  itemId: string;
  qty: number;
  name: string;
  price: number;
}

export default function OrderSummaryPanel({
  lines,
  total,
  currency,
  totalLabel,
  emptyState,
  proceedLabel,
  onProceed
}: {
  lines: CartLine[];
  total: number;
  currency: string;
  totalLabel: string;
  emptyState: string;
  proceedLabel: string;
  onProceed: () => void;
}) {
  return (
    <>
      {/* Desktop floating panel */}
      <div className="hidden lg:block fixed right-6 top-1/3 w-72 bg-white rounded-2xl shadow-lg p-5 z-40 max-h-[60vh] overflow-y-auto">
        {lines.length === 0 ? (
          <p className="text-forest/50 text-sm">{emptyState}</p>
        ) : (
          <>
            <ul className="space-y-2 mb-4">
              {lines.map((line) => (
                <li key={line.itemId} className="flex justify-between text-sm text-forest/80">
                  <span>
                    {line.name} &times;{line.qty}
                  </span>
                  <span className="text-gold font-medium">
                    {line.price * line.qty} {currency}
                  </span>
                </li>
              ))}
            </ul>
            <div className="border-t border-forest/10 pt-3 flex items-center justify-between mb-4">
              <span className="text-forest/70 text-sm">{totalLabel}</span>
              <span className="text-gold font-semibold">
                {total} {currency}
              </span>
            </div>
            <button
              type="button"
              onClick={onProceed}
              className="w-full rounded-full bg-forest text-cream py-2.5 text-sm font-medium hover:bg-forest/90 transition-colors"
            >
              {proceedLabel}
            </button>
          </>
        )}
      </div>

      {/* Mobile bottom bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-forest/10 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <div className="container-px py-3">
          {lines.length === 0 ? (
            <p className="text-center text-forest/50 text-sm">{emptyState}</p>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm">
                <span className="text-forest/60">{totalLabel}: </span>
                <span className="text-gold font-semibold">
                  {total} {currency}
                </span>
              </div>
              <button
                type="button"
                onClick={onProceed}
                className="whitespace-nowrap rounded-full bg-forest text-cream px-5 py-2.5 text-sm font-medium hover:bg-forest/90 transition-colors"
              >
                {proceedLabel}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
