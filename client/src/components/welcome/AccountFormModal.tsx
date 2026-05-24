import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, Loader2 } from 'lucide-react';
import { AccountType } from '@gutplus/shared';
import { createAccount } from '../../services/accounts.service';
import type { Account } from '@gutplus/shared';

interface AccountFormModalProps {
  isOpen: boolean;
  householdId: string;
  onClose: () => void;
  onCreated: (account: Account) => void;
}

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  [AccountType.BANK]: 'חשבון בנק',
  [AccountType.CREDIT_CARD]: 'כרטיס אשראי',
  [AccountType.ASSET]: 'נכס',
  [AccountType.LOAN]: 'הלוואה',
  [AccountType.MORTGAGE]: 'משכנתא',
};

export default function AccountFormModal({
  isOpen,
  householdId,
  onClose,
  onCreated,
}: AccountFormModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>(AccountType.BANK);
  const [balance, setBalance] = useState('0');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [currency, setCurrency] = useState('ILS');
  const [monthlyPayment, setMonthlyPayment] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const reset = () => {
    setName('');
    setType(AccountType.BANK);
    setBalance('0');
    setAdvancedOpen(false);
    setCurrency('ILS');
    setMonthlyPayment('');
    setInterestRate('');
    setUrgencyLevel(1);
    setError(null);
  };

  const handleClose = () => {
    if (isSaving) return;
    reset();
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError('נא להזין שם לחשבון');
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      const created = await createAccount({
        name: name.trim(),
        type,
        balance: balance || '0',
        currency: currency || 'ILS',
        monthlyPayment: monthlyPayment ? monthlyPayment : null,
        interestRate: interestRate ? interestRate : null,
        urgencyLevel,
        householdId,
      });
      onCreated(created);
      reset();
      onClose();
    } catch (err) {
      console.error(err);
      setError('שמירת החשבון נכשלה. נסו שוב');
    } finally {
      setIsSaving(false);
    }
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
          onClick={handleClose}
          dir="rtl"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="heading-2">חשבון חדש</h2>
              <button
                type="button"
                onClick={handleClose}
                aria-label="סגור"
                className="w-9 h-9 rounded-lg text-slate-400 hover:text-primary hover:bg-background transition-all flex items-center justify-center"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-primary block mb-2 text-right">
                  שם החשבון
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="למשל: בנק הפועלים"
                  autoFocus
                  disabled={isSaving}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-background/50 text-primary focus:outline-none focus:border-accent focus:bg-white transition-all text-right"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-primary block mb-2 text-right">
                  סוג חשבון
                </label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as AccountType)}
                  disabled={isSaving}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-background/50 text-primary focus:outline-none focus:border-accent focus:bg-white transition-all text-right"
                >
                  {Object.values(AccountType).map(value => (
                    <option key={value} value={value}>
                      {ACCOUNT_TYPE_LABELS[value]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-primary block mb-2 text-right">
                  יתרה נוכחית
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={balance}
                  onChange={e => setBalance(e.target.value)}
                  disabled={isSaving}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-background/50 text-primary focus:outline-none focus:border-accent focus:bg-white transition-all text-right"
                />
              </div>

              <button
                type="button"
                onClick={() => setAdvancedOpen(prev => !prev)}
                className="flex items-center gap-2 text-sm font-semibold text-accent hover:opacity-80 transition-opacity"
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    advancedOpen ? 'rotate-180' : ''
                  }`}
                  strokeWidth={2}
                />
                <span>אפשרויות מתקדמות</span>
              </button>

              <AnimatePresence initial={false}>
                {advancedOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-4 pt-2">
                      <div>
                        <label className="text-sm font-bold text-primary block mb-2 text-right">
                          מטבע
                        </label>
                        <input
                          type="text"
                          value={currency}
                          onChange={e =>
                            setCurrency(e.target.value.toUpperCase().slice(0, 3))
                          }
                          disabled={isSaving}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-background/50 text-primary focus:outline-none focus:border-accent focus:bg-white transition-all text-right"
                          maxLength={3}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-bold text-primary block mb-2 text-right">
                          תשלום חודשי
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={monthlyPayment}
                          onChange={e => setMonthlyPayment(e.target.value)}
                          placeholder="רלוונטי בעיקר ללוואות ומשכנתא"
                          disabled={isSaving}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-background/50 text-primary focus:outline-none focus:border-accent focus:bg-white transition-all text-right"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-bold text-primary block mb-2 text-right">
                          ריבית שנתית
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={interestRate}
                          onChange={e => setInterestRate(e.target.value)}
                          placeholder="באחוזים"
                          disabled={isSaving}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-background/50 text-primary focus:outline-none focus:border-accent focus:bg-white transition-all text-right"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-bold text-primary block mb-2 text-right">
                          רמת דחיפות (1-5)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={5}
                          value={urgencyLevel}
                          onChange={e =>
                            setUrgencyLevel(
                              Math.max(1, Math.min(5, Number(e.target.value))),
                            )
                          }
                          disabled={isSaving}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-background/50 text-primary focus:outline-none focus:border-accent focus:bg-white transition-all text-right"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSaving}
                  className="flex-1 px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold hover:border-slate-300 transition-all"
                >
                  ביטול
                </button>
                <motion.button
                  type="submit"
                  whileHover={{ scale: isSaving ? 1 : 1.02 }}
                  whileTap={{ scale: isSaving ? 1 : 0.98 }}
                  disabled={isSaving}
                  className="flex-1 bg-accent text-white px-6 py-3 rounded-xl font-bold shadow-md shadow-accent/10 hover:shadow-lg hover:shadow-accent/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>שומר</span>
                    </>
                  ) : (
                    <span>שמירת חשבון</span>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
