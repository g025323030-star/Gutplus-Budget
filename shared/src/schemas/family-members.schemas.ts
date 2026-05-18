import { z } from 'zod';
import { FamilyMemberRole } from '../enums';
import { uuidSchema } from './common.schemas';

export const createFamilyMemberSchema = z.object({
  name: z.string().min(1).max(255),
  role: z.nativeEnum(FamilyMemberRole),
  householdId: uuidSchema,
});

export const updateFamilyMemberSchema = createFamilyMemberSchema.partial();

export type CreateFamilyMemberInput = z.infer<typeof createFamilyMemberSchema>;
export type UpdateFamilyMemberInput = z.infer<typeof updateFamilyMemberSchema>;
