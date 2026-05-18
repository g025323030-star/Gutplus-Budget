export interface Transaction {
  id: string;
  amount: string;
  date: string;
  description: string;
  isCleared: boolean;
  householdId: string;
  categoryId: string | null;
  accountId: string | null;
  createdAt: string;
  updatedAt: string;
}
