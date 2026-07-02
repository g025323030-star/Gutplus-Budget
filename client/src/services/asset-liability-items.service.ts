import axios from 'axios';
import { ENDPOINTS } from '@gutplus/shared';
import type { AssetLiabilityItem, AssetSide, AssetLiabilityCategory, CurrencyCode } from '@gutplus/shared';

const apiUrl = (path: string): string =>
  import.meta.env.VITE_SERVER_URL + path;

export interface CreateAssetLiabilityItemPayload {
  name: string;
  side: AssetSide;
  category: AssetLiabilityCategory;
  value: string;
  currency?: CurrencyCode;
  interestRate?: string | null;
  targetAmount?: string | null;
  urgencyLevel?: number | null;
  familyMemberId?: string | null;
  householdId: string;
  sourceBudgetItemId?: string | null;
  monthlyPayment?: string | null;
  lastDecreaseYearMonth?: string | null;
  syncToExpenses?: boolean;
  expenseEndDate?: string | null;
}

export interface UpdateAssetLiabilityItemPayload {
  name?: string;
  side?: AssetSide;
  category?: AssetLiabilityCategory;
  value?: string;
  currency?: CurrencyCode;
  interestRate?: string | null;
  targetAmount?: string | null;
  urgencyLevel?: number | null;
  familyMemberId?: string | null;
  sourceBudgetItemId?: string | null;
  monthlyPayment?: string | null;
  lastDecreaseYearMonth?: string | null;
}

interface RawItem {
  id: string;
  name: string;
  side: AssetSide;
  category: AssetLiabilityCategory;
  value: string;
  valueInIls: string;
  currency: CurrencyCode;
  interestRate: string | null;
  targetAmount: string | null;
  urgencyLevel: number | null;
  sourceBudgetItemId?: string | null;
  monthlyPayment?: string | null;
  lastDecreaseYearMonth?: string | null;
  familyMember?: { id: string; name: string } | null;
  familyMemberId?: string | null;
  familyMemberName?: string | null;
  household?: { id: string } | null;
  householdId?: string;
  createdAt: string;
  updatedAt: string;
}

const normalize = (raw: RawItem): AssetLiabilityItem => ({
  id: raw.id,
  name: raw.name,
  side: raw.side,
  category: raw.category,
  value: raw.value,
  valueInIls: raw.valueInIls ?? raw.value,
  currency: raw.currency,
  interestRate: raw.interestRate,
  targetAmount: raw.targetAmount,
  urgencyLevel: raw.urgencyLevel,
  sourceBudgetItemId: raw.sourceBudgetItemId ?? null,
  monthlyPayment: raw.monthlyPayment ?? null,
  lastDecreaseYearMonth: raw.lastDecreaseYearMonth ?? null,
  familyMemberId: raw.familyMemberId ?? raw.familyMember?.id ?? null,
  familyMemberName: raw.familyMemberName ?? raw.familyMember?.name ?? null,
  householdId: raw.householdId ?? raw.household?.id ?? '',
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt,
});

export const listAssetLiabilityItems = async (
  householdId: string,
): Promise<AssetLiabilityItem[]> => {
  const res = await axios.get(apiUrl(ENDPOINTS.assetLiabilityItems.base), {
    params: { householdId },
  });
  const list: RawItem[] = res.data?.data ?? res.data ?? [];
  return list.map(normalize);
};

export const createAssetLiabilityItem = async (
  payload: CreateAssetLiabilityItemPayload,
): Promise<AssetLiabilityItem> => {
  const res = await axios.post(apiUrl(ENDPOINTS.assetLiabilityItems.base), payload);
  return normalize(res.data?.data ?? res.data);
};

export const updateAssetLiabilityItem = async (
  id: string,
  payload: UpdateAssetLiabilityItemPayload,
): Promise<AssetLiabilityItem> => {
  const res = await axios.put(
    apiUrl(`${ENDPOINTS.assetLiabilityItems.base}/${id}`),
    payload,
  );
  return normalize(res.data?.data ?? res.data);
};

export const deleteAssetLiabilityItem = async (id: string): Promise<void> => {
  await axios.delete(apiUrl(`${ENDPOINTS.assetLiabilityItems.base}/${id}`));
};

export const deleteAssetLiabilityItemWithExpense = async (id: string): Promise<void> => {
  await axios.delete(apiUrl(`${ENDPOINTS.assetLiabilityItems.base}/${id}/with-expense`));
};

export const listDebtOverview = async (
  householdId: string,
): Promise<import('@gutplus/shared').DebtBudgetItemOverview[]> => {
  const res = await axios.get(apiUrl(ENDPOINTS.assetLiabilityItems.debtOverview), {
    params: { householdId },
  });
  return res.data?.data ?? res.data ?? [];
};
