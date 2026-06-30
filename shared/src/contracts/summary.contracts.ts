import type { SuccessResponse } from './common.contracts';

export interface SummaryIncomes {
  monthly: number;
  yearly: number;
}

/** A named expense category pulled out of the general buckets into its own row. */
export interface SummaryBreakout {
  name: string;
  amount: number;
}

export interface SummaryExpenses {
  /** General monthly expenses, excluding breakout categories. */
  monthly: number;
  /** General yearly expenses (= yearlySpread + yearlyThisMonth), excluding breakouts. */
  yearly: number;
  /** Yearly items spread evenly across 12 months (÷12), excluding breakouts. */
  yearlySpread: number;
  /** Yearly items anchored to this specific month (assigned/one-time), excluding breakouts. */
  yearlyThisMonth: number;
  holidays: number;
  installments: number;
  /** Non-debt named categories carved out for display (e.g. מעשרות). */
  breakouts: SummaryBreakout[];
}

export interface MonthlySummary {
  incomes: SummaryIncomes;
  expenses: SummaryExpenses;
  /** Total debt repayments (= debtRepaymentsMonthly + debtRepaymentsYearly). */
  debtRepayments: number;
  /** Debt-category items of MONTHLY frequency (plain recurring). */
  debtRepaymentsMonthly: number;
  /** Debt-category items of any non-monthly frequency (yearly-distributed, ÷12 dry-averaged). */
  debtRepaymentsYearly: number;
  balanceBeforeDebts: number;
  balanceAfterDebts: number;
}

export type GetSummaryResponse = SuccessResponse<MonthlySummary>;

/** Query params accepted by `GET /summary`. */
export interface GetSummaryQuery {
  month: number;
  year: number;
  /**
   * When true, disables dry-average and uses exact-timing semantics instead
   * (each item counted only in its real-world month, at its real amount).
   * Defaults to false/absent, which preserves the dry-average behavior used
   * by the monthly Snapshot cards.
   */
  exactTiming?: boolean;
}
