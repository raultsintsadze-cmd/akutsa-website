'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { MENU_CATEGORIES } from '@/lib/menuData';
import type { Locale } from '@/i18n/config';
import CategoryFilterBar from './CategoryFilterBar';
import CategorySection from './CategorySection';
import OrderSummaryPanel, { type CartLine } from './OrderSummaryPanel';
import BookingModal, { type BookingDetails } from './BookingModal';
import UtensilsIcon from './UtensilsIcon';

export default function MenuExperience() {
  const locale = useLocale() as Locale;
  const t = useTranslations('menu');

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [activeCategory, setActiveCategory] = useState(MENU_CATEGORIES[0].id);
  const [modalOpen, setModalOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  function registerRef(id: string, el: HTMLDivElement | null) {
    sectionRefs.current[id] = el;
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id.replace('category-', '');
            setActiveCategory(id);
          }
        });
      },
      { rootMargin: '-140px 0px -60% 0px' }
    );

    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  function handleSelectCategory(id: string) {
    setActiveCategory(id);
    const el = sectionRefs.current[id];
    if (el) {
      const offset = 140;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }

  function changeQty(itemId: string, delta: number) {
    setQuantities((prev) => ({ ...prev, [itemId]: Math.max(0, (prev[itemId] ?? 0) + delta) }));
  }

  const lines: CartLine[] = Object.entries(quantities)
    .filter(([, qty]) => qty > 0)
    .map(([itemId, qty]) => {
      const item = MENU_CATEGORIES.flatMap((c) => c.items).find((i) => i.id === itemId)!;
      return { itemId, qty, name: item.name[locale], price: item.price };
    });

  const total = lines.reduce((sum, l) => sum + l.price * l.qty, 0);

  async function handleConfirm(details: BookingDetails) {
    setStatus('sending');
    try {
      const res = await fetch('/api/send-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lines: lines.map((l) => ({ itemId: l.itemId, qty: l.qty })),
          name: details.name,
          date: details.date,
          time: details.time,
          note: details.note
        })
      });

      if (!res.ok) throw new Error('failed');

      setStatus('success');
      setQuantities({});
      setTimeout(() => {
        setModalOpen(false);
        setStatus('idle');
      }, 2500);
    } catch {
      setStatus('error');
    }
  }

  return (
    <div>
      <div className="flex justify-center mb-2">
        <UtensilsIcon className="w-8 h-8 text-gold" />
      </div>

      <CategoryFilterBar
        categories={MENU_CATEGORIES}
        locale={locale}
        activeId={activeCategory}
        onSelect={handleSelectCategory}
      />

      <div className="space-y-16 pb-32 lg:pb-16">
        {MENU_CATEGORIES.map((category) => (
          <CategorySection
            key={category.id}
            category={category}
            locale={locale}
            currency={t('currency')}
            quantities={quantities}
            onChangeQty={changeQty}
            registerRef={registerRef}
          />
        ))}
      </div>

      <OrderSummaryPanel
        lines={lines}
        total={total}
        currency={t('currency')}
        totalLabel={t('totalLabel')}
        emptyState={t('emptyState')}
        proceedLabel={t('proceedButton')}
        onProceed={() => setModalOpen(true)}
      />

      <BookingModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setStatus('idle');
        }}
        onConfirm={handleConfirm}
        status={status}
        labels={{
          title: t('bookingTitle'),
          subtitle: t('bookingSubtitle'),
          nameLabel: t('nameLabel'),
          namePlaceholder: t('namePlaceholder'),
          dateLabel: t('dateLabel'),
          timeLabel: t('timeLabel'),
          selectTime: t('selectTime'),
          noteLabel: t('noteLabel'),
          notePlaceholder: t('notePlaceholder'),
          backButton: t('backButton'),
          confirmButton: t('confirmButton'),
          sending: t('sending'),
          successMessage: t('successMessage'),
          errorMessage: t('errorMessage')
        }}
      />
    </div>
  );
}
