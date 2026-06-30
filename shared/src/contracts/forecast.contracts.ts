import type { MonthlySummary } from './summary.contracts';
import type { SuccessResponse } from './common.contracts';
import type { Holiday } from '../enums';

/**
 * A single month's forecast entry.
 * Extends the MonthlySummary shape with temporal metadata and a flag indicating
 * whether any included item used `targetAmount` instead of `amount`.
 */
export interface MonthlyForecast extends MonthlySummary {
  /** Gregorian month 1-12. */
  month: number;
  /** Gregorian year. */
  year: number;
  /**
   * True when at least one included item in this month had a non-null
   * `targetAmount` which was used as its contributing amount.
   */
  isTargetBased: boolean;
  /**
   * Distinct holidays whose items land in this month, by exact timing (see
   * `isItemIncludedInMonth`). Empty when no holiday falls in this month.
   */
  holidays: Holiday[];
}

export interface BudgetForecastData {
  months: MonthlyForecast[];
}

export type GetBudgetForecastResponse = SuccessResponse<BudgetForecastData>;
