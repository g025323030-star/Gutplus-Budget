import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Plus, Sparkles, Trash2 } from 'lucide-react';
import { CategoryFrequency } from '@gutplus/shared';
import type { BudgetItem, HolidayExpenseTemplate } from '@gutplus/shared';
import { ICON_STROKE } from '../../constants/ui';
import {
  createBudgetItem,
  deleteBudgetItem,
  updateBudgetItem,
} from '../../services/budget-items.service';
import SaveIndicator from '../budget-items/SaveIndicator';
import type { RowStatus } from '../budget-items/SaveIndicator';
import TargetPopover from '../budget-items/TargetPopover';

const newLocalId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

interface HolidayDraftItem {
  localId: string;
  serverId: string | null;
  label: string;
  amount: string;
  targetAmount: string | null;
  isCustom: boolean;
  groupName: string;
  status: RowStatus;
  errorMessage: string | null;
  lastSaved: { label: string; amount: string; targetAmount: string | null } | null;
}

interface HolidayAccordionProps {
  template: HolidayExpenseTemplate;
  year: number;
  householdId: string;
  totalAmount: number;
  onTransactionsCreated: (transactions: BudgetItem[]) => void;
}

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

const formatTotal = (amount: number): string =>
  new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  }).format(amount);

export default function HolidayAccordion({
  template,
  householdId,
  totalAmount,
  onTransactionsCreated,
}: HolidayAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<HolidayDraftItem[]>(() =>
    template.itemGroups.flatMap((group) =>
      group.items.map((label) => ({
        localId: newLocalId(),
        serverId: null,
        label,
        amount: '',
        targetAmount: null,
        isCustom: false,
        groupName: group.groupName,
        status: 'idle' as RowStatus,
        errorMessage: null,
        lastSaved: null,
      })),
    ),
  );
  const itemsRef = useRef<HolidayDraftItem[]>(items);
  const pendingResave = useRef<Record<string, boolean>>({});
  const fadeTimers = useRef<Record<string, number>>({});

  useEffect(
    () => () => {
      Object.values(fadeTimers.current).forEach((id) => window.clearTimeout(id));
    },
    [],
  );

  const patchItem = useCallback(
    (localId: string, patch: Partial<HolidayDraftItem>) => {
      const next = itemsRef.current.map((it) =>
        it.localId === localId ? { ...it, ...patch } : it,
      );
      itemsRef.current = next;
      setItems(next);
    },
    [],
  );

  const handleFieldChange = useCallback(
    (localId: string, patch: Partial<HolidayDraftItem>) => {
      const current = itemsRef.current.find((it) => it.localId === localId);
      const status =
        current?.status === 'saving' ? 'saving' : 'dirty';
      patchItem(localId, { ...patch, status, errorMessage: null });
    },
    [patchItem],
  );

  const removeItem = useCallback(
    async (localId: string) => {
      const current = itemsRef.current.find((it) => it.localId === localId);
      if (!current) return;

      if (!current.serverId) {
        const next = itemsRef.current.filter((it) => it.localId !== localId);
        itemsRef.current = next;
        setItems(next);
        return;
      }

      try {
        await deleteBudgetItem(current.serverId);
        const next = itemsRef.current.filter((it) => it.localId !== localId);
        itemsRef.current = next;
        setItems(next);
        onTransactionsCreated([]);
      } catch (err) {
        patchItem(localId, {
          status: 'error',
          errorMessage: extractErrorMessage(err),
        });
      }
    },
    [onTransactionsCreated, patchItem],
  );

  const addCustomItem = useCallback((groupName: string) => {
    const next = [
      ...itemsRef.current,
      {
        localId: newLocalId(),
        serverId: null,
        label: '',
        amount: '',
        targetAmount: null,
        isCustom: true,
        groupName,
        status: 'idle' as RowStatus,
        errorMessage: null,
        lastSaved: null,
      },
    ];
    itemsRef.current = next;
    setItems(next);
  }, []);

  const scheduleSyncedFade = useCallback(
    (localId: string) => {
      if (fadeTimers.current[localId]) {
        window.clearTimeout(fadeTimers.current[localId]);
      }
      fadeTimers.current[localId] = window.setTimeout(() => {
        const target = itemsRef.current.find((it) => it.localId === localId);
        if (target && target.status === 'synced') {
          patchItem(localId, { status: 'idle' });
        }
        delete fadeTimers.current[localId];
      }, 1500);
    },
    [patchItem],
  );

  const persistItem = useCallback(
    async (localId: string): Promise<void> => {
      const current = itemsRef.current.find((it) => it.localId === localId);
      if (!current) return;

      if (current.status === 'saving') {
        pendingResave.current[localId] = true;
        return;
      }

      const label = current.label.trim();
      const amountNum = Number(current.amount);
      const isValid =
        label.length > 0 && Number.isFinite(amountNum) && amountNum > 0;
      if (!isValid) return;

      if (
        current.lastSaved &&
        current.lastSaved.label === label &&
        current.lastSaved.amount === current.amount &&
        current.lastSaved.targetAmount === current.targetAmount
      ) {
        return;
      }

      patchItem(localId, { status: 'saving', errorMessage: null });

      try {
        let saved: BudgetItem;
        if (current.serverId) {
          saved = await updateBudgetItem(current.serverId, {
            amount: current.amount,
            description: label,
            targetAmount: current.targetAmount ?? undefined,
          });
        } else {
          const created = await createBudgetItem({
            amount: current.amount,
            // Holiday items are placed in the right month by the Hebrew calendar
            // on the server (via the holiday field) — no calendar date needed.
            holiday: template.holiday,
            description: label,
            frequency: CategoryFrequency.YEARLY,
            householdId,
            targetAmount: current.targetAmount ?? undefined,
          });
          if (created.kind !== 'budgetItems' || created.data.length === 0) {
            throw new Error('יצירת הפריט נכשלה');
          }
          saved = created.data[0];
        }

        patchItem(localId, {
          status: 'synced',
          serverId: saved.id,
          lastSaved: { label, amount: current.amount, targetAmount: current.targetAmount },
          errorMessage: null,
        });
        scheduleSyncedFade(localId);
        onTransactionsCreated([saved]);

        if (pendingResave.current[localId]) {
          pendingResave.current[localId] = false;
          await persistItem(localId);
        }
      } catch (err) {
        patchItem(localId, {
          status: 'error',
          errorMessage: extractErrorMessage(err),
        });
      }
    },
    [householdId, template.holiday, patchItem, scheduleSyncedFade, onTransactionsCreated],
  );

  const handleRowBlur = useCallback(
    (localId: string) => (e: React.FocusEvent<HTMLLIElement>) => {
      const nextFocus = e.relatedTarget as Node | null;
      if (nextFocus && e.currentTarget.contains(nextFocus)) return;
      persistItem(localId);
    },
    [persistItem],
  );

  const groupedItems = (() => {
    const order: string[] = [];
    const buckets = new Map<string, HolidayDraftItem[]>();
    items.forEach((item) => {
      if (!buckets.has(item.groupName)) {
        buckets.set(item.groupName, []);
        order.push(item.groupName);
      }
      buckets.get(item.groupName)!.push(item);
    });
    return order.map((groupName) => ({
      groupName,
      items: buckets.get(groupName)!,
    }));
  })();

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
        <div className="flex items-center gap-3">
          <span className="body-text-sm text-slate-500">
            {formatTotal(totalAmount)}
          </span>
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.25 }}
            className="text-slate-400"
          >
            <ChevronDown size={20} strokeWidth={ICON_STROKE} />
          </motion.span>
        </div>
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
              <div className="space-y-5">
                {groupedItems.map(({ groupName, items: groupItems }) => (
                  <div key={groupName || '__ungrouped__'} className="space-y-2">
                    {groupName && (
                      <div className="bg-slate-100 text-slate-500 label-text px-3 py-2 rounded-lg select-none">
                        {groupName}
                      </div>
                    )}
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {groupItems.map((item) => (
                        <li
                          key={item.localId}
                          onBlur={handleRowBlur(item.localId)}
                          className="grid grid-cols-[1fr_120px_auto] items-center gap-3 bg-background/50 rounded-xl px-3 py-2"
                        >
                          {item.isCustom ? (
                            <input
                              type="text"
                              value={item.label}
                              onChange={(e) =>
                                handleFieldChange(item.localId, {
                                  label: e.target.value,
                                })
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
                              handleFieldChange(item.localId, {
                                amount: e.target.value,
                              })
                            }
                            placeholder="₪"
                            aria-label="סכום"
                            className={INPUT_CLASS}
                          />
                          <div className="flex items-center gap-1">
                            <TargetPopover
                              targetAmount={item.targetAmount}
                              onSave={(value) => {
                                handleFieldChange(item.localId, { targetAmount: value });
                                // The popover unmounts itself on save, so save eagerly here
                                // rather than relying on the row's onBlur to fire reliably.
                                persistItem(item.localId);
                              }}
                            />
                            <SaveIndicator
                              status={item.status}
                              errorMessage={item.errorMessage}
                              onRetry={() => persistItem(item.localId)}
                            />
                            {item.isCustom && (
                              <button
                                type="button"
                                onClick={() => removeItem(item.localId)}
                                aria-label="מחיקת פריט מותאם"
                                className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors duration-200"
                              >
                                <Trash2 size={16} strokeWidth={ICON_STROKE} />
                              </button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      onClick={() => addCustomItem(groupName)}
                      className="text-accent hover:text-accent/80 label-text flex items-center gap-1 transition-colors duration-200"
                    >
                      <Plus size={16} strokeWidth={ICON_STROKE} />
                      הוסף פריט מותאם
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
