import axios from 'axios';
import { CategoryFrequency, ENDPOINTS } from '@gutplus/shared';
import type {
  CreateTransactionInput,
  CreateTransactionResult,
  RecurringTransaction,
  RecurringTransactionProjection,
  Transaction,
  TransactionListItem,
  UpdateTransactionInput,
} from '@gutplus/shared';

const apiUrl = (path: string): string =>
  import.meta.env.VITE_SERVER_URL + path;

interface RawTransaction {
  id: string;
  amount: string;
  date: string;
  description: string;
  isCleared: boolean;
  frequency: CategoryFrequency;
  installmentsTotal?: number | null;
  installmentIndex?: number | null;
  installmentGroupId?: string | null;
  household?: { id: string } | null;
  category?: { id: string } | null;
  account?: { id: string } | null;
  householdId?: string;
  categoryId?: string | null;
  accountId?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface RawProjection extends Omit<RawTransaction, 'id'> {
  id: null;
  isProjection: true;
  recurringTransactionId: string;
}

type RawListItem = RawTransaction | RawProjection;

interface RawRecurringTransaction {
  id: string;
  householdId?: string;
  household?: { id: string } | null;
  categoryId?: string;
  category?: { id: string } | null;
  accountId?: string;
  account?: { id: string } | null;
  amount: number | string;
  description: string;
  dayOfMonth: number;
  frequency: RecurringTransaction['frequency'];
  startDate: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
}

const normalizeTransaction = (raw: RawTransaction): Transaction => ({
  id: raw.id,
  amount: raw.amount,
  date: raw.date,
  description: raw.description,
  isCleared: raw.isCleared,
  frequency: raw.frequency ?? CategoryFrequency.MONTHLY,
  installmentsTotal: raw.installmentsTotal ?? null,
  installmentIndex: raw.installmentIndex ?? null,
  installmentGroupId: raw.installmentGroupId ?? null,
  householdId: raw.household?.id ?? raw.householdId ?? '',
  categoryId: raw.category?.id ?? raw.categoryId ?? null,
  accountId: raw.account?.id ?? raw.accountId ?? null,
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt,
});

const normalizeProjection = (
  raw: RawProjection,
): RecurringTransactionProjection => ({
  id: null,
  isProjection: true,
  recurringTransactionId: raw.recurringTransactionId,
  amount: raw.amount,
  date: raw.date,
  description: raw.description,
  isCleared: raw.isCleared,
  frequency: raw.frequency ?? CategoryFrequency.MONTHLY,
  installmentsTotal: null,
  installmentIndex: null,
  installmentGroupId: null,
  householdId: raw.household?.id ?? raw.householdId ?? '',
  categoryId: raw.category?.id ?? raw.categoryId ?? null,
  accountId: raw.account?.id ?? raw.accountId ?? null,
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt,
});

const normalizeListItem = (raw: RawListItem): TransactionListItem => {
  if ((raw as RawProjection).isProjection === true) {
    return normalizeProjection(raw as RawProjection);
  }
  return normalizeTransaction(raw as RawTransaction);
};

const normalizeRecurring = (
  raw: RawRecurringTransaction,
): RecurringTransaction => ({
  id: raw.id,
  householdId: raw.household?.id ?? raw.householdId ?? '',
  categoryId: raw.category?.id ?? raw.categoryId ?? '',
  accountId: raw.account?.id ?? raw.accountId ?? '',
  amount: typeof raw.amount === 'string' ? Number(raw.amount) : raw.amount,
  description: raw.description,
  dayOfMonth: raw.dayOfMonth,
  frequency: raw.frequency,
  startDate: raw.startDate instanceof Date ? raw.startDate : new Date(raw.startDate),
  createdAt: raw.createdAt instanceof Date ? raw.createdAt : new Date(raw.createdAt),
  updatedAt: raw.updatedAt instanceof Date ? raw.updatedAt : new Date(raw.updatedAt),
});

export const getTransactions = async (
  month?: number,
  year?: number,
): Promise<TransactionListItem[]> => {
  const params: Record<string, number> = {};
  if (month !== undefined) params.month = month;
  if (year !== undefined) params.year = year;

  const res = await axios.get(apiUrl(ENDPOINTS.transactions.base), { params });
  const list = (res.data.data as RawListItem[]) ?? [];
  return list.map(normalizeListItem);
};

export const createTransaction = async (
  input: CreateTransactionInput,
): Promise<CreateTransactionResult> => {
  const res = await axios.post(apiUrl(ENDPOINTS.transactions.base), input);
  const payload = res.data.data as
    | { kind: 'recurring'; data: RawRecurringTransaction }
    | { kind: 'transactions'; data: RawTransaction[] };

  if (payload.kind === 'recurring') {
    return { kind: 'recurring', data: normalizeRecurring(payload.data) };
  }
  return {
    kind: 'transactions',
    data: payload.data.map(normalizeTransaction),
  };
};

export const updateTransaction = async (
  id: string,
  input: UpdateTransactionInput,
): Promise<Transaction> => {
  const res = await axios.put(
    `${apiUrl(ENDPOINTS.transactions.base)}/${id}`,
    input,
  );
  return normalizeTransaction(res.data.data as RawTransaction);
};

export const deleteTransaction = async (id: string): Promise<void> => {
  await axios.delete(`${apiUrl(ENDPOINTS.transactions.base)}/${id}`);
};
