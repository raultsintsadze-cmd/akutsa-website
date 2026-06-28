'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { clsx } from 'clsx';
import FadeIn from '@/components/ui/FadeIn';

const INTERESTS = [
  { key: 'nature', labelKey: 'interestNature' },
  { key: 'history', labelKey: 'interestHistory' },
  { key: 'culinary', labelKey: 'interestCulinary' },
  { key: 'adventure', labelKey: 'interestAdventure' }
] as const;

const BUDGETS = [
  { key: 'low', labelKey: 'budgetLow' },
  { key: 'medium', labelKey: 'budgetMedium' },
  { key: 'high', labelKey: 'budgetHigh' }
] as const;

export default function TourGeneratorForm() {
  const t = useTranslations('tourGenerator');
  const locale = useLocale();

  const [days, setDays] = useState(3);
  const [people, setPeople] = useState(2);
  const [interests, setInterests] = useState<string[]>(['nature']);
  const [budget, setBudget] = useState<'low' | 'medium' | 'high'>('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [itinerary, setItinerary] = useState<string | null>(null);

  function toggleInterest(key: string) {
    setInterests((prev) =>
      prev.includes(key) ? prev.filter((i) => i !== key) : [...prev, key]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setItinerary(null);

    try {
      const res = await fetch('/api/generate-tour', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days, people, interests, budget, locale })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t('errorGeneric'));
      }

      setItinerary(data.itinerary);
    } catch {
      setError(t('errorGeneric'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-12">
      <FadeIn>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <label className="block text-sm font-medium text-forest mb-1">
              {t('daysLabel')}
            </label>
            <input
              type="number"
              min={1}
              max={14}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              required
              className="w-full rounded-lg border border-forest/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-forest mb-1">
              {t('peopleLabel')}
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={people}
              onChange={(e) => setPeople(Number(e.target.value))}
              required
              className="w-full rounded-lg border border-forest/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-forest mb-2">
              {t('interestsLabel')}
            </label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((interest) => (
                <button
                  type="button"
                  key={interest.key}
                  onClick={() => toggleInterest(interest.key)}
                  className={clsx(
                    'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                    interests.includes(interest.key)
                      ? 'bg-forest text-cream'
                      : 'bg-cream text-forest/70 hover:bg-forest/10'
                  )}
                >
                  {t(interest.labelKey)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-forest mb-2">
              {t('budgetLabel')}
            </label>
            <div className="flex flex-wrap gap-2">
              {BUDGETS.map((b) => (
                <button
                  type="button"
                  key={b.key}
                  onClick={() => setBudget(b.key)}
                  className={clsx(
                    'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                    budget === b.key
                      ? 'bg-forest text-cream'
                      : 'bg-cream text-forest/70 hover:bg-forest/10'
                  )}
                >
                  {t(b.labelKey)}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-gold text-forest py-3 font-medium hover:bg-gold/90 transition-colors disabled:opacity-60"
          >
            {loading ? t('generating') : t('submit')}
          </button>
        </form>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="bg-white rounded-2xl p-6 shadow-sm h-full min-h-[300px]">
          <h3 className="font-serif text-xl text-forest font-semibold mb-4">
            {t('resultTitle')}
          </h3>

          {loading && <p className="text-forest/60 text-sm">{t('generating')}</p>}

          {error && <p className="text-red-600 text-sm">{error}</p>}

          {itinerary && (
            <>
              <div className="text-forest/80 text-sm leading-relaxed whitespace-pre-wrap">
                {itinerary}
              </div>
              <p className="mt-6 text-xs text-forest/50 border-t border-forest/10 pt-4">
                {t('disclaimer')}
              </p>
            </>
          )}

          {!loading && !error && !itinerary && (
            <p className="text-forest/50 text-sm">{t('subtitle')}</p>
          )}
        </div>
      </FadeIn>
    </div>
  );
}
