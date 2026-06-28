'use client';

import { useTranslations } from 'next-intl';

export default function ContactForm() {
  const t = useTranslations('contact');

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="bg-white rounded-2xl p-6 shadow-sm space-y-4"
    >
      <div>
        <label className="block text-sm font-medium text-forest mb-1">
          {t('formName')}
        </label>
        <input
          type="text"
          required
          className="w-full rounded-lg border border-forest/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-forest mb-1">
          {t('formEmail')}
        </label>
        <input
          type="email"
          required
          className="w-full rounded-lg border border-forest/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-forest mb-1">
          {t('formMessage')}
        </label>
        <textarea
          required
          rows={4}
          className="w-full rounded-lg border border-forest/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-full bg-forest text-cream py-3 font-medium hover:bg-forest/90 transition-colors"
      >
        {t('formSubmit')}
      </button>
      <p className="text-xs text-forest/60">{t('formNote')}</p>
    </form>
  );
}
