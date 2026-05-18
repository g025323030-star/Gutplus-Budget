import { CategoryFrequency, CategoryType } from '../enums';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  frequency: CategoryFrequency;
  householdId: string | null;
  parentCategoryId: string | null;
  createdAt: string;
  updatedAt: string;
}
