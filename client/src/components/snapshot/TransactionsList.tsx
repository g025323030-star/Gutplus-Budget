import { useMemo } from 'react';
import { ArrowDownCircle, ArrowUpCircle, BarChart3 } from 'lucide-react';
import { CategoryFrequency, CategoryType } from '@gutplus/shared';
import type { BudgetItem, Category } from '@gutplus/shared';
import { ICON_STROKE } from '../../constants/ui';

const HEBREW_MONTHS = [
  'ינואר',
  'פברואר',
  'מרץ',
  'אפריל',
  'מאי',
  'יוני',
  'יולי',
  'אוגוסט',
  'ספטמבר',
  'אוקטובר',
  'נובמבר',
  'דצמבר',
];

type PeriodMode = 'monthly' | 'yearly';

interface TransactionsListProps {
  mode: PeriodMode;
  transactions: BudgetItem[];
  categoryById: Map<string, Category>;
  year: number;
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
      return {
        id: tx.id,
        description: tx.description || '—',
        categoryName: category?.name ?? 'ללא קטגוריה',
        amount: parseFloat(tx.amount) || 0,
      };
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);
};

interface MonthlyTotals {
  month: number;
  income: number;
  expense: number;
}

const ALL_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

// Resolves which months an item contributes to (and how much per month) from
// its forecast fields, since items no longer carry a calendar date.
const monthlyContribution = (
  tx: BudgetItem,
): { months: number[]; perMonth: number } => {
  const amount = parseFloat(tx.amount) || 0;
  // Installment payments and one-time items sit in a single month.
  if (tx.installmentGroupId != null || tx.isOneTime) {
    return tx.assignedMonth != null
      ? { months: [tx.assignedMonth], perMonth: amount }
      : { months: [], perMonth: 0 };
  }
  // Bi-monthly items recur on months matching their base month's parity.
  if (tx.baseMonth != null) {
    return {
      months: ALL_MONTHS.filter((m) => m % 2 === tx.baseMonth! % 2),
      perMonth: amount,
    };
  }
  // Yearly items: a single assigned month, otherwise spread across the year.
  if (tx.frequency === CategoryFrequency.YEARLY) {
    return tx.assignedMonth != null
      ? { months: [tx.assignedMonth], perMonth: amount }
      : { months: ALL_MONTHS, perMonth: amount / 12 };
  }
  // Plain monthly items recur every month.
  return { months: ALL_MONTHS, perMonth: amount };
};

const buildMonthlyTotals = (
  transactions: BudgetItem[],
  categoryById: Map<string, Category>,
): MonthlyTotals[] => {
  const totals: MonthlyTotals[] = ALL_MONTHS.map((month) => ({
    month,
    income: 0,
    expense: 0,
  }));

  transactions.forEach((tx) => {
    if (!tx.categoryId) return;
    const category = categoryById.get(tx.categoryId);
    if (!category) return;

    const { months, perMonth } = monthlyContribution(tx);
    months.forEach((m) => {
      if (category.type === CategoryType.INCOME) {
        totals[m - 1].income += perMonth;
      } else if (category.type === CategoryType.EXPENSE) {
        totals[m - 1].expense += perMonth;
      }
    });
  });

  return totals;
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

interface YearlySummaryProps {
  totals: MonthlyTotals[];
  year: number;
}

function YearlySummary({ totals, year }: YearlySummaryProps) {
  const totalIncome = totals.reduce((sum, t) => sum + t.income, 0);
  const totalExpense = totals.reduce((sum, t) => sum + t.expense, 0);
  const totalBalance = totalIncome - totalExpense;
  const balanceClass = totalBalance >= 0 ? 'text-green-500' : 'text-red-500';

  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3
          className="text-accent"
          size={20}
          strokeWidth={ICON_STROKE}
        />
        <h3 className="heading-3">סיכום שנתי לפי חודש</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="label-text py-2">חודש</th>
              <th className="label-text py-2">הכנסות</th>
              <th className="label-text py-2">הוצאות</th>
              <th className="label-text py-2">יתרה</th>
            </tr>
          </thead>
          <tbody>
            {totals.map((t) => {
              const monthBalance = t.income - t.expense;
              const monthBalanceClass =
                monthBalance >= 0 ? 'text-green-500' : 'text-red-500';
              return (
                <tr key={t.month} className="border-b border-slate-100">
                  <td className="body-text py-2">
                    {HEBREW_MONTHS[t.month - 1]}
                  </td>
                  <td className="body-text py-2 text-green-500">
                    {currencyFormatter.format(t.income)}
                  </td>
                  <td className="body-text py-2 text-red-500">
                    {currencyFormatter.format(t.expense)}
                  </td>
                  <td className={`body-text py-2 ${monthBalanceClass}`}>
                    {currencyFormatter.format(monthBalance)}
                  </td>
                </tr>
              );
            })}
            <tr className="font-bold">
              <td className="body-text py-2">סך הכל {year}</td>
              <td className="body-text py-2 text-green-500">
                {currencyFormatter.format(totalIncome)}
              </td>
              <td className="body-text py-2 text-red-500">
                {currencyFormatter.format(totalExpense)}
              </td>
              <td className={`body-text py-2 ${balanceClass}`}>
                {currencyFormatter.format(totalBalance)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function TransactionsList({
  mode,
  transactions,
  categoryById,
  year,
}: TransactionsListProps) {
  const topExpenses = useMemo(
    () => buildRows(transactions, categoryById, CategoryType.EXPENSE, mode),
    [transactions, categoryById, mode],
  );
  const topIncome = useMemo(
    () => buildRows(transactions, categoryById, CategoryType.INCOME, mode),
    [transactions, categoryById, mode],
  );
  const monthlyTotals = useMemo(
    () =>
      mode === 'yearly'
        ? buildMonthlyTotals(transactions, categoryById)
        : [],
    [mode, transactions, categoryById],
  );

  return (
    <div className="space-y-6">
      {mode === 'yearly' && (
        <YearlySummary totals={monthlyTotals} year={year} />
      )}
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
