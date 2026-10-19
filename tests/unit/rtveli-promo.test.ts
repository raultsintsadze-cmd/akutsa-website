import { describe, expect, it } from 'vitest';
import { isPromoActive, rtveliPrice } from '@/lib/rtveli-promo';

// Tbilisi is UTC+4, so 2026-10-24 23:59:59 local = 19:59:59Z.
describe('Rtveli promo window', () => {
  it('starts 19 Oct 00:00 Tbilisi time', () => {
    expect(isPromoActive(new Date('2026-10-18T19:59:59Z'))).toBe(false);
    expect(isPromoActive(new Date('2026-10-18T20:00:00Z'))).toBe(true);
  });
  it('ends 24 Oct 23:59:59 Tbilisi time', () => {
    expect(isPromoActive(new Date('2026-10-24T19:59:59Z'))).toBe(true);
    expect(isPromoActive(new Date('2026-10-24T20:00:00Z'))).toBe(false);
  });
});

describe('Rtveli price by date', () => {
  const during = new Date('2026-10-20T10:00:00Z');
  const after = new Date('2026-10-25T10:00:00Z');
  it('discounts only the promo date while active', () => {
    expect(rtveliPrice('with', '2026-10-24', during)).toBe(200);
    expect(rtveliPrice('without', '2026-10-24', during)).toBe(150);
    expect(rtveliPrice('with', '2026-10-25', during)).toBe(250);
    expect(rtveliPrice('without', null, during)).toBe(200);
  });
  it('returns normal prices after the promo ends', () => {
    expect(rtveliPrice('with', '2026-10-24', after)).toBe(250);
    expect(rtveliPrice('without', '2026-10-24', after)).toBe(200);
  });
});
