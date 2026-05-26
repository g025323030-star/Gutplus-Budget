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
import { TransactionFrequency } from '@gutplus/shared';
import { Account } from './account.entity';
import { Category } from './category.entity';
import { Household } from './household.entity';

@Entity({ name: 'recurring_transactions' })
export class RecurringTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'amount',
    type: 'decimal',
    precision: 18,
    scale: 2,
  })
  amount!: string;

  @Column({ name: 'description', type: 'text' })
  description!: string;

  @Column({ name: 'day_of_month', type: 'int' })
  dayOfMonth!: number;

  @Column({
    name: 'frequency',
    type: 'enum',
    enum: TransactionFrequency,
    enumName: 'recurring_transaction_frequency_enum',
  })
  frequency!: TransactionFrequency;

  @Column({ name: 'start_date', type: 'timestamptz' })
  startDate!: Date;

  @Index('IDX_recurring_transaction_household')
  @ManyToOne(() => Household, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'household_id' })
  household!: Household;

  @ManyToOne(() => Category, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'category_id' })
  category!: Category;

  @ManyToOne(() => Account, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'account_id' })
  account!: Account;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
