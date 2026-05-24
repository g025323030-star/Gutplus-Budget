import axios from 'axios';
import { CategoryFrequency, ENDPOINTS } from '@gutplus/shared';
import type {
  CreateTransactionInput,
  Transaction,
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

export const getTransactions = async (
  month?: number,
  year?: number,
): Promise<Transaction[]> => {
  const params: Record<string, number> = {};
  if (month !== undefined) params.month = month;
  if (year !== undefined) params.year = year;

  const res = await axios.get(apiUrl(ENDPOINTS.transactions.base), { params });
  const list = (res.data.data as RawTransaction[]) ?? [];
  return list.map(normalizeTransaction);
};

// export const getTransactions = async (
//   month?: number,
//   year?: number,
// ): Promise<Transaction[]> => {
//   try {
//     // בניית אובייקט הפרמטרים - אקסיוס יסנן אוטומטית ערכים שהם undefined
//     const params: Record<string, number> = {};
//     if (month !== undefined) params.month = month;
//     if (year !== undefined) params.year = year;

//     // ביצוע הקריאה דרך ה-api המוגדר עם העוגיות
//     const res = await axios.get(ENDPOINTS.transactions.base, { params });
    
//     // שליפת המערך והגנה מפני ערך חסר
//     const list = (res.data?.data as RawTransaction[]) ?? [];
    
//     // נורמליזציה של הנתונים והחזרתם
//     return list.map(normalizeTransaction);

//   } catch (error) {
//     console.error("Error fetching transactions:", error);
//     // זריקת השגיאה הלאה כדי שהקומפוננטה האבא (SnapshotPage) תוכל להציג את ה-ErrorBlock
//     throw error; 
//   }
// };

export const createTransaction = async (
  input: CreateTransactionInput,
): Promise<Transaction> => {
  const res = await axios.post(apiUrl(ENDPOINTS.transactions.base), input);
  return normalizeTransaction(res.data.data as RawTransaction);
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
