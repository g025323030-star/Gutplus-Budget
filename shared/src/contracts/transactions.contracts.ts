import type { Transaction } from '../types';
import type { SuccessResponse, SuccessMessageResponse } from './common.contracts';
import type { CreateTransactionInput, UpdateTransactionInput } from '../schemas';

export type CreateTransactionRequestBody = CreateTransactionInput;
export type UpdateTransactionRequestBody = UpdateTransactionInput;

export type CreateTransactionResponse = SuccessResponse<Transaction>;
export type FindAllTransactionsResponse = SuccessResponse<Transaction[]>;
export type FindOneTransactionResponse = SuccessResponse<Transaction>;
export type UpdateTransactionResponse = SuccessResponse<Transaction>;
export type RemoveTransactionResponse = SuccessMessageResponse;
