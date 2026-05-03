import { AccountType } from '../entities/account.entity';

export interface CreateAccountDto {
  name: string;
  type: AccountType;
  balance?: string;
  currency?: string;
  monthlyPayment?: string;
  interestRate?: string;
  urgencyLevel: number;
  householdId: string;
}

export interface UpdateAccountDto {
  name?: string;
  type?: AccountType;
  balance?: string;
  currency?: string;
  monthlyPayment?: string;
  interestRate?: string;
  urgencyLevel?: number;
}