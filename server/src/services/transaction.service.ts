import { randomUUID } from 'crypto';
import { EntityManager, Repository } from 'typeorm';
import {
  CategoryFrequency,
  CategoryType,
  TransactionFrequency,
} from '@gutplus/shared';
import type {
  RecurringTransaction as RecurringTransactionShared,
  RecurringTransactionProjection,
  Transaction as TransactionShared,
  TransactionListItem,
} from '@gutplus/shared';
import { AppDataSource } from '../config/data-source';
import { Account } from '../entities/account.entity';
import { Category } from '../entities/category.entity';
import { Household } from '../entities/household.entity';
import { RecurringTransaction } from '../entities/recurring-transaction.entity';
import { Transaction } from '../entities/transaction.entity';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
} from '../dto/transaction.dto';

export type CreateTransactionServiceResult =
  | { kind: 'recurring'; data: RecurringTransactionShared }
  | { kind: 'transactions'; data: TransactionShared[] };

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

const toTransactionShared = (row: Transaction): TransactionShared => ({
  id: row.id,
  amount: row.amount,
  date: row.date instanceof Date ? row.date.toISOString() : (row.date as unknown as string),
  description: row.description,
  isCleared: row.isCleared,
  frequency: row.frequency,
  installmentsTotal: row.installmentsTotal,
  installmentIndex: row.installmentIndex,
  installmentGroupId: row.installmentGroupId,
  householdId: row.household?.id ?? '',
  categoryId: row.category?.id ?? null,
  accountId: row.account?.id ?? null,
  createdAt:
    row.createdAt instanceof Date
      ? row.createdAt.toISOString()
      : (row.createdAt as unknown as string),
  updatedAt:
    row.updatedAt instanceof Date
      ? row.updatedAt.toISOString()
      : (row.updatedAt as unknown as string),
});

const toRecurringShared = (
  row: RecurringTransaction,
): RecurringTransactionShared => ({
  id: row.id,
  householdId: row.household?.id ?? '',
  categoryId: row.category?.id ?? '',
  accountId: row.account?.id ?? '',
  amount: Number(row.amount),
  description: row.description,
  dayOfMonth: row.dayOfMonth,
  frequency: row.frequency,
  startDate: row.startDate,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export class TransactionService {
  private transactionRepository: Repository<Transaction>;
  private recurringRepository: Repository<RecurringTransaction>;
  private householdRepository: Repository<Household>;
  private categoryRepository: Repository<Category>;

  constructor() {
    this.transactionRepository = AppDataSource.getRepository(Transaction);
    this.recurringRepository = AppDataSource.getRepository(RecurringTransaction);
    this.householdRepository = AppDataSource.getRepository(Household);
    this.categoryRepository = AppDataSource.getRepository(Category);
  }

  /**
   * Idempotently marks a household's expense templates as initialized after its
   * first transaction is created. A single conditional UPDATE keeps this cheap:
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
   * Flips the per-type "templates initialized" flag after a transaction is
   * created. A transaction has no type of its own — its type comes from its
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
    dto: CreateTransactionDto,
  ): Promise<CreateTransactionServiceResult> {
    const hasInstallments =
      dto.installmentsTotal !== undefined &&
      dto.installmentsTotal !== null &&
      dto.installmentsTotal >= 2 &&
      dto.installmentIndex !== undefined &&
      dto.installmentIndex !== null;

    const isPermanentRecurring =
      dto.isRecurring === true && dto.endDate === undefined;

    const isBoundedRecurring =
      dto.isRecurring === true && dto.endDate !== undefined;

    if (isPermanentRecurring) {
      const created = await this.createPermanentRecurring(dto);
      await this.markTemplatesInitialized(dto.householdId, dto.categoryId);
      return { kind: 'recurring', data: created };
    }

    if (isBoundedRecurring) {
      const created = await this.createBoundedRecurring(dto);
      await this.markTemplatesInitialized(dto.householdId, dto.categoryId);
      return { kind: 'transactions', data: created };
    }

    if (hasInstallments) {
      const created = await this.createInstallments(dto);
      await this.markTemplatesInitialized(dto.householdId, dto.categoryId);
      return { kind: 'transactions', data: created };
    }

    const created = await this.createSingleTransaction(dto);
    await this.markTemplatesInitialized(dto.householdId, dto.categoryId);
    return { kind: 'transactions', data: [created] };
  }

  private async createPermanentRecurring(
    dto: CreateTransactionDto,
  ): Promise<RecurringTransactionShared> {
    if (!dto.categoryId) {
      throw new Error('categoryId is required for recurring transactions');
    }
    if (!dto.recurringFrequency) {
      throw new Error('recurringFrequency is required for recurring transactions');
    }

    await this.assertReferencesExist(this.recurringRepository.manager, {
      householdId: dto.householdId,
      categoryId: dto.categoryId,
      accountId: dto.accountId,
    });

    const startDate = new Date(dto.date);
    const recurring = this.recurringRepository.create({
      amount: dto.amount,
      description: dto.description,
      dayOfMonth: startDate.getDate(),
      frequency: dto.recurringFrequency,
      startDate,
      household: { id: dto.householdId } as any,
      category: { id: dto.categoryId } as any,
      account: dto.accountId ? ({ id: dto.accountId } as any) : null,
    });
    const saved = await this.recurringRepository.save(recurring);
    return toRecurringShared(saved);
  }

  private async createBoundedRecurring(
    dto: CreateTransactionDto,
  ): Promise<TransactionShared[]> {
    if (!dto.recurringFrequency) {
      throw new Error('recurringFrequency is required for recurring transactions');
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

      const txRepo = queryRunner.manager.getRepository(Transaction);
      const created: Transaction[] = [];
      let stepIndex = 0;
      while (true) {
        const current = addMonthsClamped(startDate, step * stepIndex);
        if (current.getTime() > endDate.getTime()) break;
        const entity = txRepo.create({
          amount: dto.amount,
          date: current,
          description: dto.description,
          isCleared: dto.isCleared || false,
          frequency: dto.frequency,
          installmentsTotal: null,
          installmentIndex: null,
          installmentGroupId: null,
          household: { id: dto.householdId } as any,
          category: dto.categoryId ? ({ id: dto.categoryId } as any) : null,
          account: dto.accountId ? ({ id: dto.accountId } as any) : null,
        });
        const saved = await txRepo.save(entity);
        created.push(saved);
        stepIndex += 1;
      }

      await queryRunner.commitTransaction();
      return created.map(toTransactionShared);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  private async createInstallments(
    dto: CreateTransactionDto,
  ): Promise<TransactionShared[]> {
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

      const txRepo = queryRunner.manager.getRepository(Transaction);
      const created: Transaction[] = [];
      for (let i = 1; i <= total; i++) {
        const offset = i - payloadIndex;
        const installmentDate = addMonthsClamped(payloadDate, offset);
        const entity = txRepo.create({
          amount: dto.amount,
          date: installmentDate,
          description: dto.description,
          isCleared: dto.isCleared || false,
          frequency: dto.frequency,
          installmentsTotal: total,
          installmentIndex: i,
          installmentGroupId: groupId,
          household: { id: dto.householdId } as any,
          category: dto.categoryId ? ({ id: dto.categoryId } as any) : null,
          account: dto.accountId ? ({ id: dto.accountId } as any) : null,
        });
        const saved = await txRepo.save(entity);
        created.push(saved);
      }

      await queryRunner.commitTransaction();
      return created.map(toTransactionShared);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  private async createSingleTransaction(
    dto: CreateTransactionDto,
  ): Promise<TransactionShared> {
    await this.assertReferencesExist(this.transactionRepository.manager, {
      householdId: dto.householdId,
      categoryId: dto.categoryId,
      accountId: dto.accountId,
    });

    const transaction = this.transactionRepository.create({
      amount: dto.amount,
      date: new Date(dto.date),
      description: dto.description,
      isCleared: dto.isCleared || false,
      frequency: dto.frequency,
      installmentsTotal: null,
      installmentIndex: null,
      installmentGroupId: null,
      household: { id: dto.householdId } as any,
      category: dto.categoryId ? ({ id: dto.categoryId } as any) : null,
      account: dto.accountId ? ({ id: dto.accountId } as any) : null,
    });
    const saved = await this.transactionRepository.save(transaction);
    return toTransactionShared(saved);
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
    month?: number,
    year?: number,
  ): Promise<TransactionListItem[]> {
    const query = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.household', 'household')
      .leftJoinAndSelect('transaction.category', 'category')
      .leftJoinAndSelect('transaction.account', 'account')
      .where('household.id = :householdId', { householdId });

    const realRows = await query.getMany();
    const realItems: TransactionListItem[] = realRows.map(toTransactionShared);

    if (month === undefined || year === undefined) {
      return realItems;
    }

    let recurringRows: RecurringTransaction[] = [];
    try {
      recurringRows = await this.recurringRepository
        .createQueryBuilder('recurring')
        .leftJoinAndSelect('recurring.household', 'household')
        .leftJoinAndSelect('recurring.category', 'category')
        .leftJoinAndSelect('recurring.account', 'account')
        .where('household.id = :householdId', { householdId })
        .getMany();
    } catch (err) {
      console.warn(
        '[transactions.findAll] recurring projection skipped:',
        err instanceof Error ? err.message : err,
      );
      return realItems;
    }

    const projections: RecurringTransactionProjection[] = [];
    for (const recurring of recurringRows) {
      const start = new Date(recurring.startDate);
      const monthDiff =
        (year - start.getFullYear()) * 12 +
        (month - (start.getMonth() + 1));
      if (monthDiff < 0) continue;
      if (
        recurring.frequency === TransactionFrequency.BI_MONTHLY &&
        monthDiff % 2 !== 0
      ) {
        continue;
      }

      const monthIndex = month - 1;
      const clampedDay = Math.min(
        recurring.dayOfMonth,
        daysInMonth(year, monthIndex),
      );
      const projectedDate = new Date(
        year,
        monthIndex,
        clampedDay,
        start.getHours(),
        start.getMinutes(),
        start.getSeconds(),
        start.getMilliseconds(),
      );

      projections.push({
        id: null,
        isProjection: true,
        recurringTransactionId: recurring.id,
        amount: String(recurring.amount),
        date: projectedDate.toISOString(),
        description: recurring.description,
        isCleared: false,
        frequency: CategoryFrequency.MONTHLY,
        installmentsTotal: null,
        installmentIndex: null,
        installmentGroupId: null,
        householdId: recurring.household?.id ?? '',
        categoryId: recurring.category?.id ?? null,
        accountId: recurring.account?.id ?? null,
        createdAt:
          recurring.createdAt instanceof Date
            ? recurring.createdAt.toISOString()
            : (recurring.createdAt as unknown as string),
        updatedAt:
          recurring.updatedAt instanceof Date
            ? recurring.updatedAt.toISOString()
            : (recurring.updatedAt as unknown as string),
      });
    }

    const merged: TransactionListItem[] = [...realItems, ...projections];
    merged.sort((a, b) => {
      const aTime = new Date(a.date).getTime();
      const bTime = new Date(b.date).getTime();
      return aTime - bTime;
    });
    return merged;
  }

  async findOne(id: string): Promise<Transaction | null> {
    return await this.transactionRepository.findOne({
      where: { id },
      relations: ['household', 'category', 'account'],
    });
  }

  async update(
    id: string,
    updateTransactionDto: UpdateTransactionDto,
  ): Promise<Transaction | null> {
    const existing = await this.findOne(id);
    if (!existing) return null;

    if (updateTransactionDto.amount !== undefined) {
      existing.amount = updateTransactionDto.amount;
    }
    if (updateTransactionDto.date !== undefined) {
      existing.date = new Date(updateTransactionDto.date);
    }
    if (updateTransactionDto.description !== undefined) {
      existing.description = updateTransactionDto.description;
    }
    if (updateTransactionDto.isCleared !== undefined) {
      existing.isCleared = updateTransactionDto.isCleared;
    }
    if (updateTransactionDto.frequency !== undefined) {
      existing.frequency = updateTransactionDto.frequency;
    }
    if (updateTransactionDto.householdId !== undefined) {
      existing.household = { id: updateTransactionDto.householdId } as any;
    }
    if (updateTransactionDto.categoryId !== undefined) {
      existing.category = updateTransactionDto.categoryId
        ? ({ id: updateTransactionDto.categoryId } as any)
        : null;
    }
    if (updateTransactionDto.accountId !== undefined) {
      existing.account = updateTransactionDto.accountId
        ? ({ id: updateTransactionDto.accountId } as any)
        : null;
    }

    await this.transactionRepository.save(existing);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.transactionRepository.delete(id);
  }
}

export const transactionService = new TransactionService();
