export interface CreateUserDto {
  lastName: string;
  cycle?: string;
  expirationDate?: Date;
  subscriptionType?: string;
  email: string;
  password?: string;
}

export interface UpdateUserDto {
  lastName?: string;
  cycle?: string;
  expirationDate?: Date;
  subscriptionType?: string;
  email?: string;
  password?: string;
}
