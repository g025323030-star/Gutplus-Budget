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
import { Category } from './category.entity';
import { Household } from './household.entity';

/**
 * Uniqueness across (household, year, month, category) is enforced by two
 * partial UNIQUE indexes (one for category_id IS NOT NULL, one for
 * category_id IS NULL), since PostgreSQL treats NULLs as distinct in a
 * regular UNIQUE constraint.
 */
@Entity({ name: 'budget_plan' })
@Index(
  'UQ_budget_plan_with_category',
  ['household', 'category', 'year', 'month'],
  { unique: true, where: '"category_id" IS NOT NULL' },
)
@Index(
  'UQ_budget_plan_without_category',
  ['household', 'year', 'month'],
  { unique: true, where: '"category_id" IS NULL' },
)
export class BudgetPlan {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'amount',
    type: 'decimal',
    precision: 18,
    scale: 2,
  })
  amount!: string;

  @Column({ name: 'month', type: 'int' })
  month!: number;

  @Column({ name: 'year', type: 'int' })
  year!: number;

  @Index('IDX_budget_plan_household')
  @ManyToOne(() => Household, household => household.budgetPlans, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'household_id' })
  household!: Household;

  @Index('IDX_budget_plan_category')
  @ManyToOne(() => Category, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'category_id' })
  category!: Category | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
