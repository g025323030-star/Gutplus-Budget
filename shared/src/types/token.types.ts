export interface PasswordResetToken {
  id: string;
  token: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
}
