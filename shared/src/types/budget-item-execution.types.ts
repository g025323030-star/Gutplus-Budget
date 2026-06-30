export interface BudgetItemExecution {
  id: string;
  budgetItemId: string;
  householdId: string;
  month: number;
  year: number;
  forecastOverride: string | null;
  actual: string | null;
  createdAt: string;
  updatedAt: string;
}
