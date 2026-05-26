export enum MainCategoryKey {
  HOUSE_UTILITIES = 'HOUSE_UTILITIES',
  TRANSPORT = 'TRANSPORT',
  FOOD = 'FOOD',
  HEALTH = 'HEALTH',
}

export interface ExpenseTemplate {
  description: string;
}

export const MAIN_CATEGORY_NAMES: Record<MainCategoryKey, string> = {
  [MainCategoryKey.HOUSE_UTILITIES]: 'הוצאות ביתיות',
  [MainCategoryKey.TRANSPORT]: 'תחבורה ורכב',
  [MainCategoryKey.FOOD]: 'מזון',
  [MainCategoryKey.HEALTH]: 'בריאות',
};

export const EXPENSE_TEMPLATES: Record<MainCategoryKey, ExpenseTemplate[]> = {
  [MainCategoryKey.HOUSE_UTILITIES]: [
    { description: 'חשמל' },
    { description: 'מים' },
    { description: 'שכירות' },
    { description: 'גז' },
  ],
  [MainCategoryKey.TRANSPORT]: [
    { description: 'דלק' },
    { description: 'ביטוח רכב' },
    { description: 'טסט' },
  ],
  [MainCategoryKey.FOOD]: [
    { description: 'סופר שבועי' },
    { description: 'ירקות' },
  ],
  [MainCategoryKey.HEALTH]: [
    { description: 'ביטוח בריאות' },
    { description: 'תרופות' },
  ],
};

export const getTemplatesForCategoryName = (
  categoryName: string,
): ExpenseTemplate[] => {
  const entry = Object.entries(MAIN_CATEGORY_NAMES).find(
    ([, name]) => name === categoryName,
  );
  if (!entry) return [];
  return EXPENSE_TEMPLATES[entry[0] as MainCategoryKey] ?? [];
};
