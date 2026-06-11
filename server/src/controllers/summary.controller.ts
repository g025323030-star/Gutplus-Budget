import { Request, Response, NextFunction } from 'express';
import { householdService, summaryService } from '../services';

export class SummaryController {
  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const monthRaw = Number(req.query.month);
      const yearRaw = Number(req.query.year);

      if (
        !Number.isInteger(monthRaw) ||
        monthRaw < 1 ||
        monthRaw > 12
      ) {
        res.status(400).json({
          success: false,
          message: 'month must be an integer between 1 and 12',
        });
        return;
      }

      if (
        !Number.isFinite(yearRaw) ||
        !Number.isInteger(yearRaw) ||
        yearRaw <= 0
      ) {
        res.status(400).json({
          success: false,
          message: 'year must be a positive finite integer',
        });
        return;
      }

      const household = await householdService.findByUserId(userId);
      if (!household) {
        res.status(404).json({ success: false, message: 'Household not found' });
        return;
      }

      const data = await summaryService.computeSummary(household.id, monthRaw, yearRaw);

      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

export const summaryController = new SummaryController();
