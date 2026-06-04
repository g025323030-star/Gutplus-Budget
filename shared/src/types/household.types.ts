export interface Household {
  id: string;
  name: string;
  familySize: number;
  userId: string | null;
  expenseTemplatesInitialized: boolean;
  createdAt: string;
  updatedAt: string;
}
