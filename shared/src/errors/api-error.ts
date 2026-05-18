import { ErrorCode } from './error-codes';

export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: unknown;
}

export const isApiError = (value: unknown): value is ApiError => {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.code === 'string' && typeof v.message === 'string';
};
