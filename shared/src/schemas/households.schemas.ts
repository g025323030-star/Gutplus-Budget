import { z } from 'zod';
import { uuidSchema } from './common.schemas';

export const createHouseholdSchema = z.object({
  name: z.string().min(1).max(255),
  familySize: z.number().int().nonnegative().optional(),
  userId: uuidSchema.optional(),
});

export const updateHouseholdSchema = createHouseholdSchema.partial();

export type CreateHouseholdInput = z.infer<typeof createHouseholdSchema>;
export type UpdateHouseholdInput = z.infer<typeof updateHouseholdSchema>;
