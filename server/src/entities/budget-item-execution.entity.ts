import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { BudgetItem } from './budget-item.entity';
import { Household } from './household.entity';

@Entity({ name: 'budget_item_execution' })
@Unique('UQ_budget_item_execution_item_month_year', ['budgetItem', 'month', 'year'])
@Index('IDX_budget_item_execution_household_year', ['household', 'year'])
export class BudgetItemExecution {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => BudgetItem, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'budget_item_id' })
  budgetItem!: BudgetItem;

  // Denormalized, same pattern as BudgetItem itself — avoids a join for
  // household-scoping.
  @ManyToOne(() => Household, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'household_id' })
  household!: Household;

  @Column({ name: 'month', type: 'int' })
  month!: number;

  @Column({ name: 'year', type: 'int' })
  year!: number;

  @Column({
    name: 'forecast_override',
    type: 'decimal',
    precision: 18,
    scale: 2,
    nullable: true,
  })
  forecastOverride!: string | null;

  @Column({
    name: 'actual',
    type: 'decimal',
    precision: 18,
    scale: 2,
    nullable: true,
  })
  actual!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
