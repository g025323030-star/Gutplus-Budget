import { Request, Response, NextFunction } from 'express';
import { budgetPlanService } from '../services';
import { CreateBudgetPlanDto, UpdateBudgetPlanDto } from '../dto';

export class BudgetPlanController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const createBudgetPlanDto: CreateBudgetPlanDto = req.body;
      const budgetPlan = await budgetPlanService.create(createBudgetPlanDto);
      res.status(201).json({
        success: true,
        data: budgetPlan,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const budgetPlans = await budgetPlanService.findAll();
      res.status(200).json({
        success: true,
        data: budgetPlans,
      });
    } catch (error) {
      next(error);
    }
  }

  async findOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const budgetPlan = await budgetPlanService.findOne(id);
      if (!budgetPlan) {
        res.status(404).json({
          success: false,
          message: 'Budget plan not found',
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: budgetPlan,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateBudgetPlanDto: UpdateBudgetPlanDto = req.body;
      const budgetPlan = await budgetPlanService.update(id, updateBudgetPlanDto);
      if (!budgetPlan) {
        res.status(404).json({
          success: false,
          message: 'Budget plan not found',
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: budgetPlan,
      });
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await budgetPlanService.remove(id);
      res.status(200).json({
        success: true,
        message: 'Budget plan deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const budgetPlanController = new BudgetPlanController();