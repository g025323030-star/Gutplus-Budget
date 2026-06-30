import { useState } from 'react';
import { Scale, TrendingDown, TrendingUp } from 'lucide-react';
import type { MonthlySummary } from '@gutplus/shared';
import { ICON_STROKE } from '../../constants/ui';

type CardsViewMode = 'monthly' | 'yearly' | 'summary';

interface SnapshotSummaryCardsProps {
  summary: MonthlySummary;
}

const currencyFormatter = new Intl.NumberFormat('he-IL', {
  style: 'currency',
  currency: 'ILS',
  maximumFractionDigits: 0,
});
const formatILS = (value: number): string => currencyFormatter.format(value);

const MODE_OPTIONS: { value: CardsViewMode; label: string }[] = [
  { value: 'monthly', label: 'חודשי' },
  { value: 'yearly', label: 'שנתי' },
  { value: 'summary', label: 'סיכום' },
];

interface CardFigures {
  income: number;
  expenses: number;
  debt: number;
  balanceExcludingDebt: number;
  balanceIncludingDebt: number;
  incomeCaption: string;
  expenseCaption: string;
}

/**
 * MonthlySummary already separates each bucket — incomes, expenses, AND debt
 * repayments — into "monthly" (plain recurring) vs "yearly-distributed" (÷12
 * dry-averaged) at the same monthly scale, so all three view modes are just
 * different subsets/unions of the one fetched summary: no extra requests or
 * further division needed. Debt mirrors the income/expense split exactly
 * (debtRepaymentsMonthly / debtRepaymentsYearly), computed server-side.
 */
const computeFigures = (summary: MonthlySummary, mode: CardsViewMode): CardFigures => {
  const breakoutsTotal = (summary.expenses.breakouts ?? []).reduce((sum, b) => sum + b.amount, 0);
  const yearlyExpenseBundle =
    summary.expenses.yearly + summary.expenses.holidays + summary.expenses.installments + breakoutsTotal;

  if (mode === 'monthly') {
    const income = summary.incomes.monthly;
    const expenses = summary.expenses.monthly;
    const debt = summary.debtRepaymentsMonthly;
    const balanceExcludingDebt = income - expenses;
    return {
      income,
      expenses,
      debt,
      balanceExcludingDebt,
      balanceIncludingDebt: balanceExcludingDebt - debt,
      incomeCaption: 'הכנסות שוטפות בלבד',
      expenseCaption: 'הוצאות קבועות בלבד',
    };
  }

  if (mode === 'yearly') {
    const income = summary.incomes.yearly;
    const expenses = yearlyExpenseBundle;
    const debt = summary.debtRepaymentsYearly;
    const balanceExcludingDebt = income - expenses;
    return {
      income,
      expenses,
      debt,
      balanceExcludingDebt,
      balanceIncludingDebt: balanceExcludingDebt - debt,
      incomeCaption: 'פריטים שנתיים (ממוצע חודשי)',
      expenseCaption: 'שנתי · חגים · תשלומים (ממוצע חודשי)',
    };
  }

  return {
    income: summary.incomes.monthly + summary.incomes.yearly,
    expenses: summary.expenses.monthly + yearlyExpenseBundle,
    debt: summary.debtRepayments,
    balanceExcludingDebt: summary.balanceBeforeDebts,
    balanceIncludingDebt: summary.balanceAfterDebts,
    incomeCaption: 'סך כל ההכנסות',
    expenseCaption: 'סך כל ההוצאות',
  };
};

interface FigureCardProps {
  label: string;
  value: number;
  caption: string;
  icon: React.ReactNode;
  valueClassName: string;
}

function FigureCard({ label, value, caption, icon, valueClassName }: FigureCardProps) {
  return (
    <div className="rounded-xl border border-slate-100 bg-surface p-5 transition-colors duration-200 hover:border-slate-200">
      <div className="flex items-center justify-between mb-2">
        <span className="label-text text-slate-500">{label}</span>
        {icon}
      </div>
      <p className={`heading-3 ${valueClassName}`}>{formatILS(value)}</p>
      <p className="text-xs text-slate-400 mt-1.5">{caption}</p>
    </div>
  );
}

interface BalanceCardProps {
  excludingDebt: number;
  includingDebt: number;
  debt: number;
}

function BalanceCard({ excludingDebt, includingDebt, debt }: BalanceCardProps) {
  const exclPositive = excludingDebt >= 0;
  const inclPositive = includingDebt >= 0;

  return (
    <div className="rounded-xl border border-slate-100 bg-surface p-5 transition-colors duration-200 hover:border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <span className="label-text text-slate-500">יתרה</span>
        <Scale className="text-accent" size={20} strokeWidth={ICON_STROKE} />
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="body-text-sm text-slate-500">יתרה ללא חובות</span>
        <span dir="ltr" className={`body-text font-semibold tabular-nums ${exclPositive ? 'text-green-600' : 'text-red-500'}`}>
          {formatILS(excludingDebt)}
        </span>
      </div>
{debt > 0 ? (<>
      <div className="flex items-center justify-between gap-3 mt-2 pt-2 border-t border-slate-100">
        <span className="body-text-sm text-slate-500">יתרה כולל חובות</span>
        <span dir="ltr" className={`heading-3 ${inclPositive ? 'text-green-600' : 'text-red-500'}`}>
          {formatILS(includingDebt)}
        </span>
      </div>

      <p className="text-xs text-slate-400 mt-2">
       כולל {formatILS(debt)} החזרי חובות
      </p>
</>):  <p className="text-xs text-slate-400 mt-2">
        אין החזרי חובות בתקופה זו
      </p>}
    </div>
  );
}

export default function SnapshotSummaryCards({ summary }: SnapshotSummaryCardsProps) {
  const [mode, setMode] = useState<CardsViewMode>('summary');
  const figures = computeFigures(summary, mode);

  return (
    <div className="rounded-2xl border border-slate-200/70 p-5 md:p-6">
      <div className="flex justify-center mb-5">
        <div
          role="tablist"
          aria-label="תצוגת כרטיסי סיכום"
          className="inline-flex items-center bg-background rounded-xl p-1 gap-0.5"
        >
          {MODE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="tab"
              aria-pressed={mode === opt.value}
              aria-label={`תצוגת ${opt.label}`}
              onClick={() => setMode(opt.value)}
              className={`px-4 py-1.5 rounded-lg label-text text-sm transition-all duration-300 ${
                mode === opt.value ? 'bg-accent text-white shadow-sm' : 'text-slate-500 hover:text-primary'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FigureCard
          label="הכנסות"
          value={figures.income}
          caption={figures.incomeCaption}
          icon={<TrendingUp className="text-green-500" size={20} strokeWidth={ICON_STROKE} />}
          valueClassName="text-green-600"
        />
        <FigureCard
          label="הוצאות"
          value={figures.expenses}
          caption={figures.expenseCaption}
          icon={<TrendingDown className="text-red-500" size={20} strokeWidth={ICON_STROKE} />}
          valueClassName="text-red-500"
        />
        <BalanceCard
          excludingDebt={figures.balanceExcludingDebt}
          includingDebt={figures.balanceIncludingDebt}
          debt={figures.debt}
        />
      </div>
    </div>
  );
}
