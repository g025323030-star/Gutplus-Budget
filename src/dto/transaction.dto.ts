export interface CreateTransactionDto {
  amount: string;
  date: Date;
  description: string;
  isCleared?: boolean;
  householdId: string;
  categoryId?: string;
  accountId?: string;
}

export interface UpdateTransactionDto {
  amount?: string;
  date?: Date;
  description?: string;
  isCleared?: boolean;
  categoryId?: string;
  accountId?: string;
}