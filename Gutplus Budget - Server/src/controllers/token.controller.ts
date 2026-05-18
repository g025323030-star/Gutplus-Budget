import { Request, Response } from 'express';
import { tokenService } from '../services/token.service';
import { userService } from '../services/user.service';
import { hashPassword } from '../utils/password.utils';

export class TokenController {
  async createResetToken(userId: string): Promise<string> {
    const tokenRecord = await tokenService.createResetToken(userId);
    return tokenRecord.token;
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required' });
      }

      // אימות הטוקן וקבלת המשתמש
      const user = await tokenService.validateResetToken(token);
      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired token' });
      }

      // הצפנת הסיסמא החדשה
      const hashedPassword = await hashPassword(newPassword);

      // עדכון הסיסמא של המשתמש
      await userService.update(user.id, { password: hashedPassword });

      // מחיקת הטוקן לאחר השימוש
      await tokenService.deleteResetToken(token);

      res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export const tokenController = new TokenController();
