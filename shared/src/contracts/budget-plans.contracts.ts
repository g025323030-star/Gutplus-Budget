import type { BudgetPlan } from '../types';
import type { SuccessResponse, SuccessMessageResponse } from './common.contracts';
import type { CreateBudgetPlanInput, UpdateBudgetPlanInput } from '../schemas';

export type CreateBudgetPlanRequestBody = CreateBudgetPlanInput;
export type UpdateBudgetPlanRequestBody = UpdateBudgetPlanInput;

export type CreateBudgetPlanResponse = SuccessResponse<BudgetPlan>;
export type FindAllBudgetPlansResponse = SuccessResponse<BudgetPlan[]>;
export type FindOneBudgetPlanResponse = SuccessResponse<BudgetPlan>;
export type UpdateBudgetPlanResponse = SuccessResponse<BudgetPlan>;
export type RemoveBudgetPlanResponse = SuccessMessageResponse;
