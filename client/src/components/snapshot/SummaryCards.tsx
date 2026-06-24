import { TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import type { MonthlySummary } from '@gutplus/shared';
import { ICON_STROKE } from '../../constants/ui';

interface SummaryCardsProps {
  summary: MonthlySummary;
}

const currencyFormatter = new Intl.NumberFormat('he-IL', {
  style: 'currency',
  currency: 'ILS',
  maximumFractionDigits: 0,
});

const formatILS = (value: number): string => currencyFormatter.format(value);

interface CardShellProps {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function CardShell({ label, icon, children }: CardShellProps) {
  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-slate-100 p-6 transition-all duration-300 hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <span className="label-text">{label}</span>
        {icon}
      </div>
      {children}
    </div>
  );
}

interface SubRowProps {
  label: string;
  value: number;
  bordered?: boolean;
  valueClassName?: string;
}

// A muted breakdown line: subtle label on one side, value on the other.
function SubRow({ label, value, bordered = false, valueClassName }: SubRowProps) {
  return (
    <div
      className={`flex items-center justify-between gap-3 py-1.5 ${
        bordered ? 'mt-1.5 pt-2.5 border-t border-slate-100' : ''
      }`}
    >
      <span className="body-text-sm text-slate-500">{label}</span>
      <span
        className={`body-text-sm font-medium ${
          valueClassName ?? 'text-slate-600'
        }`}
      >
        {formatILS(value)}
      </span>
    </div>
  );
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  const { incomes, expenses, debtRepayments } = summary;

  const breakoutsTotal = (expenses.breakouts ?? []).reduce(
    (sum, b) => sum + b.amount,
    0,
  );

  // Card 1 — household consumption: every dry monthly-average EXPENSE
  // bucket, explicitly excluding debtRepayments (debt is a separate
  // financial obligation, not household consumption — matches the existing
  // balanceBeforeDebts separation elsewhere).
  const totalExpenses =
    expenses.monthly +
    expenses.yearly +
    expenses.holidays +
    expenses.installments +
    breakoutsTotal;
  const specialBundle =
    expenses.yearly + expenses.holidays + expenses.installments + breakoutsTotal;

  // Card 2 — dry monthly-average INCOME total.
  const totalIncome = incomes.monthly + incomes.yearly;

  const balanceBefore = summary.balanceBeforeDebts;
  const balanceAfter = summary.balanceAfterDebts;
  const afterClass = balanceAfter >= 0 ? 'text-green-500' : 'text-red-500';
  const beforeClass = balanceBefore >= 0 ? 'text-primary' : 'text-red-500';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Card 1 — how much our home consumes */}
      <CardShell
        label="כמה הבית שלנו צורך"
        icon={
          <TrendingDown
            className="text-red-500"
            size={22}
            strokeWidth={ICON_STROKE}
          />
        }
      >
        <p className="heading-3 text-red-500 mb-3">{formatILS(totalExpenses)}</p>
        <SubRow label="הוצאות קבועות" value={expenses.monthly} />
        <SubRow
          label="הוצאות שנתיות/חגים/תשלומים (ממוצע חודשי)"
          value={specialBundle}
        />
      </CardShell>

      {/* Card 2 — our monthly income */}
      <CardShell
        label="ההכנסות החודשיות שלנו"
        icon={
          <TrendingUp
            className="text-green-500"
            size={22}
            strokeWidth={ICON_STROKE}
          />
        }
      >
        <p className="heading-3 text-green-500 mb-3">{formatILS(totalIncome)}</p>
        <SubRow label="הכנסות שוטפות חודשיות" value={incomes.monthly} />
        <SubRow label="הכנסות שנתיות (ממוצע חודשי)" value={incomes.yearly} />
      </CardShell>

      {/* Card 3 — summary: income vs. expenses, debt, net balance */}
      <CardShell
        label="יתרות פיננסיות"
        icon={
          <Wallet className="text-accent" size={22} strokeWidth={ICON_STROKE} />
        }
      >
        <SubRow
          label="הכנסות"
          value={totalIncome}
          valueClassName="text-green-500"
        />
        <SubRow
          label="הוצאות"
          value={totalExpenses}
          valueClassName="text-red-500"
        />
        <SubRow
          label="החזרי חובות"
          value={debtRepayments}
          bordered
          valueClassName="text-primary font-semibold"
        />
        <div className="flex items-center justify-between gap-3 mt-1.5 pt-2.5 border-t border-slate-100">
          <span className="body-text-sm text-slate-500">
            יתרה ללא החזרי חובות
          </span>
          <span className={`body-text font-medium ${beforeClass}`}>
            {formatILS(balanceBefore)}
          </span>
        </div>
        <div className="pt-2.5 border-t border-slate-100 mt-1.5">
          <span className="body-text-sm text-slate-500">
            יתרה כולל החזרי חובות
          </span>
          <p className={`heading-3 mt-1 ${afterClass}`}>
            {formatILS(balanceAfter)}
          </p>
        </div>
      </CardShell>
    </div>
  );
}
