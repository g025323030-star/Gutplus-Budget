import type { BudgetItem } from '../types';
import type { SuccessResponse, SuccessMessageResponse } from './common.contracts';
import type { CreateBudgetItemInput, UpdateBudgetItemInput } from '../schemas';

export type CreateBudgetItemRequestBody = CreateBudgetItemInput;
export type UpdateBudgetItemRequestBody = UpdateBudgetItemInput;

export type CreateBudgetItemResult =
  | { kind: 'budgetItems'; data: BudgetItem[] };

export type BudgetItemListItem = BudgetItem;

export type CreateBudgetItemResponse = SuccessResponse<CreateBudgetItemResult>;
export type FindAllBudgetItemsResponse = SuccessResponse<BudgetItemListItem[]>;
export type FindOneBudgetItemResponse = SuccessResponse<BudgetItem>;
export type UpdateBudgetItemResponse = SuccessResponse<BudgetItem>;
export type RemoveBudgetItemResponse = SuccessMessageResponse;
