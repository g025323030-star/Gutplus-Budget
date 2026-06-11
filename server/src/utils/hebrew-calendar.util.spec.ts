/**
 * Tests for hebrew-calendar.util.ts
 *
 * Reference values computed with the `jewish-date` library and cross-checked
 * against authoritative Jewish calendar sources.
 *
 * Key reference dates verified:
 *   PASSOVER 2026  — 15 Nisan 5786 = Apr 2 2026; erev (14 Nisan) = Apr 1 → month 4
 *   PASSOVER 2025  — 15 Nisan 5785 = Apr 13 2025; erev = Apr 12 → month 4
 *   PASSOVER 2027  — 15 Nisan 5787 = Apr 22 2027; erev = Apr 21 → month 4
 *   ROSH_HASHANA 2025 — 1 Tishri 5786 = Sep 23 2025; erev = Sep 22 → month 9
 *   ROSH_HASHANA 2026 — 1 Tishri 5787 = Sep 12 2026; erev = Sep 11 → month 9
 *   ROSH_HASHANA 2027 — 1 Tishri 5788 = Oct 2 2027; erev = Oct 1 → month 10
 *   YOM_KIPPUR 2025   — 10 Tishri 5786 = Oct 2 2025; erev = Oct 1 → month 10
 *   YOM_KIPPUR 2026   — 10 Tishri 5787 = Sep 21 2026; erev = Sep 20 → month 9
 *   SUKKOT 2025       — 15 Tishri 5786 = Oct 7 2025; erev = Oct 6 → month 10
 *   SUKKOT 2026       — 15 Tishri 5787 = Sep 26 2026; erev = Sep 25 → month 9
 *   HANUKKAH 2025     — 25 Kislev 5786 = Dec 15 2025; erev = Dec 14 → month 12
 *   HANUKKAH 2026     — 25 Kislev 5787 = Dec 5 2026; erev = Dec 4 → month 12
 *   HANUKKAH 2027     — 25 Kislev 5788 = Dec 25 2027; erev = Dec 24 → month 12
 *   PURIM 2025        — 14 Adar 5785 = Mar 14 2025; erev = Mar 13 → month 3
 *   PURIM 2026        — 14 Adar 5786 = Mar 3 2026; erev = Mar 2 → month 3
 *   PURIM 2027 (LEAP) — 14 AdarII 5787 = Mar 23 2027; erev = Mar 22 → month 3
 *   SHAVUOT 2025      — 6 Sivan 5785 = Jun 2 2025; erev = Jun 1 → month 6
 *   SHAVUOT 2026      — 6 Sivan 5786 = May 22 2026; erev = May 21 → month 5
 *   TU_BISHVAT 2025   — 15 Shevat 5785 = Feb 13 2025; erev = Feb 12 → month 2
 *   TU_BISHVAT 2026   — 15 Shevat 5786 = Feb 2 2026; erev = Feb 1 → month 2
 *   TU_BISHVAT 2027   — 15 Shevat 5787 = Jan 23 2027; erev = Jan 22 → month 1
 */

import { Holiday } from '@gutplus/shared';
import { getErevHolidayGregorianMonth } from './hebrew-calendar.util';

describe('getErevHolidayGregorianMonth', () => {

  // ── PASSOVER ─────────────────────────────────────────────────────────────
  describe('PASSOVER', () => {
    it('2025 → erev 14 Nisan 5785 falls in April (month 4)', () => {
      expect(getErevHolidayGregorianMonth(Holiday.PASSOVER, 2025)).toBe(4);
    });

    it('2026 → erev 14 Nisan 5786 falls in April (month 4)', () => {
      // 15 Nisan 5786 = Apr 2 2026; erev = Apr 1 2026 → month 4
      expect(getErevHolidayGregorianMonth(Holiday.PASSOVER, 2026)).toBe(4);
    });

    it('2027 → erev 14 Nisan 5787 falls in April (month 4)', () => {
      expect(getErevHolidayGregorianMonth(Holiday.PASSOVER, 2027)).toBe(4);
    });
  });

  // ── ROSH HASHANA ─────────────────────────────────────────────────────────
  describe('ROSH_HASHANA', () => {
    it('2025 → erev 1 Tishri 5786 falls in September (month 9)', () => {
      expect(getErevHolidayGregorianMonth(Holiday.ROSH_HASHANA, 2025)).toBe(9);
    });

    it('2026 → erev 1 Tishri 5787 falls in September (month 9)', () => {
      expect(getErevHolidayGregorianMonth(Holiday.ROSH_HASHANA, 2026)).toBe(9);
    });

    it('2027 → erev 1 Tishri 5788 falls in October (month 10)', () => {
      // 1 Tishri 5788 = Oct 2 2027; erev = Oct 1 2027 → month 10
      expect(getErevHolidayGregorianMonth(Holiday.ROSH_HASHANA, 2027)).toBe(10);
    });
  });

  // ── YOM KIPPUR ───────────────────────────────────────────────────────────
  describe('YOM_KIPPUR', () => {
    it('2025 → erev 10 Tishri 5786 falls in October (month 10)', () => {
      // 10 Tishri 5786 = Oct 2 2025; erev = Oct 1 2025 → month 10
      expect(getErevHolidayGregorianMonth(Holiday.YOM_KIPPUR, 2025)).toBe(10);
    });

    it('2026 → erev 10 Tishri 5787 falls in September (month 9)', () => {
      // 10 Tishri 5787 = Sep 21 2026; erev = Sep 20 2026 → month 9
      expect(getErevHolidayGregorianMonth(Holiday.YOM_KIPPUR, 2026)).toBe(9);
    });

    // Cross-month boundary: Rosh Hashana 2025 is in Sep, Yom Kippur is in Oct
    it('2025 Yom Kippur erev is in a different month than Rosh Hashana erev (Oct vs Sep)', () => {
      const ykMonth = getErevHolidayGregorianMonth(Holiday.YOM_KIPPUR, 2025);
      const rhMonth = getErevHolidayGregorianMonth(Holiday.ROSH_HASHANA, 2025);
      expect(ykMonth).toBe(10);
      expect(rhMonth).toBe(9);
      expect(ykMonth).not.toBe(rhMonth);
    });
  });

  // ── SUKKOT ───────────────────────────────────────────────────────────────
  describe('SUKKOT', () => {
    it('2025 → erev 15 Tishri 5786 falls in October (month 10)', () => {
      expect(getErevHolidayGregorianMonth(Holiday.SUKKOT, 2025)).toBe(10);
    });

    it('2026 → erev 15 Tishri 5787 falls in September (month 9)', () => {
      // 15 Tishri 5787 = Sep 26 2026; erev = Sep 25 2026 → month 9
      expect(getErevHolidayGregorianMonth(Holiday.SUKKOT, 2026)).toBe(9);
    });
  });

  // ── HANUKKAH ─────────────────────────────────────────────────────────────
  describe('HANUKKAH', () => {
    it('2025 → erev 25 Kislev 5786 falls in December (month 12)', () => {
      expect(getErevHolidayGregorianMonth(Holiday.HANUKKAH, 2025)).toBe(12);
    });

    it('2026 → erev 25 Kislev 5787 falls in December (month 12)', () => {
      expect(getErevHolidayGregorianMonth(Holiday.HANUKKAH, 2026)).toBe(12);
    });

    it('2027 → erev 25 Kislev 5788 falls in December (month 12)', () => {
      expect(getErevHolidayGregorianMonth(Holiday.HANUKKAH, 2027)).toBe(12);
    });
  });

  // ── PURIM (including leap year) ──────────────────────────────────────────
  describe('PURIM', () => {
    it('2025 → erev 14 Adar 5785 (non-leap) falls in March (month 3)', () => {
      expect(getErevHolidayGregorianMonth(Holiday.PURIM, 2025)).toBe(3);
    });

    it('2026 → erev 14 Adar 5786 (non-leap) falls in March (month 3)', () => {
      expect(getErevHolidayGregorianMonth(Holiday.PURIM, 2026)).toBe(3);
    });

    it('2027 → erev 14 Adar II 5787 (LEAP year) falls in March (month 3)', () => {
      // 5787 is a Hebrew leap year; Purim is in Adar II
      // 14 AdarII 5787 = Mar 23 2027; erev = Mar 22 2027 → month 3
      expect(getErevHolidayGregorianMonth(Holiday.PURIM, 2027)).toBe(3);
    });
  });

  // ── SHAVUOT ──────────────────────────────────────────────────────────────
  describe('SHAVUOT', () => {
    it('2025 → erev 6 Sivan 5785 falls in June (month 6)', () => {
      expect(getErevHolidayGregorianMonth(Holiday.SHAVUOT, 2025)).toBe(6);
    });

    it('2026 → erev 6 Sivan 5786 falls in May (month 5)', () => {
      // 6 Sivan 5786 = May 22 2026; erev = May 21 2026 → month 5
      // Eve (May) is in a DIFFERENT month than one would naively guess (June)
      expect(getErevHolidayGregorianMonth(Holiday.SHAVUOT, 2026)).toBe(5);
    });

    it('2027 → erev 6 Sivan 5787 falls in June (month 6)', () => {
      expect(getErevHolidayGregorianMonth(Holiday.SHAVUOT, 2027)).toBe(6);
    });
  });

  // ── TU BISHVAT ───────────────────────────────────────────────────────────
  describe('TU_BISHVAT', () => {
    it('2025 → erev 15 Shevat 5785 falls in February (month 2)', () => {
      expect(getErevHolidayGregorianMonth(Holiday.TU_BISHVAT, 2025)).toBe(2);
    });

    it('2026 → erev 15 Shevat 5786 falls in February (month 2)', () => {
      expect(getErevHolidayGregorianMonth(Holiday.TU_BISHVAT, 2026)).toBe(2);
    });

    it('2027 → erev 15 Shevat 5787 falls in January (month 1)', () => {
      // 15 Shevat 5787 = Jan 23 2027; erev = Jan 22 2027 → month 1
      expect(getErevHolidayGregorianMonth(Holiday.TU_BISHVAT, 2027)).toBe(1);
    });
  });

  // ── CROSS-MONTH BOUNDARY CASES ────────────────────────────────────────────
  describe('cross-month boundary', () => {
    it('SHAVUOT 2026: erev falls in May, not June', () => {
      // Demonstrates that eve can be in a different month than the holiday
      expect(getErevHolidayGregorianMonth(Holiday.SHAVUOT, 2026)).toBe(5);
    });

    it('ROSH_HASHANA 2027: erev falls in October, not September', () => {
      // 1 Tishri 5788 = Oct 2 2027; erev = Oct 1 → month 10
      expect(getErevHolidayGregorianMonth(Holiday.ROSH_HASHANA, 2027)).toBe(10);
    });
  });

  // ── SPECIFIC ASSERTION REQUIRED BY TASK ───────────────────────────────────
  describe('task-required assertion', () => {
    it('PASSOVER 2026: erev Pesach 5786 is Apr 1 2026, which is in month 4', () => {
      // 15 Nisan 5786 = Thu Apr 2 2026; erev 14 Nisan = Wed Apr 1 2026 → Gregorian month 4
      expect(getErevHolidayGregorianMonth(Holiday.PASSOVER, 2026)).toBe(4);
    });
  });

});
