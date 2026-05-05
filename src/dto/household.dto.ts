export interface CreateHouseholdDto {
  name: string;
  email: string;
  familySize: number;
  userId?: string;
}

export interface UpdateHouseholdDto {
  name?: string;
  email?: string;
  familySize?: number;
  userId?: string;
}