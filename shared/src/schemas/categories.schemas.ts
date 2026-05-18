import { z } from 'zod';
import { CategoryFrequency, CategoryType } from '../enums';
import { uuidSchema } from './common.schemas';

export const createCategorySchema = z.object({
  name: z.string().min(1).max(255),
  type: z.nativeEnum(CategoryType),
  frequency: z.nativeEnum(CategoryFrequency),
  householdId: uuidSchema.optional(),
  parentCategoryId: uuidSchema.optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
