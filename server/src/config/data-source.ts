import 'reflect-metadata';
import 'dotenv/config';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { Account } from '../entities/account.entity';
import { BudgetPlan } from '../entities/budget-plan.entity';
import { Category } from '../entities/category.entity';
import { FamilyMember } from '../entities/family-member.entity';
import { Household } from '../entities/household.entity';
import { PasswordResetToken } from '../entities/token.entity';
import { RecurringTransaction } from '../entities/recurring-transaction.entity';
import { Transaction } from '../entities/transaction.entity';
import { User } from '../entities/user.entity';

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !process.env.DATABASE_URL) {
  throw new Error('Missing required environment variable: DATABASE_URL');
}

const databaseUrl =
  process.env.DATABASE_URL ||
  'postgres://gutplus_user:gutplusDP@localhost:5432/gutplus_budget';

const isLocalDb = /(@localhost|@127\.0\.0\.1)/.test(databaseUrl);

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  ssl: isLocalDb ? undefined : { rejectUnauthorized: false },
  synchronize: false,
  logging: !isProduction,
  entities: [
    Account,
    BudgetPlan,
    Category,
    FamilyMember,
    Household,
    PasswordResetToken,
    RecurringTransaction,
    Transaction,
    User,
  ],
  migrations: [path.join(__dirname, '..', 'migrations', '*.{ts,js}')],
  subscribers: [],
});
