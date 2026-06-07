import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CreditCard, Repeat, X } from 'lucide-react';
import type { DraftRowMode } from './types';

export type AdvancedModeResult =
  | { mode: 'none' }
  | { mode: 'installments'; installmentsTotal: number }
  | { mode: 'recurring'; endDate: string | null; isBiMonthly: boolean };

interface AdvancedModeModalProps {
  isOpen: boolean;
  initialMode: DraftRowMode;
  initialInstallmentsTotal: number | null;
  initialEndDate: string | null;
  initialIsBiMonthly: boolean;
  totalAmount: string;
  onClose: () => void;
  onConfirm: (result: AdvancedModeResult) => void;
  /** הצגת לשונית הפיצול לתשלומים. ברירת מחדל true (הוצאות). */
  showInstallments?: boolean;
  /** הצגת אפשרות עסקה דו-חודשית בלשונית הקבועה. ברירת מחדל true (הוצאות). */
  showBiMonthly?: boolean;
}

type Tab = 'installments' | 'recurring';

export default function AdvancedModeModal({
  isOpen,
  initialMode,
  initialInstallmentsTotal,
  initialEndDate,
  initialIsBiMonthly,
  totalAmount,
  onClose,
  onConfirm,
  showInstallments = true,
  showBiMonthly = true,
}: AdvancedModeModalProps) {
  const initialTab: Tab =
    !showInstallments || initialMode === 'recurring'
      ? 'recurring'
      : 'installments';

  const [tab, setTab] = useState<Tab>(initialTab);

  const [installmentsEnabled, setInstallmentsEnabled] = useState<boolean>(
    initialMode === 'installments' && initialInstallmentsTotal !== null,
  );
  const [installmentsCount, setInstallmentsCount] = useState<number>(
    initialInstallmentsTotal ?? 3,
  );

  const [hasEndDate, setHasEndDate] = useState<boolean>(
    initialMode === 'recurring' && initialEndDate !== null,
  );
  const [endDate, setEndDate] = useState<string>(initialEndDate ?? '');
  const [isBiMonthly, setIsBiMonthly] = useState<boolean>(initialIsBiMonthly);

  useEffect(() => {
    if (!isOpen) return;
    setTab(
      !showInstallments || initialMode === 'recurring'
        ? 'recurring'
        : 'installments',
    );
    setInstallmentsEnabled(
      initialMode === 'installments' && initialInstallmentsTotal !== null,
    );
    setInstallmentsCount(initialInstallmentsTotal ?? 3);
    setHasEndDate(initialMode === 'recurring' && initialEndDate !== null);
    setEndDate(initialEndDate ?? '');
    setIsBiMonthly(showBiMonthly ? initialIsBiMonthly : false);
  }, [
    isOpen,
    initialMode,
    initialInstallmentsTotal,
    initialEndDate,
    initialIsBiMonthly,
    showInstallments,
    showBiMonthly,
  ]);

  const total = parseFloat(totalAmount);
  const perInstallment =
    installmentsEnabled &&
    installmentsCount >= 2 &&
    Number.isFinite(total) &&
    total > 0
      ? (total / installmentsCount).toFixed(2)
      : null;

  const handleClose = () => {
    onConfirm({ mode: 'none' });
    onClose();
  };

  const handleConfirm = () => {
    if (tab === 'installments') {
      if (!installmentsEnabled) {
        onConfirm({ mode: 'none' });
        return;
      }
      const safe = Math.max(2, Math.min(120, Math.round(installmentsCount)));
      onConfirm({ mode: 'installments', installmentsTotal: safe });
      return;
    }

    onConfirm({
      mode: 'recurring',
      endDate: hasEndDate && endDate ? endDate : null,
      isBiMonthly,
    });
  };

  const tabButtonClass = (active: boolean) =>
    `flex-1 px-4 py-2 rounded-lg label-text transition-all duration-200 flex items-center justify-center gap-2 ${
      active
        ? 'bg-accent text-white shadow-sm'
        : 'text-slate-500 hover:text-primary'
    }`;

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
              <h2 className="heading-3">מצב מתקדם</h2>
              <button
                type="button"
                onClick={handleClose}
                aria-label="סגור והפוך לעסקה רגילה"
                title="סגור והפוך לעסקה רגילה"
                className="w-9 h-9 rounded-lg text-slate-400 hover:text-primary hover:bg-background transition-all flex items-center justify-center"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            {showInstallments && (
              <div className="flex items-center gap-1 bg-background/60 p-1 rounded-xl mb-5">
                <button
                  type="button"
                  onClick={() => setTab('installments')}
                  className={tabButtonClass(tab === 'installments')}
                >
                  <CreditCard size={18} strokeWidth={1.5} />
                  תשלומים
                </button>
                <button
                  type="button"
                  onClick={() => setTab('recurring')}
                  className={tabButtonClass(tab === 'recurring')}
                >
                  <Repeat size={18} strokeWidth={1.5} />
                  עסקה קבועה
                </button>
              </div>
            )}

            {tab === 'installments' ? (
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={installmentsEnabled}
                    onChange={(e) => setInstallmentsEnabled(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-accent focus:ring-accent"
                  />
                  <span className="body-text">פצל לתשלומים חודשיים</span>
                </label>

                {installmentsEnabled && (
                  <div>
                    <label className="label-text block mb-2">
                      מספר תשלומים
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={120}
                      value={installmentsCount}
                      onChange={(e) =>
                        setInstallmentsCount(
                          Math.max(2, Math.min(120, Number(e.target.value))),
                        )
                      }
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-background/50 text-primary focus:outline-none focus:border-accent focus:bg-white transition-all text-right"
                    />
                    {perInstallment && (
                      <p className="body-text-sm text-slate-500 mt-2">
                        ייווצרו {installmentsCount} שורות חודשיות של{' '}
                        {perInstallment} ₪ כל אחת, החל מתאריך ההוצאה.
                      </p>
                    )}
                  </div>
                )}

                {!installmentsEnabled && (
                  <p className="body-text-sm text-slate-500">
                    ההוצאה תישמר כשורה אחת ללא פיצול.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="body-text-sm text-slate-500">
                  תיווצר עסקה חוזרת המופיעה אוטומטית בכל חודש.
                </p>

                {showBiMonthly && (
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isBiMonthly}
                      onChange={(e) => setIsBiMonthly(e.target.checked)}
                      className="w-5 h-5 rounded border-slate-300 text-accent focus:ring-accent"
                    />
                    <span className="body-text">עסקה דו-חודשית</span>
                  </label>
                )}

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasEndDate}
                    onChange={(e) => setHasEndDate(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-accent focus:ring-accent"
                  />
                  <span className="body-text">קבע תאריך סיום</span>
                </label>

                {hasEndDate && (
                  <div>
                    <label className="label-text block mb-2">
                      תאריך אחרון לחזרה
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-background/50 text-primary focus:outline-none focus:border-accent focus:bg-white transition-all text-right"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-5">
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
