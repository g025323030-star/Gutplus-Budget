import { FamilyMemberRole } from '../entities/family-member.entity';

export interface CreateFamilyMemberDto {
  name: string;
  role: FamilyMemberRole;
  householdId: string;
}

export interface UpdateFamilyMemberDto {
  name?: string;
  role?: FamilyMemberRole;
}