/**
 * Unit tests for ForecastService.computeForecast
 *
 * AppDataSource, ExchangeRateService, and hebrew-calendar util are mocked so
 * these tests run without a database, network, or calendar library.
 *
 * Rate is always 1 (ILS→ILS) to keep expected values trivial.
 */

// ---------------------------------------------------------------------------
// Module-level mocks (must be declared before imports)
// ---------------------------------------------------------------------------

const mockBudgetItemGetMany = jest.fn<any, any>();
const mockCategoryFind = jest.fn<any, any>();
const mockExecutionGetMany = jest.fn<any, any>();

const budgetItemQB: any = {
  innerJoin: jest.fn().mockReturnThis(),
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  getMany: mockBudgetItemGetMany,
};

const executionQB: any = {
  innerJoin: jest.fn().mockReturnThis(),
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getMany: mockExecutionGetMany,
};

const mockBudgetItemRepo = {
  createQueryBuilder: jest.fn(() => budgetItemQB),
};

const mockCategoryRepo = {
  find: mockCategoryFind,
};

const mockExecutionRepo = {
  createQueryBuilder: jest.fn(() => executionQB),
};

jest.mock('../config/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn((entity: any) => {
      const name = typeof entity === 'function' ? entity.name : String(entity);
      if (name === 'BudgetItem') return mockBudgetItemRepo;
      if (name === 'Category') return mockCategoryRepo;
      if (name === 'BudgetItemExecution') return mockExecutionRepo;
      return {};
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
} from '@gutplus/shared';
import { ForecastService } from './forecast.service';
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
    targetAmount: null,
    description: 'test',
    needsReview: false,
    frequency: CategoryFrequency.MONTHLY,
    installmentsTotal: null,
    installmentIndex: null,
    installmentGroupId: null,
    endDate: null,
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
  mockCategoryFind.mockResolvedValue(debtCategories);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ForecastService.computeForecast', () => {
  let service: ForecastService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetErevHolidayGregorianMonth.mockReturnValue(9); // default: September
    mockCategoryFind.mockResolvedValue([]);
    mockExecutionGetMany.mockResolvedValue([]); // no execution rows by default
    service = new ForecastService();
  });

  // -------------------------------------------------------------------------
  // Rolling window: exactly 12 months
  // -------------------------------------------------------------------------

  it('returns exactly 12 months', async () => {
    setupItems([]);
    const result = await service.computeForecast('hh-1');
    expect(result).toHaveLength(12);
  });

  it('first month matches the current month and year', async () => {
    setupItems([]);
    const now = new Date();
    const result = await service.computeForecast('hh-1');
    expect(result[0].month).toBe(now.getMonth() + 1);
    expect(result[0].year).toBe(now.getFullYear());
  });

  // -------------------------------------------------------------------------
  // Dec → Jan rollover
  // -------------------------------------------------------------------------

  it('handles Dec→Jan year rollover in the 12-month window', async () => {
    setupItems([]);
    // Find the December slot in the result
    const now = new Date();
    const result = await service.computeForecast('hh-1');

    // Build expected sequence manually
    const expectedMonths: Array<{ month: number; year: number }> = [];
    for (let i = 0; i < 12; i++) {
      let m = now.getMonth() + 1 + i;
      let y = now.getFullYear();
      if (m > 12) { m -= 12; y += 1; }
      expectedMonths.push({ month: m, year: y });
    }

    for (let i = 0; i < 12; i++) {
      expect(result[i].month).toBe(expectedMonths[i].month);
      expect(result[i].year).toBe(expectedMonths[i].year);
    }
  });

  // -------------------------------------------------------------------------
  // targetAmount used over amount
  // -------------------------------------------------------------------------

  it('uses targetAmount when set, and sets isTargetBased=true', async () => {
    const item = makeItem({
      amount: '100.00',
      targetAmount: '200.00',
      frequency: CategoryFrequency.MONTHLY,
      category: makeCategory({ type: CategoryType.EXPENSE }),
    });
    setupItems([item]);

    const result = await service.computeForecast('hh-1');
    // Item is monthly → appears in all 12 months
    for (const month of result) {
      expect(month.isTargetBased).toBe(true);
      expect(month.expenses.monthly).toBe(200);
    }
  });

  it('uses amount when targetAmount is null, and sets isTargetBased=false', async () => {
    const item = makeItem({
      amount: '150.00',
      targetAmount: null,
      frequency: CategoryFrequency.MONTHLY,
      category: makeCategory({ type: CategoryType.EXPENSE }),
    });
    setupItems([item]);

    const result = await service.computeForecast('hh-1');
    for (const month of result) {
      expect(month.isTargetBased).toBe(false);
      expect(month.expenses.monthly).toBe(150);
    }
  });

  it('targetAmount differs from amount — forecast uses target, not amount', async () => {
    const item = makeItem({
      amount: '500.00',
      targetAmount: '750.00',
      frequency: CategoryFrequency.MONTHLY,
      category: makeCategory({ type: CategoryType.INCOME }),
    });
    setupItems([item]);

    const result = await service.computeForecast('hh-1');
    for (const month of result) {
      // Income is plain monthly → goes to incomes.monthly
      expect(month.incomes.monthly).toBe(750);
    }
  });

  // -------------------------------------------------------------------------
  // isTargetBased only set when at least one item in the month has targetAmount
  // -------------------------------------------------------------------------

  it('isTargetBased=false when no items have targetAmount', async () => {
    setupItems([
      makeItem({ amount: '100.00', targetAmount: null }),
      makeItem({ id: 'item-2', amount: '200.00', targetAmount: null }),
    ]);

    const result = await service.computeForecast('hh-1');
    for (const month of result) {
      expect(month.isTargetBased).toBe(false);
    }
  });

  // -------------------------------------------------------------------------
  // One-time item drops off in future years
  // -------------------------------------------------------------------------

  it('one-time item is included only in its assignedMonth within the window', async () => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // A one-time item anchored to the current month via assignedMonth
    const oneTimeItem = makeItem({
      isOneTime: true,
      assignedMonth: currentMonth,
      frequency: CategoryFrequency.YEARLY,
      amount: '999.00',
      targetAmount: null,
      category: makeCategory({ type: CategoryType.EXPENSE }),
    });
    setupItems([oneTimeItem]);

    const result = await service.computeForecast('hh-1');

    // The first month in the window (current month) should include the item
    expect(result[0].month).toBe(currentMonth);
    expect(result[0].year).toBe(currentYear);
    expect(result[0].expenses.yearly).toBe(999);

    // Any other month in the window must NOT include it
    const otherMonth = result.find(r => r.month !== currentMonth);
    if (otherMonth) {
      expect(otherMonth.expenses.yearly).toBe(0);
    }
  });

  // -------------------------------------------------------------------------
  // Summary shape is preserved
  // -------------------------------------------------------------------------

  it('each month entry includes all MonthlySummary fields plus month, year, isTargetBased', async () => {
    setupItems([]);
    const result = await service.computeForecast('hh-1');
    const entry = result[0];

    expect(entry).toHaveProperty('month');
    expect(entry).toHaveProperty('year');
    expect(entry).toHaveProperty('isTargetBased');
    expect(entry).toHaveProperty('incomes');
    expect(entry).toHaveProperty('expenses');
    expect(entry).toHaveProperty('debtRepayments');
    expect(entry).toHaveProperty('balanceBeforeDebts');
    expect(entry).toHaveProperty('balanceAfterDebts');
  });

  it('empty household returns 12 all-zero months', async () => {
    setupItems([]);
    const result = await service.computeForecast('hh-1');
    expect(result).toHaveLength(12);
    for (const month of result) {
      expect(month.incomes).toEqual({ monthly: 0, yearly: 0 });
      expect(month.expenses).toEqual({
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
      });
      expect(month.debtRepayments).toBe(0);
      expect(month.balanceBeforeDebts).toBe(0);
      expect(month.balanceAfterDebts).toBe(0);
      expect(month.isTargetBased).toBe(false);
    }
  });
});
