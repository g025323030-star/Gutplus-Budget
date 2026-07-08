import { z } from 'zod';
import { AssetSide, AssetLiabilityCategory, CurrencyCode } from '../enums';
import { decimalStringSchema, uuidSchema } from './common.schemas';

export const createAssetLiabilityItemSchema = z.object({
  name: z.string().min(1).max(255),
  side: z.nativeEnum(AssetSide),
  category: z.nativeEnum(AssetLiabilityCategory),
  value: decimalStringSchema,
  currency: z.nativeEnum(CurrencyCode).optional(),
  interestRate: decimalStringSchema.nullable().optional(),
  targetAmount: decimalStringSchema.nullable().optional(),
  urgencyLevel: z.number().int().min(1).max(3).nullable().optional(),
  familyMemberId: uuidSchema.nullable().optional(),
  householdId: uuidSchema,
  // Debt-linking fields
  sourceBudgetItemId: z.string().max(36).nullable().optional(),
  monthlyPayment: decimalStringSchema.nullable().optional(),
  lastDecreaseYearMonth: z.string().regex(/^\d{4}-\d{2}$/).nullable().optional(),
  // Expenses-sync fields (used on create only)
  syncToExpenses: z.boolean().optional(),
  expenseEndDate: z.string().nullable().optional(),
});

export const updateAssetLiabilityItemSchema = createAssetLiabilityItemSchema
  .omit({ householdId: true })
  .partial();

export type CreateAssetLiabilityItemInput = z.infer<typeof createAssetLiabilityItemSchema>;
export type UpdateAssetLiabilityItemInput = z.infer<typeof updateAssetLiabilityItemSchema>;
