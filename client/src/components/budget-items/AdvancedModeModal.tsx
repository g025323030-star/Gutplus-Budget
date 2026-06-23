// import { useEffect, useState } from 'react';
// import { AnimatePresence, motion } from 'framer-motion';
// import { Bell,CreditCard, Repeat, X } from 'lucide-react';
// import type { DraftRowMode } from './types';
// import { ICON_STROKE } from '../../constants/ui';

// export type AdvancedModeResult =
//   | { mode: 'none' }
//   | { mode: 'installments'; installmentsTotal: number }
//   | { mode: 'recurring'; endDate: string | null; isBiMonthly: boolean };

// interface AdvancedModeModalProps {
//   isOpen: boolean;
//   initialMode: DraftRowMode;
//   initialInstallmentsTotal: number | null;
//   initialEndDate: string | null;
//   initialIsBiMonthly: boolean;
//   totalAmount: string;
//   onClose: () => void;
//   onConfirm: (result: AdvancedModeResult) => void;
//   /** הצגת לשונית הפיצול לתשלומים. ברירת מחדל true (הוצאות). */
//   showInstallments?: boolean;
//   /** הצגת אפשרות עסקה דו-חודשית בלשונית הקבועה. ברירת מחדל true (הוצאות). */
//   showBiMonthly?: boolean;
// }


// type Tab = 'installments' | 'recurring';

// export default function AdvancedModeModal({
//   isOpen,
//   initialMode,
//   initialInstallmentsTotal,
//   initialEndDate,
//   initialIsBiMonthly,
//   totalAmount,
//   onClose,
//   onConfirm,
//   showInstallments = true,
//   showBiMonthly = true,
// }: AdvancedModeModalProps) {
//   const initialTab: Tab =
//     !showInstallments || initialMode === 'recurring'
//       ? 'recurring'
//       : 'installments';

//   const [tab, setTab] = useState<Tab>(initialTab);

//   const [installmentsEnabled, setInstallmentsEnabled] = useState<boolean>(
//     initialMode === 'installments' && initialInstallmentsTotal !== null,
//   );
//   const [installmentsCount, setInstallmentsCount] = useState<number>(
//     initialInstallmentsTotal ?? 3,
//   );

//   const [hasEndDate, setHasEndDate] = useState<boolean>(
//     initialMode === 'recurring' && initialEndDate !== null,
//   );
//   const [endDate, setEndDate] = useState<string>(initialEndDate ?? '');
//   const [isBiMonthly, setIsBiMonthly] = useState<boolean>(initialIsBiMonthly);

//   useEffect(() => {
//     if (!isOpen) return;
//     setTab(
//       !showInstallments || initialMode === 'recurring'
//         ? 'recurring'
//         : 'installments',
//     );
//     setInstallmentsEnabled(
//       initialMode === 'installments' && initialInstallmentsTotal !== null,
//     );
//     setInstallmentsCount(initialInstallmentsTotal ?? 3);
//     setHasEndDate(initialMode === 'recurring' && initialEndDate !== null);
//     setEndDate(initialEndDate ?? '');
//     setIsBiMonthly(showBiMonthly ? initialIsBiMonthly : false);
//   }, [
//     isOpen,
//     initialMode,
//     initialInstallmentsTotal,
//     initialEndDate,
//     initialIsBiMonthly,
//     showInstallments,
//     showBiMonthly,
//   ]);

//   const total = parseFloat(totalAmount);
//   const perInstallment =
//     installmentsEnabled &&
//     installmentsCount >= 2 &&
//     Number.isFinite(total) &&
//     total > 0
//       ? (total / installmentsCount).toFixed(2)
//       : null;

//   const handleClose = () => {
//     onConfirm({ mode: 'none' });
//     onClose();
//   };

//   const handleConfirm = () => {
//     if (tab === 'installments') {
//       if (!installmentsEnabled) {
//         onConfirm({ mode: 'none' });
//         return;
//       }
//       const safe = Math.max(2, Math.min(120, Math.round(installmentsCount)));
//       onConfirm({ mode: 'installments', installmentsTotal: safe });
//       return;
//     }

//     onConfirm({
//       mode: 'recurring',
//       endDate: hasEndDate && endDate ? endDate : null,
//       isBiMonthly,
//     });
//   };

//   const tabButtonClass = (active: boolean) =>
//     `flex-1 px-4 py-2 rounded-lg label-text transition-all duration-200 flex items-center justify-center gap-2 ${
//       active
//         ? 'bg-accent text-white shadow-sm'
//         : 'text-slate-500 hover:text-primary'
//     }`;

//   return (
//     <AnimatePresence>
//       {isOpen && (
//         <motion.div
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           exit={{ opacity: 0 }}
//           transition={{ duration: 0.2 }}
//           className="fixed inset-0 bg-primary/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
//           onClick={onClose}
//           dir="rtl"
//         >
//           <motion.div
//             initial={{ scale: 0.95, opacity: 0 }}
//             animate={{ scale: 1, opacity: 1 }}
//             exit={{ scale: 0.95, opacity: 0 }}
//             transition={{ duration: 0.2 }}
//             onClick={(e) => e.stopPropagation()}
//             className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
//           >
//             <div className="flex items-center justify-between mb-4">
//               <h2 className="heading-3">מצב מתקדם</h2>
//               <button
//                 type="button"
//                 onClick={handleClose}
//                 aria-label="סגור והפוך לתחום רגיל"
//                 title="סגור והפוך לתחום רגיל"
//                 className="w-9 h-9 rounded-lg text-slate-400 hover:text-primary hover:bg-background transition-all flex items-center justify-center"
//               >
//                 <X className="w-5 h-5" strokeWidth={1.5} />
//               </button>
//             </div>

//             {showInstallments && (
//               <div className="flex items-center gap-1 bg-background/60 p-1 rounded-xl mb-5">
//                 <button
//                   type="button"
//                   onClick={() => setTab('installments')}
//                   className={tabButtonClass(tab === 'installments')}
//                 >
//                   <CreditCard size={18} strokeWidth={1.5} />
//                   תשלומים
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => setTab('recurring')}
//                   className={tabButtonClass(tab === 'recurring')}
//                 >
//                   <Repeat size={18} strokeWidth={1.5} />
//                   הוצאה מחזורית
//                 </button>
//               </div>
//             )}

//             {tab === 'installments' ? (
//               <div className="space-y-4">
//                 <label className="flex items-center gap-3 cursor-pointer">
//                   <input
//                     type="checkbox"
//                     checked={installmentsEnabled}
//                     onChange={(e) => setInstallmentsEnabled(e.target.checked)}
//                     className="w-5 h-5 rounded border-slate-300 text-accent focus:ring-accent"
//                   />
//                   <span className="body-text">פצל לתשלומים חודשיים</span>
//                 </label>

//                 {installmentsEnabled && (
//                   <div>
//                     <label className="label-text block mb-2">
//                       מספר תשלומים
//                     </label>
//                     <input
//                       type="number"
//                       min={2}
//                       max={120}
//                       value={installmentsCount}
//                       onChange={(e) =>
//                         setInstallmentsCount(
//                           Math.max(2, Math.min(120, Number(e.target.value))),
//                         )
//                       }
//                       className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-background/50 text-primary focus:outline-none focus:border-accent focus:bg-white transition-all text-right"
//                     />
//                     {perInstallment && (
//                       <p className="body-text-sm text-slate-500 mt-2">
//                         ייווצרו {installmentsCount} שורות חודשיות של{' '}
//                         {perInstallment} ₪ כל אחת, החל מתאריך ההוצאה.
//                       </p>
//                     )}
//                   </div>
//                 )}

//                 {!installmentsEnabled && (
//                   <p className="body-text-sm text-slate-500">
//                     ההוצאה תישמר כשורה אחת ללא פיצול.
//                   </p>
//                 )}
//               </div>
//             ) : (
//               <div className="space-y-4">
//                 <p className="body-text-sm text-slate-500">
//                   תחום שיחזור אוטומטית בכל חודש.
//                 </p>

//                 {showBiMonthly && (
//                   <label className="flex items-center gap-3 cursor-pointer">
//                     <input
//                       type="checkbox"
//                       checked={isBiMonthly}
//                       onChange={(e) => setIsBiMonthly(e.target.checked)}
//                       className="w-5 h-5 rounded border-slate-300 text-accent focus:ring-accent"
//                     />
//                     <span className="body-text">תחום דו-חודשי</span>
//                   </label>
//                 )}

//                 <label className="flex items-center gap-3 cursor-pointer">
//                   <input
//                     type="checkbox"
//                     checked={hasEndDate}
//                     onChange={(e) => setHasEndDate(e.target.checked)}
//                     className="w-5 h-5 rounded border-slate-300 text-accent focus:ring-accent"
//                   />
//                   <span className="body-text">קבע תאריך סיום</span>
//                 </label>

//                 {hasEndDate && (
//                   <div>
//                     <label className="label-text block mb-2">
//                       תאריך אחרון לחזרה
//                     </label>
//                     <input
//                       type="date"
//                       value={endDate}
//                       onChange={(e) => setEndDate(e.target.value)}
//                       className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-background/50 text-primary focus:outline-none focus:border-accent focus:bg-white transition-all text-right"
//                     />
//                   </div>
//                 )}
//               </div>
//             )}
//             {/* "הזכר לי מאוחר יותר" toggle */}
//           <button
//             type="button"
//             onClick={() => onPatch({ needsReview: !row.needsReview })}
//             aria-pressed={row.needsReview}
//             aria-label={row.needsReview ? 'הסר סימון לבדיקה' : 'סמן לבדיקה מאוחר יותר'}
//             title={row.needsReview ? 'מסומן לבדיקה — לחץ לביטול' : 'הזכר לי מאוחר יותר'}
//             className={`p-2 rounded-lg transition-colors duration-200 ${
//               row.needsReview
//                 ? 'text-amber-600 bg-amber-100 hover:bg-amber-200'
//                 : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'
//             }`}
//           >
//             <Bell size={18} strokeWidth={ICON_STROKE} className={row.needsReview ? 'fill-amber-200' : ''} />
//           </button>

//             <div className="flex gap-3 pt-5">
//               <button
//                 type="button"
//                 onClick={onClose}
//                 className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-primary hover:bg-background transition-all label-text"
//               >
//                 ביטול
//               </button>
//               <button
//                 type="button"
//                 onClick={handleConfirm}
//                 className="flex-1 px-4 py-3 rounded-xl bg-accent text-white hover:bg-accent/90 transition-all label-text"
//               >
//                 אישור
//               </button>
//             </div>
//           </motion.div>
//         </motion.div>
//       )}
//     </AnimatePresence>
//   );
// }

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { DraftRowMode } from './types';
import { ICON_STROKE } from '../../constants/ui';

export type AdvancedModeResult =
  | { mode: 'none' }
  | { mode: 'installments'; installmentsTotal: number }
  | { mode: 'biMonthly'; parity: 'even' | 'odd' }
  | { mode: 'recurring'; endDate: string | null }
  // "Last billing month": a single projected item that stops being billed after
  // the given month. endDate is the last day of that month (YYYY-MM-DD).
  | { mode: 'lastMonth'; endDate: string };

interface AdvancedModeModalProps {
  isOpen: boolean;
  initialMode: DraftRowMode;
  initialInstallmentsTotal: number | null;
  initialEndDate: string | null;
  initialBaseMonth: number | null;
  totalAmount: string;
  onClose: () => void;
  onConfirm: (result: AdvancedModeResult) => void;
  /** הצגת אפשרות פיצול לתשלומים. ברירת מחדל true (הוצאות). */
  showInstallments?: boolean;
  /** הצגת אפשרות עסקה דו-חודשית. ברירת מחדל true (הוצאות). */
  showBiMonthly?: boolean;
}

export default function AdvancedModeModal({
  isOpen,
  initialMode,
  initialInstallmentsTotal,
  initialEndDate,
  initialBaseMonth,
  totalAmount,
  onClose,
  onConfirm,
  showInstallments = true,
  showBiMonthly = true,
}: AdvancedModeModalProps) {
  // installments state
  const [installmentsEnabled, setInstallmentsEnabled] = useState<boolean>(
    initialInstallmentsTotal != null,
  );
  const [installmentsCount, setInstallmentsCount] = useState<number>(
    initialInstallmentsTotal ?? 3,
  );

  // bi-monthly state
  const [biMonthlyEnabled, setBiMonthlyEnabled] = useState<boolean>(
    initialBaseMonth != null,
  );
  const [parity, setParity] = useState<'even' | 'odd'>(
    ((initialBaseMonth ?? 2) % 2 === 0) ? 'even' : 'odd',
  );

  // end-date state (income / bounded recurrence)
  const [hasEndDate, setHasEndDate] = useState<boolean>(
    initialMode === 'recurring' && initialEndDate !== null,
  );
  const [endDate, setEndDate] = useState<string>(initialEndDate ?? '');

  // "last billing month" state (expenses) — a single projected item that stops
  // being billed after the chosen month. Stored as YYYY-MM for the month input.
  const [lastMonthEnabled, setLastMonthEnabled] = useState<boolean>(
    initialMode === 'lastMonth' && initialEndDate !== null,
  );
  const [lastMonth, setLastMonth] = useState<string>(
    initialEndDate ? initialEndDate.slice(0, 7) : '',
  );

  useEffect(() => {
    if (!isOpen) return;
    setInstallmentsEnabled(initialInstallmentsTotal != null);
    setInstallmentsCount(initialInstallmentsTotal ?? 3);
    setBiMonthlyEnabled(initialBaseMonth != null);
    setParity(((initialBaseMonth ?? 2) % 2 === 0) ? 'even' : 'odd');
    setHasEndDate(initialMode === 'recurring' && initialEndDate !== null);
    setEndDate(initialEndDate ?? '');
    setLastMonthEnabled(initialMode === 'lastMonth' && initialEndDate !== null);
    setLastMonth(initialEndDate ? initialEndDate.slice(0, 7) : '');
  }, [
    isOpen,
    initialMode,
    initialInstallmentsTotal,
    initialEndDate,
    initialBaseMonth,
  ]);

  const total = parseFloat(totalAmount);
  const perInstallment =
    installmentsEnabled &&
    installmentsCount >= 2 &&
    Number.isFinite(total) &&
    total > 0
      ? (total / installmentsCount).toFixed(2)
      : null;

  // Installments, bi-monthly and last-billing-month are mutually exclusive:
  // enabling one clears the others.
  const handleInstallmentsToggle = (checked: boolean) => {
    setInstallmentsEnabled(checked);
    if (checked) {
      setBiMonthlyEnabled(false);
      setLastMonthEnabled(false);
    }
  };

  const handleBiMonthlyToggle = (checked: boolean) => {
    setBiMonthlyEnabled(checked);
    if (checked) {
      setInstallmentsEnabled(false);
      setLastMonthEnabled(false);
    }
  };

  const handleLastMonthToggle = (checked: boolean) => {
    setLastMonthEnabled(checked);
    if (checked) {
      setInstallmentsEnabled(false);
      setBiMonthlyEnabled(false);
    }
  };

  const handleConfirm = () => {
    if (installmentsEnabled) {
      const safe = Math.max(2, Math.min(120, Math.round(installmentsCount)));
      onConfirm({ mode: 'installments', installmentsTotal: safe });
      return;
    }
    if (biMonthlyEnabled) {
      onConfirm({ mode: 'biMonthly', parity });
      return;
    }
    // Last billing month (expenses): convert the chosen YYYY-MM to the last day
    // of that month so the item is included through the end of it.
    if (lastMonthEnabled && lastMonth) {
      const [y, m] = lastMonth.split('-').map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      const endOfMonth = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      onConfirm({ mode: 'lastMonth', endDate: endOfMonth });
      return;
    }
    // The end-date (bounded recurring) path only exists in the income context,
    // where neither installments nor bi-monthly is shown.
    if (!showInstallments && !showBiMonthly && hasEndDate && endDate) {
      onConfirm({ mode: 'recurring', endDate });
      return;
    }
    onConfirm({ mode: 'none' });
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
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="heading-3">הגדרות מתקדמות</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="סגור"
                title="סגור"
                className="w-9 h-9 rounded-lg text-slate-400 hover:text-primary hover:bg-background transition-all flex items-center justify-center"
              >
                <X className="w-5 h-5" strokeWidth={ICON_STROKE} />
              </button>
            </div>

            <div className="space-y-5">
              {/* Installments option (expenses only) */}
              {showInstallments && (
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={installmentsEnabled}
                      onChange={(e) => handleInstallmentsToggle(e.target.checked)}
                      className="w-5 h-5 rounded border-slate-300 text-accent focus:ring-accent"
                    />
                    <span className="body-text">פצל לתשלומים חודשיים</span>
                  </label>

                  {installmentsEnabled && (
                    <div className="pr-8">
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
                          יווצרו {installmentsCount} שורות חודשיות של{' '}
                          {perInstallment} ₪ כל אחת, החל מתאריך ההוצאה
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Bi-monthly option (expenses only) */}
              {showBiMonthly && (
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={biMonthlyEnabled}
                      onChange={(e) => handleBiMonthlyToggle(e.target.checked)}
                      className="w-5 h-5 rounded border-slate-300 text-accent focus:ring-accent"
                    />
                    <span className="body-text">עסקה דו-חודשית</span>
                  </label>

                  {biMonthlyEnabled && (
                    <div className="pr-8">
                      <p className="label-text mb-2">חודש הופעה</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setParity('even')}
                          className={`flex-1 px-4 py-2 rounded-xl border label-text transition-all duration-200 ${
                            parity === 'even'
                              ? 'bg-accent text-white border-accent shadow-sm'
                              : 'border-slate-200 text-primary hover:bg-background'
                          }`}
                        >
                          חודש זוגי
                        </button>
                        <button
                          type="button"
                          onClick={() => setParity('odd')}
                          className={`flex-1 px-4 py-2 rounded-xl border label-text transition-all duration-200 ${
                            parity === 'odd'
                              ? 'bg-accent text-white border-accent shadow-sm'
                              : 'border-slate-200 text-primary hover:bg-background'
                          }`}
                        >
                          חודש אי-זוגי
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Last billing month option (expenses) */}
              {(showInstallments || showBiMonthly) && (
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lastMonthEnabled}
                      onChange={(e) => handleLastMonthToggle(e.target.checked)}
                      className="w-5 h-5 rounded border-slate-300 text-accent focus:ring-accent"
                    />
                    <span className="body-text">חודש אחרון לחיוב העסקה</span>
                  </label>

                  {lastMonthEnabled && (
                    <div className="pr-8">
                      <label className="label-text block mb-2">
                        חודש אחרון
                      </label>
                      <input
                        type="month"
                        value={lastMonth}
                        onChange={(e) => setLastMonth(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-background/50 text-primary focus:outline-none focus:border-accent focus:bg-white transition-all text-right"
                      />
                      <p className="body-text-sm text-slate-500 mt-2">
                        העסקה תיכלל בהוצאות החודשיות עד החודש שנבחר ועד בכלל, ולאחר
                        מכן תיעלם מהתחזית
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* End-date option (income / when neither installments nor bi-monthly shown) */}
              {!showInstallments && !showBiMonthly && (
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasEndDate}
                      onChange={(e) => setHasEndDate(e.target.checked)}
                      className="w-5 h-5 rounded border-slate-300 text-accent focus:ring-accent"
                    />
                    <span className="body-text">מסתיים בתאריך</span>
                  </label>

                  {hasEndDate && (
                    <div className="pr-8">
                      <label className="label-text block mb-2">
                        תאריך סיום
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
            </div>

            {/* Footer buttons */}
            <div className="flex gap-3 pt-6">
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
