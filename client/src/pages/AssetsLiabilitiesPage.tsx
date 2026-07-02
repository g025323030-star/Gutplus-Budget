import { useEffect, useMemo, useState } from 'react';
import { Scale, AlertCircle, Plus, CreditCard, ListPlus } from 'lucide-react';
import { AssetSide, AssetLiabilityCategory, CurrencyCode } from '@gutplus/shared';
import type { AssetLiabilityItem, DebtBudgetItemOverview, FamilyMember, MonthlySummary } from '@gutplus/shared';
import { ICON_STROKE } from '../constants/ui';
import { useCurrentUser } from '../hooks/useCurrentUser';
import {
  listAssetLiabilityItems,
  deleteAssetLiabilityItem,
  listDebtOverview,
} from '../services/asset-liability-items.service';
import { PENDING_PREFIX, NEW_ROW_ID, isPendingId } from '../components/assets/AssetLiabilityItemRow';
import { listFamilyMembers } from '../services/family-members.service';
import { getSummary } from '../services/summary.service';
import type { AssetLiabilitySide } from '../components/assets/AssetLiabilityToggle';
import { loadReminderIds } from '../data/asset-liability-default-suggestions';
import AssetLiabilitySummaryCards from '../components/assets/AssetLiabilitySummaryCards';
import AssetLiabilityItemRow from '../components/assets/AssetLiabilityItemRow';
import AssetLiabilityCategoryChart from '../components/assets/AssetLiabilityCategoryChart';
import AssetLiabilityQuickFillModal from '../components/assets/AssetLiabilityQuickFillModal';

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-slate-100 animate-pulse rounded-2xl h-44" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-100 animate-pulse rounded-2xl h-64" />
        <div className="bg-slate-100 animate-pulse rounded-2xl h-64" />
      </div>
    </div>
  );
}

function ErrorBlock({ message }: { message: string }) {
  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-red-100 p-6 flex items-center gap-3">
      <AlertCircle className="text-red-500 shrink-0" size={22} strokeWidth={ICON_STROKE} />
      <p className="body-text text-red-500">{message}</p>
    </div>
  );
}

// NEW_ROW_ID imported from AssetLiabilityItemRow

export default function AssetsLiabilitiesPage() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const { householdId, isLoading: userLoading, error: userError } = useCurrentUser();

  const [items, setItems] = useState<AssetLiabilityItem[]>([]);
  const [debtOverview, setDebtOverview] = useState<DebtBudgetItemOverview[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSide, setActiveSide] = useState<AssetLiabilitySide>('assets');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNewRow, setShowNewRow] = useState(false);
  const [newRowDefaultCategory, setNewRowDefaultCategory] = useState<AssetLiabilityCategory | undefined>(undefined);
  const [quickFillOpen, setQuickFillOpen] = useState(false);
  const [reminderCount, setReminderCount] = useState(() =>
    householdId ? loadReminderIds(householdId).length : 0,
  );

  useEffect(() => {
    if (!householdId) return;
    setIsLoading(true);
    Promise.all([
      listAssetLiabilityItems(householdId),
      listDebtOverview(householdId),
      listFamilyMembers(householdId),
      getSummary(currentMonth, currentYear),
    ])
      .then(([fetchedItems, fetchedDebt, fetchedMembers, summary]) => {
        setItems(fetchedItems);
        setDebtOverview(fetchedDebt);
        setFamilyMembers(fetchedMembers);
        setMonthlySummary(summary);
        setError(null);
      })
      .catch(() => setError('טעינת הנתונים נכשלה. נסו לרענן את הדף'))
      .finally(() => setIsLoading(false));
  }, [householdId]);

  const assetItems = useMemo(() => items.filter((i) => i.side === AssetSide.ASSET), [items]);
  const liabilityItems = useMemo(() => items.filter((i) => i.side === AssetSide.LIABILITY), [items]);

  // Raw totals from items
  const totalAssetsRaw = useMemo(
    () => assetItems.reduce((s, i) => s + parseFloat(i.valueInIls), 0),
    [assetItems],
  );
  const totalLiabilitiesRaw = useMemo(
    () => liabilityItems.reduce((s, i) => s + parseFloat(i.valueInIls), 0),
    [liabilityItems],
  );

  // Debt service from Expenses screen factored into liabilities
  const debtFromExpensesAnnual = useMemo(
    () => (monthlySummary?.debtRepayments ?? 0) * 12,
    [monthlySummary],
  );

  // Principal balances of linked debt items (from DebtLiabilityRow records)
  const linkedDebtPrincipalTotal = useMemo(
    () =>
      debtOverview.reduce((s, d) => {
        const v = d.linkedItem ? parseFloat(d.linkedItem.value) : 0;
        return s + (v > 0 ? v : 0);
      }, 0),
    [debtOverview],
  );

  // Interest totals
  const totalAssetsInterest = useMemo(
    () =>
      assetItems.reduce(
        (s, i) => (i.interestRate ? s + parseFloat(i.valueInIls) * (parseFloat(i.interestRate) / 100) : s),
        0,
      ),
    [assetItems],
  );
  const totalLiabilitiesInterest = useMemo(
    () =>
      liabilityItems.reduce(
        (s, i) => (i.interestRate ? s + parseFloat(i.valueInIls) * (parseFloat(i.interestRate) / 100) : s),
        0,
      ),
    [liabilityItems],
  );

  // Pending debt items (from Expenses, no linked AssetLiabilityItem yet) — synthetic items
  const pendingDebtItems = useMemo((): AssetLiabilityItem[] =>
    householdId
      ? debtOverview
          .filter((d) => !d.linkedItem)
          .map((d) => ({
            id: `${PENDING_PREFIX}${d.budgetItemId}`,
            name: d.description,
            side: AssetSide.LIABILITY,
            category: AssetLiabilityCategory.DEBT,
            value: '0',
            valueInIls: '0',
            currency: (d.currency as CurrencyCode) ?? CurrencyCode.ILS,
            interestRate: null,
            targetAmount: null,
            urgencyLevel: null,
            sourceBudgetItemId: d.budgetItemId,
            monthlyPayment: d.monthlyPayment,
            lastDecreaseYearMonth: null,
            familyMemberId: null,
            familyMemberName: null,
            householdId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }))
      : [],
    [debtOverview, householdId],
  );

  const activeItems = useMemo(
    () =>
      activeSide === 'assets'
        ? assetItems
        : [...pendingDebtItems, ...liabilityItems],
    [activeSide, assetItems, liabilityItems, pendingDebtItems],
  );

  const activeTotal = activeSide === 'assets'
    ? totalAssetsRaw
    : totalLiabilitiesRaw + linkedDebtPrincipalTotal + debtFromExpensesAnnual;

  const categoryBreakdown = useMemo(() => {
    const map = new Map<AssetLiabilityCategory, number>();
    activeItems.forEach((i) => {
      map.set(i.category, (map.get(i.category) ?? 0) + parseFloat(i.valueInIls));
    });
    return map;
  }, [activeItems]);

  const handleSaved = (saved: AssetLiabilityItem) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === saved.id);
      return idx >= 0 ? prev.map((i) => (i.id === saved.id ? saved : i)) : [...prev, saved];
    });
    // If a pending debt row was just saved, update debtOverview so the pending row is replaced
    if (saved.sourceBudgetItemId) {
      setDebtOverview((prev) =>
        prev.map((d) =>
          d.budgetItemId === saved.sourceBudgetItemId ? { ...d, linkedItem: saved } : d,
        ),
      );
    }
    setEditingId(null);
    setShowNewRow(false);
  };

  const handleItemUpdated = (updated: AssetLiabilityItem) => {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  const handleDelete = async (id: string) => {
    if (isPendingId(id)) return; // synthetic IDs don't exist in the DB
    try {
      await deleteAssetLiabilityItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      if (editingId === id) setEditingId(null);
    } catch {
      setError('מחיקת הפריט נכשלה. נסו שוב');
    }
  };

  const handleAddClick = (defaultCategory?: AssetLiabilityCategory) => {
    setNewRowDefaultCategory(defaultCategory);
    setEditingId(NEW_ROW_ID);
    setShowNewRow(true);
  };

  const handleQuickFillSaved = (newItems: AssetLiabilityItem[]) => {
    setItems((prev) => [...prev, ...newItems]);
  };

  const refreshReminderCount = () => {
    if (householdId) setReminderCount(loadReminderIds(householdId).length);
  };

  const cancelNewRow = () => {
    setEditingId(null);
    setShowNewRow(false);
    setNewRowDefaultCategory(undefined);
  };

  const handleSideChange = (side: AssetLiabilitySide) => {
    setEditingId(null);
    setShowNewRow(false);
    setNewRowDefaultCategory(undefined);
    setActiveSide(side);
  };

  if (userLoading) return <div className="p-6 md:p-8"><LoadingSkeleton /></div>;
  if (userError || !householdId) {
    return (
      <div className="p-6 md:p-8">
        <ErrorBlock message="לא ניתן לטעון את נתוני המשתמש" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header — title right, toggle left (RTL: title is visually on the right) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
            <Scale className="text-accent" size={22} strokeWidth={ICON_STROKE} />
          </div>
          <h1 className="heading-2">נכסים מול התחייבויות</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle — top right per spec */}
          <div
          className="inline-flex items-center bg-background rounded-xl p-1 border border-slate-200"
          role="tablist"
          aria-label="בחירת תצוגה"
        >
          <button
            role="tab"
            aria-pressed={activeSide === 'assets'}
            onClick={() => handleSideChange('assets')}
            className={`px-4 py-1.5 rounded-lg label-text text-sm transition-all duration-300 ${
              activeSide === 'assets'
                ? 'bg-green-500 text-white shadow-sm'
                : 'text-slate-500 hover:text-primary'
            }`}
          >
            נכסים
          </button>
          <button
            role="tab"
            aria-pressed={activeSide === 'liabilities'}
            onClick={() => handleSideChange('liabilities')}
            className={`px-4 py-1.5 rounded-lg label-text text-sm transition-all duration-300 ${
              activeSide === 'liabilities'
                ? 'bg-red-500 text-white shadow-sm'
                : 'text-slate-500 hover:text-primary'
            }`}
          >
            התחייבויות
          </button>
        </div>
        </div>
      </div>

      {error && <ErrorBlock message={error} />}

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {/* Summary cards — active side highlighted, all 3 always visible */}
          <AssetLiabilitySummaryCards
            totalAssets={totalAssetsRaw}
            totalLiabilities={totalLiabilitiesRaw + linkedDebtPrincipalTotal}
            totalAssetsInterest={totalAssetsInterest}
            totalLiabilitiesInterest={totalLiabilitiesInterest}
            debtFromExpensesAnnual={debtFromExpensesAnnual}
            activeSide={activeSide}
          />

          {/* Chart + item list side-by-side — list is 2/3, chart is 1/3 */}
          {/* In RTL, first child renders on the right; list (2fr) comes first */}
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6 items-start">
            {/* Item list with inline editing — right side, 2/3 */}
            <div className="bg-surface rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="heading-3">
                  {activeSide === 'assets' ? 'רשימת נכסים' : 'רשימת התחייבויות'}
                </h3>
                {editingId !== NEW_ROW_ID && (
                  <div className="flex items-center gap-2">
                    {/* Quick fill icon button (ListPlus) with reminder badge */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setQuickFillOpen(true)}
                        aria-label="מילוי מהיר"
                        title="מילוי מהיר"
                        className="w-10 h-10 bg-surface border border-slate-200 text-primary rounded-xl shadow-sm hover:shadow-md hover:bg-slate-50 transition-all duration-200 flex items-center justify-center"
                      >
                        <ListPlus size={18} strokeWidth={ICON_STROKE} />
                      </button>
                      {reminderCount > 0 && (
                        <span className="absolute -top-1.5 -left-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 pointer-events-none">
                          {reminderCount}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddClick()}
                      className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-xl label-text shadow-sm shadow-accent/10 hover:shadow-md hover:shadow-accent/20 transition-all duration-300"
                    >
                      <Plus size={16} strokeWidth={ICON_STROKE} />
                      הוסף פריט
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                {activeItems.map((item) => (
                  <AssetLiabilityItemRow
                    key={item.id}
                    item={item}
                    side={activeSide}
                    familyMembers={familyMembers}
                    householdId={householdId}
                    isEditing={editingId === item.id}
                    onEditRequest={() => setEditingId(item.id)}
                    onSaved={handleSaved}
                    onCancel={() => setEditingId(null)}
                    onDelete={handleDelete}
                    onItemUpdated={handleItemUpdated}
                  />
                ))}

                {showNewRow && editingId === NEW_ROW_ID && (
                  <AssetLiabilityItemRow
                    key={NEW_ROW_ID}
                    item={{
                      id: NEW_ROW_ID,
                      name: '',
                      side: activeSide === 'assets' ? AssetSide.ASSET : AssetSide.LIABILITY,
                      category: newRowDefaultCategory ?? AssetLiabilityCategory.REAL_ESTATE,
                      value: '0',
                      valueInIls: '0',
                      currency: CurrencyCode.ILS,
                      interestRate: null,
                      targetAmount: null,
                      urgencyLevel: null,
                      sourceBudgetItemId: null,
                      monthlyPayment: null,
                      lastDecreaseYearMonth: null,
                      familyMemberId: null,
                      familyMemberName: null,
                      householdId,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    }}
                    side={activeSide}
                    familyMembers={familyMembers}
                    householdId={householdId}
                    isEditing
                    defaultCategory={newRowDefaultCategory}
                    onEditRequest={() => {}}
                    onSaved={handleSaved}
                    onCancel={cancelNewRow}
                    onDelete={() => {}}
                    onItemUpdated={handleItemUpdated}
                  />
                )}

                {activeItems.length === 0 && !showNewRow && (
                  <div className="flex flex-col items-center py-10 text-center">
                    <p className="body-text text-slate-400 mb-4">
                      {activeSide === 'assets'
                        ? 'אין נכסים רשומים עדיין'
                        : 'אין התחייבויות רשומות עדיין'}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleAddClick()}
                      className="py-2.5 px-5 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-accent hover:text-accent transition-all flex items-center gap-2 text-sm"
                    >
                      <Plus size={15} strokeWidth={ICON_STROKE} />
                      {activeSide === 'assets' ? 'הוסף נכס ראשון' : 'הוסף התחייבות ראשונה'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Category breakdown chart — left side, 1/3 */}
            <AssetLiabilityCategoryChart
              breakdown={categoryBreakdown}
              activeSide={activeSide}
              total={activeTotal}
            />
          </div>
        </>
      )}

      {householdId && (
        <AssetLiabilityQuickFillModal
          isOpen={quickFillOpen}
          householdId={householdId}
          familyMembers={familyMembers}
          onClose={() => setQuickFillOpen(false)}
          onSaved={handleQuickFillSaved}
          onReminderChange={refreshReminderCount}
        />
      )}
    </div>
  );
}
