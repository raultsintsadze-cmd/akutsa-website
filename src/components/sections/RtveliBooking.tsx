'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import FadeIn from '@/components/ui/FadeIn';
import Section from '@/components/ui/Section';
import RtveliPricing from '@/components/sections/RtveliPricing';
import { RTVELI_PRICES, type RtveliTransport } from '@/lib/constants';

const MAX_SEATS = 6;

interface RtveliDate {
  id: string;
  date: string;
  vehicle: string;
  totalSeats: number;
  bookedSeats: number;
  seatsRemaining: number;
}

export default function RtveliBooking() {
  const t = useTranslations('rtveli');
  const locale = useLocale();

  const [dates, setDates] = useState<RtveliDate[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [transport, setTransport] = useState<RtveliTransport | null>(null);
  const [seats, setSeats] = useState(1);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  useEffect(() => {
    fetch('/api/rtveli-dates')
      .then((res) => res.json())
      .then((data) => setDates(data.dates ?? []))
      .catch(() => setDates([]));
  }, []);

  const selected = dates?.find((d) => d.id === selectedId) ?? null;
  // Van seats only cap guests who ride with us; guests without transport meet us on site.
  const vanFull = selected !== null && selected.seatsRemaining === 0;
  const maxSeats =
    selected && transport === 'with' ? Math.min(MAX_SEATS, selected.seatsRemaining) : MAX_SEATS;
  const total = transport ? RTVELI_PRICES[transport] * seats : null;

  function chooseDate(d: RtveliDate) {
    setSelectedId(d.id);
    setSeats(1);
    if (d.seatsRemaining === 0 && transport === 'with') setTransport(null);
  }

  function chooseTransport(value: RtveliTransport) {
    setTransport(value);
    if (value === 'with' && selected) setSeats((n) => Math.min(n, Math.max(1, selected.seatsRemaining)));
  }

  const localeMap: Record<string, string> = { ka: 'ka-GE', en: 'en-GB', ru: 'ru-RU' };

  function formatDate(dateStr: string) {
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString(localeMap[locale] ?? 'en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !transport || !name.trim() || !contact.trim()) return;

    setStatus('submitting');
    try {
      const res = await fetch('/api/rtveli-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selected.date,
          vehicle: selected.vehicle,
          seats,
          transport,
          name: name.trim(),
          contact: contact.trim()
        })
      });
      if (!res.ok) throw new Error('failed');
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <Section>
        <FadeIn>
          <div className="max-w-lg mx-auto text-center bg-amber-50 border border-amber-200 rounded-3xl p-10">
            <div className="text-4xl mb-3" aria-hidden>🍇</div>
            <h3 className="font-serif text-2xl text-forest font-semibold">{t('successTitle')}</h3>
            <p className="mt-3 text-forest/70 text-sm leading-relaxed">{t('successMsg')}</p>
          </div>
        </FadeIn>
      </Section>
    );
  }

  return (
    <Section>
      <FadeIn>
        <div className="text-center mb-10">
          <h2 className="font-serif text-3xl md:text-4xl text-forest font-semibold">
            {t('bookingTitle')}
          </h2>
          <p className="mt-3 text-forest/70 max-w-xl mx-auto">{t('bookingSubtitle')}</p>
        </div>
      </FadeIn>

      <div className="max-w-5xl mx-auto grid lg:grid-cols-5 gap-8 items-start">
        <div className="lg:col-span-3">
        {dates === null && (
          <p className="text-center text-forest/50 text-sm">…</p>
        )}

        {dates !== null && dates.length === 0 && (
          <p className="text-center text-forest/60 bg-amber-50 border border-amber-200 rounded-2xl p-6 text-sm">
            {t('noAvailableDates')}
          </p>
        )}

        {dates !== null && dates.length > 0 && (
          <>
            <div className="grid sm:grid-cols-2 gap-3 mb-8">
              {dates.map((d) => {
                const isSelected = d.id === selectedId;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => chooseDate(d)}
                    className={`text-left rounded-2xl border-2 p-4 transition-colors ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-amber-100 bg-white hover:border-amber-300'
                    }`}
                  >
                    <div className="font-serif text-lg text-forest font-semibold capitalize">
                      {formatDate(d.date)}
                    </div>
                    <div className="mt-1 flex items-center justify-between text-sm">
                      <span className="text-forest/60">🚐 {d.vehicle}</span>
                      {d.seatsRemaining > 0 ? (
                        <span className="text-amber-700 font-medium">
                          {t('seatsRemaining', { count: d.seatsRemaining })}
                        </span>
                      ) : (
                        <span className="text-forest/50 text-xs text-right">{t('vanFull')}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {selected && (
              <form onSubmit={handleSubmit} className="bg-white border border-amber-100 rounded-2xl p-6 space-y-5">
                <fieldset>
                  <legend className="block text-sm font-medium text-forest mb-1.5">
                    {t('transportLabel')}
                  </legend>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {(['with', 'without'] as const).map((value) => {
                      const disabled = value === 'with' && vanFull;
                      return (
                        <label
                          key={value}
                          className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm transition-colors ${
                            disabled
                              ? 'border-forest/10 text-forest/40 cursor-not-allowed'
                              : transport === value
                                ? 'border-amber-500 bg-amber-50 text-forest cursor-pointer'
                                : 'border-forest/15 text-forest hover:border-amber-300 cursor-pointer'
                          }`}
                        >
                          <input
                            type="radio"
                            name="transport"
                            value={value}
                            required
                            disabled={disabled}
                            checked={transport === value}
                            onChange={() => chooseTransport(value)}
                            onInvalid={(e) => e.currentTarget.setCustomValidity(t('chooseTransport'))}
                            onInput={(e) => e.currentTarget.setCustomValidity('')}
                            className="accent-amber-700"
                          />
                          {t(value === 'with' ? 'transportWith' : 'transportWithout', {
                            price: RTVELI_PRICES[value]
                          })}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                <div>
                  <label className="block text-sm font-medium text-forest mb-1.5">
                    {t('seatsLabel')}
                  </label>
                  <select
                    value={seats}
                    onChange={(e) => setSeats(Number(e.target.value))}
                    className="w-full rounded-lg border border-forest/20 px-3 py-2 text-forest bg-white focus:outline-none focus:border-amber-500"
                  >
                    {Array.from({ length: maxSeats }, (_, i) => i + 1).map(
                      (n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-forest mb-1.5">
                    {t('nameLabel')}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-forest/20 px-3 py-2 text-forest focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-forest mb-1.5">
                    {t('contactLabel')}
                  </label>
                  <input
                    type="text"
                    required
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="w-full rounded-lg border border-forest/20 px-3 py-2 text-forest focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-baseline justify-between border-t border-amber-100 pt-4">
                  <span className="text-sm font-medium text-forest">{t('totalLabel')}</span>
                  <span className="font-serif text-2xl text-amber-800 font-semibold">
                    {total !== null ? `${total} GEL` : '—'}
                    {total !== null && seats > 1 && (
                      <span className="ml-2 font-sans text-xs text-forest/50 font-normal">
                        {RTVELI_PRICES[transport!]} × {seats}
                      </span>
                    )}
                  </span>
                </div>

                {status === 'error' && (
                  <p className="text-red-600 text-sm">{t('errorMsg')}</p>
                )}

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full bg-amber-700 hover:bg-amber-800 text-cream font-semibold py-3 rounded-lg transition-colors disabled:opacity-60"
                >
                  {status === 'submitting' ? t('submitting') : t('submitBtn')}
                </button>
              </form>
            )}
          </>
        )}
        </div>

        <RtveliPricing className="lg:col-span-2 lg:sticky lg:top-28" />
      </div>
    </Section>
  );
}
