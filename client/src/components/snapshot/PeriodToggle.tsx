import { Calendar } from 'lucide-react';
import { ICON_STROKE } from '../../constants/ui';

export type PeriodMode = 'monthly' | 'yearly';

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

interface PeriodToggleProps {
  mode: PeriodMode;
  onModeChange: (mode: PeriodMode) => void;
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
}

export default function PeriodToggle({
  mode,
  onModeChange,
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
}: PeriodToggleProps) {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear + 1; y >= currentYear - 5; y -= 1) {
    years.push(y);
  }

  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-wrap items-center gap-3">
      <div
        className="inline-flex items-center bg-background rounded-xl p-1"
        role="tablist"
        aria-label="בחירת תקופה"
      >
        <button
          type="button"
          role="tab"
          aria-pressed={mode === 'monthly'}
          aria-label="תצוגה חודשית"
          onClick={() => onModeChange('monthly')}
          className={`px-4 py-2 rounded-lg label-text transition-all duration-300 ${
            mode === 'monthly'
              ? 'bg-accent text-white shadow-sm'
              : 'text-primary hover:bg-slate-100'
          }`}
        >
          חודשי
        </button>
        <button
          type="button"
          role="tab"
          aria-pressed={mode === 'yearly'}
          aria-label="תצוגה שנתית"
          onClick={() => onModeChange('yearly')}
          className={`px-4 py-2 rounded-lg label-text transition-all duration-300 ${
            mode === 'yearly'
              ? 'bg-accent text-white shadow-sm'
              : 'text-primary hover:bg-slate-100'
          }`}
        >
          שנתי
        </button>
      </div>

      <div className="flex items-center gap-2 mr-auto">
        <Calendar className="text-accent" size={18} strokeWidth={ICON_STROKE} />
        {mode === 'monthly' && (
          <select
            value={selectedMonth}
            onChange={(e) => onMonthChange(Number(e.target.value))}
            aria-label="בחירת חודש"
            className="bg-background border border-slate-100 rounded-lg px-3 py-2 label-text text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {HEBREW_MONTHS.map((label, idx) => (
              <option key={label} value={idx + 1}>
                {label}
              </option>
            ))}
          </select>
        )}
        <select
          value={selectedYear}
          onChange={(e) => onYearChange(Number(e.target.value))}
          aria-label="בחירת שנה"
          className="bg-background border border-slate-100 rounded-lg px-3 py-2 label-text text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
