import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Repeat, X } from 'lucide-react';
import { TransactionFrequency } from '@gutplus/shared';

export interface RecurringValue {
  recurringFrequency: TransactionFrequency;
  recurringEndDate: string | null;
}

interface RecurringModalProps {
  isOpen: boolean;
  initialValue: RecurringValue | null;
  startDate: string;
  onClose: () => void;
  onConfirm: (value: RecurringValue | null) => void;
}

export default function RecurringModal({
  isOpen,
  initialValue,
  startDate,
  onClose,
  onConfirm,
}: RecurringModalProps) {
  const [enabled, setEnabled] = useState<boolean>(initialValue !== null);
  const [isBiMonthly, setIsBiMonthly] = useState<boolean>(
    initialValue?.recurringFrequency === TransactionFrequency.BI_MONTHLY,
  );
  const [endDate, setEndDate] = useState<string>(
    initialValue?.recurringEndDate ?? '',
  );

  useEffect(() => {
    if (isOpen) {
      setEnabled(initialValue !== null);
      setIsBiMonthly(
        initialValue?.recurringFrequency === TransactionFrequency.BI_MONTHLY,
      );
      setEndDate(initialValue?.recurringEndDate ?? '');
    }
  }, [isOpen, initialValue]);

  const handleConfirm = () => {
    if (!enabled) {
      onConfirm(null);
      return;
    }
    onConfirm({
      recurringFrequency: isBiMonthly
        ? TransactionFrequency.BI_MONTHLY
        : TransactionFrequency.MONTHLY,
      recurringEndDate: endDate ? endDate : null,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-primary/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
          dir="rtl"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Repeat className="text-accent" size={20} strokeWidth={1.5} />
                <h2 className="heading-3">עסקה קבועה</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="סגור"
                className="w-9 h-9 rounded-lg text-slate-400 hover:text-primary hover:bg-background transition-all flex items-center justify-center"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-accent focus:ring-accent"
                />
                <span className="body-text">חזור על ההוצאה אוטומטית</span>
              </label>

              {enabled && (
                <>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isBiMonthly}
                      onChange={(e) => setIsBiMonthly(e.target.checked)}
                      className="w-5 h-5 rounded border-slate-300 text-accent focus:ring-accent"
                    />
                    <span className="body-text">עסקה דו-חודשית (פעם בחודשיים)</span>
                  </label>

                  <div>
                    <label className="label-text block mb-2">
                      תאריך אחרון לחזרה (אופציונלי)
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate || undefined}
                      onChange={(e) => setEndDate(e.target.value)}
                      aria-label="תאריך אחרון לחזרה"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-background/50 text-primary focus:outline-none focus:border-accent focus:bg-white transition-all text-right"
                    />
                    <p className="body-text-sm text-slate-500 mt-2">
                      {isBiMonthly
                        ? 'ההוצאה תיווצר אוטומטית פעם בחודשיים.'
                        : 'ההוצאה תיווצר אוטומטית בכל חודש.'}
                      {endDate ? '' : ' ללא תאריך סיום — עד שתבוטל.'}
                    </p>
                  </div>
                </>
              )}

              {!enabled && (
                <p className="body-text-sm text-slate-500">
                  ההוצאה תישמר כשורה חד-פעמית ללא חזרה.
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-primary hover:bg-background transition-all label-text"
                >
                  ביטול
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="flex-1 px-4 py-3 rounded-xl bg-accent text-white hover:bg-accent/90 transition-all label-text"
                >
                  אישור
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
