
// 1. הפיכת ה-enum לאובייקט קבוע (as const) וייצוא הטיפוס שלו כדי לעקוף את מגבלת erasableSyntaxOnly
export const MainCategoryKey = {
  HOUSE_UTILITIES: 'HOUSE_UTILITIES',
  TRANSPORT: 'TRANSPORT',
  FOOD: 'FOOD',
  HEALTH: 'HEALTH',
  INSURANCE: 'INSURANCE',
  EDUCATION: 'EDUCATION',
  DONATIONS: 'DONATIONS',
  MEDIA: 'MEDIA',
  SUBSCRIPTIONS: 'SUBSCRIPTIONS',
  FEES: 'FEES',
  OTHER: 'OTHER',
  LOANS: 'LOANS',
} as const;

export type MainCategoryKey = typeof MainCategoryKey[keyof typeof MainCategoryKey];

// 2. שאר הקוד שלך נשאר בדיוק אותו הדבר, הטייפסקריפט יקבל אותו בצורה מושלמת כעת:
export interface ExpenseTemplate {
  description: string;
}

export const MAIN_CATEGORY_NAMES: Record<MainCategoryKey, string> = {
  [MainCategoryKey.HOUSE_UTILITIES]: 'הוצאות שוטפות',
  [MainCategoryKey.TRANSPORT]: 'תחבורה ורכב',
  [MainCategoryKey.FOOD]: 'מזון',
  [MainCategoryKey.HEALTH]: 'בריאות',
  [MainCategoryKey.MEDIA]: 'תקשורת ואינטרנט',
  [MainCategoryKey.INSURANCE]: 'ביטוחים',
  [MainCategoryKey.EDUCATION]: 'לימודים',
  [MainCategoryKey.DONATIONS]: 'מעשרות וצדקה',
  [MainCategoryKey.SUBSCRIPTIONS]: 'מנויים ',
  [MainCategoryKey.FEES]: 'עמלות ',
  [MainCategoryKey.OTHER]: 'שונות שוטפות ',
  [MainCategoryKey.LOANS]: 'החזרי חובות',
};

export const EXPENSE_TEMPLATES: Record<MainCategoryKey, ExpenseTemplate[]> = {
  [MainCategoryKey.HOUSE_UTILITIES]: [
    { description: 'חשמל' },
    { description: 'מים' },
    { description: 'שכירות' },
    { description: 'משכנתא' },
    { description: 'גז' },
    { description: 'ועד בית' },
    { description: 'ארנונה' },
    { description: 'עוזרת בית' },
    { description: ' גנרטור' },
  ],
  [MainCategoryKey.TRANSPORT]: [
    { description: 'דלק' },
    { description: 'ביטוח רכב' },
    { description: 'טסט' },
    { description: 'נסיעות ילדים' },
    { description: 'נסיעות הורים' },
    { description: ' הוצאות מוניות' },
    { description: ' הוצאות הסעות' },
  ],
  [MainCategoryKey.FOOD]: [
    { description: 'קניה שבועית' },
    { description: 'מכירה שכונתית' },
    { description: 'ירקות ופירות' },
    { description: 'בשרים ועופות' },
    { description: 'יום שישי ' },
  ],
  [MainCategoryKey.HEALTH]: [
    { description: ' קופ״ח' },
    { description: 'ביקורי רופא' },
    { description: 'תרופות ובית מרקחת' },
  ],
  [MainCategoryKey.INSURANCE]: [
    { description: 'ביטוח לאומי' },
    { description: 'ביטוח רכב חובה' },
    { description: 'ביטוח רכב מקיף' },
    { description: 'ביטוח בריאות' },
    { description: 'ביטוח דירה' },
    { description: 'ביטוח חיים' },
    { description: 'ביטוח אובדן כושר עבודה' },
  ],
  [MainCategoryKey.EDUCATION]: [
    { description: 'שכר לימוד בנים' },
    { description: 'שכר לימוד בנות' },
    { description: ' צהרונים ' },
    { description: ' לימודי הורים' },
    { description: '  מעון/ משפחתון' },
    { description: ' חוגים/ שיעורים פרטיים ' },
  ],
  [MainCategoryKey.DONATIONS]: [
    { description: 'מעשרות' },
    { description: 'צדקה' },
    { description: 'הו״ק לקהילה' },
    { description: ' ערבויות' },
    { description: ' תשלומי שכירות לילדים' },
  ],
[MainCategoryKey.MEDIA]: [
    { description: 'אינטרנט' },
    { description: 'עלויות סינון אינטרנט' },
    { description: 'פלאפונים הורים' },
    { description: 'פלאפונים ילדים' },
    { description: 'טלפון נייח' },
    { description: 'חבילת שיחות חו״ל ' },
    { description: 'שירותי אחסון ודרייב' },
    { description: 'הוצאות AI וכלי דיגיטל' },
  ],
[MainCategoryKey.SUBSCRIPTIONS]: [
  { description: 'עיתונים ועלונים' },
  { description: 'מרווה לצמא' },
  { description: 'חבורת תרי״ג ' },
  { description: 'מנוי למקווה' },
  { description: ' לוטו' },
  { description: ' מיניבר' },
  { description: ' מנויים לאתרים שונים' },
],
[MainCategoryKey.FEES]: [
  { description: 'עמלות בנק חודשיות' },
  { description: ' ריבית חודשית' },
  { description: 'עמלת כרטיס אשראי ישראכרט' },
  { description: 'עמלת כרטיס אשראי כאל' },
  { description: 'עמלת כרטיס אשראי מקס' },
],
[MainCategoryKey.OTHER]: [
  { description: 'ביגוד והנעלה (חוץ משנתי)' },
  { description: 'דמי כיס' },
  { description: ' מותרות/ פינוקים' },
  { description: ' סירוק פאה' },
  { description: ' קניות ברשת ' },
  { description: 'מזומן ללא מעקב' },
  { description: ' רכישות קטנות' },
  { description: ' אוכל בחוץ' },
  { description: ' בייבי-סיטר' },
  { description: 'סיגריות' },
  { description: 'תספורות' },
  { description: 'ניקוי יבש' },
],
[MainCategoryKey.LOANS]: [
  { description: 'החזר הלוואה - בנק' },
  { description: 'החזר הלוואה - כרטיס אשראי' },
  { description: 'החזר הלוואה - פרטי' },
  { description: 'החזר הלוואה - קרן/ גמ״ח' },
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