'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { TELEGRAM_URL, WHATSAPP_URL } from '@/lib/constants';

const inputClass =
  'mt-1.5 w-full rounded-lg border border-forest/20 bg-white px-3 py-3 text-base text-forest focus:outline-none focus:border-gold';

// Dates + group size, sent as a prefilled WhatsApp message (Telegram opens the chat).
export default function RetreatContact() {
  const t = useTranslations('yoga');
  const [dates, setDates] = useState('');
  const [group, setGroup] = useState('');

  const text = [
    t('message'),
    dates.trim() && `${t('datesLabel')}: ${dates.trim()}`,
    group.trim() && `${t('groupLabel')}: ${group.trim()}`
  ]
    .filter(Boolean)
    .join('\n');
  const btn = 'flex items-center justify-center min-h-12 rounded-pill text-white font-semibold';

  return (
    <div className="max-w-xl mx-auto rounded-card bg-white shadow-sm p-6 md:p-8">
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block text-sm font-medium text-forest">
          {t('datesLabel')}
          <input value={dates} onChange={(e) => setDates(e.target.value)} maxLength={80} placeholder={t('datesPlaceholder')} className={inputClass} />
        </label>
        <label className="block text-sm font-medium text-forest">
          {t('groupLabel')}
          <input value={group} onChange={(e) => setGroup(e.target.value)} maxLength={40} placeholder={t('groupPlaceholder')} className={inputClass} />
        </label>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <a href={`${WHATSAPP_URL}?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer" className={`${btn} bg-[#075E54]`}>
          WhatsApp
        </a>
        <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className={`${btn} bg-[#1A6FA0]`}>
          Telegram
        </a>
      </div>
    </div>
  );
}
