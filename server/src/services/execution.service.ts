import { Repository } from 'typeorm';
import type { BudgetLineItem, BudgetLineItemBucket } from '@gutplus/shared';
import { CategoryFrequency, CategoryType } from '@gutplus/shared';
import { AppDataSource } from '../config/data-source';
import { BudgetItem } from '../entities/budget-item.entity';
import { BudgetItemExecution } from '../entities/budget-item-execution.entity';
import { Category } from '../entities/category.entity';
import { getMonthSlots, monthSlotKey, MonthSlot } from '../utils/rolling-window.util';
import {
  isItemIncludedInMonth,
  isYearlySpreadItem,
  getContributingAmount,
  resolveCategoryBreakdowns,
} from './summary.service';
import { computeYearlySpreadDistribution } from './budget-line-item.service';

// ---------------------------------------------------------------------------
// Line-item bucket classification
// ---------------------------------------------------------------------------

/**
 * Classifies a single budget item into the `BudgetLineItemBucket` matching
 * the Budget page row it already appears under (see `budget.utils.ts`'s
 * `buildBudgetView`).
 *
 * IMPORTANT: must stay in sync with `aggregateMonth`'s bucketing branches in
 * `summary.service.ts`. This is a deliberate, separate duplication of ~15
 * lines of stable branching logic — `aggregateMonth` has 76 passing tests
 * riding on its exact current structure, so it is NOT refactored to share
 * this function. If the bucketing rules in `aggregateMonth` ever change,
 * update this function to match.
 */
export function classifyLineItemBucket(
  item: BudgetItem,
  categoryType: CategoryType | undefined,
  debtCategoryIds: Set<string>,
  breakoutCategoryIds: Map<string, Set<string>>,
): { bucket: BudgetLineItemBucket; breakoutName?: string } {
  const categoryId = item.category?.id;

  // Debt category — takes priority over income/expense bucketing.
  if (categoryId !== undefined && categoryId !== null && debtCategoryIds.has(categoryId)) {
    return { bucket: 'debt' };
  }

  if (categoryType === CategoryType.INCOME) {
    const isPlainMonthly =
      item.frequency === CategoryFrequency.MONTHLY &&
      item.baseMonth === null &&
      item.installmentGroupId === null &&
      !item.isOneTime &&
      item.holiday === null;
    return { bucket: isPlainMonthly ? 'incomeMonthly' : 'incomeYearly' };
  }

  // EXPENSE — breakout subtree match takes priority, mirroring aggregateMonth.
  for (const [name, ids] of breakoutCategoryIds) {
    if (categoryId !== undefined && categoryId !== null && ids.has(categoryId)) {
      return { bucket: 'breakout', breakoutName: name };
    }
  }

  if (item.holiday !== null) {
    return { bucket: 'expenseHolidays' };
  }
  if (item.installmentGroupId !== null) {
    return { bucket: 'expenseInstallments' };
  }
  if (item.frequency === CategoryFrequency.MONTHLY) {
    return { bucket: 'expenseMonthly' };
  }
  if (item.assignedMonth === null && !item.isOneTime) {
    return { bucket: 'expenseYearlySpread' };
  }
  return { bucket: 'expenseYearlyThisMonth' };
}

export interface UpsertExecutionInput {
  forecastOverride?: string | null;
  actual?: string | null;
}

// ---------------------------------------------------------------------------
// Shared query helper: load execution rows for a set of (month, year) slots
// ---------------------------------------------------------------------------

/**
 * Loads every `BudgetItemExecution` row for `householdId` whose (month, year)
 * falls in `slots`. Used both by `ExecutionService` (scoped to the requesting
 * household) and indirectly informs `ForecastService`'s own household-scoped
 * load (see `buildForecastOverrides`).
 */
async function loadExecutionRowsForSlots(
  repo: Repository<BudgetItemExecution>,
  householdId: string,
  slots: MonthSlot[],
): Promise<BudgetItemExecution[]> {
  if (slots.length === 0) {
    return [];
  }

  const qb = repo
    .createQueryBuilder('execution')
    .innerJoin('execution.household', 'household')
    .leftJoinAndSelect('execution.budgetItem', 'budgetItem')
    .where('household.id = :householdId', { householdId });

  qb.andWhere(
    '(' +
      slots
        .map((_, i) => `(execution.month = :month${i} AND execution.year = :year${i})`)
        .join(' OR ') +
      ')',
    slots.reduce<Record<string, number>>((params, slot, i) => {
      params[`month${i}`] = slot.month;
      params[`year${i}`] = slot.year;
      return params;
    }, {}),
  );

  return qb.getMany();
}

// ---------------------------------------------------------------------------
// ExecutionService
// ---------------------------------------------------------------------------

export class ExecutionService {
  private get executionRepo(): Repository<BudgetItemExecution> {
    return AppDataSource.getRepository(BudgetItemExecution);
  }

  private get budgetItemRepo(): Repository<BudgetItem> {
    return AppDataSource.getRepository(BudgetItem);
  }

  private get categoryRepo(): Repository<Category> {
    return AppDataSource.getRepository(Category);
  }

  /**
   * Upserts a `forecastOverride`/`actual` pair for one budget item's month.
   * No eligibility restriction — every item type may have an execution row
   * (only the *redistribution* math is restricted to yearly-spread items,
   * applied later when reading the row back).
   *
   * Validates only that the item belongs to the household. Finds-by-
   * (budgetItemId, month, year) → merges → saves, or deletes the row if the
   * merge result ends up all-null (mirrors BudgetItemService's
   * find-then-mutate-then-save pattern).
   */
  async upsert(
    householdId: string,
    budgetItemId: string,
    month: number,
    year: number,
    input: UpsertExecutionInput,
  ): Promise<BudgetItemExecution | null> {
    const item = await this.budgetItemRepo.findOne({
      where: { id: budgetItemId },
      relations: ['household'],
    });
    if (!item || item.household?.id !== householdId) {
      const err = new Error('Budget item not found') as Error & { status?: number };
      err.status = 404;
      throw err;
    }

    let existing = await this.executionRepo.findOne({
      where: { budgetItem: { id: budgetItemId }, month, year },
    });

    const nextForecastOverride =
      input.forecastOverride !== undefined
        ? input.forecastOverride
        : existing?.forecastOverride ?? null;
    const nextActual =
      input.actual !== undefined ? input.actual : existing?.actual ?? null;

    if (nextForecastOverride === null && nextActual === null) {
      if (existing) {
        await this.executionRepo.delete(existing.id);
      }
      return null;
    }

    if (!existing) {
      existing = this.executionRepo.create({
        budgetItem: { id: budgetItemId } as BudgetItem,
        household: { id: householdId } as any,
        month,
        year,
        forecastOverride: null,
        actual: null,
      });
    }

    existing.forecastOverride = nextForecastOverride;
    existing.actual = nextActual;

    return await this.executionRepo.save(existing);
  }

  /**
   * Resolves every budget item's baseline/current/actual figures for one
   * month of the household's forward forecast window.
   *
   * @param householdId - UUID of the household.
   * @param month        - Gregorian month 1-12. Must be one of the 12 slots
   *                       in `getMonthSlots(today, 0, 12)` — the Budget page
   *                       never asks outside its own forecast horizon.
   * @param year          - Gregorian year, paired with `month`.
   */
  async getLineItemsForMonth(
    householdId: string,
    month: number,
    year: number,
  ): Promise<BudgetLineItem[]> {
    const today = new Date();
    const forwardSlots = getMonthSlots(today, 0, 12);

    const requestedKey = monthSlotKey(month, year);
    const isWithinWindow = forwardSlots.some(
      slot => monthSlotKey(slot.month, slot.year) === requestedKey,
    );
    if (!isWithinWindow) {
      const err = new Error(
        'Requested month is outside the current forecast window',
      ) as Error & { status?: number };
      err.status = 400;
      throw err;
    }

    // 1. Load every household item (with its category, needed both for the
    // existing categoryId field and the new bucket classification below).
    const items = await this.budgetItemRepo
      .createQueryBuilder('item')
      .innerJoin('item.household', 'household')
      .leftJoinAndSelect('item.category', 'category')
      .where('household.id = :householdId', { householdId })
      .getMany();

    // 1b. Resolve debt + breakout category subtrees for bucket classification.
    const { debtIds, breakouts } = await resolveCategoryBreakdowns(
      this.categoryRepo,
      householdId,
    );

    // 2. Load every execution row falling in the forward window (covers all
    // item types — needed for non-yearly-spread items' actual/override too).
    const forwardRows = await loadExecutionRowsForSlots(
      this.executionRepo,
      householdId,
      forwardSlots,
    );
    const forwardRowsByItem = groupByBudgetItemId(forwardRows);

    // 3. Historical lookback rows, only needed for yearly-spread items.
    const pastSlots = getMonthSlots(today, -11, 11);
    const pastRows = await loadExecutionRowsForSlots(
      this.executionRepo,
      householdId,
      pastSlots,
    );
    const pastRowsByItem = groupByBudgetItemId(pastRows);

    const lineItems: BudgetLineItem[] = [];

    for (const item of items) {
      if (!isItemIncludedInMonth(item, month, year)) {
        continue;
      }

      // Exact-timing baseline — reuses getContributingAmount unchanged. The
      // item is only reachable here because isItemIncludedInMonth already
      // passed, so this naturally returns the full active-month amount for
      // bimonthly/holiday/anchored items.
      const baselineForecast = getContributingAmount(item, i => i.targetAmount ?? i.amount);

      let currentForecast: string;
      let actual: string | null;
      let isFrozen: boolean;

      if (isYearlySpreadItem(item)) {
        const itemForwardRows = forwardRowsByItem.get(item.id) ?? [];
        const itemPastRows = pastRowsByItem.get(item.id) ?? [];
        const distribution = computeYearlySpreadDistribution(
          item,
          itemForwardRows,
          forwardSlots,
          itemPastRows,
        );
        const resolution = distribution.get(requestedKey);
        currentForecast = resolution?.forecast ?? baselineForecast;
        isFrozen = resolution?.isFrozen ?? false;

        const ownRow = itemForwardRows.find(
          row => row.month === month && row.year === year,
        );
        actual = ownRow?.actual ?? null;
      } else {
        const ownRow = (forwardRowsByItem.get(item.id) ?? []).find(
          row => row.month === month && row.year === year,
        );
        currentForecast = ownRow?.forecastOverride ?? baselineForecast;
        actual = ownRow?.actual ?? null;
        isFrozen = true;
      }

      const { bucket, breakoutName } = classifyLineItemBucket(
        item,
        item.category?.type,
        debtIds,
        breakouts,
      );

      lineItems.push({
        budgetItemId: item.id,
        description: item.description,
        categoryId: item.category?.id ?? null,
        month,
        year,
        baselineForecast,
        currentForecast,
        actual,
        isFrozen,
        bucket,
        ...(breakoutName !== undefined ? { breakoutName } : {}),
      });
    }

    return lineItems;
  }
}

function groupByBudgetItemId(
  rows: BudgetItemExecution[],
): Map<string, BudgetItemExecution[]> {
  const map = new Map<string, BudgetItemExecution[]>();
  for (const row of rows) {
    const key = row.budgetItem?.id;
    if (!key) continue;
    const list = map.get(key) ?? [];
    list.push(row);
    map.set(key, list);
  }
  return map;
}

export const executionService = new ExecutionService();

// ---------------------------------------------------------------------------
// ForecastService integration
// ---------------------------------------------------------------------------

/**
 * Builds the unified `forecastOverrides` map consumed by
 * `aggregateMonth`'s optional trailing param: keys are
 * `${budgetItemId}:${month}:${year}`, values are final, pre-currency-
 * conversion amount strings.
 *
 * - Yearly-spread items with any execution rows in the forward window or
 *   the historical lookback: `computeYearlySpreadDistribution` is called
 *   once across the whole window, and all 12 resolved forecasts are copied
 *   in (so the forecast totals and the line-items endpoint stay consistent
 *   by construction — both read through the same redistribution call).
 * - Every other item: `forecastOverride` is copied in directly wherever a
 *   row has one set; months with no override are left out of the map so
 *   they fall through to `aggregateMonth`'s default `getContributingAmount`.
 *
 * `items` must already be loaded for the household (avoids a second query);
 * `forwardSlots` is `getMonthSlots(today, 0, 12)`.
 */
export async function buildForecastOverrides(
  householdId: string,
  items: BudgetItem[],
  forwardSlots: MonthSlot[],
): Promise<Map<string, string>> {
  const executionRepo = AppDataSource.getRepository(BudgetItemExecution);

  const forwardRows = await loadExecutionRowsForSlots(
    executionRepo,
    householdId,
    forwardSlots,
  );
  const forwardRowsByItem = groupByBudgetItemId(forwardRows);

  const yearlySpreadItems = items.filter(isYearlySpreadItem);
  const hasAnyYearlySpreadRows = yearlySpreadItems.length > 0;

  let pastRowsByItem = new Map<string, BudgetItemExecution[]>();
  if (hasAnyYearlySpreadRows) {
    const today = new Date();
    const pastSlots = getMonthSlots(today, -11, 11);
    const pastRows = await loadExecutionRowsForSlots(
      executionRepo,
      householdId,
      pastSlots,
    );
    pastRowsByItem = groupByBudgetItemId(pastRows);
  }

  const forecastOverrides = new Map<string, string>();

  for (const item of items) {
    const itemForwardRows = forwardRowsByItem.get(item.id) ?? [];

    if (isYearlySpreadItem(item)) {
      const itemPastRows = pastRowsByItem.get(item.id) ?? [];
      const hasAnyRows = itemForwardRows.length > 0 || itemPastRows.length > 0;
      if (!hasAnyRows) {
        continue;
      }
      const distribution = computeYearlySpreadDistribution(
        item,
        itemForwardRows,
        forwardSlots,
        itemPastRows,
      );
      for (const slot of forwardSlots) {
        const key = monthSlotKey(slot.month, slot.year);
        const resolution = distribution.get(key);
        if (resolution) {
          forecastOverrides.set(`${item.id}:${slot.month}:${slot.year}`, resolution.forecast);
        }
      }
    } else {
      for (const row of itemForwardRows) {
        if (row.forecastOverride !== null) {
          forecastOverrides.set(
            `${item.id}:${row.month}:${row.year}`,
            row.forecastOverride,
          );
        }
      }
    }
  }

  return forecastOverrides;
}
