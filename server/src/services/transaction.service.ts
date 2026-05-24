import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { CategoryFrequency } from '@gutplus/shared';
import { AppDataSource } from '../config/data-source';
import { Transaction } from '../entities/transaction.entity';
import { CreateTransactionDto, UpdateTransactionDto } from '../dto/transaction.dto';

export class TransactionService {
  private transactionRepository: Repository<Transaction>;

  constructor() {
    this.transactionRepository = AppDataSource.getRepository(Transaction);
  }

  async create(createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    const installmentsTotal = createTransactionDto.installmentsTotal;
    if (installmentsTotal && installmentsTotal >= 2) {
      const created = await this.createInstallments(createTransactionDto);
      return created[0];
    }

    const transaction = this.transactionRepository.create({
      amount: createTransactionDto.amount,
      date: new Date(createTransactionDto.date),
      description: createTransactionDto.description,
      isCleared: createTransactionDto.isCleared || false,
      frequency: createTransactionDto.frequency,
      installmentsTotal: null,
      installmentIndex: null,
      installmentGroupId: null,
      household: { id: createTransactionDto.householdId } as any,
      category: createTransactionDto.categoryId ? { id: createTransactionDto.categoryId } as any : null,
      account: createTransactionDto.accountId ? { id: createTransactionDto.accountId } as any : null,
    });
    return await this.transactionRepository.save(transaction);
  }

  private async createInstallments(
    dto: CreateTransactionDto,
  ): Promise<Transaction[]> {
    const total = dto.installmentsTotal!;
    const totalAmount = parseFloat(dto.amount);
    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      throw new Error('Installment amount must be a positive number');
    }

    const groupId = randomUUID();
    const perAmount = (totalAmount / total).toFixed(2);
    const startDate = new Date(dto.date);

    const created: Transaction[] = [];
    for (let i = 0; i < total; i++) {
      const installmentDate = new Date(startDate);
      installmentDate.setMonth(installmentDate.getMonth() + i);
      const tx = this.transactionRepository.create({
        amount: perAmount,
        date: installmentDate,
        description: `${dto.description} (תשלום ${i + 1}/${total})`,
        isCleared: dto.isCleared || false,
        // Installments are paid monthly regardless of the parent frequency
        frequency: CategoryFrequency.MONTHLY,
        installmentsTotal: total,
        installmentIndex: i + 1,
        installmentGroupId: groupId,
        household: { id: dto.householdId } as any,
        category: dto.categoryId ? ({ id: dto.categoryId } as any) : null,
        account: dto.accountId ? ({ id: dto.accountId } as any) : null,
      });
      const saved = await this.transactionRepository.save(tx);
      created.push(saved);
    }
    return created;
  }

  async findAll(householdId?: string): Promise<Transaction[]> {
    const query = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.household', 'household')
      .leftJoinAndSelect('transaction.category', 'category')
      .leftJoinAndSelect('transaction.account', 'account');

    if (householdId) {
      query.where('household.id = :householdId', { householdId });
    }

    return await query.getMany();
  }

  async findOne(id: string): Promise<Transaction | null> {
    return await this.transactionRepository.findOne({
      where: { id },
      relations: ['household', 'category', 'account'],
    });
  }

  async update(id: string, updateTransactionDto: UpdateTransactionDto): Promise<Transaction | null> {
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