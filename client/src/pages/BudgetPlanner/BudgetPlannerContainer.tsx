import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  LayoutDashboard,
  TableProperties,
  Wallet,
} from 'lucide-react';
import type { BudgetLineItem, MonthlyForecast } from '@gutplus/shared';
import { ICON_STROKE } from '../../constants/ui';
import { getBudgetForecast } from '../../services/forecast.service';
import { getLineItems } from '../../services/execution.service';
import { buildBudgetView, type ViewMode } from './budget.utils';
import MonthCarousel from './components/MonthCarousel';
import BudgetKpiCards from './components/BudgetKpiCards';
import SummaryCards from './components/SummaryCards';
import BudgetComparisonChart from './components/BudgetComparisonChart';
import SingleMonthView from './components/SingleMonthView';
import YearlySpreadsheetView from './components/YearlySpreadsheetView';

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-slate-100 animate-pulse rounded-2xl h-12" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-slate-100 animate-pulse rounded-2xl h-32" />
        ))}
      </div>
      <div className="bg-slate-100 animate-pulse rounded-2xl h-72" />
    </div>
  );
}

interface ViewSwitcherProps {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

function ViewSwitcher({ viewMode, onChange }: ViewSwitcherProps) {
  const tabClass = (active: boolean): string =>
    `flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 body-text-sm ${
      active ? 'bg-surface shadow-sm text-[#2D5A59] font-medium' : 'text-slate-500'
    }`;

  return (
    <div className="inline-flex items-center gap-1 rounded-xl bg-slate-200/60 p-1">
      <button
        type="button"
        onClick={() => onChange('dashboard')}
        aria-pressed={viewMode === 'dashboard'}
        className={tabClass(viewMode === 'dashboard')}
      >
        <LayoutDashboard size={18} strokeWidth={ICON_STROKE} />
        חודש ממוקד
      </button>
      <button
        type="button"
        onClick={() => onChange('sheet')}
        aria-pressed={viewMode === 'sheet'}
        className={tabClass(viewMode === 'sheet')}
      >
        <TableProperties size={18} strokeWidth={ICON_STROKE} />
        תצוגה שנתית מלאה
      </button>
    </div>
  );
}

export default function BudgetPlannerContainer() {
  const [forecast, setForecast] = useState<
    Awaited<ReturnType<typeof getBudgetForecast>>
  >([]);
  // Line items per rolling-window month, indexed the same way as `forecast`
  // (lineItemsByMonth[i] are the items for forecast[i]).
  const [lineItemsByMonth, setLineItemsByMonth] = useState<BudgetLineItem[][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedMonth, setSelectedMonth] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');

  // Shared fetch core for both the initial load and silent background
  // refreshes after an edit — always re-fetches the full 12-month forecast
  // plus every month's line items, since a single item's edit can shift a
  // yearly-spread item's redistribution across OTHER months too (server-side
  // recompute), which only a fresh fetch can surface.
  const fetchBudgetData = async (): Promise<{
    months: MonthlyForecast[];
    lineItemsPerMonth: BudgetLineItem[][];
  }> => {
    const months = await getBudgetForecast();
    const lineItemsPerMonth = await Promise.all(
      months.map((m) => getLineItems(m.month, m.year)),
    );
    return { months, lineItemsPerMonth };
  };

  useEffect(() => {
    let cancelled = false;
    const loadInitial = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { months, lineItemsPerMonth } = await fetchBudgetData();
        if (cancelled) return;
        setForecast(months);
        setLineItemsByMonth(lineItemsPerMonth);
      } catch (err) {
        console.error('Error loading budget forecast:', err);
        if (!cancelled) setError('שגיאה בטעינת התקציב. נסה לרענן את הדף.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    loadInitial();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cross-view reactivity fix: after a successful edit in the monthly
  // accordion view, re-fetch the forecast + every month's line items in the
  // background (no loading skeleton, no error banner) so the Yearly
  // Spreadsheet view — and any other month's accordion — picks up the change
  // immediately instead of requiring a manual page reload. This is the
  // manual equivalent of "invalidate both query caches" in a codebase with
  // no query-caching library (no React Query here — data fetching is plain
  // useState/useEffect throughout).
  const refetchBudgetData = useCallback(async () => {
    try {
      const { months, lineItemsPerMonth } = await fetchBudgetData();
      setForecast(months);
      setLineItemsByMonth(lineItemsPerMonth);
    } catch (err) {
      console.error('Error refreshing budget data after edit:', err);
      // Keep showing the existing (already-optimistically-updated) state —
      // a background refresh failing shouldn't surface a page-level error.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const data = useMemo(() => buildBudgetView(forecast), [forecast]);
  const hasData = forecast.length > 0;

  const selectedMonthMeta = forecast[selectedMonth];
  const selectedLineItems = lineItemsByMonth[selectedMonth] ?? [];

  const handleLineItemsChange = (monthIndex: number, items: BudgetLineItem[]) => {
    setLineItemsByMonth((prev) => {
      const next = [...prev];
      next[monthIndex] = items;
      return next;
    });
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <header className="flex items-center gap-3">
        <Wallet className="text-[#2D5A59]" size={28} strokeWidth={ICON_STROKE} />
        <h1 className="heading-2">דף התקציב השנתי</h1>
      </header>
      <p className="body-text-sm leading-relaxed">
        סיכום תזרים שנתי קדימה ל-12 חודשים, מבוסס על היעדים שהוגדרו (קריאה בלבד).
      </p>

      {!isLoading && !error && hasData && (
        <ViewSwitcher viewMode={viewMode} onChange={setViewMode} />
      )}

      {error && (
        <div className="bg-surface rounded-2xl shadow-sm border border-red-100 p-6 flex items-center gap-3">
          <AlertCircle className="text-red-500" size={22} strokeWidth={ICON_STROKE} />
          <p className="body-text text-red-500">{error}</p>
        </div>
      )}

      {isLoading ? (
        <LoadingSkeleton />
      ) : !error && !hasData ? (
        <div className="bg-surface rounded-2xl shadow-sm border border-slate-100 p-10 text-center">
          <p className="body-text text-slate-500">
            אין עדיין נתונים להצגה. הוסיפו הכנסות והוצאות כדי לבנות את התחזית.
          </p>
        </div>
      ) : (
        !error &&
        hasData && (
          <>
            {viewMode === 'dashboard' ? (
              <>
                <MonthCarousel
                  monthLabels={data.monthLabels}
                  selectedMonth={selectedMonth}
                  onSelect={setSelectedMonth}
                />
                <SummaryCards
                  lineItems={selectedLineItems}
                  holidays={selectedMonthMeta?.holidays}
                />
                <SingleMonthView
                  data={data}
                  monthIndex={selectedMonth}
                  lineItems={selectedLineItems}
                  month={selectedMonthMeta?.month ?? 1}
                  year={selectedMonthMeta?.year ?? new Date().getFullYear()}
                  onLineItemsChange={(items) =>
                    handleLineItemsChange(selectedMonth, items)
                  }
                  onAfterCommit={refetchBudgetData}
                />
                <BudgetComparisonChart data={data} lineItemsByMonth={lineItemsByMonth} />
              </>
            ) : (
              <>
                <BudgetKpiCards
                  data={data}
                  monthIndex={selectedMonth}
                  period="year"
                />
                <YearlySpreadsheetView data={data} lineItemsByMonth={lineItemsByMonth} />
              </>
            )}
          </>
        )
      )}
    </div>
  );
}
