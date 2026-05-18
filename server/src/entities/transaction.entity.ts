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
import { Account } from './account.entity';
import { Category } from './category.entity';
import { Household } from './household.entity';

@Entity({ name: 'transaction' })
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'amount',
    type: 'decimal',
    precision: 18,
    scale: 2,
  })
  amount!: string;

  @Index('IDX_transaction_date')
  @Column({ name: 'date', type: 'timestamptz' })
  date!: Date;

  @Column({ name: 'description', type: 'text' })
  description!: string;

  @Column({ name: 'is_cleared', type: 'boolean', default: false })
  isCleared!: boolean;

  @Index('IDX_transaction_household')
  @ManyToOne(() => Household, household => household.transactions, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'household_id' })
  household!: Household;

  @Index('IDX_transaction_category')
  @ManyToOne(() => Category, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'category_id' })
  category!: Category | null;

  @Index('IDX_transaction_account')
  @ManyToOne(() => Account, account => account.transactions, {
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
