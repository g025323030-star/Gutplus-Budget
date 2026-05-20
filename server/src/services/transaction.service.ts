import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Transaction } from '../entities/transaction.entity';
import { CreateTransactionDto, UpdateTransactionDto } from '../dto/transaction.dto';

export class TransactionService {
  private transactionRepository: Repository<Transaction>;

  constructor() {
    this.transactionRepository = AppDataSource.getRepository(Transaction);
  }

  async create(createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    const transaction = this.transactionRepository.create({
      amount: createTransactionDto.amount,
      date: new Date(createTransactionDto.date),
      description: createTransactionDto.description,
      isCleared: createTransactionDto.isCleared || false,
      household: { id: createTransactionDto.householdId } as any,
      category: createTransactionDto.categoryId ? { id: createTransactionDto.categoryId } as any : null,
      account: createTransactionDto.accountId ? { id: createTransactionDto.accountId } as any : null,
    });
    return await this.transactionRepository.save(transaction);
  }

  async findAll(): Promise<Transaction[]> {
    return await this.transactionRepository.find({
      relations: ['household', 'category', 'account'],
    });
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