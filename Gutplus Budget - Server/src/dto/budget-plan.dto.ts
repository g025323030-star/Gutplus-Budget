export interface CreateBudgetPlanDto {
  amount: string;
  month: number;
  year: number;
  householdId: string;
  categoryId?: string;
}

export interface UpdateBudgetPlanDto {
  amount?: string;
  month?: number;
  year?: number;
  categoryId?: string;
}