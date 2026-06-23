import { CategoryFrequency, CurrencyCode, Holiday } from '../enums';

export interface BudgetItem {
  id: string;
  amount: string;
  description: string;
  needsReview: boolean;
  frequency: CategoryFrequency;
  installmentsTotal: number | null;
  installmentIndex: number | null;
  installmentGroupId: string | null;
  endDate: string | null;
  householdId: string;
  categoryId: string | null;
  accountId: string | null;
  targetAmount: string | null;
  assignedMonth: number | null;
  baseMonth: number | null;
  holiday: Holiday | null;
  isOneTime: boolean;
  currency: CurrencyCode;
  createdAt: string;
  updatedAt: string;
}
