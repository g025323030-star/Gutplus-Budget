import { Request, Response, NextFunction } from 'express';

export const authGuard = (req: Request, res: Response, next: NextFunction) => {
  if (!(req as any).user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};
