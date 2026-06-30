import { Repository, IsNull, In } from 'typeorm';
import {
  BUDGET_BREAKOUT_EXPENSE_PARENTS,
  CategoryFrequency,
  CategoryType,
  CurrencyCode,
  Holiday,
  MonthlySummary,
} from '@gutplus/shared';
import { AppDataSource } from '../config/data-source';
import { BudgetItem } from '../entities/budget-item.entity';
import { Category } from '../entities/category.entity';
import { Household } from '../entities/household.entity';
import { exchangeRateService } from './exchange-rate.service';
import { getErevHolidayGregorianMonth } from '../utils/hebrew-calendar.util';

// ---------------------------------------------------------------------------
// Decimal-safe helpers (avoid floats for money)
// ---------------------------------------------------------------------------

/** Parse a decimal string to integer cents (multiply by 100, floor). */
export function toCents(value: string): bigint {
  const [intPart, fracPart = ''] = value.replace('-', '').split('.');
  const isNegative = value.startsWith('-');
  const normalized = fracPart.padEnd(2, '0').slice(0, 2);
  const cents = BigInt(intPart) * 100n + BigInt(normalized);
  return isNegative ? -cents : cents;
}

/** Format bigint cents back to a number rounded to 2 decimal places. */
export function centsToNumber(cents: bigint): number {
  const sign = cents < 0n ? -1 : 1;
  const abs = cents < 0n ? -cents : cents;
  const intPart = abs / 100n;
  const fracPart = abs % 100n;
  return sign * parseFloat(`${intPart}.${String(fracPart).padStart(2, '0')}`);
}

/**
 * Splits `totalCents` into `count` integer-cent shares that sum back to
 * exactly `totalCents`. Each share is either `floor` or `floor + 1`; the
 * remainder cents go to the first N slots (in order). Generalizes the
 * single-value ÷12 remainder-distribution rounding rule used by
 * {@link getContributingAmount} into an N-way split.
 */
export function distributeEvenly(totalCents: bigint, count: number): bigint[] {
  if (count <= 0) {
    return [];
  }
  const countBig = BigInt(count);
  const isNegative = totalCents < 0n;
  const abs = isNegative ? -totalCents : totalCents;
  const base = abs / countBig;
  const remainder = abs % countBig;

  const shares: bigint[] = [];
  for (let i = 0; i < count; i++) {
    const share = i < remainder ? base + 1n : base;
    shares.push(isNegative ? -share : share);
  }
  return shares;
}

// ---------------------------------------------------------------------------
// Inclusion test — pure function, exported for TASK-21 reuse
// ---------------------------------------------------------------------------

/**
 * Returns true when `item` should be included in the monthly summary for the
 * given (month, year). Does NOT check category type — caller decides the bucket.
 *
 * @param item - A BudgetItem row.
 * @param month - Gregorian month 1-12.
 * @param year  - Gregorian year (e.g. 2026).
 */
export function isItemIncludedInMonth(
  item: BudgetItem,
  month: number,
  year: number,
): boolean {
  // endDate check: excluded once endDate is before the first day of queried month
  if (item.endDate) {
    const end = item.endDate instanceof Date ? item.endDate : new Date(item.endDate);
    const firstOfMonth = new Date(year, month - 1, 1);
    if (end < firstOfMonth) {
      return false;
    }
  }

  // Installment row — anchored to a month of the year via assignedMonth
  if (item.installmentGroupId !== null) {
    return item.assignedMonth === month;
  }

  // isOneTime — anchored to a single month of the year via assignedMonth
  if (item.isOneTime) {
    return item.assignedMonth === month;
  }

  // Holiday item — month determined by Hebrew calendar, except Hasidic events
  // which have no fixed Hebrew date and are anchored by assignedMonth instead.
  if (item.holiday !== null) {
    if (item.holiday === Holiday.HASIDIS_EVENT) {
      return item.assignedMonth === month;
    }
    const holidayMonth = getErevHolidayGregorianMonth(item.holiday, year);
    return holidayMonth === month;
  }

  // YEARLY frequency
  if (item.frequency === CategoryFrequency.YEARLY) {
    // assignedMonth present → only that month (repeats every year)
    if (item.assignedMonth !== null) {
      return item.assignedMonth === month;
    }
    // No assignedMonth and not isOneTime → spread: included every month (amount/12 handled below)
    return true;
  }

  // MONTHLY frequency
  if (item.frequency === CategoryFrequency.MONTHLY) {
    // Bi-monthly (baseMonth set): included only when parity matches
    if (item.baseMonth !== null) {
      return month % 2 === item.baseMonth % 2;
    }
    // Plain monthly: included every month
    return true;
  }

  return false;
}

/**
 * True for a "yearly-spread" item: a YEARLY-frequency item with no
 * assignedMonth, no holiday, not one-time, and not part of an installment
 * group — i.e. its annual amount is divided evenly across all 12 months
 * rather than landing in one specific month.
 *
 * Used to decide whether redistribution math applies when *reading* a line
 * item back (see `budget-line-item.service.ts`) — it does not gate whether a
 * write to `ExecutionService.upsert` is allowed; every item type is loggable.
 */
export function isYearlySpreadItem(item: BudgetItem): boolean {
  return (
    item.frequency === CategoryFrequency.YEARLY &&
    item.assignedMonth === null &&
    item.holiday === null &&
    !item.isOneTime &&
    item.installmentGroupId === null
  );
}

/**
 * Returns the contributing amount string for this item in the queried month.
 * Handles yearly spread (÷12) and otherwise returns the resolved base amount unchanged.
 *
 * @param item          - The BudgetItem to compute for.
 * @param amountResolver - Function that returns the base amount string for a given item.
 *                         Summary passes `(i) => i.amount`; forecast passes
 *                         `(i) => i.targetAmount ?? i.amount`.
 *
 * Precondition: `isItemIncludedInMonth` must have returned true for this item.
 */
export function getContributingAmount(item: BudgetItem, amountResolver: (item: BudgetItem) => string): string {
  // Yearly spread (no assignedMonth, no holiday, not isOneTime, no installmentGroupId)
  if (isYearlySpreadItem(item)) {
    // Divide by 12, decimal-safe
    const cents = toCents(amountResolver(item));
    const monthly = cents / 12n;
    const remainder = cents % 12n;
    // Round: if remainder * 2 >= 12, round up
    const rounded = remainder * 2n >= 12n ? monthly + 1n : monthly;
    return centsToNumber(rounded).toFixed(2);
  }
  return amountResolver(item);
}

// ---------------------------------------------------------------------------
// Dry-average algorithm (Snapshot only) — ignores timing/seasonality
// ---------------------------------------------------------------------------

/**
 * Snapshot-only inclusion test: every item is included in every month
 * ("ignore timing entirely"), except one-time items which are excluded
 * altogether (matching the existing TransactionsList filtering behavior on
 * the Snapshot screen today). Unlike `isItemIncludedInMonth`, this never
 * varies by *seasonality* — bimonthly, holiday, and yearly-anchored items are
 * all "always included" here; only `computeDryMonthlyAverage` decides how
 * much of their amount counts per month. The `endDate` lifecycle check is
 * preserved unchanged: an item that has stopped recurring should not count
 * toward "what this household costs per month" for months after it ended,
 * same as the exact-timing path.
 *
 * @param month - Gregorian month 1-12, used only for the endDate lifecycle check.
 * @param year  - Gregorian year, used only for the endDate lifecycle check.
 */
function isItemIncludedInDryAverage(
  item: BudgetItem,
  month: number,
  year: number,
): boolean {
  if (item.endDate) {
    const end = item.endDate instanceof Date ? item.endDate : new Date(item.endDate);
    const firstOfMonth = new Date(year, month - 1, 1);
    if (end < firstOfMonth) {
      return false;
    }
  }

  if (item.isOneTime) {
    return false;
  }
  return true;
}

/**
 * Snapshot-only "ignore timing" contribution for one month of `item`:
 * - plain monthly (no `baseMonth`) → `item.amount` unchanged.
 * - bimonthly (`baseMonth` set) → `item.amount ÷ 2`.
 * - yearly-spread → `item.amount ÷ 12` (existing math, unchanged).
 * - yearly-anchored / holiday (incl. `HASIDIS_EVENT`) → annual amount ÷ 12,
 *   included in every month instead of only its anchor/holiday month.
 * - installments → unchanged (already "monthly-shaped" while active).
 *
 * One-time items are excluded entirely by `isItemIncludedInDryAverage`
 * before this function is ever called.
 */
export function computeDryMonthlyAverage(item: BudgetItem): string {
  // Installments are already monthly-shaped while active — no averaging.
  if (item.installmentGroupId !== null) {
    return item.amount;
  }

  // Holiday item (incl. HASIDIS_EVENT) — annual amount ÷ 12 every month.
  if (item.holiday !== null) {
    return divideCentsBy(toCents(item.amount), 12);
  }

  // YEARLY frequency
  if (item.frequency === CategoryFrequency.YEARLY) {
    // Both yearly-spread (no assignedMonth) and yearly-anchored
    // (assignedMonth set) collapse to the same ÷12 dry average.
    return divideCentsBy(toCents(item.amount), 12);
  }

  // MONTHLY frequency
  if (item.frequency === CategoryFrequency.MONTHLY) {
    // Bi-monthly (baseMonth set): full amount only lands every other month,
    // so its dry monthly average is half.
    if (item.baseMonth !== null) {
      return divideCentsBy(toCents(item.amount), 2);
    }
    // Plain monthly: unchanged.
    return item.amount;
  }

  return item.amount;
}

/** Divides `cents` by `divisor`, rounding half-up, same rule as the existing ÷12. */
function divideCentsBy(cents: bigint, divisor: number): string {
  const divisorBig = BigInt(divisor);
  const quotient = cents / divisorBig;
  const remainder = cents % divisorBig;
  const rounded = remainder * 2n >= divisorBig ? quotient + 1n : quotient;
  return centsToNumber(rounded).toFixed(2);
}

// ---------------------------------------------------------------------------
// Debt category subtree resolution
// ---------------------------------------------------------------------------

const DEBT_PARENT_NAME = 'החזרי חובות';

/** Collects a category subtree (the named expense parent + all descendants). */
function collectSubtreeIds(
  categories: Category[],
  parentName: string,
): Set<string> {
  const parent = categories.find(
    c => c.name === parentName && c.type === CategoryType.EXPENSE,
  );
  if (!parent) {
    return new Set();
  }
  const ids = new Set<string>([parent.id]);
  const queue: string[] = [parent.id];
  while (queue.length > 0) {
    const parentId = queue.shift()!;
    for (const cat of categories) {
      if (cat.parentCategory?.id === parentId && !ids.has(cat.id)) {
        ids.add(cat.id);
        queue.push(cat.id);
      }
    }
  }
  return ids;
}

export interface CategoryBreakdowns {
  /** "החזרי חובות" subtree — excluded from balanceBeforeDebts. */
  debtIds: Set<string>;
  /** Named breakout subtrees (e.g. מעשרות) — normal expenses, shown separately. */
  breakouts: Map<string, Set<string>>;
}

/**
 * Resolves the debt subtree and every configured breakout subtree from a single
 * category load. Shared by SummaryService and ForecastService.
 */
export async function resolveCategoryBreakdowns(
  categoryRepo: Repository<Category>,
  householdId: string,
): Promise<CategoryBreakdowns> {
  const categories = await categoryRepo.find({
    where: [
      { household: { id: householdId } },
      { household: { id: IsNull() } as any },
    ],
    relations: ['parentCategory'],
    select: {
      id: true,
      name: true,
      type: true,
    },
  });

  const debtIds = collectSubtreeIds(categories, DEBT_PARENT_NAME);
  const breakouts = new Map<string, Set<string>>();
  for (const name of BUDGET_BREAKOUT_EXPENSE_PARENTS) {
    breakouts.set(name, collectSubtreeIds(categories, name));
  }
  return { debtIds, breakouts };
}

// ---------------------------------------------------------------------------
// Core aggregation engine (shared between summary and forecast)
// ---------------------------------------------------------------------------

export interface AggregateMonthResult {
  summary: MonthlySummary;
  /** True if at least one item in this month used targetAmount (not amount). */
  hadTargetAmount: boolean;
}

/**
 * Core aggregation engine used by both SummaryService and ForecastService.
 *
 * @param items           - All budget items for the household (pre-loaded with category).
 * @param debtCategoryIds - Set of category IDs belonging to the debt subtree.
 * @param rateMap         - Pre-fetched exchange rates (currency → ILS rate string).
 * @param month           - Gregorian month 1-12.
 * @param year            - Gregorian year.
 * @param amountResolver  - Returns the base amount string for a given item.
 *                          Summary: `(i) => i.amount`
 *                          Forecast: `(i) => i.targetAmount ?? i.amount`
 * @param dryAverage       - Snapshot-only. When true, swaps `isItemIncludedInMonth`
 *                          for the always-included-except-one-time dry-average
 *                          inclusion check, and `getContributingAmount` for
 *                          `computeDryMonthlyAverage`. Purely additive: omitting
 *                          this param (the Forecast/Budget call sites) leaves
 *                          behavior byte-for-byte unchanged. Mutually exclusive
 *                          with `forecastOverrides` in practice (Snapshot never
 *                          passes overrides; Forecast never passes dryAverage).
 * @param forecastOverrides - Forecast-only. Map of `${budgetItemId}:${month}:${year}`
 *                          to a final, pre-currency-conversion amount string that
 *                          replaces `getContributingAmount`'s result verbatim when
 *                          present. `convertToIls` still runs on it unchanged.
 *                          `SummaryService.computeSummary` never passes this.
 */
export function aggregateMonth(
  items: BudgetItem[],
  debtCategoryIds: Set<string>,
  breakoutCategoryIds: Map<string, Set<string>>,
  rateMap: Map<CurrencyCode, string>,
  month: number,
  year: number,
  amountResolver: (item: BudgetItem) => string,
  dryAverage?: boolean,
  forecastOverrides?: Map<string, string>,
): AggregateMonthResult {
  // Helper: convert amount string to ILS using pre-fetched rate map
  const convertToIls = (amount: string, currency: CurrencyCode): bigint => {
    if (currency === CurrencyCode.ILS) {
      return toCents(amount);
    }
    const rate = rateMap.get(currency) ?? '1';
    const [rInt, rFrac = ''] = rate.split('.');
    const rFracNorm = rFrac.padEnd(6, '0').slice(0, 6);
    const amountCents = toCents(amount); // BigInt, ×100
    // rate as integer (×1_000_000)
    const rateMicro = BigInt(rInt) * 1_000_000n + BigInt(rFracNorm);
    // amountCents * rateMicro = amount * rate * 100 * 1_000_000 → divide by 1_000_000
    const raw = amountCents * rateMicro;
    const cents = raw / 1_000_000n;
    return cents;
  };

  // Accumulate buckets (all in BigInt cents)
  let incomesMonthly = 0n;
  let incomesYearly = 0n;
  let expensesMonthly = 0n;
  let expensesYearlySpread = 0n;
  let expensesYearlyThisMonth = 0n;
  let expensesHolidays = 0n;
  let expensesInstallments = 0n;
  let debtRepayments = 0n;
  let debtRepaymentsMonthly = 0n;
  let debtRepaymentsYearly = 0n;
  let hadTargetAmount = false;

  // Per-breakout accumulators (initialized so every configured breakout is
  // present in the output, even when it has no items this month).
  const breakoutCents = new Map<string, bigint>();
  for (const name of breakoutCategoryIds.keys()) {
    breakoutCents.set(name, 0n);
  }

  // Returns the breakout name whose subtree contains this category, or null.
  const matchBreakout = (categoryId?: string | null): string | null => {
    if (!categoryId) return null;
    for (const [name, ids] of breakoutCategoryIds) {
      if (ids.has(categoryId)) return name;
    }
    return null;
  };

  for (const item of items) {
    const isIncluded = dryAverage
      ? isItemIncludedInDryAverage(item, month, year)
      : isItemIncludedInMonth(item, month, year);
    if (!isIncluded) {
      continue;
    }

    // Track whether targetAmount was used
    if (item.targetAmount !== null) {
      hadTargetAmount = true;
    }

    const overrideKey = forecastOverrides ? `${item.id}:${month}:${year}` : undefined;
    const override = overrideKey ? forecastOverrides!.get(overrideKey) : undefined;
    const contributingAmountStr =
      override !== undefined
        ? override
        : dryAverage
          ? computeDryMonthlyAverage(item)
          : getContributingAmount(item, amountResolver);
    const ilsCents = convertToIls(contributingAmountStr, item.currency);

    const categoryType = item.category?.type;
    const categoryId = item.category?.id;

    // Check if this is a debt repayment item (excluded from balanceBeforeDebts)
    const isDebt = categoryId !== undefined && categoryId !== null && debtCategoryIds.has(categoryId);

    if (isDebt) {
      debtRepayments += ilsCents;
      // Same MONTHLY-vs-everything-else predicate used for income bucketing
      // below, so the two debt totals line up with incomes.monthly/yearly
      // and expenses.monthly/yearly for the per-mode Snapshot cards.
      if (
        item.frequency === CategoryFrequency.MONTHLY &&
        item.baseMonth === null &&
        item.installmentGroupId === null &&
        !item.isOneTime &&
        item.holiday === null
      ) {
        debtRepaymentsMonthly += ilsCents;
      } else {
        debtRepaymentsYearly += ilsCents;
      }
      continue;
    }

    if (categoryType === CategoryType.INCOME) {
      // Income bucketing: MONTHLY → incomes.monthly; everything else → incomes.yearly
      if (
        item.frequency === CategoryFrequency.MONTHLY &&
        item.baseMonth === null &&
        item.installmentGroupId === null &&
        !item.isOneTime &&
        item.holiday === null
      ) {
        incomesMonthly += ilsCents;
      } else {
        incomesYearly += ilsCents;
      }
      continue;
    }

    // EXPENSE — pull out named breakout categories first (still real expenses,
    // counted toward balanceBeforeDebts, but shown on their own rows).
    const breakoutName = matchBreakout(categoryId);
    if (breakoutName !== null) {
      breakoutCents.set(breakoutName, (breakoutCents.get(breakoutName) ?? 0n) + ilsCents);
      continue;
    }

    // General expense bucketing (holiday and installment take priority)
    if (item.holiday !== null) {
      expensesHolidays += ilsCents;
    } else if (item.installmentGroupId !== null) {
      expensesInstallments += ilsCents;
    } else if (item.frequency === CategoryFrequency.MONTHLY) {
      expensesMonthly += ilsCents;
    } else if (item.assignedMonth === null && !item.isOneTime) {
      // Yearly spread (÷12 already applied by getContributingAmount)
      expensesYearlySpread += ilsCents;
    } else {
      // Yearly anchored to this specific month (assigned / one-time)
      expensesYearlyThisMonth += ilsCents;
    }
  }

  // Convert cents to rounded numbers (2 dp)
  const round2 = (cents: bigint): number => {
    const n = centsToNumber(cents);
    return Math.round(n * 100) / 100;
  };

  const incomesMonthlyNum = round2(incomesMonthly);
  const incomesYearlyNum = round2(incomesYearly);
  const expensesMonthlyNum = round2(expensesMonthly);
  const expensesYearlySpreadNum = round2(expensesYearlySpread);
  const expensesYearlyThisMonthNum = round2(expensesYearlyThisMonth);
  const expensesYearlyNum =
    Math.round((expensesYearlySpreadNum + expensesYearlyThisMonthNum) * 100) / 100;
  const expensesHolidaysNum = round2(expensesHolidays);
  const expensesInstallmentsNum = round2(expensesInstallments);
  const debtRepaymentsNum = round2(debtRepayments);
  const debtRepaymentsMonthlyNum = round2(debtRepaymentsMonthly);
  const debtRepaymentsYearlyNum = round2(debtRepaymentsYearly);

  const breakouts = [...breakoutCents.entries()].map(([name, cents]) => ({
    name,
    amount: round2(cents),
  }));
  const breakoutsTotalNum =
    Math.round(breakouts.reduce((sum, b) => sum + b.amount, 0) * 100) / 100;

  const balanceBeforeDebts =
    Math.round(
      (incomesMonthlyNum + incomesYearlyNum -
        expensesMonthlyNum - expensesYearlyNum -
        expensesHolidaysNum - expensesInstallmentsNum -
        breakoutsTotalNum) * 100,
    ) / 100;

  const balanceAfterDebts =
    Math.round((balanceBeforeDebts - debtRepaymentsNum) * 100) / 100;

  const summary: MonthlySummary = {
    incomes: {
      monthly: incomesMonthlyNum,
      yearly: incomesYearlyNum,
    },
    expenses: {
      monthly: expensesMonthlyNum,
      yearly: expensesYearlyNum,
      yearlySpread: expensesYearlySpreadNum,
      yearlyThisMonth: expensesYearlyThisMonthNum,
      holidays: expensesHolidaysNum,
      installments: expensesInstallmentsNum,
      breakouts,
    },
    debtRepayments: debtRepaymentsNum,
    debtRepaymentsMonthly: debtRepaymentsMonthlyNum,
    debtRepaymentsYearly: debtRepaymentsYearlyNum,
    balanceBeforeDebts,
    balanceAfterDebts,
  };

  return { summary, hadTargetAmount };
}

// ---------------------------------------------------------------------------
// Main service
// ---------------------------------------------------------------------------

export class SummaryService {
  private get budgetItemRepo(): Repository<BudgetItem> {
    return AppDataSource.getRepository(BudgetItem);
  }

  private get categoryRepo(): Repository<Category> {
    return AppDataSource.getRepository(Category);
  }

  private get householdRepo(): Repository<Household> {
    return AppDataSource.getRepository(Household);
  }

  /**
   * Computes the monthly financial summary for a household.
   *
   * @param householdId - UUID of the household.
   * @param month       - Gregorian month 1-12.
   * @param year        - Gregorian year.
   * @param dryAverage  - When true (default), every item contributes an
   *                      evenly-smoothed monthly share regardless of its real
   *                      timing (see `computeDryMonthlyAverage`) — this is the
   *                      existing Snapshot monthly-card behavior and the
   *                      default preserves it byte-for-byte for every existing
   *                      caller. When explicitly passed `false`, items are
   *                      included using exact-timing semantics
   *                      (`isItemIncludedInMonth` / `getContributingAmount`)
   *                      instead — used by the Annual tab, which sums 12
   *                      exact-timing months rather than 12 dry averages.
   */
  async computeSummary(
    householdId: string,
    month: number,
    year: number,
    dryAverage: boolean = true,
  ): Promise<MonthlySummary> {
    // 1. Load all budget items for this household with their categories
    const items = await this.budgetItemRepo
      .createQueryBuilder('item')
      .innerJoin('item.household', 'household')
      .leftJoinAndSelect('item.category', 'category')
      .where('household.id = :householdId', { householdId })
      .getMany();

    // 2. Resolve debt + breakout category subtrees
    const { debtIds, breakouts } = await resolveCategoryBreakdowns(
      this.categoryRepo,
      householdId,
    );

    // 3. Pre-fetch exchange rates for all distinct currencies (one call per currency)
    const distinctCurrencies = [...new Set(items.map(item => item.currency))];
    const rateMap = new Map<CurrencyCode, string>();
    await Promise.all(
      distinctCurrencies.map(async currency => {
        const rate = await exchangeRateService.getRateToIls(currency);
        rateMap.set(currency, rate);
      }),
    );

    // 4. Delegate to shared aggregation engine with the summary amount resolver.
    // dryAverage defaults to true — Snapshot's monthly cards ignore
    // timing/seasonality entirely (see computeDryMonthlyAverage). Passing
    // `false` (Annual tab / exactTiming=true query param) switches to
    // exact-timing semantics instead. This is the only call site that ever
    // passes dryAverage, and it never passes forecastOverrides.
    const { summary } = aggregateMonth(
      items,
      debtIds,
      breakouts,
      rateMap,
      month,
      year,
      (item) => item.amount,
      dryAverage,
    );

    return summary;
  }
}

export const summaryService = new SummaryService();
