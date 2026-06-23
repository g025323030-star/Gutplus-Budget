import { randomUUID } from 'crypto';
import { EntityManager, Repository } from 'typeorm';
import {
  CategoryType,
  CurrencyCode,
  TransactionFrequency,
} from '@gutplus/shared';
import type {
  BudgetItem as BudgetItemShared,
  BudgetItemListItem,
} from '@gutplus/shared';
import { AppDataSource } from '../config/data-source';
import { Account } from '../entities/account.entity';
import { BudgetItem } from '../entities/budget-item.entity';
import { Category } from '../entities/category.entity';
import { Household } from '../entities/household.entity';
import {
  CreateBudgetItemDto,
  UpdateBudgetItemDto,
} from '../dto/budget-item.dto';

export type CreateBudgetItemServiceResult =
  | { kind: 'budgetItems'; data: BudgetItemShared[] };

const toBudgetItemShared = (row: BudgetItem): BudgetItemShared => ({
  id: row.id,
  amount: row.amount,
  description: row.description,
  needsReview: row.needsReview,
  frequency: row.frequency,
  installmentsTotal: row.installmentsTotal,
  installmentIndex: row.installmentIndex,
  installmentGroupId: row.installmentGroupId,
  endDate: row.endDate instanceof Date
    ? row.endDate.toISOString()
    : (row.endDate as unknown as string | null),
  householdId: row.household?.id ?? '',
  categoryId: row.category?.id ?? null,
  accountId: row.account?.id ?? null,
  targetAmount: row.targetAmount,
  assignedMonth: row.assignedMonth,
  baseMonth: row.baseMonth,
  holiday: row.holiday,
  isOneTime: row.isOneTime,
  currency: row.currency,
  createdAt:
    row.createdAt instanceof Date
      ? row.createdAt.toISOString()
      : (row.createdAt as unknown as string),
  updatedAt:
    row.updatedAt instanceof Date
      ? row.updatedAt.toISOString()
      : (row.updatedAt as unknown as string),
});

export class BudgetItemService {
  private budgetItemRepository: Repository<BudgetItem>;
  private householdRepository: Repository<Household>;
  private categoryRepository: Repository<Category>;

  constructor() {
    this.budgetItemRepository = AppDataSource.getRepository(BudgetItem);
    this.householdRepository = AppDataSource.getRepository(Household);
    this.categoryRepository = AppDataSource.getRepository(Category);
  }

  /**
   * Idempotently marks a household's expense templates as initialized after its
   * first budget item is created. A single conditional UPDATE keeps this cheap:
   * it only writes when the flag is still false.
   */
  private async markExpenseTemplatesInitialized(householdId: string): Promise<void> {
    await this.householdRepository.update(
      { id: householdId, expenseTemplatesInitialized: false },
      { expenseTemplatesInitialized: true },
    );
  }

  /** Income counterpart of {@link markExpenseTemplatesInitialized}. */
  private async markIncomeTemplatesInitialized(householdId: string): Promise<void> {
    await this.householdRepository.update(
      { id: householdId, incomeTemplatesInitialized: false },
      { incomeTemplatesInitialized: true },
    );
  }

  /**
   * Flips the per-type "templates initialized" flag after a budget item is
   * created. A budget item has no type of its own — its type comes from its
   * linked category. We look up the category type and mark income vs. expense
   * accordingly; when there is no category we fall back to expense to preserve
   * the previous unconditional behavior.
   */
  private async markTemplatesInitialized(
    householdId: string,
    categoryId?: string,
  ): Promise<void> {
    if (categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: categoryId },
        select: { id: true, type: true },
      });
      if (category?.type === CategoryType.INCOME) {
        await this.markIncomeTemplatesInitialized(householdId);
        return;
      }
    }
    await this.markExpenseTemplatesInitialized(householdId);
  }

  async create(
    dto: CreateBudgetItemDto,
  ): Promise<CreateBudgetItemServiceResult> {
    const hasInstallments =
      dto.installmentsTotal !== undefined &&
      dto.installmentsTotal !== null &&
      dto.installmentsTotal >= 2 &&
      dto.installmentIndex !== undefined &&
      dto.installmentIndex !== null;

    const isBoundedRecurring =
      dto.isRecurring === true && dto.endDate !== undefined;

    if (isBoundedRecurring) {
      const created = await this.createBoundedRecurring(dto);
      await this.markTemplatesInitialized(dto.householdId, dto.categoryId);
      return { kind: 'budgetItems', data: created };
    }

    if (hasInstallments) {
      const created = await this.createInstallments(dto);
      await this.markTemplatesInitialized(dto.householdId, dto.categoryId);
      return { kind: 'budgetItems', data: created };
    }

    const created = await this.createSingleBudgetItem(dto);
    await this.markTemplatesInitialized(dto.householdId, dto.categoryId);
    return { kind: 'budgetItems', data: [created] };
  }

  private buildBaseFields(dto: CreateBudgetItemDto) {
    return {
      needsReview: dto.needsReview ?? false,
      targetAmount: dto.targetAmount ?? null,
      assignedMonth: dto.assignedMonth ?? null,
      baseMonth: dto.baseMonth ?? null,
      holiday: dto.holiday ?? null,
      isOneTime: dto.isOneTime ?? false,
      currency: dto.currency ?? CurrencyCode.ILS,
    };
  }

  private async createBoundedRecurring(
    dto: CreateBudgetItemDto,
  ): Promise<BudgetItemShared[]> {
    if (!dto.recurringFrequency) {
      throw new Error('recurringFrequency is required for recurring budget items');
    }

    const endDate = new Date(dto.endDate as string);

    // The summary/forecast engine already expands a single monthly/bi-monthly
    // row across every month and excludes it once endDate is past — so we
    // persist a SINGLE row carrying endDate rather than materializing one row
    // per month. For BI_MONTHLY we anchor parity via baseMonth (the start
    // month); MONTHLY rows leave baseMonth null (included every month).
    const startMonth = dto.assignedMonth ?? new Date().getMonth() + 1;
    const baseMonth =
      dto.recurringFrequency === TransactionFrequency.BI_MONTHLY
        ? startMonth
        : null;

    await this.assertReferencesExist(this.budgetItemRepository.manager, {
      householdId: dto.householdId,
      categoryId: dto.categoryId,
      accountId: dto.accountId,
    });

    const entity = this.budgetItemRepository.create({
      amount: dto.amount,
      description: dto.description,
      frequency: dto.frequency,
      installmentsTotal: null,
      installmentIndex: null,
      installmentGroupId: null,
      endDate: endDate,
      household: { id: dto.householdId } as any,
      category: dto.categoryId ? ({ id: dto.categoryId } as any) : null,
      account: dto.accountId ? ({ id: dto.accountId } as any) : null,
      ...this.buildBaseFields(dto),
      baseMonth,
    });
    const saved = await this.budgetItemRepository.save(entity);
    return [toBudgetItemShared(saved)];
  }

  /**
   * Splits a decimal amount string (e.g. "3000.00") evenly across `count`
   * installments using integer-cent arithmetic to avoid floating-point error.
   *
   * Formula:
   *   totalCents = round(amount * 100)
   *   base       = floor(totalCents / count)          // cents every installment gets
   *   remainder  = totalCents - base * count           // 0 ≤ remainder < count
   *
   * The first `remainder` installments (index 1..remainder) receive one extra
   * cent so that sum(shares) === totalCents exactly.
   *
   * Returns an array of length `count` where element [i-1] is the share for
   * installment index i, formatted to exactly 2 decimal places.
   *
   * Example: "3000.00" / 3 → ["1000.00", "1000.00", "1000.00"]
   * Example: "1000.00" / 3 → ["333.34", "333.33", "333.33"]
   */
  private splitAmountIntoInstallments(amount: string, count: number): string[] {
    // Parse to integer cents; Math.round handles any trailing float noise.
    const totalCents = Math.round(parseFloat(amount) * 100);
    const base = Math.floor(totalCents / count);
    const remainder = totalCents - base * count;

    const shares: string[] = [];
    for (let i = 1; i <= count; i++) {
      // First `remainder` installments get one extra cent.
      const cents = i <= remainder ? base + 1 : base;
      shares.push((cents / 100).toFixed(2));
    }
    return shares;
  }

  private async createInstallments(
    dto: CreateBudgetItemDto,
  ): Promise<BudgetItemShared[]> {
    const total = dto.installmentsTotal as number;
    const payloadIndex = dto.installmentIndex as number;
    const groupId = randomUUID();
    // Each installment is anchored to a month of the year via assignedMonth.
    // The plan's start month comes from the payload (defaulting to the current
    // month); each row steps forward from it, wrapping around 1–12.
    const startMonth = dto.assignedMonth ?? new Date().getMonth() + 1;

    // Split the total purchase price into per-installment shares once so that
    // each row stores only its own share (not the full purchase price).
    const shares = this.splitAmountIntoInstallments(dto.amount, total);

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await this.assertReferencesExist(queryRunner.manager, {
        householdId: dto.householdId,
        categoryId: dto.categoryId,
        accountId: dto.accountId,
      });

      const repo = queryRunner.manager.getRepository(BudgetItem);
      const created: BudgetItem[] = [];
      for (let i = 1; i <= total; i++) {
        const offset = i - payloadIndex;
        const installmentMonth = (((startMonth - 1 + offset) % 12) + 12) % 12 + 1;
        const entity = repo.create({
          // shares is 0-indexed; installment index i maps to shares[i-1].
          amount: shares[i - 1],
          description: dto.description,
          frequency: dto.frequency,
          installmentsTotal: total,
          installmentIndex: i,
          installmentGroupId: groupId,
          endDate: null,
          household: { id: dto.householdId } as any,
          category: dto.categoryId ? ({ id: dto.categoryId } as any) : null,
          account: dto.accountId ? ({ id: dto.accountId } as any) : null,
          ...this.buildBaseFields(dto),
          assignedMonth: installmentMonth,
        });
        const saved = await repo.save(entity);
        created.push(saved);
      }

      await queryRunner.commitTransaction();
      return created.map(toBudgetItemShared);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  private async createSingleBudgetItem(
    dto: CreateBudgetItemDto,
  ): Promise<BudgetItemShared> {
    await this.assertReferencesExist(this.budgetItemRepository.manager, {
      householdId: dto.householdId,
      categoryId: dto.categoryId,
      accountId: dto.accountId,
    });

    const budgetItem = this.budgetItemRepository.create({
      amount: dto.amount,
      description: dto.description,
      frequency: dto.frequency,
      installmentsTotal: null,
      installmentIndex: null,
      installmentGroupId: null,
      // A single projected item may carry an endDate ("last billing month"):
      // the summary/forecast engine stops including it once endDate is past.
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      household: { id: dto.householdId } as any,
      category: dto.categoryId ? ({ id: dto.categoryId } as any) : null,
      account: dto.accountId ? ({ id: dto.accountId } as any) : null,
      ...this.buildBaseFields(dto),
    });
    const saved = await this.budgetItemRepository.save(budgetItem);
    return toBudgetItemShared(saved);
  }

  private async assertReferencesExist(
    manager: EntityManager,
    refs: { householdId: string; categoryId?: string; accountId?: string },
  ): Promise<void> {
    const household = await manager.getRepository(Household).findOne({
      where: { id: refs.householdId },
    });
    if (!household) {
      const err = new Error('Household not found') as Error & { status?: number };
      err.status = 404;
      throw err;
    }
    if (refs.categoryId) {
      const category = await manager.getRepository(Category).findOne({
        where: { id: refs.categoryId },
      });
      if (!category) {
        const err = new Error('Category not found') as Error & { status?: number };
        err.status = 404;
        throw err;
      }
    }
    if (refs.accountId) {
      const account = await manager.getRepository(Account).findOne({
        where: { id: refs.accountId },
      });
      if (!account) {
        const err = new Error('Account not found') as Error & { status?: number };
        err.status = 404;
        throw err;
      }
    }
  }

  async findAll(
    householdId: string,
  ): Promise<BudgetItemListItem[]> {
    const rows = await this.budgetItemRepository
      .createQueryBuilder('budgetItem')
      .leftJoinAndSelect('budgetItem.household', 'household')
      .leftJoinAndSelect('budgetItem.category', 'category')
      .leftJoinAndSelect('budgetItem.account', 'account')
      .where('household.id = :householdId', { householdId })
      .getMany();

    return rows.map(toBudgetItemShared);
  }

  async findOne(id: string): Promise<BudgetItem | null> {
    return await this.budgetItemRepository.findOne({
      where: { id },
      relations: ['household', 'category', 'account'],
    });
  }

  async update(
    id: string,
    updateBudgetItemDto: UpdateBudgetItemDto,
  ): Promise<BudgetItem | null> {
    const existing = await this.findOne(id);
    if (!existing) return null;

    if (updateBudgetItemDto.amount !== undefined) {
      existing.amount = updateBudgetItemDto.amount;
    }
    if (updateBudgetItemDto.description !== undefined) {
      existing.description = updateBudgetItemDto.description;
    }
    if (updateBudgetItemDto.needsReview !== undefined) {
      existing.needsReview = updateBudgetItemDto.needsReview;
    }
    if (updateBudgetItemDto.frequency !== undefined) {
      existing.frequency = updateBudgetItemDto.frequency;
    }
    if (updateBudgetItemDto.householdId !== undefined) {
      existing.household = { id: updateBudgetItemDto.householdId } as any;
    }
    if (updateBudgetItemDto.categoryId !== undefined) {
      existing.category = updateBudgetItemDto.categoryId
        ? ({ id: updateBudgetItemDto.categoryId } as any)
        : null;
    }
    if (updateBudgetItemDto.accountId !== undefined) {
      existing.account = updateBudgetItemDto.accountId
        ? ({ id: updateBudgetItemDto.accountId } as any)
        : null;
    }
    if (updateBudgetItemDto.targetAmount !== undefined) {
      existing.targetAmount = updateBudgetItemDto.targetAmount ?? null;
    }
    if (updateBudgetItemDto.assignedMonth !== undefined) {
      existing.assignedMonth = updateBudgetItemDto.assignedMonth ?? null;
    }
    if (updateBudgetItemDto.baseMonth !== undefined) {
      existing.baseMonth = updateBudgetItemDto.baseMonth ?? null;
    }
    if (updateBudgetItemDto.holiday !== undefined) {
      existing.holiday = updateBudgetItemDto.holiday ?? null;
    }
    if (updateBudgetItemDto.isOneTime !== undefined) {
      existing.isOneTime = updateBudgetItemDto.isOneTime;
    }
    if (updateBudgetItemDto.currency !== undefined) {
      existing.currency = updateBudgetItemDto.currency;
    }

    await this.budgetItemRepository.save(existing);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.budgetItemRepository.delete(id);
  }
}

export const budgetItemService = new BudgetItemService();
