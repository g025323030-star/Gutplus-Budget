import { CategoryType, CategoryFrequency } from '../entities/category.entity';

export interface CreateCategoryDto {
  name: string;
  type: CategoryType;
  frequency: CategoryFrequency;
  householdId?: string;
  parentCategoryId?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  type?: CategoryType;
  frequency?: CategoryFrequency;
  parentCategoryId?: string;
}