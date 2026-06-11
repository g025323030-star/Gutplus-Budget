import axios from 'axios';
import { CategoryFrequency, ENDPOINTS } from '@gutplus/shared';
import type {
  BudgetItem,
  BudgetItemListItem,
  CreateBudgetItemInput,
  CreateBudgetItemResult,
  UpdateBudgetItemInput,
} from '@gutplus/shared';

const apiUrl = (path: string): string =>
  import.meta.env.VITE_SERVER_URL + path;

interface RawBudgetItem {
  id: string;
  amount: string;
  date: string;
  description: string;
  isCleared: boolean;
  frequency: CategoryFrequency;
  installmentsTotal?: number | null;
  installmentIndex?: number | null;
  installmentGroupId?: string | null;
  endDate?: string | null;
  household?: { id: string } | null;
  category?: { id: string } | null;
  account?: { id: string } | null;
  householdId?: string;
  categoryId?: string | null;
  accountId?: string | null;
  createdAt: string;
  updatedAt: string;
}

const normalizeBudgetItem = (raw: RawBudgetItem): BudgetItem => ({
  id: raw.id,
  amount: raw.amount,
  date: raw.date,
  description: raw.description,
  isCleared: raw.isCleared,
  frequency: raw.frequency ?? CategoryFrequency.MONTHLY,
  installmentsTotal: raw.installmentsTotal ?? null,
  installmentIndex: raw.installmentIndex ?? null,
  installmentGroupId: raw.installmentGroupId ?? null,
  endDate: raw.endDate ?? null,
  householdId: raw.household?.id ?? raw.householdId ?? '',
  categoryId: raw.category?.id ?? raw.categoryId ?? null,
  accountId: raw.account?.id ?? raw.accountId ?? null,
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt,
});

export const getBudgetItems = async (
  month?: number,
  year?: number,
): Promise<BudgetItemListItem[]> => {
  const params: Record<string, number> = {};
  if (month !== undefined) params['month'] = month;
  if (year !== undefined) params['year'] = year;
  const res = await axios.get(apiUrl(ENDPOINTS.budgetItems.base), { params });
  const list = (res.data.data as RawBudgetItem[]) ?? [];
  return list.map(normalizeBudgetItem);
};

export const createBudgetItem = async (
  input: CreateBudgetItemInput,
): Promise<CreateBudgetItemResult> => {
  const res = await axios.post(apiUrl(ENDPOINTS.budgetItems.base), input);
  const payload = res.data.data as
    | { kind: 'budgetItems'; data: RawBudgetItem[] };

  return {
    kind: 'budgetItems',
    data: payload.data.map(normalizeBudgetItem),
  };
};

export const updateBudgetItem = async (
  id: string,
  input: UpdateBudgetItemInput,
): Promise<BudgetItem> => {
  const res = await axios.put(
    `${apiUrl(ENDPOINTS.budgetItems.base)}/${id}`,
    input,
  );
  return normalizeBudgetItem(res.data.data as RawBudgetItem);
};

export const deleteBudgetItem = async (id: string): Promise<void> => {
  await axios.delete(`${apiUrl(ENDPOINTS.budgetItems.base)}/${id}`);
};
