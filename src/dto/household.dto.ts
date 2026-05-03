export interface CreateHouseholdDto {
  name: string;
  familySize: number;
}

export interface UpdateHouseholdDto {
  name?: string;
  familySize?: number;
}