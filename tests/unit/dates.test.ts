import { describe, expect, it } from 'vitest';
import {
  addDays,
  blockedNights,
  icalEventRange,
  isDateStr,
  isPendingActive,
  isRangeFree,
  nearestFreeRanges,
  nightsBetween,
  rangesOverlap,
  todayInTbilisi
} from '@/lib/booking/dates';
import { parseIcal } from '@/lib/booking/ical';

describe('date helpers', () => {
  it('validates YYYY-MM-DD strings', () => {
    expect(isDateStr('2026-10-15')).toBe(true);
    expect(isDateStr('2026-02-30')).toBe(false);
    expect(isDateStr('15.10.2026')).toBe(false);
    expect(isDateStr(undefined)).toBe(false);
  });

  it('adds days across month and year ends', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-03-01', -1)).toBe('2028-02-29');
  });

  it('counts nights', () => {
    expect(nightsBetween('2026-10-15', '2026-10-17')).toBe(2);
    expect(nightsBetween('2026-10-15', '2026-10-15')).toBe(0);
  });

  it('uses the Tbilisi day (UTC+4)', () => {
    expect(todayInTbilisi(new Date('2026-10-14T19:59:00Z'))).toBe('2026-10-14');
    expect(todayInTbilisi(new Date('2026-10-14T20:00:00Z'))).toBe('2026-10-15');
  });
});

describe('overlap logic', () => {
  const booked = { start: '2026-10-15', end: '2026-10-17' }; // nights of the 15th and 16th

  it('detects overlapping stays', () => {
    expect(rangesOverlap(booked, { start: '2026-10-16', end: '2026-10-18' })).toBe(true);
    expect(rangesOverlap(booked, { start: '2026-10-14', end: '2026-10-16' })).toBe(true);
    expect(rangesOverlap(booked, { start: '2026-10-10', end: '2026-10-20' })).toBe(true);
    expect(rangesOverlap(booked, { start: '2026-10-15', end: '2026-10-16' })).toBe(true);
  });

  it('allows same-day turnover: arriving on another guest’s check-out day', () => {
    expect(rangesOverlap(booked, { start: '2026-10-17', end: '2026-10-19' })).toBe(false);
    expect(isRangeFree([booked], '2026-10-17', '2026-10-19')).toBe(true);
  });

  it('allows same-day turnover: leaving on another guest’s check-in day', () => {
    expect(rangesOverlap(booked, { start: '2026-10-13', end: '2026-10-15' })).toBe(false);
    expect(isRangeFree([booked], '2026-10-13', '2026-10-15')).toBe(true);
  });

  it('lists blocked nights without the check-out day', () => {
    expect(blockedNights([booked], '2026-10-01', '2026-11-01')).toEqual(['2026-10-15', '2026-10-16']);
  });

  it('clips blocked nights to the requested window and de-duplicates', () => {
    const ranges = [booked, { start: '2026-10-16', end: '2026-10-19' }];
    expect(blockedNights(ranges, '2026-10-16', '2026-10-18')).toEqual(['2026-10-16', '2026-10-17']);
  });

  it('suggests the nearest free ranges, never in the past', () => {
    const busy = [{ start: '2026-10-14', end: '2026-10-18' }];
    const found = nearestFreeRanges(busy, '2026-10-15', 2, '2026-10-13');
    // 13th–15th overlaps (night of the 14th), earlier is in the past; next free start is the 18th.
    expect(found[0]).toEqual({ start: '2026-10-18', end: '2026-10-20' });
    expect(found.every((r) => r.start >= '2026-10-13')).toBe(true);
    expect(found.every((r) => isRangeFree(busy, r.start, r.end))).toBe(true);
  });
});

describe('pending expiry', () => {
  const now = new Date('2026-10-15T12:00:00Z');

  it('holds dates for a pending request younger than 24 hours', () => {
    expect(isPendingActive('2026-10-15T11:00:00Z', now)).toBe(true);
    expect(isPendingActive('2026-10-14T12:00:01Z', now)).toBe(true);
  });

  it('releases dates once the request is 24 hours old', () => {
    expect(isPendingActive('2026-10-14T12:00:00Z', now)).toBe(false);
    expect(isPendingActive('2026-10-10T09:00:00Z', now)).toBe(false);
  });

  it('treats an unreadable timestamp as expired', () => {
    expect(isPendingActive('not-a-date', now)).toBe(false);
  });
});

describe('iCal events', () => {
  it('treats DTEND as exclusive', () => {
    expect(icalEventRange({ year: 2026, month: 10, day: 15 }, { year: 2026, month: 10, day: 17 })).toEqual({
      start: '2026-10-15',
      end: '2026-10-17'
    });
  });

  it('blocks one night when DTEND is missing or not after DTSTART', () => {
    expect(icalEventRange({ year: 2026, month: 10, day: 15 })).toEqual({ start: '2026-10-15', end: '2026-10-16' });
    expect(icalEventRange({ year: 2026, month: 10, day: 15 }, { year: 2026, month: 10, day: 15 })).toEqual({
      start: '2026-10-15',
      end: '2026-10-16'
    });
  });

  it('parses a Booking.com / Airbnb style feed', () => {
    const feed = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Test//EN',
      'BEGIN:VEVENT',
      'UID:1@test',
      'DTSTART;VALUE=DATE:20261015',
      'DTEND;VALUE=DATE:20261017',
      'SUMMARY:CLOSED - Not available',
      'END:VEVENT',
      'BEGIN:VEVENT',
      'UID:2@test',
      'DTSTART;VALUE=DATE:20261101',
      'DTEND;VALUE=DATE:20261103',
      'STATUS:CANCELLED',
      'SUMMARY:Cancelled',
      'END:VEVENT',
      'BEGIN:VEVENT',
      'UID:3@test',
      'DTSTART:20261120T140000Z',
      'DTEND:20261122T100000Z',
      'SUMMARY:Reserved',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const ranges = parseIcal(feed);
    expect(ranges).toEqual([
      { start: '2026-10-15', end: '2026-10-17' },
      { start: '2026-11-20', end: '2026-11-22' }
    ]);
    // The check-out day of the first event is free again.
    expect(isRangeFree(ranges, '2026-10-17', '2026-10-18')).toBe(true);
    expect(isRangeFree(ranges, '2026-10-16', '2026-10-18')).toBe(false);
  });
});
