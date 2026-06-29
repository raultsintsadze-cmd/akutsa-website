export const locales = ['ka', 'en', 'ru'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  ka: 'ქართული',
  en: 'English',
  ru: 'Русский'
};
