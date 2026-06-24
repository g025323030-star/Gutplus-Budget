import { TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import type { MonthlySummary } from '@gutplus/shared';
import { ICON_STROKE } from '../../constants/ui';

interface SnapshotMonthlyOverviewProps {
  summary: MonthlySummary;
}

const currencyFormatter = new Intl.NumberFormat('he-IL', {
  style: 'currency',
  currency: 'ILS',
  maximumFractionDigits: 0,
});

const formatILS = (value: number): string => currencyFormatter.format(value);

interface BreakdownLineProps {
  icon: React.ReactNode;
  label: string;
  recurringLabel: string;
  recurringValue: number;
  averageLabel: string;
  averageValue: number;
  total: number;
  totalClassName: string;
}

// A single compact row: a leading icon+label, the two contributing
// sub-figures inline, and the combined total on the trailing edge.
function BreakdownLine({
  icon,
  label,
  recurringLabel,
  recurringValue,
  averageLabel,
  averageValue,
  total,
  totalClassName,
}: BreakdownLineProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-2">
      <span className="body-text-sm text-slate-500 flex items-center gap-2">
        {icon}
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-4">
        <span className="body-text-sm text-slate-500">
          {recurringLabel}:{' '}
          <span className="font-medium text-slate-600">
            {formatILS(recurringValue)}
          </span>
        </span>
        <span className="body-text-sm text-slate-500">
          {averageLabel}:{' '}
          <span className="font-medium text-slate-600">
            {formatILS(averageValue)}
          </span>
        </span>
        <span className={`body-text font-semibold ${totalClassName}`}>
          {formatILS(total)}
        </span>
      </div>
    </div>
  );
}

interface FigureProps {
  label: string;
  value: number;
  valueClassName?: string;
}

function Figure({ label, value, valueClassName }: FigureProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="label-text">{label}</span>
      <span className={`heading-3 ${valueClassName ?? ''}`}>
        {formatILS(value)}
      </span>
    </div>
  );
}

export default function SnapshotMonthlyOverview({
  summary,
}: SnapshotMonthlyOverviewProps) {
  const { incomes, expenses, debtRepayments } = summary;

  const breakoutsTotal = (expenses.breakouts ?? []).reduce(
    (sum, b) => sum + b.amount,
    0,
  );

  const specialBundle =
    expenses.yearly + expenses.holidays + expenses.installments + breakoutsTotal;

  const totalIncome = incomes.monthly + incomes.yearly;
  const totalExpenses = expenses.monthly + specialBundle;
  const balanceAfter = summary.balanceAfterDebts;
  const balanceClass = balanceAfter >= 0 ? 'text-green-500' : 'text-red-500';

  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-slate-100 p-6 space-y-1">
      <BreakdownLine
        icon={
          <TrendingUp
            className="text-green-500"
            size={18}
            strokeWidth={ICON_STROKE}
          />
        }
        label="הכנסות"
        recurringLabel="קבועות"
        recurringValue={incomes.monthly}
        averageLabel="שנתיות (ממוצע חודשי)"
        averageValue={incomes.yearly}
        total={totalIncome}
        totalClassName="text-green-500"
      />
      <div className="border-t border-slate-100" />
      <BreakdownLine
        icon={
          <TrendingDown
            className="text-red-500"
            size={18}
            strokeWidth={ICON_STROKE}
          />
        }
        label="הוצאות"
        recurringLabel="קבועות"
        recurringValue={expenses.monthly}
        averageLabel="שנתיות/חגים/תשלומים (ממוצע חודשי)"
        averageValue={specialBundle}
        total={totalExpenses}
        totalClassName="text-red-500"
      />

      <div className="flex items-center gap-2 mt-4 mb-3 pt-3 border-t border-slate-100">
        <Wallet className="text-accent" size={20} strokeWidth={ICON_STROKE} />
        <span className="label-text">סיכום חודשי</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Figure
          label="סך הכנסות חודשיות"
          value={totalIncome}
          valueClassName="text-green-500"
        />
        <Figure
          label="סך הוצאות חודשיות"
          value={totalExpenses}
          valueClassName="text-red-500"
        />
        <Figure
          label="החזרי חובות"
          value={debtRepayments}
          valueClassName="text-primary"
        />
        <Figure
          label="יתרה נטו לאחר החזרים"
          value={balanceAfter}
          valueClassName={balanceClass}
        />
      </div>
    </div>
  );
}
