import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Household } from './household.entity';

export enum FamilyMemberRole {
  Parent = 'Parent',
  Child = 'Child',
}

@Entity({ name: 'family_member' })
export class FamilyMember {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({
    type: 'enum',
    enum: FamilyMemberRole,
  })
  role!: FamilyMemberRole;

  @ManyToOne(() => Household, household => household.familyMembers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'household_id' })
  household!: Household;
}
