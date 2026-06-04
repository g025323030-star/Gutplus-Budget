import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Account } from './account.entity';
import { BudgetPlan } from './budget-plan.entity';
import { Category } from './category.entity';
import { FamilyMember } from './family-member.entity';
import { Transaction } from './transaction.entity';
import { User } from './user.entity';

@Entity({ name: 'household' })
export class Household {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name!: string;

  @Column({ name: 'family_size', type: 'int', default: 0 })
  familySize!: number;

  @Column({ name: 'expense_templates_initialized', type: 'boolean', default: false })
  expenseTemplatesInitialized!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => User, user => user.households, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'user_id' })
  user!: User | null;

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
