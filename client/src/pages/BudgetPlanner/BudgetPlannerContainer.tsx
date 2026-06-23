import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  LayoutDashboard,
  TableProperties,
  Wallet,
} from 'lucide-react';
import { ICON_STROKE } from '../../constants/ui';
import { getBudgetForecast } from '../../services/forecast.service';
import { buildBudgetView, type ViewMode } from './budget.utils';
import MonthCarousel from './components/MonthCarousel';
import BudgetKpiCards from './components/BudgetKpiCards';
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedMonth, setSelectedMonth] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');

  useEffect(() => {
    let cancelled = false;
    const fetchForecast = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const months = await getBudgetForecast();
        if (!cancelled) setForecast(months);
      } catch (err) {
        console.error('Error loading budget forecast:', err);
        if (!cancelled) setError('שגיאה בטעינת התקציב. נסה לרענן את הדף.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchForecast();
    return () => {
      cancelled = true;
    };
  }, []);

  const data = useMemo(() => buildBudgetView(forecast), [forecast]);
  const hasData = forecast.length > 0;

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
                <BudgetKpiCards
                  data={data}
                  monthIndex={selectedMonth}
                  period="month"
                />
                <SingleMonthView data={data} monthIndex={selectedMonth} />
              </>
            ) : (
              <>
                <BudgetKpiCards
                  data={data}
                  monthIndex={selectedMonth}
                  period="year"
                />
                <YearlySpreadsheetView data={data} />
              </>
            )}
          </>
        )
      )}
    </div>
  );
}
