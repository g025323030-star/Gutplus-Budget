import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Calendar, ChevronDown, TrendingUp } from 'lucide-react';
import { CategoryFrequency, CategoryType, CurrencyCode } from '@gutplus/shared';
import type { Category, BudgetItemListItem } from '@gutplus/shared';
import { ICON_STROKE } from '../constants/ui';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { getBudgetItems, createBudgetItem } from '../services/budget-items.service';
import { getCategories } from '../services/categories.service';
import BudgetItemTable from '../components/budget-items/BudgetItemTable';
import AdvancedModeModal from '../components/budget-items/AdvancedModeModal';
import type { AdvancedModeResult } from '../components/budget-items/AdvancedModeModal';
import CategoryFormModal from '../components/budget-items/CategoryFormModal';
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
    isBiMonthly: false,
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

const INCOME_TEMPLATE_DESCRIPTIONS: string[] = [
  'משכורת בעל',
  'מלגת כולל',
  'משכורת אישה',
  'ביטוח לאומי - קצבת ילדים',
  'ביטוח לאומי - קצבאות נוספות',
  'סיוע בשכר דירה',
  'סיוע מההורים - חודשי',
  'הכנסה מנכס',
  'כרטיסי מזון',
  'תמיכות',
  'שונות',
];

export default function IncomePage() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(
    now.getMonth() + 1,
  );
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [activeTab, setActiveTab] = useState<'monthly' | 'yearly'>('monthly');
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [advancedModeForRowId, setAdvancedModeForRowId] = useState<
    string | null
  >(null);
  const [addCategoryForRowId, setAddCategoryForRowId] = useState<
    string | null
  >(null);

  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);
  const [suggestedRows, setSuggestedRows] = useState<DraftRow[]>([]);
  const [isSavingTemplates, setIsSavingTemplates] = useState(false);

  const inlineInjectedRef = useRef(false);

  const {
    householdId,
    incomeTemplatesInitialized,
    isLoading: userLoading,
    error: userError,
  } = useCurrentUser();

  const isFirstUse = !incomeTemplatesInitialized;

  const incomeCategories = useMemo(
    () => categories.filter((c) => c.type === CategoryType.INCOME),
    [categories],
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
        const incomeCatIds = new Set(
          knownCats
            .filter((c) => c.type === CategoryType.INCOME)
            .map((c) => c.id),
        );
        const targetFrequency =
          activeTab === 'yearly' ? CategoryFrequency.YEARLY : CategoryFrequency.MONTHLY;
        const draftRows: DraftRow[] = txResult.value
          .filter(
            (item) =>
              !isProjectionItem(item) &&
              item.categoryId !== null &&
              incomeCatIds.has(item.categoryId) &&
              item.frequency === targetFrequency,
          )
          .map((item) => toDraftRow(item))
          .filter((r): r is DraftRow => r !== null);
        setRows(draftRows);
      } else {
        console.error('Error loading transactions:', txResult.reason);
        setRows([]);
        setError('שגיאה בטעינת ההכנסות. נסה לרענן את הדף.');
      }

      setIsLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedMonth, selectedYear, householdId, reloadKey]);

  const buildIncomeTemplateRows = useCallback(
    (currentRows: DraftRow[]): DraftRow[] => {
      const used = new Set(currentRows.map((r) => normDesc(r.description)));
      const date = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const newRows: DraftRow[] = [];
      for (const desc of INCOME_TEMPLATE_DESCRIPTIONS) {
        const key = normDesc(desc);
        if (used.has(key)) continue;
        used.add(key);
        newRows.push({
          localId: newLocalId(),
          serverId: null,
          installmentsTotal: null,
          isRecurring: false,
          recurringFrequency: null,
          recurringEndDate: null,
          description: desc,
          categoryId: null,
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
    [selectedMonth, selectedYear],
  );

  // הזרקת שורות תבניות לטבלה בשימוש ראשון (once-only via ref)
  useEffect(() => {
    if (!householdId) return;
    if (!isFirstUse) return;
    if (isLoading) return;
    if (inlineInjectedRef.current) return;

    inlineInjectedRef.current = true;
    setRows((prev) => [...prev, ...buildIncomeTemplateRows(prev)]);
  }, [householdId, isFirstUse, isLoading, buildIncomeTemplateRows]);

  const handleFillIncomeTemplates = useCallback(() => {
    const newRows = buildIncomeTemplateRows(rows);
    if (newRows.length === 0) {
      alert('כל שורות ההכנסה המוצעות כבר קיימות בטבלה.');
      return;
    }
    setSuggestedRows(newRows);
    setIsSuggestionModalOpen(true);
  }, [rows, buildIncomeTemplateRows]);

  const handleSaveSuggestedRows = useCallback(async (rowsFromModal: DraftRow[]) => {
    const validRows = rowsFromModal.filter(
      (row) => row.amount && Number(row.amount) > 0 && row.categoryId,
    );

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
          assignedMonth: row.assignedMonth ?? undefined,
          isOneTime: row.isOneTime || undefined,
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

      setRows((prev) => [...prev, ...savedRowsToAppend]);
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

  const handleRowsChange = useCallback((next: DraftRow[]) => {
    setRows(next);
  }, []);

  const handleAfterAdvancedModeSave = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  const handleAdvancedModeRequest = useCallback((localId: string) => {
    setAdvancedModeForRowId(localId);
  }, []);

  const handleAdvancedModeConfirm = useCallback(
    (result: AdvancedModeResult) => {
      if (!advancedModeForRowId) return;
      setRows((prev) =>
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
        }),
      );
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
        setRows((prev) =>
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
          ),
        );
      }
      setAddCategoryForRowId(null);
    },
    [addCategoryForRowId],
  );

  const advancedModeRow = useMemo(
    () => rows.find((r) => r.localId === advancedModeForRowId) ?? null,
    [advancedModeForRowId, rows],
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
          <TrendingUp
            className="text-accent mt-1"
            size={28}
            strokeWidth={ICON_STROKE}
          />
          <div>
            <h1 className="heading-2">הכנסות</h1>
            <p className="body-text-sm text-slate-500 leading-relaxed mt-1">
              הזן הכנסות חודשיות לפי קטגוריות: משכורת, מענק, קצבה ועוד
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

      <motion.div variants={ITEM_VARIANTS}>
        <BudgetItemTable
          rows={rows}
          categories={incomeCategories}
          householdId={householdId}
          frequency={activeTab === 'yearly' ? CategoryFrequency.YEARLY : CategoryFrequency.MONTHLY}
          monthConstraint={activeTab === 'monthly' ? selectedMonth : undefined}
          yearConstraint={selectedYear}
          isYearly={activeTab === 'yearly'}
          onChange={handleRowsChange}
          isLoading={isLoading}
          onAddCategoryRequest={handleAddCategoryRequest}
          onAdvancedModeRequest={handleAdvancedModeRequest}
          onAfterAdvancedModeSave={handleAfterAdvancedModeSave}
          showTemplatesButton={!isFirstUse && activeTab === 'monthly'}
          onFillTemplates={handleFillIncomeTemplates}
          title={activeTab === 'yearly' ? 'הכנסות שנתיות' : 'רשימת הכנסות'}
          descriptionPlaceholder="לדוגמה: משכורת"
        />
      </motion.div>

      <SuggestedRowsModal
        isOpen={isSuggestionModalOpen}
        rows={suggestedRows}
        isLoading={isSavingTemplates}
        onClose={handleCloseSuggestionModal}
        onConfirm={handleSaveSuggestedRows}
        title="הכנסות מוצעות להוספה"
        subtitle="בחרו קטגוריה והזינו סכום עבור ההכנסות הרלוונטיות. שורות ללא סכום או קטגוריה לא יתווספו."
        descriptionHeader="תיאור ההכנסה"
        showCategoryColumn
        categories={incomeCategories}
        showInstallments={false}
        showBiMonthly={false}
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
        showInstallments={false}
        showBiMonthly={false}
      />

      <CategoryFormModal
        isOpen={addCategoryForRowId !== null}
        type={CategoryType.INCOME}
        householdId={householdId}
        existingCategories={incomeCategories}
        onClose={() => setAddCategoryForRowId(null)}
        onCreated={handleCategoryCreated}
      />
    </motion.div>
  );
}
