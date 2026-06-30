import { Repository } from 'typeorm';
import { CurrencyCode, Holiday, MonthlyForecast } from '@gutplus/shared';
import { AppDataSource } from '../config/data-source';
import { BudgetItem } from '../entities/budget-item.entity';
import { Category } from '../entities/category.entity';
import { aggregateMonth, isItemIncludedInMonth, resolveCategoryBreakdowns } from './summary.service';
import { exchangeRateService } from './exchange-rate.service';
import { buildForecastOverrides } from './execution.service';
import { getMonthSlots } from '../utils/rolling-window.util';

// ---------------------------------------------------------------------------
// ForecastService
// ---------------------------------------------------------------------------

export class ForecastService {
  private get budgetItemRepo(): Repository<BudgetItem> {
    return AppDataSource.getRepository(BudgetItem);
  }

  private get categoryRepo(): Repository<Category> {
    return AppDataSource.getRepository(Category);
  }

  /**
   * Computes a 12-month rolling forecast starting from the current month.
   *
   * Each month uses `effectiveAmount = targetAmount ?? amount` as the
   * contributing value for every included item, unless an execution
   * override/redistribution applies for that item+month (see
   * `buildForecastOverrides`) — this keeps the per-row line items
   * (`/budget-executions/line-items`) and these KPI totals consistent by
   * construction, since both read through the same overrides map.
   *
   * @param householdId - UUID of the household.
   * @returns An array of 12 MonthlyForecast entries in chronological order.
   */
  async computeForecast(householdId: string): Promise<MonthlyForecast[]> {
    // 1. Determine rolling window: current month + next 11 (with year rollover)
    const forwardSlots = getMonthSlots(new Date(), 0, 12);

    // 2. Load all budget items for this household with their categories (once)
    const items = await this.budgetItemRepo
      .createQueryBuilder('item')
      .innerJoin('item.household', 'household')
      .leftJoinAndSelect('item.category', 'category')
      .where('household.id = :householdId', { householdId })
      .getMany();

    // 3. Resolve debt + breakout category subtrees (once)
    const { debtIds, breakouts } = await resolveCategoryBreakdowns(
      this.categoryRepo,
      householdId,
    );

    // 4. Pre-fetch exchange rates for all distinct currencies (one call per currency)
    const distinctCurrencies = [...new Set(items.map(item => item.currency))];
    const rateMap = new Map<CurrencyCode, string>();
    await Promise.all(
      distinctCurrencies.map(async currency => {
        const rate = await exchangeRateService.getRateToIls(currency);
        rateMap.set(currency, rate);
      }),
    );

    // 5. Forecast amount resolver: use target if set, otherwise fall back to amount
    const forecastAmountResolver = (item: BudgetItem): string =>
      item.targetAmount ?? item.amount;

    // 6. Build the unified execution-overrides map (yearly-spread
    // redistribution + plain forecastOverride passthrough) once for the
    // whole window.
    const forecastOverrides = await buildForecastOverrides(
      householdId,
      items,
      forwardSlots,
    );

    // 7. Iterate over the 12 forward slots
    const results: MonthlyForecast[] = [];

    for (const { month, year } of forwardSlots) {
      const { summary, hadTargetAmount } = aggregateMonth(
        items,
        debtIds,
        breakouts,
        rateMap,
        month,
        year,
        forecastAmountResolver,
        undefined,
        forecastOverrides,
      );

      // Distinct holidays whose items land in this exact month (exact timing,
      // not the dry average — same source list `items`, no extra query).
      const holidays = [
        ...new Set(
          items
            .filter(item => item.holiday !== null && isItemIncludedInMonth(item, month, year))
            .map(item => item.holiday as Holiday),
        ),
      ];

      results.push({
        ...summary,
        month,
        year,
        isTargetBased: hadTargetAmount,
        holidays,
      });
    }

    return results;
  }
}

export const forecastService = new ForecastService();
