import type { Category } from '../types';
import type { SuccessResponse, SuccessMessageResponse } from './common.contracts';
import type { CreateCategoryInput, UpdateCategoryInput } from '../schemas';

export type CreateCategoryRequestBody = CreateCategoryInput;
export type UpdateCategoryRequestBody = UpdateCategoryInput;

export type CreateCategoryResponse = SuccessResponse<Category>;
export type FindAllCategoriesResponse = SuccessResponse<Category[]>;
export type FindOneCategoryResponse = SuccessResponse<Category>;
export type UpdateCategoryResponse = SuccessResponse<Category>;
export type RemoveCategoryResponse = SuccessMessageResponse;
