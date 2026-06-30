import type { BudgetLineItem } from '@gutplus/shared';
import { upsertExecution } from '../../../services/execution.service';
import {
  calculateExpenseTotal,
  calculateIncomeTotal,
  formatILS,
  type BudgetRow,
  type BudgetViewData,
} from '../budget.utils';
import AccordionRow from './AccordionRow';

interface SingleMonthViewProps {
  data: BudgetViewData;
  monthIndex: number;
  /** The selected month's resolved line items (same indexing as `data`'s rows). */
  lineItems: BudgetLineItem[];
  /** Gregorian month/year for `monthIndex`, needed by `upsertExecution`. */
  month: number;
  year: number;
  onLineItemsChange: (items: BudgetLineItem[]) => void;
  /**
   * Called (not awaited by the UI interaction) after a successful commit, to
   * refresh the full forecast + every month's line items in the background —
   * a single edit can shift a yearly-spread item's redistribution across
   * other months too, which only a fresh fetch can surface (see
   * `BudgetPlannerContainer.tsx`'s `refetchBudgetData`).
   */
  onAfterCommit: () => Promise<void>;
}

interface ColumnProps {
  title: string;
  total: number;
  accentClass: string;
  totalClass: string;
  rows: BudgetRow[];
  monthIndex: number;
  valueClassName: string;
  lineItems: BudgetLineItem[];
  onCommit: (
    budgetItemId: string,
    patch: { forecastOverride: string | null } | { actual: string | null },
  ) => Promise<void>;
}

function Column({
  title,
  total,
  accentClass,
  totalClass,
  rows,
  monthIndex,
  valueClassName,
  lineItems,
  onCommit,
}: ColumnProps) {
  return (
    <div className={`border-r-4 ${accentClass} pr-4`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="heading-3">{title}</h3>
        <span className={`body-text font-bold ${totalClass}`}>
          {formatILS(total)}
        </span>
      </div>
      <div className="space-y-2">
        {rows.map((row) => (
          <AccordionRow
            key={row.key}
            label={row.label}
            value={row.values[monthIndex] ?? 0}
            valueClassName={valueClassName}
            items={row.matchesLineItem ? lineItems.filter(row.matchesLineItem) : []}
            onCommit={onCommit}
          />
        ))}
      </div>
    </div>
  );
}

export default function SingleMonthView({
  data,
  monthIndex,
  lineItems,
  month,
  year,
  onLineItemsChange,
  onAfterCommit,
}: SingleMonthViewProps) {
  const incomeTotal = calculateIncomeTotal(data, monthIndex);
  const expenseTotal = calculateExpenseTotal(data, monthIndex);
  const expenseRows = [...data.expenseRows, data.debtRow];

  const handleCommit = async (
    budgetItemId: string,
    patch: { forecastOverride: string | null } | { actual: string | null },
  ): Promise<void> => {
    await upsertExecution(budgetItemId, month, year, patch);
    // Map the PUT payload's field names to BudgetLineItem's own field names
    // ("forecastOverride" -> "currentForecast") — a plain `{ ...item, ...patch }`
    // spread would add a stray `forecastOverride` key instead of updating
    // `currentForecast`, leaving the displayed/aggregated forecast stale after
    // a save. A cleared override (`null`) reverts `currentForecast` to the
    // item's own `baselineForecast` (matching what a fresh fetch would show,
    // since the server falls back to baseline when no override row exists)
    // — `currentForecast` itself is never null per its type. `actual` IS
    // nullable, so a cleared actual is set to `null` directly.
    const next = lineItems.map((item) => {
      if (item.budgetItemId !== budgetItemId) return item;
      if ('forecastOverride' in patch) {
        return {
          ...item,
          currentForecast: patch.forecastOverride ?? item.baselineForecast,
        };
      }
      return { ...item, actual: patch.actual };
    });
    onLineItemsChange(next);

    // Fire-and-forget: don't block the input's own save-state on this — it
    // resolves once the optimistic update above is already visible, then
    // corrects/refreshes everything (other months, the Yearly Spreadsheet
    // view) once the background refetch completes.
    void onAfterCommit();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Column
        title="הכנסות"
        total={incomeTotal}
        accentClass="border-emerald-400"
        totalClass="text-emerald-600"
        rows={data.incomeRows}
        monthIndex={monthIndex}
        valueClassName="text-emerald-600"
        lineItems={lineItems}
        onCommit={handleCommit}
      />
      <Column
        title="הוצאות"
        total={expenseTotal}
        accentClass="border-rose-400"
        totalClass="text-rose-600"
        rows={expenseRows}
        monthIndex={monthIndex}
        valueClassName="text-rose-600"
        lineItems={lineItems}
        onCommit={handleCommit}
      />
    </div>
  );
}
