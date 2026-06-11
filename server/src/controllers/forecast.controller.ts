import { Request, Response, NextFunction } from 'express';
import { householdService, forecastService } from '../services';

export class ForecastController {
  async getForecast(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const household = await householdService.findByUserId(userId);
      if (!household) {
        res.status(404).json({ success: false, message: 'Household not found' });
        return;
      }

      const months = await forecastService.computeForecast(household.id);

      res.status(200).json({ success: true, data: { months } });
    } catch (error) {
      next(error);
    }
  }
}

export const forecastController = new ForecastController();
