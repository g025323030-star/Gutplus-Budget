import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Household } from './household.entity';
import { Transaction } from './transaction.entity';

export enum AccountType {
  BANK = 'BANK',
  CREDIT_CARD = 'CREDIT_CARD',
  ASSET = 'ASSET',
  LOAN = 'LOAN',
  MORTGAGE = 'MORTGAGE',
}

@Entity({ name: 'account' })
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name!: string;

  @Column({
    name: 'type',
    type: 'enum',
    enum: AccountType,
    enumName: 'account_type_enum',
  })
  type!: AccountType;

  @Column({
    name: 'balance',
    type: 'decimal',
    precision: 18,
    scale: 2,
    default: 0,
  })
  balance!: string;

  @Column({ name: 'currency', type: 'varchar', length: 3, default: 'ILS' })
  currency!: string;

  @Column({
    name: 'monthly_payment',
    type: 'decimal',
    precision: 18,
    scale: 2,
    nullable: true,
  })
  monthlyPayment!: string | null;

  @Column({
    name: 'interest_rate',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  interestRate!: string | null;

  @Column({ name: 'urgency_level', type: 'int' })
  urgencyLevel!: number;

  @Index('IDX_account_household')
  @ManyToOne(() => Household, household => household.accounts, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'household_id' })
  household!: Household;

  @OneToMany(() => Transaction, transaction => transaction.account)
  transactions!: Transaction[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
