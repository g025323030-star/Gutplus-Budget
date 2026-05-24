import { Request, Response, NextFunction } from 'express';
import { transactionService, householdService } from '../services';
import { CreateTransactionDto, UpdateTransactionDto } from '../dto';

export class TransactionController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const createTransactionDto: CreateTransactionDto = req.body;
      const transaction = await transactionService.create(createTransactionDto);
      res.status(201).json({
        success: true,
        data: transaction,
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

      const transactions = await transactionService.findAll(household.id);
      res.status(200).json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      next(error);
    }
  }

  async findOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const transaction = await transactionService.findOne(id);
      if (!transaction) {
        res.status(404).json({
          success: false,
          message: 'Transaction not found',
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateTransactionDto: UpdateTransactionDto = req.body;
      const transaction = await transactionService.update(id, updateTransactionDto);
      if (!transaction) {
        res.status(404).json({
          success: false,
          message: 'Transaction not found',
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await transactionService.remove(id);
      res.status(200).json({
        success: true,
        message: 'Transaction deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const transactionController = new TransactionController();