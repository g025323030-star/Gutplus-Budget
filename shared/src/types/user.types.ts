export interface User {
  id: string;
  email: string;
  lastName: string;
  cycle: string | null;
  subscriptionType: string | null;
  expirationDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PublicUser = Omit<User, 'expirationDate'> & {
  expirationDate: string | null;
};
