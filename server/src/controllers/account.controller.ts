import { Request, Response, NextFunction } from 'express';
import { accountService } from '../services';
import { CreateAccountDto, UpdateAccountDto } from '../dto';

export class AccountController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const createAccountDto: CreateAccountDto = req.body;
      const account = await accountService.create(createAccountDto);
      res.status(201).json({
        success: true,
        data: account,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const householdId = req.query.householdId as string | undefined;
      const accounts = await accountService.findAll(householdId);
      res.status(200).json({
        success: true,
        data: accounts,
      });
    } catch (error) {
      next(error);
    }
  }

  async findOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const account = await accountService.findOne(id);
      if (!account) {
        res.status(404).json({
          success: false,
          message: 'Account not found',
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: account,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateAccountDto: UpdateAccountDto = req.body;
      const account = await accountService.update(id, updateAccountDto);
      if (!account) {
        res.status(404).json({
          success: false,
          message: 'Account not found',
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: account,
      });
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await accountService.remove(id);
      res.status(200).json({
        success: true,
        message: 'Account deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const accountController = new AccountController();