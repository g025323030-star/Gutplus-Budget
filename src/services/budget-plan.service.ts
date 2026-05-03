import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { BudgetPlan } from '../entities/budget-plan.entity';
import { CreateBudgetPlanDto, UpdateBudgetPlanDto } from '../dto/budget-plan.dto';

export class BudgetPlanService {
  private budgetPlanRepository: Repository<BudgetPlan>;

  constructor() {
    this.budgetPlanRepository = AppDataSource.getRepository(BudgetPlan);
  }

  async create(createBudgetPlanDto: CreateBudgetPlanDto): Promise<BudgetPlan> {
    const budgetPlan = this.budgetPlanRepository.create({
      amount: createBudgetPlanDto.amount,
      month: createBudgetPlanDto.month,
      year: createBudgetPlanDto.year,
      household: { id: createBudgetPlanDto.householdId } as any,
      category: createBudgetPlanDto.categoryId ? { id: createBudgetPlanDto.categoryId } as any : null,
    });
    return await this.budgetPlanRepository.save(budgetPlan);
  }

  async findAll(): Promise<BudgetPlan[]> {
    return await this.budgetPlanRepository.find({
      relations: ['household', 'category'],
    });
  }

  async findOne(id: string): Promise<BudgetPlan | null> {
    return await this.budgetPlanRepository.findOne({
      where: { id },
      relations: ['household', 'category'],
    });
  }

  async update(id: string, updateBudgetPlanDto: UpdateBudgetPlanDto): Promise<BudgetPlan | null> {
    await this.budgetPlanRepository.update(id, updateBudgetPlanDto);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.budgetPlanRepository.delete(id);
  }
}

export const budgetPlanService = new BudgetPlanService();