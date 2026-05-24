import type { CheckEmailQuery, SignUpInput, LoginInput, ForgotPasswordInput } from '../schemas';

export type CheckEmailRequestQuery = CheckEmailQuery;

export interface CheckEmailSuccessResponse {
  success: true;
  message: string;
  action: 'signin';
}

export interface CheckEmailInactiveResponse {
  message: string;
}

export type CheckEmailResponse = CheckEmailSuccessResponse | CheckEmailInactiveResponse;

export type SignUpRequestBody = SignUpInput;
export interface SignUpResponse {
  message: string;
}

export type LoginRequestBody = LoginInput;
export interface LoginResponse {
  message: string;
}

export type ForgotPasswordRequestBody = ForgotPasswordInput;
export interface ForgotPasswordResponse {
  message: string;
}

export interface MeResponse {
  id: string;
  householdId: string | null;
  onboardingCompleted: boolean;
}

export interface CompleteOnboardingResponse {
  success: true;
  message: string;
}

export interface LogoutResponse {
  message: string;
}
