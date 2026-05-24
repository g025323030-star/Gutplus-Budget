import { CategoryType } from '../enums';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  householdId: string | null;
  parentCategoryId: string | null;
  createdAt: string;
  updatedAt: string;
}
