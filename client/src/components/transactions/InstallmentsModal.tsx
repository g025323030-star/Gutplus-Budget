import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CreditCard, X } from 'lucide-react';

interface InstallmentsModalProps {
  isOpen: boolean;
  initialCount: number | null;
  totalAmount: string;
  onClose: () => void;
  onConfirm: (count: number | null) => void;
}

export default function InstallmentsModal({
  isOpen,
  initialCount,
  totalAmount,
  onClose,
  onConfirm,
}: InstallmentsModalProps) {
  const [enabled, setEnabled] = useState<boolean>(initialCount !== null);
  const [count, setCount] = useState<number>(initialCount ?? 3);

  useEffect(() => {
    if (isOpen) {
      setEnabled(initialCount !== null);
      setCount(initialCount ?? 3);
    }
  }, [isOpen, initialCount]);

  const total = parseFloat(totalAmount);
  const perInstallment =
    enabled && count >= 2 && Number.isFinite(total) && total > 0
      ? (total / count).toFixed(2)
      : null;

  const handleConfirm = () => {
    if (!enabled) {
      onConfirm(null);
      return;
    }
    const safe = Math.max(2, Math.min(120, Math.round(count)));
    onConfirm(safe);
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
                <CreditCard
                  className="text-accent"
                  size={20}
                  strokeWidth={1.5}
                />
                <h2 className="heading-3">תשלומים</h2>
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
                <span className="body-text">פצל לתשלומים חודשיים</span>
              </label>

              {enabled && (
                <div>
                  <label className="label-text block mb-2">מספר תשלומים</label>
                  <input
                    type="number"
                    min={2}
                    max={120}
                    value={count}
                    onChange={(e) =>
                      setCount(Math.max(2, Math.min(120, Number(e.target.value))))
                    }
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-background/50 text-primary focus:outline-none focus:border-accent focus:bg-white transition-all text-right"
                  />
                  {perInstallment && (
                    <p className="body-text-sm text-slate-500 mt-2">
                      ייווצרו {count} שורות חודשיות של {perInstallment} ₪ כל
                      אחת, החל מתאריך ההוצאה.
                    </p>
                  )}
                </div>
              )}

              {!enabled && (
                <p className="body-text-sm text-slate-500">
                  ההוצאה תישמר כשורה אחת ללא פיצול.
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
