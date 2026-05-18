export interface BudgetPlan {
  id: string;
  amount: string;
  month: number;
  year: number;
  householdId: string;
  categoryId: string | null;
  createdAt: string;
  updatedAt: string;
}
