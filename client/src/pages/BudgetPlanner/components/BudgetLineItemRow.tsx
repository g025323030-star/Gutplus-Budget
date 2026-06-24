import { useState } from 'react';
import type { BudgetLineItem } from '@gutplus/shared';
import { formatILS } from '../budget.utils';

export const INPUT_CLASS =
  'w-full bg-background/60 border border-slate-200 rounded-xl px-3 py-2 text-primary placeholder:text-slate-400 focus:outline-none focus:border-accent focus:bg-surface transition-all duration-200 text-sm';

export type SaveState = 'idle' | 'saving' | 'error';

export interface BudgetLineItemRowProps {
  item: BudgetLineItem;
  onCommit: (
    budgetItemId: string,
    patch: { forecastOverride?: string } | { actual?: string },
  ) => Promise<void>;
}

export default function BudgetLineItemRow({ item, onCommit }: BudgetLineItemRowProps) {
  const [currentForecastDraft, setCurrentForecastDraft] = useState(item.currentForecast);
  const [actualDraft, setActualDraft] = useState(item.actual ?? '');
  const [forecastSaveState, setForecastSaveState] = useState<SaveState>('idle');
  const [actualSaveState, setActualSaveState] = useState<SaveState>('idle');

  // Draft state is seeded from `item` once on mount only. Since each row is
  // keyed by `budgetItemId` and a given budget item only ever appears under
  // one month's line-items array, a month switch naturally unmounts/remounts
  // this component (fresh initial state) rather than requiring an
  // effect-based resync. A successful save updates `item` in the parent,
  // which is fine because by that point the draft already matches the saved
  // value.

  const hasActual = item.actual !== null && actualDraft.trim() !== '';
  const numericActual = Number(actualDraft);
  const numericForecast = Number(currentForecastDraft);

  const isExceedance =
    hasActual &&
    Number.isFinite(numericActual) &&
    Number.isFinite(numericForecast) &&
    numericActual.toFixed(2) !== numericForecast.toFixed(2) &&
    numericActual > numericForecast;

  const isUnderBudget =
    hasActual &&
    Number.isFinite(numericActual) &&
    Number.isFinite(numericForecast) &&
    numericActual.toFixed(2) !== numericForecast.toFixed(2) &&
    numericActual < numericForecast;

  // Neither exceedance nor under-budget (exact match, or actual not yet
  // entered/not a valid number) → neutral style, no subtext.
  const actualInputClass = isExceedance
    ? 'border-rose-300 text-rose-600 focus:border-rose-400'
    : isUnderBudget
      ? 'border-emerald-300 text-emerald-600 focus:border-emerald-400'
      : 'border-slate-200 text-primary focus:border-accent';

  const subtext = isExceedance
    ? 'חריגה מהתקציב שנקבע'
    : isUnderBudget
      ? `יתרת תקציב ע"ס ${formatILS(numericForecast - numericActual)}`
      : null;

  const handleForecastBlur = async () => {
    if (currentForecastDraft === item.currentForecast) return;
    const num = Number(currentForecastDraft);
    if (!Number.isFinite(num)) {
      setCurrentForecastDraft(item.currentForecast);
      return;
    }
    setForecastSaveState('saving');
    try {
      await onCommit(item.budgetItemId, { forecastOverride: num.toFixed(2) });
      setForecastSaveState('idle');
    } catch (err) {
      console.error('Error saving forecast override:', err);
      setForecastSaveState('error');
    }
  };

  const handleActualBlur = async () => {
    if (actualDraft === (item.actual ?? '')) return;
    if (actualDraft.trim() === '') return;
    const num = Number(actualDraft);
    if (!Number.isFinite(num)) {
      setActualDraft(item.actual ?? '');
      return;
    }
    setActualSaveState('saving');
    try {
      await onCommit(item.budgetItemId, { actual: num.toFixed(2) });
      setActualSaveState('idle');
    } catch (err) {
      console.error('Error saving actual:', err);
      setActualSaveState('error');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-3 md:items-start px-3 py-3 rounded-xl bg-slate-50/60 border border-slate-100">
      <div className="flex items-center">
        <span className="body-text-sm text-primary truncate">{item.description}</span>
      </div>

      <div>
        <span className="label-text block mb-1 md:hidden">תחזית בסיס</span>
        <span dir="ltr" className="body-text-sm tabular-nums text-slate-500 block">
          {formatILS(Number(item.baselineForecast) || 0)}
        </span>
      </div>

      <div>
        <span className="label-text block mb-1 md:hidden">תחזית נוכחית</span>
        <input
          type="text"
          inputMode="decimal"
          dir="ltr"
          value={currentForecastDraft}
          onChange={(e) => setCurrentForecastDraft(e.target.value)}
          onBlur={handleForecastBlur}
          aria-label="תחזית נוכחית"
          className={INPUT_CLASS}
        />
        {forecastSaveState === 'error' && (
          <p className="body-text-sm text-rose-500 mt-1">שגיאה בשמירה, נסה שוב</p>
        )}
      </div>

      <div>
        <span className="label-text block mb-1 md:hidden">בפועל</span>
        <input
          type="text"
          inputMode="decimal"
          dir="ltr"
          value={actualDraft}
          onChange={(e) => setActualDraft(e.target.value)}
          onBlur={handleActualBlur}
          placeholder="—"
          aria-label="בפועל"
          className={`${INPUT_CLASS} ${actualInputClass}`}
        />
        {subtext && (
          <p
            className={`body-text-sm mt-1 ${
              isExceedance ? 'text-rose-500' : 'text-emerald-600'
            }`}
          >
            {subtext}
          </p>
        )}
        {actualSaveState === 'error' && (
          <p className="body-text-sm text-rose-500 mt-1">שגיאה בשמירה, נסה שוב</p>
        )}
      </div>
    </div>
  );
}
