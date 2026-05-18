import { AccountType } from '../enums';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: string;
  currency: string;
  monthlyPayment: string | null;
  interestRate: string | null;
  urgencyLevel: number;
  householdId: string;
  createdAt: string;
  updatedAt: string;
}
