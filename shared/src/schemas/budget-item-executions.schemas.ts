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
    const hasForecastOverride =
      value.forecastOverride !== undefined && value.forecastOverride !== null;
    const hasActual = value.actual !== undefined && value.actual !== null;

    if (!hasForecastOverride && !hasActual) {
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
