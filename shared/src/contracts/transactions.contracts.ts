import type { RecurringTransaction, Transaction } from '../types';
import type { SuccessResponse, SuccessMessageResponse } from './common.contracts';
import type { CreateTransactionInput, UpdateTransactionInput } from '../schemas';

export type CreateTransactionRequestBody = CreateTransactionInput;
export type UpdateTransactionRequestBody = UpdateTransactionInput;

export type CreateTransactionResult =
  | { kind: 'recurring'; data: RecurringTransaction }
  | { kind: 'transactions'; data: Transaction[] };

export interface RecurringTransactionProjection
  extends Omit<Transaction, 'id' | 'installmentsTotal' | 'installmentIndex' | 'installmentGroupId'> {
  id: null;
  isProjection: true;
  recurringTransactionId: string;
  installmentsTotal: null;
  installmentIndex: null;
  installmentGroupId: null;
}

export type TransactionListItem = Transaction | RecurringTransactionProjection;

export type CreateTransactionResponse = SuccessResponse<CreateTransactionResult>;
export type FindAllTransactionsResponse = SuccessResponse<TransactionListItem[]>;
export type FindOneTransactionResponse = SuccessResponse<Transaction>;
export type UpdateTransactionResponse = SuccessResponse<Transaction>;
export type RemoveTransactionResponse = SuccessMessageResponse;
