import {
  calculateExpenseTotal,
  calculateIncomeTotal,
  getMonthlyBalance,
  type BudgetRow,
  type BudgetViewData,
} from '../budget.utils';

interface YearlySpreadsheetViewProps {
  data: BudgetViewData;
}

// Never render NaN/null/undefined: fall back to a clean dash. Zero is also shown
// as a dash to keep the dense grid readable.
const cell = (value: number): string => {
  if (value == null || !Number.isFinite(value) || value === 0) {
    return '–';
  }
  return Math.round(value).toLocaleString('he-IL');
};

// Sticky first column: stays fixed on horizontal scroll, with a subtle shadow on
// its left edge to separate it from the scrolling cells.
const STICKY_LABEL =
  'sticky right-0 z-10 px-4 py-3 text-right font-medium truncate shadow-[2px_0_5px_rgba(0,0,0,0.05)]';

const DATA_CELL = 'px-4 py-3 text-center font-medium tabular-nums';

function ValueCells({
  values,
  className,
}: {
  values: number[];
  className: string;
}) {
  return (
    <>
      {values.map((v, i) => (
        <td key={i} className={`${DATA_CELL} ${className}`}>
          {cell(v)}
        </td>
      ))}
    </>
  );
}

function DataRow({
  row,
  valueClassName,
}: {
  row: BudgetRow;
  valueClassName: string;
}) {
  return (
    <tr className="group border-t border-slate-100 hover:bg-slate-50">
      <td className={`${STICKY_LABEL} bg-white text-slate-600 group-hover:bg-slate-50`}>
        {row.label}
      </td>
      <ValueCells values={row.values} className={`text-slate-500 ${valueClassName}`} />
    </tr>
  );
}

export default function YearlySpreadsheetView({
  data,
}: YearlySpreadsheetViewProps) {
  const { monthLabels } = data;
  const monthIdx = monthLabels.map((_, i) => i);

  const incomeTotals = monthIdx.map((i) => calculateIncomeTotal(data, i));
  const expenseTotals = monthIdx.map((i) => calculateExpenseTotal(data, i));
  const balances = monthIdx.map((i) => getMonthlyBalance(data, i));

  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="sticky right-0 z-10 bg-slate-50 w-40 px-4 py-3 text-right font-semibold text-slate-500 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                קטגוריה <span className="text-slate-300 font-normal">(₪)</span>
              </th>
              {monthLabels.map((label) => (
                <th
                  key={label}
                  className="px-4 py-3 text-center font-semibold text-slate-500 whitespace-nowrap"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Income */}
            {data.incomeRows.map((row) => (
              <DataRow key={row.key} row={row} valueClassName="text-emerald-600" />
            ))}
            <tr className="border-t border-slate-100 bg-emerald-50/50 font-semibold">
              <td
                className={`${STICKY_LABEL} bg-emerald-50/50 text-emerald-700`}
              >
                סך הכנסות
              </td>
              <ValueCells values={incomeTotals} className="text-emerald-700" />
            </tr>

            {/* Expenses */}
            {data.expenseRows.map((row) => (
              <DataRow key={row.key} row={row} valueClassName="text-rose-600" />
            ))}
            <DataRow row={data.debtRow} valueClassName="text-rose-600" />
            <tr className="border-t border-slate-100 bg-rose-50/50 font-semibold">
              <td className={`${STICKY_LABEL} bg-rose-50/50 text-rose-700`}>
                סך הוצאות
              </td>
              <ValueCells values={expenseTotals} className="text-rose-700" />
            </tr>

            {/* Net balance */}
            <tr className="border-t-2 border-amber-200 bg-amber-50 font-bold">
              <td className={`${STICKY_LABEL} bg-amber-50 text-[#2D5A59]`}>
                יתרה חודשית
              </td>
              {balances.map((b, i) => (
                <td
                  key={i}
                  className={`${DATA_CELL} font-bold ${
                    Number.isFinite(b) && b >= 0
                      ? 'text-emerald-700'
                      : 'text-rose-700'
                  }`}
                >
                  {cell(b)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
