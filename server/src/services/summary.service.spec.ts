/**
 * Unit tests for SummaryService.computeSummary
 *
 * AppDataSource, ExchangeRateService, and hebrew-calendar util are mocked so
 * these tests run without a database, network, or calendar library.
 *
 * Rate is always 1 (ILS→ILS) to keep expected values trivial.
 */

// ---------------------------------------------------------------------------
// Module-level mocks (must be declared before imports)
// ---------------------------------------------------------------------------

// Mock AppDataSource
const mockBudgetItemGetMany = jest.fn<any, any>();
const mockCategoryFind = jest.fn<any, any>();

const budgetItemQB: any = {
  innerJoin: jest.fn().mockReturnThis(),
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  getMany: mockBudgetItemGetMany,
};

// We need two different repositories:
// - BudgetItem → createQueryBuilder returns budgetItemQB
// - Category   → find method (for resolveDebtCategoryIds)
// - Household  → unused in service core but required by constructor

const mockBudgetItemRepo = {
  createQueryBuilder: jest.fn(() => budgetItemQB),
};

const mockCategoryRepo = {
  createQueryBuilder: jest.fn(() => ({
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  })),
  find: mockCategoryFind,
};

const mockHouseholdRepo = {};

jest.mock('../config/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn((entity: any) => {
      const name = typeof entity === 'function' ? entity.name : String(entity);
      if (name === 'BudgetItem') return mockBudgetItemRepo;
      if (name === 'Category') return mockCategoryRepo;
      return mockHouseholdRepo;
    }),
  },
}));

// Mock exchange-rate service — always rate 1 (ILS)
jest.mock('./exchange-rate.service', () => ({
  exchangeRateService: {
    getRateToIls: jest.fn().mockResolvedValue('1'),
  },
}));

// Mock hebrew-calendar util
const mockGetErevHolidayGregorianMonth = jest.fn<number, [any, number]>();
jest.mock('../utils/hebrew-calendar.util', () => ({
  getErevHolidayGregorianMonth: (holiday: any, year: number) =>
    mockGetErevHolidayGregorianMonth(holiday, year),
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import {
  CategoryFrequency,
  CategoryType,
  CurrencyCode,
  Holiday,
} from '@gutplus/shared';
import { SummaryService, isItemIncludedInMonth } from './summary.service';
import { BudgetItem } from '../entities/budget-item.entity';
import { Category } from '../entities/category.entity';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: 'cat-expense-default',
    name: 'General',
    type: CategoryType.EXPENSE,
    household: null,
    parentCategory: null,
    subCategories: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as unknown as Category;
}

function makeItem(overrides: Partial<BudgetItem> = {}): BudgetItem {
  return {
    id: 'item-1',
    amount: '100.00',
    description: 'test',
    needsReview: false,
    frequency: CategoryFrequency.MONTHLY,
    installmentsTotal: null,
    installmentIndex: null,
    installmentGroupId: null,
    endDate: null,
    targetAmount: null,
    assignedMonth: null,
    baseMonth: null,
    holiday: null,
    isOneTime: false,
    currency: CurrencyCode.ILS,
    household: { id: 'hh-1' } as any,
    category: makeCategory({ type: CategoryType.EXPENSE }),
    account: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as unknown as BudgetItem;
}

function setupItems(items: BudgetItem[], debtCategories: Category[] = []): void {
  mockBudgetItemGetMany.mockResolvedValue(items);
  // Default: no debt categories unless provided
  mockCategoryFind.mockResolvedValue(debtCategories);
}

// ---------------------------------------------------------------------------
// Tests for isItemIncludedInMonth (pure function)
// ---------------------------------------------------------------------------

describe('isItemIncludedInMonth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default holiday mock: return 9 (September) for any holiday
    mockGetErevHolidayGregorianMonth.mockReturnValue(9);
  });

  describe('bi-monthly (baseMonth) parity', () => {
    it('includes item when queried month has same parity as baseMonth (odd)', () => {
      const item = makeItem({ frequency: CategoryFrequency.MONTHLY, baseMonth: 1 }); // odd baseMonth
      expect(isItemIncludedInMonth(item, 3, 2026)).toBe(true);  // month 3 is odd
      expect(isItemIncludedInMonth(item, 5, 2026)).toBe(true);  // month 5 is odd
    });

    it('excludes item when queried month has different parity (even vs odd baseMonth)', () => {
      const item = makeItem({ frequency: CategoryFrequency.MONTHLY, baseMonth: 1 }); // odd baseMonth
      expect(isItemIncludedInMonth(item, 2, 2026)).toBe(false); // month 2 is even
      expect(isItemIncludedInMonth(item, 4, 2026)).toBe(false); // month 4 is even
    });

    it('includes even baseMonth item only on even months', () => {
      const item = makeItem({ frequency: CategoryFrequency.MONTHLY, baseMonth: 2 }); // even baseMonth
      expect(isItemIncludedInMonth(item, 2, 2026)).toBe(true);
      expect(isItemIncludedInMonth(item, 4, 2026)).toBe(true);
      expect(isItemIncludedInMonth(item, 1, 2026)).toBe(false);
      expect(isItemIncludedInMonth(item, 3, 2026)).toBe(false);
    });
  });

  describe('yearly assignedMonth', () => {
    it('includes yearly item only in its assignedMonth', () => {
      const item = makeItem({ frequency: CategoryFrequency.YEARLY, assignedMonth: 4 });
      expect(isItemIncludedInMonth(item, 4, 2026)).toBe(true);
      expect(isItemIncludedInMonth(item, 4, 2025)).toBe(true);  // repeats every year
      expect(isItemIncludedInMonth(item, 5, 2026)).toBe(false);
      expect(isItemIncludedInMonth(item, 3, 2026)).toBe(false);
    });

    it('spread item (YEARLY, assignedMonth null, not isOneTime, no holiday) included every month', () => {
      const item = makeItem({ frequency: CategoryFrequency.YEARLY, assignedMonth: null });
      for (let m = 1; m <= 12; m++) {
        expect(isItemIncludedInMonth(item, m, 2026)).toBe(true);
      }
    });
  });

  describe('isOneTime', () => {
    it('isOneTime item included in its assignedMonth', () => {
      const item = makeItem({
        isOneTime: true,
        assignedMonth: 6,
        frequency: CategoryFrequency.YEARLY,
      });
      expect(isItemIncludedInMonth(item, 6, 2026)).toBe(true);
    });

    it('isOneTime item is anchored to month only — included in its month every year', () => {
      const item = makeItem({
        isOneTime: true,
        assignedMonth: 6,
        frequency: CategoryFrequency.YEARLY,
      });
      expect(isItemIncludedInMonth(item, 6, 2027)).toBe(true);
    });

    it('isOneTime item excluded in a different month', () => {
      const item = makeItem({
        isOneTime: true,
        assignedMonth: 6,
        frequency: CategoryFrequency.YEARLY,
      });
      expect(isItemIncludedInMonth(item, 7, 2026)).toBe(false);
    });
  });

  describe('installment rows', () => {
    it('installment row included in its assignedMonth at full amount (not divided)', () => {
      const item = makeItem({
        installmentGroupId: 'grp-1',
        installmentsTotal: 12,
        installmentIndex: 3,
        assignedMonth: 6,
        frequency: CategoryFrequency.MONTHLY,
      });
      expect(isItemIncludedInMonth(item, 6, 2026)).toBe(true);
    });

    it('installment row excluded in a different month', () => {
      const item = makeItem({
        installmentGroupId: 'grp-1',
        installmentsTotal: 12,
        installmentIndex: 3,
        assignedMonth: 6,
        frequency: CategoryFrequency.MONTHLY,
      });
      expect(isItemIncludedInMonth(item, 5, 2026)).toBe(false);
      expect(isItemIncludedInMonth(item, 7, 2026)).toBe(false);
    });
  });

  describe('holiday items', () => {
    it('holiday item placed in the eve month returned by the util', () => {
      mockGetErevHolidayGregorianMonth.mockReturnValue(4); // April
      const item = makeItem({ holiday: Holiday.PASSOVER, frequency: CategoryFrequency.YEARLY });
      expect(isItemIncludedInMonth(item, 4, 2026)).toBe(true);
      expect(isItemIncludedInMonth(item, 3, 2026)).toBe(false);
      expect(isItemIncludedInMonth(item, 5, 2026)).toBe(false);
    });

    it('passes the correct year to getErevHolidayGregorianMonth', () => {
      mockGetErevHolidayGregorianMonth.mockReturnValue(9);
      const item = makeItem({ holiday: Holiday.ROSH_HASHANA, frequency: CategoryFrequency.YEARLY });
      isItemIncludedInMonth(item, 9, 2027);
      expect(mockGetErevHolidayGregorianMonth).toHaveBeenCalledWith(Holiday.ROSH_HASHANA, 2027);
    });
  });

  describe('endDate exclusion', () => {
    it('excludes item whose endDate is before the first day of the queried month', () => {
      // endDate = May 31 2026 → before June 1 2026 → excluded for month 6
      const item = makeItem({
        endDate: new Date(2026, 4, 31), // May 31 2026
        frequency: CategoryFrequency.MONTHLY,
      });
      expect(isItemIncludedInMonth(item, 6, 2026)).toBe(false);
    });

    it('includes item whose endDate is exactly on the first day of the queried month', () => {
      // endDate = June 1 2026 → not before June 1 2026 → included
      const item = makeItem({
        endDate: new Date(2026, 5, 1), // June 1 2026
        frequency: CategoryFrequency.MONTHLY,
      });
      expect(isItemIncludedInMonth(item, 6, 2026)).toBe(true);
    });

    it('includes item whose endDate is within the queried month', () => {
      const item = makeItem({
        endDate: new Date(2026, 5, 15), // June 15 2026
        frequency: CategoryFrequency.MONTHLY,
      });
      expect(isItemIncludedInMonth(item, 6, 2026)).toBe(true);
    });
  });

  describe('Dec→Jan rollover', () => {
    it('a monthly item included in December year N is also included January year N+1', () => {
      const item = makeItem({ frequency: CategoryFrequency.MONTHLY });
      expect(isItemIncludedInMonth(item, 12, 2025)).toBe(true);
      expect(isItemIncludedInMonth(item, 1, 2026)).toBe(true);
    });

    it('a yearly assignedMonth=12 item included in Dec but not in Jan', () => {
      const item = makeItem({ frequency: CategoryFrequency.YEARLY, assignedMonth: 12 });
      expect(isItemIncludedInMonth(item, 12, 2025)).toBe(true);
      expect(isItemIncludedInMonth(item, 1, 2026)).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// Tests for SummaryService.computeSummary (integration of the whole engine)
// ---------------------------------------------------------------------------

describe('SummaryService.computeSummary', () => {
  let service: SummaryService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetErevHolidayGregorianMonth.mockReturnValue(4); // default: April
    // Default: no debt categories
    mockCategoryFind.mockResolvedValue([]);
    service = new SummaryService();
  });

  // -------------------------------------------------------------------------
  // Basic income/expense bucketing
  // -------------------------------------------------------------------------

  it('monthly income item goes to incomes.monthly', async () => {
    const item = makeItem({
      amount: '5000.00',
      frequency: CategoryFrequency.MONTHLY,
      category: makeCategory({ type: CategoryType.INCOME }),
    });
    setupItems([item]);

    const result = await service.computeSummary('hh-1', 6, 2026);
    expect(result.incomes.monthly).toBe(5000);
    expect(result.incomes.yearly).toBe(0);
  });

  it('yearly income item with assignedMonth goes to incomes.yearly as a dry ÷12 average', async () => {
    // computeSummary uses the Snapshot-only dry-average path: a yearly item
    // anchored to one month no longer spikes that month — it contributes
    // amount/12 to every month instead (computeDryMonthlyAverage).
    const item = makeItem({
      amount: '3000.00',
      frequency: CategoryFrequency.YEARLY,
      assignedMonth: 6,
      category: makeCategory({ type: CategoryType.INCOME }),
    });
    setupItems([item]);

    const result = await service.computeSummary('hh-1', 6, 2026);
    expect(result.incomes.yearly).toBe(250); // 3000 / 12
    expect(result.incomes.monthly).toBe(0);
  });

  it('yearly spread income item goes to incomes.yearly (amount/12 per month)', async () => {
    const item = makeItem({
      amount: '12000.00',
      frequency: CategoryFrequency.YEARLY,
      assignedMonth: null,
      category: makeCategory({ type: CategoryType.INCOME }),
    });
    setupItems([item]);

    // 12000 / 12 = 1000 per month; 12 months × 1000 ≈ 12000
    const jan = await service.computeSummary('hh-1', 1, 2026);
    expect(jan.incomes.yearly).toBeCloseTo(1000, 2);

    // Sum across all months ≈ original amount
    let total = 0;
    for (let m = 1; m <= 12; m++) {
      const r = await service.computeSummary('hh-1', m, 2026);
      total += r.incomes.yearly;
    }
    expect(total).toBeCloseTo(12000, 0);
  });

  it('monthly expense item goes to expenses.monthly', async () => {
    const item = makeItem({
      amount: '500.00',
      frequency: CategoryFrequency.MONTHLY,
      category: makeCategory({ type: CategoryType.EXPENSE }),
    });
    setupItems([item]);

    const result = await service.computeSummary('hh-1', 6, 2026);
    expect(result.expenses.monthly).toBe(500);
  });

  it('holiday expense item (priority) goes to expenses.holidays as a dry ÷12 average, every month', async () => {
    // Dry-average mode includes holiday items in every month (not just their
    // Hebrew-calendar month) at amount/12 — no more once-a-year spike.
    mockGetErevHolidayGregorianMonth.mockReturnValue(6); // June
    const item = makeItem({
      amount: '800.00',
      frequency: CategoryFrequency.YEARLY,
      holiday: Holiday.SHAVUOT,
      category: makeCategory({ type: CategoryType.EXPENSE }),
    });
    setupItems([item]);

    const june = await service.computeSummary('hh-1', 6, 2026);
    expect(june.expenses.holidays).toBeCloseTo(66.67, 2); // 800 / 12
    expect(june.expenses.monthly).toBe(0);
    expect(june.expenses.yearly).toBe(0);

    // A month that is NOT the holiday's Hebrew-calendar month still gets the
    // same dry average — dry-average ignores seasonality entirely.
    const september = await service.computeSummary('hh-1', 9, 2026);
    expect(september.expenses.holidays).toBeCloseTo(66.67, 2);
  });

  it('installment expense item goes to expenses.installments (full amount, not divided)', async () => {
    const item = makeItem({
      amount: '200.00',
      installmentGroupId: 'grp-install',
      installmentsTotal: 12,
      installmentIndex: 3,
      assignedMonth: 6, // June
      frequency: CategoryFrequency.MONTHLY,
      category: makeCategory({ type: CategoryType.EXPENSE }),
    });
    setupItems([item]);

    const result = await service.computeSummary('hh-1', 6, 2026);
    expect(result.expenses.installments).toBe(200);  // full amount, not 200/12
    expect(result.expenses.monthly).toBe(0);
  });

  // -------------------------------------------------------------------------
  // Debt repayments
  // -------------------------------------------------------------------------

  it('debt repayment item appears in debtRepayments and NOT in expenses', async () => {
    const debtParent = makeCategory({
      id: 'cat-debt-parent',
      name: 'החזרי חובות',
      type: CategoryType.EXPENSE,
      parentCategory: null,
    });
    const debtSub = makeCategory({
      id: 'cat-debt-sub',
      name: 'החזר הלוואה - בנק',
      type: CategoryType.EXPENSE,
      parentCategory: debtParent,
    });

    const item = makeItem({
      amount: '1500.00',
      frequency: CategoryFrequency.MONTHLY,
      category: debtSub,
    });

    setupItems([item], [debtParent, debtSub]);

    const result = await service.computeSummary('hh-1', 6, 2026);
    expect(result.debtRepayments).toBe(1500);
    expect(result.expenses.monthly).toBe(0);
    expect(result.expenses.yearly).toBe(0);
  });

  // -------------------------------------------------------------------------
  // Balance calculations
  // -------------------------------------------------------------------------

  it('balanceBeforeDebts = income - expenses (excl. debts)', async () => {
    const income = makeItem({
      id: 'item-income',
      amount: '10000.00',
      frequency: CategoryFrequency.MONTHLY,
      category: makeCategory({ type: CategoryType.INCOME }),
    });
    const expense = makeItem({
      id: 'item-expense',
      amount: '3000.00',
      frequency: CategoryFrequency.MONTHLY,
      category: makeCategory({ type: CategoryType.EXPENSE }),
    });
    setupItems([income, expense]);

    const result = await service.computeSummary('hh-1', 6, 2026);
    expect(result.balanceBeforeDebts).toBe(7000);
  });

  it('balanceAfterDebts = balanceBeforeDebts - debtRepayments', async () => {
    const debtParent = makeCategory({
      id: 'cat-debt-parent',
      name: 'החזרי חובות',
      type: CategoryType.EXPENSE,
      parentCategory: null,
    });

    const income = makeItem({
      id: 'item-income',
      amount: '10000.00',
      frequency: CategoryFrequency.MONTHLY,
      category: makeCategory({ type: CategoryType.INCOME }),
    });
    const expense = makeItem({
      id: 'item-expense',
      amount: '3000.00',
      frequency: CategoryFrequency.MONTHLY,
      category: makeCategory({ type: CategoryType.EXPENSE }),
    });
    const debt = makeItem({
      id: 'item-debt',
      amount: '2000.00',
      frequency: CategoryFrequency.MONTHLY,
      category: debtParent,
    });

    setupItems([income, expense, debt], [debtParent]);

    const result = await service.computeSummary('hh-1', 6, 2026);
    expect(result.balanceBeforeDebts).toBe(7000);   // 10000 - 3000
    expect(result.balanceAfterDebts).toBe(5000);    // 7000 - 2000
  });

  // -------------------------------------------------------------------------
  // Category breakouts (מעשרות) + yearly spread/this-month split
  // -------------------------------------------------------------------------

  it('pulls מעשרות subtree into breakouts: excluded from general, still in balance', async () => {
    const tithesParent = makeCategory({
      id: 'cat-tithes-parent',
      name: 'מעשרות וצדקה',
      type: CategoryType.EXPENSE,
      parentCategory: null,
    });
    const tithesSub = makeCategory({
      id: 'cat-tithes-sub',
      name: 'מעשרות',
      type: CategoryType.EXPENSE,
      parentCategory: { id: 'cat-tithes-parent' } as any,
    });

    const income = makeItem({
      id: 'item-income',
      amount: '10000.00',
      frequency: CategoryFrequency.MONTHLY,
      category: makeCategory({ type: CategoryType.INCOME }),
    });
    const general = makeItem({
      id: 'item-general',
      amount: '1000.00',
      frequency: CategoryFrequency.MONTHLY,
      category: makeCategory({ type: CategoryType.EXPENSE }),
    });
    const tithes = makeItem({
      id: 'item-tithes',
      amount: '500.00',
      frequency: CategoryFrequency.MONTHLY,
      category: tithesSub,
    });

    setupItems([income, general, tithes], [tithesParent, tithesSub]);

    const result = await service.computeSummary('hh-1', 6, 2026);
    const tithesRow = result.expenses.breakouts.find(b => b.name === 'מעשרות וצדקה');
    expect(tithesRow?.amount).toBe(500);
    expect(result.expenses.monthly).toBe(1000);      // tithes carved out of general
    expect(result.balanceBeforeDebts).toBe(8500);    // 10000 - 1000 - 500
    expect(result.balanceAfterDebts).toBe(8500);     // no debt
  });

  it('splits yearly into spread (÷12) and this-month buckets; both are dry ÷12 averages', async () => {
    // Dry-average mode collapses yearly-anchored items into the same ÷12
    // math as yearly-spread items — they land in different buckets
    // (yearlySpread vs. yearlyThisMonth) but both contribute amount/12.
    const spread = makeItem({
      id: 'item-spread',
      amount: '1200.00',
      frequency: CategoryFrequency.YEARLY,
      assignedMonth: null,
      category: makeCategory({ type: CategoryType.EXPENSE }),
    });
    const assigned = makeItem({
      id: 'item-assigned',
      amount: '600.00',
      frequency: CategoryFrequency.YEARLY,
      assignedMonth: 6,
      category: makeCategory({ type: CategoryType.EXPENSE }),
    });
    setupItems([spread, assigned]);

    const result = await service.computeSummary('hh-1', 6, 2026);
    expect(result.expenses.yearlySpread).toBe(100);     // 1200 / 12
    expect(result.expenses.yearlyThisMonth).toBe(50);   // 600 / 12
    expect(result.expenses.yearly).toBe(150);
  });

  // -------------------------------------------------------------------------
  // endDate exclusion
  // -------------------------------------------------------------------------

  it('excludes item after its endDate', async () => {
    const item = makeItem({
      amount: '500.00',
      frequency: CategoryFrequency.MONTHLY,
      endDate: new Date(2026, 4, 31), // May 31 → expired before June 1
      category: makeCategory({ type: CategoryType.EXPENSE }),
    });
    setupItems([item]);

    const result = await service.computeSummary('hh-1', 6, 2026);
    expect(result.expenses.monthly).toBe(0);
  });

  // -------------------------------------------------------------------------
  // Dec→Jan rollover
  // -------------------------------------------------------------------------

  it('plain monthly item included in both December and January', async () => {
    const item = makeItem({
      amount: '400.00',
      frequency: CategoryFrequency.MONTHLY,
      category: makeCategory({ type: CategoryType.EXPENSE }),
    });
    setupItems([item]);

    const dec = await service.computeSummary('hh-1', 12, 2025);
    const jan = await service.computeSummary('hh-1', 1, 2026);

    expect(dec.expenses.monthly).toBe(400);
    expect(jan.expenses.monthly).toBe(400);
  });

  it('yearly assignedMonth=12 item is a dry ÷12 average in both December and January', async () => {
    // Dry-average mode ignores the assignedMonth anchor entirely — the item
    // contributes amount/12 in every month, not just its anchor month.
    const item = makeItem({
      amount: '600.00',
      frequency: CategoryFrequency.YEARLY,
      assignedMonth: 12,
      category: makeCategory({ type: CategoryType.EXPENSE }),
    });
    setupItems([item]);

    const dec = await service.computeSummary('hh-1', 12, 2025);
    const jan = await service.computeSummary('hh-1', 1, 2026);

    expect(dec.expenses.yearly).toBe(50); // 600 / 12
    expect(jan.expenses.yearly).toBe(50); // 600 / 12
  });

  // -------------------------------------------------------------------------
  // Empty household
  // -------------------------------------------------------------------------

  it('returns all-zero summary when there are no items', async () => {
    setupItems([]);

    const result = await service.computeSummary('hh-1', 6, 2026);
    expect(result).toEqual({
      incomes: { monthly: 0, yearly: 0 },
      expenses: {
        monthly: 0,
        yearly: 0,
        yearlySpread: 0,
        yearlyThisMonth: 0,
        holidays: 0,
        installments: 0,
        breakouts: [
          { name: 'מעשרות וצדקה', amount: 0 },
          { name: 'ירידת פריון עבודה', amount: 0 },
        ],
      },
      debtRepayments: 0,
      balanceBeforeDebts: 0,
      balanceAfterDebts: 0,
    });
  });
});
