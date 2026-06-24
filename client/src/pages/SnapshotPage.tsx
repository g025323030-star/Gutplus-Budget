import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  LayoutDashboard,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import type { BudgetItem, Category, MonthlySummary } from '@gutplus/shared';
import { ICON_STROKE } from '../constants/ui';
import { getBudgetItems } from '../services/budget-items.service';
import { getCategories } from '../services/categories.service';
import { getSummary, getAnnualSummary } from '../services/summary.service';
import type { AnnualSummary } from '../services/summary.service';
import PeriodToggle from '../components/snapshot/PeriodToggle';
import type { PeriodMode } from '../components/snapshot/PeriodToggle';
import SummaryCards from '../components/snapshot/SummaryCards';
import CategoryPieChart from '../components/snapshot/CategoryPieChart';
import TransactionsList from '../components/snapshot/TransactionsList';

const currencyFormatter = new Intl.NumberFormat('he-IL', {
  style: 'currency',
  currency: 'ILS',
  maximumFractionDigits: 0,
});
const formatILS = (value: number): string => currencyFormatter.format(value);

interface AnnualSummaryCardProps {
  summary: AnnualSummary;
}

// Dedicated annual breakdown — strictly annual-type totals only (yearly /
// holiday / installment / one-time items, real exact-timing amounts, summed
// across the calendar year). Deliberately not a reuse of SummaryCards, which
// is shaped around the monthly dry-average buckets.
function AnnualSummaryCard({ summary }: AnnualSummaryCardProps) {
  const balanceClass =
    summary.balanceAfterDebts >= 0 ? 'text-green-500' : 'text-red-500';

  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="label-text">סיכום שנתי</span>
        <Wallet className="text-accent" size={22} strokeWidth={ICON_STROKE} />
      </div>
      <div className="flex items-center justify-between gap-3 py-1.5">
        <span className="body-text-sm text-slate-500 flex items-center gap-2">
          <TrendingUp
            className="text-green-500"
            size={18}
            strokeWidth={ICON_STROKE}
          />
          הכנסות שנתיות
        </span>
        <span className="body-text font-medium text-green-500">
          {formatILS(summary.totalIncome)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 py-1.5">
        <span className="body-text-sm text-slate-500 flex items-center gap-2">
          <TrendingDown
            className="text-red-500"
            size={18}
            strokeWidth={ICON_STROKE}
          />
          הוצאות שנתיות
        </span>
        <span className="body-text font-medium text-red-500">
          {formatILS(summary.totalExpenses)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 py-1.5">
        <span className="body-text-sm text-slate-500">החזרי חובות</span>
        <span className="body-text font-medium text-primary">
          {formatILS(summary.totalDebtRepayments)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 mt-1.5 pt-2.5 border-t border-slate-100">
        <span className="body-text-sm text-slate-500">יתרה שנתית נטו</span>
        <p className={`heading-3 ${balanceClass}`}>
          {formatILS(summary.balanceAfterDebts)}
        </p>
      </div>
    </div>
  );
}

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

// Each budget item is a recurring/averaged forecast entry rather than a dated
// transaction. Per the product model, every item is shown except:
//   • installment payments — anchored to a single month via assignedMonth;
//   • endDate-bounded items — dropped once their expiration month has passed.
const filterToPeriod = (
  transactions: BudgetItem[],
  mode: PeriodMode,
  month: number,
  year: number,
): BudgetItem[] =>
  transactions.filter((tx) => {
    if (tx.endDate) {
      const end = new Date(tx.endDate);
      const periodStart =
        mode === 'monthly' ? new Date(year, month - 1, 1) : new Date(year, 0, 1);
      if (end < periodStart) return false;
    }
    if (tx.installmentGroupId != null) {
      return mode === 'yearly' || tx.assignedMonth === month;
    }
    return true;
  });

export default function SnapshotPage() {
  const now = new Date();
  const [mode, setMode] = useState<PeriodMode>('monthly');
  // No month/year picker — the page reflects the current period.
  const selectedMonth = now.getMonth() + 1;
  const selectedYear = now.getFullYear();

  const [transactions, setTransactions] = useState<BudgetItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [annualSummary, setAnnualSummary] = useState<AnnualSummary | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      setIsLoading(true);
      setError(null);

      const queryMonth = mode === 'monthly' ? selectedMonth : undefined;
      const queryYear = selectedYear;

      const summaryPromise =
        mode === 'monthly'
          ? getSummary(selectedMonth, selectedYear)
          : getAnnualSummary(selectedYear);

      const [txResult, catsResult, summaryResult] = await Promise.allSettled([
        getBudgetItems(queryMonth, queryYear),
        getCategories(),
        summaryPromise,
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

      if (summaryResult.status === 'fulfilled') {
        if (mode === 'monthly') {
          setSummary(summaryResult.value as MonthlySummary);
          setAnnualSummary(null);
        } else {
          setAnnualSummary(summaryResult.value as AnnualSummary);
          setSummary(null);
        }
      } else {
        console.error('Error loading summary:', summaryResult.reason);
        setSummary(null);
        setAnnualSummary(null);
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

      <PeriodToggle mode={mode} onModeChange={setMode} />

      {error && <ErrorBlock message={error} />}

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        !error && (
          <>
            {mode === 'monthly' && summary && (
              <SummaryCards summary={summary} />
            )}
            {mode === 'yearly' && annualSummary && (
              <AnnualSummaryCard summary={annualSummary} />
            )}

            <CategoryPieChart
              transactions={periodTransactions}
              categoryById={categoryById}
              mode={mode}
            />

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
