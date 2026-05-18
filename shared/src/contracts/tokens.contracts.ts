import type { ResetPasswordInput } from '../schemas';

export type ResetPasswordRequestBody = ResetPasswordInput;

export interface ResetPasswordResponse {
  message: string;
}
