import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Account } from '../entities/account.entity';
import { CreateAccountDto, UpdateAccountDto } from '../dto/account.dto';

export class AccountService {
  private accountRepository: Repository<Account>;

  constructor() {
    this.accountRepository = AppDataSource.getRepository(Account);
  }

  async create(createAccountDto: CreateAccountDto): Promise<Account> {
    const account = this.accountRepository.create({
      name: createAccountDto.name,
      type: createAccountDto.type,
      balance: createAccountDto.balance || '0',
      currency: createAccountDto.currency || 'ILS',
      monthlyPayment: createAccountDto.monthlyPayment || null,
      interestRate: createAccountDto.interestRate || null,
      urgencyLevel: createAccountDto.urgencyLevel,
      household: { id: createAccountDto.householdId } as any,
    });
    return await this.accountRepository.save(account);
  }

  async findAll(householdId?: string): Promise<Account[]> {
    if (householdId) {
      return await this.accountRepository.find({
        where: { household: { id: householdId } },
        relations: ['household'],
      });
    }
    return await this.accountRepository.find({ relations: ['household'] });
  }

  async findOne(id: string): Promise<Account | null> {
    return await this.accountRepository.findOne({
      where: { id },
      relations: ['household', 'transactions'],
    });
  }

  async update(id: string, updateAccountDto: UpdateAccountDto): Promise<Account | null> {
    await this.accountRepository.update(id, updateAccountDto);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.accountRepository.delete(id);
  }
}

export const accountService = new AccountService();