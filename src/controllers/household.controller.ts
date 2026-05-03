import { Request, Response, NextFunction } from 'express';
import { householdService } from '../services';
import { CreateHouseholdDto, UpdateHouseholdDto } from '../dto';

export class HouseholdController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const createHouseholdDto: CreateHouseholdDto = req.body;
      const household = await householdService.create(createHouseholdDto);
      res.status(201).json({
        success: true,
        data: household,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const households = await householdService.findAll();
      res.status(200).json({
        success: true,
        data: households,
      });
    } catch (error) {
      next(error);
    }
  }

  async findOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const household = await householdService.findOne(id);
      if (!household) {
        res.status(404).json({
          success: false,
          message: 'Household not found',
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: household,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateHouseholdDto: UpdateHouseholdDto = req.body;
      const household = await householdService.update(id, updateHouseholdDto);
      if (!household) {
        res.status(404).json({
          success: false,
          message: 'Household not found',
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: household,
      });
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await householdService.remove(id);
      res.status(200).json({
        success: true,
        message: 'Household deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const householdController = new HouseholdController();