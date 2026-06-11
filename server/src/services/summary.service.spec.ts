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
    date: new Date(2026, 5, 1), // June 2026 (month 6)
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
    it('isOneTime item included in its exact month+year', () => {
      const item = makeItem({
        isOneTime: true,
        date: new Date(2026, 5, 15), // June 2026
        frequency: CategoryFrequency.YEARLY,
      });
      expect(isItemIncludedInMonth(item, 6, 2026)).toBe(true);
    });

    it('isOneTime item excluded in same month of a different year', () => {
      const item = makeItem({
        isOneTime: true,
        date: new Date(2026, 5, 15), // June 2026
        frequency: CategoryFrequency.YEARLY,
      });
      expect(isItemIncludedInMonth(item, 6, 2027)).toBe(false);
    });

    it('isOneTime item excluded in a different month of the same year', () => {
      const item = makeItem({
        isOneTime: true,
        date: new Date(2026, 5, 15), // June 2026
        frequency: CategoryFrequency.YEARLY,
      });
      expect(isItemIncludedInMonth(item, 7, 2026)).toBe(false);
    });
  });

  describe('installment rows', () => {
    it('installment row included in its own date month at full amount (not divided)', () => {
      const item = makeItem({
        installmentGroupId: 'grp-1',
        installmentsTotal: 12,
        installmentIndex: 3,
        date: new Date(2026, 5, 1), // June 2026
        frequency: CategoryFrequency.MONTHLY,
      });
      expect(isItemIncludedInMonth(item, 6, 2026)).toBe(true);
    });

    it('installment row excluded in different months', () => {
      const item = makeItem({
        installmentGroupId: 'grp-1',
        installmentsTotal: 12,
        installmentIndex: 3,
        date: new Date(2026, 5, 1), // June 2026
        frequency: CategoryFrequency.MONTHLY,
      });
      expect(isItemIncludedInMonth(item, 5, 2026)).toBe(false);
      expect(isItemIncludedInMonth(item, 7, 2026)).toBe(false);
      expect(isItemIncludedInMonth(item, 6, 2025)).toBe(false);
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
      const item = makeItem({ frequency: CategoryFrequency.MONTHLY, date: new Date(2025, 11, 1) });
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

  it('yearly income item with assignedMonth goes to incomes.yearly', async () => {
    const item = makeItem({
      amount: '3000.00',
      frequency: CategoryFrequency.YEARLY,
      assignedMonth: 6,
      category: makeCategory({ type: CategoryType.INCOME }),
    });
    setupItems([item]);

    const result = await service.computeSummary('hh-1', 6, 2026);
    expect(result.incomes.yearly).toBe(3000);
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

  it('holiday expense item (priority) goes to expenses.holidays', async () => {
    mockGetErevHolidayGregorianMonth.mockReturnValue(6); // June
    const item = makeItem({
      amount: '800.00',
      frequency: CategoryFrequency.YEARLY,
      holiday: Holiday.SHAVUOT,
      category: makeCategory({ type: CategoryType.EXPENSE }),
    });
    setupItems([item]);

    const result = await service.computeSummary('hh-1', 6, 2026);
    expect(result.expenses.holidays).toBe(800);
    expect(result.expenses.monthly).toBe(0);
    expect(result.expenses.yearly).toBe(0);
  });

  it('installment expense item goes to expenses.installments (full amount, not divided)', async () => {
    const item = makeItem({
      amount: '200.00',
      installmentGroupId: 'grp-install',
      installmentsTotal: 12,
      installmentIndex: 3,
      date: new Date(2026, 5, 1), // June 2026
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

  it('yearly assignedMonth=12 item included in December but not January', async () => {
    const item = makeItem({
      amount: '600.00',
      frequency: CategoryFrequency.YEARLY,
      assignedMonth: 12,
      category: makeCategory({ type: CategoryType.EXPENSE }),
    });
    setupItems([item]);

    const dec = await service.computeSummary('hh-1', 12, 2025);
    const jan = await service.computeSummary('hh-1', 1, 2026);

    expect(dec.expenses.yearly).toBe(600);
    expect(jan.expenses.yearly).toBe(0);
  });

  // -------------------------------------------------------------------------
  // Empty household
  // -------------------------------------------------------------------------

  it('returns all-zero summary when there are no items', async () => {
    setupItems([]);

    const result = await service.computeSummary('hh-1', 6, 2026);
    expect(result).toEqual({
      incomes: { monthly: 0, yearly: 0 },
      expenses: { monthly: 0, yearly: 0, holidays: 0, installments: 0 },
      debtRepayments: 0,
      balanceBeforeDebts: 0,
      balanceAfterDebts: 0,
    });
  });
});
