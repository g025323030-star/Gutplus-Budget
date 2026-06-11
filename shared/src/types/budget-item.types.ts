import { CategoryFrequency } from '../enums';

export interface BudgetItem {
  id: string;
  amount: string;
  date: string;
  description: string;
  isCleared: boolean;
  frequency: CategoryFrequency;
  installmentsTotal: number | null;
  installmentIndex: number | null;
  installmentGroupId: string | null;
  endDate: string | null;
  householdId: string;
  categoryId: string | null;
  accountId: string | null;
  createdAt: string;
  updatedAt: string;
}
