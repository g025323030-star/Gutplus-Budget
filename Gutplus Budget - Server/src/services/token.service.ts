import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { AppDataSource } from '../config/data-source';
import { PasswordResetToken } from '../entities/token.entity';
import { User } from '../entities/user.entity';

export class TokenService {
  private tokenRepository: Repository<PasswordResetToken>;

  constructor() {
    this.tokenRepository = AppDataSource.getRepository(PasswordResetToken);
  }

  async createResetToken(userId: string): Promise<PasswordResetToken> {
    const tokenValue = randomBytes(32).toString('hex');

    const resetToken = this.tokenRepository.create({
      token: tokenValue,
      userId,
    });

    return await this.tokenRepository.save(resetToken);
  }

  async validateResetToken(token: string): Promise<User | null> {
    const resetToken = await this.tokenRepository.findOne({
      where: { token },
      relations: ['user'],
    });

    if (!resetToken) {
      return null;
    }

    // בדיקה אם הטוקן פג תוקף
    if (resetToken.expiresAt < new Date()) {
      // מחיקת טוקן פג תוקף
      await this.tokenRepository.remove(resetToken);
      return null;
    }

    return resetToken.user;
  }

  async deleteResetToken(token: string): Promise<void> {
    await this.tokenRepository.delete({ token });
  }
}

export const tokenService = new TokenService();
