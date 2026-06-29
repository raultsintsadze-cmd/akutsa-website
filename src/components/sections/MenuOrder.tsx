'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { clsx } from 'clsx';
import { MENU_CATEGORIES } from '@/lib/menuData';
import type { Locale } from '@/i18n/config';

export default function MenuOrder() {
  const locale = useLocale() as Locale;
  const t = useTranslations('menu');

  const [activeCategory, setActiveCategory] = useState(MENU_CATEGORIES[0].id);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const activeItems = MENU_CATEGORIES.find((c) => c.id === activeCategory)?.items ?? [];

  const lines = useMemo(
    () =>
      Object.entries(quantities)
        .filter(([, qty]) => qty > 0)
        .map(([itemId, qty]) => {
          const item = MENU_CATEGORIES.flatMap((c) => c.items).find((i) => i.id === itemId)!;
          return { itemId, qty, item };
        }),
    [quantities]
  );

  const total = lines.reduce((sum, l) => sum + l.item.price * l.qty, 0);

  function changeQty(itemId: string, delta: number) {
    setQuantities((prev) => {
      const next = Math.max(0, (prev[itemId] ?? 0) + delta);
      return { ...prev, [itemId]: next };
    });
  }

  async function handleSubmit() {
    if (lines.length === 0 || !name.trim()) return;

    setStatus('sending');

    try {
      const res = await fetch('/api/send-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lines: lines.map((l) => ({ itemId: l.itemId, qty: l.qty })),
          name,
          note
        })
      });

      if (!res.ok) throw new Error('failed');

      setStatus('success');
      setQuantities({});
      setNote('');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {MENU_CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={clsx(
              'px-4 py-2 rounded-full text-sm font-medium transition-colors',
              activeCategory === category.id
                ? 'bg-forest text-cream'
                : 'bg-white text-forest/70 hover:bg-forest/10'
            )}
          >
            {category.label[locale]}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-24">
        {activeItems.map((item) => {
          const qty = quantities[item.id] ?? 0;
          return (
            <div
              key={item.id}
              className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm"
            >
              <div>
                <p className="font-medium text-forest text-sm">{item.name[locale]}</p>
                <p className="text-gold text-sm mt-1">
                  {item.price} {t('currency')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => changeQty(item.id, -1)}
                  disabled={qty === 0}
                  aria-label="-"
                  className="w-8 h-8 rounded-full bg-cream text-forest font-medium disabled:opacity-40 hover:bg-forest/10 transition-colors"
                >
                  −
                </button>
                <span className="w-6 text-center font-medium text-forest">{qty}</span>
                <button
                  type="button"
                  onClick={() => changeQty(item.id, 1)}
                  aria-label="+"
                  className="w-8 h-8 rounded-full bg-forest text-cream font-medium hover:bg-forest/90 transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-forest/10 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <div className="container-px max-w-3xl mx-auto py-4">
          {lines.length === 0 ? (
            <p className="text-center text-forest/50 text-sm">{t('emptyState')}</p>
          ) : (
            <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('namePlaceholder')}
                required
                className="rounded-lg border border-forest/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold"
              />
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('notePlaceholder')}
                className="rounded-lg border border-forest/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold"
              />
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="text-forest/60">{t('totalLabel')}: </span>
                  <span className="text-gold font-semibold">
                    {total} {t('currency')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={status === 'sending' || !name.trim()}
                  className="whitespace-nowrap rounded-full bg-forest text-cream px-5 py-2.5 text-sm font-medium hover:bg-forest/90 transition-colors disabled:opacity-50"
                >
                  {status === 'sending' ? t('sending') : t('orderButton')}
                </button>
              </div>
            </div>
          )}

          {status === 'success' && (
            <p className="mt-3 text-center text-sm text-forest font-medium">
              {t('successMessage')}
            </p>
          )}
          {status === 'error' && (
            <p className="mt-3 text-center text-sm text-red-600 font-medium">
              {t('errorMessage')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
