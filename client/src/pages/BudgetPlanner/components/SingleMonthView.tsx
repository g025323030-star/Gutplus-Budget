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
    patch: { forecastOverride?: string } | { actual?: string },
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
}: SingleMonthViewProps) {
  const incomeTotal = calculateIncomeTotal(data, monthIndex);
  const expenseTotal = calculateExpenseTotal(data, monthIndex);
  const expenseRows = [...data.expenseRows, data.debtRow];

  const handleCommit = async (
    budgetItemId: string,
    patch: { forecastOverride?: string } | { actual?: string },
  ): Promise<void> => {
    await upsertExecution(budgetItemId, month, year, patch);
    const next = lineItems.map((item) =>
      item.budgetItemId === budgetItemId ? { ...item, ...patch } : item,
    );
    onLineItemsChange(next);
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
