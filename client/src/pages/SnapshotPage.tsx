import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, LayoutDashboard } from 'lucide-react';
import type { BudgetItem, Category, MonthlySummary } from '@gutplus/shared';
import { ICON_STROKE } from '../constants/ui';
import { getBudgetItems } from '../services/budget-items.service';
import { getCategories } from '../services/categories.service';
import { getSummary } from '../services/summary.service';
import PeriodToggle from '../components/snapshot/PeriodToggle';
import type { PeriodMode } from '../components/snapshot/PeriodToggle';
import SnapshotSummaryCards from '../components/snapshot/SnapshotSummaryCards';
import CategoryPieChart from '../components/snapshot/CategoryPieChart';
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

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      setIsLoading(true);
      setError(null);

      const queryMonth = mode === 'monthly' ? selectedMonth : undefined;
      const queryYear = selectedYear;

      // The summary cards always show the dry-average monthly figure for the
      // current month — they have their own internal monthly/yearly/summary
      // toggle that just selects a subset of this same MonthlySummary, so no
      // separate annual fetch is needed regardless of the page's period mode.
      const [txResult, catsResult, summaryResult] = await Promise.allSettled([
        getBudgetItems(queryMonth, queryYear),
        getCategories(),
        getSummary(selectedMonth, selectedYear),
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
        setSummary(summaryResult.value);
      } else {
        console.error('Error loading summary:', summaryResult.reason);
        setSummary(null);
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
      {error && <ErrorBlock message={error} />}

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        !error && (
          <>
            {summary && <SnapshotSummaryCards summary={summary} />}

            {mode === 'monthly' && (
              <>
                <CategoryPieChart
                  transactions={periodTransactions}
                  categoryById={categoryById}
                  mode={mode}
                />

                <TransactionsList
                  mode={mode}
                  transactions={periodTransactions}
                  categoryById={categoryById}
                />
              </>
            )}
          </>
        )
      )}
    </div>
  );
}
