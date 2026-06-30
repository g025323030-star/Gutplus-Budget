import { Request, Response, NextFunction } from 'express';
import { householdService, executionService } from '../services';
import type { UpsertBudgetItemExecutionInput } from '@gutplus/shared';

export class BudgetItemExecutionController {
  async upsert(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const body: UpsertBudgetItemExecutionInput = req.body;
      const execution = await executionService.upsert(
        household.id,
        body.budgetItemId,
        body.month,
        body.year,
        { forecastOverride: body.forecastOverride, actual: body.actual },
      );

      res.status(200).json({ success: true, data: execution });
    } catch (error) {
      const status = (error as { status?: number }).status;
      if (status === 404) {
        res.status(404).json({
          success: false,
          message: (error as Error).message,
        });
        return;
      }
      next(error);
    }
  }

  async getLineItems(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const { month, year } = req.query as unknown as { month: number; year: number };
      const lineItems = await executionService.getLineItemsForMonth(
        household.id,
        month,
        year,
      );

      res.status(200).json({ success: true, data: { lineItems } });
    } catch (error) {
      const status = (error as { status?: number }).status;
      if (status === 400) {
        res.status(400).json({
          success: false,
          message: (error as Error).message,
        });
        return;
      }
      next(error);
    }
  }
}

export const budgetItemExecutionController = new BudgetItemExecutionController();
