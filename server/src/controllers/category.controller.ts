import { Request, Response, NextFunction } from 'express';
import { categoryService, householdService } from '../services';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto';

export class CategoryController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const createCategoryDto: CreateCategoryDto = req.body;
      const category = await categoryService.create(createCategoryDto);
      res.status(201).json({
        success: true,
        data: category,
      });
    } catch (error) {
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

      const categories = await categoryService.findAll(household.id);
      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  async findOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const category = await categoryService.findOne(id);
      if (!category) {
        res.status(404).json({
          success: false,
          message: 'Category not found',
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateCategoryDto: UpdateCategoryDto = req.body;
      const category = await categoryService.update(id, updateCategoryDto);
      if (!category) {
        res.status(404).json({
          success: false,
          message: 'Category not found',
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await categoryService.remove(id);
      res.status(200).json({
        success: true,
        message: 'Category deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const categoryController = new CategoryController();