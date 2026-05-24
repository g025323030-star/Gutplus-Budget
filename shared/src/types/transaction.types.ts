import { CategoryFrequency } from '../enums';

export interface Transaction {
  id: string;
  amount: string;
  date: string;
  description: string;
  isCleared: boolean;
  frequency: CategoryFrequency;
  installmentsTotal: number | null;
  installmentIndex: number | null;
  installmentGroupId: string | null;
  householdId: string;
  categoryId: string | null;
  accountId: string | null;
  createdAt: string;
  updatedAt: string;
}
