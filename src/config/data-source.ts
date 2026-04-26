import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Account } from '../entities/account.entity';
import { BudgetPlan } from '../entities/budget-plan.entity';
import { Category } from '../entities/category.entity';
import { FamilyMember } from '../entities/family-member.entity';
import { Household } from '../entities/household.entity';
import { Transaction } from '../entities/transaction.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  username: process.env.POSTGRES_USER || 'gutplus_user',
  password: process.env.POSTGRES_PASSWORD || 'gutplusDP',
  database: process.env.POSTGRES_DB || 'gutplus_budget',
  synchronize: false,
  logging: true,
  entities: [
    Account,
    BudgetPlan,
    Category,
    FamilyMember,
    Household,
    Transaction,
  ],
  migrations: ['src/migrations/*.ts'],
  subscribers: [],
});