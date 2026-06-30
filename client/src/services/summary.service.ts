import axios from 'axios';
import { ENDPOINTS } from '@gutplus/shared';
import type { MonthlySummary } from '@gutplus/shared';

const apiUrl = (path: string): string =>
  import.meta.env.VITE_SERVER_URL + path;

const round2 = (n: number): number => Math.round(n * 100) / 100;

export const getSummary = async (
  month: number,
  year: number,
): Promise<MonthlySummary> => {
  const res = await axios.get(apiUrl(ENDPOINTS.summary.base), {
    params: { month, year },
  });
  return res.data.data as MonthlySummary;
};

/**
 * Fetches the exact-timing summary for a single month (dry-average disabled
 * server-side via `exactTiming=true`) — each item counted only in its
 * real-world month, at its real amount. Used by `getAnnualSummary`; not
 * intended for the monthly Snapshot cards (those use `getSummary`, which
 * keeps the dry-average default).
 */
const getExactTimingSummary = async (
  month: number,
  year: number,
): Promise<MonthlySummary> => {
  const res = await axios.get(apiUrl(ENDPOINTS.summary.base), {
    params: { month, year, exactTiming: true },
  });
  return res.data.data as MonthlySummary;
};

export interface AnnualSummary {
  /** Sum of incomes.yearly across all 12 calendar months (exact-timing). */
  totalIncome: number;
  /** Sum of expenses.yearly + holidays + installments + breakouts across all 12 calendar months (exact-timing). */
  totalExpenses: number;
  /** Sum of debtRepayments across all 12 calendar months (exact-timing). */
  totalDebtRepayments: number;
  /** totalIncome - totalExpenses. */
  balanceBeforeDebts: number;
  /** balanceBeforeDebts - totalDebtRepayments. */
  balanceAfterDebts: number;
}

/**
 * Fetches a strictly-annual summary for the given calendar year (Jan-Dec).
 *
 * Deliberately reads ONLY the non-monthly buckets from each month's
 * exact-timing summary (`incomes.yearly`, and
 * `expenses.yearly + holidays + installments + breakouts`) — `incomes.monthly`
 * and `expenses.monthly` are never read here, on purpose: blending a plain
 * monthly recurring item ×12 into an "annual" total would double-count money
 * that's already represented by the monthly Snapshot cards. This function
 * answers a different question — "how much did genuinely annual-type items
 * (yearly/holiday/installment/one-time) cost across the whole year" — using
 * each item's real-world month and real amount (exactTiming=true), not a
 * smoothed monthly share.
 */
export const getAnnualSummary = async (year: number): Promise<AnnualSummary> => {
  const calls = Array.from({ length: 12 }, (_, i) => getExactTimingSummary(i + 1, year));
  const summaries = await Promise.all(calls);

  let totalIncome = 0;
  let totalExpenses = 0;
  let totalDebtRepayments = 0;

  for (const s of summaries) {
    totalIncome += s.incomes.yearly;
    totalExpenses +=
      s.expenses.yearly +
      s.expenses.holidays +
      s.expenses.installments +
      (s.expenses.breakouts ?? []).reduce((sum, b) => sum + b.amount, 0);
    totalDebtRepayments += s.debtRepayments;
  }

  totalIncome = round2(totalIncome);
  totalExpenses = round2(totalExpenses);
  totalDebtRepayments = round2(totalDebtRepayments);
  const balanceBeforeDebts = round2(totalIncome - totalExpenses);
  const balanceAfterDebts = round2(balanceBeforeDebts - totalDebtRepayments);

  return {
    totalIncome,
    totalExpenses,
    totalDebtRepayments,
    balanceBeforeDebts,
    balanceAfterDebts,
  };
};
