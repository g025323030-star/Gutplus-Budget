import { useMemo } from 'react';
import { CalendarDays } from 'lucide-react';
import { CategoryType } from '@gutplus/shared';
import type { Category, BudgetItem } from '@gutplus/shared';
import { ICON_STROKE } from '../../constants/ui';

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

const DAY_HEADERS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

type PeriodMode = 'monthly' | 'yearly';

interface SnapshotCalendarProps {
  mode: PeriodMode;
  year: number;
  month: number;
  transactions: BudgetItem[];
  categoryById: Map<string, Category>;
}

interface DayCell {
  day: number;
  income: number;
  expense: number;
  color: 'green' | 'yellow' | 'neutral';
}

const daysInMonth = (month: number, year: number): number =>
  new Date(year, month, 0).getDate();

const buildMonthCells = (
  month: number,
  year: number,
  transactions: BudgetItem[],
  categoryById: Map<string, Category>,
): DayCell[] => {
  const totalDays = daysInMonth(month, year);
  const cells: DayCell[] = Array.from({ length: totalDays }, (_, i) => ({
    day: i + 1,
    income: 0,
    expense: 0,
    color: 'neutral',
  }));

  transactions.forEach((tx) => {
    if (!tx.categoryId) return;
    const category = categoryById.get(tx.categoryId);
    if (!category) return;

    const txDate = new Date(tx.date);
    if (
      txDate.getFullYear() !== year ||
      txDate.getMonth() + 1 !== month
    )
      return;

    const dayIdx = txDate.getDate() - 1;
    if (dayIdx < 0 || dayIdx >= totalDays) return;

    const amount = parseFloat(tx.amount) || 0;
    if (category.type === CategoryType.INCOME) {
      cells[dayIdx].income += amount;
    } else if (category.type === CategoryType.EXPENSE) {
      cells[dayIdx].expense += amount;
    }
  });

  cells.forEach((cell) => {
    if (cell.income > 0) {
      cell.color = 'green';
    } else if (cell.expense > 0) {
      cell.color = 'yellow';
    }
  });

  return cells;
};

const colorClass = (color: DayCell['color']): string => {
  switch (color) {
    case 'green':
      return 'bg-green-500 text-white';
    case 'yellow':
      return 'bg-yellow-500 text-primary';
    default:
      return 'bg-slate-50 text-slate-400';
  }
};

const currencyFormatter = new Intl.NumberFormat('he-IL', {
  style: 'currency',
  currency: 'ILS',
  maximumFractionDigits: 0,
});

const dayTitle = (cell: DayCell): string =>
  `יום ${cell.day} — הוצאות ${currencyFormatter.format(
    cell.expense,
  )}, הכנסות ${currencyFormatter.format(cell.income)}`;

interface MonthGridProps {
  month: number;
  year: number;
  cells: DayCell[];
  compact?: boolean;
}

function MonthGrid({ month, year, cells, compact = false }: MonthGridProps) {
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  const leadingBlanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const cellSize = compact
    ? 'aspect-square flex items-center justify-center rounded-md text-[10px]'
    : 'aspect-square flex items-center justify-center rounded-lg text-sm';

  return (
    <div>
      {compact && (
        <p className="label-text text-center mb-2">
          {HEBREW_MONTHS[month - 1]}
        </p>
      )}
      <div className="grid grid-cols-7 gap-1">
        {DAY_HEADERS.map((label) => (
          <div
            key={label}
            className={`text-center text-slate-400 ${
              compact ? 'text-[10px]' : 'body-text-sm'
            }`}
          >
            {label}
          </div>
        ))}
        {leadingBlanks.map((i) => (
          <div key={`blank-${i}`} className={cellSize} />
        ))}
        {cells.map((cell) => (
          <div
            key={cell.day}
            title={dayTitle(cell)}
            className={`${cellSize} ${colorClass(cell.color)} transition-colors duration-200`}
          >
            {cell.day}
          </div>
        ))}
      </div>
    </div>
  );
}

function CalendarLegend() {
  const items: Array<{ color: string; label: string }> = [
    { color: 'bg-green-500', label: 'הכנסה' },
    { color: 'bg-yellow-500', label: 'הוצאה' },
  ];
  return (
    <div className="flex flex-wrap items-center gap-3 mt-4">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1">
          <span
            className={`inline-block w-3 h-3 rounded ${item.color}`}
            aria-hidden
          />
          <span className="body-text-sm">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function SnapshotCalendar({
  mode,
  year,
  month,
  transactions,
  categoryById,
}: SnapshotCalendarProps) {
  const monthlyCells = useMemo(
    () => buildMonthCells(month, year, transactions, categoryById),
    [month, year, transactions, categoryById],
  );

  const yearlyCellsByMonth = useMemo(() => {
    if (mode !== 'yearly') return null;
    const map = new Map<number, DayCell[]>();
    for (let m = 1; m <= 12; m += 1) {
      map.set(
        m,
        buildMonthCells(m, year, transactions, categoryById),
      );
    }
    return map;
  }, [mode, year, transactions, categoryById]);

  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays
          className="text-accent"
          size={20}
          strokeWidth={ICON_STROKE}
        />
        <h2 className="heading-3">
          {mode === 'monthly'
            ? `${HEBREW_MONTHS[month - 1]} ${year}`
            : `סיכום שנת ${year}`}
        </h2>
      </div>

      {mode === 'monthly' ? (
        <MonthGrid month={month} year={year} cells={monthlyCells} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <MonthGrid
              key={m}
              month={m}
              year={year}
              cells={yearlyCellsByMonth?.get(m) ?? []}
              compact
            />
          ))}
        </div>
      )}

      <CalendarLegend />
    </div>
  );
}
