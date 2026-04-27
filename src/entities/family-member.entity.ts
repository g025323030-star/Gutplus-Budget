import {
  Column,
  Entity,
  Index,
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

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name!: string;

  @Column({
    name: 'role',
    type: 'enum',
    enum: FamilyMemberRole,
    enumName: 'family_member_role_enum',
  })
  role!: FamilyMemberRole;

  @Index('IDX_family_member_household')
  @ManyToOne(() => Household, household => household.familyMembers, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'household_id' })
  household!: Household;
}
