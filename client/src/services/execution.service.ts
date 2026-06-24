import axios from 'axios';
import { ENDPOINTS } from '@gutplus/shared';
import type { BudgetLineItem } from '@gutplus/shared';

const apiUrl = (path: string): string =>
  import.meta.env.VITE_SERVER_URL + path;

// Fetches the resolved per-budget-item execution figures for a single month
// of the rolling forecast window (baseline/current forecast + actual).
export const getLineItems = async (
  month: number,
  year: number,
): Promise<BudgetLineItem[]> => {
  const res = await axios.get(
    apiUrl(`${ENDPOINTS.budgetExecutions.base}/line-items`),
    { params: { month, year } },
  );
  return (res.data.data?.lineItems as BudgetLineItem[]) ?? [];
};

export interface UpsertExecutionInput {
  forecastOverride?: string | null;
  actual?: string | null;
}

// Upserts one budget item's execution row for a given month (forecast
// override and/or actual — at least one of the two must be present).
export const upsertExecution = async (
  budgetItemId: string,
  month: number,
  year: number,
  input: UpsertExecutionInput,
): Promise<void> => {
  await axios.put(apiUrl(ENDPOINTS.budgetExecutions.base), {
    budgetItemId,
    month,
    year,
    ...input,
  });
};
