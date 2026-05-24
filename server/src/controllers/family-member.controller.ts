import { Request, Response, NextFunction } from 'express';
import { familyMemberService } from '../services';
import { CreateFamilyMemberDto, UpdateFamilyMemberDto } from '../dto';

export class FamilyMemberController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const createFamilyMemberDto: CreateFamilyMemberDto = req.body;
      const familyMember = await familyMemberService.create(createFamilyMemberDto);
      res.status(201).json({
        success: true,
        data: familyMember,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const householdId = req.query.householdId as string | undefined;
      const familyMembers = await familyMemberService.findAll(householdId);
      res.status(200).json({
        success: true,
        data: familyMembers,
      });
    } catch (error) {
      next(error);
    }
  }

  async findOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const familyMember = await familyMemberService.findOne(id);
      if (!familyMember) {
        res.status(404).json({
          success: false,
          message: 'Family member not found',
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: familyMember,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateFamilyMemberDto: UpdateFamilyMemberDto = req.body;
      const familyMember = await familyMemberService.update(id, updateFamilyMemberDto);
      if (!familyMember) {
        res.status(404).json({
          success: false,
          message: 'Family member not found',
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: familyMember,
      });
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await familyMemberService.remove(id);
      res.status(200).json({
        success: true,
        message: 'Family member deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const familyMemberController = new FamilyMemberController();