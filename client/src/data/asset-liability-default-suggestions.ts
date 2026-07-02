import { AssetLiabilityCategory, AssetSide, CurrencyCode } from '@gutplus/shared';

export interface AssetLiabilitySuggestion {
  id: string;
  name: string;
  category: AssetLiabilityCategory;
  side: AssetSide;
  currency: CurrencyCode;
  isCustom?: boolean;
}

export const DEFAULT_SUGGESTIONS: AssetLiabilitySuggestion[] = [
  // Assets
  { id: 'pre-1', name: 'דירה ראשונה', category: AssetLiabilityCategory.REAL_ESTATE, side: AssetSide.ASSET, currency: CurrencyCode.ILS },
  { id: 'pre-2', name: 'נכס להשקעה', category: AssetLiabilityCategory.REAL_ESTATE, side: AssetSide.ASSET, currency: CurrencyCode.ILS },
  { id: 'pre-3', name: 'קרן פנסיה', category: AssetLiabilityCategory.PENSION, side: AssetSide.ASSET, currency: CurrencyCode.ILS },
  { id: 'pre-4', name: 'קרן השתלמות', category: AssetLiabilityCategory.PENSION, side: AssetSide.ASSET, currency: CurrencyCode.ILS },
  { id: 'pre-5', name: 'קופת גמל', category: AssetLiabilityCategory.PENSION, side: AssetSide.ASSET, currency: CurrencyCode.ILS },
  { id: 'pre-6', name: 'חסכון לגיל פרישה', category: AssetLiabilityCategory.SAVINGS, side: AssetSide.ASSET, currency: CurrencyCode.ILS },
  { id: 'pre-7', name: 'חסכון לילדים', category: AssetLiabilityCategory.SAVINGS, side: AssetSide.ASSET, currency: CurrencyCode.ILS },
  { id: 'pre-8', name: 'תיק השקעות / קרן נאמנות', category: AssetLiabilityCategory.SAVINGS, side: AssetSide.ASSET, currency: CurrencyCode.ILS },
  // Liabilities
  { id: 'pre-9', name: 'משכנתא', category: AssetLiabilityCategory.LOAN, side: AssetSide.LIABILITY, currency: CurrencyCode.ILS },
  { id: 'pre-10', name: 'הלוואת רכב', category: AssetLiabilityCategory.LOAN, side: AssetSide.LIABILITY, currency: CurrencyCode.ILS },
  { id: 'pre-11', name: 'הלוואה בנקאית', category: AssetLiabilityCategory.LOAN, side: AssetSide.LIABILITY, currency: CurrencyCode.ILS },
  { id: 'pre-12', name: 'הלוואת גמ״ח', category: AssetLiabilityCategory.DEBT, side: AssetSide.LIABILITY, currency: CurrencyCode.ILS },
  { id: 'pre-13', name: 'חוב לרשות מקומית', category: AssetLiabilityCategory.DEBT, side: AssetSide.LIABILITY, currency: CurrencyCode.ILS },
  { id: 'pre-14', name: 'יתרת חוב בכרטיס אשראי', category: AssetLiabilityCategory.DEBT, side: AssetSide.LIABILITY, currency: CurrencyCode.ILS },
];

const STORAGE_KEY = (householdId: string) => `ali_suggestions_${householdId}`;

export function loadSuggestions(householdId: string): AssetLiabilitySuggestion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(householdId));
    const custom: AssetLiabilitySuggestion[] = raw ? JSON.parse(raw) : [];
    return [...DEFAULT_SUGGESTIONS, ...custom];
  } catch {
    return [...DEFAULT_SUGGESTIONS];
  }
}

export function saveCustomSuggestions(householdId: string, customs: AssetLiabilitySuggestion[]): void {
  localStorage.setItem(STORAGE_KEY(householdId), JSON.stringify(customs));
}

export function loadCustomSuggestions(householdId: string): AssetLiabilitySuggestion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(householdId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

const REMINDERS_KEY = (householdId: string) => `ali_reminders_${householdId}`;

export function loadReminderIds(householdId: string): string[] {
  try {
    const raw = localStorage.getItem(REMINDERS_KEY(householdId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveReminderIds(householdId: string, ids: string[]): void {
  localStorage.setItem(REMINDERS_KEY(householdId), JSON.stringify(ids));
}
