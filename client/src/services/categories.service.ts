import axios from 'axios';
import { ENDPOINTS } from '@gutplus/shared';
import type { Category, CategoryFrequency, CategoryType } from '@gutplus/shared';

const apiUrl = (path: string): string =>
  import.meta.env.VITE_SERVER_URL + path;

interface RawCategory {
  id: string;
  name: string;
  type: CategoryType;
  frequency: CategoryFrequency;
  household?: { id: string } | null;
  parentCategory?: { id: string } | null;
  householdId?: string | null;
  parentCategoryId?: string | null;
  createdAt: string;
  updatedAt: string;
}

const normalizeCategory = (raw: RawCategory): Category => ({
  id: raw.id,
  name: raw.name,
  type: raw.type,
  frequency: raw.frequency,
  householdId: raw.household?.id ?? raw.householdId ?? null,
  parentCategoryId: raw.parentCategory?.id ?? raw.parentCategoryId ?? null,
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt,
});

export const getCategories = async (): Promise<Category[]> => {
  const res = await axios.get(apiUrl(ENDPOINTS.categories.base));
  const list = (res.data.data as RawCategory[]) ?? [];
  return list.map(normalizeCategory);
};
