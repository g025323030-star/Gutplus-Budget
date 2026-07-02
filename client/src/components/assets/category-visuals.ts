import { AssetLiabilityCategory } from '@gutplus/shared';

export const CATEGORY_LABELS: Record<AssetLiabilityCategory, string> = {
  [AssetLiabilityCategory.REAL_ESTATE]: 'נדל״ן',
  [AssetLiabilityCategory.PENSION]: 'פנסיה / קופת גמל',
  [AssetLiabilityCategory.SAVINGS]: 'חסכונות',
  [AssetLiabilityCategory.LOAN]: 'הלוואה',
  [AssetLiabilityCategory.DEBT]: 'חוב',
};

export const CATEGORY_COLORS: Record<AssetLiabilityCategory, string> = {
  [AssetLiabilityCategory.REAL_ESTATE]: '#0369a1',
  [AssetLiabilityCategory.PENSION]: '#047857',
  [AssetLiabilityCategory.SAVINGS]: '#7c3aed',
  [AssetLiabilityCategory.LOAN]: '#dc2626',
  [AssetLiabilityCategory.DEBT]: '#c2410c',
};
