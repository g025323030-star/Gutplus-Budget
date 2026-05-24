import { IsNull, Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Category } from '../entities/category.entity';
import { CategoryType } from '@gutplus/shared';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/category.dto';

interface GlobalCategorySpec {
  name: string;
  type: CategoryType;
  subCategories?: Array<{ name: string; type?: CategoryType }>;
}

const GLOBAL_DEFAULTS: GlobalCategorySpec[] = [
  {
    name: 'הוצאות ביתיות',
    type: CategoryType.EXPENSE,
    subCategories: [
      { name: 'מכולת' },
      { name: 'חשמל ומים' },
      { name: 'אינטרנט וטלפון' },
      { name: 'דלק' },
      { name: 'ארנונה' },
    ],
  },
  {
    name: 'פנאי ובידור',
    type: CategoryType.EXPENSE,
    subCategories: [{ name: 'מסעדות' }, { name: 'קולנוע ותרבות' }],
  },
  {
    name: 'תחבורה',
    type: CategoryType.EXPENSE,
    subCategories: [{ name: 'תחבורה ציבורית' }, { name: 'חניות ואגרות' }],
  },
  {
    name: 'ביטוחים',
    type: CategoryType.EXPENSE,
    subCategories: [{ name: 'ביטוח רכב' }, { name: 'ביטוח דירה' }],
  },
  {
    name: 'מסים',
    type: CategoryType.EXPENSE,
    subCategories: [{ name: 'מס הכנסה' }],
  },
  {
    name: 'חופשות וחגים',
    type: CategoryType.EXPENSE,
    subCategories: [{ name: 'חופשה משפחתית' }, { name: 'מתנות חג' }],
  },
  {
    name: 'הכנסות',
    type: CategoryType.INCOME,
    subCategories: [
      { name: 'משכורת' },
      { name: 'קצבאות' },
      { name: 'בונוס' },
      { name: 'החזרי מס' },
    ],
  },
];

export class CategoryService {
  private categoryRepository: Repository<Category>;

  constructor() {
    this.categoryRepository = AppDataSource.getRepository(Category);
  }

  async ensureGlobalDefaults(): Promise<void> {
    for (const spec of GLOBAL_DEFAULTS) {
      let parent = await this.categoryRepository.findOne({
        where: {
          name: spec.name,
          type: spec.type,
          household: { id: IsNull() } as any,
        },
        relations: ['household'],
      });
      if (!parent) {
        parent = await this.categoryRepository.save(
          this.categoryRepository.create({
            name: spec.name,
            type: spec.type,
            household: null,
            parentCategory: null,
          }),
        );
      }

      for (const sub of spec.subCategories ?? []) {
        const existing = await this.categoryRepository.findOne({
          where: {
            name: sub.name,
            household: { id: IsNull() } as any,
            parentCategory: { id: parent.id } as any,
          },
          relations: ['household', 'parentCategory'],
        });
        if (existing) continue;
        await this.categoryRepository.save(
          this.categoryRepository.create({
            name: sub.name,
            type: sub.type ?? spec.type,
            household: null,
            parentCategory: parent,
          }),
        );
      }
    }
  }

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const category = this.categoryRepository.create({
      name: createCategoryDto.name,
      type: createCategoryDto.type,
      household: createCategoryDto.householdId
        ? ({ id: createCategoryDto.householdId } as any)
        : null,
      parentCategory: createCategoryDto.parentCategoryId
        ? ({ id: createCategoryDto.parentCategoryId } as any)
        : null,
    });
    return await this.categoryRepository.save(category);
  }

  async findAll(householdId?: string): Promise<Category[]> {
    const query = this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.household', 'household')
      .leftJoinAndSelect('category.parentCategory', 'parentCategory')
      .leftJoinAndSelect('category.subCategories', 'subCategories');

    if (householdId) {
      query.where('household.id = :householdId OR household.id IS NULL', {
        householdId,
      });
    }

    return await query.getMany();
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
