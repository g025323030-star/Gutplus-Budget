import { useCallback, useMemo, useState } from 'react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { CategoryFrequency, Holiday } from '@gutplus/shared';
import type {
  Category,
  HolidayExpenseTemplate,
  Transaction,
} from '@gutplus/shared';
import { ICON_STROKE } from '../../constants/ui';
import { createTransaction } from '../../services/transactions.service';

const HOLIDAY_DEFAULT_MMDD: Record<Holiday, [number, number]> = {
  [Holiday.PASSOVER]: [4, 15],
  [Holiday.ROSH_HASHANA]: [9, 15],
  [Holiday.YOM_KIPPUR]: [9, 25],
  [Holiday.SUKKOT]: [9, 30],
  [Holiday.HANUKKAH]: [12, 15],
  [Holiday.PURIM]: [3, 10],
  [Holiday.SHAVUOT]: [6, 5],
  [Holiday.YOM_HAATZMAUT]: [5, 1],
};

const padTwo = (n: number): string => String(n).padStart(2, '0');

const buildDefaultDate = (template: HolidayExpenseTemplate, year: number) => {
  const [m, d] = HOLIDAY_DEFAULT_MMDD[template.holiday];
  return `${year}-${padTwo(m)}-${padTwo(d)}`;
};

const newLocalId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

interface HolidayDraftItem {
  localId: string;
  label: string;
  amount: string;
  selected: boolean;
  isCustom: boolean;
}

interface HolidayAccordionProps {
  template: HolidayExpenseTemplate;
  year: number;
  categories: Category[];
  householdId: string;
  onTransactionsCreated: (transactions: Transaction[]) => void;
}

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

const INPUT_CLASS =
  'w-full bg-background/60 border border-slate-200 rounded-xl px-3 py-2 text-primary placeholder:text-slate-400 focus:outline-none focus:border-accent focus:bg-surface transition-all duration-200';

const extractErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    return (
      (err.response?.data as { message?: string } | undefined)?.message ??
      'שגיאת רשת'
    );
  }
  if (err instanceof Error) return err.message;
  return 'שגיאה';
};

export default function HolidayAccordion({
  template,
  year,
  categories,
  householdId,
  onTransactionsCreated,
}: HolidayAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [categoryId, setCategoryId] = useState<string>('');
  const [targetDate, setTargetDate] = useState<string>(() =>
    buildDefaultDate(template, year),
  );
  const [items, setItems] = useState<HolidayDraftItem[]>(() =>
    template.defaultItems.map((label) => ({
      localId: newLocalId(),
      label,
      amount: '',
      selected: false,
      isCustom: false,
    })),
  );
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number>(0);

  const dateBounds = useMemo(
    () => ({
      min: `${year}-01-01`,
      max: `${year}-12-31`,
    }),
    [year],
  );

  const patchItem = useCallback(
    (localId: string, patch: Partial<HolidayDraftItem>) => {
      setItems((prev) =>
        prev.map((it) => (it.localId === localId ? { ...it, ...patch } : it)),
      );
    },
    [],
  );

  const removeItem = useCallback((localId: string) => {
    setItems((prev) => prev.filter((it) => it.localId !== localId));
  }, []);

  const addCustomItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      {
        localId: newLocalId(),
        label: '',
        amount: '',
        selected: true,
        isCustom: true,
      },
    ]);
  }, []);

  const selectedItems = items.filter((it) => it.selected);

  const canSave =
    categoryId !== '' &&
    targetDate !== '' &&
    selectedItems.length > 0 &&
    selectedItems.every((it) => {
      const amount = Number(it.amount);
      return (
        it.label.trim().length > 0 && Number.isFinite(amount) && amount > 0
      );
    });

  const handleSave = useCallback(async () => {
    if (!canSave) return;
    setStatus('saving');
    setErrorMessage(null);

    const targets = items
      .map((it, idx) => ({ it, idx }))
      .filter(({ it }) => it.selected);

    const results = await Promise.allSettled(
      targets.map(({ it }) =>
        createTransaction({
          amount: it.amount,
          date: targetDate,
          description: it.label.trim(),
          frequency: CategoryFrequency.YEARLY,
          householdId,
          categoryId,
        }),
      ),
    );

    const succeededTransactions: Transaction[] = [];
    const failedLocalIds = new Set<string>();
    const failureMessages: string[] = [];

    results.forEach((res, i) => {
      const localId = targets[i].it.localId;
      if (res.status === 'fulfilled') {
        succeededTransactions.push(res.value);
      } else {
        failedLocalIds.add(localId);
        failureMessages.push(extractErrorMessage(res.reason));
      }
    });

    if (succeededTransactions.length > 0) {
      onTransactionsCreated(succeededTransactions);
    }

    setItems((prev) =>
      prev.map((it) => {
        if (!it.selected) return it;
        if (failedLocalIds.has(it.localId)) return it;
        return { ...it, selected: false, amount: '' };
      }),
    );

    if (failedLocalIds.size === 0) {
      setSuccessCount(succeededTransactions.length);
      setStatus('success');
      window.setTimeout(() => setStatus('idle'), 2200);
    } else {
      setStatus('error');
      setErrorMessage(
        `נשמרו ${succeededTransactions.length} מתוך ${targets.length}. ${failureMessages[0] ?? ''}`,
      );
    }
  }, [canSave, items, categoryId, targetDate, householdId, onTransactionsCreated]);

  const headerLabel = template.displayName;

  return (
    <div
      className={`relative bg-surface rounded-2xl border border-slate-100 overflow-hidden transition-shadow duration-200 ${
        isOpen ? 'shadow-md' : 'shadow-sm hover:shadow-md'
      }`}
    >
      {isOpen && (
        <span
          aria-hidden
          className="absolute right-0 top-0 h-full w-1 bg-accent rounded-r-2xl"
        />
      )}

      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between px-5 py-4 text-right hover:bg-slate-50/60 transition-colors duration-200"
      >
        <div className="flex items-center gap-3">
          <Sparkles
            className={isOpen ? 'text-accent' : 'text-slate-400'}
            size={20}
            strokeWidth={ICON_STROKE}
          />
          <span className="heading-3">{headerLabel}</span>
        </div>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="text-slate-400"
        >
          <ChevronDown size={20} strokeWidth={ICON_STROKE} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label-text mb-1 block">
                    קטגוריה לכל פריטי החג
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className={`${INPUT_CLASS} cursor-pointer appearance-none`}
                  >
                    <option value="">בחר קטגוריה</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-text mb-1 block">תאריך</label>
                  <input
                    type="date"
                    value={targetDate}
                    min={dateBounds.min}
                    max={dateBounds.max}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              <ul className="space-y-2">
                {items.map((item) => (
                  <li
                    key={item.localId}
                    className="grid grid-cols-[auto_1fr_120px_auto] items-center gap-3 bg-background/50 rounded-xl px-3 py-2"
                  >
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={(e) =>
                        patchItem(item.localId, { selected: e.target.checked })
                      }
                      aria-label={`רלוונטי — ${item.label || 'פריט'}`}
                      className="w-4 h-4 accent-accent cursor-pointer"
                    />
                    {item.isCustom ? (
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) =>
                          patchItem(item.localId, { label: e.target.value })
                        }
                        placeholder="שם הפריט"
                        className={INPUT_CLASS}
                      />
                    ) : (
                      <span className="body-text">{item.label}</span>
                    )}
                    <input
                      type="text"
                      inputMode="decimal"
                      value={item.amount}
                      onChange={(e) =>
                        patchItem(item.localId, { amount: e.target.value })
                      }
                      placeholder="₪"
                      aria-label="סכום"
                      className={INPUT_CLASS}
                    />
                    {item.isCustom ? (
                      <button
                        type="button"
                        onClick={() => removeItem(item.localId)}
                        aria-label="מחיקת פריט מותאם"
                        className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors duration-200"
                      >
                        <Trash2 size={16} strokeWidth={ICON_STROKE} />
                      </button>
                    ) : (
                      <span aria-hidden className="w-8" />
                    )}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={addCustomItem}
                className="text-accent hover:text-accent/80 label-text flex items-center gap-1 transition-colors duration-200"
              >
                <Plus size={16} strokeWidth={ICON_STROKE} />
                הוסף פריט מותאם
              </button>

              <AnimatePresence>
                {status === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="bg-green-50 border border-green-100 rounded-xl px-4 py-2.5 flex items-center gap-2"
                  >
                    <CheckCircle2
                      className="text-green-500"
                      size={18}
                      strokeWidth={ICON_STROKE}
                    />
                    <p className="body-text-sm text-green-700">
                      {successCount} פריטים נשמרו בהצלחה
                    </p>
                  </motion.div>
                )}
                {status === 'error' && errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 flex items-center gap-2"
                  >
                    <AlertTriangle
                      className="text-red-500"
                      size={18}
                      strokeWidth={ICON_STROKE}
                    />
                    <p className="body-text-sm text-red-700">{errorMessage}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-end">
                <motion.button
                  type="button"
                  onClick={handleSave}
                  disabled={!canSave || status === 'saving'}
                  whileHover={
                    !canSave || status === 'saving'
                      ? undefined
                      : { scale: 1.02 }
                  }
                  whileTap={
                    !canSave || status === 'saving'
                      ? undefined
                      : { scale: 0.98 }
                  }
                  className="bg-accent text-white px-5 py-2.5 rounded-xl label-text shadow-sm hover:shadow-md hover:bg-accent/90 disabled:bg-slate-300 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 flex items-center gap-2"
                >
                  {status === 'saving' && (
                    <Loader2
                      className="animate-spin"
                      size={16}
                      strokeWidth={ICON_STROKE}
                    />
                  )}
                  שמור פריטים נבחרים
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
