import type { AssetLiabilityItem } from '../types';
import type { SuccessResponse, SuccessMessageResponse } from './common.contracts';
import type { CreateAssetLiabilityItemInput, UpdateAssetLiabilityItemInput } from '../schemas';

export type CreateAssetLiabilityItemRequestBody = CreateAssetLiabilityItemInput;
export type UpdateAssetLiabilityItemRequestBody = UpdateAssetLiabilityItemInput;

export type CreateAssetLiabilityItemResponse = SuccessResponse<AssetLiabilityItem>;
export type FindAllAssetLiabilityItemsResponse = SuccessResponse<AssetLiabilityItem[]>;
export type FindOneAssetLiabilityItemResponse = SuccessResponse<AssetLiabilityItem>;
export type UpdateAssetLiabilityItemResponse = SuccessResponse<AssetLiabilityItem>;
export type RemoveAssetLiabilityItemResponse = SuccessMessageResponse;
