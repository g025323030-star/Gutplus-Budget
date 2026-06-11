import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Calendar, ChevronDown, CreditCard, TrendingDown } from 'lucide-react';
import { CategoryFrequency, CategoryType, CurrencyCode } from '@gutplus/shared';
import type { BudgetItem, Category, BudgetItemListItem } from '@gutplus/shared';
import { ICON_STROKE } from '../constants/ui';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { getBudgetItems, createBudgetItem } from '../services/budget-items.service';
import { getCategories } from '../services/categories.service';
import BudgetItemTable from '../components/budget-items/BudgetItemTable';
import AdvancedModeModal from '../components/budget-items/AdvancedModeModal';
import type { AdvancedModeResult } from '../components/budget-items/AdvancedModeModal';
import CategoryFormModal from '../components/budget-items/CategoryFormModal';
import CategoryHelperPanel from '../components/expenses/CategoryHelperPanel';
import HolidayExpensesSection from '../components/expenses/HolidayExpensesSection';
import type { DraftRow } from '../components/budget-items/types';
import { snapshotOf } from '../components/budget-items/types';
import { SuggestedRowsModal } from '../components/expenses/SuggestedRowsModal';

const HEBREW_MONTHS = [
  'ינואר',
  'פברואר',
  'מרץ',
  'אפריל',
  'מאי',
  'יוני',
  'יולי',
  'אוגוסט',
  'ספטמבר',
  'אוקטובר',
  'נובמבר',
  'דצמבר',
];

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
  const dateOnly = item.date ? item.date.slice(0, 10) : '';
  const installmentsTotal = item.installmentsTotal ?? null;
  const base: DraftRow = {
    localId: newLocalId(),
    serverId: item.id,
    installmentsTotal,
    isRecurring: false,
    recurringFrequency: null,
    recurringEndDate: null,
    description: item.description,
    categoryId: item.categoryId ?? null,
    amount: amountStr,
    date: dateOnly,
    status: 'idle',
    errorMessage: null,
    lastSavedSnapshot: null,
    mode: installmentsTotal !== null ? 'installments' : 'none',
    endDate: null,
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
  const [selectedMonth, setSelectedMonth] = useState<number>(
    now.getMonth() + 1,
  );
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [activeTab, setActiveTab] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState<string | null>(null);

  // Monthly mode: three rubric row arrays
  const [fixedRows, setFixedRows] = useState<DraftRow[]>([]);
  const [biMonthlyRows, setBiMonthlyRows] = useState<DraftRow[]>([]);
  const [installmentRows, setInstallmentRows] = useState<DraftRow[]>([]);
  // Yearly mode: yearly general rows
  const [yearlyRows, setYearlyRows] = useState<DraftRow[]>([]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [focusedRowId, setFocusedRowId] = useState<string | null>(null);
  const [advancedModeForRowId, setAdvancedModeForRowId] = useState<
    string | null
  >(null);
  const [addCategoryForRowId, setAddCategoryForRowId] = useState<
    string | null
  >(null);
  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);
  const [suggestedRows, setSuggestedRows] = useState<DraftRow[]>([]);
  const [isSavingTemplates, setIsSavingTemplates] = useState(false);

  const {
    householdId,
    expenseTemplatesInitialized,
    isLoading: userLoading,
    error: userError,
  } = useCurrentUser();

  const isFirstUse = !expenseTemplatesInitialized;

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === CategoryType.EXPENSE),
    [categories],
  );

  const mainExpenseCategories = useMemo(
    () => expenseCategories.filter((c) => c.parentCategoryId === null),
    [expenseCategories],
  );

  // Combined rows (all rubrics) — used for focused-row lookup, needsReview counts, etc.
  const allRows = useMemo(
    () => [...fixedRows, ...biMonthlyRows, ...installmentRows, ...yearlyRows],
    [fixedRows, biMonthlyRows, installmentRows, yearlyRows],
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

        const draftRows: DraftRow[] = txResult.value
          .filter(
            (item) =>
              !isProjectionItem(item) &&
              item.categoryId !== null &&
              expenseCatIds.has(item.categoryId) &&
              item.frequency === targetFrequency,
          )
          .map((item) => toDraftRow(item))
          .filter((r): r is DraftRow => r !== null);

        if (activeTab === 'monthly') {
          // Split into rubrics: installments, biMonthly, fixed
          setInstallmentRows(draftRows.filter((r) => r.mode === 'installments'));
          setBiMonthlyRows(draftRows.filter((r) => r.baseMonth !== null && r.mode !== 'installments'));
          setFixedRows(draftRows.filter((r) => r.mode !== 'installments' && r.baseMonth === null));
        } else {
          // YEARLY
          setYearlyRows(draftRows);
          setFixedRows([]);
          setBiMonthlyRows([]);
          setInstallmentRows([]);
        }
      } else {
        console.error('Error loading transactions:', txResult.reason);
        setFixedRows([]);
        setBiMonthlyRows([]);
        setInstallmentRows([]);
        setYearlyRows([]);
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

  const handleRowFocus = useCallback((localId: string) => {
    setFocusedRowId(localId);
  }, []);

  const handleAfterAdvancedModeSave = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  const handlePickSubcategory = useCallback(
    (categoryId: string) => {
      if (!focusedRowId) return;
      const applyPatch = (prev: DraftRow[]): DraftRow[] => {
        const idx = prev.findIndex((r) => r.localId === focusedRowId);
        if (idx === -1) return prev;
        const updated = [...prev];
        const target = updated[idx];
        updated[idx] = {
          ...target,
          categoryId,
          status:
            target.status === 'saving'
              ? 'saving'
              : target.status === 'error'
                ? 'error'
                : 'dirty',
        };
        return updated;
      };
      setFixedRows(applyPatch);
      setBiMonthlyRows(applyPatch);
      setInstallmentRows(applyPatch);
      setYearlyRows(applyPatch);
      setFocusedRowId((current) => {
        const idx = allRows.findIndex((r) => r.localId === current);
        if (idx === -1) return current;
        const nextRow = allRows[idx + 1];
        return nextRow ? nextRow.localId : current;
      });
    },
    [focusedRowId, allRows],
  );

  const buildTemplateRows = useCallback(
    (subcategories: Category[]): DraftRow[] => {
      const used = new Set(allRows.map((r) => normDesc(r.description)));
      const date = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const newRows: DraftRow[] = [];
      for (const sub of subcategories) {
        const key = normDesc(sub.name);
        if (used.has(key)) continue;
        used.add(key);
        newRows.push({
          localId: newLocalId(),
          serverId: null,
          installmentsTotal: null,
          isRecurring: false,
          recurringFrequency: null,
          recurringEndDate: null,
          description: sub.name.trim(),
          categoryId: sub.id,
          amount: '',
          date,
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
        });
      }
      return newRows;
    },
    [allRows, selectedMonth, selectedYear],
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

    const subs = globalExpenseSubcategories.filter(
      (c) => c.parentCategoryId === selectedMainCategoryId,
    );

    const newRows = buildTemplateRows(subs);

    if (newRows.length === 0) {
      alert("כל תתי-הקטגוריות עבור הקטגוריה שנבחרה כבר קיימות בטבלה לחודש זה.");
      return;
    }

    setSuggestedRows(newRows);
    setIsSuggestionModalOpen(true);
  }, [selectedMainCategoryId, globalExpenseSubcategories, buildTemplateRows]);

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
              endDate: null,
              isBiMonthly: false,
              status,
            };
          }
          if (result.mode === 'recurring') {
            return {
              ...r,
              mode: 'recurring',
              installmentsTotal: null,
              endDate: result.endDate,
              isBiMonthly: result.isBiMonthly,
              status,
            };
          }
          return {
            ...r,
            mode: 'none',
            installmentsTotal: null,
            endDate: null,
            isBiMonthly: false,
            status,
          };
        });
      setFixedRows(applyAdvanced);
      setBiMonthlyRows(applyAdvanced);
      setInstallmentRows(applyAdvanced);
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
        setFixedRows(applyCategory);
        setBiMonthlyRows(applyCategory);
        setInstallmentRows(applyCategory);
        setYearlyRows(applyCategory);
      }
      setAddCategoryForRowId(null);
    },
    [addCategoryForRowId],
  );

  const handleSaveSuggestedRows = useCallback(async (rowsFromModal: DraftRow[]) => {
    const validRows = rowsFromModal.filter(row => row.amount && Number(row.amount) > 0);

    if (validRows.length === 0) {
      setIsSuggestionModalOpen(false);
      setSuggestedRows([]);
      return;
    }

    if (!householdId) return;

    setIsSavingTemplates(true);
    const savedRowsToAppend: DraftRow[] = [];

    try {
      for (const row of validRows) {
        const payload = {
          amount: String(row.amount),
          date: row.date || undefined,
          description: row.description.trim(),
          frequency: CategoryFrequency.MONTHLY,
          householdId: householdId,
          categoryId: row.categoryId ?? undefined,
          installmentsTotal: row.installmentsTotal ?? undefined,
          baseMonth: row.baseMonth ?? undefined,
        };

        const result = await createBudgetItem(payload);

        if (result && result.kind === 'budgetItems' && result.data?.[0]) {
          const serverData = result.data[0];

          const savedRow: DraftRow = {
            ...row,
            serverId: serverData.id,
            status: 'synced',
            lastSavedSnapshot: null,
          };
          savedRow.lastSavedSnapshot = snapshotOf(savedRow);

          savedRowsToAppend.push(savedRow);
        } else {
          savedRowsToAppend.push({
            ...row,
            status: 'error',
            errorMessage: 'השמירה בשרת נכשלה',
          });
        }
      }

      setFixedRows((prev) => [...prev, ...savedRowsToAppend]);
      setIsSuggestionModalOpen(false);
      setSuggestedRows([]);
    } catch (err) {
      console.error('Failed to save template rows:', err);
      alert('התרחשה שגיאה בעת שמירת הנתונים.');
    } finally {
      setIsSavingTemplates(false);
    }
  }, [householdId]);

  const handleCloseSuggestionModal = useCallback(() => {
    setIsSuggestionModalOpen(false);
    setSuggestedRows([]);
  }, []);

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

  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear + 1; y >= currentYear - 5; y -= 1) {
    years.push(y);
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

      <motion.section
        variants={ITEM_VARIANTS}
        className="flex items-center gap-3"
      >
        <div className="relative">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            aria-label="בחירת שנה"
            className="appearance-none bg-surface border border-slate-200 px-8 py-2 rounded-xl label-text text-primary focus:outline-none focus:border-accent shadow-sm cursor-pointer"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            strokeWidth={ICON_STROKE}
            className="absolute left-3 top-3.5 text-slate-400 pointer-events-none"
          />
        </div>

        {activeTab === 'monthly' && (
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              aria-label="בחירת חודש"
              className="appearance-none bg-surface border border-slate-200 px-8 py-2 rounded-xl label-text text-primary focus:outline-none focus:border-accent shadow-sm cursor-pointer"
            >
              {HEBREW_MONTHS.map((label, idx) => (
                <option key={label} value={idx + 1}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              strokeWidth={ICON_STROKE}
              className="absolute left-3 top-3.5 text-slate-400 pointer-events-none"
            />
          </div>
        )}

        <div className="w-10 h-10 bg-surface border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
          <Calendar size={18} strokeWidth={ICON_STROKE} />
        </div>
      </motion.section>

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

      {/* ======== MONTHLY mode: 3 rubrics + helper panel ======== */}
      {activeTab === 'monthly' && (
        <motion.div
          variants={ITEM_VARIANTS}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
        >
          <div className="lg:col-span-8 space-y-8">
            {/* Rubric 1: קבועות וממוצעות */}
            <section>
              <RubricHeader
                title="הוצאות קבועות וממוצעות"
                subtitle="הוצאות שחוזרות כל חודש — שכר דירה, חשבונות, מנויים"
              />
              <BudgetItemTable
                rows={fixedRows}
                categories={expenseCategories}
                householdId={householdId}
                frequency={CategoryFrequency.MONTHLY}
                monthConstraint={selectedMonth}
                yearConstraint={selectedYear}
                onChange={setFixedRows}
                isLoading={isLoading}
                focusedRowId={focusedRowId}
                onRowFocus={handleRowFocus}
                onAddCategoryRequest={handleAddCategoryRequest}
                onAdvancedModeRequest={handleAdvancedModeRequest}
                onAfterAdvancedModeSave={handleAfterAdvancedModeSave}
                onFillTemplates={handleFillSelectedCategoryTemplates}
                showTemplatesButton={true}
                title="הוצאות קבועות"
                descriptionPlaceholder="לדוגמה: שכר דירה"
              />
            </section>

            {/* Rubric 2: דו-חודשיות */}
            <section>
              <RubricHeader
                title="הוצאות דו-חודשיות"
                subtitle="הוצאות שמחויבות כל חודשיים (בחר חודש בסיס — זוגי/אי-זוגי)"
              />
              <BudgetItemTable
                rows={biMonthlyRows}
                categories={expenseCategories}
                householdId={householdId}
                frequency={CategoryFrequency.MONTHLY}
                isBiMonthlySection
                monthConstraint={selectedMonth}
                yearConstraint={selectedYear}
                onChange={setBiMonthlyRows}
                isLoading={isLoading}
                focusedRowId={focusedRowId}
                onRowFocus={handleRowFocus}
                onAddCategoryRequest={handleAddCategoryRequest}
                onAfterAdvancedModeSave={handleAfterAdvancedModeSave}
                title="הוצאות דו-חודשיות"
                descriptionPlaceholder="לדוגמה: חשמל"
              />
            </section>

            {/* Rubric 3: תשלומים */}
            <section>
              <RubricHeader
                title="עסקאות תשלומים באשראי"
                subtitle="הוצאות שנחלקות למספר תשלומים"
                icon={<CreditCard size={20} strokeWidth={ICON_STROKE} />}
              />
              <BudgetItemTable
                rows={installmentRows}
                categories={expenseCategories}
                householdId={householdId}
                frequency={CategoryFrequency.MONTHLY}
                monthConstraint={selectedMonth}
                yearConstraint={selectedYear}
                onChange={setInstallmentRows}
                isLoading={isLoading}
                focusedRowId={focusedRowId}
                onRowFocus={handleRowFocus}
                onAddCategoryRequest={handleAddCategoryRequest}
                onAdvancedModeRequest={handleAdvancedModeRequest}
                onAfterAdvancedModeSave={handleAfterAdvancedModeSave}
                title="תשלומים"
                descriptionPlaceholder="לדוגמה: רהיטים"
              />
            </section>
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
              onAfterAdvancedModeSave={handleAfterAdvancedModeSave}
              title="הוצאות שנתיות"
              descriptionPlaceholder="לדוגמה: ביטוח רכב"
            />
          </section>

          {/* Rubric 2: הוצאות חגים ואירועים */}
          <section>
            <HolidayExpensesSection
              year={selectedYear}
              categories={expenseCategories}
              householdId={householdId}
              onTransactionsCreated={handleHolidayTransactionsCreated}
            />
          </section>
        </motion.div>
      )}

      <SuggestedRowsModal
        isOpen={isSuggestionModalOpen}
        rows={suggestedRows}
        isLoading={isSavingTemplates}
        onClose={handleCloseSuggestionModal}
        onConfirm={handleSaveSuggestedRows}
      />

      <AdvancedModeModal
        isOpen={advancedModeForRowId !== null}
        initialMode={advancedModeRow?.mode ?? 'none'}
        initialInstallmentsTotal={advancedModeRow?.installmentsTotal ?? null}
        initialEndDate={advancedModeRow?.endDate ?? null}
        initialIsBiMonthly={advancedModeRow?.isBiMonthly ?? false}
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