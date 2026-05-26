import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import {
  CategoryFrequency,
  TransactionFrequency,
  createTransactionSchema,
} from '@gutplus/shared';
import type { Category, CreateTransactionInput } from '@gutplus/shared';
import { ICON_STROKE } from '../../constants/ui';
import { createTransaction } from '../../services/transactions.service';
import { getTemplatesForCategoryName } from '../../data/expense-templates.constants';

type AdvancedMode = 'none' | 'installments' | 'recurring';

interface DraftInputRow {
  localId: string;
  templateKey: string | null;
  date: string;
  description: string;
  amount: string;
  mode: AdvancedMode;
  installmentIndex: string;
  installmentsTotal: string;
  endDate: string;
  isBiMonthly: boolean;
  isSaving: boolean;
  errorMessage: string | null;
}

interface ExpenseInputAreaProps {
  selectedCategory: Category | null;
  householdId: string;
  defaultDate: string;
  onSaved: () => void;
}

const INPUT_CLASS =
  'w-full bg-background/60 border border-slate-200 rounded-xl px-3 py-2 text-primary placeholder:text-slate-400 focus:outline-none focus:border-accent focus:bg-surface transition-all duration-200';

const newLocalId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const makeEmptyRow = (date: string): DraftInputRow => ({
  localId: newLocalId(),
  templateKey: null,
  date,
  description: '',
  amount: '',
  mode: 'none',
  installmentIndex: '1',
  installmentsTotal: '2',
  endDate: '',
  isBiMonthly: false,
  isSaving: false,
  errorMessage: null,
});

const extractErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    return (
      (err.response?.data as { message?: string } | undefined)?.message ??
      'שגיאת רשת. נסה שוב.'
    );
  }
  if (err instanceof Error) return err.message;
  return 'שגיאה בשמירה';
};

export default function ExpenseInputArea({
  selectedCategory,
  householdId,
  defaultDate,
  onSaved,
}: ExpenseInputAreaProps) {
  const [rows, setRows] = useState<DraftInputRow[]>([]);
  const [usedTemplateKeys, setUsedTemplateKeys] = useState<Set<string>>(
    new Set(),
  );

  const templates = useMemo(
    () => (selectedCategory ? getTemplatesForCategoryName(selectedCategory.name) : []),
    [selectedCategory],
  );

  useEffect(() => {
    if (!selectedCategory) {
      setRows([]);
      setUsedTemplateKeys(new Set());
      return;
    }
    const seeded = templates.map<DraftInputRow>((tpl) => ({
      ...makeEmptyRow(defaultDate),
      templateKey: tpl.description,
      description: tpl.description,
    }));
    if (seeded.length === 0) {
      setRows([makeEmptyRow(defaultDate)]);
    } else {
      setRows(seeded);
    }
    setUsedTemplateKeys(new Set());
  }, [selectedCategory, templates, defaultDate]);

  const patchRow = useCallback(
    (localId: string, patch: Partial<DraftInputRow>) => {
      setRows((prev) =>
        prev.map((r) => (r.localId === localId ? { ...r, ...patch } : r)),
      );
    },
    [],
  );

  const removeRow = useCallback((localId: string) => {
    setRows((prev) => prev.filter((r) => r.localId !== localId));
  }, []);

  const setMode = useCallback(
    (localId: string, mode: AdvancedMode) => {
      setRows((prev) =>
        prev.map((r) => {
          if (r.localId !== localId) return r;
          return {
            ...r,
            mode,
            installmentIndex: mode === 'installments' ? r.installmentIndex : '1',
            installmentsTotal: mode === 'installments' ? r.installmentsTotal : '2',
            endDate: mode === 'recurring' ? r.endDate : '',
            isBiMonthly: mode === 'recurring' ? r.isBiMonthly : false,
          };
        }),
      );
    },
    [],
  );

  const handleAddRow = useCallback(() => {
    setRows((prev) => [...prev, makeEmptyRow(defaultDate)]);
  }, [defaultDate]);

  const buildPayload = (
    row: DraftInputRow,
    categoryId: string,
  ): CreateTransactionInput => {
    const base: CreateTransactionInput = {
      amount: row.amount.trim(),
      date: row.date,
      description: row.description.trim(),
      frequency: CategoryFrequency.MONTHLY,
      householdId,
      categoryId,
    };

    if (row.mode === 'installments') {
      return {
        ...base,
        installmentsTotal: Number(row.installmentsTotal),
        installmentIndex: Number(row.installmentIndex),
      };
    }

    if (row.mode === 'recurring') {
      return {
        ...base,
        isRecurring: true,
        recurringFrequency: row.isBiMonthly
          ? TransactionFrequency.BI_MONTHLY
          : TransactionFrequency.MONTHLY,
        ...(row.endDate ? { endDate: row.endDate } : {}),
      };
    }

    return base;
  };

  const handleSave = useCallback(
    async (localId: string) => {
      if (!selectedCategory) return;
      const current = rows.find((r) => r.localId === localId);
      if (!current) return;

      const payload = buildPayload(current, selectedCategory.id);
      const result = createTransactionSchema.safeParse(payload);
      if (!result.success) {
        const firstIssue = result.error.issues[0];
        patchRow(localId, { errorMessage: firstIssue?.message ?? 'נתונים לא תקינים' });
        return;
      }

      patchRow(localId, { isSaving: true, errorMessage: null });

      try {
        await createTransaction(result.data);
        const wasTemplate = current.templateKey;
        if (wasTemplate) {
          setUsedTemplateKeys((prev) => {
            const next = new Set(prev);
            next.add(wasTemplate);
            return next;
          });
        }
        removeRow(localId);
        onSaved();
      } catch (err) {
        patchRow(localId, {
          isSaving: false,
          errorMessage: extractErrorMessage(err),
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, selectedCategory, householdId, onSaved],
  );

  const visibleRows = useMemo(
    () =>
      rows.filter(
        (r) => !r.templateKey || !usedTemplateKeys.has(r.templateKey),
      ),
    [rows, usedTemplateKeys],
  );

  if (!selectedCategory) {
    return (
      <div className="bg-surface rounded-2xl shadow-sm border border-slate-100 p-6">
        <p className="body-text text-slate-500 text-center">
          ניתן להוסיף שורה לאחר בחירת קטגוריה
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Plus className="text-accent" size={20} strokeWidth={ICON_STROKE} />
          <h2 className="heading-3">הוספת הוצאה — {selectedCategory.name}</h2>
        </div>
      </div>

      <div className="px-4 md:px-6 py-4 space-y-3">
        <AnimatePresence initial={false}>
          {visibleRows.map((row) => (
            <motion.div
              key={row.localId}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="bg-background/40 border border-slate-100 rounded-xl p-3 md:p-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr_auto_auto] gap-3 md:items-end">
                <div>
                  <label className="label-text mb-1 block">תאריך</label>
                  <input
                    type="date"
                    value={row.date}
                    onChange={(e) =>
                      patchRow(row.localId, { date: e.target.value })
                    }
                    aria-label="תאריך"
                    className={INPUT_CLASS}
                  />
                </div>

                <div>
                  <label className="label-text mb-1 block">תיאור</label>
                  <input
                    type="text"
                    value={row.description}
                    onChange={(e) =>
                      patchRow(row.localId, { description: e.target.value })
                    }
                    placeholder="לדוגמה: חשמל"
                    aria-label="תיאור"
                    className={INPUT_CLASS}
                  />
                </div>

                <div>
                  <label className="label-text mb-1 block">סכום (₪)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={row.amount}
                    onChange={(e) =>
                      patchRow(row.localId, { amount: e.target.value })
                    }
                    placeholder="0"
                    aria-label="סכום"
                    className={INPUT_CLASS}
                  />
                </div>

                <div className="flex items-end gap-2">
                  <motion.button
                    type="button"
                    onClick={() => handleSave(row.localId)}
                    disabled={row.isSaving}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-accent text-white px-4 py-2 rounded-xl label-text shadow-sm hover:shadow-md hover:bg-accent/90 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {row.isSaving ? 'שומר…' : 'שמור'}
                  </motion.button>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeRow(row.localId)}
                    aria-label="הסר שורה"
                    className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors duration-200"
                  >
                    <Trash2 size={18} strokeWidth={ICON_STROKE} />
                  </button>
                </div>
              </div>

              <div className="mt-3" role="radiogroup" aria-label="סוג הוצאה">
                <div className="inline-flex bg-slate-100 rounded-xl p-1 gap-1">
                  {([
                    { value: 'none', label: 'ללא' },
                    { value: 'installments', label: 'תשלומים' },
                    { value: 'recurring', label: 'עסקה קבועה' },
                  ] as { value: AdvancedMode; label: string }[]).map((opt) => {
                    const isActive = row.mode === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={isActive}
                        onClick={() => setMode(row.localId, opt.value)}
                        className={`px-3 py-1.5 rounded-lg body-text-sm transition-colors duration-200 ${
                          isActive
                            ? 'bg-surface text-accent shadow-sm font-semibold'
                            : 'text-slate-500 hover:text-primary'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {row.mode === 'installments' && (
                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <span className="body-text-sm text-slate-600">תשלום</span>
                  <input
                    type="number"
                    min={1}
                    value={row.installmentIndex}
                    onChange={(e) =>
                      patchRow(row.localId, {
                        installmentIndex: e.target.value,
                      })
                    }
                    aria-label="מספר תשלום נוכחי"
                    className={`${INPUT_CLASS} w-20`}
                  />
                  <span className="body-text-sm text-slate-600">מתוך</span>
                  <input
                    type="number"
                    min={2}
                    value={row.installmentsTotal}
                    onChange={(e) =>
                      patchRow(row.localId, {
                        installmentsTotal: e.target.value,
                      })
                    }
                    aria-label="סך תשלומים"
                    className={`${INPUT_CLASS} w-20`}
                  />
                </div>
              )}

              {row.mode === 'recurring' && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
                  <div>
                    <label className="label-text mb-1 block">
                      תאריך אחרון לחזרה
                    </label>
                    <input
                      type="date"
                      value={row.endDate}
                      onChange={(e) =>
                        patchRow(row.localId, { endDate: e.target.value })
                      }
                      aria-label="תאריך אחרון לחזרה"
                      className={INPUT_CLASS}
                    />
                  </div>
                  <label className="inline-flex items-center gap-2 body-text-sm text-primary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={row.isBiMonthly}
                      onChange={(e) =>
                        patchRow(row.localId, {
                          isBiMonthly: e.target.checked,
                        })
                      }
                      className="rounded border-slate-300 text-accent focus:ring-accent"
                    />
                    עסקה דו-חודשית
                  </label>
                </div>
              )}

              {row.errorMessage && (
                <div className="mt-3 flex items-center gap-2 text-red-500">
                  <AlertCircle size={16} strokeWidth={ICON_STROKE} />
                  <p className="body-text-sm">{row.errorMessage}</p>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="pt-2">
          <motion.button
            type="button"
            onClick={handleAddRow}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-accent text-white px-4 py-2 rounded-xl label-text shadow-sm hover:shadow-md hover:bg-accent/90 transition-all duration-200 flex items-center gap-2"
          >
            <Plus size={18} strokeWidth={ICON_STROKE} />
            הוסף שורה
          </motion.button>
        </div>
      </div>
    </div>
  );
}
