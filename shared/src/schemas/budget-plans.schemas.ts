import { z } from 'zod';
import { decimalStringSchema, uuidSchema } from './common.schemas';

export const createBudgetPlanSchema = z.object({
  amount: decimalStringSchema,
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(1970).max(9999),
  householdId: uuidSchema,
  categoryId: uuidSchema.optional(),
});

export const updateBudgetPlanSchema = createBudgetPlanSchema.partial();

export type CreateBudgetPlanInput = z.infer<typeof createBudgetPlanSchema>;
export type UpdateBudgetPlanInput = z.infer<typeof updateBudgetPlanSchema>;
