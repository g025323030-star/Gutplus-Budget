import { TrendingDown, TrendingUp, Scale } from 'lucide-react';
import { ICON_STROKE } from '../../../constants/ui';
import {
  calculateExpenseTotal,
  calculateExpenseTotalYear,
  calculateIncomeTotal,
  calculateIncomeTotalYear,
  formatILS,
  getMonthlyBalance,
  getYearlyBalance,
  type BudgetViewData,
} from '../budget.utils';

interface BudgetKpiCardsProps {
  data: BudgetViewData;
  monthIndex: number;
  period: 'month' | 'year';
}

interface KpiCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  valueClassName: string;
}

function KpiCard({ label, value, icon, valueClassName }: KpiCardProps) {
  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-slate-100 p-6 transition-all duration-300 hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
        <span className="label-text">{label}</span>
        {icon}
      </div>
      <p className={`heading-3 ${valueClassName}`}>{formatILS(value)}</p>
    </div>
  );
}

export default function BudgetKpiCards({
  data,
  monthIndex,
  period,
}: BudgetKpiCardsProps) {
  const isYear = period === 'year';
  const income = isYear
    ? calculateIncomeTotalYear(data)
    : calculateIncomeTotal(data, monthIndex);
  const expense = isYear
    ? calculateExpenseTotalYear(data)
    : calculateExpenseTotal(data, monthIndex);
  const balance = isYear
    ? getYearlyBalance(data)
    : getMonthlyBalance(data, monthIndex);
  const balanceClass = balance >= 0 ? 'text-emerald-600' : 'text-rose-600';

  const suffix = isYear ? 'שנתי' : 'חודשי';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <KpiCard
        label={`סך הכנסות ${suffix}`}
        value={income}
        icon={
          <TrendingUp
            className="text-emerald-600"
            size={22}
            strokeWidth={ICON_STROKE}
          />
        }
        valueClassName="text-emerald-600"
      />
      <KpiCard
        label={`סך הוצאות ${suffix}`}
        value={expense}
        icon={
          <TrendingDown
            className="text-rose-600"
            size={22}
            strokeWidth={ICON_STROKE}
          />
        }
        valueClassName="text-rose-600"
      />
      <KpiCard
        label={isYear ? 'יתרה שנתית נטו' : 'יתרה חודשית נטו'}
        value={balance}
        icon={
          <Scale
            className="text-[#2D5A59]"
            size={22}
            strokeWidth={ICON_STROKE}
          />
        }
        valueClassName={balanceClass}
      />
    </div>
  );
}
