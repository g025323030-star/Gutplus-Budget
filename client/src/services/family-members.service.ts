import axios from 'axios';
import { ENDPOINTS } from '@gutplus/shared';
import type { FamilyMember, FamilyMemberRole } from '@gutplus/shared';

const apiUrl = (path: string): string =>
  import.meta.env.VITE_SERVER_URL + path;

export interface CreateFamilyMemberPayload {
  name: string;
  role: FamilyMemberRole;
  householdId: string;
}

interface RawFamilyMember {
  id: string;
  name: string;
  role: FamilyMemberRole;
  household?: { id: string } | null;
  householdId?: string;
}

const normalize = (raw: RawFamilyMember): FamilyMember => ({
  id: raw.id,
  name: raw.name,
  role: raw.role,
  householdId: raw.household?.id ?? raw.householdId ?? '',
});

export const createFamilyMember = async (
  payload: CreateFamilyMemberPayload,
): Promise<FamilyMember> => {
  const res = await axios.post(apiUrl(ENDPOINTS.familyMembers.base), payload);
  return normalize(res.data?.data ?? res.data);
};

export const listFamilyMembers = async (
  householdId: string,
): Promise<FamilyMember[]> => {
  const res = await axios.get(apiUrl(ENDPOINTS.familyMembers.base), {
    params: { householdId },
  });
  const list: RawFamilyMember[] = res.data?.data ?? res.data ?? [];
  return list.map(normalize);
};
