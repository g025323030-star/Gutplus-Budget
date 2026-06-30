import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { CurrencyCode } from '@gutplus/shared';

@Entity({ name: 'exchange_rate' })
@Unique('UQ_exchange_rate_currency_date', ['currency', 'rateDate'])
export class ExchangeRate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'currency',
    type: 'enum',
    enum: CurrencyCode,
    enumName: 'currency_code_enum',
  })
  currency!: CurrencyCode;

  @Column({
    name: 'rate_to_ils',
    type: 'decimal',
    precision: 18,
    scale: 6,
  })
  rateToIls!: string;

  @Column({ name: 'rate_date', type: 'date' })
  rateDate!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
