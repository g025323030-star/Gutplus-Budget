import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  LayoutDashboard,
  Scale,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import type { BudgetItem, Category, MonthlySummary } from '@gutplus/shared';
import { ICON_STROKE } from '../constants/ui';
import { getBudgetItems } from '../services/budget-items.service';
import { getCategories } from '../services/categories.service';
import { getSummary, getAnnualSummary } from '../services/summary.service';
import type { AnnualSummary } from '../services/summary.service';
import PeriodToggle from '../components/snapshot/PeriodToggle';
import type { PeriodMode } from '../components/snapshot/PeriodToggle';
import SnapshotMonthlyOverview from '../components/snapshot/SnapshotMonthlyOverview';
import CategoryPieChart from '../components/snapshot/CategoryPieChart';
import TransactionsList from '../components/snapshot/TransactionsList';

const currencyFormatter = new Intl.NumberFormat('he-IL', {
  style: 'currency',
  currency: 'ILS',
  maximumFractionDigits: 0,
});
const formatILS = (value: number): string => currencyFormatter.format(value);

interface AnnualKpiCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  valueClassName: string;
}

// A single macro card — matches BudgetKpiCards.tsx's KpiCard visual pattern
// (label + icon header, one bold figure), without importing from BudgetPlanner/.
function AnnualKpiCard({ label, value, icon, valueClassName }: AnnualKpiCardProps) {
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

interface AnnualSummaryCardsProps {
  summary: AnnualSummary;
}

// Strictly 3 macro cards — Total Income / Annual Expenses / Net Balance —
// sourced from the existing AnnualSummary shape. Debt repayments are folded
// into "Net Balance" (balanceAfterDebts already nets them out) rather than
// shown as a separate 4th card; they remain visible in the monthly overview.
function AnnualSummaryCards({ summary }: AnnualSummaryCardsProps) {
  const balanceClass =
    summary.balanceAfterDebts >= 0 ? 'text-green-500' : 'text-red-500';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <AnnualKpiCard
        label="סך הכנסות שנתיות"
        value={summary.totalIncome}
        icon={
          <TrendingUp
            className="text-green-500"
            size={22}
            strokeWidth={ICON_STROKE}
          />
        }
        valueClassName="text-green-500"
      />
      <AnnualKpiCard
        label="הוצאות שנתיות"
        value={summary.totalExpenses}
        icon={
          <TrendingDown
            className="text-red-500"
            size={22}
            strokeWidth={ICON_STROKE}
          />
        }
        valueClassName="text-red-500"
      />
      <AnnualKpiCard
        label="יתרה שנתית נטו"
        value={summary.balanceAfterDebts}
        icon={
          <Scale className="text-accent" size={22} strokeWidth={ICON_STROKE} />
        }
        valueClassName={balanceClass}
      />
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
              <SnapshotMonthlyOverview summary={summary} />
            )}
            {mode === 'yearly' && annualSummary && (
              <AnnualSummaryCards summary={annualSummary} />
            )}

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
