import type { Account } from '../types';
import type { SuccessResponse, SuccessMessageResponse } from './common.contracts';
import type { CreateAccountInput, UpdateAccountInput } from '../schemas';

export type CreateAccountRequestBody = CreateAccountInput;
export type UpdateAccountRequestBody = UpdateAccountInput;

export type CreateAccountResponse = SuccessResponse<Account>;
export type FindAllAccountsResponse = SuccessResponse<Account[]>;
export type FindOneAccountResponse = SuccessResponse<Account>;
export type UpdateAccountResponse = SuccessResponse<Account>;
export type RemoveAccountResponse = SuccessMessageResponse;
