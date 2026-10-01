'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { clsx } from 'clsx';
import DateRangePicker from '@/components/sections/booking/DateRangePicker';
import { BOOKING_POLICY, UNITS, UNIT_LIST, type UnitId } from '@/lib/booking/units';
import {
  addDays,
  nightsBetween,
  todayInTbilisi,
  type DateStr,
  type Range
} from '@/lib/booking/dates';

interface Alternatives {
  sameUnit: Range[];
  otherUnits: UnitId[];
}

type Status = 'idle' | 'submitting' | 'success';

const formatDate = (date: DateStr) => date.split('-').reverse().join('.');

const inputClass =
  'w-full rounded-lg border border-forest/20 bg-white px-3 py-3 text-base text-forest focus:outline-none focus:border-gold';

export default function BookingFlow({
  initialUnit,
  initialCheckIn,
  initialCheckOut,
  initialGuests
}: {
  initialUnit: UnitId | null;
  initialCheckIn: DateStr | null;
  initialCheckOut: DateStr | null;
  initialGuests: number | null;
}) {
  const t = useTranslations('book');
  const tAll = useTranslations();
  const locale = useLocale();

  const today = useMemo(() => todayInTbilisi(), []);
  const maxDate = useMemo(() => addDays(today, BOOKING_POLICY.horizonDays), [today]);

  const [unit, setUnit] = useState<UnitId | null>(initialUnit);
  const [checkIn, setCheckIn] = useState<DateStr | null>(initialCheckIn);
  const [checkOut, setCheckOut] = useState<DateStr | null>(initialCheckOut);
  const [guests, setGuests] = useState(initialGuests ?? 2);
  const [step, setStep] = useState<1 | 2>(1);

  const [blocked, setBlocked] = useState<ReadonlySet<DateStr>>(new Set());
  const [availability, setAvailability] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [website, setWebsite] = useState(''); // honeypot

  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [invalid, setInvalid] = useState<string[]>([]);
  const [alternatives, setAlternatives] = useState<Alternatives | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  // Latest chosen stay, readable from the availability effect without re-running it.
  const stayRef = useRef({ checkIn, checkOut });
  stayRef.current = { checkIn, checkOut };

  const selectedUnit = unit ? UNITS[unit] : null;
  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
  const total = selectedUnit ? selectedUnit.pricePerNight * nights : 0;

  // Blocked nights for the chosen unit (Notion + Booking.com + Airbnb, merged on the server).
  useEffect(() => {
    if (!unit) return;
    let cancelled = false;
    setAvailability('loading');
    fetch(`/api/availability?unit=${unit}&from=${today}&to=${maxDate}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: { blocked: DateStr[] }) => {
        if (cancelled) return;
        const set = new Set(data.blocked);
        setBlocked(set);
        setAvailability('ready');
        // Drop a prefilled or previously chosen stay that isn't possible for this unit.
        const { checkIn: ci, checkOut: co } = stayRef.current;
        if (ci) {
          let ok = ci >= today && !set.has(ci);
          for (let d = ci; ok && co && d < co; d = addDays(d, 1)) ok = !set.has(d);
          if (!ok) {
            setCheckIn(null);
            setCheckOut(null);
          }
        }
      })
      .catch(() => {
        if (cancelled) return;
        setBlocked(new Set());
        setAvailability('error');
      });
    return () => {
      cancelled = true;
    };
  }, [unit, today, maxDate]);

  useEffect(() => {
    if (selectedUnit && guests > selectedUnit.maxGuests) setGuests(selectedUnit.maxGuests);
  }, [selectedUnit, guests]);

  function scrollTop() {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!unit || !checkIn || !checkOut) return;
    setError(null);
    setInvalid([]);

    if (!/^\+[1-9]\d{7,14}$/.test(phone.replace(/[\s().-]/g, ''))) {
      setInvalid(['phone']);
      setError(t('errorPhone'));
      return;
    }

    setStatus('submitting');
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unit, checkIn, checkOut, guests, name, phone, email, notes, locale, website })
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setWhatsappUrl(data.whatsappUrl ?? null);
        setStatus('success');
        scrollTop();
        return;
      }
      setStatus('idle');
      if (res.status === 409) {
        setAlternatives(data.alternatives ?? { sameUnit: [], otherUnits: [] });
        setBlocked((prev) => {
          const next = new Set(prev);
          for (let d = checkIn; d < checkOut; d = addDays(d, 1)) next.add(d);
          return next;
        });
        setCheckIn(null);
        setCheckOut(null);
        setStep(1);
        scrollTop();
      } else if (res.status === 400) {
        setInvalid(data.fields ?? []);
        setError(data.fields?.includes('phone') ? t('errorPhone') : t('errorInvalid'));
      } else if (res.status === 429) {
        setError(t('errorRate'));
      } else {
        setError(t('errorServer'));
      }
    } catch {
      setStatus('idle');
      setError(t('errorServer'));
    }
  }

  function reset() {
    setStatus('idle');
    setStep(1);
    setCheckIn(null);
    setCheckOut(null);
    setAlternatives(null);
    setWhatsappUrl(null);
    setName('');
    setPhone('');
    setEmail('');
    setNotes('');
    // Reload availability so the dates just requested show as taken.
    if (unit) {
      fetch(`/api/availability?unit=${unit}&from=${today}&to=${maxDate}`)
        .then((res) => res.json())
        .then((data: { blocked: DateStr[] }) => setBlocked(new Set(data.blocked)))
        .catch(() => {});
    }
  }

  if (status === 'success') {
    return (
      <div ref={topRef} className="max-w-xl mx-auto text-center bg-white rounded-2xl p-8 shadow-sm scroll-mt-28">
        <div className="text-4xl" aria-hidden>✅</div>
        <h2 className="mt-3 font-serif text-2xl text-forest font-semibold">{t('successTitle')}</h2>
        <p className="mt-2 text-forest/70">{t('successText')}</p>
        {selectedUnit && checkIn && checkOut && (
          <p className="mt-4 text-sm text-forest/80">
            {tAll(selectedUnit.nameKey)} · {formatDate(checkIn)} – {formatDate(checkOut)} ·{' '}
            {t('totalValue', { total })}
          </p>
        )}
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-[#25D366] text-white px-6 py-3 font-semibold hover:bg-[#1ebe5b] transition-colors"
          >
            {t('whatsappButton')}
          </a>
        )}
        <div className="mt-4">
          <button type="button" onClick={reset} className="text-sm text-forest/60 underline hover:text-forest">
            {t('newBooking')}
          </button>
        </div>
      </div>
    );
  }

  const summary = selectedUnit && checkIn && checkOut && (
    <div className="rounded-2xl bg-amber-50 border border-amber-200/70 p-5 text-sm text-forest/80">
      <h3 className="font-serif text-lg text-forest font-semibold">{t('summaryTitle')}</h3>
      <p className="mt-2 font-medium text-forest">{tAll(selectedUnit.nameKey)}</p>
      <p>
        {formatDate(checkIn)} – {formatDate(checkOut)} · {t('nightsCount', { count: nights })} · {t('guestsLabel')}: {guests}
      </p>
      <div className="mt-3 flex items-baseline justify-between border-t border-amber-200/70 pt-3">
        <span>
          {t('total')}{' '}
          <span className="text-forest/50">({t('priceLine', { nights, price: selectedUnit.pricePerNight })})</span>
        </span>
        <span className="font-serif text-xl text-forest font-semibold" data-testid="total">
          {t('totalValue', { total })}
        </span>
      </div>
      <p className="mt-3 font-medium text-forest">{t('breakfast')}</p>
      <p className="mt-1">{t('cancellation')}</p>
      <p>{t('times')}</p>
      <p>{t('payment')}</p>
    </div>
  );

  return (
    <div ref={topRef} className="max-w-3xl mx-auto scroll-mt-28">
      {alternatives && (
        <div role="alert" className="mb-8 rounded-2xl border border-amber-300 bg-amber-50 p-5">
          <h2 className="font-serif text-lg text-forest font-semibold">{t('unavailableTitle')}</h2>
          {alternatives.sameUnit.length === 0 && alternatives.otherUnits.length === 0 ? (
            <p className="mt-1 text-sm text-forest/70">{t('noAlternatives')}</p>
          ) : (
            <>
              <p className="mt-1 text-sm text-forest/70">{t('unavailableText')}</p>
              {alternatives.sameUnit.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-forest/60">{t('altSameUnit')}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {alternatives.sameUnit.map((r) => (
                      <button
                        key={r.start}
                        type="button"
                        onClick={() => {
                          setCheckIn(r.start);
                          setCheckOut(r.end);
                          setAlternatives(null);
                        }}
                        className="rounded-full bg-white border border-forest/20 px-4 py-2 text-sm text-forest hover:border-gold"
                      >
                        {formatDate(r.start)} – {formatDate(r.end)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {alternatives.otherUnits.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-forest/60">{t('altOtherUnits')}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {alternatives.otherUnits.map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setUnit(id);
                          setAlternatives(null);
                        }}
                        className="rounded-full bg-white border border-forest/20 px-4 py-2 text-sm text-forest hover:border-gold"
                      >
                        {tAll(UNITS[id].nameKey)} · {t('perNight', { price: UNITS[id].pricePerNight })}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-10">
          <section aria-labelledby="book-unit">
            <h2 id="book-unit" className="font-serif text-xl text-forest font-semibold mb-4">
              {t('stepUnit')}
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {UNIT_LIST.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  data-unit={u.id}
                  aria-pressed={unit === u.id}
                  onClick={() => setUnit(u.id)}
                  className={clsx(
                    'flex items-center gap-3 rounded-2xl border-2 bg-white p-2.5 text-left transition-colors',
                    unit === u.id ? 'border-gold bg-gold/5' : 'border-forest/10 hover:border-gold/60'
                  )}
                >
                  <span className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden">
                    <Image src={u.image} alt="" fill sizes="80px" className="object-cover" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium text-forest">{tAll(u.nameKey)}</span>
                    <span className="block text-sm text-gold font-medium">{t('perNight', { price: u.pricePerNight })}</span>
                    <span className="block text-xs text-forest/60">{t('upToGuests', { count: u.maxGuests })}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          {selectedUnit && (
            <section aria-labelledby="book-dates">
              <h2 id="book-dates" className="font-serif text-xl text-forest font-semibold mb-2">
                {t('stepDates')}
              </h2>
              {availability === 'loading' && <p className="text-sm text-forest/60 mb-2">{t('loadingDates')}</p>}
              {availability === 'error' && (
                <p role="alert" className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-2">
                  {t('availabilityError')}
                </p>
              )}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <DateRangePicker
                  locale={locale}
                  today={today}
                  maxDate={maxDate}
                  maxNights={BOOKING_POLICY.maxNights}
                  blocked={blocked}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  onChange={(ci, co) => {
                    setCheckIn(ci);
                    setCheckOut(co);
                  }}
                  labels={{
                    prevMonth: t('prevMonth'),
                    nextMonth: t('nextMonth'),
                    booked: t('dayBooked'),
                    available: t('dayAvailable'),
                    selected: t('daySelected'),
                    checkIn: t('checkIn'),
                    checkOut: t('checkOut'),
                    selectCheckIn: t('selectCheckIn'),
                    selectCheckOut: t('selectCheckOut'),
                    legendBooked: t('legendBooked'),
                    legendSelected: t('legendSelected')
                  }}
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-white p-3 shadow-sm">
                  <div className="text-forest/50 text-xs">{t('checkIn')}</div>
                  <div className="font-medium text-forest" data-testid="check-in">{checkIn ? formatDate(checkIn) : '—'}</div>
                </div>
                <div className="rounded-xl bg-white p-3 shadow-sm">
                  <div className="text-forest/50 text-xs">{t('checkOut')}</div>
                  <div className="font-medium text-forest" data-testid="check-out">{checkOut ? formatDate(checkOut) : '—'}</div>
                </div>
              </div>

              <div className="mt-4 flex items-end gap-3">
                <label className="flex-1 text-sm font-medium text-forest">
                  {t('guestsLabel')}
                  <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className={clsx(inputClass, 'mt-1.5')}
                  >
                    {Array.from({ length: selectedUnit.maxGuests }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
                {(checkIn || checkOut) && (
                  <button
                    type="button"
                    onClick={() => {
                      setCheckIn(null);
                      setCheckOut(null);
                    }}
                    className="h-12 px-3 text-sm text-forest/60 underline hover:text-forest"
                  >
                    {t('clearDates')}
                  </button>
                )}
              </div>

              {summary && <div className="mt-6">{summary}</div>}

              <button
                type="button"
                disabled={!checkIn || !checkOut}
                onClick={() => {
                  setAlternatives(null);
                  setStep(2);
                  scrollTop();
                }}
                className="mt-6 w-full rounded-full bg-forest text-cream py-3.5 font-semibold hover:bg-forest/90 transition-colors disabled:opacity-40"
              >
                {t('continue')}
              </button>
            </section>
          )}
        </div>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="text-sm text-forest/60 hover:text-forest"
          >
            ← {t('back')}
          </button>
          <h2 className="font-serif text-xl text-forest font-semibold">{t('stepDetails')}</h2>

          <label className="block text-sm font-medium text-forest">
            {t('nameLabel')}
            <input
              type="text"
              name="name"
              required
              minLength={2}
              maxLength={80}
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={invalid.includes('name')}
              className={clsx(inputClass, 'mt-1.5', invalid.includes('name') && 'border-red-500')}
            />
          </label>

          <label className="block text-sm font-medium text-forest">
            {t('phoneLabel')}
            <input
              type="tel"
              name="phone"
              required
              inputMode="tel"
              autoComplete="tel"
              placeholder="+995 5XX XX XX XX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              aria-invalid={invalid.includes('phone')}
              aria-describedby="phone-hint"
              className={clsx(inputClass, 'mt-1.5', invalid.includes('phone') && 'border-red-500')}
            />
            <span id="phone-hint" className="mt-1 block text-xs font-normal text-forest/60">
              {t('phoneHint')}
            </span>
          </label>

          <label className="block text-sm font-medium text-forest">
            {t('emailLabel')}
            <input
              type="email"
              name="email"
              autoComplete="email"
              maxLength={120}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={invalid.includes('email')}
              className={clsx(inputClass, 'mt-1.5', invalid.includes('email') && 'border-red-500')}
            />
          </label>

          <label className="block text-sm font-medium text-forest">
            {t('notesLabel')}
            <textarea
              name="notes"
              rows={3}
              maxLength={1000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={clsx(inputClass, 'mt-1.5')}
            />
          </label>

          {/* Honeypot: hidden from people and assistive tech; bots tend to fill it. */}
          <div aria-hidden className="absolute -left-[9999px] w-px h-px overflow-hidden">
            <label>
              Website
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </label>
          </div>

          {summary}

          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="w-full rounded-full bg-gold text-forest py-3.5 font-semibold hover:bg-gold/90 transition-colors disabled:opacity-60"
          >
            {status === 'submitting' ? t('submitting') : t('submit')}
          </button>
        </form>
      )}
    </div>
  );
}
