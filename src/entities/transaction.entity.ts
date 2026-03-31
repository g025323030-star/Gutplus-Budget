import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Account } from './account.entity';
import { Category } from './category.entity';
import { Household } from './household.entity';

@Entity({ name: 'transaction' })
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount!: string;

  @Column({ type: 'timestamp' })
  date!: Date;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'boolean', name: 'is_cleared', default: false })
  isCleared!: boolean;

  @ManyToOne(() => Household, household => household.transactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'household_id' })
  household!: Household;

  @ManyToOne(() => Category, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'category_id' })
  category!: Category;

  @ManyToOne(() => Account, account => account.transactions, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'account_id' })
  account!: Account;
}
