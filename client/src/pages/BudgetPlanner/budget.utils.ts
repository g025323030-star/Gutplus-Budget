import type { MonthlyForecast } from '@gutplus/shared';
import { HEBREW_MONTHS } from '../../constants/months';

export type ViewMode = 'dashboard' | 'sheet';

/** A single budget line: a label and one value per rolling-window month. */
export interface BudgetRow {
  key: string;
  label: string;
  values: number[];
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

const breakoutAmount = (month: MonthlyForecast, name: string): number =>
  (month.expenses.breakouts ?? []).find((b) => b.name === name)?.amount ?? 0;

/** Transforms the raw forecast into the rows/labels the views render. */
export function buildBudgetView(forecast: MonthlyForecast[]): BudgetViewData {
  const monthLabels = forecast.map(
    (m) => `${HEBREW_MONTHS[m.month - 1]} (${m.month})`,
  );

  const incomeRows: BudgetRow[] = [
    {
      key: 'income_monthly',
      label: 'הכנסות שוטפות חודשיות',
      values: forecast.map((m) => m.incomes.monthly),
    },
    {
      key: 'income_yearly',
      label: 'הכנסות שנתיות',
      values: forecast.map((m) => m.incomes.yearly),
    },
  ];

  const expenseRows: BudgetRow[] = [
    {
      key: 'expense_recurring',
      label: 'הוצאות שוטפות',
      values: forecast.map((m) => m.expenses.monthly + m.expenses.installments),
    },
    {
      key: 'expense_yearly_spread',
      label: 'הוצאות שנתיות (פריסה ל-12)',
      values: forecast.map((m) => m.expenses.yearlySpread),
    },
    {
      key: 'expense_yearly_this_month',
      label: 'הוצאות שנתיות שחלות החודש',
      values: forecast.map((m) => m.expenses.yearlyThisMonth),
    },
    {
      key: 'expense_holidays',
      label: 'הוצאות חגים',
      values: forecast.map((m) => m.expenses.holidays),
    },
    ...Object.entries(BREAKOUT_LABELS).map(([name, label]) => ({
      key: `breakout_${name}`,
      label,
      values: forecast.map((m) => breakoutAmount(m, name)),
    })),
  ];

  const debtRow: BudgetRow = {
    key: 'debt',
    label: 'החזרי חובות',
    values: forecast.map((m) => m.debtRepayments),
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
