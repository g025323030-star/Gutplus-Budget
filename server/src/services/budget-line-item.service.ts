import { BudgetItem } from '../entities/budget-item.entity';
import { BudgetItemExecution } from '../entities/budget-item-execution.entity';
import { MonthSlot, monthSlotKey } from '../utils/rolling-window.util';
import {
  centsToNumber,
  distributeEvenly,
  getContributingAmount,
  toCents,
} from './summary.service';

export interface YearlySpreadResolution {
  /** Resolved `.toFixed(2)` forecast amount for this slot. */
  forecast: string;
  /**
   * True when this slot's forecast is settled by a direct touch (non-null
   * `actual`/`forecastOverride` on this exact slot), false when it's an open
   * share still being computed dynamically from the redistributed remainder.
   */
  isFrozen: boolean;
}

/**
 * Pure function implementing the two-stage yearly-spread redistribution
 * algorithm (see plan section 4):
 *
 * Stage 1 — historical netting: nets *variance* (not absolute spend) logged
 * in the 11-month lookback against the item's expected ÷12 baseline, so an
 * on-target past month contributes zero effect and only deviation shrinks or
 * grows the forward pool. This is what keeps an overspend/underspend from
 * "escaping" the calculation the instant it rolls out of the forward window.
 *
 * Stage 2 — forward distribution: subtracts whatever forward months were
 * already explicitly touched (frozen) from the (possibly netted) annual
 * target, then spreads the remainder evenly across the still-open forward
 * months via `distributeEvenly`.
 *
 * @param item               - Must be `isYearlySpreadItem(item) === true`; caller's responsibility.
 * @param forwardExecutionRows - Execution rows whose (month, year) fall in `forwardSlots`.
 * @param forwardSlots       - The 12 `{ month, year }` entries from `getMonthSlots(today, 0, 12)`.
 *                             This is also the only span ever returned/displayed.
 * @param pastExecutionRows  - Execution rows whose (month, year) fall in the 11-month
 *                             historical lookback (`getMonthSlots(today, -11, 11)`).
 *                             Read-only; never returned.
 */
export function computeYearlySpreadDistribution(
  item: BudgetItem,
  forwardExecutionRows: BudgetItemExecution[],
  forwardSlots: MonthSlot[],
  pastExecutionRows: BudgetItemExecution[],
): Map<string, YearlySpreadResolution> {
  const targetAmountResolver = (i: BudgetItem): string => i.targetAmount ?? i.amount;

  // 1. Annual target and the existing yearly-spread ÷12 baseline, in cents.
  const annualTarget = toCents(targetAmountResolver(item));
  const monthlyBaseline = toCents(getContributingAmount(item, targetAmountResolver));

  // 2. Historical netting, by variance (not absolute spend): untouched past
  // months contribute 0 — they are skipped entirely, never assumed "on target".
  let totalPastVariance = 0n;
  for (const row of pastExecutionRows) {
    const settled = row.actual ?? row.forecastOverride;
    if (settled === null || settled === undefined) {
      continue;
    }
    const monthVariance = toCents(settled) - monthlyBaseline;
    totalPastVariance += monthVariance;
  }

  // 3. An overspend in the past (positive variance) reduces the pool
  // available going forward; an underspend (negative variance) grows it.
  let forwardTarget = annualTarget - totalPastVariance;

  // 4. Forward distribution: a slot is frozen iff *it itself* was touched
  // (non-null actual or forecastOverride on that exact slot).
  const forwardRowBySlot = new Map<string, BudgetItemExecution>();
  for (const row of forwardExecutionRows) {
    forwardRowBySlot.set(monthSlotKey(row.month, row.year), row);
  }

  const frozenSettled = new Map<string, bigint>();
  const openSlots: MonthSlot[] = [];

  for (const slot of forwardSlots) {
    const key = monthSlotKey(slot.month, slot.year);
    const row = forwardRowBySlot.get(key);
    const settled = row ? row.actual ?? row.forecastOverride : null;
    if (settled !== null && settled !== undefined) {
      frozenSettled.set(key, toCents(settled));
      forwardTarget -= toCents(settled);
    } else {
      openSlots.push(slot);
    }
  }

  // 5. Split the (possibly negative) remaining forwardTarget across the open
  // forward slots via distributeEvenly, in slot order.
  const openShares = distributeEvenly(forwardTarget, openSlots.length);

  // 6. Build the result map for every forward slot.
  const result = new Map<string, YearlySpreadResolution>();
  let openIndex = 0;
  for (const slot of forwardSlots) {
    const key = monthSlotKey(slot.month, slot.year);
    const frozenCents = frozenSettled.get(key);
    if (frozenCents !== undefined) {
      result.set(key, {
        forecast: centsToNumber(frozenCents).toFixed(2),
        isFrozen: true,
      });
    } else {
      const shareCents = openShares[openIndex];
      openIndex += 1;
      result.set(key, {
        forecast: centsToNumber(shareCents).toFixed(2),
        isFrozen: false,
      });
    }
  }

  return result;
}
