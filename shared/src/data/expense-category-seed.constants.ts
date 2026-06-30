/**
 * Canonical expense-category structure, shared between the server seed
 * (ensureGlobalDefaults) and the client expense templates.
 *
 * This is the single source of truth for the default expense categories and
 * their sub-category descriptions. The server seeds these as global categories
 * (household = null); the client uses the same names for the category slider
 * and the starter "template rows".
 *
 * Descriptions are already trimmed here so consumers do not need to normalize.
 */
export interface ExpenseCategorySeed {
  name: string;
  subCategories: Array<{ name: string }>;
}

export const EXPENSE_CATEGORY_SEED: ExpenseCategorySeed[] = [
  {
    name: 'הוצאות שוטפות',
    subCategories: [
      { name: 'חשמל' },
      { name: 'מים' },
      { name: 'שכירות' },
      { name: 'משכנתא' },
      { name: 'גז' },
      { name: 'ועד בית' },
      { name: 'ארנונה' },
      { name: 'עוזרת בית' },
      { name: 'גנרטור' },
    ],
  },
  {
    name: 'תחבורה ורכב',
    subCategories: [
      { name: 'דלק' },
      { name: 'ביטוח רכב' },
      { name: 'טסט' },
      { name: 'נסיעות ילדים' },
      { name: 'נסיעות הורים' },
      { name: 'הוצאות מוניות' },
      { name: 'הוצאות הסעות' },
    ],
  },
  {
    name: 'מזון',
    subCategories: [
      { name: 'קניה שבועית' },
      { name: 'מכירה שכונתית' },
      { name: 'ירקות ופירות' },
      { name: 'בשרים ועופות' },
      { name: 'יום שישי' },
    ],
  },
  {
    name: 'בריאות',
    subCategories: [
      { name: 'קופ״ח' },
      { name: 'ביקורי רופא' },
      { name: 'תרופות ובית מרקחת' },
    ],
  },
  {
    name: 'ביטוחים',
    subCategories: [
      { name: 'ביטוח לאומי' },
      { name: 'ביטוח רכב חובה' },
      { name: 'ביטוח רכב מקיף' },
      { name: 'ביטוח בריאות' },
      { name: 'ביטוח דירה' },
      { name: 'ביטוח חיים' },
      { name: 'ביטוח אובדן כושר עבודה' },
    ],
  },
  {
    name: 'לימודים',
    subCategories: [
      { name: 'שכר לימוד בנים' },
      { name: 'שכר לימוד בנות' },
      { name: 'צהרונים' },
      { name: 'לימודי הורים' },
      { name: 'מעון/ משפחתון' },
      { name: 'חוגים/ שיעורים פרטיים' },
    ],
  },
  {
    name: 'מעשרות וצדקה',
    subCategories: [
      { name: 'מעשרות' },
      { name: 'צדקה' },
      { name: 'הו״ק לקהילה' },
      { name: 'ערבויות' },
      { name: 'תשלומי שכירות לילדים' },
    ],
  },
  {
    name: 'תקשורת ואינטרנט',
    subCategories: [
      { name: 'אינטרנט' },
      { name: 'עלויות סינון אינטרנט' },
      { name: 'פלאפונים הורים' },
      { name: 'פלאפונים ילדים' },
      { name: 'טלפון נייח' },
      { name: 'חבילת שיחות חו״ל' },
      { name: 'שירותי אחסון ודרייב' },
      { name: 'הוצאות AI וכלי דיגיטל' },
    ],
  },
  {
    name: 'מנויים',
    subCategories: [
      { name: 'עיתונים ועלונים' },
      { name: 'מרווה לצמא' },
      { name: 'חבורת תרי״ג' },
      { name: 'מנוי למקווה' },
      { name: 'לוטו' },
      { name: 'מיניבר' },
      { name: 'מנויים לאתרים שונים' },
    ],
  },
  {
    name: 'עמלות',
    subCategories: [
      { name: 'עמלות בנק חודשיות' },
      { name: 'ריבית חודשית' },
      { name: 'עמלת כרטיס אשראי ישראכרט' },
      { name: 'עמלת כרטיס אשראי כאל' },
      { name: 'עמלת כרטיס אשראי מקס' },
    ],
  },
  {
    name: 'שונות שוטפות',
    subCategories: [
      { name: 'ביגוד והנעלה (חוץ משנתי)' },
      { name: 'דמי כיס' },
      { name: 'מותרות/ פינוקים' },
      { name: 'סירוק פאה' },
      { name: 'קניות ברשת' },
      { name: 'מזומן ללא מעקב' },
      { name: 'רכישות קטנות' },
      { name: 'אוכל בחוץ' },
      { name: 'בייבי-סיטר' },
      { name: 'סיגריות' },
      { name: 'תספורות' },
      { name: 'ניקוי יבש' },
    ],
  },
  {
    name: 'החזרי חובות',
    subCategories: [
      { name: 'החזר הלוואה - בנק' },
      { name: 'החזר הלוואה - כרטיס אשראי' },
      { name: 'החזר הלוואה - פרטי' },
      { name: 'החזר הלוואה - קרן/ גמ״ח' },
    ],
  },
  {
    name: 'ירידת פריון עבודה',
    subCategories: [],
  },
];
