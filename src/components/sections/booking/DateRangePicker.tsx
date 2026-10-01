'use client';

import { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { addDays, nightsBetween, type DateStr } from '@/lib/booking/dates';

export interface DateRangePickerLabels {
  prevMonth: string;
  nextMonth: string;
  booked: string;
  available: string;
  selected: string;
  checkIn: string;
  checkOut: string;
  selectCheckIn: string;
  selectCheckOut: string;
  legendBooked: string;
  legendSelected: string;
}

const monthOf = (date: DateStr) => date.slice(0, 7);

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

// Weeks of a month, Monday first; null pads the first and last week.
function monthGrid(month: string): (DateStr | null)[][] {
  const [y, m] = month.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = (first.getUTCDay() + 6) % 7;
  const cells: (DateStr | null)[] = [
    ...Array<null>(lead).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`)
  ];
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));
}

// Range picker for stays. `blocked` holds nights that are taken; a blocked night's date can
// still be chosen as a check-out day (the previous guest's check-out / next guest's check-in).
export default function DateRangePicker({
  locale,
  today,
  maxDate,
  maxNights,
  blocked,
  checkIn,
  checkOut,
  onChange,
  labels
}: {
  locale: string;
  today: DateStr;
  maxDate: DateStr;
  maxNights: number;
  blocked: ReadonlySet<DateStr>;
  checkIn: DateStr | null;
  checkOut: DateStr | null;
  onChange: (checkIn: DateStr | null, checkOut: DateStr | null) => void;
  labels: DateRangePickerLabels;
}) {
  const [viewMonth, setViewMonth] = useState(monthOf(checkIn ?? today));
  const intlLocale = locale === 'ka' ? 'ka-GE' : locale === 'ru' ? 'ru-RU' : 'en-GB';

  const formats = useMemo(
    () => ({
      month: new Intl.DateTimeFormat(intlLocale, { month: 'long', year: 'numeric', timeZone: 'UTC' }),
      day: new Intl.DateTimeFormat(intlLocale, { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long', timeZone: 'UTC' }),
      weekday: new Intl.DateTimeFormat(intlLocale, { weekday: 'short', timeZone: 'UTC' })
    }),
    [intlLocale]
  );
  // 2024-01-01 was a Monday.
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    formats.weekday.format(new Date(Date.UTC(2024, 0, 1 + i)))
  );

  const isFreeNight = (d: DateStr) => d >= today && d < maxDate && !blocked.has(d);
  const choosingCheckOut = checkIn !== null && checkOut === null;

  // Latest possible check-out for the chosen check-in: the first blocked night after it.
  const maxCheckOut = useMemo(() => {
    if (!checkIn) return null;
    const limit = addDays(checkIn, maxNights);
    let day = addDays(checkIn, 1);
    while (day < limit && day < maxDate && !blocked.has(day)) day = addDays(day, 1);
    return day;
  }, [checkIn, blocked, maxDate, maxNights]);

  const canBeCheckOut = (d: DateStr) =>
    choosingCheckOut && maxCheckOut !== null && d > checkIn! && d <= maxCheckOut;

  function select(d: DateStr) {
    if (canBeCheckOut(d)) onChange(checkIn, d);
    else if (isFreeNight(d)) onChange(d, null);
  }

  const canGoBack = viewMonth > monthOf(today);
  const canGoForward = viewMonth < monthOf(maxDate);

  return (
    <div>
      <p aria-live="polite" className="text-sm text-forest/70 mb-3">
        {choosingCheckOut ? labels.selectCheckOut : checkIn && checkOut ? ' ' : labels.selectCheckIn}
      </p>

      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={() => setViewMonth((m) => shiftMonth(m, -1))}
          disabled={!canGoBack}
          aria-label={labels.prevMonth}
          className="w-11 h-11 rounded-full flex items-center justify-center text-forest hover:bg-forest/10 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <span aria-hidden>‹</span>
        </button>
        <div className="font-serif text-lg text-forest font-semibold capitalize" aria-live="polite">
          {formats.month.format(new Date(`${viewMonth}-01T00:00:00Z`))}
        </div>
        <button
          type="button"
          onClick={() => setViewMonth((m) => shiftMonth(m, 1))}
          disabled={!canGoForward}
          aria-label={labels.nextMonth}
          className="w-11 h-11 rounded-full flex items-center justify-center text-forest hover:bg-forest/10 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <span aria-hidden>›</span>
        </button>
      </div>

      <table className="w-full table-fixed border-separate border-spacing-y-1" role="grid">
        <thead>
          <tr>
            {weekdays.map((w) => (
              <th key={w} scope="col" className="text-xs font-medium text-forest/50 pb-1">
                {w}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {monthGrid(viewMonth).map((week, i) => (
            <tr key={i}>
              {week.map((d, j) => {
                if (!d) return <td key={j} />;
                const isStart = d === checkIn;
                const isEnd = d === checkOut;
                const inRange = checkIn !== null && checkOut !== null && d > checkIn && d < checkOut;
                const enabled = canBeCheckOut(d) || isFreeNight(d);
                const booked = d >= today && blocked.has(d);
                const state = isStart
                  ? `${labels.selected}, ${labels.checkIn}`
                  : isEnd
                    ? `${labels.selected}, ${labels.checkOut}`
                    : enabled
                      ? labels.available
                      : booked
                        ? labels.booked
                        : '';
                return (
                  <td key={j} className="p-0 text-center">
                    <button
                      type="button"
                      data-date={d}
                      disabled={!enabled}
                      aria-pressed={isStart || isEnd}
                      aria-label={`${formats.day.format(new Date(`${d}T00:00:00Z`))}${state ? `, ${state}` : ''}`}
                      onClick={() => select(d)}
                      className={clsx(
                        'w-full h-11 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold',
                        isStart || isEnd
                          ? 'bg-forest text-cream font-semibold rounded-full'
                          : inRange
                            ? 'bg-gold/25 text-forest'
                            : enabled
                              ? 'text-forest hover:bg-gold/20 rounded-full'
                              : booked
                                ? 'text-forest/35 line-through bg-forest/5'
                                : 'text-forest/25',
                        d === today && !isStart && !isEnd && 'underline underline-offset-4'
                      )}
                    >
                      {Number(d.slice(8))}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-forest/60">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-4 rounded bg-forest/5 border border-forest/10" aria-hidden />
          {labels.legendBooked}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-4 rounded-full bg-forest" aria-hidden />
          {labels.legendSelected}
        </span>
        {checkIn && checkOut && (
          <span className="ml-auto text-forest font-medium">
            {nightsBetween(checkIn, checkOut)} 🌙
          </span>
        )}
      </div>
    </div>
  );
}
