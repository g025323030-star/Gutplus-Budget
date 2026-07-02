import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Account } from './account.entity';
import { AssetLiabilityItem } from './asset-liability-item.entity';
import { BudgetItem } from './budget-item.entity';
import { Category } from './category.entity';
import { FamilyMember } from './family-member.entity';
import { User } from './user.entity';

@Entity({ name: 'household' })
export class Household {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name!: string;

  @Column({ name: 'family_size', type: 'int', default: 0 })
  familySize!: number;

  @Column({ name: 'expense_templates_initialized', type: 'boolean', default: false })
  expenseTemplatesInitialized!: boolean;

  @Column({ name: 'income_templates_initialized', type: 'boolean', default: false })
  incomeTemplatesInitialized!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => User, user => user.households, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'user_id' })
  user!: User | null;

  @OneToMany(() => FamilyMember, member => member.household)
  familyMembers!: FamilyMember[];

  @OneToMany(() => Account, account => account.household)
  accounts!: Account[];

  @OneToMany(() => Category, category => category.household)
  categories!: Category[];

  @OneToMany(() => BudgetItem, budgetItem => budgetItem.household)
  budgetItems!: BudgetItem[];

  @OneToMany(() => AssetLiabilityItem, item => item.household)
  assetLiabilityItems!: AssetLiabilityItem[];
}
