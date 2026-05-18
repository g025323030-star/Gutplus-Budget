import type { FamilyMember } from '../types';
import type { SuccessResponse, SuccessMessageResponse } from './common.contracts';
import type { CreateFamilyMemberInput, UpdateFamilyMemberInput } from '../schemas';

export type CreateFamilyMemberRequestBody = CreateFamilyMemberInput;
export type UpdateFamilyMemberRequestBody = UpdateFamilyMemberInput;

export type CreateFamilyMemberResponse = SuccessResponse<FamilyMember>;
export type FindAllFamilyMembersResponse = SuccessResponse<FamilyMember[]>;
export type FindOneFamilyMemberResponse = SuccessResponse<FamilyMember>;
export type UpdateFamilyMemberResponse = SuccessResponse<FamilyMember>;
export type RemoveFamilyMemberResponse = SuccessMessageResponse;
