import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { BudgetLineItem } from '@gutplus/shared';
import { ICON_STROKE } from '../../../constants/ui';
import { formatILS } from '../budget.utils';
import BudgetLineItemRow from './BudgetLineItemRow';

export interface AccordionRowProps {
  label: string;
  value: number;
  valueClassName: string;
  /** Matching line items for this row's bucket, for the selected month. */
  items: BudgetLineItem[];
  onCommit: (
    budgetItemId: string,
    patch: { forecastOverride?: string } | { actual?: string },
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

  if (isEmpty) {
    return (
      <div className="flex items-center justify-between gap-3 bg-surface rounded-xl border border-slate-100 shadow-sm px-4 py-3">
        <span className="body-text-sm text-slate-600">{label}</span>
        <span className={`body-text font-semibold ${valueClassName}`}>
          {formatILS(value)}
        </span>
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
          <span className={`body-text font-semibold ${valueClassName}`}>
            {formatILS(value)}
          </span>
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
            <div className="px-3 pb-3 pt-1 space-y-2 border-t border-slate-100">
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
