import { FamilyMemberRole } from '../enums';

export interface FamilyMember {
  id: string;
  name: string;
  role: FamilyMemberRole;
  householdId: string;
}
