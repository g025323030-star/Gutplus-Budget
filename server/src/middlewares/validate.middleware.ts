import { NextFunction, Request, Response } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiError, ErrorCode } from '@gutplus/shared';

type RequestPart = 'body' | 'query' | 'params';

const buildError = (err: ZodError): ApiError => ({
  code: ErrorCode.VALIDATION_FAILED,
  message: 'Request validation failed',
  details: err.issues.map(i => ({
    path: i.path.join('.'),
    message: i.message,
  })),
});

export const validate =
  (schema: ZodSchema, part: RequestPart = 'body') =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      res.status(400).json(buildError(result.error));
      return;
    }
    (req as any)[part] = result.data;
    next();
  };
