import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, TrendingDown } from 'lucide-react';
import { CategoryFrequency, CategoryType, CurrencyCode } from '@gutplus/shared';
import type { BudgetItem, Category, BudgetItemListItem, Holiday } from '@gutplus/shared';
import { ICON_STROKE } from '../constants/ui';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useSuggestedRowsModal } from '../hooks/useSuggestedRowsModal';
import { getBudgetItems } from '../services/budget-items.service';
import { getCategories } from '../services/categories.service';
import BudgetItemTable from '../components/budget-items/BudgetItemTable';
import AdvancedModeModal from '../components/budget-items/AdvancedModeModal';
import type { AdvancedModeResult } from '../components/budget-items/AdvancedModeModal';
import CategoryFormModal from '../components/budget-items/CategoryFormModal';
import CategoryHelperPanel from '../components/expenses/CategoryHelperPanel';
import HolidayExpensesSection from '../components/expenses/HolidayExpensesSection';
import type { DraftRow } from '../components/budget-items/types';
import { snapshotOf } from '../components/budget-items/types';
import { groupInstallmentRows } from '../components/budget-items/installments';
import { SuggestedRowsModal } from '../components/expenses/SuggestedRowsModal';

const PAGE_VARIANTS = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' as const },
  },
};

const newLocalId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const normDesc = (s: string): string =>
  s.trim().replace(/\s+/g, ' ').toLowerCase();

const isProjectionItem = (item: BudgetItemListItem): boolean =>
  (item as { isProjection?: boolean }).isProjection === true;

const toDraftRow = (item: BudgetItemListItem): DraftRow | null => {
  if (isProjectionItem(item)) return null;
  const amountStr =
    typeof item.amount === 'string' ? item.amount : String(item.amount);
  const installmentsTotal = item.installmentsTotal ?? null;
  const endDateOnly = item.endDate ? item.endDate.slice(0, 10) : null;
  const base: DraftRow = {
    localId: newLocalId(),
    serverId: item.id,
    installmentsTotal,
    installmentGroupId: (item as { installmentGroupId?: string | null }).installmentGroupId ?? null,
    installmentIndex: (item as { installmentIndex?: number | null }).installmentIndex ?? null,
    isRecurring: false,
    recurringFrequency: null,
    recurringEndDate: null,
    description: item.description,
    categoryId: item.categoryId ?? null,
    amount: amountStr,
    status: 'idle',
    errorMessage: null,
    lastSavedSnapshot: null,
    mode:
      installmentsTotal !== null
        ? 'installments'
        : endDateOnly !== null
          ? 'lastMonth'
          : 'none',
    endDate: endDateOnly,
    isBiMonthly: (item as { isBiMonthly?: boolean }).isBiMonthly ?? false,
    needsReview: item.needsReview ?? false,
    targetAmount: item.targetAmount ?? null,
    currency: item.currency ?? CurrencyCode.ILS,
    assignedMonth: (item as { assignedMonth?: number | null }).assignedMonth ?? null,
    isOneTime: (item as { isOneTime?: boolean }).isOneTime ?? false,
    baseMonth: (item as { baseMonth?: number | null }).baseMonth ?? null,
  };
  base.lastSavedSnapshot = snapshotOf(base);
  return base;
};

// ---- RubricHeader helper ----
interface RubricHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}
function RubricHeader({ title, subtitle, icon }: RubricHeaderProps) {
  return (
    <div className="flex items-start gap-2 px-1 mb-1">
      {icon && <span className="mt-0.5 text-accent">{icon}</span>}
      <div>
        <h2 className="heading-3">{title}</h2>
        {subtitle && <p className="body-text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function ExpensesPage() {
  const now = new Date();
  // The page no longer exposes a month/year picker — each row is a recurring
  // monthly average. We anchor month-dependent logic to the current month.
  const selectedMonth = now.getMonth() + 1;
  const selectedYear = now.getFullYear();
  const [activeTab, setActiveTab] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState<string | null>(null);

  // Monthly mode: unified main table + opposite-parity widget
  const [mainRows, setMainRows] = useState<DraftRow[]>([]);
  const [nextMonthRows, setNextMonthRows] = useState<DraftRow[]>([]);
  // Yearly mode: yearly general rows
  const [yearlyRows, setYearlyRows] = useState<DraftRow[]>([]);
  // Running total per holiday, summed from the full unfiltered BudgetItem list
  const [holidayTotals, setHolidayTotals] = useState<Partial<Record<Holiday, number>>>({});

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [focusedRowId, setFocusedRowId] = useState<string | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const [advancedModeForRowId, setAdvancedModeForRowId] = useState<
    string | null
  >(null);
  const [addCategoryForRowId, setAddCategoryForRowId] = useState<
    string | null
  >(null);

  const {
    householdId,
    expenseTemplatesInitialized,
    isLoading: userLoading,
    error: userError,
  } = useCurrentUser();

  const isFirstUse = !expenseTemplatesInitialized;

  const suggestions = useSuggestedRowsModal({
    householdId,
    validRowFilter: (row) => Boolean(row.amount) && Number(row.amount) > 0,
    buildPayloadExtras: (row) => ({ baseMonth: row.baseMonth ?? undefined }),
    onSaved: () => setReloadKey((k) => k + 1),
  });

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === CategoryType.EXPENSE),
    [categories],
  );

  const mainExpenseCategories = useMemo(() => {
    // Only these main categories are shown in the sidebar, in this exact order.
    const order = [
      'הוצאות ביתיות',
      'הוצאות שוטפות',
      'מזון',
      'תחבורה ורכב',
      'בריאות',
      'תקשורת ואינטרנט',
      'לימודים',
      'מנויים',
      'עמלות',
      'מעשרות וצדקה',
      'ביטוחים',
      'החזרי חובות',
    ];
    const rank = new Map(order.map((name, i) => [name, i] as const));
    return expenseCategories
      .filter((c) => c.parentCategoryId === null && rank.has(c.name))
      .sort((a, b) => (rank.get(a.name) ?? 0) - (rank.get(b.name) ?? 0));
  }, [expenseCategories]);

  // Combined rows (all tables) — used for focused-row lookup, needsReview counts, etc.
  const allRows = useMemo(
    () => [...mainRows, ...nextMonthRows, ...yearlyRows],
    [mainRows, nextMonthRows, yearlyRows],
  );

  useEffect(() => {
    if (!householdId) return;
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      // For monthly: fetch by month+year. For yearly: fetch by year only.
      const fetchMonth = activeTab === 'monthly' ? selectedMonth : undefined;
      const [txResult, catsResult] = await Promise.allSettled([
        getBudgetItems(fetchMonth, selectedYear),
        getCategories(),
      ]);
      if (cancelled) return;

      if (catsResult.status === 'fulfilled') {
        setCategories(catsResult.value);
      } else {
        console.error('Error loading categories:', catsResult.reason);
      }

      if (txResult.status === 'fulfilled') {
        const knownCats =
          catsResult.status === 'fulfilled' ? catsResult.value : categories;
        const expenseCatIds = new Set(
          knownCats
            .filter((c) => c.type === CategoryType.EXPENSE)
            .map((c) => c.id),
        );
        const targetFrequency =
          activeTab === 'yearly' ? CategoryFrequency.YEARLY : CategoryFrequency.MONTHLY;

        // A capped item ("last billing month") drops out once its endDate is
        // before the first day of the viewed month — mirrors the server's
        // isItemIncludedInMonth so the editor matches the budget totals.
        const firstOfViewedMonth = new Date(selectedYear, selectedMonth - 1, 1);
        const includedByEndDate = (item: BudgetItemListItem): boolean =>
          !item.endDate || new Date(item.endDate) >= firstOfViewedMonth;

        // Holiday items carry no categoryId/year — sum the full raw list (not
        // draftRows, which filters them out) by holiday, with no year filter.
        const nextHolidayTotals: Partial<Record<Holiday, number>> = {};
        for (const item of txResult.value) {
          if (item.holiday) {
            nextHolidayTotals[item.holiday] =
              (nextHolidayTotals[item.holiday] ?? 0) + parseFloat(item.amount);
          }
        }
        setHolidayTotals(nextHolidayTotals);

        const draftRows: DraftRow[] = txResult.value
          .filter(
            (item) =>
              !isProjectionItem(item) &&
              item.categoryId !== null &&
              expenseCatIds.has(item.categoryId) &&
              item.frequency === targetFrequency &&
              includedByEndDate(item),
          )
          .map((item) => toDraftRow(item))
          .filter((r): r is DraftRow => r !== null);

        if (activeTab === 'monthly') {
          // Collapse installment siblings into single representative rows
          const grouped = groupInstallmentRows(draftRows, selectedMonth, selectedYear);
          const activeThisMonth = (r: DraftRow) =>
            r.baseMonth == null || r.baseMonth % 2 === selectedMonth % 2;
          setMainRows(grouped.filter(activeThisMonth));
          setNextMonthRows(
            grouped.filter(
              (r) => r.baseMonth != null && r.baseMonth % 2 !== selectedMonth % 2,
            ),
          );
          setYearlyRows([]);
        } else {
          // YEARLY
          setYearlyRows(draftRows);
          setMainRows([]);
          setNextMonthRows([]);
        }
      } else {
        console.error('Error loading transactions:', txResult.reason);
        setMainRows([]);
        setNextMonthRows([]);
        setYearlyRows([]);
        setHolidayTotals({});
        setError('שגיאה בטעינת ההוצאות. נסה לרענן את הדף.');
      }

      setIsLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedMonth, selectedYear, householdId, reloadKey]);

  useEffect(() => {
    if (mainExpenseCategories && mainExpenseCategories.length > 0 && !selectedMainCategoryId) {
      setSelectedMainCategoryId(mainExpenseCategories[0].id);
    }
  }, [mainExpenseCategories, selectedMainCategoryId]);

  // Clear the selected subcategory when the period/tab changes, so the fixed-table
  // add-row pre-fill and the helper-panel highlight don't carry a stale selection.
  useEffect(() => {
    setSelectedSubcategoryId(null);
  }, [activeTab, selectedMonth, selectedYear]);

  const handleRowFocus = useCallback((localId: string) => {
    setFocusedRowId(localId);
  }, []);

  const handleAfterAdvancedModeSave = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  const makeEmptyRow = useCallback(
    (categoryId: string | null): DraftRow => ({
      localId: newLocalId(),
      serverId: null,
      installmentsTotal: null,
      isRecurring: false,
      recurringFrequency: null,
      recurringEndDate: null,
      description: '',
      categoryId,
      amount: '',
      status: 'idle',
      errorMessage: null,
      lastSavedSnapshot: null,
      mode: 'none',
      endDate: null,
      isBiMonthly: false,
      needsReview: false,
      targetAmount: null,
      currency: CurrencyCode.ILS,
      assignedMonth: null,
      isOneTime: false,
      baseMonth: null,
    }),
    [],
  );

  const handlePickSubcategory = useCallback(
    (categoryId: string) => {
      setSelectedSubcategoryId(categoryId);
      const newRow = makeEmptyRow(categoryId);
      // Add the new row at the TOP of the table so it's immediately visible.
      setMainRows((prev) => [newRow, ...prev]);
      setFocusedRowId(newRow.localId);
    },
    [makeEmptyRow],
  );

  const buildTemplateRows = useCallback(
    (subcategories: Category[]): DraftRow[] => {
      const used = new Set(allRows.map((r) => normDesc(r.description)));
      const newRows: DraftRow[] = [];
      for (const sub of subcategories) {
        const key = normDesc(sub.name);
        if (used.has(key)) continue;
        used.add(key);
        newRows.push({ ...makeEmptyRow(sub.id), description: sub.name.trim() });
      }
      return newRows;
    },
    [allRows, makeEmptyRow],
  );

  const globalExpenseSubcategories = useMemo(
    () =>
      expenseCategories.filter(
        (c) => c.parentCategoryId !== null && c.householdId === null,
      ),
    [expenseCategories],
  );

  const handleFillSelectedCategoryTemplates = useCallback(() => {
    if (!selectedMainCategoryId) {
      alert("אנא בחרו קטגוריה ראשית מתוך 'עוזר הקטגוריות המהיר' בצד.");
      return;
    }

    const mainCategoryId = selectedMainCategoryId;

    const subs = globalExpenseSubcategories.filter(
      (c) => c.parentCategoryId === mainCategoryId,
    );

    const newRows = buildTemplateRows(subs);

    const categoryIds = new Set<string>([mainCategoryId, ...subs.map((s) => s.id)]);
    const flaggedRows = allRows.filter((r) => r.needsReview && r.categoryId !== null && categoryIds.has(r.categoryId));
    const combined = [...flaggedRows, ...newRows];

    if (combined.length === 0) {
      alert('אין שורות חדשות מוצעות ואין שורות מסומנות לעדכון בקטגוריה זו');
      return;
    }

    suggestions.open(combined);
  }, [selectedMainCategoryId, globalExpenseSubcategories, buildTemplateRows, allRows, suggestions]);

  const handleAdvancedModeRequest = useCallback((localId: string) => {
    setAdvancedModeForRowId(localId);
  }, []);

  const handleAdvancedModeConfirm = useCallback(
    (result: AdvancedModeResult) => {
      if (!advancedModeForRowId) return;
      const applyAdvanced = (prev: DraftRow[]): DraftRow[] =>
        prev.map((r) => {
          if (r.localId !== advancedModeForRowId) return r;
          const status =
            r.status === 'idle' || r.status === 'synced' ? 'dirty' : r.status;
          if (result.mode === 'installments') {
            return {
              ...r,
              mode: 'installments',
              installmentsTotal: result.installmentsTotal,
              baseMonth: null,
              isBiMonthly: false,
              endDate: null,
              status,
            };
          }
          if (result.mode === 'biMonthly') {
            return {
              ...r,
              mode: 'none',
              installmentsTotal: null,
              baseMonth: result.parity === 'even' ? 2 : 1,
              isBiMonthly: true,
              endDate: null,
              status,
            };
          }
          if (result.mode === 'lastMonth') {
            // A normal monthly expense capped at a last billing month. It stays
            // a single projected row (mode stays effectively "none" for the
            // create path) — only endDate limits how long it is billed.
            return {
              ...r,
              mode: 'lastMonth',
              installmentsTotal: null,
              baseMonth: null,
              isBiMonthly: false,
              endDate: result.endDate,
              status,
            };
          }
          if (result.mode === 'recurring') {
            return {
              ...r,
              mode: 'recurring',
              installmentsTotal: null,
              baseMonth: null,
              isBiMonthly: false,
              endDate: result.endDate,
              status,
            };
          }
          return {
            ...r,
            mode: 'none',
            installmentsTotal: null,
            baseMonth: null,
            isBiMonthly: false,
            endDate: null,
            status,
          };
        });
      setMainRows(applyAdvanced);
      setNextMonthRows(applyAdvanced);
      setYearlyRows(applyAdvanced);
      setAdvancedModeForRowId(null);
    },
    [advancedModeForRowId],
  );

  const handleAddCategoryRequest = useCallback((localId: string) => {
    setAddCategoryForRowId(localId);
  }, []);

  const handleCategoryCreated = useCallback(
    (newCategory: Category) => {
      setCategories((prev) => [...prev, newCategory]);
      if (addCategoryForRowId) {
        const applyCategory = (prev: DraftRow[]): DraftRow[] =>
          prev.map((r) =>
            r.localId === addCategoryForRowId
              ? {
                  ...r,
                  categoryId: newCategory.id,
                  status:
                    r.status === 'idle' || r.status === 'synced'
                      ? 'dirty'
                      : r.status,
                }
              : r,
          );
        setMainRows(applyCategory);
        setNextMonthRows(applyCategory);
        setYearlyRows(applyCategory);
      }
      setAddCategoryForRowId(null);
    },
    [addCategoryForRowId],
  );

  const handleHolidayTransactionsCreated = useCallback((_txs: BudgetItem[]) => {
    // Holiday transactions are managed by HolidayExpensesSection internally.
    // Reload yearly rows to reflect newly saved items.
    setReloadKey((k) => k + 1);
  }, []);

  const advancedModeRow = useMemo(
    () => allRows.find((r) => r.localId === advancedModeForRowId) ?? null,
    [advancedModeForRowId, allRows],
  );

  // Compute per-category needsReview counts (client-side only, no server endpoint)
  const needsReviewCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const row of allRows) {
      if (row.needsReview && row.categoryId) {
        counts[row.categoryId] = (counts[row.categoryId] ?? 0) + 1;
      }
    }
    return counts;
  }, [allRows]);

  const focusedRow = useMemo(
    () => allRows.find((r) => r.localId === focusedRowId) ?? null,
    [focusedRowId, allRows],
  );

  const focusedRowIndex = useMemo(
    () => (focusedRowId ? allRows.findIndex((r) => r.localId === focusedRowId) : -1),
    [focusedRowId, allRows],
  );

  if (userLoading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="bg-slate-100 animate-pulse rounded-2xl h-16" />
        <div className="bg-slate-100 animate-pulse rounded-2xl h-64" />
      </div>
    );
  }

  if (userError || !householdId) {
    return (
      <div className="p-6 md:p-8">
        <div className="bg-surface rounded-2xl shadow-sm border border-red-100 p-6 flex items-center gap-3">
          <AlertCircle
            className="text-red-500"
            size={22}
            strokeWidth={ICON_STROKE}
          />
          <p className="body-text text-red-500">
            {userError ?? 'לא נמצא משק בית עבור המשתמש'}
          </p>
        </div>
      </div>
    );
  }


  return (
    <motion.div
      variants={PAGE_VARIANTS}
      initial="hidden"
      animate="visible"
      className="p-6 md:p-8 space-y-4"
    >
      <motion.header
        variants={ITEM_VARIANTS}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div className="flex items-start gap-3">
          <TrendingDown
            className="text-accent mt-1"
            size={28}
            strokeWidth={ICON_STROKE}
          />
          <div>
            <h1 className="heading-2">הוצאות</h1>
            <p className="body-text-sm text-slate-500 leading-relaxed mt-1">
              הזן הוצאות חודשיות ושנתיות. בתצוגה השנתית ניתן גם להוסיף הוצאות לפי חגים.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-surface p-1 rounded-xl shadow-sm border border-slate-100">
          <button
            type="button"
            onClick={() => setActiveTab('yearly')}
            className={`px-4 py-1.5 rounded-lg label-text transition-all duration-200 ${
              activeTab === 'yearly'
                ? 'bg-accent text-white'
                : 'text-slate-500 hover:text-primary'
            }`}
          >
            שנתי
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('monthly')}
            className={`px-4 py-1.5 rounded-lg label-text transition-all duration-200 ${
              activeTab === 'monthly'
                ? 'bg-accent text-white'
                : 'text-slate-500 hover:text-primary'
            }`}
          >
            חודשי
          </button>
        </div>
      </motion.header>

      {error && (
        <motion.div
          variants={ITEM_VARIANTS}
          className="bg-surface rounded-2xl shadow-sm border border-red-100 p-4 flex items-center gap-3"
        >
          <AlertCircle
            className="text-red-500"
            size={20}
            strokeWidth={ICON_STROKE}
          />
          <p className="body-text text-red-500">{error}</p>
        </motion.div>
      )}

      {/* ======== MONTHLY mode: unified table + next-month widget + helper panel ======== */}
      {activeTab === 'monthly' && (
        <motion.div
          variants={ITEM_VARIANTS}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
        >
          <div className="lg:col-span-8 space-y-6">
            {/* Unified main table: fixed + installments + current-parity bi-monthly */}
            <section>
              <RubricHeader
                title="הוצאות החודש"
                subtitle="הוצאות קבועות, תשלומים והוצאות דו-חודשיות פעילות בחודש זה"
              />
              <BudgetItemTable
                rows={mainRows}
                categories={expenseCategories}
                householdId={householdId}
                frequency={CategoryFrequency.MONTHLY}
                monthConstraint={selectedMonth}
                yearConstraint={selectedYear}
                onChange={setMainRows}
                isLoading={isLoading}
                focusedRowId={focusedRowId}
                onRowFocus={handleRowFocus}
                onAddCategoryRequest={handleAddCategoryRequest}
                onAdvancedModeRequest={handleAdvancedModeRequest}
                advancedModeRowId={advancedModeForRowId}
                onAfterAdvancedModeSave={handleAfterAdvancedModeSave}
                onFillTemplates={handleFillSelectedCategoryTemplates}
                showTemplatesButton={true}
                title="הוצאות החודש"
                descriptionPlaceholder="לדוגמה: שכר דירה"
                categoryMode="label"
                defaultCategoryId={selectedSubcategoryId ?? selectedMainCategoryId}
                addRowDisabled={!selectedSubcategoryId && !selectedMainCategoryId}
                sortable
              />
            </section>

            {/* Next-month widget: opposite-parity bi-monthly rows */}
            {nextMonthRows.length > 0 && (
              <section>
                <RubricHeader
                  title=""
                  subtitle="עסקאות אלו יחויבו בחודש הבא. ניתן לערוך אך לא להוסיף שורות"
                />
                <BudgetItemTable
                  rows={nextMonthRows}
                  categories={expenseCategories}
                  householdId={householdId}
                  frequency={CategoryFrequency.MONTHLY}
                  monthConstraint={selectedMonth}
                  yearConstraint={selectedYear}
                  onChange={setNextMonthRows}
                  hideAddRow
                  compact
                  categoryMode="label"
                  onAdvancedModeRequest={handleAdvancedModeRequest}
                  advancedModeRowId={advancedModeForRowId}
                  onAfterAdvancedModeSave={handleAfterAdvancedModeSave}
                  onAddCategoryRequest={handleAddCategoryRequest}
                  title="עסקאות דו-חודשיות שיחוייבו בחודש הבא"
                  descriptionPlaceholder="לדוגמה: חשמל"
                />
              </section>
            )}
          </div>

          <div className="lg:col-span-4">
            <CategoryHelperPanel
              mainCategories={mainExpenseCategories}
              allCategories={expenseCategories}
              focusedRowId={focusedRowId}
              focusedRowDescription={focusedRow?.description ?? ''}
              focusedRowIndex={focusedRowIndex === -1 ? null : focusedRowIndex}
              onPickSubcategory={handlePickSubcategory}
              isFirstUse={isFirstUse}
              selectedMainId={selectedMainCategoryId}
              onSelectedMainIdChange={setSelectedMainCategoryId}
              needsReviewCounts={needsReviewCounts}
              selectedSubcategoryId={selectedSubcategoryId}
            />
          </div>
        </motion.div>
      )}

      {/* ======== YEARLY mode: 2 rubrics ======== */}
      {activeTab === 'yearly' && (
        <motion.div
          variants={ITEM_VARIANTS}
          className="space-y-8"
        >
          {/* Rubric 1: הוצאות שנתיות כלליות */}
          <section>
            <RubricHeader
              title="הוצאות שנתיות כלליות"
              subtitle="הוצאות שנתיות חוזרות — ביטוח, ארנונה, מנויים שנתיים"
            />
            <BudgetItemTable
              rows={yearlyRows}
              categories={expenseCategories}
              householdId={householdId}
              frequency={CategoryFrequency.YEARLY}
              yearConstraint={selectedYear}
              isYearly={true}
              onChange={setYearlyRows}
              isLoading={isLoading}
              onAddCategoryRequest={handleAddCategoryRequest}
              onAdvancedModeRequest={handleAdvancedModeRequest}
              advancedModeRowId={advancedModeForRowId}
              onAfterAdvancedModeSave={handleAfterAdvancedModeSave}
              title="הוצאות שנתיות"
              descriptionPlaceholder="לדוגמה: ביטוח רכב"
              categoryMode="label"
              sortable
            />
          </section>

          {/* Rubric 2: הוצאות חגים ואירועים */}
          <section>
            <HolidayExpensesSection
              year={selectedYear}
              householdId={householdId}
              onTransactionsCreated={handleHolidayTransactionsCreated}
              totalsByHoliday={holidayTotals}
            />
          </section>
        </motion.div>
      )}

      <SuggestedRowsModal
        isOpen={suggestions.isOpen}
        rows={suggestions.rows}
        isLoading={suggestions.isSaving}
        onClose={suggestions.close}
        onConfirm={suggestions.save}
      />

      <AdvancedModeModal
        isOpen={advancedModeForRowId !== null}
        initialMode={advancedModeRow?.mode ?? 'none'}
        initialInstallmentsTotal={advancedModeRow?.installmentsTotal ?? null}
        initialEndDate={advancedModeRow?.endDate ?? null}
        initialBaseMonth={advancedModeRow?.baseMonth ?? null}
        totalAmount={advancedModeRow?.amount ?? ''}
        onClose={() => setAdvancedModeForRowId(null)}
        onConfirm={handleAdvancedModeConfirm}
      />

      <CategoryFormModal
        isOpen={addCategoryForRowId !== null}
        type={CategoryType.EXPENSE}
        householdId={householdId}
        existingCategories={expenseCategories}
        onClose={() => setAddCategoryForRowId(null)}
        onCreated={handleCategoryCreated}
      />
    </motion.div>
  );
}