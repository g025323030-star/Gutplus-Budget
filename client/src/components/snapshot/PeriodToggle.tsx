export type PeriodMode = 'monthly' | 'yearly';

interface PeriodToggleProps {
  mode: PeriodMode;
  onModeChange: (mode: PeriodMode) => void;
}

export default function PeriodToggle({
  mode,
  onModeChange,
}: PeriodToggleProps) {
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
    </div>
  );
}
