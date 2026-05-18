import 'reflect-metadata';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { Account } from '../entities/account.entity';
import { BudgetPlan } from '../entities/budget-plan.entity';
import { Category } from '../entities/category.entity';
import { FamilyMember } from '../entities/family-member.entity';
import { Household } from '../entities/household.entity';
import { PasswordResetToken } from '../entities/token.entity';
import { Transaction } from '../entities/transaction.entity';
import { User } from '../entities/user.entity';

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  const required = [
    'POSTGRES_HOST',
    'POSTGRES_PORT',
    'POSTGRES_USER',
    'POSTGRES_PASSWORD',
    'POSTGRES_DB',
  ];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  username: process.env.POSTGRES_USER || 'gutplus_user',
  password: process.env.POSTGRES_PASSWORD || 'gutplusDP',
  database: process.env.POSTGRES_DB || 'gutplus_budget',
  synchronize: false,
  logging: !isProduction,
  entities: [
    Account,
    BudgetPlan,
    Category,
    FamilyMember,
    Household,
    PasswordResetToken,
    Transaction,
    User,
  ],
  migrations: [path.join(__dirname, '..', 'migrations', '*.{ts,js}')],
  subscribers: [],
});
