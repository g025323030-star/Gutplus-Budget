import axios from 'axios';
import { ENDPOINTS } from '@gutplus/shared';
import type { BudgetPlan } from '@gutplus/shared';

const apiUrl = (path: string): string =>
  import.meta.env.VITE_SERVER_URL + path;

interface RawBudgetPlan {
  id: string;
  amount: string;
  month: number;
  year: number;
  household?: { id: string } | null;
  category?: { id: string } | null;
  householdId?: string;
  categoryId?: string | null;
  createdAt: string;
  updatedAt: string;
}

const normalizeBudgetPlan = (raw: RawBudgetPlan): BudgetPlan => ({
  id: raw.id,
  amount: raw.amount,
  month: raw.month,
  year: raw.year,
  householdId: raw.household?.id ?? raw.householdId ?? '',
  categoryId: raw.category?.id ?? raw.categoryId ?? null,
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt,
});

export const getBudgetPlans = async (
  month?: number,
  year?: number,
): Promise<BudgetPlan[]> => {
  const params: Record<string, number> = {};
  if (month !== undefined) params.month = month;
  if (year !== undefined) params.year = year;

  const res = await axios.get(apiUrl(ENDPOINTS.budgetPlans.base), { params });
  const list = (res.data.data as RawBudgetPlan[]) ?? [];
  return list.map(normalizeBudgetPlan);
};
