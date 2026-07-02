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
import { AssetSide, AssetLiabilityCategory, CurrencyCode } from '@gutplus/shared';
import { FamilyMember } from './family-member.entity';
import { Household } from './household.entity';

export { AssetSide, AssetLiabilityCategory };

@Entity({ name: 'asset_liability_item' })
export class AssetLiabilityItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name!: string;

  @Column({
    name: 'side',
    type: 'enum',
    enum: AssetSide,
    enumName: 'asset_side_enum',
  })
  side!: AssetSide;

  @Column({
    name: 'category',
    type: 'enum',
    enum: AssetLiabilityCategory,
    enumName: 'asset_liability_category_enum',
  })
  category!: AssetLiabilityCategory;

  @Column({
    name: 'value',
    type: 'decimal',
    precision: 18,
    scale: 2,
  })
  value!: string;

  @Column({
    name: 'currency',
    type: 'enum',
    enum: CurrencyCode,
    enumName: 'currency_code_enum',
    default: CurrencyCode.ILS,
  })
  currency!: CurrencyCode;

  @Column({
    name: 'interest_rate',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  interestRate!: string | null;

  @Column({
    name: 'target_amount',
    type: 'decimal',
    precision: 18,
    scale: 2,
    nullable: true,
  })
  targetAmount!: string | null;

  @Column({ name: 'urgency_level', type: 'int', nullable: true })
  urgencyLevel!: number | null;

  // Debt-linking fields — populated when pulling a BudgetItem debt into liabilities
  @Column({ name: 'source_budget_item_id', type: 'varchar', length: 36, nullable: true })
  sourceBudgetItemId!: string | null;

  @Column({ name: 'monthly_payment', type: 'decimal', precision: 18, scale: 2, nullable: true })
  monthlyPayment!: string | null;

  /** Last month the principal was auto-decreased, stored as 'YYYY-MM' */
  @Column({ name: 'last_decrease_year_month', type: 'varchar', length: 7, nullable: true })
  lastDecreaseYearMonth!: string | null;

  @Index('IDX_ali_family_member')
  @ManyToOne(() => FamilyMember, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'family_member_id' })
  familyMember!: FamilyMember | null;

  @Index('IDX_ali_household')
  @ManyToOne(() => Household, household => household.assetLiabilityItems, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'household_id' })
  household!: Household;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
