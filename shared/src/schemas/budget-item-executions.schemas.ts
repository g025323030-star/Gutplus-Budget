import { z } from 'zod';
import { decimalStringSchema, monthSchema, uuidSchema } from './common.schemas';

export const upsertBudgetItemExecutionSchema = z
  .object({
    budgetItemId: uuidSchema,
    month: monthSchema,
    year: z.number().int(),
    forecastOverride: decimalStringSchema.optional().nullable(),
    actual: decimalStringSchema.optional().nullable(),
  })
  .superRefine((value, ctx) => {
    // A key explicitly sent as `null` means "clear this field" — that's a
    // real instruction, not "nothing provided". Only the key being entirely
    // absent (`undefined`) means "don't touch this field". Without this
    // distinction, clearing a field (sending `{ forecastOverride: null }`
    // alone) would be wrongly rejected as "neither field provided".
    const hasForecastOverrideKey = value.forecastOverride !== undefined;
    const hasActualKey = value.actual !== undefined;

    if (!hasForecastOverrideKey && !hasActualKey) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one of forecastOverride or actual must be provided',
        path: ['forecastOverride'],
      });
    }
  });

export const getBudgetLineItemsQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int(),
});

export type UpsertBudgetItemExecutionInput = z.infer<
  typeof upsertBudgetItemExecutionSchema
>;
export type GetBudgetLineItemsQueryInput = z.infer<
  typeof getBudgetLineItemsQuerySchema
>;
