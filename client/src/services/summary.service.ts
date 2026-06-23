import axios from 'axios';
import { ENDPOINTS } from '@gutplus/shared';
import type { MonthlySummary } from '@gutplus/shared';

const apiUrl = (path: string): string =>
  import.meta.env.VITE_SERVER_URL + path;

const emptySummary = (): MonthlySummary => ({
  incomes: { monthly: 0, yearly: 0 },
  expenses: {
    monthly: 0,
    yearly: 0,
    yearlySpread: 0,
    yearlyThisMonth: 0,
    holidays: 0,
    installments: 0,
    breakouts: [],
  },
  debtRepayments: 0,
  balanceBeforeDebts: 0,
  balanceAfterDebts: 0,
});

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

// Sums several monthly summaries into one aggregate (used for the yearly view,
// which rolls up 12 sequential months).
export const aggregateSummaries = (
  summaries: MonthlySummary[],
): MonthlySummary =>
  summaries.reduce<MonthlySummary>((acc, s) => {
    acc.incomes.monthly = round2(acc.incomes.monthly + s.incomes.monthly);
    acc.incomes.yearly = round2(acc.incomes.yearly + s.incomes.yearly);
    acc.expenses.monthly = round2(acc.expenses.monthly + s.expenses.monthly);
    acc.expenses.yearly = round2(acc.expenses.yearly + s.expenses.yearly);
    acc.expenses.yearlySpread = round2(
      acc.expenses.yearlySpread + (s.expenses.yearlySpread ?? 0),
    );
    acc.expenses.yearlyThisMonth = round2(
      acc.expenses.yearlyThisMonth + (s.expenses.yearlyThisMonth ?? 0),
    );
    acc.expenses.holidays = round2(acc.expenses.holidays + s.expenses.holidays);
    acc.expenses.installments = round2(
      acc.expenses.installments + s.expenses.installments,
    );
    for (const b of s.expenses.breakouts ?? []) {
      const existing = acc.expenses.breakouts.find((x) => x.name === b.name);
      if (existing) {
        existing.amount = round2(existing.amount + b.amount);
      } else {
        acc.expenses.breakouts.push({ name: b.name, amount: b.amount });
      }
    }
    acc.debtRepayments = round2(acc.debtRepayments + s.debtRepayments);
    acc.balanceBeforeDebts = round2(
      acc.balanceBeforeDebts + s.balanceBeforeDebts,
    );
    acc.balanceAfterDebts = round2(acc.balanceAfterDebts + s.balanceAfterDebts);
    return acc;
  }, emptySummary());

// Fetches a rolling 12-month window starting at the given month/year and
// returns the aggregated summary.
export const getRollingYearSummary = async (
  startMonth: number,
  startYear: number,
): Promise<MonthlySummary> => {
  const calls = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(startYear, startMonth - 1 + i, 1);
    return getSummary(d.getMonth() + 1, d.getFullYear());
  });
  const summaries = await Promise.all(calls);
  return aggregateSummaries(summaries);
};
