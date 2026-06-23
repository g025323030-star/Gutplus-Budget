import {
  calculateExpenseTotal,
  calculateIncomeTotal,
  formatILS,
  type BudgetRow,
  type BudgetViewData,
} from '../budget.utils';

interface SingleMonthViewProps {
  data: BudgetViewData;
  monthIndex: number;
}

interface LineProps {
  label: string;
  value: number;
  valueClassName: string;
}

function Line({ label, value, valueClassName }: LineProps) {
  return (
    <div className="flex items-center justify-between gap-3 bg-surface rounded-xl border border-slate-100 shadow-sm px-4 py-3">
      <span className="body-text-sm text-slate-600">{label}</span>
      <span className={`body-text font-semibold ${valueClassName}`}>
        {formatILS(value)}
      </span>
    </div>
  );
}

interface ColumnProps {
  title: string;
  total: number;
  accentClass: string;
  totalClass: string;
  rows: BudgetRow[];
  monthIndex: number;
  valueClassName: string;
}

function Column({
  title,
  total,
  accentClass,
  totalClass,
  rows,
  monthIndex,
  valueClassName,
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
          <Line
            key={row.key}
            label={row.label}
            value={row.values[monthIndex] ?? 0}
            valueClassName={valueClassName}
          />
        ))}
      </div>
    </div>
  );
}

export default function SingleMonthView({
  data,
  monthIndex,
}: SingleMonthViewProps) {
  const incomeTotal = calculateIncomeTotal(data, monthIndex);
  const expenseTotal = calculateExpenseTotal(data, monthIndex);
  const expenseRows = [...data.expenseRows, data.debtRow];

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
      />
      <Column
        title="הוצאות"
        total={expenseTotal}
        accentClass="border-rose-400"
        totalClass="text-rose-600"
        rows={expenseRows}
        monthIndex={monthIndex}
        valueClassName="text-rose-600"
      />
    </div>
  );
}
