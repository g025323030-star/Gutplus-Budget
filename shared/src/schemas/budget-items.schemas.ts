import { z } from 'zod';
import { CategoryFrequency, CurrencyCode, Holiday, TransactionFrequency } from '../enums';
import { decimalStringSchema, isoDateStringSchema, uuidSchema } from './common.schemas';

const PLAIN_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const dateInputSchema = z
  .union([
    z.string().regex(PLAIN_DATE_REGEX, 'Invalid date'),
    z.string().datetime({ offset: true }),
    z.date(),
  ])
  .transform((value) => {
    if (value instanceof Date) return value.toISOString();
    if (PLAIN_DATE_REGEX.test(value)) {
      return new Date(`${value}T00:00:00.000Z`).toISOString();
    }
    return value;
  });

const monthSchema = z.number().int().min(1).max(12);

export const budgetItemEntitySchema = z.object({
  id: uuidSchema,
  amount: decimalStringSchema,
  description: z.string().min(1),
  needsReview: z.boolean(),
  frequency: z.nativeEnum(CategoryFrequency),
  installmentsTotal: z.number().int().nullable(),
  installmentIndex: z.number().int().nullable(),
  installmentGroupId: uuidSchema.nullable(),
  endDate: isoDateStringSchema.nullable(),
  householdId: uuidSchema,
  categoryId: uuidSchema.nullable(),
  accountId: uuidSchema.nullable(),
  targetAmount: decimalStringSchema.nullable(),
  assignedMonth: monthSchema.nullable(),
  baseMonth: monthSchema.nullable(),
  holiday: z.nativeEnum(Holiday).nullable(),
  isOneTime: z.boolean(),
  currency: z.nativeEnum(CurrencyCode),
  createdAt: isoDateStringSchema,
  updatedAt: isoDateStringSchema,
});

const createBudgetItemBaseSchema = z.object({
  amount: decimalStringSchema,
  description: z.string().min(1),
  needsReview: z.boolean().optional(),
  frequency: z.nativeEnum(CategoryFrequency),
  installmentsTotal: z.number().int().min(2).max(120).optional(),
  installmentIndex: z.number().int().min(1).optional(),
  householdId: uuidSchema,
  categoryId: uuidSchema.optional(),
  accountId: uuidSchema.optional(),
  isRecurring: z.boolean().optional(),
  endDate: dateInputSchema.optional(),
  recurringFrequency: z.nativeEnum(TransactionFrequency).optional(),
  targetAmount: decimalStringSchema.optional().nullable(),
  assignedMonth: monthSchema.optional().nullable(),
  baseMonth: monthSchema.optional().nullable(),
  holiday: z.nativeEnum(Holiday).optional().nullable(),
  isOneTime: z.boolean().optional(),
  currency: z.nativeEnum(CurrencyCode).optional(),
});

export const createBudgetItemSchema = createBudgetItemBaseSchema.superRefine(
  (value, ctx) => {
    const hasInstallments =
      value.installmentsTotal !== undefined && value.installmentsTotal !== null;
    const hasInstallmentIndex =
      value.installmentIndex !== undefined && value.installmentIndex !== null;

    if (hasInstallments && value.isRecurring === true) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A budget item cannot be both an installment plan and recurring',
        path: ['isRecurring'],
      });
    }

    if (value.isRecurring === true && value.recurringFrequency === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'frequency is required when isRecurring is true',
        path: ['recurringFrequency'],
      });
    }

    if (
      value.isRecurring === true &&
      value.recurringFrequency !== undefined &&
      value.recurringFrequency !== TransactionFrequency.MONTHLY &&
      value.recurringFrequency !== TransactionFrequency.BI_MONTHLY
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Unsupported recurring frequency',
        path: ['recurringFrequency'],
      });
    }

    if (hasInstallments !== hasInstallmentIndex) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'installmentsTotal and installmentIndex must be provided together',
        path: hasInstallments ? ['installmentIndex'] : ['installmentsTotal'],
      });
    }

    if (
      hasInstallments &&
      hasInstallmentIndex &&
      (value.installmentIndex as number) > (value.installmentsTotal as number)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'installmentIndex cannot exceed installmentsTotal',
        path: ['installmentIndex'],
      });
    }

    // assignedMonth and baseMonth: range already enforced by monthSchema (1–12).
    // isOneTime rules — a one-time item is anchored to a single month of the
    // year via assignedMonth (there is no per-row calendar date anymore).
    if (value.isOneTime === true) {
      if (value.assignedMonth === undefined || value.assignedMonth === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'assignedMonth is required when isOneTime is true',
          path: ['assignedMonth'],
        });
      }
    }

    // HASIDIS_EVENT has no fixed Hebrew date — the user assigns the month manually.
    if (value.holiday === Holiday.HASIDIS_EVENT) {
      if (value.assignedMonth === undefined || value.assignedMonth === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'assignedMonth is required when holiday is HASIDIS_EVENT',
          path: ['assignedMonth'],
        });
      }
    }
  },
);

export const updateBudgetItemSchema = createBudgetItemBaseSchema.partial();

export type CreateBudgetItemInput = z.infer<typeof createBudgetItemSchema>;
export type UpdateBudgetItemInput = z.infer<typeof updateBudgetItemSchema>;
