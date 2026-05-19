import { Holiday } from '../enums/holiday.enum';
import { HolidayExpenseTemplate } from '../types/holiday-expense-template.types';

/*
 * רשימות ברירת מחדל לכל חג — המשתמש יכול להוסיף פריטים מותאמים אישית.
 * כל פריט שנשמר ייוצר כעסקה הקשורה לקטגוריית-משנה של "הוצאות חגים".
 */
export const HOLIDAY_EXPENSE_TEMPLATES: ReadonlyArray<HolidayExpenseTemplate> = [
  {
    holiday: Holiday.PASSOVER,
    displayName: 'פסח',
    defaultItems: [
      'מצות',
      'יין ומשקאות לסדר',
      'הגדות',
      'כלי פסח',
      'מוצרי ניקיון לחג',
      'ביגוד חדש',
      'מתנות לילדים',
      'אירוח ומצרכי בישול',
    ],
  },
  {
    holiday: Holiday.ROSH_HASHANA,
    displayName: 'ראש השנה',
    defaultItems: [
      'תפוחים ודבש',
      'רימונים',
      'דגים לשולחן החג',
      'חלות וקינוחים',
      'ביגוד חדש',
      'מתנות',
      'אירוח ומצרכי בישול',
    ],
  },
  {
    holiday: Holiday.YOM_KIPPUR,
    displayName: 'יום כיפור',
    defaultItems: [
      'ארוחה לפני הצום',
      'נרות זיכרון',
      'ביגוד לבן לתפילה',
    ],
  },
  {
    holiday: Holiday.SUKKOT,
    displayName: 'סוכות',
    defaultItems: [
      'סכך',
      'ארבעת המינים',
      'קישוטים לסוכה',
      'ריהוט לסוכה',
      'אירוח ומצרכי בישול',
    ],
  },
  {
    holiday: Holiday.HANUKKAH,
    displayName: 'חנוכה',
    defaultItems: [
      'נרות חנוכיה',
      'שמן זית',
      'סופגניות ולביבות',
      'מתנות לילדים',
      'משחקי סביבון',
    ],
  },
  {
    holiday: Holiday.PURIM,
    displayName: 'פורים',
    defaultItems: [
      'תחפושות',
      'משלוח מנות',
      'מתנות לאביונים',
      'מיני מתוקים ואוכל למשלוחים',
      'אירוע ומסיבה',
    ],
  },
  {
    holiday: Holiday.SHAVUOT,
    displayName: 'שבועות',
    defaultItems: [
      'מוצרי חלב מיוחדים',
      'עוגות וקינוחים',
      'קישוטים ירוקים',
      'אירוח ומצרכי בישול',
    ],
  },
  {
    holiday: Holiday.YOM_HAATZMAUT,
    displayName: 'יום העצמאות',
    defaultItems: [
      'ציוד מנגל ופחמים',
      'אוכל ושתיה לחגיגה',
      'דגלים וקישוטים',
      'יציאה לאירועים',
    ],
  },
];
