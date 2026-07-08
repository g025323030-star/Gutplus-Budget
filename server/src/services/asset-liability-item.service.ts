import { Repository, IsNull } from 'typeorm';
import { CategoryFrequency, CurrencyCode } from '@gutplus/shared';
import type { DebtBudgetItemOverview } from '@gutplus/shared';
import { AppDataSource } from '../config/data-source';
import { AssetLiabilityItem } from '../entities/asset-liability-item.entity';
import { BudgetItem } from '../entities/budget-item.entity';
import { Category } from '../entities/category.entity';
import { CreateAssetLiabilityItemDto, UpdateAssetLiabilityItemDto } from '../dto/asset-liability-item.dto';
import { exchangeRateService } from './exchange-rate.service';

const DEBT_PARENT_NAME = 'החזרי חובות';

interface NormalizedItem extends AssetLiabilityItem {
  valueInIls: string;
  familyMemberId: string | null;
  familyMemberName: string | null;
  householdId: string;
}

const normalize = async (item: AssetLiabilityItem): Promise<NormalizedItem> => {
  const valueInIls = await exchangeRateService.convertToIls(
    item.value,
    item.currency as CurrencyCode,
  );
  return {
    ...item,
    valueInIls,
    familyMemberId: item.familyMember?.id ?? null,
    familyMemberName: item.familyMember?.name ?? null,
    householdId: item.household?.id ?? '',
  };
};

function collectSubtreeIds(categories: Category[], parentName: string): Set<string> {
  const result = new Set<string>();
  const root = categories.find((c) => c.name === parentName);
  if (!root) return result;
  const queue = [root.id];
  while (queue.length) {
    const id = queue.shift()!;
    result.add(id);
    for (const c of categories) {
      if (c.parentCategory?.id === id && !result.has(c.id)) {
        queue.push(c.id);
      }
    }
  }
  return result;
}

export class AssetLiabilityItemService {
  private get repository(): Repository<AssetLiabilityItem> {
    return AppDataSource.getRepository(AssetLiabilityItem);
  }

  async create(dto: CreateAssetLiabilityItemDto): Promise<NormalizedItem> {
    const item = this.repository.create({
      name: dto.name,
      side: dto.side,
      category: dto.category,
      value: dto.value,
      currency: dto.currency ?? CurrencyCode.ILS,
      interestRate: dto.interestRate ?? null,
      targetAmount: dto.targetAmount ?? null,
      urgencyLevel: dto.urgencyLevel ?? null,
      sourceBudgetItemId: dto.sourceBudgetItemId ?? null,
      monthlyPayment: dto.monthlyPayment ?? null,
      lastDecreaseYearMonth: dto.lastDecreaseYearMonth ?? null,
      familyMember: dto.familyMemberId ? ({ id: dto.familyMemberId } as any) : null,
      household: { id: dto.householdId } as any,
    });
    const saved = await this.repository.save(item);

    // Optionally create a recurring BudgetItem in the Expenses screen
    if (dto.syncToExpenses && dto.monthlyPayment) {
      const linkedBudgetItemId = await this.createLinkedExpenseEntry(
        dto.householdId,
        dto.name,
        dto.monthlyPayment,
        dto.currency ?? CurrencyCode.ILS,
        dto.expenseEndDate ?? null,
      );
      if (linkedBudgetItemId) {
        await this.repository.save({ id: saved.id, sourceBudgetItemId: linkedBudgetItemId });
      }
    }

    const full = await this.findOneRaw(saved.id);
    return normalize(full!);
  }

  /** Creates a recurring BudgetItem under the 'החזרי חובות' category and returns its ID. */
  private async createLinkedExpenseEntry(
    householdId: string,
    name: string,
    amount: string,
    currency: CurrencyCode,
    endDate: string | null,
  ): Promise<string | null> {
    try {
      const categoryRepo = AppDataSource.getRepository(Category);
      const allCategories = await categoryRepo.find({
        where: [{ household: IsNull() } as any, { household: { id: householdId } }],
        relations: ['household', 'parentCategory'],
      });
      const debtIds = collectSubtreeIds(allCategories, DEBT_PARENT_NAME);
      const root = allCategories.find(c => c.name === DEBT_PARENT_NAME);
      const categoryId = root?.id ?? (debtIds.size > 0 ? [...debtIds][0] : null);
      if (!categoryId) return null;

      const biRepo = AppDataSource.getRepository(BudgetItem);
      const newBi = biRepo.create({
        description: name,
        amount,
        currency,
        category: { id: categoryId } as any,
        frequency: CategoryFrequency.MONTHLY,
        endDate: endDate ? new Date(endDate) : null,
        household: { id: householdId } as any,
        needsReview: false,
      } as any);
      const saved = (await biRepo.save(newBi)) as unknown as BudgetItem;
      return saved.id;
    } catch (err) {
      console.error('[AssetLiabilityItemService] createLinkedExpenseEntry failed:', err);
      return null;
    }
  }

  async findAll(householdId?: string): Promise<NormalizedItem[]> {
    const items = await this.repository.find({
      where: householdId ? { household: { id: householdId } } : undefined,
      relations: ['household', 'familyMember'],
      order: { createdAt: 'DESC' },
    });
    return Promise.all(items.map(normalize));
  }

  private async findOneRaw(id: string): Promise<AssetLiabilityItem | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['household', 'familyMember'],
    });
  }

  async findOne(id: string): Promise<NormalizedItem | null> {
    const item = await this.findOneRaw(id);
    if (!item) return null;
    return normalize(item);
  }

  async update(id: string, dto: UpdateAssetLiabilityItemDto): Promise<NormalizedItem | null> {
    const patch: Partial<AssetLiabilityItem> & { familyMember?: any } = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.side !== undefined) patch.side = dto.side;
    if (dto.category !== undefined) patch.category = dto.category;
    if (dto.value !== undefined) patch.value = dto.value;
    if (dto.currency !== undefined) patch.currency = dto.currency;
    if (dto.interestRate !== undefined) patch.interestRate = dto.interestRate;
    if (dto.targetAmount !== undefined) patch.targetAmount = dto.targetAmount;
    if (dto.urgencyLevel !== undefined) patch.urgencyLevel = dto.urgencyLevel;
    if (dto.sourceBudgetItemId !== undefined) patch.sourceBudgetItemId = dto.sourceBudgetItemId;
    if (dto.monthlyPayment !== undefined) patch.monthlyPayment = dto.monthlyPayment;
    if (dto.lastDecreaseYearMonth !== undefined) patch.lastDecreaseYearMonth = dto.lastDecreaseYearMonth;
    if (dto.familyMemberId !== undefined) {
      patch.familyMember = dto.familyMemberId ? ({ id: dto.familyMemberId } as any) : null;
    }
    await this.repository.save({ id, ...patch });
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  /**
   * Deletes the AssetLiabilityItem AND expires the linked BudgetItem
   * by setting its endDate = now so it stops appearing in Expenses.
   */
  async removeWithBudgetItem(id: string): Promise<void> {
    const item = await this.repository.findOne({ where: { id } });
    if (!item) throw new Error('AssetLiabilityItem not found');
    if (item.sourceBudgetItemId) {
      const biRepo = AppDataSource.getRepository(BudgetItem);
      await biRepo.update(item.sourceBudgetItemId, { endDate: new Date() } as any);
    }
    await this.repository.delete(id);
  }

  /**
   * Returns all active debt BudgetItems for the household, each annotated
   * with its linked AssetLiabilityItem (remaining-principal record) or null
   * if the user has not yet set up the principal for that debt.
   */
  async findDebtOverview(householdId: string): Promise<DebtBudgetItemOverview[]> {
    // Guard: if the migration hasn't been run yet the new columns don't exist
    // and any asset_liability_item query will throw. Return empty gracefully.
    try {
      await AppDataSource.query(
        `SELECT source_budget_item_id FROM asset_liability_item LIMIT 0`,
      );
    } catch {
      return [];
    }

    const categoryRepo = AppDataSource.getRepository(Category);
    const biRepo = AppDataSource.getRepository(BudgetItem);

    const allCategories = await categoryRepo.find({
      where: [
        { household: IsNull() } as any,
        { household: { id: householdId } },
      ],
      relations: ['household', 'parentCategory'],
    });

    const debtCategoryIds = collectSubtreeIds(allCategories, DEBT_PARENT_NAME);
    if (debtCategoryIds.size === 0) return [];

    const now = new Date();
    const allBudgetItems = await biRepo.find({
      where: { household: { id: householdId } },
      relations: ['household', 'category'],
    });

    const activeDebtItems = allBudgetItems.filter((bi) => {
      if (!bi.category?.id || !debtCategoryIds.has(bi.category.id)) return false;
      if (bi.endDate && bi.endDate <= now) return false;
      return true;
    });

    if (activeDebtItems.length === 0) return [];

    const linkedItems = await this.repository.find({
      where: { household: { id: householdId } },
      relations: ['household', 'familyMember'],
    });

    const linkedBySourceId = new Map<string, AssetLiabilityItem>();
    for (const li of linkedItems) {
      if (li.sourceBudgetItemId) linkedBySourceId.set(li.sourceBudgetItemId, li);
    }

    return Promise.all(
      activeDebtItems.map(async (bi) => {
        const isYearly = bi.frequency === CategoryFrequency.YEARLY;
        const monthlyPayment = isYearly
          ? (parseFloat(bi.amount) / 12).toFixed(2)
          : bi.amount;

        const raw = linkedBySourceId.get(bi.id) ?? null;
        const normalized = raw ? await normalize(raw) : null;
        const linkedItem = normalized
          ? {
              ...normalized,
              createdAt: (normalized.createdAt as unknown as Date).toISOString(),
              updatedAt: (normalized.updatedAt as unknown as Date).toISOString(),
            }
          : null;

        return {
          budgetItemId: bi.id,
          description: bi.description,
          monthlyPayment,
          currency: bi.currency ?? CurrencyCode.ILS,
          endDate: bi.endDate ? bi.endDate.toISOString() : null,
          linkedItem,
        };
      }),
    );
  }
}

export const assetLiabilityItemService = new AssetLiabilityItemService();
