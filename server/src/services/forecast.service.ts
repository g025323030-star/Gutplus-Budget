import { Repository } from 'typeorm';
import { CurrencyCode, MonthlyForecast } from '@gutplus/shared';
import { AppDataSource } from '../config/data-source';
import { BudgetItem } from '../entities/budget-item.entity';
import { Category } from '../entities/category.entity';
import { aggregateMonth, resolveCategoryBreakdowns } from './summary.service';
import { exchangeRateService } from './exchange-rate.service';

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
   * contributing value for every included item.
   *
   * @param householdId - UUID of the household.
   * @returns An array of 12 MonthlyForecast entries in chronological order.
   */
  async computeForecast(householdId: string): Promise<MonthlyForecast[]> {
    // 1. Determine rolling window start: current month
    const now = new Date();
    const startMonth = now.getMonth() + 1; // 1-12
    const startYear = now.getFullYear();

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

    // 6. Iterate over 12 months (with year rollover)
    const results: MonthlyForecast[] = [];

    for (let offset = 0; offset < 12; offset++) {
      let month = startMonth + offset;
      let year = startYear;

      // Handle year rollover
      if (month > 12) {
        month -= 12;
        year += 1;
      }

      const { summary, hadTargetAmount } = aggregateMonth(
        items,
        debtIds,
        breakouts,
        rateMap,
        month,
        year,
        forecastAmountResolver,
      );

      results.push({
        ...summary,
        month,
        year,
        isTargetBased: hadTargetAmount,
      });
    }

    return results;
  }
}

export const forecastService = new ForecastService();
