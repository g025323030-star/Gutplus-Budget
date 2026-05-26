// export enum MainCategoryKey {
//   HOUSE_UTILITIES = 'HOUSE_UTILITIES',
//   TRANSPORT = 'TRANSPORT',
//   FOOD = 'FOOD',
//   HEALTH = 'HEALTH',
// }

// export interface ExpenseTemplate {
//   description: string;
// }

// export const MAIN_CATEGORY_NAMES: Record<MainCategoryKey, string> = {
//   [MainCategoryKey.HOUSE_UTILITIES]: 'הוצאות ביתיות',
//   [MainCategoryKey.TRANSPORT]: 'תחבורה ורכב',
//   [MainCategoryKey.FOOD]: 'מזון',
//   [MainCategoryKey.HEALTH]: 'בריאות',
// };

// export const EXPENSE_TEMPLATES: Record<MainCategoryKey, ExpenseTemplate[]> = {
//   [MainCategoryKey.HOUSE_UTILITIES]: [
//     { description: 'חשמל' },
//     { description: 'מים' },
//     { description: 'שכירות' },
//     { description: 'גז' },
//   ],
//   [MainCategoryKey.TRANSPORT]: [
//     { description: 'דלק' },
//     { description: 'ביטוח רכב' },
//     { description: 'טסט' },
//   ],
//   [MainCategoryKey.FOOD]: [
//     { description: 'סופר שבועי' },
//     { description: 'ירקות' },
//   ],
//   [MainCategoryKey.HEALTH]: [
//     { description: 'ביטוח בריאות' },
//     { description: 'תרופות' },
//   ],
// };

// export const getTemplatesForCategoryName = (
//   categoryName: string,
// ): ExpenseTemplate[] => {
//   const entry = Object.entries(MAIN_CATEGORY_NAMES).find(
//     ([, name]) => name === categoryName,
//   );
//   if (!entry) return [];
//   return EXPENSE_TEMPLATES[entry[0] as MainCategoryKey] ?? [];
// };

// 1. הפיכת ה-enum לאובייקט קבוע (as const) וייצוא הטיפוס שלו כדי לעקוף את מגבלת erasableSyntaxOnly
export const MainCategoryKey = {
  HOUSE_UTILITIES: 'HOUSE_UTILITIES',
  TRANSPORT: 'TRANSPORT',
  FOOD: 'FOOD',
  HEALTH: 'HEALTH',
} as const;

export type MainCategoryKey = typeof MainCategoryKey[keyof typeof MainCategoryKey];

// 2. שאר הקוד שלך נשאר בדיוק אותו הדבר, הטייפסקריפט יקבל אותו בצורה מושלמת כעת:
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
  // כאן ההמרה (as MainCategoryKey) ממשיכה לעבוד מצוין מול הטיפוס החדש
  return EXPENSE_TEMPLATES[entry[0] as MainCategoryKey] ?? [];
};