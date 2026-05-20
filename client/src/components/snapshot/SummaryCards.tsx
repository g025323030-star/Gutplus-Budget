import { TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { ICON_STROKE } from '../../constants/ui';

interface SummaryCardsProps {
  income: number;
  expense: number;
  balance: number;
}

const currencyFormatter = new Intl.NumberFormat('he-IL', {
  style: 'currency',
  currency: 'ILS',
  maximumFractionDigits: 0,
});

const formatILS = (value: number): string => currencyFormatter.format(value);

interface CardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  valueClassName: string;
}

function Card({ label, value, icon, valueClassName }: CardProps) {
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

export default function SummaryCards({
  income,
  expense,
  balance,
}: SummaryCardsProps) {
  const balanceClass = balance >= 0 ? 'text-green-500' : 'text-red-500';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card
        label="סך הוצאות"
        value={expense}
        icon={
          <TrendingDown
            className="text-red-500"
            size={22}
            strokeWidth={ICON_STROKE}
          />
        }
        valueClassName="text-red-500"
      />
      <Card
        label="סך הכנסות"
        value={income}
        icon={
          <TrendingUp
            className="text-green-500"
            size={22}
            strokeWidth={ICON_STROKE}
          />
        }
        valueClassName="text-green-500"
      />
      <Card
        label="יתרת תקציב"
        value={balance}
        icon={
          <Wallet
            className="text-accent"
            size={22}
            strokeWidth={ICON_STROKE}
          />
        }
        valueClassName={balanceClass}
      />
    </div>
  );
}
