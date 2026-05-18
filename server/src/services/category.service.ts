import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Category } from '../entities/category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/category.dto';

export class CategoryService {
  private categoryRepository: Repository<Category>;

  constructor() {
    this.categoryRepository = AppDataSource.getRepository(Category);
  }

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const category = this.categoryRepository.create({
      name: createCategoryDto.name,
      type: createCategoryDto.type,
      frequency: createCategoryDto.frequency,
      household: createCategoryDto.householdId ? { id: createCategoryDto.householdId } as any : null,
      parentCategory: createCategoryDto.parentCategoryId ? { id: createCategoryDto.parentCategoryId } as any : null,
    });
    return await this.categoryRepository.save(category);
  }

  async findAll(): Promise<Category[]> {
    return await this.categoryRepository.find({
      relations: ['household', 'parentCategory', 'subCategories'],
    });
  }

  async findOne(id: string): Promise<Category | null> {
    return await this.categoryRepository.findOne({
      where: { id },
      relations: ['household', 'parentCategory', 'subCategories'],
    });
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category | null> {
    await this.categoryRepository.update(id, updateCategoryDto);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.categoryRepository.delete(id);
  }
}

export const categoryService = new CategoryService();