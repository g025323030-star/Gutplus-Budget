import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
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

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({
    type: 'enum',
    enum: AccountType,
  })
  type!: AccountType;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  balance!: string;

  @Column({ type: 'varchar', length: 3, default: 'ILS' })
  currency!: string;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 2,
    nullable: true,
  })
  monthlyPayment!: string;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  interestRate!: string;

  @Column({ type: 'int', name: 'urgency_level' })
  urgencyLevel!: number;

  @ManyToOne(() => Household, household => household.accounts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'household_id' })
  household!: Household;

  @OneToMany(() => Transaction, transaction => transaction.account)
  transactions!: Transaction[];
}
