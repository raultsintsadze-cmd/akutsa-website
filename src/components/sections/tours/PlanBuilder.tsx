'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { clsx } from 'clsx';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/config';
import { addDays, todayInTbilisi, type DateStr } from '@/lib/booking/dates';
import {
  buildSchedule,
  checkAdd,
  peopleProblem,
  priceFor,
  tripTotal,
  type AddBlock,
  type TripItem
} from '@/lib/tours/schedule';
import type { Tour } from '@/lib/tours/types';
import { usePriceLabel } from './TourFacts';
import { useTrip } from './TripContext';

const formatDate = (d: DateStr) => d.split('-').reverse().join('.');
const inputClass =
  'w-full rounded-lg border border-forest/20 bg-white px-3 py-2.5 text-base text-forest focus:outline-none focus:border-gold';

interface Notice {
  text: string;
  suggest?: { slug: string; date: DateStr; replaceIndex?: number };
}

export default function PlanBuilder() {
  const t = useTranslations('tours');
  const tBook = useTranslations('book');
  const locale = useLocale() as Locale;
  const priceLabel = usePriceLabel();
  const { tours, catalog, trip, setTrip, ready } = useTrip();

  const today = todayInTbilisi();
  const tomorrow = addDays(today, 1);
  const [newDate, setNewDate] = useState<DateStr>(tomorrow);
  const [notice, setNotice] = useState<Notice | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);

  const oneDayDate = trip.items[0]?.date ?? newDate;
  const schedule = useMemo(() => buildSchedule(trip.items, catalog), [trip.items, catalog]);
  const total = tripTotal(trip.items, catalog, trip.people, trip.staying);
  const dates = trip.items.map((i) => i.date).sort();
  const name_ = (slug: string) => catalog.get(slug)?.name[locale] ?? slug;

  function blockText(block: AddBlock, tour: Tour, date: DateStr): Notice {
    if (block.reason === 'fullDayTaken') {
      return {
        text: `${t('blockedFullDay', { tour: name_(block.blocker), date: formatDate(date) })} ${t('nextFreeDay', { date: formatDate(block.nextFreeDate) })}`,
        suggest: { slug: tour.slug, date: block.nextFreeDate }
      };
    }
    if (block.reason === 'dayNotEmpty') {
      return {
        text: `${t('blockedDayBusy', { tour: tour.name[locale], date: formatDate(date) })} ${t('nextFreeDay', { date: formatDate(block.nextFreeDate) })}`,
        suggest: { slug: tour.slug, date: block.nextFreeDate }
      };
    }
    if (block.reason === 'outOfSeason') return { text: t('blockedSeason', { tour: tour.name[locale], date: formatDate(date) }) };
    return { text: '' };
  }

  function add(tour: Tour, date: DateStr, replaceIndex?: number) {
    const others = replaceIndex === undefined ? trip.items : trip.items.filter((_, i) => i !== replaceIndex);
    const block = checkAdd(others, tour, date, catalog);
    if (block) {
      if (block.reason !== 'duplicate') {
        const n = blockText(block, tour, date);
        setNotice(n.suggest ? { ...n, suggest: { ...n.suggest, replaceIndex } } : n);
      }
      return;
    }
    setNotice(null);
    setTrip((p) => {
      const items = [...p.items];
      if (replaceIndex === undefined) items.push({ slug: tour.slug, date });
      else items[replaceIndex] = { ...items[replaceIndex], date };
      return { ...p, items };
    });
  }

  function setMode(mode: 'one' | 'many') {
    setNotice(null);
    if (mode === 'one' && new Set(trip.items.map((i) => i.date)).size > 1) {
      // Pulling everything onto one day must still respect full-day rules.
      const target = trip.items[0].date;
      const kept: TripItem[] = [];
      for (const item of trip.items) {
        const tour = catalog.get(item.slug)!;
        if (!checkAdd(kept, tour, target, catalog)) kept.push({ ...item, date: target });
      }
      if (kept.length < trip.items.length) {
        setNotice({ text: t('warnConflict') });
        return;
      }
      setTrip((p) => ({ ...p, mode, items: kept }));
      return;
    }
    setTrip((p) => ({ ...p, mode }));
  }

  function setOneDayDate(date: DateStr) {
    if (!date) return;
    setNewDate(date);
    setTrip((p) => ({ ...p, items: p.items.map((i) => ({ ...i, date })) }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\+[1-9]\d{7,14}$/.test(phone.replace(/[\s().-]/g, ''))) {
      setError(tBook('errorPhone'));
      return;
    }
    setStatus('submitting');
    try {
      const res = await fetch('/api/tour-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: trip.items,
          people: trip.people,
          staying: trip.staying,
          transfer: trip.transfer,
          name,
          phone,
          email,
          notes,
          locale,
          website
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setWhatsappUrl(data.whatsappUrl ?? null);
        setStatus('success');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      setStatus('idle');
      setError(
        res.status === 429
          ? tBook('errorRate')
          : data.error === 'invalid_trip'
            ? t('errorTrip')
            : data.fields?.includes('phone')
              ? tBook('errorPhone')
              : res.status === 400
                ? tBook('errorInvalid')
                : tBook('errorServer')
      );
    } catch {
      setStatus('idle');
      setError(tBook('errorServer'));
    }
  }

  if (!ready) return <p className="text-center text-forest/50">…</p>;

  if (status === 'success') {
    return (
      <div className="max-w-xl mx-auto text-center bg-white rounded-2xl p-8 shadow-sm">
        <div className="text-4xl" aria-hidden>✅</div>
        <h2 className="mt-3 font-serif text-2xl text-forest font-semibold">{t('successTitle')}</h2>
        <p className="mt-2 text-forest/70">{t('successText')}</p>
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex rounded-full bg-[#075E54] text-white px-6 py-3 font-semibold hover:bg-[#064c44]"
          >
            {t('whatsappButton')}
          </a>
        )}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => {
              setTrip((p) => ({ ...p, items: [] }));
              setStatus('idle');
            }}
            className="text-sm text-forest/60 underline"
          >
            {t('newTrip')}
          </button>
        </div>
      </div>
    );
  }

  const addTarget = trip.mode === 'one' ? oneDayDate : newDate;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-24">
      {/* Mode */}
      <fieldset>
        <legend className="text-sm font-medium text-forest mb-2">{t('modeLabel')}</legend>
        <div className="grid grid-cols-2 gap-2">
          {(['one', 'many'] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={trip.mode === m}
              onClick={() => setMode(m)}
              className={clsx(
                'rounded-xl border-2 px-3 py-3 text-sm font-medium',
                trip.mode === m ? 'border-gold bg-gold/10 text-forest' : 'border-forest/10 bg-white text-forest/70'
              )}
            >
              {m === 'one' ? t('modeOneDay') : t('modeSeveralDays')}
            </button>
          ))}
        </div>
      </fieldset>

      {trip.mode === 'one' && (
        <label className="block text-sm font-medium text-forest">
          {t('tripDate')}
          <input
            type="date"
            min={tomorrow}
            value={oneDayDate}
            onChange={(e) => setOneDayDate(e.target.value)}
            className={clsx(inputClass, 'mt-1.5')}
          />
        </label>
      )}

      {notice && notice.text && (
        <div role="alert" data-testid="notice" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-forest">
          <p>{notice.text}</p>
          {notice.suggest && trip.mode === 'many' && (
            <button
              type="button"
              onClick={() => add(catalog.get(notice.suggest!.slug)!, notice.suggest!.date, notice.suggest!.replaceIndex)}
              className="mt-2 rounded-full bg-forest text-cream px-4 py-2 text-sm font-semibold"
            >
              {t('useNextFreeDay', { date: formatDate(notice.suggest.date) })}
            </button>
          )}
        </div>
      )}

      {/* Items */}
      <section aria-labelledby="trip-items">
        <h2 id="trip-items" className="sr-only">
          {t('timeline')}
        </h2>
        {trip.items.length === 0 ? (
          <p className="rounded-xl bg-white p-5 text-sm text-forest/60">{t('emptyTrip')}</p>
        ) : (
          <ul className="space-y-3">
            {trip.items.map((item, index) => {
              const tour = catalog.get(item.slug);
              if (!tour) return null;
              const price = priceFor(tour, trip.people, trip.staying);
              const ppl = peopleProblem(tour, trip.people);
              return (
                <li key={`${item.slug}-${item.date}-${index}`} data-item={item.slug} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-forest">
                        {tour.name[locale]}
                        {tour.dayType === 'Full day' && (
                          <span className="ml-2 rounded-full bg-forest text-cream px-2 py-0.5 text-[11px] font-semibold align-middle">
                            {t('fullDay')}
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gold font-medium">
                        {price.total === null
                          ? priceLabel(tour)
                          : `${price.total} GEL${tour.priceType === 'per group' ? ` (${t('units', { count: price.units, price: price.unitPrice! })})` : ''}${price.overnightRate ? ` · ${t('overnightRate')}` : ''}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTrip((p) => ({ ...p, items: p.items.filter((_, i) => i !== index) }))}
                      className="text-sm text-forest/50 hover:text-red-700"
                      aria-label={`${t('remove')}: ${tour.name[locale]}`}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {trip.mode === 'many' && (
                      <label className="text-xs text-forest/60">
                        {t('itemDate')}
                        <input
                          type="date"
                          min={tomorrow}
                          value={item.date}
                          onChange={(e) => e.target.value && add(tour, e.target.value, index)}
                          className={clsx(inputClass, 'mt-1 text-sm py-2')}
                        />
                      </label>
                    )}
                    {tour.dayType !== 'Full day' && (
                      <label className="text-xs text-forest/60">
                        {t('itemTime')}
                        <select
                          value={item.slot ?? ''}
                          onChange={(e) =>
                            setTrip((p) => ({
                              ...p,
                              items: p.items.map((it, i) => (i === index ? { ...it, slot: e.target.value || undefined } : it))
                            }))
                          }
                          className={clsx(inputClass, 'mt-1 text-sm py-2')}
                        >
                          <option value="">{t('anyTime')}</option>
                          {tour.startTimes.length > 0
                            ? tour.startTimes.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))
                            : [
                                <option key="m" value="morning">{t('morning')}</option>,
                                <option key="a" value="afternoon">{t('afternoon')}</option>
                              ]}
                        </select>
                      </label>
                    )}
                  </div>
                  {tour.startTimes.length === 0 && tour.dayType !== 'Full day' && (
                    <p className="mt-1 text-xs text-forest/50">{t('timeByAgreement')}</p>
                  )}
                  {ppl && (
                    <p role="alert" className="mt-2 text-xs text-red-700">
                      {ppl === 'tooFew'
                        ? t('tooFew', { tour: tour.name[locale], min: tour.minPeople ?? 0 })
                        : t('tooMany', { tour: tour.name[locale], max: tour.maxPeople ?? 0 })}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Add activities */}
      <section aria-labelledby="add-tours">
        <h2 id="add-tours" className="font-serif text-xl text-forest font-semibold mb-3">
          {t('addMore')}
        </h2>
        {trip.mode === 'many' && (
          <label className="block text-sm font-medium text-forest mb-3">
            {t('itemDate')}
            <input
              type="date"
              min={tomorrow}
              value={newDate}
              onChange={(e) => e.target.value && setNewDate(e.target.value)}
              data-testid="new-date"
              className={clsx(inputClass, 'mt-1.5')}
            />
          </label>
        )}
        <div className="grid sm:grid-cols-2 gap-2">
          {tours.map((tour) => (
            <button
              key={tour.slug}
              type="button"
              data-plan-add={tour.slug}
              onClick={() => add(tour, addTarget)}
              className="flex items-center justify-between gap-2 rounded-xl border border-forest/10 bg-white px-3 py-3 text-left text-sm hover:border-gold"
            >
              <span>
                <span className="block font-medium text-forest">{tour.name[locale]}</span>
                <span className="block text-xs text-forest/60">
                  {tour.dayType === 'Full day' ? t('fullDay') : t('shortActivity')} · {priceLabel(tour)}
                </span>
              </span>
              <span className="text-gold text-lg" aria-hidden>
                +
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Options */}
      <section className="space-y-4">
        <label className="block text-sm font-medium text-forest">
          {t('peopleLabel')}
          <input
            type="number"
            min={1}
            max={50}
            value={trip.people}
            onChange={(e) => {
              const n = Math.max(1, Math.min(50, Number(e.target.value) || 1));
              setTrip((p) => ({ ...p, people: n }));
            }}
            className={clsx(inputClass, 'mt-1.5')}
          />
        </label>
        <label className="flex items-start gap-3 text-sm text-forest">
          <input
            type="checkbox"
            checked={trip.staying}
            onChange={(e) => setTrip((p) => ({ ...p, staying: e.target.checked }))}
            className="mt-1 w-5 h-5 accent-forest"
          />
          <span>
            {t('staying')}
            {trip.staying && dates.length > 0 && (
              <Link
                href={`/book?in=${dates[0]}&out=${addDays(dates.at(-1)!, 1)}`}
                className="block text-gold underline"
              >
                {t('stayingBook')}
              </Link>
            )}
          </span>
        </label>
        <label className="flex items-start gap-3 text-sm text-forest">
          <input
            type="checkbox"
            checked={trip.transfer}
            onChange={(e) => setTrip((p) => ({ ...p, transfer: e.target.checked }))}
            className="mt-1 w-5 h-5 accent-forest"
          />
          {t('transfer')}
        </label>
      </section>

      {/* Timeline + total */}
      {schedule.length > 0 && (
        <section aria-labelledby="timeline" className="rounded-2xl bg-amber-50 border border-amber-200/70 p-5">
          <h2 id="timeline" className="font-serif text-lg text-forest font-semibold">
            {t('timeline')}
          </h2>
          <ol className="mt-3 space-y-4" data-testid="timeline">
            {schedule.map((day, n) => (
              <li key={day.date}>
                <p className="text-sm font-semibold text-forest">
                  {t('dayN', { n: n + 1 })} · {formatDate(day.date)}
                </p>
                <ul className="mt-1 space-y-1 text-sm text-forest/80">
                  {day.items.map((i) => (
                    <li key={i.slug}>
                      {i.fullDay ? t('fullDayNote') : `${i.start}–${i.end}${i.approx ? ` (${t('approx')})` : ''}`} · {name_(i.slug)}
                      {i.shifted && <span className="block text-xs text-amber-800">{t('warnShifted', { time: i.start })}</span>}
                    </li>
                  ))}
                </ul>
                {day.overflow && <p role="alert" className="mt-1 text-xs text-amber-800">{t('warnOverflow')}</p>}
                {day.conflict && <p role="alert" className="mt-1 text-xs text-red-700">{t('warnConflict')}</p>}
              </li>
            ))}
          </ol>
          <div className="mt-4 border-t border-amber-200/70 pt-3 flex items-baseline justify-between gap-3">
            <span className="text-sm text-forest">{t('total')}</span>
            <span className="font-serif text-xl text-forest font-semibold" data-testid="trip-total">
              {total === null ? t('onRequest') : `${total} GEL`}
            </span>
          </div>
          {total === null && <p className="mt-1 text-xs text-forest/60">{t('totalOnRequest')}</p>}
          {trip.transfer && <p className="mt-1 text-xs text-forest/60">{t('transferExtra')}</p>}
        </section>
      )}

      {/* Details */}
      {trip.items.length > 0 && (
        <form onSubmit={submit} className="space-y-4">
          <h2 className="font-serif text-xl text-forest font-semibold">{t('detailsTitle')}</h2>
          <label className="block text-sm font-medium text-forest">
            {tBook('nameLabel')}
            <input required minLength={2} maxLength={80} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={clsx(inputClass, 'mt-1.5')} />
          </label>
          <label className="block text-sm font-medium text-forest">
            {tBook('phoneLabel')}
            <input
              type="tel"
              required
              inputMode="tel"
              autoComplete="tel"
              placeholder="+995 5XX XX XX XX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              aria-describedby="tour-phone-hint"
              className={clsx(inputClass, 'mt-1.5')}
            />
            <span id="tour-phone-hint" className="mt-1 block text-xs font-normal text-forest/60">
              {tBook('phoneHint')}
            </span>
          </label>
          <label className="block text-sm font-medium text-forest">
            {tBook('emailLabel')}
            <input type="email" maxLength={120} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={clsx(inputClass, 'mt-1.5')} />
          </label>
          <label className="block text-sm font-medium text-forest">
            {tBook('notesLabel')}
            <textarea rows={3} maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} className={clsx(inputClass, 'mt-1.5')} />
          </label>
          <div aria-hidden className="absolute -left-[9999px] w-px h-px overflow-hidden">
            <label>
              Website
              <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </label>
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={status === 'submitting'}
            className="w-full rounded-full bg-gold text-ink py-3.5 font-semibold hover:bg-gold/90 disabled:opacity-60"
          >
            {status === 'submitting' ? t('submitting') : t('submit')}
          </button>
        </form>
      )}
    </div>
  );
}
