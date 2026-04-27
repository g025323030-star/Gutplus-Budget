import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Account } from './account.entity';
import { BudgetPlan } from './budget-plan.entity';
import { Category } from './category.entity';
import { FamilyMember } from './family-member.entity';
import { Transaction } from './transaction.entity';

@Entity({ name: 'household' })
export class Household {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name!: string;

  @Column({ name: 'family_size', type: 'int' })
  familySize!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => FamilyMember, member => member.household)
  familyMembers!: FamilyMember[];

  @OneToMany(() => Account, account => account.household)
  accounts!: Account[];

  @OneToMany(() => Category, category => category.household)
  categories!: Category[];

  @OneToMany(() => BudgetPlan, budgetPlan => budgetPlan.household)
  budgetPlans!: BudgetPlan[];

  @OneToMany(() => Transaction, transaction => transaction.household)
  transactions!: Transaction[];
}
