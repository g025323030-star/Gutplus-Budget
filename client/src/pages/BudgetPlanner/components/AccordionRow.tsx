import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { BudgetLineItem } from '@gutplus/shared';
import { ICON_STROKE } from '../../../constants/ui';
import { formatILS, parseEnteredAmount, resolveLiveItemValue } from '../budget.utils';
import BudgetFieldsLegend from './BudgetFieldsLegend';
import BudgetLineItemRow from './BudgetLineItemRow';

export interface AccordionRowProps {
  label: string;
  value: number;
  valueClassName: string;
  /** Matching line items for this row's bucket, for the selected month. */
  items: BudgetLineItem[];
  onCommit: (
    budgetItemId: string,
    patch: { forecastOverride: string | null } | { actual: string | null },
  ) => Promise<void>;
}

/**
 * One Budget-page summary row (e.g. "הוצאות שוטפות"), expandable to reveal
 * the underlying `BudgetLineItem`s for the selected month. Visually and
 * behaviorally modeled on the now-retired `BudgetCategoryCards.CategoryAccordion`
 * (same chevron + Framer Motion expand/collapse timing/easing).
 *
 * When `items` is empty there is nothing useful to expand into, so the row
 * renders in a permanently-collapsed, non-interactive state (no button, no
 * chevron) rather than as a dead accordion shell.
 */
export default function AccordionRow({
  label,
  value,
  valueClassName,
  items,
  onCommit,
}: AccordionRowProps) {
  const [expanded, setExpanded] = useState(false);
  const isEmpty = items.length === 0;

  // Live total = sum of each item's resolved value, per a strict per-item
  // cascade: Actual -> New Forecast (override) -> Baseline. `0` is a valid
  // entered value at any tier and must not fall through to the next one —
  // only a missing/empty/non-numeric value falls through.
  const liveTotal = items.reduce((sum, item) => sum + resolveLiveItemValue(item), 0);
  // Baseline total = sum of each item's own baselineForecast, independent of
  // any override/actual — the fixed reference point shown when it diverges
  // from the live total.
  const baselineTotal = items.reduce(
    (sum, item) => sum + (parseEnteredAmount(item.baselineForecast) ?? 0),
    0,
  );
  const hasChanged = !isEmpty && Math.abs(liveTotal - baselineTotal) > 0.005;

  const totals = hasChanged ? (
    <>
      <span className="text-xs text-slate-400 tabular-nums whitespace-nowrap">
        תכנון ראשוני: {formatILS(baselineTotal)}
      </span>
      <span className={`body-text font-semibold ${valueClassName}`}>
        {formatILS(liveTotal)}
      </span>
    </>
  ) : (
    <span className={`body-text font-semibold ${valueClassName}`}>
      {isEmpty ? formatILS(value) : formatILS(liveTotal)}
    </span>
  );

  if (isEmpty) {
    return (
      <div className="flex items-center justify-between gap-3 bg-surface rounded-xl border border-slate-100 shadow-sm px-4 py-3">
        <span className="body-text-sm text-slate-600">{label}</span>
        <div className="flex items-center gap-2">{totals}</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-100 bg-surface shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50/70 transition-colors duration-200"
      >
        <span className="body-text-sm text-slate-600">{label}</span>
        <div className="flex items-center gap-2">
          {totals}
          <ChevronDown
            size={18}
            strokeWidth={ICON_STROKE}
            className={`text-slate-400 transition-transform duration-200 ${
              expanded ? '' : '-rotate-90'
            }`}
          />
        </div>
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-2 space-y-2 border-t border-slate-100">
              <BudgetFieldsLegend />
              {items.map((item) => (
                <BudgetLineItemRow key={item.budgetItemId} item={item} onCommit={onCommit} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
