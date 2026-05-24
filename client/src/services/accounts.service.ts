import axios from 'axios';
import { ENDPOINTS } from '@gutplus/shared';
import type { Account, AccountType } from '@gutplus/shared';

const apiUrl = (path: string): string =>
  import.meta.env.VITE_SERVER_URL + path;

export interface CreateAccountPayload {
  name: string;
  type: AccountType;
  balance?: string;
  currency?: string;
  monthlyPayment?: string | null;
  interestRate?: string | null;
  urgencyLevel: number;
  householdId: string;
}

interface RawAccount {
  id: string;
  name: string;
  type: AccountType;
  balance: string;
  currency: string;
  monthlyPayment: string | null;
  interestRate: string | null;
  urgencyLevel: number;
  household?: { id: string } | null;
  householdId?: string;
  createdAt: string;
  updatedAt: string;
}

const normalize = (raw: RawAccount): Account => ({
  id: raw.id,
  name: raw.name,
  type: raw.type,
  balance: raw.balance,
  currency: raw.currency,
  monthlyPayment: raw.monthlyPayment,
  interestRate: raw.interestRate,
  urgencyLevel: raw.urgencyLevel,
  householdId: raw.household?.id ?? raw.householdId ?? '',
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt,
});

export const createAccount = async (
  payload: CreateAccountPayload,
): Promise<Account> => {
  const res = await axios.post(apiUrl(ENDPOINTS.accounts.base), payload);
  return normalize(res.data?.data ?? res.data);
};

export const listAccounts = async (
  householdId: string,
): Promise<Account[]> => {
  const res = await axios.get(apiUrl(ENDPOINTS.accounts.base), {
    params: { householdId },
  });
  const list: RawAccount[] = res.data?.data ?? res.data ?? [];
  return list.map(normalize);
};
