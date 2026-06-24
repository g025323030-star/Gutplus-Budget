import { useMemo } from 'react';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { CategoryFrequency, CategoryType } from '@gutplus/shared';
import type { BudgetItem, Category } from '@gutplus/shared';
import { ICON_STROKE } from '../../constants/ui';

type PeriodMode = 'monthly' | 'yearly';

interface TransactionsListProps {
  mode: PeriodMode;
  transactions: BudgetItem[];
  categoryById: Map<string, Category>;
}

const currencyFormatter = new Intl.NumberFormat('he-IL', {
  style: 'currency',
  currency: 'ILS',
  maximumFractionDigits: 0,
});

interface RowEntry {
  id: string;
  description: string;
  categoryName: string;
  amount: number;
}

const buildRows = (
  transactions: BudgetItem[],
  categoryById: Map<string, Category>,
  type: CategoryType,
  mode: PeriodMode,
): RowEntry[] => {
  const targetFrequency =
    mode === 'monthly' ? CategoryFrequency.MONTHLY : CategoryFrequency.YEARLY;
  return transactions
    .filter((tx) => {
      if (tx.frequency !== targetFrequency) return false;
      if (!tx.categoryId) return false;
      const category = categoryById.get(tx.categoryId);
      if (!category || category.type !== type) return false;
      return true;
    })
    .map((tx) => {
      const category = tx.categoryId
        ? categoryById.get(tx.categoryId)
        : undefined;
      const rawAmount = parseFloat(tx.amount) || 0;
      // Bi-monthly items are stored at their full billing-month amount but
      // only actually apply every other month — halve for the monthly
      // average shown here, matching BudgetItemRow's display halving.
      const amount = tx.baseMonth != null ? rawAmount / 2 : rawAmount;
      return {
        id: tx.id,
        description: tx.description || '—',
        categoryName: category?.name ?? 'ללא קטגוריה',
        amount,
      };
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);
};

interface TopListProps {
  title: string;
  rows: RowEntry[];
  amountClass: string;
  icon: React.ReactNode;
}

function TopList({ title, rows, amountClass, icon }: TopListProps) {
  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="heading-3">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="body-text-sm text-slate-400">אין נתונים</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between py-2 gap-3"
            >
              <div className="min-w-0 flex-1">
                <p className="body-text truncate">{row.description}</p>
                <p className="body-text-sm text-slate-500">
                  {row.categoryName}
                </p>
              </div>
              <span className={`body-text font-semibold ${amountClass}`}>
                {currencyFormatter.format(row.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function TransactionsList({
  mode,
  transactions,
  categoryById,
}: TransactionsListProps) {
  const topExpenses = useMemo(
    () => buildRows(transactions, categoryById, CategoryType.EXPENSE, mode),
    [transactions, categoryById, mode],
  );
  const topIncome = useMemo(
    () => buildRows(transactions, categoryById, CategoryType.INCOME, mode),
    [transactions, categoryById, mode],
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopList
          title="10 ההוצאות הגדולות"
          rows={topExpenses}
          amountClass="text-red-500"
          icon={
            <ArrowDownCircle
              className="text-red-500"
              size={20}
              strokeWidth={ICON_STROKE}
            />
          }
        />
        <TopList
          title="10 ההכנסות הגדולות"
          rows={topIncome}
          amountClass="text-green-500"
          icon={
            <ArrowUpCircle
              className="text-green-500"
              size={20}
              strokeWidth={ICON_STROKE}
            />
          }
        />
      </div>
    </div>
  );
}
