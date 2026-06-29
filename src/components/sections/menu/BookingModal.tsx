'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CartLine } from './OrderSummaryPanel';

const TIME_SLOTS = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00'
];

const inputClasses =
  'w-full rounded-lg border border-forest/15 px-4 py-2.5 text-sm focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest/20 transition-colors';

export interface BookingDetails {
  name: string;
  date: string;
  time: string;
  note: string;
}

export default function BookingModal({
  open,
  onClose,
  onConfirm,
  status,
  lines,
  total,
  currency,
  totalLabel,
  labels
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (details: BookingDetails) => void;
  status: 'idle' | 'sending' | 'success' | 'error';
  lines: CartLine[];
  total: number;
  currency: string;
  totalLabel: string;
  labels: {
    title: string;
    subtitle: string;
    nameLabel: string;
    namePlaceholder: string;
    dateLabel: string;
    timeLabel: string;
    selectTime: string;
    noteLabel: string;
    notePlaceholder: string;
    backButton: string;
    confirmButton: string;
    sending: string;
    successMessage: string;
    errorMessage: string;
  };
}) {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const canSubmit = name.trim().length > 0 && date.length > 0 && time.length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onConfirm({ name: name.trim(), date, time, note: note.trim() });
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-forest/60"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative bg-white rounded-2xl border border-forest/15 shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-full bg-forest/10 flex items-center justify-center text-xl shrink-0">
                    🍽️
                  </span>
                  <h2 className="font-serif text-xl sm:text-2xl text-gold font-semibold">
                    {labels.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="text-forest/50 hover:text-forest text-xl leading-none"
                >
                  &times;
                </button>
              </div>
              <p className="text-forest/60 text-sm mt-2 mb-5">{labels.subtitle}</p>

              {lines.length > 0 && status !== 'success' && (
                <div className="bg-cream rounded-xl p-4 mb-5 border border-forest/10">
                  <ul className="space-y-1.5">
                    {lines.map((line) => (
                      <li
                        key={line.itemId}
                        className="flex justify-between text-sm text-forest/80"
                      >
                        <span>
                          {line.name} &times;{line.qty}
                        </span>
                        <span className="text-gold font-medium">
                          {line.price * line.qty} {currency}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-forest/15 mt-2 pt-2 flex items-center justify-between">
                    <span className="text-forest/70 text-sm font-medium">{totalLabel}</span>
                    <span className="text-gold font-semibold">
                      {total} {currency}
                    </span>
                  </div>
                </div>
              )}

              {status === 'success' ? (
                <p className="text-center text-forest font-medium py-6">{labels.successMessage}</p>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-forest mb-1">
                      {labels.nameLabel}
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={labels.namePlaceholder}
                      required
                      className={inputClasses}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-forest mb-1">
                        {labels.dateLabel}
                      </label>
                      <input
                        type="date"
                        value={date}
                        min={today}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        className={inputClasses}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-forest mb-1">
                        {labels.timeLabel}
                      </label>
                      <select
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        required
                        className={`${inputClasses} bg-white`}
                      >
                        <option value="" disabled>
                          {labels.selectTime}
                        </option>
                        {TIME_SLOTS.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-forest mb-1">
                      {labels.noteLabel}
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder={labels.notePlaceholder}
                      rows={3}
                      className={inputClasses}
                    />
                  </div>

                  {status === 'error' && (
                    <p className="text-red-600 text-sm">{labels.errorMessage}</p>
                  )}

                  <div className="space-y-2 pt-2">
                    <button
                      type="submit"
                      disabled={!canSubmit || status === 'sending'}
                      className="w-full flex items-center justify-center gap-2 rounded-full bg-forest text-cream py-3 text-sm font-medium hover:bg-forest/90 transition-colors disabled:opacity-50"
                    >
                      {status === 'sending' ? (
                        labels.sending
                      ) : (
                        <>
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="w-4 h-4"
                          >
                            <path
                              d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          {labels.confirmButton}
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full rounded-full border border-forest/20 text-forest py-2.5 text-sm font-medium hover:bg-cream transition-colors"
                    >
                      {labels.backButton}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
