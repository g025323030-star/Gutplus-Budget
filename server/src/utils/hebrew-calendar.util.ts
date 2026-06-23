/**
 * Hebrew Calendar Utility
 *
 * Given a Gregorian year, returns the Gregorian month (1-12) in which
 * the EVE of a Jewish holiday falls.
 *
 * "Eve" (erev) = the day before the holiday begins, when shopping occurs.
 *
 * Uses the `jewish-date` library (MIT, ~2 KB) for Hebrew↔Gregorian conversion.
 */

import { toGregorianDate, isLeapYear } from 'jewish-date';
import { Holiday } from '@gutplus/shared';

/**
 * Maps a Holiday to its Hebrew date (day + month).
 * For Purim we must inspect whether the Hebrew year is a leap year
 * and use AdarII in that case.
 */
interface HebrewHolidayDate {
  day: number;
  monthName: string;
}

function getHebrewHolidayDate(holiday: Holiday, hebrewYear: number): HebrewHolidayDate {
  const leap = isLeapYear(hebrewYear);

  switch (holiday) {
    case Holiday.PASSOVER:
      return { day: 15, monthName: 'Nisan' };
    case Holiday.ROSH_HASHANA:
      return { day: 1, monthName: 'Tishri' };
    case Holiday.YOM_KIPPUR:
      return { day: 10, monthName: 'Tishri' };
    case Holiday.SUKKOT:
      return { day: 15, monthName: 'Tishri' };
    case Holiday.HANUKKAH:
      return { day: 25, monthName: 'Kislev' };
    case Holiday.PURIM:
      // In a leap year Purim is celebrated in Adar II, not Adar I
      return { day: 14, monthName: leap ? 'AdarII' : 'Adar' };
    case Holiday.SHAVUOT:
      return { day: 6, monthName: 'Sivan' };
    case Holiday.TU_BISHVAT:
      return { day: 15, monthName: 'Shevat' };
    case Holiday.SIMCHAT_TORAH:
      // מנהג ארץ ישראל — מאוחד עם שמיני עצרת
      return { day: 22, monthName: 'Tishri' };
    case Holiday.LAG_BAOMER:
      return { day: 18, monthName: 'Iyyar' };
    case Holiday.SUMMER_VACATION:
      // אין תאריך עברי "חג" קבוע — מעוגן בתשעה באב, תחילת החופש הגדול
      return { day: 9, monthName: 'Av' };
    case Holiday.HASIDIS_EVENT:
      // אין לאירוע חסידי תאריך עברי קבוע — המשתמש קובע את החודש ידנית
      // דרך assignedMonth, ופונקציה זו לא נקראת לערך הזה (ראו summary.service).
      throw new Error(
        'HASIDIS_EVENT has no fixed Hebrew date — month must be supplied via assignedMonth',
      );
    default: {
      const _exhaustive: never = holiday;
      throw new Error(`Unknown holiday: ${_exhaustive}`);
    }
  }
}

/**
 * Returns the Gregorian month (1-12) in which the holiday's EVE falls
 * for the given Gregorian year.
 *
 * The algorithm searches up to three consecutive Hebrew years that overlap
 * with the requested Gregorian year, since one Gregorian year spans parts
 * of two or three Hebrew years.
 *
 * @param holiday - The Jewish holiday (from the shared Holiday enum).
 * @param gregorianYear - The Gregorian year (e.g. 2026).
 * @returns Gregorian month number (1-12) of the holiday's eve.
 * @throws Error if no occurrence of the holiday's eve is found in the given year.
 */
export function getErevHolidayGregorianMonth(holiday: Holiday, gregorianYear: number): number {
  // A Gregorian year maps to roughly Hebrew year (gregorianYear + 3760).
  // We search the surrounding Hebrew years to find the one whose holiday
  // occurrence lands (with its eve) within the target Gregorian year.
  const baseHebrewYear = gregorianYear + 3760;

  for (let hy = baseHebrewYear; hy <= baseHebrewYear + 2; hy++) {
    const { day, monthName } = getHebrewHolidayDate(holiday, hy);

    const holidayGregorianDate = toGregorianDate({
      day,
      monthName: monthName as Parameters<typeof toGregorianDate>[0]['monthName'],
      year: hy,
    });

    // Eve = one calendar day before the holiday
    const erevDate = new Date(holidayGregorianDate);
    erevDate.setDate(erevDate.getDate() - 1);

    if (erevDate.getFullYear() === gregorianYear) {
      return erevDate.getMonth() + 1; // getMonth() is 0-based
    }
  }

  throw new Error(
    `Could not find erev ${holiday} in Gregorian year ${gregorianYear}`,
  );
}
