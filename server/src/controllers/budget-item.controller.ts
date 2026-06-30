import { Request, Response, NextFunction } from 'express';
import { budgetItemService, householdService } from '../services';
import { CreateBudgetItemDto, UpdateBudgetItemDto } from '../dto';

export class BudgetItemController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const createBudgetItemDto: CreateBudgetItemDto = req.body;
      const result = await budgetItemService.create(createBudgetItemDto);
      res.status(201).json({
        success: true,
        data: result,
      });
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

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const budgetItems = await budgetItemService.findAll(household.id);
      res.status(200).json({
        success: true,
        data: budgetItems,
      });
    } catch (error) {
      next(error);
    }
  }

  async findOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const budgetItem = await budgetItemService.findOne(id);
      if (!budgetItem) {
        res.status(404).json({
          success: false,
          message: 'תחום לא נמצא',
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: budgetItem,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateBudgetItemDto: UpdateBudgetItemDto = req.body;
      const budgetItem = await budgetItemService.update(id, updateBudgetItemDto);
      if (!budgetItem) {
        res.status(404).json({
          success: false,
          message: 'תחום לא נמצא',
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: budgetItem,
      });
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await budgetItemService.remove(id);
      res.status(200).json({
        success: true,
        message: 'תחום נמחק בהצלחה',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const budgetItemController = new BudgetItemController();
