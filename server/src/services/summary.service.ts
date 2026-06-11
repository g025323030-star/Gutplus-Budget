import { Repository, IsNull, In } from 'typeorm';
import {
  CategoryFrequency,
  CategoryType,
  CurrencyCode,
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
function toCents(value: string): bigint {
  const [intPart, fracPart = ''] = value.replace('-', '').split('.');
  const isNegative = value.startsWith('-');
  const normalized = fracPart.padEnd(2, '0').slice(0, 2);
  const cents = BigInt(intPart) * 100n + BigInt(normalized);
  return isNegative ? -cents : cents;
}

/** Format bigint cents back to a number rounded to 2 decimal places. */
function centsToNumber(cents: bigint): number {
  const sign = cents < 0n ? -1 : 1;
  const abs = cents < 0n ? -cents : cents;
  const intPart = abs / 100n;
  const fracPart = abs % 100n;
  return sign * parseFloat(`${intPart}.${String(fracPart).padStart(2, '0')}`);
}

// ---------------------------------------------------------------------------
// Inclusion test — pure function, exported for TASK-21 reuse
// ---------------------------------------------------------------------------

/**
 * Returns true when `item` should be included in the monthly summary for the
 * given (month, year). Does NOT check category type — caller decides the bucket.
 *
 * @param item - A BudgetItem row with its `date` already as a Date.
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

  // Installment row — included only when its own date matches month+year
  if (item.installmentGroupId !== null) {
    const d = item.date instanceof Date ? item.date : new Date(item.date);
    return d.getMonth() + 1 === month && d.getFullYear() === year;
  }

  // isOneTime — included only for its exact month+year
  if (item.isOneTime) {
    const d = item.date instanceof Date ? item.date : new Date(item.date);
    return d.getMonth() + 1 === month && d.getFullYear() === year;
  }

  // Holiday item — month determined by Hebrew calendar
  if (item.holiday !== null) {
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
 * Returns the contributing amount string for this item in the queried month.
 * Handles yearly spread (÷12) and otherwise returns `item.amount` unchanged.
 *
 * Precondition: `isItemIncludedInMonth` must have returned true for this item.
 */
function getContributingAmount(item: BudgetItem): string {
  // Yearly spread (no assignedMonth, no holiday, not isOneTime, no installmentGroupId)
  if (
    item.frequency === CategoryFrequency.YEARLY &&
    item.assignedMonth === null &&
    item.holiday === null &&
    !item.isOneTime &&
    item.installmentGroupId === null
  ) {
    // Divide by 12, decimal-safe
    const cents = toCents(item.amount);
    const monthly = cents / 12n;
    const remainder = cents % 12n;
    // Round: if remainder * 2 >= 12, round up
    const rounded = remainder * 2n >= 12n ? monthly + 1n : monthly;
    return centsToNumber(rounded).toFixed(2);
  }
  return item.amount;
}

// ---------------------------------------------------------------------------
// Debt category subtree resolution
// ---------------------------------------------------------------------------

const DEBT_PARENT_NAME = 'החזרי חובות';

/**
 * Returns the set of category IDs that belong to the "החזרי חובות" subtree
 * (the parent AND all its descendants).
 */
async function resolveDebtCategoryIds(
  categoryRepo: Repository<Category>,
  householdId: string,
): Promise<Set<string>> {
  // Load all categories visible to this household (household-specific + global)
  const all = await categoryRepo
    .createQueryBuilder('cat')
    .leftJoin('cat.household', 'household')
    .where('household.id = :householdId OR household.id IS NULL', { householdId })
    .select(['cat.id', 'cat.name', 'cat.type'])
    .addSelect('parent.id', 'parent_id')
    .leftJoin('cat.parentCategory', 'parent')
    .addSelect(['parent.id'])
    .getMany();

  // Also load parentCategory relation so we can traverse the tree
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

  // Find the debt parent
  const debtParent = categories.find(
    c => c.name === DEBT_PARENT_NAME && c.type === CategoryType.EXPENSE,
  );
  if (!debtParent) {
    return new Set();
  }

  // BFS to collect all descendant IDs
  const debtIds = new Set<string>([debtParent.id]);
  const queue: string[] = [debtParent.id];
  while (queue.length > 0) {
    const parentId = queue.shift()!;
    for (const cat of categories) {
      if (cat.parentCategory?.id === parentId && !debtIds.has(cat.id)) {
        debtIds.add(cat.id);
        queue.push(cat.id);
      }
    }
  }
  return debtIds;
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
   */
  async computeSummary(
    householdId: string,
    month: number,
    year: number,
  ): Promise<MonthlySummary> {
    // 1. Load all budget items for this household with their categories
    const items = await this.budgetItemRepo
      .createQueryBuilder('item')
      .innerJoin('item.household', 'household')
      .leftJoinAndSelect('item.category', 'category')
      .where('household.id = :householdId', { householdId })
      .getMany();

    // 2. Resolve debt category subtree
    const debtCategoryIds = await resolveDebtCategoryIds(this.categoryRepo, householdId);

    // 3. Pre-fetch exchange rates for all distinct currencies (one call per currency)
    const distinctCurrencies = [...new Set(items.map(item => item.currency))];
    const rateMap = new Map<CurrencyCode, string>();
    await Promise.all(
      distinctCurrencies.map(async currency => {
        const rate = await exchangeRateService.getRateToIls(currency);
        rateMap.set(currency, rate);
      }),
    );

    // Helper: convert amount string to ILS using pre-fetched rate map
    const convertToIls = (amount: string, currency: CurrencyCode): bigint => {
      if (currency === CurrencyCode.ILS) {
        return toCents(amount);
      }
      const rate = rateMap.get(currency) ?? '1';
      // Multiply: amount * rate, stay in cents
      // We already have toCents(amount) as X*100, and rate as a decimal string.
      // Use floating point only for the rate multiplication, then reparse:
      // safer: use string multiplication via toCents on the result of multiply
      const [rInt, rFrac = ''] = rate.split('.');
      const rFracNorm = rFrac.padEnd(6, '0').slice(0, 6);
      const amountCents = toCents(amount); // BigInt, ×100
      // rate as integer (×1_000_000)
      const rateMicro = BigInt(rInt) * 1_000_000n + BigInt(rFracNorm);
      // amountCents * rateMicro = amount * rate * 100 * 1_000_000
      // We want amount * rate * 100 (i.e. ILS cents), so divide by 1_000_000
      const raw = amountCents * rateMicro;
      const cents = raw / 1_000_000n;
      return cents;
    };

    // 4. Accumulate buckets (all in BigInt cents)
    let incomesMonthly = 0n;
    let incomesYearly = 0n;
    let expensesMonthly = 0n;
    let expensesYearly = 0n;
    let expensesHolidays = 0n;
    let expensesInstallments = 0n;
    let debtRepayments = 0n;

    for (const item of items) {
      if (!isItemIncludedInMonth(item, month, year)) {
        continue;
      }

      const contributingAmountStr = getContributingAmount(item);
      const ilsCents = convertToIls(contributingAmountStr, item.currency);

      const categoryType = item.category?.type;
      const categoryId = item.category?.id;

      // Check if this is a debt repayment item
      const isDebt = categoryId !== undefined && categoryId !== null && debtCategoryIds.has(categoryId);

      if (isDebt) {
        debtRepayments += ilsCents;
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
      } else {
        // EXPENSE bucketing (holiday and installment take priority)
        if (item.holiday !== null) {
          expensesHolidays += ilsCents;
        } else if (item.installmentGroupId !== null) {
          expensesInstallments += ilsCents;
        } else if (item.frequency === CategoryFrequency.MONTHLY) {
          expensesMonthly += ilsCents;
        } else {
          expensesYearly += ilsCents;
        }
      }
    }

    // 5. Convert cents to rounded numbers (2 dp)
    const round2 = (cents: bigint): number => {
      const n = centsToNumber(cents);
      return Math.round(n * 100) / 100;
    };

    const incomesMonthlyNum = round2(incomesMonthly);
    const incomesYearlyNum = round2(incomesYearly);
    const expensesMonthlyNum = round2(expensesMonthly);
    const expensesYearlyNum = round2(expensesYearly);
    const expensesHolidaysNum = round2(expensesHolidays);
    const expensesInstallmentsNum = round2(expensesInstallments);
    const debtRepaymentsNum = round2(debtRepayments);

    const balanceBeforeDebts =
      Math.round(
        (incomesMonthlyNum + incomesYearlyNum -
          expensesMonthlyNum - expensesYearlyNum -
          expensesHolidaysNum - expensesInstallmentsNum) * 100,
      ) / 100;

    const balanceAfterDebts =
      Math.round((balanceBeforeDebts - debtRepaymentsNum) * 100) / 100;

    return {
      incomes: {
        monthly: incomesMonthlyNum,
        yearly: incomesYearlyNum,
      },
      expenses: {
        monthly: expensesMonthlyNum,
        yearly: expensesYearlyNum,
        holidays: expensesHolidaysNum,
        installments: expensesInstallmentsNum,
      },
      debtRepayments: debtRepaymentsNum,
      balanceBeforeDebts,
      balanceAfterDebts,
    };
  }
}

export const summaryService = new SummaryService();
