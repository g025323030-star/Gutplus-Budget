import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CategoryFrequency } from '@gutplus/shared';
import { Account } from './account.entity';
import { Category } from './category.entity';
import { Household } from './household.entity';

@Entity({ name: 'budget_item' })
export class BudgetItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'amount',
    type: 'decimal',
    precision: 18,
    scale: 2,
  })
  amount!: string;

  @Index('IDX_budget_item_date')
  @Column({ name: 'date', type: 'timestamptz' })
  date!: Date;

  @Column({ name: 'description', type: 'text' })
  description!: string;

  @Column({ name: 'is_cleared', type: 'boolean', default: false })
  isCleared!: boolean;

  @Column({
    name: 'frequency',
    type: 'enum',
    enum: CategoryFrequency,
    enumName: 'transaction_frequency_enum',
    default: CategoryFrequency.MONTHLY,
  })
  frequency!: CategoryFrequency;

  @Column({ name: 'installments_total', type: 'int', nullable: true })
  installmentsTotal!: number | null;

  @Column({ name: 'installment_index', type: 'int', nullable: true })
  installmentIndex!: number | null;

  @Index('IDX_budget_item_installment_group')
  @Column({ name: 'installment_group_id', type: 'uuid', nullable: true })
  installmentGroupId!: string | null;

  @Column({ name: 'end_date', type: 'timestamptz', nullable: true })
  endDate!: Date | null;

  @Index('IDX_budget_item_household')
  @ManyToOne(() => Household, household => household.budgetItems, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'household_id' })
  household!: Household;

  @Index('IDX_budget_item_category')
  @ManyToOne(() => Category, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'category_id' })
  category!: Category | null;

  @Index('IDX_budget_item_account')
  @ManyToOne(() => Account, account => account.budgetItems, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'account_id' })
  account!: Account | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
