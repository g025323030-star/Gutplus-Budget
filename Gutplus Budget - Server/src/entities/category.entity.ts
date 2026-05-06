import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Tree,
  TreeChildren,
  TreeParent,
  UpdateDateColumn,
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

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name!: string;

  @Column({
    name: 'type',
    type: 'enum',
    enum: CategoryType,
    enumName: 'category_type_enum',
  })
  type!: CategoryType;

  @Column({
    name: 'frequency',
    type: 'enum',
    enum: CategoryFrequency,
    enumName: 'category_frequency_enum',
  })
  frequency!: CategoryFrequency;

  @Index('IDX_category_household')
  @ManyToOne(() => Household, household => household.categories, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'household_id' })
  household!: Household | null;

  @TreeParent({ onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parent_category_id' })
  parentCategory!: Category | null;

  @TreeChildren()
  subCategories!: Category[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
