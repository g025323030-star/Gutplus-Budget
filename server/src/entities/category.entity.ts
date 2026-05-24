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
import { CategoryFrequency, CategoryType } from '@gutplus/shared';
import { Household } from './household.entity';

export { CategoryType, CategoryFrequency };

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
