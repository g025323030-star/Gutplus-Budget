import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Calendar, ChevronDown, TrendingDown } from 'lucide-react';
import { CategoryFrequency, CategoryType } from '@gutplus/shared';
import type { Category, TransactionListItem } from '@gutplus/shared';
import { ICON_STROKE } from '../constants/ui';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { getTransactions } from '../services/transactions.service';
import { getCategories } from '../services/categories.service';
import TransactionTable from '../components/transactions/TransactionTable';
import InstallmentsModal from '../components/transactions/InstallmentsModal';
import CategoryFormModal from '../components/transactions/CategoryFormModal';
import CategoryHelperPanel from '../components/expenses/CategoryHelperPanel';
import type { DraftRow } from '../components/transactions/types';
import { snapshotOf } from '../components/transactions/types';

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

const isProjectionItem = (
  item: TransactionListItem,
): item is Extract<TransactionListItem, { isProjection: true }> =>
  (item as { isProjection?: boolean }).isProjection === true;

const toDraftRow = (item: TransactionListItem): DraftRow | null => {
  if (isProjectionItem(item)) return null;
  const amountStr =
    typeof item.amount === 'string' ? item.amount : String(item.amount);
  const dateOnly = item.date ? item.date.slice(0, 10) : '';
  const base: DraftRow = {
    localId: newLocalId(),
    serverId: item.id,
    installmentsTotal: item.installmentsTotal ?? null,
    description: item.description,
    categoryId: item.categoryId ?? null,
    amount: amountStr,
    date: dateOnly,
    status: 'idle',
    errorMessage: null,
    lastSavedSnapshot: null,
  };
  base.lastSavedSnapshot = snapshotOf(base);
  return base;
};

export default function ExpensesPage() {
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

  const [focusedRowId, setFocusedRowId] = useState<string | null>(null);
  const [installmentsForRowId, setInstallmentsForRowId] = useState<
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

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === CategoryType.EXPENSE),
    [categories],
  );

  const mainExpenseCategories = useMemo(
    () => expenseCategories.filter((c) => c.parentCategoryId === null),
    [expenseCategories],
  );

  useEffect(() => {
    if (!householdId) return;
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      const [txResult, catsResult] = await Promise.allSettled([
        getTransactions(selectedMonth, selectedYear),
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
        const draftRows: DraftRow[] = txResult.value
          .filter(
            (item) =>
              !isProjectionItem(item) &&
              item.categoryId !== null &&
              expenseCatIds.has(item.categoryId),
          )
          .map((item) => toDraftRow(item))
          .filter((r): r is DraftRow => r !== null);
        setRows(draftRows);
      } else {
        console.error('Error loading transactions:', txResult.reason);
        setRows([]);
        setError('שגיאה בטעינת ההוצאות. נסה לרענן את הדף.');
      }

      setIsLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear, householdId, reloadKey]);

  const handleRowsChange = useCallback((next: DraftRow[]) => {
    setRows(next);
  }, []);

  const handleRowFocus = useCallback((localId: string) => {
    setFocusedRowId(localId);
  }, []);

  const handleAfterInstallmentsSave = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  const handlePickSubcategory = useCallback(
    (categoryId: string) => {
      if (!focusedRowId) return;
      setRows((prev) => {
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
      });
      setFocusedRowId((current) => {
        const idx = rows.findIndex((r) => r.localId === current);
        if (idx === -1) return current;
        const nextRow = rows[idx + 1];
        return nextRow ? nextRow.localId : current;
      });
    },
    [focusedRowId, rows],
  );

  const buildTemplateRows = useCallback(
    (subcategories: Category[]): DraftRow[] => {
      const used = new Set(rows.map((r) => normDesc(r.description)));
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
          description: sub.name.trim(),
          categoryId: sub.id,
          amount: '',
          date,
          status: 'idle',
          errorMessage: null,
          lastSavedSnapshot: null,
        });
      }
      return newRows;
    },
    [rows, selectedMonth, selectedYear],
  );

  const globalExpenseSubcategories = useMemo(
    () =>
      expenseCategories.filter(
        (c) => c.parentCategoryId !== null && c.householdId === null,
      ),
    [expenseCategories],
  );

  const handleFillCategoryTemplates = useCallback(
    (mainId: string) => {
      const subs = globalExpenseSubcategories.filter(
        (c) => c.parentCategoryId === mainId,
      );
      const newRows = buildTemplateRows(subs);
      if (newRows.length === 0) return;
      setRows((prev) => [...prev, ...newRows]);
      setFocusedRowId(newRows[0].localId);
    },
    [globalExpenseSubcategories, buildTemplateRows],
  );

  const handleFillAllTemplates = useCallback(() => {
    const newRows = buildTemplateRows(globalExpenseSubcategories);
    if (newRows.length === 0) return;
    setRows((prev) => [...prev, ...newRows]);
    setFocusedRowId(newRows[0].localId);
  }, [globalExpenseSubcategories, buildTemplateRows]);

  const handleInstallmentsRequest = useCallback((localId: string) => {
    setInstallmentsForRowId(localId);
  }, []);

  const handleInstallmentsConfirm = useCallback(
    (count: number | null) => {
      if (!installmentsForRowId) return;
      setRows((prev) =>
        prev.map((r) =>
          r.localId === installmentsForRowId
            ? {
                ...r,
                installmentsTotal: count,
                status:
                  r.status === 'idle' || r.status === 'synced'
                    ? 'dirty'
                    : r.status,
              }
            : r,
        ),
      );
      setInstallmentsForRowId(null);
    },
    [installmentsForRowId],
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

  const installmentsRow = useMemo(
    () => rows.find((r) => r.localId === installmentsForRowId) ?? null,
    [installmentsForRowId, rows],
  );

  const focusedRow = useMemo(
    () => rows.find((r) => r.localId === focusedRowId) ?? null,
    [focusedRowId, rows],
  );

  const focusedRowIndex = useMemo(
    () => (focusedRowId ? rows.findIndex((r) => r.localId === focusedRowId) : -1),
    [focusedRowId, rows],
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
              הזן הוצאות חודשיות ושנתיות. בתצוגה השנתית ניתן גם להוסיף הוצאות
              לפי חגים.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-surface p-1 rounded-xl shadow-sm border border-slate-100">
          <button
            type="button"
            disabled
            onClick={() => setActiveTab('yearly')}
            className={`px-4 py-1.5 rounded-lg label-text transition-all duration-200 ${
              activeTab === 'yearly'
                ? 'bg-accent text-white'
                : 'text-slate-400 cursor-not-allowed'
            }`}
            title="בקרוב"
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

      <motion.div
        variants={ITEM_VARIANTS}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
      >
        <div className="lg:col-span-8">
          <TransactionTable
            rows={rows}
            categories={expenseCategories}
            householdId={householdId}
            frequency={CategoryFrequency.MONTHLY}
            monthConstraint={selectedMonth}
            yearConstraint={selectedYear}
            onChange={handleRowsChange}
            isLoading={isLoading}
            focusedRowId={focusedRowId}
            onRowFocus={handleRowFocus}
            onAddCategoryRequest={handleAddCategoryRequest}
            onInstallmentsRequest={handleInstallmentsRequest}
            onAfterInstallmentsSave={handleAfterInstallmentsSave}
            onFillTemplates={handleFillAllTemplates}
            showTemplatesButton={!isFirstUse}
          />
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
            onFillCategoryTemplates={handleFillCategoryTemplates}
          />
        </div>
      </motion.div>

      <InstallmentsModal
        isOpen={installmentsForRowId !== null}
        initialCount={installmentsRow?.installmentsTotal ?? null}
        totalAmount={installmentsRow?.amount ?? ''}
        onClose={() => setInstallmentsForRowId(null)}
        onConfirm={handleInstallmentsConfirm}
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
