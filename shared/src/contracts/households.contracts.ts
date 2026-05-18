import type { Household } from '../types';
import type { SuccessResponse, SuccessMessageResponse } from './common.contracts';
import type { CreateHouseholdInput, UpdateHouseholdInput } from '../schemas';

export type CreateHouseholdRequestBody = CreateHouseholdInput;
export type UpdateHouseholdRequestBody = UpdateHouseholdInput;

export type CreateHouseholdResponse = SuccessResponse<Household>;
export type FindAllHouseholdsResponse = SuccessResponse<Household[]>;
export type FindOneHouseholdResponse = SuccessResponse<Household>;
export type UpdateHouseholdResponse = SuccessResponse<Household>;
export type RemoveHouseholdResponse = SuccessMessageResponse;
