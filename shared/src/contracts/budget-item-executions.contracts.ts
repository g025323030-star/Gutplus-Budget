import type { BudgetItemExecution } from '../types';
import type { SuccessResponse } from './common.contracts';

/**
 * A single budget item's resolved execution figures for one month of the
 * Budget page's forward window.
 *
 * `baselineForecast`, `currentForecast`, and `actual` are fixed `.toFixed(2)`
 * decimal strings so the client can do a plain string-equality check (e.g.
 * `actual === currentForecast`) without float drift.
 */
export interface BudgetLineItem {
  budgetItemId: string;
  description: string;
  categoryId: string | null;
  month: number;
  year: number;
  /** Exact-timing baseline forecast — never the Snapshot dry average. */
  baselineForecast: string;
  /**
   * The "current forecast" after applying any override/redistribution.
   * For yearly-spread items this reflects `computeYearlySpreadDistribution`;
   * for everything else it's `forecastOverride ?? baselineForecast`.
   */
  currentForecast: string;
  /** Whatever the user logged as actually spent/received, if anything. */
  actual: string | null;
  /**
   * True when this month's `currentForecast` is settled (touched directly,
   * or not subject to cross-month redistribution at all) rather than an
   * open share still being computed dynamically.
   */
  isFrozen: boolean;
}

export type GetBudgetLineItemsResponse = SuccessResponse<{
  lineItems: BudgetLineItem[];
}>;

export type UpsertBudgetItemExecutionResponse = SuccessResponse<BudgetItemExecution>;
