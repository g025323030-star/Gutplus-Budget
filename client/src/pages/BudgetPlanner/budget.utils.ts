import type { BudgetLineItem, BudgetLineItemBucket, MonthlyForecast } from '@gutplus/shared';
import { HEBREW_MONTHS } from '../../constants/months';

export type ViewMode = 'dashboard' | 'sheet';

/** A single budget line: a label and one value per rolling-window month. */
export interface BudgetRow {
  key: string;
  label: string;
  values: number[];
  /**
   * Predicate selecting this row's matching `BudgetLineItem`s for the
   * accordion drill-down on the dashboard view (see `SingleMonthView.tsx`).
   * Optional because `YearlySpreadsheetView`/`BudgetKpiCards` don't need it.
   */
  matchesLineItem?: (item: BudgetLineItem) => boolean;
}

export interface BudgetViewData {
  /** Month labels, e.g. "יוני 2026", in rolling-window order. */
  monthLabels: string[];
  incomeRows: BudgetRow[];
  expenseRows: BudgetRow[];
  /** Debt repayments, kept on its own row (excluded from balanceBeforeDebts). */
  debtRow: BudgetRow;
}

/** Maps breakout category names → the label shown on the budget page. */
const BREAKOUT_LABELS: Record<string, string> = {
  'מעשרות וצדקה': 'מעשרות',
  'ירידת פריון עבודה': 'ירידת פריון עבודה',
};

export const formatILS = (value: number): string =>
  `${Math.round(value).toLocaleString('he-IL')} ₪`;

/**
 * Parses a decimal-string field into a number, treating `null`/`undefined`/
 * an empty/whitespace-only string/non-numeric text as "not entered" (`null`).
 * `0`/`"0"`/`"0.00"` parse to the number `0`, which is NOT `null` — a
 * deliberately entered zero must never be treated as "not entered".
 */
export function parseEnteredAmount(raw: string | null | undefined): number | null {
  if (raw === null || raw === undefined || raw.trim() === '') return null;
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
}

/**
 * Resolves one line item's single "live" value under a strict per-item
 * cascade: Actual ("בפועל") -> New Forecast / override ("תכנון חדש", i.e.
 * `currentForecast`) -> Baseline ("תכנון ראשוני"). Each tier is only skipped
 * when the value is genuinely missing/invalid, never merely falsy (`0` is a
 * valid, final answer at any tier). Used where forecast and actual need to
 * collapse into one blended number (e.g. an accordion row's live total).
 */
export function resolveLiveItemValue(item: BudgetLineItem): number {
  const actual = parseEnteredAmount(item.actual);
  if (actual !== null) return actual;

  const forecast = parseEnteredAmount(item.currentForecast);
  if (forecast !== null) return forecast;

  return parseEnteredAmount(item.baselineForecast) ?? 0;
}

/**
 * Resolves one line item's "planned" value only — New Forecast / override if
 * present, else Baseline. Deliberately ignores `actual`, unlike
 * `resolveLiveItemValue`: used where planned and actual must be shown as two
 * separate figures side by side (e.g. the top summary cards) rather than
 * blended into one.
 */
export function resolvePlannedItemValue(item: BudgetLineItem): number {
  const forecast = parseEnteredAmount(item.currentForecast);
  if (forecast !== null) return forecast;

  return parseEnteredAmount(item.baselineForecast) ?? 0;
}

/** Resolves one line item's logged actual only, or `0` if never entered. */
export function resolveActualItemValue(item: BudgetLineItem): number {
  return parseEnteredAmount(item.actual) ?? 0;
}

/** Every income-shaped `BudgetLineItemBucket`. */
export const INCOME_BUCKETS: BudgetLineItemBucket[] = ['incomeMonthly', 'incomeYearly'];
/**
 * Every expense-shaped `BudgetLineItemBucket` except debt — debt is a
 * separate financial obligation, not household consumption, and is handled
 * as its own bucket (`'debt'`) wherever the distinction matters.
 */
export const EXPENSE_BUCKETS: BudgetLineItemBucket[] = [
  'expenseMonthly',
  'expenseYearlySpread',
  'expenseYearlyThisMonth',
  'expenseHolidays',
  'expenseInstallments',
  'breakout',
];

/** Sums `resolvePlannedItemValue` across a list of line items. */
export const sumPlannedForItems = (items: BudgetLineItem[]): number =>
  items.reduce((sum, item) => sum + resolvePlannedItemValue(item), 0);

/** Sums `resolveActualItemValue` across a list of line items. */
export const sumActualForItems = (items: BudgetLineItem[]): number =>
  items.reduce((sum, item) => sum + resolveActualItemValue(item), 0);

const breakoutAmount = (month: MonthlyForecast, name: string): number =>
  (month.expenses.breakouts ?? []).find((b) => b.name === name)?.amount ?? 0;

/** Transforms the raw forecast into the rows/labels the views render. */
export function buildBudgetView(forecast: MonthlyForecast[]): BudgetViewData {
  const monthLabels = forecast.map(
    (m) => `${HEBREW_MONTHS[m.month - 1]} (${m.month})`,
  );

  const bucketIs = (bucket: BudgetLineItemBucket) => (item: BudgetLineItem) =>
    item.bucket === bucket;

  const incomeRows: BudgetRow[] = [
    {
      key: 'income_monthly',
      label: 'הכנסות שוטפות חודשיות',
      values: forecast.map((m) => m.incomes.monthly),
      matchesLineItem: bucketIs('incomeMonthly'),
    },
    {
      key: 'income_yearly',
      label: 'הכנסות שנתיות',
      values: forecast.map((m) => m.incomes.yearly),
      matchesLineItem: bucketIs('incomeYearly'),
    },
  ];

  const expenseRows: BudgetRow[] = [
    {
      key: 'expense_recurring',
      label: 'הוצאות שוטפות',
      values: forecast.map((m) => m.expenses.monthly + m.expenses.installments),
      matchesLineItem: (item) =>
        item.bucket === 'expenseMonthly' || item.bucket === 'expenseInstallments',
    },
    {
      key: 'expense_yearly_spread',
      label: 'הוצאות שנתיות (פריסה ל-12)',
      values: forecast.map((m) => m.expenses.yearlySpread),
      matchesLineItem: bucketIs('expenseYearlySpread'),
    },
    {
      key: 'expense_yearly_this_month',
      label: 'הוצאות שנתיות שחלות החודש',
      values: forecast.map((m) => m.expenses.yearlyThisMonth),
      matchesLineItem: bucketIs('expenseYearlyThisMonth'),
    },
    {
      key: 'expense_holidays',
      label: 'הוצאות חגים',
      values: forecast.map((m) => m.expenses.holidays),
      matchesLineItem: bucketIs('expenseHolidays'),
    },
    ...Object.entries(BREAKOUT_LABELS).map(([name, label]) => ({
      key: `breakout_${name}`,
      label,
      values: forecast.map((m) => breakoutAmount(m, name)),
      matchesLineItem: (item: BudgetLineItem) =>
        item.bucket === 'breakout' && item.breakoutName === name,
    })),
  ];

  const debtRow: BudgetRow = {
    key: 'debt',
    label: 'החזרי חובות',
    values: forecast.map((m) => m.debtRepayments),
    matchesLineItem: bucketIs('debt'),
  };

  return { monthLabels, incomeRows, expenseRows, debtRow };
}

const sumAt = (rows: BudgetRow[], monthIndex: number): number =>
  rows.reduce((sum, r) => sum + (r.values[monthIndex] ?? 0), 0);

/** Total income for a month (sum of income rows). */
export const calculateIncomeTotal = (
  data: BudgetViewData,
  monthIndex: number,
): number => sumAt(data.incomeRows, monthIndex);

/** Total outflow for a month: all expense rows + debt. */
export const calculateExpenseTotal = (
  data: BudgetViewData,
  monthIndex: number,
): number =>
  sumAt(data.expenseRows, monthIndex) + (data.debtRow.values[monthIndex] ?? 0);

/** Net leftover for a month (income − expenses − debt). */
export const getMonthlyBalance = (
  data: BudgetViewData,
  monthIndex: number,
): number =>
  Math.round(
    (calculateIncomeTotal(data, monthIndex) -
      calculateExpenseTotal(data, monthIndex)) *
      100,
  ) / 100;

const monthCount = (data: BudgetViewData): number => data.monthLabels.length;

const sumOverYear = (
  data: BudgetViewData,
  perMonth: (data: BudgetViewData, i: number) => number,
): number => {
  let total = 0;
  for (let i = 0; i < monthCount(data); i++) total += perMonth(data, i);
  return Math.round(total * 100) / 100;
};

/** Annual income (sum of every month). */
export const calculateIncomeTotalYear = (data: BudgetViewData): number =>
  sumOverYear(data, calculateIncomeTotal);

/** Annual outflow (sum of every month, incl. debt). */
export const calculateExpenseTotalYear = (data: BudgetViewData): number =>
  sumOverYear(data, calculateExpenseTotal);

/** Annual net balance. */
export const getYearlyBalance = (data: BudgetViewData): number =>
  Math.round(
    (calculateIncomeTotalYear(data) - calculateExpenseTotalYear(data)) * 100,
  ) / 100;
