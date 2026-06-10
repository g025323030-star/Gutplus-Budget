export interface Household {
  id: string;
  name: string;
  familySize: number;
  userId: string | null;
  expenseTemplatesInitialized: boolean;
  incomeTemplatesInitialized: boolean;
  createdAt: string;
  updatedAt: string;
}
