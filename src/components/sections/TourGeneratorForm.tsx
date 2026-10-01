'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { clsx } from 'clsx';
import FadeIn from '@/components/ui/FadeIn';
import { UNITS, type UnitId } from '@/lib/booking/units';
import { todayInTbilisi } from '@/lib/booking/dates';

interface StayAvailability {
  checkIn: string;
  checkOut: string;
  units: { unit: UnitId; available: boolean; bookUrl: string }[];
}

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
  const tAll = useTranslations();
  const locale = useLocale();

  const [days, setDays] = useState(3);
  const [people, setPeople] = useState(2);
  const [interests, setInterests] = useState<string[]>(['nature']);
  const [budget, setBudget] = useState<'low' | 'medium' | 'high'>('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [itinerary, setItinerary] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [question, setQuestion] = useState('');
  const [availability, setAvailability] = useState<StayAvailability | null>(null);

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
    setAvailability(null);

    try {
      const res = await fetch('/api/generate-tour', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          days,
          people,
          interests,
          budget,
          locale,
          startDate: startDate || undefined,
          question: question.trim() || undefined
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t('errorGeneric'));
      }

      setItinerary(data.itinerary);
      setAvailability(data.availability ?? null);
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

          <div>
            <label htmlFor="tour-start-date" className="block text-sm font-medium text-forest mb-1">
              {t('startDateLabel')}
            </label>
            <input
              id="tour-start-date"
              type="date"
              min={todayInTbilisi()}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-forest/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold"
            />
          </div>

          <div>
            <label htmlFor="tour-question" className="block text-sm font-medium text-forest mb-1">
              {t('questionLabel')}
            </label>
            <input
              id="tour-question"
              type="text"
              maxLength={300}
              placeholder={t('questionPlaceholder')}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full rounded-lg border border-forest/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold"
            />
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

          {availability && (
            <div className="mb-5 rounded-xl bg-amber-50 border border-amber-200/70 p-4">
              <h4 className="text-sm font-semibold text-forest">
                {t('availabilityTitle')} ({availability.checkIn.split('-').reverse().join('.')} –{' '}
                {availability.checkOut.split('-').reverse().join('.')})
              </h4>
              <ul className="mt-2 space-y-1.5 text-sm">
                {availability.units.map((u) => (
                  <li key={u.unit} className="flex items-center justify-between gap-3">
                    <span className={u.available ? 'text-forest' : 'text-forest/40 line-through'}>
                      {tAll(UNITS[u.unit].nameKey)}
                    </span>
                    {u.available ? (
                      <a href={u.bookUrl} className="shrink-0 text-gold font-semibold hover:text-forest">
                        {t('availabilityFree')} · {t('bookLink')} →
                      </a>
                    ) : (
                      <span className="shrink-0 text-forest/40">{t('availabilityBooked')}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

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
