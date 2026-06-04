import { EXPENSE_CATEGORY_SEED } from '@gutplus/shared';

// מקור האמת לרשימת קטגוריות ההוצאה ותיאוריהן נמצא ב-@gutplus/shared
// (EXPENSE_CATEGORY_SEED) ומשותף עם זריעת ברירות המחדל בשרת. כאן רק נגזרות
// ממנו מבני נוחות לצד הלקוח.

export interface ExpenseTemplate {
  description: string;
}

export const MAIN_CATEGORY_NAMES: string[] = EXPENSE_CATEGORY_SEED.map(
  (category) => category.name,
);

export const EXPENSE_TEMPLATES: Record<string, ExpenseTemplate[]> =
  Object.fromEntries(
    EXPENSE_CATEGORY_SEED.map((category) => [
      category.name,
      category.subCategories.map((sub) => ({ description: sub.name })),
    ]),
  );

export const getTemplatesForCategoryName = (
  categoryName: string,
): ExpenseTemplate[] => EXPENSE_TEMPLATES[categoryName] ?? [];
