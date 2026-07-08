import { Request, Response, NextFunction } from 'express';
import { assetLiabilityItemService } from '../services';
import { CreateAssetLiabilityItemDto, UpdateAssetLiabilityItemDto } from '../dto';

export class AssetLiabilityItemController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto: CreateAssetLiabilityItemDto = req.body;
      const item = await assetLiabilityItemService.create(dto);
      res.status(201).json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const householdId = req.query.householdId as string | undefined;
      const items = await assetLiabilityItemService.findAll(householdId);
      res.status(200).json({ success: true, data: items });
    } catch (error) {
      next(error);
    }
  }

  async findOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const item = await assetLiabilityItemService.findOne(id);
      if (!item) {
        res.status(404).json({ success: false, message: 'Item not found' });
        return;
      }
      res.status(200).json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const dto: UpdateAssetLiabilityItemDto = req.body;
      const item = await assetLiabilityItemService.update(id, dto);
      if (!item) {
        res.status(404).json({ success: false, message: 'Item not found' });
        return;
      }
      res.status(200).json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await assetLiabilityItemService.remove(id);
      res.status(200).json({ success: true, message: 'Item deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async removeWithBudgetItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await assetLiabilityItemService.removeWithBudgetItem(id);
      res.status(200).json({ success: true, message: 'Item and linked expense deleted' });
    } catch (error) {
      next(error);
    }
  }

  async findDebtOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const householdId = req.query.householdId as string;
      if (!householdId) {
        res.status(400).json({ success: false, message: 'householdId is required' });
        return;
      }
      const overview = await assetLiabilityItemService.findDebtOverview(householdId);
      res.status(200).json({ success: true, data: overview });
    } catch (error) {
      next(error);
    }
  }
}

export const assetLiabilityItemController = new AssetLiabilityItemController();
