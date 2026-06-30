/** A single resolved (month, year) slot in a rolling window. */
export interface MonthSlot {
  /** Gregorian month 1-12. */
  month: number;
  /** Gregorian year. */
  year: number;
}

/**
 * Builds a contiguous span of `count` `{ month, year }` slots, relative to
 * `referenceDate`'s month, with year rollover (forward or backward) handled
 * via Gregorian month arithmetic.
 *
 * `startOffset` is relative to `referenceDate`'s month: `0` is the reference
 * month itself, positive values move forward, negative values move backward.
 *
 * Examples (referenceDate's month = M):
 * - `getMonthSlots(referenceDate, 0, 12)` — M and the next 11 months (the
 *   existing forward forecast window).
 * - `getMonthSlots(referenceDate, -11, 11)` — the 11 months immediately
 *   before M (a historical lookback, never including M itself).
 */
export function getMonthSlots(
  referenceDate: Date,
  startOffset: number,
  count: number,
): MonthSlot[] {
  const referenceMonth = referenceDate.getMonth() + 1; // 1-12
  const referenceYear = referenceDate.getFullYear();

  const slots: MonthSlot[] = [];
  for (let i = 0; i < count; i++) {
    // Zero-based total month index relative to referenceYear's January,
    // shifted by the reference month and the requested offset.
    const zeroBasedIndex = referenceMonth - 1 + startOffset + i;
    const year = referenceYear + Math.floor(zeroBasedIndex / 12);
    const month = ((zeroBasedIndex % 12) + 12) % 12 + 1;
    slots.push({ month, year });
  }
  return slots;
}

/** Builds the `"month:year"` key used to index maps keyed by a month slot. */
export function monthSlotKey(month: number, year: number): string {
  return `${month}:${year}`;
}
