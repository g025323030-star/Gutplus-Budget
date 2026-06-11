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

const daysInMonth = (year: number, monthIndex: number): number =>
  new Date(year, monthIndex + 1, 0).getDate();

const addMonthsClamped = (date: Date, months: number): Date => {
  const year = date.getFullYear();
  const monthIndex = date.getMonth();
  const day = date.getDate();
  const targetMonthIndex = monthIndex + months;
  const targetYear = year + Math.floor(targetMonthIndex / 12);
  const normalizedMonthIndex = ((targetMonthIndex % 12) + 12) % 12;
  const clampedDay = Math.min(day, daysInMonth(targetYear, normalizedMonthIndex));
  return new Date(
    targetYear,
    normalizedMonthIndex,
    clampedDay,
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  );
};

const stepMonthsForFrequency = (frequency: TransactionFrequency): number => {
  switch (frequency) {
    case TransactionFrequency.MONTHLY:
      return 1;
    case TransactionFrequency.BI_MONTHLY:
      return 2;
    default:
      return 1;
  }
};

const toBudgetItemShared = (row: BudgetItem): BudgetItemShared => ({
  id: row.id,
  amount: row.amount,
  date: row.date instanceof Date ? row.date.toISOString() : (row.date as unknown as string),
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
    if (!dto.date) {
      throw new Error('date is required for recurring budget items');
    }

    const startDate = new Date(dto.date);
    const endDate = new Date(dto.endDate as string);
    const step = stepMonthsForFrequency(dto.recurringFrequency);

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
      let stepIndex = 0;
      while (true) {
        const current = addMonthsClamped(startDate, step * stepIndex);
        if (current.getTime() > endDate.getTime()) break;
        const entity = repo.create({
          amount: dto.amount,
          date: current,
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
        });
        const saved = await repo.save(entity);
        created.push(saved);
        stepIndex += 1;
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

  private async createInstallments(
    dto: CreateBudgetItemDto,
  ): Promise<BudgetItemShared[]> {
    if (!dto.date) {
      throw new Error('date is required for installment budget items');
    }

    const total = dto.installmentsTotal as number;
    const payloadIndex = dto.installmentIndex as number;
    const groupId = randomUUID();
    const payloadDate = new Date(dto.date);

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
        const installmentDate = addMonthsClamped(payloadDate, offset);
        const entity = repo.create({
          amount: dto.amount,
          date: installmentDate,
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
      date: dto.date ? new Date(dto.date) : new Date(),
      description: dto.description,
      frequency: dto.frequency,
      installmentsTotal: null,
      installmentIndex: null,
      installmentGroupId: null,
      endDate: null,
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
    if (updateBudgetItemDto.date !== undefined) {
      existing.date = new Date(updateBudgetItemDto.date);
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
