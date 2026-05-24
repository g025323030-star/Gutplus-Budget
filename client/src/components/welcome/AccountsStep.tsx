import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Plus, Loader2, Check } from 'lucide-react';
import type { Account } from '@gutplus/shared';
import { AccountType } from '@gutplus/shared';
import { useAuth } from '../../context/AuthContext';
import AccountFormModal from './AccountFormModal';

interface AccountsStepProps {
  initialAccounts: Account[];
  onFinish: () => Promise<void>;
  onBack: () => void;
}

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  [AccountType.BANK]: 'חשבון בנק',
  [AccountType.CREDIT_CARD]: 'כרטיס אשראי',
  [AccountType.ASSET]: 'נכס',
  [AccountType.LOAN]: 'הלוואה',
  [AccountType.MORTGAGE]: 'משכנתא',
};

export default function AccountsStep({
  initialAccounts,
  onFinish,
  onBack,
}: AccountsStepProps) {
  const { householdId } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFinish = async () => {
    setError(null);
    setIsFinishing(true);
    try {
      await onFinish();
    } catch (err) {
      console.error(err);
      setError('סיום ההרשמה נכשל. נסו שוב');
      setIsFinishing(false);
    }
  };

  const handleCreated = (account: Account) => {
    setAccounts(prev => [...prev, account]);
  };

  return (
    <motion.div
      key="step-3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center text-center w-full"
      dir="rtl"
    >
      <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-6">
        <Wallet className="w-10 h-10 text-accent" strokeWidth={1.5} />
      </div>

      <h1 className="heading-1 mb-3">החשבונות והכרטיסים שלכם</h1>
      <p className="body-text mb-8 max-w-md">
        הוסיפו חשבונות בנק, כרטיסי אשראי, הלוואות או נכסים. ניתן לדלג ולהוסיף בכל עת
      </p>

      <div className="w-full max-w-xl space-y-3 mb-4">
        {accounts.map(account => (
          <div
            key={account.id}
            className="bg-background/40 border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between"
          >
            <div className="text-right">
              <p className="font-bold text-primary">{account.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {ACCOUNT_TYPE_LABELS[account.type]} · {account.balance} {account.currency}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
              <Check className="w-4 h-4 text-accent" strokeWidth={2} />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          disabled={!householdId || isFinishing}
          className="w-full py-3 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 hover:border-accent hover:text-accent transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" strokeWidth={1.5} />
          <span>הוספת חשבון</span>
        </button>
      </div>

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

      <div className="flex flex-col sm:flex-row gap-3 mt-6 w-full max-w-md">
        <button
          type="button"
          onClick={onBack}
          disabled={isFinishing}
          className="flex-1 px-6 py-3 rounded-xl border-2 border-slate-300 text-slate-600 font-bold hover:border-slate-400 transition-all"
        >
          חזור
        </button>
        <motion.button
          type="button"
          whileHover={{ scale: isFinishing ? 1 : 1.02 }}
          whileTap={{ scale: isFinishing ? 1 : 0.98 }}
          onClick={handleFinish}
          disabled={isFinishing}
          className="flex-1 bg-accent text-white px-6 py-3 rounded-xl font-bold shadow-md shadow-accent/10 hover:shadow-lg hover:shadow-accent/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isFinishing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>מסיים</span>
            </>
          ) : (
            <span>{accounts.length > 0 ? 'סיום' : 'דלג וסיום'}</span>
          )}
        </motion.button>
      </div>

      {householdId && (
        <AccountFormModal
          isOpen={isModalOpen}
          householdId={householdId}
          onClose={() => setIsModalOpen(false)}
          onCreated={handleCreated}
        />
      )}
    </motion.div>
  );
}
