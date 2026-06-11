import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, LayoutDashboard } from 'lucide-react';
import { CategoryFrequency, CategoryType } from '@gutplus/shared';
import type { BudgetItem, Category } from '@gutplus/shared';
import { ICON_STROKE } from '../constants/ui';
import { getBudgetItems } from '../services/budget-items.service';
import { getCategories } from '../services/categories.service';
import PeriodToggle from '../components/snapshot/PeriodToggle';
import type { PeriodMode } from '../components/snapshot/PeriodToggle';
import SummaryCards from '../components/snapshot/SummaryCards';
import CategoryPieChart from '../components/snapshot/CategoryPieChart';
import SnapshotCalendar from '../components/snapshot/SnapshotCalendar';
import TransactionsList from '../components/snapshot/TransactionsList';

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="bg-slate-100 animate-pulse rounded-2xl h-32"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-100 animate-pulse rounded-2xl h-72" />
        <div className="bg-slate-100 animate-pulse rounded-2xl h-72" />
      </div>
      <div className="bg-slate-100 animate-pulse rounded-2xl h-64" />
    </div>
  );
}

interface ErrorBlockProps {
  message: string;
}

function ErrorBlock({ message }: ErrorBlockProps) {
  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-red-100 p-6 flex items-center gap-3">
      <AlertCircle
        className="text-red-500"
        size={22}
        strokeWidth={ICON_STROKE}
      />
      <p className="body-text text-red-500">{message}</p>
    </div>
  );
}

const filterToPeriod = (
  transactions: BudgetItem[],
  mode: PeriodMode,
  month: number,
  year: number,
): BudgetItem[] =>
  transactions.filter((tx) => {
    const txDate = new Date(tx.date);
    if (txDate.getFullYear() !== year) return false;
    if (mode === 'monthly' && txDate.getMonth() + 1 !== month) return false;
    return true;
  });

export default function SnapshotPage() {
  const now = new Date();
  const [mode, setMode] = useState<PeriodMode>('monthly');
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  const [transactions, setTransactions] = useState<BudgetItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      setIsLoading(true);
      setError(null);

      const queryMonth = mode === 'monthly' ? selectedMonth : undefined;
      const queryYear = selectedYear;

      const [txResult, catsResult] = await Promise.allSettled([
        getBudgetItems(queryMonth, queryYear),
        getCategories(),
      ]);
      if (cancelled) return;

      if (catsResult.status === 'fulfilled') {
        setCategories(catsResult.value);
      } else {
        console.error('Error loading categories:', catsResult.reason);
      }

      if (txResult.status === 'fulfilled') {
        const realTx = txResult.value.filter(
          (item): item is BudgetItem =>
            (item as { isProjection?: boolean }).isProjection !== true,
        );
        setTransactions(realTx);
      } else {
        console.error('Error loading transactions:', txResult.reason);
        setTransactions([]);
        setError('שגיאה בטעינת הנתונים. נסה לרענן את הדף.');
      }

      setIsLoading(false);
    };

    fetchAll();

    return () => {
      cancelled = true;
    };
  }, [mode, selectedMonth, selectedYear]);

  const categoryById = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const periodTransactions = useMemo(
    () => filterToPeriod(transactions, mode, selectedMonth, selectedYear),
    [transactions, mode, selectedMonth, selectedYear],
  );

  const { incomeTotal, expenseTotal } = useMemo(() => {
    let income = 0;
    let expense = 0;
    const targetFrequency =
      mode === 'monthly'
        ? CategoryFrequency.MONTHLY
        : CategoryFrequency.YEARLY;
    periodTransactions.forEach((tx) => {
      if (tx.frequency !== targetFrequency) return;
      if (!tx.categoryId) return;
      const category = categoryById.get(tx.categoryId);
      if (!category) return;
      const amount = parseFloat(tx.amount) || 0;
      if (category.type === CategoryType.INCOME) income += amount;
      else if (category.type === CategoryType.EXPENSE) expense += amount;
    });
    return { incomeTotal: income, expenseTotal: expense };
  }, [periodTransactions, categoryById, mode]);

  const balance = incomeTotal - expenseTotal;

  return (
    <div className="p-6 md:p-8 space-y-6">
      <header className="flex items-center gap-3 mb-2">
        <LayoutDashboard
          className="text-accent"
          size={28}
          strokeWidth={ICON_STROKE}
        />
        <h1 className="heading-2">תמונת מצב</h1>
      </header>
      <p className="body-text-sm leading-relaxed">
        סקירה כוללת של ההכנסות וההוצאות שלך — חודשית או שנתית.
      </p>

      <PeriodToggle
        mode={mode}
        onModeChange={setMode}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthChange={setSelectedMonth}
        onYearChange={setSelectedYear}
      />

      {error && <ErrorBlock message={error} />}

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        !error && (
          <>
            <SummaryCards
              income={incomeTotal}
              expense={expenseTotal}
              balance={balance}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CategoryPieChart
                transactions={periodTransactions}
                categoryById={categoryById}
                mode={mode}
              />
              <SnapshotCalendar
                mode={mode}
                year={selectedYear}
                month={selectedMonth}
                transactions={periodTransactions}
                categoryById={categoryById}
              />
            </div>

            <TransactionsList
              mode={mode}
              transactions={periodTransactions}
              categoryById={categoryById}
              year={selectedYear}
            />
          </>
        )
      )}
    </div>
  );
}
