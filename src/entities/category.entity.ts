import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Tree,
  TreeChildren,
  TreeParent,
} from 'typeorm';
import { Household } from './household.entity';

export enum CategoryType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum CategoryFrequency {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

@Entity({ name: 'category' })
@Tree('materialized-path')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({
    type: 'enum',
    enum: CategoryType,
  })
  type!: CategoryType;

  @Column({
    type: 'enum',
    enum: CategoryFrequency,
  })
  frequency!: CategoryFrequency;

  @ManyToOne(() => Household, household => household.categories, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'household_id' })
  household!: Household;

  @TreeParent()
  @JoinColumn({ name: 'parent_category_id' })
  parentCategory!: Category;

  @TreeChildren()
  subCategories!: Category[];
}
