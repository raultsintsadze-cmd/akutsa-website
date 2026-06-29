'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  labels
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (details: BookingDetails) => void;
  status: 'idle' | 'sending' | 'success' | 'error';
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
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-forest/50 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed bottom-0 left-0 right-0 sm:top-1/2 sm:left-1/2 sm:bottom-auto sm:right-auto sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-1">
                <h2 className="font-serif text-2xl text-forest font-semibold">{labels.title}</h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="text-forest/50 hover:text-forest text-xl leading-none"
                >
                  &times;
                </button>
              </div>
              <p className="text-forest/60 text-sm mb-6">{labels.subtitle}</p>

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
                      className="w-full rounded-lg border border-forest/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold"
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
                        className="w-full rounded-lg border border-forest/15 px-3 py-2.5 text-sm focus:outline-none focus:border-gold"
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
                        className="w-full rounded-lg border border-forest/15 px-3 py-2.5 text-sm focus:outline-none focus:border-gold bg-white"
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
                      className="w-full rounded-lg border border-forest/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold"
                    />
                  </div>

                  {status === 'error' && (
                    <p className="text-red-600 text-sm">{labels.errorMessage}</p>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 rounded-full border border-forest/20 text-forest py-2.5 text-sm font-medium hover:bg-cream transition-colors"
                    >
                      {labels.backButton}
                    </button>
                    <button
                      type="submit"
                      disabled={!canSubmit || status === 'sending'}
                      className="flex-1 rounded-full bg-forest text-cream py-2.5 text-sm font-medium hover:bg-forest/90 transition-colors disabled:opacity-50"
                    >
                      {status === 'sending' ? labels.sending : labels.confirmButton}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
